# Phase 7: AC マトリクス（Phase 1 AC × Phase 4 検証 × Phase 5 ランブック）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| Wave | legacy-closeout |
| Mode | docs-only / spec_created / NON_VISUAL |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

元仕様 §5 完了条件チェックリスト（Phase 1 で AC-1〜AC-14 として確定済）を
Phase 4 verify suite × Phase 5 runbook step × Phase 6 failure case の 4 軸
matrix に展開し、空白セルを 0 にする。各 AC が Phase 4 のどのテストで検証
され、Phase 5 のどの手順で達成されるかをセル単位で対応付ける。

## 実行タスク

1. positive AC matrix（AC-1〜AC-14 × verify suite × runbook step × 不変条件）作成
2. negative AC matrix（FD-1〜FD-8 × verify suite × runbook step × mitigation）作成
3. 空白セル check（positive 12 × 4 列 = 48 セル / negative 8 × 4 列 = 32 セル）
4. 不変条件 #1 / #5 / #6 / #10 が positive matrix に紐付いているかの確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | §5 完了条件 (AC) |
| 必須 | docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-04.md | verify suite ID (D-/M-/S-/C-) |
| 必須 | docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-05.md | runbook step ID |
| 必須 | docs/30-workflows/task-sync-forms-d1-legacy-umbrella-001/phase-06.md | failure case (FD-) |

## 実行手順

### ステップ 1: positive AC matrix

下記「AC matrix（positive）」表を確定。

### ステップ 2: negative AC matrix

下記「AC matrix（negative）」表を確定。

### ステップ 3: 空白セル check

`outputs/phase-07/ac-matrix.md` 末尾に空白セル数 0 を明記。

### ステップ 4: 不変条件カバレッジ確認

#1 / #5 / #6 / #10 が positive matrix の少なくとも 1 行で紐付け済みである
ことを「不変条件 → AC」逆引き表で確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | DRY 化対象 (path / endpoint / table / branch ↔ env) と AC の対応を継承 |
| Phase 10 | GO/NO-GO 判定根拠 |
| Phase 11 | manual evidence の checklist として AC matrix を再利用 |
| 上流 03a / 03b / 04c / 09b | 各タスクの AC matrix と用語整合 |

## 多角的チェック観点（不変条件）

- AC-3 ↔ #1（Forms API 統一）/ AC-9 ↔ #5（D1 直接アクセス禁止）
- AC-7 ↔ 09b 移植要件（GAS trigger 不採用 = #6 連動）
- 無料枠 #10 は 09b 配下の cron 頻度試算に依存し、本タスクでは AC-7 経由で
  間接担保される旨を matrix 注記欄に明示

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | positive AC matrix | 7 | pending | 12 行 |
| 2 | negative AC matrix | 7 | pending | 7 行 |
| 3 | 空白セル check | 7 | pending | 0 件 |
| 4 | 不変条件カバレッジ | 7 | pending | #1 / #5 / #6 / #10 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | matrix サマリ |
| ドキュメント | outputs/phase-07/ac-matrix.md | positive / negative matrix |
| メタ | artifacts.json | Phase 7 を completed に更新 |

## 完了条件

- [ ] positive 12 行すべて埋まっている
- [ ] negative 8 行すべて埋まっている
- [ ] 空白セル 0 件
- [ ] 不変条件 #1 / #5 / #6 / #10 が逆引き可能

## タスク100%実行確認【必須】

- 全実行タスク (1〜4) が completed
- ac-matrix.md が outputs/phase-07/ に配置
- artifacts.json の phase 7 を completed に更新

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項: ac-matrix.md / 不変条件逆引き
- ブロック条件: 空白セルが 1 件でも残る場合、または不変条件 #1 / #5 / #6 /
  #10 のいずれかが matrix で紐付かない場合は次 Phase に進まない

---

## AC matrix（positive: 14 行）

