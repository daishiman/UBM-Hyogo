# issue-864-admin-staging-runtime-smoke-ci-gate

[実装区分: 実装仕様書]

> 判定根拠: issue #864 が要求するのは「staging deploy 後に authenticated `/admin` を実トラフィックで叩き、
> Server Components render error（digest=167275886）の再発を CI で自動検出する gate」。
> これは `.github/workflows/web-cd.yml` への job 追加、`scripts/cf.sh` への `tail` subcommand 追加、
> `scripts/smoke/runtime-admin-web.sh`（新規）+ session cookie mint helper（新規）の実装を伴う。
> ドキュメント・調査のみで完結する余地はなく、CONST_004 のデフォルト（実装仕様書）に該当する。
> automation-30 改善により、仕様書だけでなく runner/mint/CI wiring/skill 正本同期まで同一 wave で実装済み。Cloudflare staging 実走・commit・push・PR のみ user-gated。

## メタ情報

| 項目                | 値                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Task ID             | TASK-ISSUE-864-ADMIN-STAGING-RUNTIME-SMOKE-CI-GATE-001                                    |
| Feature 名          | issue-864-admin-staging-runtime-smoke-ci-gate                                            |
| Task type           | implementation                                                                           |
| visualEvidence      | NON_VISUAL（CI/runtime gate 追加、UI 表示物の意匠変更なし）                               |
| implementation_mode | `new`                                                                                    |
| workflow_state      | `implemented_local_runtime_pending`                                                                            |
| 関連 issue          | #864（クローズ状態を維持。本仕様書作成では issue state を変更しない）                     |
| 親タスク            | `docs/30-workflows/fix-admin-server-components-render-error-stg/`（root-cause 修正側）   |
| 関連 PR             | #877 / #862 / #863（root-cause 修正、merge 済）                                          |
| 対象環境            | Cloudflare Workers staging（`ubm-hyogo-web-staging.daishimanju.workers.dev`）            |
| エラー digest       | `167275886`（再発検出対象。発生時 `error.boundary.caught` scope=admin が emit される）   |
| 想定 1 cycle 完了   | はい（cf.sh tail 追加 → smoke runner 新規 → session mint → web-cd job 追加 → test を 1 PR）|

## 報告事象と issue #864 の本質

```
6622-77ebef8703bc834b.js:41 Error: An error occurred in the Server Components render.
global-error boundary log:
  scope: admin
  digest: 167275886
  event: error.boundary.caught
```

issue #864 は上記 render error 自体の修正（=親タスク `fix-admin-server-components-render-error-stg` + #877/#862/#863 で **修正済み・merge 済**）ではなく、
**「同種 runtime regression を staging deploy 後に CI で自動検出する gate を新設する」**ことを要求している。

現状の調査結論（最新コードに対する再最適化）:

| 既存機構                                       | #864 の要求を満たすか | 理由                                                                 |
| ---------------------------------------------- | --------------------- | -------------------------------------------------------------------- |
| `.github/workflows/web-cd.yml`                 | ❌ 満たさない         | deploy + redaction-check のみ。post-deploy probe が存在しない        |
| `.github/workflows/runtime-smoke-staging.yml`  | ❌ 満たさない         | **API** attendanceProvider smoke 専用。web `/admin` を叩かない       |
| `.github/workflows/playwright-smoke.yml`       | ❌ 満たさない         | PR-time の **local build** に対する smoke。post-deploy Workers ではない |
| `scripts/cf.sh tail`                           | ✅ 本 wave で実装済み | 親 Phase 11 の手動手順を CI runner から呼べる wrapper へ昇格        |
| `docs/.../unassigned-task/UT-29-...`           | △ 隣接するが別物      | 汎用 HTTP healthcheck。authenticated `/admin` render-error gate ではない |

→ **#864 は未解決の真の gap であり、本仕様書の作成・実装が必要**。root-cause bug は直っているが、回帰防止 gate は存在しない。

## 真の論点（task-specification-creator 思考法）

1. **真の論点**: 「render error を直す」ではなく「直った状態が staging deploy のたびに守られる CI gate を作る」。
   親タスクの Phase 11 が手動手順（`scripts/cf.sh tail` + 手動 curl）止まりだったため、回帰検出が人手依存になっている。これを自動 gate へ昇格させるのが本質。
2. **依存関係・責務境界**:
   - `/admin` は **2 層認証ゲート**で守られている — edge `middleware.ts`（`decodeAuthSessionJwt`）と `(admin)/layout.tsx` の `getSession()`（Auth.js `auth()`）。
   - したがって post-deploy probe は「両層を通過する session cookie」を持って `/admin` を叩く必要がある。単純な未認証 GET では `/login` redirect になり render path に到達しない。
   - smoke runner は web 用の独立 runner（`runtime-admin-web.sh`）として `runtime-attendance-provider.sh`（API 用）と責務分離する。
