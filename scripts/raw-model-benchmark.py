#!/usr/bin/env python3
"""Diagnostic raw-Qwen translation benchmark. Never a product acceptance result."""
import argparse, json, os, statistics, time, urllib.request

def post(url, token, payload):
    req=urllib.request.Request(url,data=json.dumps(payload,ensure_ascii=False).encode(),headers={"Authorization":"Bearer "+token,"Content-Type":"application/json"},method="POST")
    started=time.perf_counter()
    with urllib.request.urlopen(req,timeout=180) as r: data=json.loads(r.read().decode())
    return data,(time.perf_counter()-started)*1000

def main():
    p=argparse.ArgumentParser(); p.add_argument("corpus"); p.add_argument("--origin",default=os.getenv("AI_CORE_BASE_URL","http://127.0.0.1:18080")); a=p.parse_args()
    token=os.environ["AI_CORE_API_KEY"]; rows=[json.loads(x) for x in open(a.corpus,encoding="utf-8") if x.strip()]; lat=[]
    for row in rows:
        payload={"model":"qwen3//models/Qwen3-8B-Q4_K_M.gguf","messages":[{"role":"system","content":"Translate only the supplied text. Return translation only. Preserve code, URLs, identifiers, dates, money, percentages and numbers."},{"role":"user","content":f"TARGET_LANGUAGE={row['target_language']}\nTEXT_BEGIN\n{row['source']}\nTEXT_END"}],"temperature":0,"max_tokens":4096,"chat_template_kwargs":{"enable_thinking":False}}
        data,ms=post(a.origin.rstrip("/")+"/v1/chat/completions",token,payload); lat.append(ms); print(json.dumps({"id":row.get("id"),"latency_ms":round(ms,2),"model":data.get("model"),"output":data.get("choices",[{}])[0].get("message",{}).get("content","")},ensure_ascii=False))
    print(json.dumps({"diagnostic_only":True,"cases":len(rows),"latency_mean_ms":round(statistics.mean(lat),2) if lat else 0,"latency_p50_ms":round(statistics.median(lat),2) if lat else 0},ensure_ascii=False))
if __name__=="__main__": main()
