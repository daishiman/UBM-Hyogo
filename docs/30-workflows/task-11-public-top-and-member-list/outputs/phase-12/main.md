# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 12 |
| task | task-11-public-top-and-member-list |
| state | implemented-local / implementation / VISUAL_ON_EXECUTION |

## 目的

task-specification-creator skill の **6 必須タスク** を実行し、最低 7 ファイルを実体生成する。`spec_created` / runtime 未取得状態では workflow_state を `completed` に書き換えない。

## 実行タスク

- [ ] Task 12-1〜12-6 を順番に実施し、7 ファイルを生成する
- [ ] state 据え置き規律を遵守する

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`
- `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## Task 12-1: 実装ガイド作成（中学生 + 技術者）

出力: `outputs/phase-12/implementation-guide.md`

### Part 1: 中学生レベル（概念説明）

学校の掲示板を作り直す場面で考える。入口に大きな案内があり、人数や最近の予定がすぐ見え、名簿は名前や条件で探せる。さらに「カードで見る」「表で見る」を選べると、初めて来た人も迷いにくい。

このタスクが必要な理由は、トップページとメンバー一覧が見本の形にそろっていないと、見る人がどこを見ればよいか分からなくなるため。先に「どんな並びにするか」「どの条件をページの住所に残すか」「どの色の決まりを使うか」を決めておくと、あとから作る人も同じ約束で実装できる。

やることは、トップページを「大きな案内、数字のカード、Zone 説明、最近の集まり」に整理し、メンバー一覧を「検索、並び替え、カード表示、表表示、件数表示」に整理すること。検索条件はページの住所に残すので、更新しても、友達に送っても同じ結果が出る。

| 専門用語 | 日常語への言い換え |
| --- | --- |
| URL | ページの住所 |
| URL query | ページの住所に付ける検索メモ |
| OKLch tokens | 色を勝手に選ばないための色見本 |
| アクセシビリティ | 誰でも使いやすくする工夫 |
| evidence | できたことを後で確かめる証拠 |
| API | データを受け取る窓口 |

Part 1 checklist: 日常の例え話あり、専門用語 5 語以上の言い換えあり、「なぜ必要か」を「何をするか」より先に記載済み。

### Part 2: 技術者レベル（実装ポイント）

- Server Component（`/`, `/(public)/members`）+ `'use client'`（MemberFilters / DensityToggle）の境界設計
- `searchParams: Promise<...>` を `await` して zod parse → `listMembers` で API へ転送
- `lib/api/public.ts` で `XxxZ.parse（strict 定義済み schema）(json)` を全 fetch に強制（extra key を即 throw）
- `parseSearchParams` は throw しない（zod default fallback で URL fuzz / 古い URL を吸収）
- `router.replace` で URL を書換え（push でなく history を肥大化させない）
- revalidate: stats=60s / members=30s を Server Component export に明記
- token: `var(--ubm-color-*)` / `var(--ubm-color-zone-{a..e})` 経由のみ。HEX 直書き禁止（task-18 verify-design-tokens 整合）
- D1 binding を `apps/web/**` で import しない（不変条件 #5）
- task-18 への引き継ぎ: `apps/web/src/components/public/**` を verify-design-tokens 走査対象に追加できる anchor（`data-page=...`）を付与

## Task 12-2: システム仕様書更新

出力: `outputs/phase-12/system-spec-update-summary.md`

更新対象:

- `docs/00-getting-started-manual/specs/00-overview.md` — 公開層 2 画面の構成（Hero + Stats + ZoneIntro + Timeline / Filters + Grid|Table）を追記（Step 1-A: 既存節の補足）
- `docs/00-getting-started-manual/specs/01-api-schema.md` — `/public/stats` / `/public/members` の consumer 側ガイドを追記（schema は変更しない、Step 1-B）
- `docs/00-getting-started-manual/specs/09-ui-ux.md` — `/`, `/members` の画面構成 / a11y 属性 / 状態（loading/empty/error）を追記。存在しなければ Step 2 で新節（Step 1-C: 新規節の根拠を記録）
- `.claude/skills/aiworkflow-requirements/` の対象 reference — 公開トップ / 会員一覧の正本記載があれば更新、なければ新規追加候補として 12-4 へ繋ぐ

Step 1-A/B/C ルールに従い、本 task で確定した契約のみ反映し、未確定事項は 12-4 へ。

## Task 12-3: ドキュメント更新履歴

出力: `outputs/phase-12/documentation-changelog.md`

更新行（canonical absolute path 列挙）:

- `apps/web/app/page.tsx`（mod）
- `apps/web/app/(public)/layout.tsx`（mod）
- `apps/web/app/(public)/members/page.tsx`（mod）
- `apps/web/src/components/public/Hero.tsx`（mod）
- `apps/web/src/components/public/Stats.tsx`（new）
- `apps/web/src/components/public/ZoneIntro.tsx`（new）
- `apps/web/src/components/public/Timeline.tsx`（mod）
- `apps/web/src/components/public/MemberCard.tsx`（mod）
- `apps/web/src/components/public/MemberGrid.tsx`（new）
- `apps/web/src/components/public/MemberTable.tsx`（new）
- `apps/web/src/components/public/MemberFilters.client.tsx`（new）
- `apps/web/src/components/public/DensityToggle.client.tsx`（new）
- `apps/web/src/components/public/PublicHeader.tsx`（new）
- `apps/web/src/components/public/PublicFooter.tsx`（new）
- `apps/web/src/components/public/__tests__/{Hero,Stats,MemberCard}.test.tsx`（new）
- `apps/web/src/lib/api/public.ts`（new）
- `apps/web/src/lib/api/__tests__/public.test.ts`（new）
- `apps/web/src/lib/url/members-search.ts`（mod）
- `apps/web/src/lib/url/__tests__/members-search.test.ts`（new）
- `apps/web/playwright/tests/public-top-and-list.spec.ts`（new）
- `docs/30-workflows/task-11-public-top-and-member-list/**`（new spec set）
- `.claude/skills/task-specification-creator/SKILL.md` / `LOGS.md`（必要時）
- `.claude/skills/aiworkflow-requirements/LOGS.md`（必要時）

## Task 12-4: 未タスク検出レポート

出力: `outputs/phase-12/unassigned-task-detection.md`（**0 件でも出力必須**）

検出対象:

- 公開詳細 `/(public)/members/[id]` UI → task-12 既存。新規 unassigned 起票不要
- `/register` / `/privacy` / `/terms` → task-12 既存
- a11y axe / token grep gate（→ task-18 既存）
- primitives 完成（task-10）→ 既存
- error UI 最終デザイン → task-15 周辺で既存
- 公開層の OG image / sitemap.xml / robots.txt（プロトタイプ範囲外）→ MVP 後フェーズで判断 → 起票判断
- Pagination の page=2 以降の prefetch 戦略（プロトタイプ範囲外）→ MVP 後判断

各候補について: 苦戦箇所 / リスクと対策 / 検証方法 / スコープ の 4 セクション必須。

## Task 12-5: スキルフィードバック

出力: `outputs/phase-12/skill-feedback-report.md`（**改善点なしでも出力必須**）

3 観点固定:

- テンプレ改善: 公開層 UI task 用テンプレが「pages-public.jsx → 4 セクション」「pages-public.jsx → Filters/density」の対応を明示できているか
- ワークフロー改善: 05-screens-public → 06/07-screens → 18 regression の DAG 接続点として task-11 が `data-page=...` anchor と `verify-design-tokens` 走査入口を提供できているか
- ドキュメント改善: `lib/url/members-search.ts` の正本性（density / tags[] / sort / page / limit の URL 契約）を `aiworkflow-requirements` 側で index 化すべきか

## Task 12-6: タスク仕様書コンプライアンスチェック

出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`

Phase 1〜11 の outputs / artifacts.json / index.md / 13 phase ファイル / evidence canonical path の実体存在を機械的に確認。8 点 checklist:

1. `index.md` 存在 + `[実装区分: 実装仕様書]` 含有
2. `artifacts.json` 存在 + `phases[]` が 13 件 + `metadata.taskType="implementation"` + `metadata.visualEvidence="VISUAL_ON_EXECUTION"`
3. `outputs/artifacts.json` parity（`cmp -s` で一致）
4. `outputs/phase-{01..13}/main.md` の存在（runtime 未取得時は status 表記が `IMPLEMENTED_LOCAL_RUNTIME_PENDING` であること）
5. Phase 12 の 7 必須出力ファイル全件存在
6. `outputs/phase-11/evidence/` の canonical path 16 ファイル（runtime 取得時）/ `IMPLEMENTED_LOCAL_RUNTIME_PENDING` 明記（未取得時）
7. テスト常時実行可能性 DoD 8 点（対象 spec / 1 行コマンド / browser binary install / dev server / CI gate / un-skip / coverage / E2E lines ≥ 80）
8. dirty diff チェック: `git status apps/ packages/` で範囲外の混入が無い、または分類記録あり

FAIL 項目があれば本 task の Phase 11 まで戻す。

## state 据え置き規律

- `artifacts.json.metadata.workflow_state` を Phase 12 close-out で書き換えない
- 仕様書出力時点では `spec_created` を維持
- 実装後 runtime 未取得なら `implemented-local` または `IMPLEMENTED_LOCAL_RUNTIME_PENDING`
- 完了は Playwright runtime PASS + 4 screenshot + axe critical=0 揃い時のみ

## 完了条件

- [ ] 6 必須出力ファイルすべて生成
- [ ] `outputs/artifacts.json` が存在し、root `artifacts.json` と `cmp -s` で一致する
- [ ] 各 evidence path が canonical 規約と整合
- [ ] `phase12-task-spec-compliance-check.md` が 8 点 checklist を検証する
- [ ] dirty diff 監査済み（`apps/` / `packages/` 範囲外混入無し）
