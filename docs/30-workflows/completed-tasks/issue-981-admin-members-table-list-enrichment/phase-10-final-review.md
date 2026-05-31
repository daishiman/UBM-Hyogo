# Phase 10: 最終レビュー（Gate-B 相当）

> workflow: `issue-981-admin-members-table-list-enrichment`
> task type: UI task / VISUAL_ON_EXECUTION
> workflow_state: `implemented_local_evidence_captured`（local implementation + focused test 完了。commit / PR / staging visual は user-gated）

## 1. 位置づけ

本ファイルは Gate-B（最終レビュー）の **判定結果** を定義する。automation-30 改善サイクルで実コードと focused spec を反映し、`MembersTable.spec.tsx` 21 tests PASS を確認済み。

## 2. 受入条件 充足判定テーブル

| AC | 観点 | 判定基準（PASS 条件） | 確認手段 |
| --- | --- | --- | --- |
| AC-2a | occupation 描画 | `MembersTable` のメンバー列で氏名 button 下に occupation small text が描画される。未指定時は描画しない | TC-MT-06 / TC-MT-07 PASS |
| AC-2b | zone chip 描画 | 「区画/ステータス」列に `zoneTone(ubmZone)` で着色した zone chip（dot 付）が追加される。既存 `MemberStateChipRow` は維持 | TC-MT-08 / TC-MT-14 / TC-MT-19 PASS |
| AC-2c | type chip 描画 | 同列に `statusTone(ubmMembershipType)` で着色した type chip（dot なし）が追加される | TC-MT-09 / TC-MT-15 PASS |
| AC-2d | tag pill 描画 | タグ列が placeholder「—」から tag pill（最大2件 + `+N`）へ置換。空/undefined は「未タグ」warning chip（dot 付） | TC-MT-10 / TC-MT-11 / TC-MT-12 / TC-MT-16 / TC-MT-17 PASS |
| AC-4 | tag pill 非編集 | tag pill は表示専用で編集 UI を持たない（write は別 Issue #982 スコープ） | コードレビュー（onClick/編集 handler 不在） |
| AC-5 | typecheck | `mise exec -- pnpm typecheck` が green | typecheck 実行 |
| AC-6 | regression なし | 既存 TC-MT-01〜05 + a11y violations 0 が PASS のまま。`MembersTableProps` 不変・`MembersClientShell` 改修不要 | targeted spec 実行 / TC-MT-20 PASS |

> 実行コマンド: `mise exec -- pnpm --filter @ubm-hyogo/web test apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`

## 3. blocker 有無の判定基準

以下のいずれかに該当する場合、blocker として Phase 11 への進行を停止する。

- AC-2a〜2d のいずれかが描画されない、または `Chip` / `zoneTone` / `statusTone` 以外の新規 primitive を追加している（プロトタイプ正本・新規 primitive ゼロ条件違反）。
- 既存 TC-MT-01〜05 または a11y violations 0 が回帰している（AC-6 違反）。
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入している（design token 正本・`verify-design-tokens` fail）。
- `apps/api` / D1 / shared schema へ変更が混入している（既存 API 不変条件違反 / データ層は #968 既実装）。
- `MembersTableProps` を破壊変更し、`MembersClientShell` 等の呼び出し側が改修必要になっている。

blocker が 1 件もない場合のみ Gate-B PASS とする。

## 4. MINOR 指摘の引き継ぎ

Phase 3 で記録した MINOR 指摘を、Phase 12 `unassigned-task-detection.md` へ判定結果として引き継ぐ。

| ID | 内容 | 扱い |
| --- | --- | --- |
| M-1 | zone / membershipType の人間可読ラベル辞書化（例 `0_to_1` → 「0〜1名規模」） | no-task。Issue #981 AC / prototype が raw 値描画を要求するため、同サイクル実装すると仕様と衝突する |
| M-2 | tag pill overflow `+N` ホバーで全タグ tooltip 表示 | 同サイクル内で `title` 付与 + TC-MT-17 で解消 |

> MINOR は機能に影響しないだけでは不要判定しない。M-1 は raw 表示 AC との整合性で no-task、M-2 は実装済み。Issue #982（tag write）/ #983（photo）とは別主題のため重複登録しない。

## 5. レビュー総括観点

- 価値性: drawer を開かず list 上で職業 / 区画 / タグを把握できる（親 hold 解消）。
- 整合性: API 不変・プロトタイプ正本（`pages-admin.jsx` L223-276）準拠・責務を UI 層に閉じる。
- 運用性: 既存 spec 拡張で回帰 guard。CI gate（`verify-design-tokens` / typecheck）既存で担保。

## 完了条件

- [ ] AC-2a/b/c/d / AC-4 / AC-5 / AC-6 の充足判定テーブルが定義された
- [ ] blocker 判定基準が列挙された
- [ ] MINOR 指摘 M-1 / M-2 の Phase 12 判定が引き継がれた
- [ ]「機能に影響なし」を不要判定の理由にしない旨が明記された
- [x] Gate-B PASS/FAIL の総括観点が記録された
