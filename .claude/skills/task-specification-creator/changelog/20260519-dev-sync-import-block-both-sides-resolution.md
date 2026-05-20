# dev sync — apps/web import block 両側採用解消の task spec への反映 (2026-05-19)

`aiworkflow-requirements` skill 側で `L-DEVSYNC-023`（HEAD / dev 両側で新規 import を追加した場合の両側採用ルール）を新規追加した。本 changelog は task-specification-creator 配下からの参照と適用範囲を記録する。

## 反映内容
- `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の `L-DEVSYNC-023`（2026-05-19 追加）が SSOT
- task-specification-creator の Phase 12 / 13 dev sync 自律解消手順は `L-DEVSYNC-023` を参照し、`apps/**/*.{ts,tsx}` / `packages/**/*.{ts,tsx}` の **import 宣言のみ** の conflict には両側採用を許容
- 実装コード行を 1 行でも含む conflict は対象外（手動判断・最終レポート対象）

## 適用条件（L-DEVSYNC-023 から転載）
1. conflict 範囲が import / require 宣言のみ
2. 両側とも新規 import 追加（rename / reassign ではない）
3. base セクションが空
4. 解消後 `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` PASS

## 事例
- `feat/issue-274-public-pages-ogp-sitemap-robots` への dev sync
- `apps/web/app/page.tsx` で HEAD: `buildPageMetadata` / dev: `CallToActionCTA` の両 import を保持
- merge commit `370c7f64`、typecheck / lint / verify-pr-ready / pre-push hook 全 PASS、push 成功
