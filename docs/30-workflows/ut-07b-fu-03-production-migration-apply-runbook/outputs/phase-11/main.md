# Phase 11: evidence index（NON_VISUAL — 実装仕様書スコープ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 11 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |
| evidence 性質 | 想定 evidence の保存仕様（実走 evidence は別タスク or operator 実施で取得） |

## NON_VISUAL 宣言

UI/UX 変更を含まず、`screenshot-plan.json` は `screenshotsRequired: false` の NON_VISUAL plan。代替証跡は (1) bats / (2) staging `DRY_RUN=1` / (3) CI gate / (4) grep redaction / (5) 5 オブジェクト存在確認 SQL モデル出力の 5 系統。

## evidence 一覧

| ファイル | 内容 |
| --- | --- |
| `manual-smoke-log.md` | bats local 実行（`pnpm test:scripts`）期待 stdout / exit code |
| `staging-dry-run.md` | `DRY_RUN=1 bash scripts/d1/apply-prod.sh ubm-hyogo-db-staging --env staging` 期待出力 |
| `grep-verification.md` | 機密値（Token / Account ID / OAuth）混入なし grep 検証手順 |
| `redaction-check.md` | F3 evidence.sh redact 関数の検証 |
| `structure-verification.md` | 5 オブジェクト存在確認の期待 SQL 出力（F2 postcheck） |
| `manual-test-checklist.md` | bats ケース × AC マッピング |
| `manual-test-result.md` | 期待結果スキーマ（TAP/JSON） |
| `discovered-issues.md` | 仕様化過程の発見事項 |
| `link-checklist.md` | 仕様書内リンクの整合性 |
| `screenshot-plan.json` | NON_VISUAL — `screenshotsRequired: false` の plan object |

## 4 条件評価サマリ

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | bats / staging dry-run / CI gate の期待出力が runbook と F1-F4 SQL/exit code と一貫 |
| 漏れなし | PASS | AC-1〜AC-20 を `manual-test-checklist.md` で全マッピング |
| 整合性 | PASS | F1-F4 仕様 / `cf.sh d1:apply-prod` と整合 |
| 依存関係整合 | PASS | UT-07B migration / U-FIX-CF-ACCT-01 Token スコープと整合 |

## production 値非含有宣言

- 本 Phase の evidence は staging `DRY_RUN=1` および bats local 実行の期待出力のみ
- production への接続を伴うコマンドは **記述しない / 実行しない**
- F3 redact 関数で API Token / Account ID / 40 文字級英数字を `***REDACTED***` に置換

## 完了条件

- [ ] 11 ファイルが揃っている
- [ ] grep redaction で Token 値 0 件 / Account ID 値 0 件 / production 実 apply 結果値 0 件
- [ ] 4 条件評価が全 PASS
- [ ] CI gate green が PR merge 前提として明記されている

## 関連リンク

- 上位 Phase 仕様: `../../phase-11.md`
- AC マトリクス: `../../phase-07.md`
- runbook 本体: `../phase-05/main.md`
