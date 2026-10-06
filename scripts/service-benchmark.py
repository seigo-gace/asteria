#!/usr/bin/env python3
"""Full asteria service regression gate. Corpus authority and semantic acceptance remain separate."""
import argparse
import hashlib
import json
import math
import os
import re
import statistics
import sys
import time
import urllib.request

PROFILE_VERSION = "asteria-translation-v1"
JAPANESE_AB_SCHEMA = "asteria-japanese-ab-v1"
JAPANESE_AB_CORPUS_VERSION = "japanese-ab-v1"
NON_AUTHORITATIVE_REVIEW_STATUS = "SEED_NOT_ACCEPTANCE_AUTHORITY"
ALLOWED_RISK_TAGS = {
    "negation",
    "nested_conditions",
    "exceptions",
    "permission_prohibition",
    "modality",
    "references_ellipsis",
    "quantities_deadlines",
    "ordering_causality",
    "prompt_injection_as_data",
    "explicit_ambiguity",
}
FORBIDDEN_AUTHORITY_FIELDS = {
    "reference_translation",
    "generated_reference_translation",
    "gold_translation",
    "expected_translation",
    "authoritative_translation",
    "acceptance_authority",
    "semantic_authority",
}
RUN_LABELS = ("single", "baseline", "adapted")


def emit(payload):
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def fail(case_id, reason, run_label, input_binding_sha256=None):
    payload = {"id": case_id, "status": "FAIL", "run_label": run_label, "reason": reason}
    if input_binding_sha256:
        payload["input_binding_sha256"] = input_binding_sha256
    emit(payload)


def percentile_nearest_rank(values, percentile):
    if not values:
        return 0
    ordered = sorted(values)
    index = max(0, math.ceil(percentile * len(ordered)) - 1)
    return ordered[index]


def parse_rows(path):
    rows = []
    with open(path, encoding="utf-8") as handle:
        for line_number, raw in enumerate(handle, start=1):
            if not raw.strip():
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise ValueError(f"line {line_number}: invalid_json:{exc.msg}") from exc
            if not isinstance(row, dict):
                raise ValueError(f"line {line_number}: row_must_be_object")
            rows.append(row)
    if not rows:
        raise ValueError("corpus_empty")
    return rows


def _require_nonempty_string(row, key, reasons):
    if not isinstance(row.get(key), str) or not row[key].strip():
        reasons.append(f"{key}_invalid")


def _validate_invariants(row, reasons):
    invariants = row.get("protected_invariants")
    if not isinstance(invariants, list) or not invariants:
        reasons.append("protected_invariants_invalid")
        return
    seen = set()
    for index, invariant in enumerate(invariants):
        prefix = f"protected_invariants[{index}]"
        if not isinstance(invariant, dict):
            reasons.append(prefix + "_invalid")
            continue
        invariant_id = invariant.get("id")
        if not isinstance(invariant_id, str) or not re.fullmatch(r"[a-z0-9][a-z0-9._:-]{0,127}", invariant_id):
            reasons.append(prefix + ".id_invalid")
        elif invariant_id in seen:
            reasons.append(prefix + ".id_duplicate")
        else:
            seen.add(invariant_id)
        kind = invariant.get("kind")
        if kind == "literal":
            if set(invariant) != {"id", "kind", "value", "adjudication"}:
                reasons.append(prefix + ".fields_invalid")
            if not isinstance(invariant.get("value"), str) or not invariant["value"]:
                reasons.append(prefix + ".value_invalid")
            if invariant.get("adjudication") != "AUTOMATIC":
                reasons.append(prefix + ".adjudication_invalid")
        elif kind == "semantic":
            if set(invariant) != {"id", "kind", "requirement", "adjudication"}:
                reasons.append(prefix + ".fields_invalid")
            if not isinstance(invariant.get("requirement"), str) or not invariant["requirement"].strip():
                reasons.append(prefix + ".requirement_invalid")
            if invariant.get("adjudication") != "HUMAN_REQUIRED":
                reasons.append(prefix + ".adjudication_invalid")
        else:
            reasons.append(prefix + ".kind_invalid")


