# Phase 10: 最終レビュー

[実装区分: 実装仕様書]

> SSOT: [`shared-context.md`](./shared-context.md)。AC の正本は §8、DoD は §9、Phase 11 / capture 方針は §10。

## 1. AC チェックリスト（AC-1〜AC-10）

> 各 AC → 検証手段 → 想定結果。検証手段は [`phase-9-qa.md`](./phase-9-qa.md) の QA 番号と整合。

| AC | 内容（要約） | 検証手段 | 想定結果 |
|----|--------------|----------|----------|
| AC-1 | 「絞り込み」で `unrecognized_keys` / `batchId` ZodError が出ず parse 成功（Lane A） | `api.spec.ts`（QA-3）+ Phase 11 staging 操作 | ZodError throw されず履歴 parse 成功 |
| AC-2 | `SchemaAliasHistoryResponseZ.parse` が `appliedFilters.batchId`（string / null）を受理（Lane A/E） | `api.spec.ts`（QA-3） | string / null 双方の fixture で parse 成功 |
| AC-3 | 取得失敗時に raw JSON でなく日本語メッセージ表示（Lane B） | `schemaHistoryError.spec.ts` + panel spec（QA-3） | 「履歴データの形式が想定と一致しませんでした。…」等の日本語のみ |
| AC-4 | error 要素に `.schema-history-error` + OKLch token スタイル（Lane B） | panel spec（class 確認）+ verify-design-tokens（QA-3/QA-4） | `.schema-history-error` 付与 / HEX 0 |
| AC-5 | 冒頭に `data-testid="schema-history-purpose-explainer"`・流れ 3 + 用語集描画（Lane C） | `SchemaHistoryPurposeExplainer.component.spec.tsx`（QA-3） | explainer / 流れ 3 ステップ / 用語 4 件が描画 |
| AC-6 | page title「設問の紐付け履歴」/ description 平易化（Lane C） | typecheck（QA-1）+ Phase 11 visual | title / description が SSOT §6 の文言に一致 |
| AC-7 | 履歴が `.schema-history-card` カード形式で stableKey / 旧→新 / question / 日時・操作者を含む（Lane D） | panel card 描画 spec（QA-3） | EmptyState 以外でカードリスト描画・必須項目を含む |
| AC-8 | 当該 page/panel/explainer/globals.css に HEX 直書き 0 件（不変条件 #2） | verify-design-tokens（QA-4） | HEX 0 で PASS |
| AC-9 | `apps/api` の diff が空（不変条件 #5） | `git diff origin/dev...HEAD -- apps/api apps/api/migrations`（QA-5） | 出力 0 行 |
| AC-10 | typecheck / lint / 対象 web spec が全 PASS（Lane E） | QA-1 / QA-2 / QA-3 | すべて GREEN |

## 2. DoD 整合（SSOT §9）

| DoD | 状態（implemented_local_evidence_captured 時点） |
|-----|---------------------------|
| AC-1〜AC-10 をすべて満たす | local deterministic evidence で達成済み |
| 新規 product 3 + spec 3 作成 + 編集 5 ファイル反映 | 実ファイル反映済み |
| `verify-design-tokens` で HEX 0 件 | `pnpm verify:tokens` PASS |
| 対象 Vitest spec 群が GREEN | focused Vitest 4 files / 60 tests PASS |
| `git diff origin/dev...HEAD -- apps/api` が空 | QA-5 で gate |
| staging visual evidence（screenshot）取得 | Phase 11（user-gated） |
| commit / push / PR | Phase 13（user-gated） |

## 3. blocker 判定

**機能・設計上の blocker は 0 件。**

| 項目 | 区分 | 説明 |
|------|------|------|
| コード実装 | **完了** | apps/web 実装・focused tests・typecheck・token gate 完了 |
| runtime / staging 反映 | **予定された境界（blocker でない）** | staging deploy・実機での絞り込み動作確認は user-gated（Phase 11） |
| screenshot / visual evidence | **local 完了 / staging user-gated 境界（blocker でない）** | local screenshot 2 点は完了。authenticated staging screenshot 2 点は user-gated |
| commit / push / PR | **予定された境界（blocker でない）** | Phase 13 で user-gated |

> 未実施として残るのは external / runtime user-gated 操作のみ。設計（Phase 3）は PASS 判定済みで、未解決の設計矛盾・不変条件違反は無い。

## 4. MINOR 再掲（未タスク化対象 → Phase 12 へ送付）

> Phase 3 §4 で挙げた MINOR を、unassigned-task-guidelines（MINOR → 未タスク化）に従い未タスク化対象として再掲する。実施場所は Phase 12 [`unassigned-task-detection.md`]。

| ID | 指摘 | 未タスク化の理由 | 送付先 |
|----|------|------------------|--------|
| M-1 | `schemaHistoryGlossary`（history 専用）と先例 `schemaGlossary`（`/admin/schema` 専用・未マージ）が将来重複しうる | 本サイクルでは分離が正。両者マージ後に共通用語集へ統合する候補（未マージ依存のため本サイクル外） | Phase 12 `unassigned-task-detection.md` |
| M-2 | API `appliedFilters` の strict 化が web/api 双方で重複定義（shared 型化していない） | shared 化は API 接触かつスコープ拡大のため本サイクル外（CONST_007 例外条件 1） | Phase 12 `unassigned-task-detection.md` |

> M-1 / M-2 はいずれも「今サイクルで対応すると技術的・整合性的に破綻する（API 接触 / 未マージ依存）」ため分離が妥当。Phase 12 で unassigned-task として検出・記録し、未タスク化フローへ送る。

## 5. 最終判定

**PASS — implemented_local_evidence_captured として完了可能。**

- AC-1〜AC-10 は local deterministic evidence で確認済み。
- blocker は 0 件（staging runtime / authenticated screenshot / PR は予定された user-gated 境界）。
- MINOR 2 件（M-1 / M-2）は Phase 12 unassigned-task-detection へ送付。
- 後続は Phase 11 authenticated staging visual（user-gated）→ Phase 13 commit/PR（user-gated）の順で進める。
