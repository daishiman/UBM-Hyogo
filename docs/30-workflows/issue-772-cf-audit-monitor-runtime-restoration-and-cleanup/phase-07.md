# Phase 7: テスト計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | spec_created |

## 目的

本タスクはコード追加を伴わず、test 追加は不要（CONST_005 適用上、test 方針として「N/A: runtime test に置換」を明文化）。代わりに Phase 11 runtime evidence の合格判定基準を定義する。

## test 種別と判定

### Unit test

- **対象**: なし（コード追加なし）
- **理由**: workflow yaml / md / json のみの差分。既存 unit test は影響を受けない

### Static check

| check | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | local readiness command（実行時に evidence へ記録。現 Phase では PASS 断言しない） |
| lint | `mise exec -- pnpm lint` | PASS（md / json のみ） |
| markdown format | lefthook 経由 | PASS |

### Runtime test（Phase 11 で実行）

| test | 判定 |
| --- | --- |
| RT-1: workflow_dispatch dry_run 1 回 success | `gh run view <ID> --json conclusion -q .conclusion == "success"` |
| RT-2: hourly schedule 6 連続 success | `jq '[.[] \| select(.event=="schedule")] \| .[:6] \| all(.conclusion=="success")'` が true |
| RT-3: secret-leakage-grep step が全 6 run で exit 0 | step name == "Secret leakage grep (post-step gate)"、 conclusion == "success" |
| RT-4: heartbeat variable `CF_AUDIT_LAST_SUCCESS_AT` が 6h 内に更新 | `gh api repos/daishiman/UBM-Hyogo/actions/variables/CF_AUDIT_LAST_SUCCESS_AT` の `updated_at` が 6h success の最新 run 時刻以降 |

### Negative test（fail を期待）

| test | 判定 |
| --- | --- |
| NT-1: 投入前の hourly run は failure | 過去 10 件すべて failure。これは本タスク事前の baseline |

## evidence 構造

```
outputs/phase-11/
├── workflow-dispatch-dryrun.md          # RT-1 evidence (run URL + timestamp)
├── runtime-evidence/
│   ├── hourly-runs.json                 # RT-2 raw 出力
│   ├── 6h-success.md                    # RT-2 evidence
│   └── heartbeat-after.txt              # RT-4 evidence
└── visual-verification-skip.md          # NON_VISUAL 判定根拠
```

## fail 時の対応

| fail パターン | 想定原因 | 切り分け手順 |
| --- | --- | --- |
| dry_run "Fetch audit logs into D1" exit 2 / 401 | secret value 誤り or token 権限不足 | `gh run view --log-failed` で 401/403 確認 → Cloudflare API token 権限 / D1 token を再確認 |
| dry_run "Analyze and alert" fail | classifier 関連 vars が空 | repo-level `CF_AUDIT_CLASSIFIER` / `ML_MODEL_PATH` の存在再確認 |
| "Secret leakage grep" exit 1 | observation snapshot に token 形式の文字列混入 | `outputs/observation/*.json` を抽出して該当 key を redaction |
| hourly 途中 1 件 fail | transient network / runner 障害 | 6 連続 reset。原因が Cloudflare API 側 incident なら別 issue 切り出し |

## 完了条件

- [x] static check / runtime test 判定基準明記
- [x] evidence 構造定義
- [x] fail 時切り分け手順明記

## 次 Phase

- 次: 8 (ドキュメント更新)
