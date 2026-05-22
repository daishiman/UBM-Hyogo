# Phase 11: 手動テスト（NON_VISUAL）

> [実装区分: 実装仕様書] / visual classification: **NON_VISUAL**

## NON_VISUAL 宣言

| 項目 | 内容 |
|---|---|
| タスク種別 | CI/CD security surface 改修 |
| 非視覚的理由 | UI/UX 変更なし。GitHub Actions workflow yaml + shell script のみの変更。実地操作不可（CI runtime での動作確認が主） |
| 代替証跡 | (1) 自動テスト結果 `redaction-check.test.sh` / `workflow-env-scope.test.sh` (2) grep evidence (3) staging deploy 実行 log + redaction-check 結果 |

## 1. 証跡の主ソース

| 主ソース | ファイル数 / 件数 |
|---|---|
| `bash scripts/__tests__/redaction-check.test.sh` | TC-01〜06 + TC-F01〜F05 = 12 assertions |
| `bash scripts/__tests__/workflow-env-scope.test.sh` | TC-W01〜W04 + TC-R01〜R03 = 7件 |
| grep evidence | `grep -n "CLOUDFLARE_API_TOKEN" .github/workflows/*.yml` |
| staging deploy log | `gh run view <RUN_ID> --log > outputs/phase-11/staging-deploy.log`（redacted） |

## 2. 手動検証手順（CI 経由）

1. feature ブランチを push
2. `web-cd.yml` の staging deploy が triggered されることを `gh run list` で確認
3. `gh run view <RUN_ID>` で実 log を取得し、`outputs/phase-11/staging-deploy.log` として保存（必ず token 値が GitHub 側で `***` マスクされていることを確認）
4. `bash scripts/redaction-check.sh --log outputs/phase-11/staging-deploy.log --account-id <ID>` を実行し exit 0
5. `wrangler deployments list` 相当で新 deployment を確認

## 3. 既知制限リスト

| 制限 | 説明 |
|---|---|
| OIDC 完全移行は本タスク範囲外 | CF 側 GA 待ち。`unassigned-task/issue-640-followup-001-oidc-full-migration.md` に formalize |
| 旧 long-lived token の物理失効は本タスクで実施しない | 別 unassigned task |
| production deploy の実行はユーザー承認後 | Phase 13 のゲート |

## 4. なぜスクリーンショットを作らないか

- UI 変更ゼロ
- 検証対象は CI runtime の挙動と log redaction であり、視覚的な確認対象が存在しない
- 代替として gh run view の log（テキスト）を成果物として保管

## 5. DoD

- [ ] 自動テスト 17 件 PASS
- [ ] grep evidence で job-level token 露出ゼロを確認
- [ ] staging deploy log で token / Account ID 漏洩ゼロ
- [ ] redaction-check.sh が staging log に対して exit 0
