# Phase 10: 最終レビューゲート

## メタ情報

| 項目 | 値 |
|------|-----|
| taskId | TASK-MEMBERS-SEARCH-CLEAR-AND-SORT-UX-001 |
| Phase | 10 / 13 |
| 前提 | Phase 7-9 完了（カバレッジ / リファクタ / QA green） |
| ゲート種別 | AC-1..AC-10 全 PASS 判定 + blocker 有無 + partial fix 不在確認 |

## 目的

受入条件 AC-1〜AC-10 を全件 PASS/FAIL で判定し、blocker の有無を確定する。partial fix（案件 A だけ・sort 3 層のうち 2 層だけ等の中途半端な修正）が無いこと、五十音順非対応（OOS-1）が consumer に誤解を生まない形で記録されていることを確認し、Phase 11（手動テスト）への進行判定を PASS / CONDITIONAL で記録する。

## 実行タスク

### T10-1 AC 全件判定表

| ID | 受入条件（要約） | 判定 | 根拠 / 検証 Phase |
|----|-----------------|------|------------------|
| AC-1 | クリア（×）は 1 つだけ（ネイティブ× CSS 抑止 + 独自×のみ） | PASS | `globals.css` の `.ui-search__input::-webkit-search-cancel-button/decoration` 抑止（Phase 9 T9-2 grep）+ Phase 11 VISUAL（Chromium）実描画 |
| AC-2 | 独自×は値空で非表示・値ありで表示、クリックで IME 安全 commit、`aria-label="クリア"` 保持 | PASS | `Search.spec.tsx`（値空/値あり 2 分岐・aria-label アサーション）Phase 7 T7-1 #1 |
| AC-3 | ソート 4 種（新しい順/古い順/名前順/名前の逆順）、「並び替え: 」接頭辞除去 | PASS | `MemberFilters.client.spec.tsx`（option 数=4 + ラベル文言）Phase 7 T7-1 #4 |
| AC-4 | `oldest` で `last_submitted_at` 昇順（最古先頭）・ページ跨ぎ一貫 | PASS | `publicMembers.repository.spec.ts`（D1 順序アサート）Phase 7 T7-2 |
| AC-5 | `name_desc` で `fullName` 降順 | PASS | `publicMembers.repository.spec.ts`（D1 順序アサート）Phase 7 T7-2 |
| AC-6 | 不正 sort 値は `recent` フォールバック（web zod catch / api DEFAULT） | PASS | `members-search.spec.ts` / `search-query-parser.spec.ts` 不正値→recent Phase 7 T7-1 #3,#5 |
| AC-7 | デフォルト（sort 無し）は `recent`、`recent` は URL から省略 | PASS | `members-search.spec.ts`（`toApiQuery` の `if sort !== "recent"` 分岐）Phase 7 T7-1 #3 |
| AC-8 | `appliedQuery.sort` enum が 4 値受理・API レスポンス検証通過 | PASS | `viewmodel.spec.ts`（4 値受理 + 不正値 reject）Phase 7 T7-1 #7 |
| AC-9 | 新規エンドポイント追加・D1 schema 変更・Google Form 変更を行わない | PASS | 既存 `/public/members` の sort 拡張のみ。`git diff` で migrations / 新 route ファイル 0。Phase 9 確認 |
| AC-10 | HEX 直書き禁止遵守、追加 CSS は `::-webkit-search-cancel-button` 抑止のみ色値なし | PASS | `pnpm verify:tokens` exit 0 + 色値 grep 0 hit（Phase 9 T9-2） |

### T10-2 partial fix 不在の確認

| 観点 | 確認 |
|------|------|
| 案件 A / 案件 B 両方完了 | 案件 A（×重複）と案件 B（sort 4 値）が同一 wave で完了。片方のみの中途状態でないこと（7 ファイル全変更が landed） |
| sort 3 層フル同期 | web `SORT_VALUES` / api `SortZ` / shared `viewmodel.sort` の 3 層すべてが 4 値（2 層止まりでない）。Phase 9 T9-3 grep で 3 層一致確認済み |
| ORDER BY 4 分岐フル実装 | recent/oldest/name/name_desc の 4 case すべて実装（2 case 止まりでない）。Phase 7 T7-2 で 4 分岐到達 |
| UI ラベルと API enum の整合 | `SORT_OPTIONS` の 4 value が API enum 4 値と文字列一致（drift なし） |

