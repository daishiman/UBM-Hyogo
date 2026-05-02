# Phase 9: 品質ゲート（secret hygiene / 不変条件）

[実装区分: 実装仕様書]

## メタ情報

| Phase | 9 / 13 |
| --- | --- |
| 前 Phase | 8 |
| 次 Phase | 10（設計レビュー記録） |
| 状態 | completed |

## 検証項目

| ID | チェック | コマンド | 期待 |
| --- | --- | --- | --- |
| Q-1 | secret hygiene | `grep -rE '(CLOUDFLARE_API_TOKEN=\|OAUTH_SECRET=\|GOOGLE_CLIENT_SECRET=\|sk-[A-Za-z0-9]{20,}\|ghp_[A-Za-z0-9]{30,})' docs/30-workflows/_design/` | 0 件 |
| Q-2 | 不変条件 #5 違反なし | `git diff --name-only main...HEAD \| grep -E '^apps/web/'` | 0 件（web 差分なし） |
| Q-3 | 不変条件 #6 違反なし | `git diff main...HEAD -- 'docs/30-workflows/_design/' \| grep -iE 'gas|google apps script|prototype として正本'` | 0 件 |
| Q-4 | code quality | `pnpm --filter @ubm-hyogo/api typecheck` / `pnpm --filter @ubm-hyogo/api lint` | PASS |
| Q-5 | 1Password / `.env` 実値混入なし | `grep -rE 'op://\|\\.env' docs/30-workflows/_design/ \| grep -vE '#|//' ` | 0 件（参照式 `op://...` を除く） |

## DoD

- Q-1〜Q-5 すべて PASS
- 結果を `outputs/phase-09/secret-hygiene-grep.log` に保存

## 成果物

- `outputs/phase-09/secret-hygiene-grep.log`

## 完了条件

- 全 Q-* PASS

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
