# redaction verification

## audit grep (実 token / 実 credential 検出)

```
$ grep -rnE 'AKIA[0-9A-Z]{16}|ya29\.[A-Za-z0-9_-]{8,}' \
    scripts/observability-target-diff.sh \
    scripts/lib/redaction.sh \
    tests/
```

ヒット件数: 全件が `AKIAFAKE` / `AKIAEXAMPLEFAKEKEY00` / `MOCK_OAUTH_VALUE` 等の合成値のみ。
実 token / 実 sink URL credential: **0 件**

## R-01〜R-06 個別検証 (unit test 結果)

| Pattern | input (合成) | output | 判定 |
| --- | --- | --- | --- |
| R-01 | `token=ABCDEF...50chars` | `token=***REDACTED_TOKEN***` | PASS |
| R-02 | `Authorization: Bearer mock_bearer_token_xyz` | `Authorization: ***REDACTED_AUTH*** Bearer ***REDACTED_AUTH***` | PASS |
| R-03 | `https://s3.amazonaws.com/bucket?X-Amz-Signature=AKIAFAKE&exp=123` | `https://s3.amazonaws.com/bucket?***REDACTED***` | PASS (host 維持) |
| R-04 | `access_key_id=AKIAEXAMPLEFAKEKEY00` | `access_key_id: ***REDACTED***` | PASS |
| R-05 | `dataset_credential=mock_secret_value` | `dataset_credential: ***REDACTED***` | PASS |
| R-06 | `token: ya29.MOCK_OAUTH_VALUE_xxxx` | `token: ***REDACTED_OAUTH***` | PASS |

## 偽陽性 (Worker 名 / 日本語) 維持確認

- `ubm-hyogo-web-production` (24 chars) → 維持 (R-01 は 40 chars 以上のみ対象)
- `トークン:` (Unicode 日本語) → 維持