### T10-3 五十音順非対応（OOS-1）の consumer 誤解防止確認

- UI ラベル「名前順 / 名前の逆順」が方式中立であり、「五十音順」と明示していないこと（`MemberFilters.client.tsx:39-42` 確認）。
- `name` / `name_desc` が `fullName` の Unicode 文字コード順（SQLite 既定 COLLATE）であり真の五十音順でないことが index.md「ソート値マッピング」脚注 + phase-2 T2-3「五十音順の限界」に明記されていること。
- OOS-1（ふりがな設問追加による真の五十音順）が Phase 12 `unassigned-task-detection` で current 未タスクとして formalize され Issue 起票候補となること（Google Form schema 変更 + 全会員 backfill は CONST_007 正当分離）。
- consumer（会員・管理者）が「名前順 = 五十音順」と誤解した場合でも、漢字氏名がコード順で並ぶ事実が仕様で説明可能であること。

### T10-4 MINOR 指摘の Phase 12 未タスク化

- blocker（AC FAIL）が 1 件でもあれば Phase 11 へ進めず Phase 5 へ差し戻す。
- MINOR（AC に影響しない改善余地。例: Firefox/Safari は元々ネイティブ×非表示のため CSS 抑止が no-op だが害なし / 他 admin 画面への波及検証は OOS-2）は Phase 12 の `unassigned-task-detection` で記録し、本タスクをブロックしない（unassigned-task-guidelines）。

### T10-5 進行判定

- 全 AC が PASS かつ blocker なし → 判定 **PASS**（Phase 11 進行可）。
- VISUAL 証跡（Phase 11 Chromium 実描画）が本ウェーブで user-gated のため、ユニット/contract が全 green の段階では判定 **PASS（VISUAL 確認を Phase 11 で必須とする CONDITIONAL でない PASS）** とする。AC-1 のネイティブ×実非表示のみ jsdom 非評価であり Phase 11 で最終確認。

## 参照資料

- [index.md](index.md)（AC-1..AC-10 集約 / ソート値マッピング / OOS-1）
- [phase-3-design-review.md](phase-3-design-review.md)（4 条件評価・リスク対策）
- [phase-7-coverage-check.md](phase-7-coverage-check.md)（変更ブロック到達・ORDER BY 4 分岐）
- [phase-8-refactoring.md](phase-8-refactoring.md)（R1/R2 責務不変）
- [phase-9-quality-assurance.md](phase-9-quality-assurance.md)（tokens / lint / 3層enum / mirror parity）
- `unassigned-task-guidelines`（MINOR / OOS-1 の Phase 12 未タスク化方針）

## 成果物

- AC-1..AC-10 全件判定表（T10-1）
- partial fix 不在確認表（T10-2）
- 五十音順非対応の consumer 誤解防止確認（T10-3）
- 進行判定 PASS（T10-5）

## 統合テスト連携

最終ゲートで AC-1〜AC-10 と T1〜T7 の対応を全件突合する。全層（web ユニット / api ユニット / shared / D1 contract / VISUAL pending / tokens gate）の結合結果が PASS であることをレビュー対象とする。partial fix が無いことを consumer 層まで確認する。

## 完了条件

- [ ] AC-1〜AC-10 が PASS/FAIL で全件判定され、全件 PASS であることが記録されている
- [ ] blocker（AC FAIL）が無いことが明記されている
- [ ] partial fix（案件片方のみ / sort 2 層止まり / ORDER BY 2 分岐止まり）が無いことが確認されている
- [ ] 五十音順非対応（OOS-1）が consumer に誤解を生まない形（ラベル中立 + 仕様明記 + 未タスク化）で記録されている
- [ ] MINOR 指摘が Phase 12 未タスク化対象として整理され本タスクをブロックしないことが明記されている
- [ ] Phase 11 への進行判定が PASS / CONDITIONAL のいずれかで記録されている（本タスクは PASS）
