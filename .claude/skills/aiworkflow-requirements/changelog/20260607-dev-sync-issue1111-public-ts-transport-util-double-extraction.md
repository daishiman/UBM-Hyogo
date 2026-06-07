# dev sync: 第 6 故障レイヤー＝両ブランチが proxy transport util を別名モジュールへ二重抽出し共有 call-site `apps/web/src/lib/fetch/public.ts` でのみ衝突する apps ソースコード衝突を解消（2026-06-07 issue-1111）

- 日時: 2026-06-07
- ブランチ: `docs/issue-1111-proxy-transport-util-unify-spec` ← `dev`（sub-worktree wt-8・**6 behind / 3 ahead**、ローカル dev = origin/dev `e679722f5` 一致で dev 同期は no-op・独自コミット 0）
- 関連: lessons L-DEVSYNC-115（正本）/ task-specification-creator SP-DEVSYNC-107
- 事象: `git merge dev --no-edit` の content CONFLICT は **6 file**。内訳:
  - skill-index 5 file（`SKILL.md` + `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}`）＝ `pnpm sync:resolve`（`union-resolving 4 files` + keywords `--ours` + rebuild）で機械解消。
  - **`apps/web/src/lib/fetch/public.ts`**（resolver `WARN unhandled` で残置）＝ 手動解消。feature（issue-1111）が新規 `transport-select.ts`（`resolveServiceBinding`/`selectAndFetch`/`base-unavailable`）を導入し public/admin route/server-fetch を経由化、dev は独立に `transport.ts`（`resolveApiFetch`/`fetchViaApiTransport`）を導入し auth/me/authed + public.ts を経由化＋`NEXT_PUBLIC_API_BASE_URL` 対応追加。**同一関心事の二重抽出**で両者が touch した唯一の共有 file = public.ts でのみ 3-region 衝突。
- 解消（public.ts 3 region）:
  - `grep -rln` で両 module の参照元を列挙 → public.ts 以外は互いに素 → **両 module 温存**（削除すると相手 call-site 破壊）。
  - region 1（import）: 共通領域が `getEnvironment()` を使うため dev 側 `import { getEnvironment, getPublicFetchEnv }` を採用 + HEAD 側 `transport-select` import を採用。両側に残った未使用 `DEFAULT_BASE_URL` は削除。
  - region 2（`getServiceBinding`）: HEAD の `disableBinding` 構造を維持しつつ dev の `NEXT_PUBLIC_API_BASE_URL ?? PUBLIC_API_BASE_URL` 改善のみ graft。
  - region 3（`doFetch` 本体）: ブランチ目的（public.ts を `transport-select` 経由に統一）に従い HEAD 側 `selectAndFetch` + `base-unavailable` ハンドリングを採用。
- 検証: `git diff --diff-filter=U` 0 / 実マーカー 0 → `pnpm install`（no-op）→ `pnpm typecheck` 0（7 project）→ `pnpm lint` 0 → `vitest run public.spec/transport.spec/transport-select.spec` = **34 pass** → `bash scripts/verify-no-localhost-bake.sh` exit 0 → admin route 6 pass。CI コード修正なしで全緑。
- 反映先: 本 changelog + aiworkflow lessons L-DEVSYNC-115 + task-specification-creator lessons SP-DEVSYNC-107。
