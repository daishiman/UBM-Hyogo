# Phase 9: 品質保証（QA）

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- 前提: Phase 1〜8 完了（要件・設計・実装・テスト・カバレッジ・リファクタ）
- 本 Phase の責務: AC-1..AC-9 の検証手順を一覧化し、line budget / link / mirror parity を含む全ゲートを通過させる。

## 目的

AC-1..AC-9 の検証手順を一覧化し、静的解析・focused vitest・デザイントークン gate・API surface 非変更・line budget / link / mirror parity・spec ゲートの各区分を通過させて品質を担保する。視覚依存項目は Phase 11（user-gated）の runtime 境界として明示する。

## QA 概要

本タスクは `apps/web`（表現層）+ `apps/api`（list projection）+ `packages/shared`（zod）を変更する（AC-9 で **新 endpoint / D1 schema / Form 変更なし**を gate）。検証は以下 7 区分で行う:

1. 型チェック・リント（静的解析）
2. Focused vitest（web util / MemberCard / api use-case）
3. デザイントークン gate（HEX / arbitrary color 禁止確認・AC-8）
4. API surface 非変更確認（git diff projection 限定 / migration 追加 0・AC-9）
5. AC-1..AC-9 の DOM / grep 確認（Phase 11 runtime は user-gated 別途）
6. line budget / link / mirror parity の一括判定
7. spec ゲート（phase12-compliance / gate-metadata）

## 実行タスク

### タスク 1: 静的解析（typecheck / lint）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

**期待結果**: どちらも exit 0（エラー 0 件）。

### タスク 2: focused vitest 実行

```bash
# web: tag-display util + MemberCard + members-search 回帰
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/tags apps/web/src/components/public apps/web/src/lib/url

# api: list-public-members use-case + view-model + contract
cd apps/api && mise exec -- pnpm exec vitest run --root ../.. \
  src/use-cases/public src/view-models/public
```

**期待結果**: 以下の spec が全て PASS する。

| spec ファイル | 検証内容（AC） | 期待 |
| --- | --- | --- |
| `tag-display.spec.ts`（新規） | `int_0to1→"0→1"` 等の正規化 / 未知 code→label fallback（AC-1）/ region・role・status 除外 + interest>business>skill 並び（AC-2）/ density 別 slice 件数（AC-4） | PASS |
| `MemberCard.spec.tsx`（更新） | curated タグ chip 行描画（comfy=phase+最大3 / dense=phase+最大2 / list=phase のみ・タグ無し非表示）（AC-4）/ `businessSummary` 有→`biz-summary` 描画・無→非描画（AC-5）/ region chip 非含有（AC-6） | PASS |
| `members-search.spec.ts`（更新・回帰） | `toApiQuery` 出力に `expand=tags` を含む（AC-3） | PASS |
| `list-public-members.spec.ts`（更新） | `toBusinessSummary` 先頭行抽出 / 120字超 `…` 付与 / 空→undefined（AC-5）/ `SUMMARY_KEYS` に businessOverview（AC-5） | PASS |
| contract / view-model spec（更新） | `PublicMemberListItemZ` が `businessSummary` optional を parse 受理（AC-5）/ business 値を含んでも `.strict()` で落ちない（AC-9） | PASS |

### タスク 3: デザイントークン gate（AC-8）

```bash
# (1) legacy-public.css に HEX / 生 oklch 直書きがないこと（追加ブロック）
grep -nE '(oklch\(|#[0-9a-fA-F]{3,8})' apps/web/src/styles/legacy-public.css \
  | grep -v '^\s*/\*' | grep -v -- '--ubm-' \
  && echo "[FAIL: HEX or raw oklch]" || echo "[PASS: token-only]"

# (2) public 配下 TSX に arbitrary color がないこと
grep -rnE '(bg|text|border|fill|stroke)-\[#' \
  apps/web/src/components/public apps/web/src/lib/tags \
  && echo "[FAIL: arbitrary color]" || echo "[PASS: no arbitrary colors]"

# (3) pnpm verify:tokens（HEX 直書き 0 件・OKLch トークン正本確認）
mise exec -- pnpm verify:tokens
```

**期待結果**: 3 コマンドすべてが PASS / green。

> **AC-8 / OKLch トークン正本の確認手順**: 追加した tag chip / biz-summary / occupation 強調の CSS は `legacy-public.css` の `[data-component="member-card"]` ブロックに **既存トークン（`var(--ubm-color-*)` / `var(--ubm-space-*)` / `var(--ubm-font-size-*)` / `var(--ubm-radius-*)`）のみ**で記述し、新規色トークンを足さない。phase chip の色は `phaseTone` が返す既存 `ChipTone`（cool/warm/amber/stone）の既存 CSS（zone chip 由来）を踏襲する。`verify:tokens` が HEX/arbitrary color を 0 件と判定して green であることを AC-8 の証跡とする。

### タスク 4: API surface 非変更確認（AC-9）

