"""Run every coding problem's reference solution (must pass all tests) and starter (must not pass all tests)."""
import json
import sys

data = json.load(open(sys.argv[1]))
ns = {}
exec(data["harness"], ns)
run = ns["_qp_run"]

failures = 0
for p in data["problems"]:
    tests = json.dumps(p["tests"])
    res = json.loads(run(p["solution"], tests))
    bad = [r for r in res["results"] if not r["ok"]]
    if res.get("error") or bad or not res["results"]:
        failures += 1
        print(f"FAIL solution {p['id']}: {res.get('error') or bad}")
    starter = json.loads(run(p["starter"], tests))
    if not starter.get("error") and all(r["ok"] for r in starter["results"]):
        failures += 1
        print(f"FAIL starter {p['id']} passes all tests (tests too weak)")
    else:
        print(f"ok   {p['id']} ({len(p['tests'])} tests)")

print(f"\n{len(data['problems'])} problems, {failures} failures")
sys.exit(1 if failures else 0)
