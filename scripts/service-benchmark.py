#!/usr/bin/env python3
"""Full AsteriaAI service benchmark. Corpus authority must be reviewed separately."""
import argparse, json, os, statistics, time, urllib.request

def main():
    p=argparse.ArgumentParser(); p.add_argument("corpus"); p.add_argument("--origin",default="http://127.0.0.1:18110"); a=p.parse_args(); token=os.environ["ASTERIA_INTERNAL_TOKEN"]
    rows=[json.loads(x) for x in open(a.corpus,encoding="utf-8") if x.strip()]; lat=[]; failures=0
    for i,row in enumerate(rows):
        body={"request_id":row.get("id",f"case-{i+1}"),"profile_version":"asteria-translation-v1","target_language":row["target_language"],"segments":[{"id":"body","text":row["source"]}]}
        if row.get("source_language"): body["source_language"]=row["source_language"]
        req=urllib.request.Request(a.origin.rstrip("/")+"/internal/v1/translate",data=json.dumps(body,ensure_ascii=False).encode(),headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="POST")
        started=time.perf_counter()
        try:
            with urllib.request.urlopen(req,timeout=300) as r: data=json.loads(r.read().decode())
            ms=(time.perf_counter()-started)*1000; lat.append(ms); print(json.dumps({"id":body["request_id"],"latency_ms":round(ms,2),"capability":data.get("language_capability_status"),"output":data.get("segments",[{}])[0].get("text","")},ensure_ascii=False))
        except Exception as e: failures+=1; print(json.dumps({"id":body["request_id"],"error":str(e)},ensure_ascii=False))
    print(json.dumps({"cases":len(rows),"failures":failures,"latency_mean_ms":round(statistics.mean(lat),2) if lat else 0,"latency_p50_ms":round(statistics.median(lat),2) if lat else 0,"acceptance_authority":"CORPUS_REVIEW_REQUIRED"},ensure_ascii=False))
if __name__=="__main__": main()