```bash
# apps/api の変更が projection 2 ファイルに限定されること（新 endpoint / route 追加なし）
git diff --name-only -- apps/api \
  | grep -vE 'list-public-members\.ts|public-member-list-view\.ts|__tests__/list-public-members\.spec\.ts' \
  | grep . \
  && echo "[FAIL: apps/api changed outside projection]" || echo "[PASS: projection-only]"

# D1 migration が追加されていないこと
git diff --name-only -- apps/api/migrations/ apps/web/migrations/ \
  | grep . \
  && echo "[FAIL: migration added/modified]" || echo "[PASS: no migration]"

# routes/ surface（endpoint 定義）が不変であること
git diff --name-only -- apps/api/src/routes/ \
  | grep . \
  && echo "[FAIL: route surface changed]" || echo "[PASS: route surface unchanged]"
```

**期待結果**: 3 コマンドすべてが PASS（出力なし）。

> **[FB-UI-02-1] 削除確認（stub 化 / git delete 両許容）**: 本タスクは新規ファイル追加（`tag-display.ts` + 3 spec）と既存ファイル編集が中心で、**ファイル削除を伴わない**ため削除確認は該当が薄い。万一リファクタで不要関数を消す場合は、(a) stub 化（関数を残し no-op / 後方互換）か (b) `git rm`（呼び出し元 grep で参照 0 を確認後に削除）のいずれも許容する。本サイクルでは削除対象が無いことを `git diff --name-only --diff-filter=D` が空であることで確認する。

```bash
git diff --name-only --diff-filter=D -- apps/web apps/api packages/shared \
  | grep . && echo "[REVIEW: file deleted — confirm stub-or-rm]" || echo "[PASS: no deletions]"
```

### タスク 5: 変更ファイル確認（implementation_files 整合）

```bash
git diff --name-only HEAD | grep -E \
  "tag-display\.ts|MemberCard\.tsx|TagPicker\.client\.tsx|members-search\.ts|api/public\.ts|\
\(public\)/page\.tsx|\(public\)/members/page\.tsx|legacy-public\.css|\
list-public-members\.ts|public-member-list-view\.ts|viewmodel\.ts|\
tag-display\.spec\.ts|MemberCard\.spec\.tsx|list-public-members\.spec\.ts"
```

**期待結果**: `artifacts.json` の `implementation_files`（14 件）が差分として現れる。

### タスク 6: line budget / link / mirror parity 一括判定

```bash
# (1) line budget: 仕様書 md の肥大確認（HEAD 推奨上限の逸脱を点検。新規 spec が極端に長くないこと）
wc -l docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-*.md

# (2) link: workflow 内 md の相対リンク切れ確認（index.md の phase-N リンクが実在）
for f in $(grep -oE 'phase-[0-9]+[a-z-]*\.md' docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/index.md | sort -u); do
  test -f "docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/$f" \
    && echo "[OK] $f" || echo "[MISSING] $f"
done

# (3) mirror parity: artifacts.json と outputs/artifacts.json の整合（gate-metadata が判定）
diff <(cat docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/artifacts.json) \
     <(cat docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/outputs/artifacts.json) \
  >/dev/null 2>&1 && echo "[PARITY: identical]" || echo "[NOTE: gate-metadata validates both copies]"
```

**期待結果**: phase リンクが全 `[OK]`、artifacts.json mirror が gate-metadata で整合判定される。line budget は仕様書が極端に肥大していないこと（逸脱があれば分割を検討）。

### タスク 7: spec ゲート（phase12-compliance / gate-metadata）

```bash
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed \
  docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/artifacts.json \
  docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/outputs/artifacts.json
```

**期待結果**: phase12-compliance `ok: true`、gate-metadata エラー 0 件。

## AC-1..AC-9 チェックボックス表

| AC | 条件要旨 | 検証手段 | 判定 |
| --- | --- | --- | --- |
| AC-1 | interest label を web で矢印正規化（code 駆動・label fallback）・API/D1/seed 非変更 | `tag-display.spec.ts` PASS / `git diff --name-only -- apps/api` が projection 限定 | [ ] |
| AC-2 | category 優先（interest>business>skill）+ region/role/status 除外 | `tag-display.spec.ts` PASS | [ ] |
| AC-3 | home `/` と `/members` で `expand=tags` 有効化 | `members-search.spec.ts`（`toApiQuery` に `expand=tags`）/ home query 文字列に `expand=tags` / Phase 11 で実 fetch カード到達 | [ ] |
| AC-4 | MemberCard curated タグ chip 行（comfy=phase+最大3 / dense=最大2 / list=phase のみ）・既存 primitive 流用 | `MemberCard.spec.tsx` PASS / `grep "data-role=\"tag-chip\""` ヒット / 新規 component 追加なし | [ ] |
| AC-5 | list endpoint に `businessSummary`（先頭1行・120字）・zod optional・カードに clamp2 表示 | `list-public-members.spec.ts` PASS / `MemberCard.spec.tsx`（biz-summary 行）/ contract spec PASS | [ ] |
| AC-6 | occupation 視認性向上 + region タグ排除で情報過多回避 | `tag-display.spec.ts`（region 非含有）/ occupation 強調 CSS / Phase 11 視覚 | [ ] |
| AC-7 | TagPicker topTags chip にも同正規化 util 適用 | `grep "normalizeTagLabel" apps/web/src/components/public/TagPicker.client.tsx` ヒット / Phase 11 表示確認 | [ ] |
| AC-8 | OKLch トークン正本・HEX 直書き禁止 | タスク 3 の 3 コマンド全 PASS / `verify:tokens` green | [ ] |
| AC-9 | 既存 endpoint surface のみ・新 endpoint/schema/Form 変更なし・1 サイクル完結 | タスク 4 の git diff projection 限定 + migration 追加 0 | [ ] |

