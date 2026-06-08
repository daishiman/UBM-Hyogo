# dev sync: 第 6 故障レイヤー＝proxy transport util 二重抽出による apps 共有 call-site 衝突を解消（2026-06-07 issue-1111）

- 日時: 2026-06-07
- ブランチ: `docs/issue-1111-proxy-transport-util-unify-spec` ← `dev`（sub-worktree wt-8・**6 behind / 3 ahead**、ローカル dev = origin/dev `e679722f5` 一致・独自コミット 0）
- 関連: task-specification-creator SP-DEVSYNC-107 / aiworkflow L-DEVSYNC-115（正本）
- 事象: `git merge dev` CONFLICT 6＝skill-index 5（resolver 機械解消）＋ `apps/web/src/lib/fetch/public.ts`（手動）。feature 側 `transport-select.ts` と dev 側 `transport.ts` が同一関心事を別名モジュールへ二重抽出し、共有 call-site public.ts でのみ 3-region 衝突。`task-specification-creator` 配下は全 auto-merge（衝突 0）。
- 解消の核心: (1) `grep -rln` で両 module の call-site 列挙 → 互いに素確認 → 両 module 温存、(2) 共有 call-site の module 選択はブランチ目的（issue-1111 = transport-select 統一）を正本に HEAD 採用、(3) dev の `NEXT_PUBLIC_API_BASE_URL` 改善差分だけ graft + 共通領域が要求する `getEnvironment` import 整合、(4) 未使用 `DEFAULT_BASE_URL` 削除、(5) `public.spec.ts` 等 34 test 実走 + typecheck/lint/localhost-bake gate で振る舞い検算。
- 検証: `--diff-filter=U` 0 / 実マーカー 0 → typecheck 0 / lint 0 / fetch 34 pass / localhost-bake exit 0 / admin route 6 pass。CI コード修正なしで全緑。
- 反映先: 本 changelog + SP-DEVSYNC-107 + aiworkflow L-DEVSYNC-115。
