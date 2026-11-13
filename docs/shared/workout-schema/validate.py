import json, glob, os
from jsonschema import Draft202012Validator, FormatChecker
here = os.path.dirname(os.path.abspath(__file__))
schema = json.load(open(os.path.join(here, "workout.schema.json")))
Draft202012Validator.check_schema(schema)
v = Draft202012Validator(schema, format_checker=FormatChecker())
bad = 0
for p in sorted(glob.glob(os.path.join(here, "examples", "*.json"))):
    errs = sorted(v.iter_errors(json.load(open(p))), key=lambda e: list(e.absolute_path))
    print(os.path.basename(p), "OK" if not errs else f"{len(errs)} errors")
    for e in errs[:8]:
        print("  ", "/".join(map(str, e.absolute_path)), "->", e.message[:200])
    bad += bool(errs)
print("FAILED" if bad else "ALL VALID")