## 検証コマンドまとめ（一括実行用）

```bash
# 1. 型チェック・リント
mise exec -- pnpm typecheck && mise exec -- pnpm lint

# 2. focused vitest（web + api）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/tags apps/web/src/components/public apps/web/src/lib/url
cd apps/api && mise exec -- pnpm exec vitest run --root ../.. src/use-cases/public src/view-models/public; cd -

# 3. デザイントークン gate
grep -nE '(oklch\(|#[0-9a-fA-F]{3,8})' apps/web/src/styles/legacy-public.css \
  | grep -v '^\s*/\*' | grep -v -- '--ubm-' \
  && echo "[FAIL]" || echo "[PASS: token-only]"
mise exec -- pnpm verify:tokens

# 4. API surface 非変更
git diff --name-only -- apps/api | grep -vE 'list-public-members\.ts|public-member-list-view\.ts|list-public-members\.spec\.ts' | grep . && echo "[FAIL]" || echo "[PASS: projection-only]"
git diff --name-only -- apps/api/migrations/ apps/web/migrations/ | grep . && echo "[FAIL]" || echo "[PASS: no migration]"

# 5. spec ゲート
pnpm verify:phase12-compliance
pnpm gate-metadata:validate --require-gates-for-changed \
  docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/artifacts.json \
  docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/outputs/artifacts.json
```

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| AC 正本 | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-1-requirements.md` | AC-1..AC-9 定義 |
| 設計正本 | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-2-design.md` | util / markup / CSS / projection 設計の根拠 |
| 設計レビュー | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-3-design-review.md` | 不変条件適合・grep gate |
| カバレッジ | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-7-coverage.md` | 計測対象・閾値 |
| リファクタ | `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-8-refactor.md` | navigation drift なし確認 |
| デザイントークン | `apps/web/src/styles/tokens.css` | token 名確認 |
| トークン仕様 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | zone alias（info/accent/ok） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| design-tokens | `.claude/skills/aiworkflow-requirements/references/design-tokens.md` | OKLch トークン正本・HEX 禁止不変条件 |
| ui-ux-navigation | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | 公開ナビ / 画面構成の正本 |

## 成果物

| 成果物 | 種別 | 内容 |
| --- | --- | --- |
| 本 Phase 9 仕様書 | 文書 | QA チェックリスト・検証コマンド・AC マッピング・line budget/link/mirror parity 方針 |
| 各 spec の PASS 証跡 | runtime | Phase 11 `manual-test-result.md` に記録 |

## 統合テスト連携

- focused vitest PASS（web + api）が Phase 10 最終レビューの AC-1/2/4/5 判定根拠となる。
- タスク 3（tokens）・タスク 4（API surface）の gate PASS が Phase 10 の AC-8・AC-9 判定根拠となる。
- Phase 11 では本 Phase で確認できない「実 pixel 表示確認」（tag chip 行 / biz-summary clamp / occupation 強調）と「`expand=tags` の実 fetch でタグがカード到達」を user-gated として追加する。

## 完了条件

1. `pnpm typecheck` / `pnpm lint` が exit 0。
2. focused vitest（`tag-display` / `MemberCard` / `members-search` / `list-public-members` / contract）が全 PASS。
3. デザイントークン gate（HEX/arbitrary 0 件 + `verify:tokens` green）が PASS で、OKLch トークン正本の確認手順（AC-8）が記載されている。
4. `git diff --name-only -- apps/api` が projection 2 ファイル（+spec）に限定され、migration 追加 0・route surface 不変（AC-9）。
5. 削除確認（[FB-UI-02-1]）が記載され、本サイクルは削除 0 件であることが確認されている（stub 化 / git delete 両許容の方針付き）。
6. line budget / link / mirror parity の一括判定方針が記載され、phase リンク全 OK・artifacts mirror が gate-metadata 整合。
7. spec ゲート（phase12-compliance `ok:true` / gate-metadata エラー 0）が PASS。
8. AC-1..AC-9 チェックボックスが全チェック済みとなるか、未確認項目が Phase 11 runtime 境界として明記されている。
