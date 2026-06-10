# Phase 7: テストカバレッジ確認

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- 前提: Phase 4（テスト計画）/ Phase 5（実装 Green）/ Phase 6（テスト拡充）
- 本 Phase の責務: 本タスクで **新規追加・変更したコードに限定**してカバレッジを測定し、`coverage-standards.md` の閾値に整合させる。CSS（`legacy-public.css`）は jsdom 非カバレッジのため Phase 11 視覚で担保する旨を明記する。

## 目的

`coverage-standards.md`（正本）の **workspace 一律 80%**（lines / branches / functions / statements ≥ 80%、推奨 90%）に対し、本タスクの新規・変更コードが満たすことを確認する。
プロジェクト全体閾値は既存負債の影響を受けるため、`coverage-standards.md` §「個別ファイルカバレッジ計測」に従い **対象ファイルを `--coverage.include` で絞り込んで個別計測**する。

> **[Feedback BEFORE-QUIT-002] / [Feedback 5]**: 「全体 X%」ではなく **変更ファイル／変更ブロックに限定**してカバレッジを語る。本タスクの計測対象は `tag-display.ts` の 3 関数（`normalizeTagLabel` / `selectCardTags` / `phaseTone`）、`MemberCard.tsx` の新規分岐（タグ行 / business summary 行の null ガード）、`list-public-members.ts` の `toBusinessSummary` 分岐の 3 箇所に**限定**する。無関係ファイルは計測対象外として明示する。

## 実行タスク

### 1. カバレッジ目標（coverage-standards.md 整合）

| 指標 | 最低基準 | 推奨基準 | 本タスク対象 |
| --- | --- | --- | --- |
| Line Coverage | 80% | 90% | `tag-display.ts` の 3 関数は 100% を目標（純関数・分岐有限） |
| Branch Coverage | 80% | 90% | 同上 / `MemberCard` 新規分岐 / `toBusinessSummary` 分岐 |
| Function Coverage | 80% | 90% | 同上 |
| Statement Coverage | 80% | 90% | 同上 |

> 本ファイルの閾値（80%）は `index.md` メタ情報および本 Phase の `## 完了条件` に必須記載する（coverage-standards.md §「全タスク必須 AC」）。
> 本タスクは UI/UX + projection 編集タスクであり実装テストが発生する（pure-docs ではない）ため「coverage AC 適用外」には該当しない。

### 2. カバレッジ対象ファイル（変更ファイルに限定）と評価方針

