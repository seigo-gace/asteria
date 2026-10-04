#!/usr/bin/env python3
"""Full AsteriaAI service regression gate. Corpus authority must be reviewed separately."""
import argparse, json, os, statistics, sys, time, urllib.request


def fail(case_id, reason):
    print(json.dumps({"id": case_id, "status": "FAIL", "reason": reason}, ensure_ascii=False))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("corpus")
    p.add_argument("--origin", default="http://127.0.0.1:18110")
    a = p.parse_args()
    token = os.environ["ASTERIA_INTERNAL_TOKEN"]
    rows = [json.loads(x) for x in open(a.corpus, encoding="utf-8") if x.strip()]
    lat = []
    failures = 0

    for i, row in enumerate(rows):
        case_id = row.get("id", f"case-{i+1}")
        body = {
            "request_id": case_id,
            "profile_version": "asteria-translation-v1",
            "target_language": row["target_language"],
            "segments": [{"id": "body", "text": row["source"]}],
        }
        if row.get("source_language"):
            body["source_language"] = row["source_language"]
        req = urllib.request.Request(
            a.origin.rstrip("/") + "/internal/v1/translate",
            data=json.dumps(body, ensure_ascii=False).encode(),
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
            method="POST",
        )
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.loads(r.read().decode())
            ms = (time.perf_counter() - started) * 1000
            output = data.get("segments", [{}])[0].get("text", "") if isinstance(data.get("segments"), list) else ""
            reasons = []
            if data.get("request_id") != case_id:
                reasons.append("request_id_mismatch")
            if data.get("profile_version") != "asteria-translation-v1":
                reasons.append("profile_version_mismatch")
            if data.get("target_language") != row["target_language"]:
                reasons.append("target_language_mismatch")
            if not isinstance(output, str) or not output.strip():
                reasons.append("empty_translation")
            usage = data.get("usage") if isinstance(data.get("usage"), dict) else {}
            if usage.get("external_api_calls") != 0:
                reasons.append("external_api_call_detected")
            for literal in row.get("must_preserve", []):
                if literal not in output:
                    reasons.append("missing_preserved_literal:" + str(literal))
            if reasons:
                failures += 1
                fail(case_id, reasons)
                continue
            lat.append(ms)
            print(json.dumps({"id": case_id, "status": "PASS", "latency_ms": round(ms, 2), "capability": data.get("language_capability_status"), "output": output}, ensure_ascii=False))
        except Exception as e:
            failures += 1
            fail(case_id, type(e).__name__ + ":" + str(e))

    summary = {
        "cases": len(rows),
        "failures": failures,
        "latency_mean_ms": round(statistics.mean(lat), 2) if lat else 0,
        "latency_p50_ms": round(statistics.median(lat), 2) if lat else 0,
        "acceptance_authority": "CORPUS_REVIEW_REQUIRED",
        "gate": "PASS" if failures == 0 and len(lat) == len(rows) else "FAIL",
    }
    print(json.dumps(summary, ensure_ascii=False))
    return 0 if summary["gate"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
