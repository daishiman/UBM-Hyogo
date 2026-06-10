# Phase 4: テスト計画（RED→GREEN / TDD 設計）

- Phase 目的: 各実装 lane（util / MemberCard / list projection / TagPicker）に対する test suite と expected result を確定し、Phase 5 実装が満たすべき RED→GREEN の受入を固定する。
- 入力: Phase 1（AC-1..AC-9）、Phase 2 設計（`tag-display.ts` シグネチャ / MemberCard JSX 差分 / `toBusinessSummary`）、`_shared-context.md` の grounded facts と実コード line。
- 出力: 本ファイル（test ファイル一覧・ケース・実行コマンド・expected result）。

## 4.0 前提（テスト実行前に必須・[FB-MSO-002]）

テスト実行前に依存と esbuild 整合を確認する。worktree ごとに `node_modules` が独立するため、初回・Node バージョン変更後は必ず実行する。

```bash
mise exec -- pnpm install                 # worktree ローカル依存（lefthook install も prepare で走る）
mise exec -- pnpm verify:vitest-runtime   # arch / worktree isolation / esbuild version の 3 verify
```

> Vitest / esbuild runtime トラブル時は `docs/30-workflows/issue-747-vitest-esbuild-arch-and-worktree-isolation/runbook.md` を参照。

## 4.1 テスト対象とファイル一覧（test ファイルは `*.spec.{ts,tsx}` のみ・不変条件 #8）

| # | 対象 lane | test ファイル（パス） | 区分 |
| --- | --- | --- | --- |
| T-1 | A1 util（純関数） | `apps/web/src/lib/tags/__tests__/tag-display.spec.ts` | 新規 |
| T-2 | A2 card（描画） | `apps/web/src/components/public/__tests__/MemberCard.spec.tsx` | 新規 |
| T-3 | B1 list projection | `apps/api/src/use-cases/public/__tests__/list-public-members.spec.ts` | 新規 or 既存追記 |

> 既存に同名 spec があれば追記、無ければ新規。`__tests__/` ディレクトリ配置は周辺コンポーネント spec の既存流儀に合わせる。

## 4.2 T-1: `tag-display.spec.ts`（AC-1 / AC-2 / AC-4）

純関数のため fixture のみで decision table 検証する。`PublicMemberTag = { code; label; category }`。

### T-1-A: `normalizeTagLabel`（AC-1）

| ケース | 入力 `{code,label}` | expected |
| --- | --- | --- |
| TC-U-01 | `{code:"int_0to1", label:"0to1"}` | `"0→1"` |
| TC-U-02 | `{code:"int_1to10", label:"1to10"}` | `"1→10"` |
| TC-U-03 | `{code:"int_10to100", label:"10to100"}` | `"10→100"` |
| TC-U-04 | `{code:"business_it", label:"IT・ソフトウェア"}`（未知 code） | `"IT・ソフトウェア"`（label fallback） |
| TC-U-05 | `{code:"int_0to1", label:"任意の別 label"}` | `"0→1"`（**code 駆動**＝label に依存しない裏取り） |

### T-1-B: `selectCardTags`（AC-2 / AC-4）

`PublicMemberTag[]` + density を入力に `CardTag[]` を返す。`region`/`role`/`status` 除外・`interest` 先頭・density 別件数を検証する。

fixture（共通）:
```ts
const tags = [
  { code: "region_hanshin", label: "阪神", category: "region" },
  { code: "business_it", label: "IT", category: "business" },
  { code: "int_0to1", label: "0to1", category: "interest" },
  { code: "skill_design", label: "デザイン", category: "skill" },
  { code: "role_lead", label: "リード", category: "role" },
  { code: "status_member", label: "会員", category: "status" },
  { code: "business_food", label: "飲食", category: "business" },
];
```

