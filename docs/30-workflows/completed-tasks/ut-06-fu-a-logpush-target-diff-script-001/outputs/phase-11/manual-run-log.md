# Manual run log (2026-05-01)

## smoke run

```
$ bash scripts/observability-target-diff.sh \
  --current-worker ubm-hyogo-web-production \
  --legacy-worker  ubm-hyogo-web \
  --config apps/web/wrangler.toml
```

stderr (redaction 通過後):
```
observability-target-diff: current=ubm-hyogo-web-production legacy=ubm-hyogo-web
```

stdout: `diff-sample.md` 参照

exit code: `1` (current-only=1)

## redaction unit test

```
$ bash tests/unit/redaction.test.sh
PASS R-01 long token
PASS R-02 Bearer header
PASS R-02 leaves marker
PASS R-03 URL query
PASS R-03 keeps host
PASS R-04 AKIA key
PASS R-05 dataset_credential
PASS R-06 ya29 oauth
PASS R-06 leaves marker
PASS no false positive on short tokens
PASS preserve japanese
--- summary: PASS=11 FAIL=0 ---
```

## integration test

```
$ bash tests/integration/observability-target-diff.test.sh
... (18 PASS / 0 FAIL)
--- summary: PASS=18 FAIL=0 ---
```

## 引数 validation

```
$ bash scripts/observability-target-diff.sh
ERROR: --current-worker and --legacy-worker are required
Usage: ...
exit=64
```
