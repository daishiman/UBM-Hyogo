# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | 9 |
| Mode | parallel |
| 作成日 | 2026-04-26 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

Phase 1 の AC-1〜AC-9 と Phase 4 verify suite と Phase 5 runbook ステップを 1 対 1 以上で対応させ、未対応 AC をゼロにする。空白セルが残れば Phase 1〜5 へ差し戻す。

## 実行タスク

1. AC matrix を「Phase 1 AC × Phase 4 verify suite × Phase 5 runbook step」の 3 軸で作成
2. 未対応 AC があれば差し戻し先を記述
3. Phase 6 異常系も「negative AC」として matrix に追加
4. matrix を `outputs/phase-07/ac-matrix.md` に保存

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/index.md | AC 一覧 |
| 必須 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-04.md | verify suite |
| 必須 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-05.md | runbook step |
| 必須 | docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-06.md | 異常系 |

## 実行手順

### ステップ 1: positive AC matrix 作成
- AC-1〜AC-9 と verify suite と runbook step を表化

### ステップ 2: negative AC matrix 作成
- F-1〜F-12 を AC matrix に追加（"異常系を 1 件以上検出可能" を AC として）

### ステップ 3: 未対応セル 0 確認
- 空白あれば差し戻し記録

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | matrix を GO/NO-GO 判定の根拠に使用 |
| Phase 11 | matrix を smoke チェックリストに転用 |
| 並列 09b | 監視設計が negative AC を検出できるか相互参照 |
| 下流 09c | matrix を production AC に転用 |

## 多角的チェック観点（不変条件）

- 不変条件 #5: AC-8 が H-1 verify suite と Step 11 runbook の両方で担保されているか
- 不変条件 #10: AC-9 が H-2 / H-3 と Step 11 で担保されているか
- 不変条件 #11: F-12 が runbook で検出経路を持っているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | positive AC matrix | 7 | pending | AC-1〜AC-9 |
| 2 | negative AC matrix | 7 | pending | F-1〜F-12 |
| 3 | 空白セル check | 7 | pending | 0 件確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | matrix サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × verify × runbook 表 |
| メタ | artifacts.json | Phase 7 実行時に artifacts.json を更新 |

## 完了条件

- [ ] positive AC 9 件すべてが matrix に対応
- [ ] negative AC 12 件すべてが matrix に対応
- [ ] 空白セル 0 件

## タスク100%実行確認【必須】

- 全実行タスクが実行時に完了条件を満たす
- ac-matrix.md が positive 9 + negative 12 = 21 件記述
- 空白 0 件
- artifacts.json の phase 7 は実行時に更新

## 次 Phase

- 次: 8 (DRY 化)
- 引き継ぎ事項: ac-matrix.md
- ブロック条件: 空白セル 1 件以上、または negative AC が 12 件未満なら次 Phase に進まない

## AC matrix（positive）

| AC | 内容 | verify suite | runbook step | 不変条件 | 備考 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | D1 staging migration applied | U-1 | Step 2 | - | 自動化は将来検討 |
| AC-2 | staging secrets 7 種存在 | U-2, U-3 | Step 3 | - | 04 (infra) と同期 |
| AC-3 | deploy exit 0 | (GitHub Actions log) | Step 4, Step 5 | - | gh run watch |
| AC-4 | schema sync success | C-4 | Step 6, Step 8 | #1, #3 | sync_jobs 確認 |
| AC-5 | responses sync success | C-5 | Step 7, Step 8 | #2, #3 | member_responses 更新 |
| AC-6 | Playwright green | E-1〜E-5 | Step 9 | #2, #4, #11 | screenshot 保存 |
| AC-7 | 10 ページ smoke 通過 | E-1〜E-5 + 手動 | Step 10 | #4, #11 | 認可境界含む |
| AC-8 | 不変条件 #5 boundary | H-1 | Step 11 | #5 | bundle inspect |
| AC-9 | 不変条件 #10 free-tier | H-2, H-3 | Step 11 | #10 | Cloudflare Analytics |

## AC matrix（negative）

| Failure | 検出 verify suite | 検出 runbook step | mitigation | 不変条件 |
| --- | --- | --- | --- | --- |
| F-1 deploy 5xx | (CI log) | Step 4 | retry → infra 差し戻し | - |
| F-2 D1 ROLLBACK | U-1 + wrangler tail | Step 2 | migration fix | - |
| F-3 secret 不足 | U-2, U-3 | Step 3 | wrangler secret put | - |
| F-4 sync 401 | C-4 | Step 6 | admin token 修正 | #11 |
| F-5 sync 422 | C-4, C-5 | Step 6, 7 | zod schema 修正 | #1 |
| F-6 sync 5xx | (sync_jobs.error) | Step 8 | retry → 03a/b | - |
| F-7 sync diff queue 増殖 | (SELECT COUNT) | Step 8 | 07b へ差し戻し | #1 |
| F-8 Playwright fail | E-* | Step 9 | 該当 06* へ差し戻し | #2, #4, #11 |
| F-9 認可 leak | A-2 | Step 9, Step 10 | 05a / 04c 修正 | #11 |
| F-10 web bundle に D1 | H-1 | Step 11 | 02c へ差し戻し | #5 |
| F-11 無料枠超過 | H-2, H-3 | Step 11 | 09b で sync 頻度再設計 | #10 |
| F-12 admin 編集 form | (手動 + grep) | Step 10, Step 11 | 06c へ差し戻し | #11 |

## 空白セル check

- positive 9 件 × 5 列 = 45 セル → 全て埋め
- negative 12 件 × 5 列 = 60 セル → 全て埋め
- 合計 105 セル空白 0 件
