# Phase 13: PR作成

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-me-404-authenticated-admin-recovery` |
| Phase | 13 / 13 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | pending_user_approval |
| workflow_state | `implemented_local_runtime_pending` |
| 想定 PR base | `dev` |
| relatedIssue | null（staging 実機観察起点・ユーザー報告 2026-06-13 10:38 JST・JWT 提供あり） |

## 目的

ユーザー承認後に PR を `dev` 宛に作成する。本 wave は `implemented_local_runtime_pending`（実装ローカル実装済み・本番コード未変更）であり、staging deploy・復旧検証・commit・push・PR は user-gated。本 Phase は PR 作成の多段ゲートと PR 構成を仕様として確定する。commit / PR / push / deploy はユーザー明示承認後のみ実行する（CONST_002）。

## 実行タスク

### 多段ゲート（spec / impl / recovery / external-ops）

| Gate | 内容 | 承認方法 |
| --- | --- | --- |
| **Gate-A（spec）** | spec 完了（Phase 1〜12 + 4 タスク仕様 T01〜T04 + strict 7 + Phase 11 復旧検証手順 RT-A〜RT-E + unassigned 検出 current 0 件 / baseline 3 件） | ユーザー明示 OK（artifacts.json で passed 済） |
| **Gate-B（impl）** | コード実装 + local 検証: `mise exec -- pnpm typecheck` / `pnpm lint` / focused vitest（`error-handler.spec.ts` / `safe-fetch.spec.ts`）PASS + `bash -n scripts/smoke/runtime-admin-api.sh` PASS + `bash -n scripts/diagnose-profile-session.sh` PASS + apps/api `/me` route 非接触（`git diff dev --name-only \| grep '^apps/api/src/routes/me/'` 空）+ localhost 焼き込みなし（`grep -rn '127.0.0.1:8888' apps/web/src` 空） | ユーザー明示 OK |
| **Gate-B'（recovery verification）** | staging 復旧検証: RT-A api deploy → RT-B diagnose route 差分 + parity → RT-C minted-cookie 認証 `/me` 200 → RT-D `/profile` 正常描画 + 復旧後 screenshot →（非復旧時）RT-E で S1〜S3 確定 | ユーザー明示 OK（staging 認証・deploy 権限必須・user-gated） |
| **Gate-C（external-ops）** | commit / push / PR open 承認 | ユーザー明示 OK |

各 Gate を独立に承認させる。合算承認は禁止。Gate-B' / Gate-C は staging 認証セッション・deploy 権限が必要なため user-gated（Claude Code は取得しない）。

### PR 構成

| 項目 | 値 |
| --- | --- |
| Title | `fix(api,web,ci): recover staging /profile MEMBER_SESSION_404 with apps/api auto-CD, notFound observability, and web route-404 logging` |
| Base | `dev` |
| Head | `fix/profile-me-404-authenticated-admin-recovery` |

### PR 本文に含める要素

1. **4 タスク要約（T01〜T04）**
   - T01（apps/api）: `notFoundHandler`（`error-handler.ts:86`）に構造化診断ログ `{ reason:"route_not_matched", method, path, hasAuthorization, hasSessionCookie }` を追加。`/me` 404 の data-cause（route 未マッチ / 認証 / data）をログだけで一意化（D-B 根治・AC-2）。応答 body（`UBM-1404`）・status `404` 不変。secret は boolean 化のみ。
   - T02（.github/workflows + scripts）: apps/api 自動 CD `.github/workflows/api-cd.yml` を `web-cd.yml` 同型で新設（dev→staging / main→production・`bash scripts/cf.sh deploy --config apps/api/wrangler.toml`）。post-deploy smoke gate で `/me/healthz` 200 + minted-cookie 認証 `/me` 200 を検証（probe-1=200 かつ probe-2=404 で S1 を CI が捕捉）。S1/D-A 根治・AC-3。
   - T03（apps/web）: `safe-fetch.ts:69` `logServerFetchFailure` で `code` が `*_404` のとき `routeNotFound:true` を `server_fetch_failed` に追加（既存 transportKind/baseHost/status 同梱・UI 不変・AC-4）。
   - T04（scripts）: `diagnose-profile-session.sh` に `/me/healthz` vs `/me` の route 存在差分（`api_route_diff`）+ web↔api deploy parity hint を追加（read-only・冪等・secret 非出力・AC-5）。
2. **確定事実 F-1〜F-9**: 表示文言は `MEMBER_SESSION_404` 専用（F-1）/ `/me` HTTP 404 のときのみ生成（F-2）/ 401 なら redirect ＝ 404 確定（F-3）/ valid JWT・新規ログイン直後（F-4）/ D1 identity + consented status 逆算確定（F-5）/ api `/me` は有効認証下で 200/401/410/500 のみ（F-6）/ notFoundHandler UBM-1404（F-7）/ apps/api 自動 CD 不在（F-8）/ transport chain は HTTP エラー応答で fallback しない（F-9）。
3. **AC（AC-1〜AC-10）**: 認証 `/me` 200 復旧（AC-1）/ ログのみで data-cause 切り分け（AC-2）/ api 自動 deploy + smoke gate（AC-3）/ web route-404 ログ（AC-4）/ diagnose route 差分 + parity・secret 非出力（AC-5）/ `/me` path/shape/status + UI 文言不変（AC-6）/ env アクセサ経由・fail-closed・`scripts/cf.sh` 経由（AC-7）/ `*.spec.{ts,tsx}` のみ・type/lint/test green（AC-8）/ secret/cookie/JWT/memberId 非転記（AC-9）/ commit/PR/push/deploy は user-gated（AC-10）。
4. **既知スコープ外**: data-cause が S3（401/410）と Phase 11 RT-E で確定した場合は本 WF スコープ外となり、admin `/profile` 専用 UX = Issue #1192 / environmentExplicit fail-closed = Issue #1234（FU-001）へ委譲する（新規未タスクを作らず既存 Issue を追跡先とする）。
5. **Test plan**: typecheck / lint / focused vitest（api + web）/ `bash -n`（smoke runner + diagnose）/ apps/api `/me` route 非接触 grep / localhost 焼き込み grep / staging deploy 後 diagnose 2 系統（RT-B・user-gated）/ `/profile` 正常描画 + 復旧後 screenshot（RT-D・auth-required user-gated）。

> 本ワークフローは独立 issue 番号を持たない（relatedIssue=null）ため、PR 本文に issue クローズ文言（`Closes/Fixes/Resolves`）は付けない。Issue #1192/#1234 は OPEN のまま委譲先として参照する（クローズ可否はユーザー判断）。

### blocked 条件

- Gate-A〜Gate-C のいずれかが未承認 → Phase 13 blocked。
- focused vitest または typecheck/lint fail → Phase 8（リファクタリング）/ Phase 5（実装手順）へ戻る。
- `git diff dev --name-only | grep '^apps/api/src/routes/me/'` が空でない（`/me` route 接触）→ 該当変更を revert（AC-6 違反）。
- api notFound 応答 body/status または `/profile` UI 文言が変わった → revert（AC-6 違反）。
- diagnose / smoke ログに cookie/token/memberId/secret が混入 → revert（AC-9 違反）。

## 参照資料

- `outputs/phase-5/task-01..04-*.md`（実装仕様書本体）
- `outputs/phase-11/manual-test-result.md`（RT-A〜RT-E・Gate-B' の正本）
- `outputs/phase-12/implementation-guide.md`（PR 本文の根拠）
- `_shared-context.md`（SSOT・F-1〜F-9 / S1〜S3 / AC-1〜AC-10）
- `CLAUDE.md` §「PR作成の完全自律フロー」

## 成果物

- `outputs/phase-13/phase-13.md`（本仕様）
- user-gated PR 作成後に PR URL を `outputs/phase-13/pr.md` 等に記録予定

## 完了条件

- [ ] Gate-A〜Gate-C すべてユーザー承認済み（user-gated）
- [ ] PR が `dev` base で open され URL が記録されている
- [ ] PR 本文に 4 タスク要約（T01〜T04）・確定事実 F-1〜F-9・AC・既知スコープ外が含まれている
- [ ] CI（required status checks）すべて green

## 統合テスト連携

Gate-B（local 検証）と Gate-B'（staging 復旧検証）の証跡が PR の Test plan へ 1:1 で転記される。RT-E で data-cause が S3 と確定した場合は、PR マージ後に Issue #1192/#1234 への委譲をユーザーへ提案する（本 WF はスコープ外）。