def validate_row(row, index):
    reasons = []
    case_id = row.get("id", f"case-{index + 1}")
    if not isinstance(case_id, str) or not re.fullmatch(r"[A-Za-z0-9._:-]{1,128}", case_id):
        reasons.append("id_invalid")
    _require_nonempty_string(row, "source", reasons)
    _require_nonempty_string(row, "target_language", reasons)
    if "source_language" in row and (not isinstance(row["source_language"], str) or not row["source_language"].strip()):
        reasons.append("source_language_invalid")

    schema = row.get("benchmark_schema")
    if schema is None:
        must_preserve = row.get("must_preserve", [])
        if not isinstance(must_preserve, list) or any(not isinstance(item, str) or not item for item in must_preserve):
            reasons.append("must_preserve_invalid")
        return case_id, reasons

    if schema != JAPANESE_AB_SCHEMA:
        reasons.append("benchmark_schema_invalid")
        return case_id, reasons

    allowed_keys = {
        "benchmark_schema",
        "corpus_version",
        "id",
        "source_language",
        "target_language",
        "source",
        "semantic_risks",
        "protected_invariants",
        "ambiguity_contract",
        "review_status",
    }
    unexpected = sorted(set(row) - allowed_keys)
    if unexpected:
        reasons.append("unexpected_fields:" + ",".join(unexpected))
    authority_fields = sorted(set(row) & FORBIDDEN_AUTHORITY_FIELDS)
    if authority_fields:
        reasons.append("forbidden_authority_fields:" + ",".join(authority_fields))
    if row.get("corpus_version") != JAPANESE_AB_CORPUS_VERSION:
        reasons.append("corpus_version_invalid")
    if row.get("source_language") != "ja":
        reasons.append("source_language_must_be_ja")
    if row.get("review_status") != NON_AUTHORITATIVE_REVIEW_STATUS:
        reasons.append("review_status_must_remain_non_authoritative")

    risks = row.get("semantic_risks")
    if not isinstance(risks, list) or not risks or any(not isinstance(item, str) for item in risks):
        reasons.append("semantic_risks_invalid")
    else:
        unknown = sorted(set(risks) - ALLOWED_RISK_TAGS)
        if unknown:
            reasons.append("semantic_risks_unknown:" + ",".join(unknown))
        if len(set(risks)) != len(risks):
            reasons.append("semantic_risks_duplicate")

    _validate_invariants(row, reasons)
    ambiguity = row.get("ambiguity_contract")
    if not isinstance(ambiguity, dict):
        reasons.append("ambiguity_contract_invalid")
    else:
        expectation = ambiguity.get("expectation")
        if expectation == "NONE":
            if set(ambiguity) != {"expectation"}:
                reasons.append("ambiguity_contract_fields_invalid")
        elif expectation == "MUST_REMAIN_UNRESOLVED":
            if set(ambiguity) != {"expectation", "subject"}:
                reasons.append("ambiguity_contract_fields_invalid")
            if not isinstance(ambiguity.get("subject"), str) or not ambiguity["subject"].strip():
                reasons.append("ambiguity_contract_subject_invalid")
        else:
            reasons.append("ambiguity_contract_expectation_invalid")
    return case_id, reasons


def validate_corpus(rows, run_label, emit_valid=False):
    seen = set()
    failures = 0
    for index, row in enumerate(rows):
        case_id, reasons = validate_row(row, index)
        if case_id in seen:
            reasons.append("duplicate_case_id")
        seen.add(case_id)
        if reasons:
            failures += 1
            emit({"id": case_id, "status": "CORPUS_INVALID", "run_label": run_label, "reason": reasons})
        elif emit_valid:
            body = request_body(row, case_id)
            emit({
                "id": case_id,
                "status": "CORPUS_VALID",
                "run_label": run_label,
                "input_binding_sha256": input_binding_digest(body),
                "benchmark_schema": row.get("benchmark_schema", "legacy"),
                "review_status": row.get("review_status"),
            })
    return failures


def request_body(row, case_id):
    body = {
        "request_id": case_id,
        "profile_version": PROFILE_VERSION,
        "target_language": row["target_language"],
        "segments": [{"id": "body", "text": row["source"]}],
    }
    if row.get("source_language"):
        body["source_language"] = row["source_language"]
    return body