| ファイル | カバレッジ評価 | 対象範囲（限定根拠） | 対応 AC |
| --- | --- | --- | --- |
| `apps/web/src/lib/tags/tag-display.ts`（新規） | **計測対象（line/branch 100% 目標）** | `normalizeTagLabel`（override hit / fallback の 2 分岐）/ `selectCardTags`（空配列・除外 category・density=list/dense/comfy・phase 有無）/ `phaseTone`（4 分岐 + default）。純関数で副作用なし→分岐を spec で全網羅可能 | AC-1 / AC-2 / AC-4 |
| `apps/web/src/components/public/MemberCard.tsx`（変更） | **計測対象（新規分岐 80%+）** | 新規分岐のみ＝`member.businessSummary` の null ガード / `cardTags.length > 0` の表示分岐 / density 別 `selectCardTags` 呼び分け。既存の head/avatar/zone/status 描画は回帰確認スコープ | AC-4 / AC-5 / AC-6 |
| `apps/api/src/use-cases/public/list-public-members.ts`（変更） | **計測対象（toBusinessSummary 分岐 80%+）** | 新規追加 `toBusinessSummary` の分岐＝空文字→undefined / 先頭行抽出 / 120 字 cap 超過時の `…` 付与 / cap 未満そのまま。`SUMMARY_KEYS` への `businessOverview` 追加は定数変更（分岐なし） | AC-5 / AC-9 |
| `apps/api/src/view-models/public/public-member-list-view.ts`（変更） | 参考値 | `businessSummary?` を透過するだけ（undefined は出力しない）。新規分岐は「キー存在時のみ含める」spread 1 箇所。use-case spec / contract spec で間接網羅 | AC-5 |
| `packages/shared/src/zod/viewmodel.ts`（変更） | 参考値 | `PublicMemberListItemZ` に `businessSummary: z.string().optional()` を追加するだけ（ロジック分岐なし）。zod parse は contract spec で確認 | AC-5 / AC-9 |
| `apps/web/src/components/public/TagPicker.client.tsx`（変更） | 参考値 | topTags chip label を `normalizeTagLabel(opt)` に置換するだけ（分岐は `normalizeTagLabel` 側で計測済み）。`"use client"` + hooks 依存のため focused 計測の主対象外でも可 | AC-7 |
| `apps/web/src/lib/url/members-search.ts`（変更） | 参考値 | `toApiQuery` 末尾の `params.set("expand","tags")` 1 行追加（分岐なし）。既存 `members-search.spec.ts` の回帰で担保 | AC-3 |
| `apps/web/src/lib/api/public.ts` / `app/(public)/page.tsx` / `app/(public)/members/page.tsx`（変更） | 参考値 | wiring（呼び出し側）。`listMembers` 経由は `toApiQuery` で expand 付与、home `/` は `listMembersRaw` 経由のため query 文字列に `expand=tags` を追記。分岐ロジック増なし | AC-3 |
| `apps/web/src/styles/legacy-public.css`（変更） | **カバレッジ対象外** | CSS は jsdom で実行されずカバレッジに現れない。`tag-row` / `tag-chip` / `biz-summary` / occupation 強調の効きは AC-4/5/6/8 として **Phase 11 視覚**で担保 | AC-4 / AC-5 / AC-6 / AC-8 |

> **対象外（無関係ファイル）の明示**: `vitest.config.ts`（ルート）の `coverage.exclude` が `apps/web/app/**/page.tsx` 等を除外し、`.css` は `include`（`apps/**/src/**/*.{ts,tsx}`）に元来含まれない。本タスクは Server Component（`page.tsx`）・CSS の分岐ロジックを増やさないため、focused 計測の **主対象は `tag-display.ts` / `MemberCard.tsx`（web）と `list-public-members.ts`（api）の 3 ファイル**に限定する。これら以外のプロジェクト全体ファイルは本 Phase のカバレッジ判定対象外（既存負債は別タスクに委ねる）。

### 3. concern × dependency edge カバレッジ可視化表（AC × テストケース）

> concern（受入条件）と、それを支える dependency edge（zod 型 → view-model → use-case → web カード → CSS の層）を、どのテストケースがカバーするかを可視化する。`runtime` 行は jsdom 非カバレッジ領域として Phase 11 視覚で補完する。

