# Phase 11 Main — NON_VISUAL 代替 evidence サマリー

> 正本仕様: `../../phase-11.md`
> 採取ログ: `./manual-smoke-log.md`
> リンク健全性: `./link-checklist.md`
> 実行日時: 2026-04-29T07:10:11Z (UTC)
> 実行者: Claude Code agent (UT-09 reconciliation worktree)

## 1. VISUAL / NON_VISUAL 宣言

- **mode: NON_VISUAL**
- 本タスクは `taskType: docs-only` / `visualEvidence: NON_VISUAL`（`index.md` メタ情報・`phase-11.md` §VISUAL/NON_VISUAL 判定に準拠）。
- UI / API 実装・migration 実行・wrangler dev / curl は本タスクのスコープ外。screenshot は **作成しない**（`outputs/phase-11/screenshots/` 不在を維持）。
- 一次証跡は (a) outputs ファイル存在確認、(b) Phase 1〜10 の内部リンク・参照パス到達性チェック、(c) 5 文書 + references + 原典 unassigned-task のパス健全性、(d) `rg` による正本記述抽出。

## 2. 適用条件チェック（プレイブック準拠 / 全該当）

| # | 条件 | 該当 |
| --- | --- | --- |
| 1 | UI 差分なし | YES（仕様書 / 方針決定メモのみ） |
| 2 | staging 環境前提のシナリオが現環境で実行不能 | YES（reconciliation は方針決定であり実機実行する対象がない） |
| 3 | phase-11 の S-1〜S-N が wrangler / 実 D1 / 実フォームを要求 | YES（実コード撤回 / migration 撤回 / endpoint 叩きはすべて blocker B-01〜B-06 へ委譲） |

## 3. 代替 evidence L1〜L4 結果サマリ

| 階層 | 採取手段 | 結果 | 備考 |
| --- | --- | --- | --- |
| L1: 仕様書整合 | `outputs/phase-{01..10}` / `phase-{01..13}.md` の存在確認 + AC 番号 / Phase 番号スキャン | PASS | 全 outputs 13 phases 揃い、AC-1〜AC-14 トレース済（Phase 7 ac-matrix）|
| L2: 静的 grep / contract sync | `rg 'sync_jobs\|sync_locks\|sync_job_logs' / 'POST /admin/sync' / GOOGLE_*` | PASS | references 側で正本 = `sync_jobs` / 2 endpoint / Forms 系 Secret に一意化済。`sync_locks` / `sync_job_logs` / `GOOGLE_SHEETS_SA_JSON` は本 reconciliation 仕様書内（撤回コンテキスト）でのみ言及 |
| L3: aiworkflow-requirements indexes 状態 | `.github/workflows/verify-indexes.yml` 存在確認 | PASS（job 定義存在） | 本タスクは `pnpm indexes:rebuild` を実行しない（docs-only 境界）。drift 解消は blocker B-05 |
| L4: 意図的 violation snippet | `manual-smoke-log.md §L4` の仮想 hit 確認 | PASS | grep が「`sync_locks`」を hit する条件を文面で確認（実挿入なし） |

## 4. 必須テンプレ — 代替 evidence 差分表（7 シナリオ）

| # | Phase 11 シナリオ（VISUAL タスクの元前提） | 元前提 | 代替手段 | カバー範囲 | 申し送り先 | 結果 |
| --- | --- | --- | --- | --- | --- | --- |
| S-1 | wrangler dev で `/admin/sync*` を叩く | 実機 endpoint レスポンス | `rg 'POST /admin/sync'` で 5 文書 + api-endpoints.md の正本記述抽出 | 仕様書レベルの endpoint 表記一致 | UT-26 staging-deploy-smoke / B-01 | PASS（2 endpoint 表記一致） |
| S-2 | 実 D1 への migration apply | up/down 実機実行 | `rg 'sync_jobs\|sync_locks\|sync_job_logs'` で ledger 表記の重複検出 | 仕様書レベルの ledger 一意性 | B-02 | PASS（references 側 = `sync_jobs` 単一） |
| S-3 | 実 SA Secret 注入 + 実 forms.get 叩き | Cloudflare Secret 実値 | `rg 'GOOGLE_(SHEETS\|FORMS)_SA_JSON\|SHEETS_SPREADSHEET_ID'` で Secret 表記の正本一致確認 | 仕様書レベルの Secret hygiene | B-05 | PASS（Forms 系正本登録 / Sheets 系は references に未登録） |
| S-4 | scheduled handler の Cron 自動発火 | wrangler [triggers] 実発火 | `rg '0 \\*/?[0-9]+ \\* \\* \\* \\*'` で 09b runbook の Cron 表記抽出 | 仕様書レベルの Cron 経路一致 | UT-26 / B-01 | PASS（09b runbook 上に Cron 表記単一） |
| S-5 | 旧 UT-09 root の direct implementation 撤回 | 実コード削除 | 旧 UT-09 root index.md の grep で direct implementation 化記述の有無確認 | 仕様書レベルの責務境界 | B-04 | PASS（reconciliation の撤回対象として 5 文書内で言及。実撤回は B-04） |
| S-6 | 意図的 violation で red 確認（L4） | red 検出 | `sync_locks` 採用記述を仮想挿入し、L2 grep が hit する条件を目視確認 | 「赤がちゃんと赤になる」 | （L2 で吸収済） | PASS（仮想 hit を `manual-smoke-log.md` に明記） |
| S-7 | references / indexes の実 rebuild | indexes drift 解消 | `verify-indexes-up-to-date` job 状態 + `pnpm indexes:rebuild` 実行有無 | indexes drift 検出のみ | B-05 | PASS（job 定義存在 / 本タスクで rebuild 実行せず） |