| ケース | 入力 | expected（順序込み） |
| --- | --- | --- |
| TC-U-06 | `selectCardTags(tags, "comfy")` | 先頭 phase `int_0to1`（label `0→1`・isPhase=true）+ rest 最大 3 件（business/skill を code 昇順）。**region/role/status を一切含まない**。件数 = 1 + min(rest, 3) |
| TC-U-07 | `selectCardTags(tags, "dense")` | phase 1 件 + rest 最大 2 件 |
| TC-U-08 | `selectCardTags(tags, "list")` | phase chip のみ（`int_0to1` 1 件）。rest 0 件 |
| TC-U-09 | `selectCardTags([], "comfy")` | `[]`（空配列） |
| TC-U-10 | `selectCardTags(undefined, "comfy")` | `[]`（undefined ガード） |
| TC-U-11 | phase 無し（interest を除いた tags）で `"list"` | `[]`（phase 無ければ list は空） |
| TC-U-12 | region/role/status のみの配列 | `[]`（全除外＝カード 0 件） |
| TC-U-13 | rest 整列確認: `business_food`/`business_it`/`skill_design` を comfy | `category` 順（business→skill）→同 category 内は `code` 昇順（`business_food` < `business_it`） |

> 検証観点: 各 `CardTag` の `label` は `normalizeTagLabel` 適用後の値（phase は `0→1`）。`isPhase` は `category==="interest"` のみ true。

### T-1-C: `phaseTone`（AC-4 / AC-8・新 tone 禁止）

| ケース | 入力 code | expected tone |
| --- | --- | --- |
| TC-U-14 | `int_0to1` | `"cool"` |
| TC-U-15 | `int_1to10` | `"warm"` |
| TC-U-16 | `int_10to100` | `"amber"` |
| TC-U-17 | 未知 code | `"stone"` |
| TC-U-18 | 返り値が `ChipTone` union 内であること（`cool`/`warm`/`amber`/`stone` 以外を返さない＝新 tone 禁止の裏取り） | union 内 |

## 4.3 T-2: `MemberCard.spec.tsx`（AC-3 経路の到達 / AC-4 / AC-5 / AC-6）

`@testing-library/react` で render し DOM を assert する。`member` props を可変にする。

**[VSCPKR-03]** すべての検証対象は **props 由来**（`member.tags` / `member.businessSummary` / `density`）であり、コンポーネント内部 state には依存しないことを各ケースで明示する。MemberCard は純粋な props→JSX 描画であり `useState` を持たない（L18-124 で hook 不使用を確認済み）。

fixture base（最小 member）:
```ts
const base: PublicMemberListItem = {
  memberId: "TEST-MEM-01", fullName: "テスト 太郎", nickname: "taro",
  occupation: "代表", location: "神戸市", ubmZone: "0_to_1",
  ubmMembershipType: "member",
};
```

| ケース | 条件（props） | expected DOM |
| --- | --- | --- |
| TC-C-01 | `tags` 未指定（base のみ）・comfy | 従来表示維持（name/occupation/location/zone/status chip 存在）。`[data-role="tag-row"]` **非存在**。回帰ガード |
| TC-C-02 | `tags=[interest,business,region]`・comfy | `[data-role="tag-row"]` 描画。`[data-role="tag-chip"]` に curated タグ。**region tag は描画されない**（AC-2/AC-6） |
| TC-C-03 | `tags=[interest,...]`・comfy | phase chip が `data-phase="true"` 属性を持ち、`data-tone` が `phaseTone(code)`（`int_0to1`→`cool`）。AC-4 強調 |
| TC-C-04 | `businessSummary="Webサービス開発"`・comfy | `[data-role="biz-summary"]` にテキスト描画。AC-5 |
| TC-C-05 | `businessSummary` 未指定・comfy | `[data-role="biz-summary"]` **非存在**（null/undefined ガード）。AC-5 |
| TC-C-06 | density=comfy / tags 多数 | tag-chip 件数 = phase 1 + rest 最大 3。AC-4 |
| TC-C-07 | density=dense / tags 多数 | tag-chip 件数 = phase 1 + rest 最大 2。AC-4 |
| TC-C-08 | density=list / tags 多数 | tag-chip = phase chip のみ。`[data-role="biz-summary"]` **非存在**（list は business summary 出さない）。AC-4/AC-6 |
| TC-C-09 | `tags=[region,role,status]` のみ・comfy | `[data-role="tag-row"]` **非存在 or 空**（curated 0 件）。AC-2/AC-6 |
| TC-C-10 | occupation 視認性: comfy で occupation `<li data-role="occupation">` が存在（markup 据置・強調は CSS） | `[data-role="occupation"]` 存在。AC-6 |

