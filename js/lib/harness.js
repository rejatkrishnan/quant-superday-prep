// Python test harness. Used by the browser (Pyodide) and by CI (tests/run_coding_tests.py) so both run identical code.
export const HARNESS = String.raw`
import json, sys, io, time, traceback

def _qp_where(tb):
    for fr in reversed(traceback.extract_tb(tb)):
        if fr.filename == "<your code>":
            return f" (your code, line {fr.lineno}: {(fr.line or '').strip()})"
    return ""

def _qp_run(user_code, tests_json):
    import numpy as np
    import pandas as pd
    tests = json.loads(tests_json)
    out = io.StringIO()
    old = sys.stdout
    sys.stdout = out
    results = []
    try:
        ns = {"np": np, "pd": pd, "__name__": "__main__"}
        try:
            exec(compile(user_code, "<your code>", "exec"), ns)
        except Exception as e:
            if isinstance(e, SyntaxError):
                msg = f"SyntaxError on line {e.lineno}: {e.msg}"
            else:
                msg = f"{type(e).__name__}: {e}{_qp_where(e.__traceback__)}"
            return json.dumps({"error": msg, "stdout": out.getvalue()[:5000], "results": []})
        for name, code in tests:
            tns = dict(ns)
            t0 = time.time()
            try:
                exec(compile(code, f"<test {name}>", "exec"), tns)
                results.append({"name": name, "ok": True, "ms": round((time.time() - t0) * 1000)})
            except AssertionError as e:
                m = str(e)
                if len(m) > 300:
                    m = m[:300] + "..."
                results.append({"name": name, "ok": False, "msg": "Assertion failed" + (f" - got: {m}" if m else "") + _qp_where(e.__traceback__)})
            except Exception as e:
                results.append({"name": name, "ok": False, "msg": f"{type(e).__name__}: {e}{_qp_where(e.__traceback__)}"})
    finally:
        sys.stdout = old
    return json.dumps({"results": results, "stdout": out.getvalue()[:5000]})
`;