| AC | concern | dependency edge（カバー層） | カバーするテストケース | jsdom 計測 |
| --- | --- | --- | --- | --- |
| AC-1 | interest label を矢印正規化 | `tag-display.normalizeTagLabel` | `tag-display.spec.ts`: `int_0to1→"0→1"` / `int_1to10→"1→10"` / `int_10to100→"10→100"` / 未知 code→label fallback | ✅ |
| AC-2 | category 優先 + region/role/status 除外 | `tag-display.selectCardTags` | `tag-display.spec.ts`: interest>business>skill 並び / region・role・status 除外 / 同 category は code 昇順 | ✅ |
| AC-3 | `expand=tags` 有効化 | `members-search.toApiQuery` → `public.listMembers`/`listMembersRaw` | `members-search.spec.ts`（回帰）: `toApiQuery` 出力に `expand=tags` 含む / home `/` query 文字列に `expand=tags` 含む | ✅（query 文字列）/ ⏳（実 fetch は Phase 11） |
| AC-4 | curated タグ chip 行（density 別件数） | `selectCardTags` → `MemberCard` 描画 | `MemberCard.spec.tsx`: comfy=phase+最大3 / dense=phase+最大2 / list=phase のみ / タグ無し時行非表示。`tag-display.spec.ts`: density 別 slice 件数 | ✅ |
| AC-5 | business summary 行（先頭1行・120字・clamp2） | zod optional → view-model → `toBusinessSummary` → `MemberCard` | `list-public-members.spec.ts`: 先頭行抽出 / 120字超 `…` / 空→undefined。`MemberCard.spec.tsx`: `businessSummary` 有→`biz-summary` 描画 / 無→非描画。clamp2 の見た目は Phase 11 | ✅（DOM 存在）/ ⏳（clamp 見た目は Phase 11） |
| AC-6 | occupation 視認性 + region 排除 | `selectCardTags` 除外 + CSS occupation 強調 | `tag-display.spec.ts`: region 非含有。occupation の font-weight/color は CSS→Phase 11 視覚 | ✅（除外）/ ⏳（強調見た目は Phase 11） |
| AC-7 | TagPicker topTags にも正規化適用 | `normalizeTagLabel` → `TagPicker` | `tag-display.spec.ts`（共有 util）+ TagPicker 表示確認（`#{normalizeTagLabel(opt)}`） | ✅（util）/ ⏳（picker 表示は Phase 11） |
| AC-8 | OKLch トークン正本・HEX 禁止 | `legacy-public.css` トークン参照 | `verify:tokens` gate（jsdom 非カバレッジ・gate で担保） | ⏳（gate） |
| AC-9 | 既存 endpoint surface のみ・1 サイクル完結 | `git diff apps/api`（projection のみ）/ migration 追加 0 | `git diff --name-only -- apps/api`（projection 2 ファイルのみ）/ contract spec parse | ✅（diff gate） |

### 4. vitest coverage 設定方針（既存設定の確認・非変更）

ルート `vitest.config.ts` の `test.coverage` は既定のまま **変更しない**（provider=v8 / reporter に text+json-summary / include=`apps/**/src/**/*.{ts,tsx}` / exclude に `*.spec.*`・`page.tsx`・`layout.tsx`）。閾値判定は `scripts/coverage-guard.sh` が package 単位で 80% を強制する（`coverage-standards.md` §「workspace 一律 80% 強制経路」）。

### 5. 個別ファイルカバレッジ計測コマンド

web（`tag-display.ts` / `MemberCard.tsx`）と api（`list-public-members.ts`）を分けて、変更ファイルに絞って計測する（`coverage-standards.md` §「個別ファイルカバレッジ計測」）。

```bash
# web: tag-display util + MemberCard を個別計測
mise exec -- pnpm exec vitest run \
  --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/lib/tags/tag-display.ts' \
  --coverage.include='apps/web/src/components/public/MemberCard.tsx' \
  apps/web/src/lib/tags apps/web/src/components/public

# api: list-public-members の toBusinessSummary 分岐を個別計測
cd apps/api && mise exec -- pnpm exec vitest run \
  --root ../.. \
  --coverage \
  --coverage.include='apps/api/src/use-cases/public/list-public-members.ts' \
  src/use-cases/public
```

text reporter の出力で対象 3 ファイルの `% Stmts` / `% Branch` / `% Funcs` / `% Lines` が **80% 以上**（`tag-display.ts` は 100% 目標）であることを確認する。

### 6. 判定フロー（coverage-standards.md §判定フロー）

| 状況 | 対処 |
| --- | --- |
| 個別計測が 80% を満たす（tag-display は 100%） | Phase 7 PASS → Phase 8（リファクタ）へ |
| プロジェクト全体集計が既存負債で閾値割れ | `--coverage.include` で対象を絞り個別計測（本 §5）。全体閾値割れは既存負債として別タスクに委ねる |
| 個別計測も 80% 未満 | Phase 6 へ戻りテスト追加（不足 branch を `tag-display.spec.ts` / `MemberCard.spec.tsx` / `list-public-members.spec.ts` に補完） |

### 7. テスト数の実測記録（coverage-standards.md §テスト数記載基準）

Phase 9 / Phase 10 のテスト数記載に向け、本 Phase 実行時に **実測値**を取得する（推定値禁止）。