| AC | 内容（元仕様 §5） | Phase 4 verify suite | Phase 5 runbook step | 不変条件 | 参照 specs（逆引き） |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 旧 UT-09 が direct implementation ではなく legacy umbrella として扱われる | D-1, D-3, S-1 | quality-port Diff A | - | specs/00-overview.md |
| AC-2 | 実装対象が 03a / 03b / 04c / 09b に分解されている | M-1, M-2, M-3, M-4 | dependency-mapping Step 1〜4 | - | specs/00-overview.md |
| AC-3 | Google Forms API 前提に統一（Sheets API 不採用） | S-2 | stale-audit Step 2 | #1 | specs/01-api-schema.md |
| AC-4 | `/admin/sync/schema` / `/admin/sync/responses` を正、単一 `/admin/sync` 不採用 | S-3, M-3 | stale-audit Step 2 / dependency-mapping Step 3 | - | specs/03-data-fetching.md / specs/13-mvp-auth.md |
| AC-5 | SQLITE_BUSY retry/backoff、短 transaction、batch-size 制限が 03a/03b の異常系で追跡 | M-1, M-2 | quality-port Diff B, Diff C | - | specs/08-free-database.md |
| AC-6 | sync_jobs 同種 job 排他で 409 Conflict 統一 | S-3, M-3 | quality-port Diff D | - | specs/03-data-fetching.md |
| AC-7 | Workers Cron Triggers が 09b runbook で pause / resume / evidence まで記録 | M-4 | quality-port Diff D / dependency-mapping Step 4 | #6, #10（間接） | specs/03-data-fetching.md / specs/08-free-database.md |
| AC-8 | `dev branch -> staging env` / `main branch -> production/top-level env` を明記 | S-4 | stale-audit Step 3 | - | - |
| AC-9 | apps/web から D1 直接アクセスしない | S-3 / FD-7 検出（再走時） | stale-audit Step 1〜2 / 検証 Step 4 | #5 | specs/08-free-database.md |
| AC-10 | 未タスクテンプレートの必須 9 セクションを満たす | D-1 | verification Step 1 | - | - |
| AC-11 | filename が lowercase / hyphen の監査規則を満たす | D-2 | verification Step 1 | - | - |
| AC-12 | stale な `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` を作らない | S-1 | verification Step 2 | - | - |
| AC-13 | specs/01 / specs/03 / specs/08 と矛盾しない | SP-1, SP-2, SP-3 | stale-audit Step 2 / quality-port Diff B/C/D | #1, #5 | specs/01-api-schema.md / specs/03-data-fetching.md / specs/08-free-database.md |
| AC-14 | Phase 13 commit / PR はユーザー承認まで実行しない | D-3 | approval-gate Step | - | CLAUDE.md / phase-13.md |

## AC matrix（negative: 7 行）

| Failure | 検出 verify suite | 検出 runbook step | mitigation | 不変条件 |
| --- | --- | --- | --- | --- |
| FD-1 ドキュメント矛盾 (Sheets API 残存) | S-2 | stale-audit Step 2 | hit を Forms API 表記に置換 / 03a / 03b に追記 | #1 |
| FD-2 責務移管漏れ | M-1〜M-4 | dependency-mapping Step 1〜4 | 不足タスクへ追記タスクを起票 | - |
| FD-3 二重正本（単一 `/admin/sync`） | S-3 | stale-audit Step 2 | `/admin/sync/schema` / `/admin/sync/responses` に置換 | - |
| FD-4 sync_audit と sync_jobs 混同 | S-3 | stale-audit Step 2 | `sync_jobs` に置換 / 02c 参照 | - |
| FD-5 D1 PRAGMA 誤実行（WAL） | (Phase 6 PRAGMA scan) | quality-port Diff B/C / verification Step 3 | hit 行削除、retry/backoff 表現に置換 | #5（D1 取扱） |
| FD-6 `dev / main 環境` 表記の退行 | S-4 | stale-audit Step 3 | branch ↔ env 表記に置換 | - |
| FD-7 apps/web から D1 直接アクセス記述 | (Phase 6 FD-7 scan) | stale-audit Step 1〜2 | `apps/api` 限定に修正 / 02c に差し戻し | #5 |

## 不変条件 → AC 逆引き

| 不変条件 | 紐付く AC / FD |
| --- | --- |
| #1（schema 固定しすぎない） | AC-3 / FD-1 |
| #5（D1 直接アクセスは apps/api 限定） | AC-9 / FD-5 / FD-7 |
| #6（GAS prototype 非昇格） | AC-7（09b runbook で GAS trigger を採用しない注記） |
| #10（無料枠運用） | AC-7（cron 頻度試算が 09b に存在することで間接担保） |

## 空白セル check

- positive 12 行 × 4 列 = 48 セル → 全埋め
- negative 8 行 × 4 列 = 32 セル → 全埋め
- 合計 76 セル空白 0 件
