# Phase 6: テスト追加（fail path / 回帰ガード / 境界値）

- Phase 目的: Phase 4 の happy path に加え、境界値・fail path・回帰ガードを拡充し、businessSummary truncate と tag 選抜の堅牢性を固定する。
- 入力: Phase 4（基本ケース）、Phase 5（実装シグネチャ `toBusinessSummary` / `selectCardTags` / `normalizeTagLabel`）。
- 出力: 本ファイル（追加 test ケース）。同一 spec ファイルに追記する（新規ファイルは作らない）。

## 6.0 共通方針

- 追加先は Phase 4 の 3 spec（`tag-display.spec.ts` / `MemberCard.spec.tsx` / `list-public-members.spec.ts`）。
- **[Feedback W0-RV-001]** 境界文字列ケースは、文字列リテラルの実 length をコメントで明示する（例: `// 120 chars`）。`"あ".repeat(120)` のように生成し、`expect(input.length).toBe(120)` を assert に含めて長さ前提を裏取りする。

## 6.1 `list-public-members.spec.ts` 追加（businessSummary 境界値・AC-5）

| ケース | 入力 `businessOverview` | expected | 備考 |
| --- | --- | --- | --- |
| TC-A-08 | ちょうど 120 字（`"あ".repeat(120)`） | そのまま 120 字・末尾 `…` **無し**（`> 120` 判定のため境界は truncate しない） | `expect(raw.length).toBe(120)` を併記 |
| TC-A-09 | 121 字（`"あ".repeat(121)`） | 先頭 120 字 + `…`（出力 length = 121。`…` 1 文字込み） | `expect(raw.length).toBe(121)` / `expect(out.length).toBe(121)` を併記 |
| TC-A-10 | 改行のみ（`"\n"` / `"\r\n"`） | `businessSummary` キー無し（先頭行が空 → trim 後空 → undefined） | `\r?\n` 分割の裏取り |
| TC-A-11 | 先頭行が空白のみ（`"   \n本文"`） | `businessSummary` キー無し（先頭行 trim で空 → undefined。2 行目は採用しない） | first line のみ・trim |
| TC-A-12 | 先頭行に本文 + 2 行目あり（`"事業概要\n詳細詳細"`） | `"事業概要"`（先頭 1 行のみ） | TC-A-02 の強化 |

> truncate の実装契約（Phase 5 §B1）: `raw.split(/\r?\n/)[0].trim()` → 空なら undefined → `length > 120` で `slice(0,120)+"…"`。

## 6.2 `tag-display.spec.ts` 追加（fail path / 境界・AC-1/AC-2）

| ケース | 入力 | expected | 備考 |
| --- | --- | --- | --- |
| TC-U-19 | `normalizeTagLabel({code:"", label:""})` | `""`（未知 code・空 label fallback） | label fallback の境界 |
| TC-U-20 | `normalizeTagLabel({code:"unknown_x", label:"既存ラベル"})` | `"既存ラベル"`（label fallback 明示・[Feedback W0-RV-001] 既知 override 表に無い code） | AC-1 fallback |
| TC-U-21 | `selectCardTags` に同 category 複数（business×4）を comfy | rest 上限 3 件で打ち切り（4 件目は捨てる）・code 昇順 | 件数上限の fail path |
| TC-U-22 | interest を 2 件含む配列を comfy | phase は `slice(0,1)` で 1 件のみ（2 件目 interest は出さない） | phase 単数化の裏取り |
| TC-U-23 | `selectCardTags(tags 全部 region)` で comfy/dense/list 全 density | いずれも `[]`（カード 0 件） | AC-2/AC-6 全除外 |

## 6.3 `MemberCard.spec.tsx` 追加（回帰ガード / density・AC-5/AC-6）

| ケース | 条件 | expected | 備考 |
| --- | --- | --- | --- |
| TC-C-11 | density=list / `businessSummary` あり | `[data-role="biz-summary"]` **非存在**（list は business summary を出さない） | AC-6 情報過多回避の回帰ガード |
| TC-C-12 | density=list / tags 多数 | `[data-role="tag-chip"]` は phase 1 件のみ・business/skill chip 非存在 | AC-4 list |
| TC-C-13 | `tags` 全部 region / comfy | `[data-role="tag-row"]` 非存在 or 子 0（curated 0 件） | AC-2/AC-6 回帰 |
| TC-C-14 | `businessSummary=""`（空文字 props） | `[data-role="biz-summary"]` 非存在（falsy ガード） | AC-5 null/空ガード |

## 6.4 `TagPicker` topTags 正規化 回帰（AC-7）

TagPicker の topTags chip label が `normalizeTagLabel` で正規化されることを spec で固定する。追加先は `apps/web/src/components/public/__tests__/TagPicker.client.spec.tsx`（既存あれば追記・無ければ新規）。

| ケース | 条件（options props） | expected DOM | 備考 |
| --- | --- | --- | --- |
| TC-P-01 | `options=[{code:"int_0to1", label:"0to1", count:3}]` | chip テキストに `#0→1`（矢印）が含まれ、`#0to1`（生 label）は**含まれない** | AC-7・ユーザーが見た「0 to 1」箇所の修正裏取り |
| TC-P-02 | `options=[{code:"business_it", label:"IT", count:2}]`（未知 override） | chip テキストに `#IT`（label fallback そのまま） | 正規化が interest 以外を壊さない回帰 |
| TC-P-03 | count 表示が `(3)` 形式で維持される（既存挙動回帰） | `[data-role="tag-count"]` に `(3)` | 既存表示の非破壊 |

> 実行: `mise exec -- pnpm exec vitest run --root=. apps/web/src/components/public`（Phase 4 §4.5 の web コマンドに含まれる）。

## 6.5 AC trace（Phase 6）

| AC | 担保 test |
| --- | --- |
| AC-1 | TC-U-19・20 |
| AC-2 | TC-U-21..23 / TC-C-13 |
| AC-4 | TC-U-21・22 / TC-C-12 |
| AC-5 | TC-A-08..12 / TC-C-14 |
| AC-6 | TC-C-11..13 / TC-U-23 |
| AC-7 | TC-P-01..03 |

## Canonical Compliance Addendum

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`

## 目的

本 Phase の上部本文を正本とし、AC-1..AC-9 を実コード・テスト・証跡へ接続する。

## 実行タスク

- [x] Phase 本文の該当タスクを完了
- [x] 実装対象・検証対象を AC trace に接続
- [x] Phase 12 / artifacts の状態語彙と整合

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物/実行手順

本ファイル本文の手順と `artifacts.json.metadata.verify_commands` を正本とする。実装済み成果物は `apps/web` / `apps/api` / `packages/shared` と Phase 11 / 12 outputs に反映済み。

## 完了条件

- [x] AC trace が維持されている
- [x] focused tests が PASS している
- [x] Phase 11 local visual evidence が存在する
- [x] Phase 12 strict 7 が存在する

## 統合テスト連携

focused Vitest 6 files / 50 tests PASS を主証跡とし、typecheck / lint / verify:tokens / verify:phase12-compliance / gate-metadata を全体 gate とする。