```bash
# web
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --reporter=verbose \
  apps/web/src/lib/tags apps/web/src/components/public
# api
cd apps/api && mise exec -- pnpm exec vitest run --root ../.. \
  --reporter=verbose src/use-cases/public
```

> 想定 spec 構成（実数は実行時の verbose 出力で確定）: `tag-display.spec.ts`（正規化 4 + 選抜/除外/density 数ケース）/ `MemberCard.spec.tsx`（タグ行 / biz-summary 行 / density 別件数）/ `list-public-members.spec.ts`（`toBusinessSummary` 分岐 + contract）。実行コマンドと実行日時を Phase 11 `manual-test-result.md` に記録する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| カバレッジ基準（正本） | `.claude/skills/task-specification-creator/references/coverage-standards.md` | 80% 閾値・個別計測・テスト数記載基準 |
| vitest 設定 | `vitest.config.ts`（ルート） | coverage provider / include / exclude / reporter |
| coverage guard | `scripts/coverage-guard.sh` | package 単位 80% 強制 |
| テスト計画 | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-4-test-plan.md` | 計測対象 spec のケース定義 |
| テスト拡充 | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-6-test-additions.md` | 計測対象 spec の追加内容 |
| 計測対象 util | `apps/web/src/lib/tags/tag-display.ts` | `normalizeTagLabel` / `selectCardTags` / `phaseTone` |
| 計測対象 component | `apps/web/src/components/public/MemberCard.tsx` | タグ行 / biz-summary 行の新規分岐 |
| 計測対象 use-case | `apps/api/src/use-cases/public/list-public-members.ts` | `toBusinessSummary` 分岐 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | 公開ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 個別カバレッジ計測結果 | runtime | 対象 3 ファイルの Stmts/Branch/Funcs/Lines（≥80%・tag-display は 100%）を Phase 11 `manual-test-result.md` に記録 |
| テスト数実測値 | runtime | `--reporter=verbose` の実行結果・コマンド・日時 |
| concern × dependency edge 表 | 文書 | AC-1..AC-9 × テストケースのカバレッジ可視化（本 §3） |
| 本 Phase 7 仕様書 | 文書 | カバレッジ目標・限定対象・CSS 非カバレッジ方針 |

## 統合テスト連携

- Phase 6 の spec が Green の状態で本 Phase の個別計測を実施し、不足 branch があれば Phase 6 へ戻して補完する。
- Phase 9 QA でテスト数実測値と focused vitest PASS を AC 判定根拠に用いる。
- Phase 11（user-gated）で CSS（`legacy-public.css`・jsdom 非カバレッジ）の実描画（タグ chip 行 / business summary clamp / occupation 強調）と AC-3 の実 fetch（`expand=tags` がカードへ到達）を staging 実機で視覚確認し、カバレッジで担保できない領域を補完する。

## 完了条件

1. `tag-display.ts` の 3 関数（`normalizeTagLabel` / `selectCardTags` / `phaseTone`）が line/branch **100%**（最低 80%）である。
2. `MemberCard.tsx` の新規分岐（タグ行 / business summary 行の null ガード / density 別呼び分け）と `list-public-members.ts` の `toBusinessSummary` 分岐が **80% 以上**である。
3. カバレッジは「全体 X%」ではなく**変更ファイル／変更ブロックに限定**して語られ、対象外（無関係ファイル・CSS・page.tsx）が明記されている（[Feedback BEFORE-QUIT-002] / [Feedback 5]）。
4. concern × dependency edge カバレッジ可視化表（AC-1..AC-9 × テストケース）が存在する。
5. CSS（`legacy-public.css`）は jsdom 非カバレッジであり、AC-4/5/6/8 を Phase 11 視覚で担保する旨が明記されている。
6. テスト数は実測値（`--reporter=verbose`）で取得し、コマンドと実行日時が記録される（推定値不使用）。
7. カバレッジ閾値（80%）が `index.md` メタ情報および本 Phase の完了条件に記載されている。
