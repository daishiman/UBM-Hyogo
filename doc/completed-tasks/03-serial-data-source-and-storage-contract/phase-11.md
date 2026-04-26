# Phase 11: 手動 smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-23 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | completed |
| タスク種別 | NON_VISUAL (infra / data-contract) |
| implementation_mode | new |

## NON_VISUAL 宣言【WEEKGRD-03】

- タスク種別: **infra / data-contract**（CLI / SQL / sync log ベース）
- 非視覚的理由: D1・Workers binding・wrangler・Sheets API は CLI/HTTP 経由で完結し UI を伴わない。
- 代替証跡: `outputs/phase-11/evidence-collection.md` に wrangler 実行ログ・SQL 結果・sync ログを集約する。
- screenshots は不要。`outputs/phase-11/screenshots/.gitkeep` は作成・コミットしない。

## 実地操作不可の明記【BEFORE-QUIT-001】

- Claude Code は本番 Cloudflare / Google Workspace へ直接アクセス不可。
- よって本 Phase は「自動 smoke (lint / link / docs validate)」と「手動 wrangler コマンド検証（実行者: ユーザー）」の二段で構成し、結果ログを evidence として残す。

## 目的

データ入力源と保存契約 における Phase 11 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- 自動 smoke (docs lint / link check / artifacts.json validate) を完了させる
- 手動 wrangler コマンド検証手順をユーザーが実行し、結果を evidence に貼る
- Sheets→D1 サンプル sync ログを保管する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | Repository / D1 / API route |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 / wrangler 基本手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 基本方針 |
| 必須 | User request on 2026-04-23 | Sheets と DB の最適解 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | env boundary |

## 主ソース（evidence の正本）

| 種別 | パス | 用途 |
| --- | --- | --- |
| ログ | outputs/phase-11/wrangler-d1-execute.log | `wrangler d1 execute` の実行ログ |
| ログ | outputs/phase-11/sheets-to-d1-sync-sample.log | Sheets→D1 サンプル sync ログ |
| ログ | outputs/phase-11/docs-validate.log | 自動 smoke (lint / link / json validate) |

## 実行手順

### ステップ 1: 自動 smoke
- `pnpm lint` / docs link check / `artifacts.json` JSON validate を実行しログ保存。
- 失敗時は対応する戻り先 Phase に差し戻す。

### ステップ 2: 手動 wrangler コマンド検証（ユーザー実行）
- `wrangler d1 list` / `wrangler d1 execute <db> --command "SELECT 1"` を staging で実施。
- Sheets 連携の dry-run（service account で 1 行 select→insert）を実行しログを採取。
- 出力を `outputs/phase-11/wrangler-d1-execute.log` 等に貼り付ける。

### ステップ 3: 4条件と handoff
- 価値性 / 実現性 / 整合性 / 運用性を再確認。
- 次 Phase に渡す blocker / open question を `evidence-collection.md` に記録。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | 本 Phase の evidence を input として参照 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 自動 smoke 実行 | 11 | completed | docs-validate.log |
| 2 | wrangler 手動検証 | 11 | completed | ユーザー実行・ログ貼付 |
| 3 | sync サンプルログ採取 | 11 | completed | sheets-to-d1-sync-sample.log |
| 4 | 4条件確認 | 11 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/manual-test-result.md | 手動 smoke 結果サマリ |
| ドキュメント | outputs/phase-11/evidence-collection.md | NON_VISUAL 代替証跡集約 |
| ドキュメント | outputs/phase-11/main.md | NON_VISUAL smoke summary |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | 手動 smoke 実行ログ |
| ドキュメント | outputs/phase-11/link-checklist.md | link / docs validate 結果 |
| ログ | outputs/phase-11/wrangler-d1-execute.log | wrangler 実行ログ |
| ログ | outputs/phase-11/sheets-to-d1-sync-sample.log | sync 実行ログ |
| ログ | outputs/phase-11/docs-validate.log | docs validation log |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

依存Phase 6 / Phase 8 / Phase 9: `outputs/phase-06/failure-cases.md` / `outputs/phase-08/refactor-record.md` / `outputs/phase-09/qa-report.md`

依存成果物参照: `outputs/phase-06/failure-cases.md` / `outputs/phase-08/refactor-record.md` / `outputs/phase-09/qa-report.md`

- [ ] 自動 smoke が PASS している
- [ ] wrangler 手動検証ログが evidence に貼られている
- [ ] evidence-collection.md に 4条件・blocker・open question が記録されている

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（権限・無料枠・drift）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項: evidence-collection.md と manual-test-result.md を Phase 12 入力に使用。
- ブロック条件: 主成果物・evidence が未作成なら次 Phase に進まない。

## 失敗時の戻り先 (逆引き表)
| 問題 | 戻り先 |
| --- | --- |
| branch / env drift | Phase 2 / 8 |
| source-of-truth drift | Phase 2 / 3 |
| wrangler / D1 binding 不整合 | Phase 5 |
| output path drift | Phase 5 / 8 |
