# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| Wave | 3 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 8（DRY 化） |
| 次 Phase | 10（最終レビュー） |
| 状態 | pending |

## 目的

無料枠見積もり / secret hygiene / a11y を確認する。本タスクは UI を持たないが、admin 操作（`/admin/sync/schema` の手動同期 UI は 06c）の前提として誤操作防止を確認する。

## 実行タスク

1. 無料枠見積もり（D1 read/write、Workers req、Forms API quota）。
2. secret hygiene チェックリスト（commit 禁止、wrangler secret 限定、ログに出さない）。
3. a11y 観点（本タスクは API のみだが、admin 画面で「同期実行」ボタンが必要）。
4. 型 / lint / test 実行を Phase 10 へ前提化。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-implementation-core.md | 無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-details.md | cron / secret 配置 |
| 必須 | outputs/phase-06/failure-cases.md | retry 上限 |
| 参考 | .claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md | a11y 観点 |

## 実行手順

### ステップ 1: 無料枠見積もり
- 後述「free-tier estimate」を outputs/phase-09/free-tier-estimate.md に保存。

### ステップ 2: secret hygiene
- 後述「secret hygiene」を outputs/phase-09/secret-hygiene.md に保存。

### ステップ 3: a11y
- 06c の `/admin/schema` の「同期実行」ボタン仕様の最低条件を Phase 9 で言語化。

### ステップ 4: pre-flight
- pnpm typecheck / lint / test の実行が Phase 10 / 11 / 13 の前提であることを再確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 無料枠 PASS / secret PASS を gate 入力 |
| Phase 13 | secret hygiene を PR template チェックに含める |
| Wave 9b | release runbook に無料枠監視を組込 |

## 多角的チェック観点

| 観点 | 不変条件番号 | 適用理由 |
| --- | --- | --- |
| 無料枠 | #10 | D1 write / Forms quota |
| schema 集約 | #14 | 同期 UI は `/admin/schema` のみ |
| apps/api | #5 | secret は Workers Secrets |
| stableKey 直書き | #1 | log に stableKey をリテラル出さない |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 無料枠見積もり | 9 | pending | D1 / Workers / Forms |
| 2 | secret hygiene | 9 | pending | チェックリスト |
| 3 | a11y 観点 | 9 | pending | 06c との橋渡し |
| 4 | pre-flight 確認 | 9 | pending | typecheck / lint / test |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | 品質サマリ |
| ドキュメント | outputs/phase-09/free-tier-estimate.md | 無料枠見積もり |
| ドキュメント | outputs/phase-09/secret-hygiene.md | secret 取扱い |
| メタ | artifacts.json | phase 9 を `completed` に更新 |

## 完了条件

- [ ] 無料枠見積もりが数値で残っている
- [ ] secret hygiene チェックが 6 項目以上
- [ ] a11y 観点が 06c へ引き渡し可能
- [ ] typecheck / lint / test が前提化

## タスク100%実行確認【必須】

- [ ] サブタスク 4 件すべて completed
- [ ] 無料枠が D1 / Workers / Forms の 3 軸で見積もられている
- [ ] secret hygiene 6 項目以上
- [ ] artifacts.json の phase 9 が `completed`

## 次 Phase

- 次: 10（最終レビュー）
- 引き継ぎ事項: 無料枠 OK、secret OK
- ブロック条件: 無料枠超過リスク高

## free-tier estimate

| 区分 | 計算 | 推定値 / 月 | 無料枠 | 余裕 |
| --- | --- | --- | --- | --- |
| Forms API call | 1 day cron + 手動 5 回/月 = 35 call/month | 35 | 無料 / 高い quota | 十分 |
| D1 write | 1 sync で schema_versions 1 + schema_questions 31 + sync_jobs 2 = 34 row write | 35 sync × 34 = 1,190 / 月 | 100,000 / 日 | 十分 |
| D1 read | 1 sync で stableKey 解決 31 read + ledger 確認 1 + 後段 04c 一覧 read | < 5,000 / 月 | 5,000,000 / 日 | 十分 |
| Workers req | sync 起動 1 req + admin UI 操作 5 req | < 200 / 月 | 100,000 / 日 | 十分 |
| Cloudflare D1 storage | schema_versions JSON ~10KB × 数十 row + schema_questions ~1KB × 31 = 数 MB | < 10MB | 5GB | 十分 |

## secret hygiene

| # | 項目 | 達成方法 |
| --- | --- | --- |
| 1 | 平文 .env を commit しない | .gitignore + Husky pre-commit |
| 2 | `GOOGLE_PRIVATE_KEY` を log に出さない | logger に redact filter |
| 3 | エラー stack trace に payload を含めない | SyncError.payload は formId のみ |
| 4 | wrangler secret put 経由のみで投入 | runbook に明記 |
| 5 | 1Password に local secret を保管 | infra 04 と統一 |
| 6 | rotate 手順を runbook 化 | Wave 9b の release runbook と整合 |
| 7 | Forms API quota 超過時の通知 | Wave 9b 監視で alert |

## a11y 観点（06c に引き渡し）

- `/admin/schema` の「今すぐ同期」ボタン: aria-busy=true を sync 実行中に付与。
- 失敗時のメッセージ: 視覚 + screen reader 両方で確認可能（aria-live polite）。
- 同種 job running 時のメッセージ: 「他の同期が実行中です」を 409 から表示。