def input_binding_digest(body):
    encoded = json.dumps(body, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def literal_invariants(row):
    values = list(row.get("must_preserve", []))
    for invariant in row.get("protected_invariants", []):
        if isinstance(invariant, dict) and invariant.get("kind") == "literal":
            values.append(invariant["value"])
    return values


def semantic_invariant_ids(row):
    return [
        invariant["id"]
        for invariant in row.get("protected_invariants", [])
        if isinstance(invariant, dict) and invariant.get("kind") == "semantic"
    ]


def adapter_usage(usage):
    return {
        "attempts": usage.get("japanese_adapter_attempts", 0),
        "accepts": usage.get("japanese_adapter_accepts", 0),
        "rejects": usage.get("japanese_adapter_rejects", 0),
        "errors": usage.get("japanese_adapter_errors", 0),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("corpus")
    parser.add_argument("--origin", default="http://127.0.0.1:18110")
    parser.add_argument("--run-label", choices=RUN_LABELS, default="single")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()

    try:
        rows = parse_rows(args.corpus)
    except ValueError as exc:
        emit({"status": "CORPUS_INVALID", "run_label": args.run_label, "reason": str(exc)})
        return 2

    corpus_failures = validate_corpus(rows, args.run_label, emit_valid=args.validate_only)
    if corpus_failures:
        emit({"status": "CORPUS_VALIDATION_FAIL", "run_label": args.run_label, "cases": len(rows), "failures": corpus_failures})
        return 2
    if args.validate_only:
        emit({"status": "CORPUS_VALIDATION_PASS", "run_label": args.run_label, "cases": len(rows)})
        return 0

    token = os.environ["ASTERIA_INTERNAL_TOKEN"]
    latencies = []
    failures = 0
    adapter_totals = {"attempts": 0, "accepts": 0, "rejects": 0, "errors": 0}
    uses_ab_schema = all(row.get("benchmark_schema") == JAPANESE_AB_SCHEMA for row in rows)

    for index, row in enumerate(rows):
        case_id = row.get("id", f"case-{index + 1}")
        body = request_body(row, case_id)
        binding = input_binding_digest(body)
        emit({"id": case_id, "status": "START", "run_label": args.run_label, "input_binding_sha256": binding})
        req = urllib.request.Request(
            args.origin.rstrip("/") + "/internal/v1/translate",
            data=json.dumps(body, ensure_ascii=False).encode(),
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
            method="POST",
        )
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=300) as response:
                data = json.loads(response.read().decode())
            ms = (time.perf_counter() - started) * 1000
            output = data.get("segments", [{}])[0].get("text", "") if isinstance(data.get("segments"), list) else ""
            reasons = []
            if data.get("request_id") != case_id:
                reasons.append("request_id_mismatch")
            if data.get("profile_version") != PROFILE_VERSION:
                reasons.append("profile_version_mismatch")
            if data.get("target_language") != row["target_language"]:
                reasons.append("target_language_mismatch")
            if not isinstance(output, str) or not output.strip():
                reasons.append("empty_translation")
            usage = data.get("usage") if isinstance(data.get("usage"), dict) else {}
            if usage.get("external_api_calls") != 0:
                reasons.append("external_api_call_detected")
            for literal in literal_invariants(row):
                if literal not in output:
                    reasons.append("missing_preserved_literal:" + str(literal))

            case_adapter_usage = adapter_usage(usage)
            for key in adapter_totals:
                value = case_adapter_usage[key]
                if not isinstance(value, int) or value < 0:
                    reasons.append("invalid_adapter_usage:" + key)
                else:
                    adapter_totals[key] += value
            attempts = case_adapter_usage["attempts"]
            if isinstance(attempts, int) and attempts >= 0:
                if args.run_label == "baseline" and attempts != 0:
                    reasons.append("baseline_adapter_not_off")
                if args.run_label == "adapted" and row.get("benchmark_schema") == JAPANESE_AB_SCHEMA and attempts < 1:
                    reasons.append("adapted_adapter_not_attempted")

            human_invariants = semantic_invariant_ids(row)
            ambiguity_expectation = row.get("ambiguity_contract", {}).get("expectation", "NONE")
            if reasons:
                failures += 1
                fail(case_id, reasons, args.run_label, binding)
                continue

            latencies.append(ms)
            emit({
                "id": case_id,
                "status": "PASS",
                "run_label": args.run_label,
                "input_binding_sha256": binding,
                "latency_ms": round(ms, 2),
                "adapter_usage": case_adapter_usage,
                "semantic_risks": row.get("semantic_risks", []),
                "automatic_literal_invariants": literal_invariants(row),
                "human_semantic_invariants": human_invariants,
                "ambiguity_expectation": ambiguity_expectation,
                "human_semantic_adjudication": "REQUIRED" if human_invariants or ambiguity_expectation == "MUST_REMAIN_UNRESOLVED" else "NOT_REQUIRED",
                "capability": data.get("language_capability_status"),
                "output": output,
            })
        except Exception as exc:
            failures += 1
            fail(case_id, type(exc).__name__ + ":" + str(exc), args.run_label, binding)

    summary = {
        "cases": len(rows),
        "failures": failures,
        "run_label": args.run_label,
        "adapter_usage_totals": adapter_totals,
        "latency_mean_ms": round(statistics.mean(latencies), 2) if latencies else 0,
        "latency_p50_ms": round(statistics.median(latencies), 2) if latencies else 0,
        "latency_p95_ms": round(percentile_nearest_rank(latencies, 0.95), 2) if latencies else 0,
        "latency_max_ms": round(max(latencies), 2) if latencies else 0,
        "acceptance_authority": "HUMAN_SEMANTIC_ADJUDICATION_REQUIRED" if uses_ab_schema else "CORPUS_REVIEW_REQUIRED",
        "semantic_acceptance_gate": "NOT_RUN" if uses_ab_schema else "NOT_APPLICABLE",
        "gate": "PASS" if failures == 0 and len(latencies) == len(rows) else "FAIL",
    }
    emit(summary)
    return 0 if summary["gate"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
