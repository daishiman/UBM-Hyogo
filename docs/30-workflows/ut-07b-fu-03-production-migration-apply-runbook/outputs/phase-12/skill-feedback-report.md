# Skill Feedback Report

## Feedback Items

| # | Item | Owning Skill | Routing | Evidence |
| --- | --- | --- | --- | --- |
| 1 | CONST_004 例外（ユーザー指定 docs-only → 実装仕様書化）の判定基準と冒頭明記フォーマットを skill ガイドラインに昇格 | task-specification-creator | candidate promotion | `index.md` 実装区分判定根拠 / `phase-01.md` 冒頭 |
| 2 | NON_VISUAL + 実装仕様書 + production runbook を組み合わせるタスクの Phase 11 evidence 標準化（bats / staging dry-run / CI gate / grep / redaction の 5 系統） | task-specification-creator | candidate promotion | `outputs/phase-11/{main,manual-smoke-log,staging-dry-run,grep-verification,redaction-check,structure-verification,manual-test-checklist}.md` |
| 3 | 「実装仕様書化したが production 実 apply は別タスク」境界の skill ガイドライン化（`workflow_state = spec_created` のまま据え置く根拠） | task-specification-creator | candidate promotion | `index.md` 完了判定 / `outputs/phase-12/system-spec-update-summary.md` Step 1-B |
| 4 | bats fixture / mock wrangler 戦略をスキルテンプレートに追加（`MOCK_WRANGLER=1` で fixture から stdout/stderr 返却する shim を `__fixtures__/wrangler` に配置し PATH 先頭にする戦略） | task-specification-creator | candidate promotion | `phase-04.md` テスト戦略 |
| 5 | aiworkflow-requirements skill から `docs/30-workflows/` 配下の runbook + scripts 系タスクを逆引きできる index 整備 | aiworkflow-requirements | same-wave sync candidate | `outputs/phase-12/system-spec-update-summary.md` Step 2 |
| 6 | exit code 規約の標準化提案（0 成功 / 1 verify失敗 / 2 引数誤り / 3 preflight 失敗 / 4 apply失敗 / 5 postcheck失敗 / 6 evidence失敗 / 10/30/40/80 拡張） | task-specification-creator | candidate promotion | `outputs/phase-05/main.md` Part A / `outputs/phase-06/main.md` |
| 7 | redaction grep の標準正規表現セットを skill reference 化（`CLOUDFLARE_API_TOKEN\|CLOUDFLARE_ACCOUNT_ID\|Bearer\s+\|sk-[A-Za-z0-9]{16,}\|eyJ[A-Za-z0-9_-]{16,}`、`op://` 参照は false-positive 除外） | task-specification-creator | candidate promotion | `outputs/phase-11/redaction-check.md` |
| 8 | CI gate `d1-migration-verify` のような「branch protection 必須化を伴う workflow 追加」を skill template の Phase 13 PR 仕様に組み込む | task-specification-creator | candidate promotion | `phase-13.md` Test plan |

## 既存 skill の改善が不要な観点

- `phase-12-documentation-guide` の 7 ファイル parity 規約は今回ケースでも有効に機能した（feedback 不要）
- `Refs #<issue>` vs `Closes #<issue>` 判定（CLOSED Issue に対しては `Refs` 優先）も既存 skill ルールで明示されており踏襲

## Routing 凡例

- `candidate promotion`: 次回 skill 改修 wave で template 反映を検討
- `same-wave sync candidate`: 本タスク PR と同 wave で skill reference 追記候補
