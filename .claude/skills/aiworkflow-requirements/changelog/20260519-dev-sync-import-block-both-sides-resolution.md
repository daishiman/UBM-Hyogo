# dev sync — apps/web import block 両側採用解消 (2026-05-19)

`feat/issue-274-public-pages-ogp-sitemap-robots` に `origin/dev` を取り込んだ際、`apps/web/app/page.tsx` の import block で 3-way conflict が発生し、`pnpm sync:resolve` の unhandled リストに残った。両 import を保持する自律解消を確立し、`L-DEVSYNC-023` として lessons-learned に追記。

## 発生 conflict
- `apps/web/app/page.tsx`
  - HEAD 側: `import { buildPageMetadata } from "@/lib/seo/site-metadata";`（issue-274 OGP 対応で追加。`export const metadata` で参照）
  - dev 側: `import { CallToActionCTA } from "../src/components/public/CallToActionCTA";`（CTA 追加。JSX 内 `<CallToActionCTA ... />` で参照）
  - base: いずれも未追加
- `pnpm sync:resolve` は `apps/**/*.{ts,tsx}` を resolver 対象外として WARN で残置

## 解消経路
1. `git merge dev --no-edit` → 上記 1 ファイル + skill 系 5 ファイルで CONFLICT
2. skill 系は `pnpm sync:resolve` が union / `--ours` で自動解消（`SKILL.md`, `indexes/quick-reference.md`, `indexes/topic-map.md`, `indexes/keywords.json`）
3. `apps/web/app/page.tsx` は手動で両 import を順序維持で連結、conflict marker（`<<<<<<<` / `|||||||` / `=======` / `>>>>>>>`）を物理除去
4. `git add -A` → `git commit -m "merge: sync feat/issue-274-... with dev"`
5. `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `bash scripts/verify-pr-ready.sh` すべて PASS
6. `git push` で pre-push hook（coverage-guard / gate-metadata-guard / indexes-drift-guard / phase12-compliance-guard / verify-esbuild）すべて PASS、`18a48065..370c7f64` push 成功

## 抽出した不変ルール（L-DEVSYNC-023）
- HEAD 側 / dev 側の双方が **新規 import 文を追加** した場合、かつ base が空の場合は **両側採用が安全**
- 適用条件:
  1. conflict 範囲が import / require 宣言のみ（実装コード行を含まない）
  2. 両側とも新規 import 追加（同一シンボルの rename / reassign ではない）
  3. base セクションが空
  4. 解消後 `pnpm typecheck` / `pnpm lint` PASS
- 適用除外: 同一シンボルのリネーム、import 順序の意図的並び替え、conditional import

## 適用先
- このスキル（aiworkflow-requirements）: `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` に `L-DEVSYNC-023` として追記済み、`適用範囲` セクションにも反映
- `task-specification-creator` skill: dev sync prompt の自律解消手順（`scripts/sync/resolve-skill-merge-conflicts.sh` 補完）として `L-DEVSYNC-023` を参照する。並列 changelog（`20260519-dev-sync-import-block-both-sides-resolution.md`）を追加予定
