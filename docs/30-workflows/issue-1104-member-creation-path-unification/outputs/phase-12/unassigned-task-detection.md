# Unassigned Task Detection — issue-1104

- 区分: 実装仕様書（NON_VISUAL / implemented_local_evidence_captured）
- 判定: **新規未タスク 0 件**

---

## current / baseline 分離 [Task 4]

| 区分 | 内容 |
| --- | --- |
| current（本タスク完了で残る新規未タスク） | **0 件**。本タスク scope 内で F-1〜F-5（単一 helper + ingest/auto-link 差し替え + tests）が 1 サイクル完結（CONST_007）。スコープ外に切り出すべき独立タスクは検出されない |
| baseline（既存分離・参照のみ・再起票しない） | (1) source unassigned-task `admin-member-detail-status-404-fix-followup-001-...`（= 本 workflow が consume 済み）(2) `followup-002`（`member_status.member_id` → `member_identities` FK 制約・DB 層整合性・既存分離済み） |

## 関連タスク差分確認（FB-CANCEL-004-2・重複起票防止）

既存 `admin-member-detail-status-404-fix-followup` 系との重複チェック:

| followup | 概要 | 本タスクとの重複 |
| --- | --- | --- |
| `admin-member-detail-status-404-fix-followup-001-member-creation-path-unification` | member 作成経路統一（= 本タスク） | **consumed**（本 workflow が昇格・新規起票不要） |
| `followup-002`（FK 制約: `member_status.member_id` → `member_identities`） | DB 層の整合性保証（FK 制約導入） | **scope-out（既存分離済み）**。本タスクはアプリ層の生成責務集約に限定（AC-7）。DB 層の FK は別関心であり、すでに別 Issue / followup として分離合意済み。**本タスクで新たに起票しない（重複起票しない）** |

→ followup-002 は **本タスク scope-out であり新規未タスクではない**。既存の合意済み境界（CONST_007 の正当な分離条件）として参照するのみで、重複起票はしない。

## 検出ソース表

| 検出ソース | 検出結果 | 未タスク化 |
| --- | --- | --- |
| 元タスク（source unassigned-task）スコープ外項目 | member 生成責務の単一 helper 集約に限定。スコープ外残件は FK 制約のみ → followup-002 として既存分離済み | 0 件（既存分離・再起票しない） |
| Phase 3 リスク / 緩和（minor 指摘） | auto-link レイテンシ・命名衝突・AC-3 誤読・既存 spec 回帰・followup-002 二重対応 — いずれも本サイクル内で緩和策に吸収。独立タスク化対象なし | 0 件 |
| Phase 10 MINOR 候補 | （最終レビューは AC 充足判定・blocker 0 / 独立未タスク候補なし） | 0 件 |
| Phase 11（手動テスト由来） | local deterministic evidence は実行済み（focused D1 tests 5 files / 51 tests PASS、typecheck/lint PASS）。staging 手動確認のみ user-gated pending。新規未タスク派生なし | 0 件 |
| コードコメント TODO / FIXME | `createMemberWithStatus` は実装済み。既存 `members.ts` / `identities.ts` / `sync-forms-responses.ts` / `member-status.ts` に本タスク由来の新規 TODO 残置なし | 0 件 |
| `describe.skip` / テスト skip | 該当なし（focused tests 実装・skip なし） | 0 件 |

## 判定根拠（新規未タスク 0 件）

1. **source unassigned-task は本 workflow が consume 済み** → 再起票しない。
2. **followup-002（FK 制約）は既存分離済み** → 本タスク scope-out であり、DB 層の整合性保証として別関心。すでに合意済みの境界のため新規未タスクではなく、重複起票しない。
3. **F-1〜F-5 は 1 サイクル完結（CONST_007）** → スコープ外に切り出すべき独立タスクは検出されない。
4. **Phase 3 リスク / Phase 10 / Phase 11 / コードコメント / テスト skip 由来の検出はすべて 0 件**（local deterministic evidence は取得済みで、staging 手動確認のみ user-gated 境界として分離済み）。

→ **新規未タスク 0 件**（current 0 / baseline は consumed source + 既存分離 followup-002 を参照のみ）。新規 Issue / spec は作成しない。
