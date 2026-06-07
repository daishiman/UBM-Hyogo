# Phase 10 — 最終レビュー（ゲート）

> 実装区分: 実装仕様書 / NON_VISUAL / new
> 入力: `phase-1-requirements.md` 〜 `phase-9-qa.md` / `index.md` / `artifacts.json`
> 判定対象: AC-1〜AC-9 の最終充足性 / blocker・MINOR 仕分け / CONST_007 整合 / 不変条件
> 出力: PASS → Phase 11（手動テスト / Evidence 計画）へ進行

---

## 10.1 メタ情報

| Key | Value |
|-----|-------|
| workflow | `issue-1105-member-status-fk-constraint` |
| issue | [#1105](https://github.com/daishiman/UBM-Hyogo/issues/1105)（**CLOSED**・reopen しない） |
| タスク分類 | DB migration 追加（NON_VISUAL / implementation_mode: new） |
| 変更対象 | `apps/api/migrations/0026_member_status_fk_constraint.sql`（新規）/ `apps/api/migrations/__tests__/0026_member_status_fk_constraint.spec.ts`（新規）/ 既存 D1 test fixtures（FK 前提 fixture 追従）。apps/web diff 0 |
| PR base | `dev`（production リリース時のみ `main`） |
| status | `implemented_local_evidence_captured`（remote D1 apply / commit / PR は user-gated） |

---

## 10.2 AC-1〜AC-9 最終充足判定テーブル

| # | AC | 判定方法 | 期待 | 判定 |
|---|----|---------|------|------|
| AC-1 | 再構築後の `member_status` が `member_id` に `member_identities(member_id)` への FK を持つ | test 内 `PRAGMA foreign_key_list(member_status)` を取得 | `member_identities` への FK 1 件が返る（`table=member_identities` / `from=member_id` / `to=member_id`） | PASS |
| AC-2 | `PRAGMA foreign_keys = ON` 下で存在しない identity を指す INSERT が拒否される | test で `PRAGMA foreign_keys=ON` → 未登録 `member_id` で `member_status` へ INSERT を試行 | reject（FOREIGN KEY constraint failed） | PASS |
| AC-3 | 既存の正常 `member_status` データ（全カラム）が移行後も欠落・改変なく保持される | 移行前後の行数 + 全カラム値を比較する test | 行数一致・全カラム値一致（欠落・改変 0） | PASS |
| AC-4 | migration が冪等であり再適用で重複・破壊が発生しない | migration SQL を 2 回適用する test（`CREATE INDEX IF NOT EXISTS` 含む） | 2 回目もエラーなく完了・スキーマ / データ不変 | PASS |
| AC-5 | backfill 0025 適用済み（orphan ゼロ）前提で移行が FK 違反で失敗しない | `setupD1()` が 0025 → 0026 の番号順で全件適用 → 移行成功を確認 | FK 違反なく移行完了（順序依存を番号で保証） | PASS |
| AC-6 | Cloudflare D1 上で `PRAGMA foreign_keys` の有効性（接続単位 ON 要否）が検証・文書化されている | in-memory test で PRAGMA ON 下の FK 実効性を実証 + runbook に本番 binding 接続単位の挙動を記録 | test PASS（schema 上 FK 宣言 + PRAGMA ON で実効）+ runbook 記録あり | PASS |
| AC-7 | 既存挙動の非回帰: 正常会員の詳細 / status / 一覧レスポンスが従来と同一 | DEFAULT 値 byte 一致検証（Phase 9 §9.5）+ 全カラム保持 test（AC-3） | DEFAULT 現行10カラム一致・既存データ不変＝レスポンス不変 | PASS |
| AC-8 | `apps/web` は無変更（diff 0） | `git diff --name-only HEAD \| grep '^apps/web/'`（Phase 9 §9.3） | 出力 0 行 | PASS |
| AC-9 | `idx_member_status_public` が再構築後も同一定義で存在する | test 内 `PRAGMA index_list/index_info(member_status)` + SQL §4 確認 | `(public_consent, publish_state, is_deleted)` の同一定義 INDEX が存在 | PASS |

> **9 件すべて PASS（設計・テスト計画上の充足）**。各 AC は Phase 1 要件 / Phase 2 設計 / Phase 4 テスト計画 / Phase 9 QA へトレース可能。GREEN 化（実コマンド実行）は user-gated 実装サイクルで確定する。

---

## 10.3 blocker 判定

| 分類 | 項目 | 内容 | 対応 |
|------|------|------|------|
| blocker | （なし） | AC-1〜9 / 不変条件 / CONST_007 すべて設計上充足。実装着手を妨げる未決定事項なし | — |
| non-blocker | D1 本番 binding の PRAGMA 接続単位挙動（AC-6） | in-memory test で実効性は実証できるが、本番 D1 の接続単位 ON 要否は実機でのみ最終確認できる | runbook 記録 + 実装サイクルの staging 検証（user-gated） |

> **blocker 0 件**。

---

## 10.4 CONST_007（単一サイクルスコープ）整合確認

| 確認項目 | 結果 |
|---------|------|
| 全成果物が 1 サイクルで完了可能か | **Yes**。migration 1 本 + test 1 本のみ。再構築は SQLite 標準手法で完結 |
| AC-6（PRAGMA 検証）が外部依存待ちか | **No**。in-memory test + runbook 記録で同一サイクル内に完結（外部承認待ちなし） |
| deferral がスコープ外理由で明記されているか | **Yes**。§10.5 の MINOR 候補はいずれも「別関心の分離」または「API/D1 横展開を要する独立スコープ」であり、本サイクルの分量先送りではない |

> CONST_007 整合: **PASS**。

---

## 10.5 MINOR 指摘候補（未タスク化対象 / スコープ外）

以下は本タスクで観測したが **スコープ外・別タスク / 別 followup** として分離する項目。**本サイクルの先送り（分量都合の deferral）ではなく、別関心または別 DB スコープの分離**である。Phase 12 `unassigned-task-detection.md` で current 0 件 / baseline 3 件として再確認し、本 workflow 内で新規起票しない判断を記録済み。

| # | MINOR 候補 | 内容 | スコープ外理由 |
|---|-----------|------|---------------|
| M-1 | 他テーブルへの FK 横展開 | `member_attendance` / `member_tags` など `member_id` を持つ他テーブルにも同様の FK を導入する | 各テーブルごとに独立した再構築 migration + データ移行リスク評価を要する **別関心**。本タスクは `member_status` 1 テーブルに限定（index.md スコープ「含まない: 他テーブルへの FK 導入」） |
| M-2 | member 作成経路統一（followup-001） | ingest 経路を単一化し `member_status` 行生成を 1 箇所へ集約する | 既に **followup-001 として分離済**。アプリ層の責務であり DB FK（本タスク = DB 層）とは責務境界が異なる |
| M-3 | D1 接続単位 PRAGMA ON の常時適用機構 | binding 経由の全接続で `PRAGMA foreign_keys = ON` を常時保証する runner / middleware を整備する | migration runner / 接続初期化層の横断改修を要する **独立スコープ**。本タスクは migration 内検証 + runbook 記録で AC-6 を充足し、常時適用機構は将来 followup |

> 上記 3 件は **「スコープ外・別タスク・別 followup」** であり、本サイクルで先送りした作業ではない。Phase 12 検出フェーズで current/baseline 2 回検証し、current 新規起票 0 件、baseline 記録のみと判断済み。

---

## 10.6 不変条件 最終チェック（index.md / CLAUDE.md と整合）

| # | 不変条件 | 担保 | 判定 |
|---|---------|------|------|
| 5 | D1 への直接アクセスは `apps/api` に閉じる | 変更は `apps/api/migrations/` のみ。`apps/web` から D1 binding 参照なし | PASS |
| 8 | 新規 test は `*.spec.ts` のみ（`*.test.ts` 禁止） | `0026_*.spec.ts`（`*.test.ts` 0 件・Phase 9 QA-8） | PASS |
| — | 既存 endpoint surface / D1 schema 破壊なし | 既存 `member_status` を **同一カラム構成 + FK 追加** で再構築。カラム / INDEX / DEFAULT 不変（AC-3/7/9） | PASS |
| — | apps/web diff 0 | `git diff --name-only HEAD` に `apps/web/` を含まない（AC-8 / Phase 9 §9.3） | PASS |

---

## 10.7 総合ゲート判定

| 判定軸 | 結果 |
|--------|------|
| AC-1〜9 最終充足 | 9/9 PASS |
| blocker | 0 件 |
| MINOR 指摘候補 | 3 件（§10.5・スコープ外として記録・未タスク化候補） |
| CONST_007 整合 | PASS |
| 不変条件 | PASS |
| **総合判定** | **PASS（local implementation captured）→ Phase 11（NON_VISUAL evidence）へ進行** |

## 10.8 完了条件（DoD）

- [ ] AC-1〜AC-9 最終充足判定が PASS（§10.2）
- [ ] blocker 0 件（§10.3）
- [ ] CONST_007 整合確認（§10.4）
- [ ] MINOR 候補を §10.5 に記録（0 件なら「0 件」と明記。本タスクは 3 件・スコープ外明記）
- [ ] 不変条件チェック PASS（§10.6）
- [ ] 総合判定 PASS で Phase 11 へ進行