3. **価値とコストの不均衡**: 最大コスト部品は「Auth.js 互換 session cookie の mint」。既存 `mint-staging-bearers.mts`（`signSessionJwt` HS256）が middleware を通過するが、layout の Auth.js `auth()` 復号も通るかは **Phase 1 で実測検証する未確定点**。通らない場合は Auth.js 互換 encode helper を新設する（Phase 2 で分岐設計）。
4. **改善優先順位**: ① token 互換性の実測確認 → ② `cf.sh tail` 追加 → ③ web smoke runner 新設 → ④ web-cd へ `needs: deploy-staging` の gate job 追加 → ⑤ test 追加。
5. **4条件評価**:
   - 価値性: staging deploy ごとに `/admin` render regression を自動検出（人手依存の親 Phase 11 を gate 化）
   - 実現性: 既存 `runtime-smoke-staging.yml` + `runtime-attendance-provider.sh` を構造テンプレートとして再利用でき、初回スコープに収まる
   - 整合性: `scripts/cf.sh` 経由（wrangler 直叩き禁止）、redaction grep gate、env 参照不変条件と整合
   - 運用性: evidence artifact upload + Slack 失敗通知 + 3-state verdict で運用監査可能

## Phase 構成

| Phase | 名称             | 状態        | 出力先                       |
| ----- | ---------------- | ----------- | ---------------------------- |
| 1     | 要件定義         | completed | outputs/phase-1/phase-1.md   |
| 2     | 設計             | completed | outputs/phase-2/phase-2.md   |
| 3     | 設計レビュー     | completed | outputs/phase-3/phase-3.md   |
| 4     | テスト作成       | completed | outputs/phase-4/phase-4.md   |
| 5     | 実装             | completed | outputs/phase-5/phase-5.md   |
| 6     | テスト拡充       | completed | outputs/phase-6/phase-6.md   |
| 7     | カバレッジ確認   | completed | outputs/phase-7/phase-7.md   |
| 8     | リファクタリング | completed | outputs/phase-8/phase-8.md   |
| 9     | 品質保証         | completed | outputs/phase-9/phase-9.md   |
| 10    | 最終レビュー     | completed | outputs/phase-10/phase-10.md |
| 11    | 手動テスト       | completed | outputs/phase-11/phase-11.md |
| 12    | ドキュメント更新 | completed | outputs/phase-12/phase-12.md |
| 13    | PR作成           | pending_user_approval | outputs/phase-13/phase-13.md |

## 受入条件（Acceptance Criteria）

| ID   | 受入条件                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| AC-1 | `scripts/cf.sh` に `tail` subcommand が追加され、`bash scripts/cf.sh tail <worker> --env staging --format json` が `wrangler tail` をラップして動作する |
| AC-2 | `scripts/smoke/runtime-admin-web.sh`（新規）が authenticated `/admin` を GET し、HTTP 200 を assert する         |
| AC-3 | 同 runner が deploy 後の Workers ログから `error.boundary.caught`（scope=admin）/ digest=`167275886` を grep し、検出時 exit 1 する |
| AC-4 | `/admin` probe 用 session cookie が **middleware と layout 両層**を通過することを Phase 1 実測で確認、または Auth.js 互換 mint helper を新設して担保する |
| AC-5 | `.github/workflows/web-cd.yml` に `needs: deploy-staging` の `admin-runtime-smoke` job が追加され、staging push 時のみ発火する |
| AC-6 | smoke evidence（`summary.json` / `runtime-smoke.log`）が artifact upload され、redaction grep gate を通過する（JWT / Cookie / token を leak しない） |
| AC-7 | `scripts/smoke/__tests__/` に新規 runner / mint helper の `*.spec.ts` / `*.test.sh` が追加される               |
| AC-8 | `STAGING_AUTH_SECRET` 等未設定環境では gate を fail させず graceful skip する（既存 runtime-smoke-staging.yml の fallback 方針に整合） |

## 不変条件（CLAUDE.md より）

- Cloudflare 系 CLI は `scripts/cf.sh` 経由のみ（`wrangler` 直叩き禁止）。本タスクは `tail` subcommand を **cf.sh に追加**して達成する
- `.env` の中身を `cat`/`Read`/`grep` で読まない。JWT / API Token / OAuth token 値を出力・ドキュメントへ転記しない（不変条件 3）
- `apps/web` ランタイムの env 参照は `getEnv()` / `getPublicEnv()` 経由のみ（本タスクは web ソース変更を伴わない想定だが、触れる場合は厳守）
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（shell test は `*.test.sh` を踏襲）
- 既存 API endpoint surface のみ利用（新 endpoint 追加・D1 schema 変更・Google Form 仕様変更禁止）
- D1 直接アクセスは `apps/api` に閉じる
- commit / push / PR は user の明示承認後のみ（Phase 13）

## スコープ外（明示的に含めない）

- render error 自体の root-cause 修正（親タスク + #877/#862/#863 で完了済み）
- UT-29 の汎用 HTTP healthcheck（公開ページの可用性監視は別タスク。本タスクは authenticated `/admin` render gate に限定）
- production（main）への同 gate 展開（staging で確立後の将来層。初回スコープは staging のみ）
- Sentry alert ルールの新設（既存 boundary log 検出で代替）

## DoD（Definition of Done）

- AC-1〜AC-8 を全て満たす
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` は phase12/gate metadata PASS、未コミット generated index drift で FAIL（commit禁止スコープのため許容境界）
- `gate-metadata:validate` と `verify:phase12-compliance` が pass
- Gate-A（spec compliance）passed、Gate-B（runtime smoke）は staging 実行が user-gated のため `pending`