> 注: AC-3（`expand=tags` 有効化）は MemberCard 単体では検証不能（wiring lane）。MemberCard は `member.tags` が来れば描画することを TC-C-02 で担保し、AC-3 の query 付与は Phase 5 の grep + Phase 9 QA（実 API query 確認）で trace する。

## 4.4 T-3: `list-public-members.spec.ts`（AC-5 / AC-3 回帰 / AC-9）

use-case を `ctx`（DbCtx）と repository を mock/stub して呼び、`items` の `businessSummary` projection を検証する。既存 use-case spec の mock 流儀（repository 関数の stub）に合わせる。

| ケース | 条件 | expected |
| --- | --- | --- |
| TC-A-01 | `businessOverview` field に 1 行短文（120 字以下） | `items[].businessSummary` = その文字列（truncate なし） |
| TC-A-02 | `businessOverview` が複数行（`"1 行目\n2 行目"`） | `businessSummary` = `"1 行目"`（先頭 1 行で切る・`\r?\n`） |
| TC-A-03 | `businessOverview` が 121 字以上 | 先頭 120 字 + 末尾 `…`（合計 121 文字。実 length をコメントで確認） |
| TC-A-04 | `businessOverview` field 無し or 空文字 | `businessSummary` キー無し（undefined／spread で落ちる） |
| TC-A-05 | `expand=tags` 指定（query.expand=["tags"]） | 既存どおり `items[].tags` が付与される（回帰ガード・AC-3） |
| TC-A-06 | `expand` 未指定 | `tags` キー無し（既存挙動回帰） |
| TC-A-07 | view 全体が `PublicMemberListViewZ.parse` を通る（`.strict()` で businessSummary が許容される＝B3 反映後） | parse throw しない（AC-5 / zod 整合） |

> 注: TC-A-07 は B3（`PublicMemberListItemZ` に `businessSummary` optional 追加）が先行していないと `.strict()` で parse 落ちするため、Phase 5 の実装順序（B3 先行）の RED→GREEN 検証点。

## 4.5 テスト実行コマンド（正本）

> web vitest は repo root が `.` のためフルパス + `--root=.`。api vitest は `apps/api` へ入って `--root ../..`。

```bash
# web: util + MemberCard（T-1 / T-2）
mise exec -- pnpm exec vitest run --root=. apps/web/src/lib/tags apps/web/src/components/public

# api: list projection（T-3）
cd apps/api && mise exec -- pnpm exec vitest run src/use-cases/public --root ../..
```

## 4.6 RED→GREEN 期待

1. **RED**: 実装前に上記 spec を置くと、T-1（`tag-display.ts` 未作成で import 解決不可）/ T-2（tag-row・biz-summary 未描画）/ T-3（businessSummary 未 projection・`.strict()` parse 落ち）で fail する。
2. **GREEN**: Phase 5 の実装手順（B3 zod 先行 → A/B 並列）完了後、上記 2 コマンドが全 pass。
3. **回帰ガード**: TC-C-01 / TC-A-05 / TC-A-06 が「tags 未指定・expand 未指定で従来挙動が変わらない」ことを担保する。

## 4.7 AC trace（Phase 4）

| AC | 担保 test |
| --- | --- |
| AC-1 | TC-U-01..05 |
| AC-2 | TC-U-06..13 / TC-C-02 / TC-C-09 |
| AC-3 | TC-C-02（tags 到達描画）/ TC-A-05・06（projection 回帰）。query 付与は Phase 5 grep + Phase 9 |
| AC-4 | TC-U-06..08 / TC-C-03 / TC-C-06..08 |
| AC-5 | TC-A-01..04 / TC-A-07 / TC-C-04・05 |
| AC-6 | TC-C-08・09・10 / TC-U-12 |
| AC-7 | Phase 6（TagPicker 正規化回帰）で担保 |
| AC-8 | `verify:tokens`（Phase 5 検証コマンド）/ TC-U-18（新 tone 禁止） |
| AC-9 | TC-A-04..06（既存 surface・projection のみ）/ `git diff apps/api`（Phase 5 DoD） |

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

