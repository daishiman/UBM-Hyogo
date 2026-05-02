# Phase 6 成果物: 異常系テスト拡充

## 異常系 TC (TC-07〜TC-12) 実装結果

| TC | 検証内容 | 実装場所 | 結果 |
| --- | --- | --- | --- |
| TC-07 | token-like 値 (`[A-Za-z0-9_-]{40+}`) が redaction で完全消去 | `tests/unit/redaction.test.sh:R-01` | PASS |
| TC-08 | sink URL の query string が `?***REDACTED***` で host を残し redact | `tests/unit/redaction.test.sh:R-03` + integration TC-08 | PASS |
| TC-09 | API 失敗 (cf_call allowlist 違反 / network) → exit 2 経路 | `cf_call` で allowlist 外 sub は rc=2 を返す | 設計 PASS |
| TC-10 | 空 target / 両軸空 = shared-empty 判定 (exit 0)、片側のみ空 = current-only/legacy-only (exit 1) | `classify_axis` 関数 + integration smoke で current-only=1 / exit 1 確認 | PASS |
| TC-11 | plan 制限 (Logpush 403) → fallback `N/A (dashboard fallback: ...)` を出力し exit 0 維持 | `fetch_r3_logpush` の default 経路 | PASS |
| TC-12 | 引数欠落 / 不正 format → exit 64 / usage を stderr | `parse_args` + integration TC-12 | PASS |

## fixture 4 ファイル (合成値のみ)

| パス | 内容 |
| --- | --- |
| `tests/fixtures/observability/logpush-with-token.json` | 合成 token / Bearer / AKIA を含む Logpush 風 JSON |
| `tests/fixtures/observability/logpush-empty.json` | 空 result |
| `tests/fixtures/observability/api-error-403.json` | plan 制限を模した 403 body (実コード値・実 token なし) |
| `tests/fixtures/observability/sink-url-with-query.txt` | 合成 sink URL / Bearer / dataset_credential のテキスト |

実 token / 実 sink URL / 実 access key は **0 件**。すべて `MOCK_*` または `mock_*` の合成値。

## redaction unit test 6 観点 (実装結果)

| 観点 | 実装 | 結果 |
| --- | --- | --- |
| 単一 token 行 | R-02 Bearer | PASS |
| 複数 token 同一行 | R-04 + R-06 + R-05 を `sink-url-with-query.txt` で同時検証 | PASS |
| URL query | R-03 | PASS |
| short string 偽陽性回避 | `ubm-hyogo-web-production` (24 chars) を維持 | PASS |
| Unicode | `トークン:` の維持 | PASS |
| OAuth `ya29.` | R-06 | PASS |

unit test PASS=11 / FAIL=0、integration test PASS=18 / FAIL=0。

## 共通禁則 (再宣言)
- fixture / 出力 / log に **実値ゼロ**
- mock / stub は production API へ実通信しない (`OBS_DIFF_FETCH_LOGPUSH=0` default)
- redaction bypass 経路 (`echo` / `printf` で redact_stream を経由しない出力) は script 内に存在しない (Phase 9 で再 grep)
- API error body を file に書かない