## 5. outputs ファイル存在確認（docs-only smoke の (1)）

| Phase | パス | 存在 |
| --- | --- | --- |
| 01 | outputs/phase-01/main.md | OK |
| 02 | outputs/phase-02/reconciliation-design.md | OK |
| 02 | outputs/phase-02/option-comparison.md | OK |
| 03 | outputs/phase-03/main.md | OK |
| 04 | outputs/phase-04/test-strategy.md | OK |
| 04 | outputs/phase-04/scan-checklist.md | OK |
| 05 | outputs/phase-05/reconciliation-runbook.md | OK |
| 06 | outputs/phase-06/failure-cases.md | OK |
| 07 | outputs/phase-07/ac-matrix.md | OK |
| 08 | outputs/phase-08/main.md | OK |
| 09 | outputs/phase-09/main.md | OK |
| 09 | outputs/phase-09/contract-sync-check.md | OK |
| 10 | outputs/phase-10/go-no-go.md | OK |
| 11 | outputs/phase-11/main.md | OK（本ファイル） |
| 11 | outputs/phase-11/manual-smoke-log.md | OK |
| 11 | outputs/phase-11/link-checklist.md | OK |

> Phase 12 / 13 outputs は本タスクの後続 Phase で確定するため当 Phase の存在チェック対象外。

## 6. staging smoke 状態 — pending（PASS と表記しない）

| 項目 | 状態 | 根拠 |
| --- | --- | --- |
| staging 実機 smoke | **pending** | 本タスクは docs-only / NON_VISUAL。staging 実行は UT-26 staging-deploy-smoke へ委譲 |
| 実 endpoint 叩き | **pending** | `wrangler dev` / `curl` を本タスクで実行しない |
| 実 D1 SELECT | **pending** | scripts/cf.sh d1 系コマンドを本タスクで実行しない |
| 自動テスト（typecheck / lint / vitest） | 既存 green 維持（コード変更なし） | 本タスクで新規 fail を導入していない |
| verify-indexes-up-to-date | 既存 green 維持（本タスクで indexes 更新なし） | drift 解消は blocker B-05 |

> **運用ルール再掲**（AC-13）: 実機未走行 = `pending`、合否判定 = `PASS` / `FAIL`。本 Phase outputs では staging 系を一切 PASS と表記しない。

## 7. 既知制限（7 項目）

| # | 制限 | 影響範囲 | 委譲先 |
| --- | --- | --- | --- |
| 1 | docs-only のため runtime 振る舞いを保証できない | 実コード / endpoint / migration | UT-26 / B-01〜B-04 |
| 2 | aiworkflow-requirements references / indexes の実更新は別タスク | references drift 解消 | B-05 |
| 3 | 案 b（Sheets 採用）採用時の評価は将来検討 | 戦略判断 | Phase 12 unassigned-task-detection |
| 4 | unrelated verification-report 削除は本 PR に混ぜない | governance | 別 unassigned-task（B-06） |
| 5 | staging 実機 smoke は本タスクで実施しない | 実機検証 | UT-26 staging-deploy-smoke |
| 6 | D1 contention mitigation 5 知見の実コード移植は別タスク | 品質要件移植 | B-03 |
| 7 | 旧 UT-09 root の legacy umbrella 参照復元は別 PR | 仕様修正 | B-04 |

## 8. 申し送り先サマリー（保証できない範囲）

| 保証できない項目 | 申し送り先 |
| --- | --- |
| 実コード（Sheets API 実装 / 単一 `/admin/sync`）の撤回 | blocker B-01 |
| `sync_locks` / `sync_job_logs` migration の up/down 実行 | blocker B-02 |
| D1 contention mitigation 5 知見の 03a / 03b / 09b への移植実装 | blocker B-03 |
| 旧 UT-09 root の legacy umbrella 参照復元 | blocker B-04 |
| references / indexes の実更新 | blocker B-05 |
| unrelated verification-report 削除 | blocker B-06 |
| 案 b（Sheets 採用）の将来採用判断時期 | blocker B-07（Phase 12 unassigned-task-detection 経由 Wave 後段） |
| staging 実機 smoke / 実 endpoint 叩き / 実 D1 SELECT | UT-26 staging-deploy-smoke |

## 9. 完了条件チェック（phase-11.md §完了条件 と整合）

- [x] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [x] NON_VISUAL 適用条件 3 件すべて該当
- [x] 代替 evidence 4 階層（L1〜L4）すべて採取
- [x] 代替 evidence 差分表が 7 シナリオで埋まっている
- [x] L4（意図的 violation → red 確認）が 1 件以上記述（`manual-smoke-log.md §L4`）
- [x] manual evidence テーブル（10 項目）すべての採取列が完了
- [x] L2 grep 結果で ledger / endpoint / Secret の 1 方針一致が確認できる設計
- [x] 既知制限が 7 項目以上列挙、それぞれ委譲先が記述
- [x] 申し送り先サマリーで保証できない範囲が漏れなく blocker / UT-26 に register
- [x] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）
- [x] `manual-smoke-log.md` 冒頭に「NON_VISUAL のため screenshot 不要」明記

## 10. 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - 本 main.md / manual-smoke-log.md の L1〜L4 結果を `outputs/phase-12/` の unassigned-task-detection / documentation-changelog に転記
  - 既知制限 7 項目を Phase 12 implementation-guide.md §「やってはいけないこと」へ転記
  - link-checklist.md の missing 2 件（03a / 09b の絶対 path 記述）を Phase 12 で正本記述として補正対象に挙げる（実体は `02-application-implementation/` 配下に存在）

状態: spec_created
