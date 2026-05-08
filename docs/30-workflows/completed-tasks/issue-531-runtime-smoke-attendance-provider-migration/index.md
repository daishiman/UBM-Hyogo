# issue-531-runtime-smoke-attendance-provider-migration — タスク仕様書 index

[実装区分: 実装仕様書]

> ユーザー指定はなし。本タスクは `apps/api` の staging deploy 済み Worker への runtime smoke を主目的とし、smoke 実行スクリプト（`scripts/smoke/`）追加・evidence redactor・親タスク `workflow_state` 同期ゲートを伴うため、CONST_004 に従い実装仕様書として作成する。Cloudflare staging への deploy 自体は親タスクで実施済みであり、本タスクでは `apps/api/src` の endpoint / D1 schema 変更は加えない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | attendanceProvider middleware Cloudflare staging runtime smoke |
| タスクID | task-imp-issue-531-runtime-smoke-attendance-provider-001 |
| ディレクトリ | docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration |
| Issue | #531（state: CLOSED — closed のまま spec を作成） |
| 親タスク | issue-371-ut-02a-followup-003-hono-ctx-di-migration（completed-tasks 配下） |
| Wave | 3 (runtime verification follow-up) |
| 実行種別 | sequential（deploy 検証 → smoke → evidence → 親 state 同期の順序固定） |
| 作成日 | 2026-05-07 |
| 担当 | spec drafted on this branch（feat/issue-531-runtime-smoke-attendance-provider） |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL |
| 優先度 | priority:medium |
| 規模 | scale:small |
| 発見元 | issue-371 Phase 12 unassigned-task-detection（`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`） |

## purpose

`issue-371-ut-02a-followup-003-hono-ctx-di-migration` で実装された
`attendanceProvider` middleware DI 移行（silent fallback 廃止 → throw 化）に対し、
Cloudflare staging 環境で **実踏 runtime evidence を取得できる runner と証跡境界** を整備し、staging credentials 提供後に親タスクを
`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` に遷移できる状態にする。

具体的には:

- `/admin/members*` と `/me*` の read-only GET route を staging で実行し、route ごとの実 response contract を検証する。DI-bound evidence は `/admin/members/:memberId` と `/me/profile` に限定し、paging GET は route-local provider path の availability evidence として扱う
- `attendanceProvider not bound to context` throw 経路の unit test PASS を再確認
- 実行 evidence（HTTP status / jq contract / array length summary のみ）を canonical path 配下に保管し、raw response body は永続化しない
- session cookie / Bearer token / OAuth secret / PII が evidence ログに混入していないことを、summary-only logging と grep-gate で機械的に保証
- 親タスク `workflow_state` は runtime smoke PASS 後にのみ `completed` / `PASS_RUNTIME_VERIFIED` へ書き換える。現時点では credentials 未提供のため pending を維持する

## scope in / out

### scope in

- `scripts/smoke/runtime-attendance-provider.sh`（新設）— staging Worker への curl smoke runner。Bearer / session cookie は環境変数経由で受け、出力は status / contract / count summary のみ
- `scripts/smoke/redact.sh`（新設）— `Set-Cookie` / `authorization:` / `cf-*` token を `[REDACTED]` で置換する filter
- `apps/api/src/repository/__tests__/builder.test.ts`（既存）— `attendanceProvider not bound to context` throw assertion の PASS log を Phase 11 evidence として固定（既に AC-4 を満たしているため新規テストは追加しない。実行 evidence のみ追加）
- `outputs/phase-11/evidence/{typecheck,lint,test,build,grep-gate,runtime-smoke}.log`（新設）
- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md`（既存）— runtime smoke PASS 後にのみ `workflow_state: completed` / `PASS_RUNTIME_VERIFIED` へ更新。spec sync だけでは編集しない

### scope out

- `apps/api` source 改修（builder / middleware / route）— 親タスクで完了済み
- 新規 endpoint / D1 schema 変更 / Google Form schema 変更
- production deploy（本タスクは staging のみ。production gate は別タスク）
- 大規模 e2e テスト基盤導入（curl による non-visual evidence で十分）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | issue-371-ut-02a-followup-003-hono-ctx-di-migration | コード正本。staging deploy も親タスク Phase 13 で実施済み |
| 上流 | apps/api/wrangler.toml `staging` env | smoke 対象 Worker |
| 必須 | scripts/cf.sh / scripts/with-env.sh | Cloudflare CLI / 1Password 経由実行ラッパー |
| 必須 | 1Password 環境変数（`STAGING_BEARER` / session cookie 等） | smoke 認証情報の正本（実値は `.env` op 参照） |
| external gate | Cloudflare staging 環境の到達性 | DNS / WAF が staging Worker を返却すること |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件（D1 直接アクセス禁止 等） |
| 必須 | docs/00-getting-started-manual/specs/02-auth.md | session / Bearer 認証契約 |
| 必須 | docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md | 親タスク仕様（runtime pending 状態） |
| 必須 | apps/api/src/routes/admin/members.ts | smoke 対象 admin route 一覧（`/members`, `/members/:memberId`, `/members/:memberId/attendance`） |
| 必須 | apps/api/src/routes/me/index.ts | smoke 対象 me route 一覧（`/`, `/profile`, `/attendance`, `/visibility-request`, `/delete-request`） |
| 必須 | apps/api/src/middleware/repository-providers.ts | provider middleware 結線正本 |
| 必須 | apps/api/src/repository/__tests__/builder.test.ts | throw assertion 正本（line 192 / 301） |
| 参考 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由の必須化 |
| 参考 | docs/00-getting-started-manual/specs/13-mvp-auth.md | admin gate 順序 |

## Acceptance Criteria

| ID | 内容 |
| --- | --- |
| AC-1 | route inventory が `apps/api/src/routes/admin/members.ts`（GET /members, GET /members/:memberId, GET /members/:memberId/attendance）と `apps/api/src/routes/me/index.ts`（GET /, GET /profile, GET /attendance, POST /visibility-request, POST /delete-request）の全 route を網羅し `outputs/phase-02/route-inventory.md` に記録 |
| AC-2 | staging で `/admin/members`, `/admin/members/:memberId`, `/admin/members/:memberId/attendance` が `200` を返す。`/admin/members` は `members` 配列、`/admin/members/:memberId` は `attendance` 配列、`/admin/members/:memberId/attendance` は `records` 配列を検証する |
| AC-3 | staging で `/me/`, `/me/profile`, `/me/attendance` が `200` を返す。`/me/` は `user.memberId`、`/me/profile` は `profile.attendance` 配列、`/me/attendance` は `records` 配列を検証する |
| AC-4 | `attendanceProvider not bound to context` throw が `apps/api/src/repository/__tests__/builder.test.ts:192,301` の unit テストで assert され、Phase 11 `test.log` の PASS summary に含まれる |
| AC-5 | `outputs/phase-11/evidence/*.log` に session cookie 値 / Bearer token / `cf-*` token / OAuth secret / email / fullName / profile body 実値が一切含まれない（summary-only logging + `grep-gate.log` で機械的検証） |
| AC-6 | 親タスク `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/index.md` は runtime smoke PASS まで `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` を維持し、偽の `PASS_RUNTIME_VERIFIED` にしない |
| AC-7 | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test` 全 PASS（local PASS 5 点セット） |
| AC-8 | `outputs/phase-12/` に `main.md` + Phase 12 6 必須タスク（implementation-guide / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / system-spec-update-summary）が配置される |
| AC-9 | Phase 13 commit / PR 作成は user 明示承認まで保留される |

## phase index

| Phase | ファイル | 概要 |
| --- | --- | --- |
| 1 | [phase-01.md](phase-01.md) | 要件定義（真の論点 / 4 条件評価 / 不変条件 / artifacts.json metadata 確定） |
| 2 | [phase-02.md](phase-02.md) | 設計（route inventory / smoke 順序 / redact 方針 / evidence canonical path） |
| 3 | [phase-03.md](phase-03.md) | 代替案比較 ADR（curl / wrangler tail / Playwright の 3 案比較、curl 採用根拠） |
| 4 | [phase-04.md](phase-04.md) | テスト戦略（既存 unit test PASS 確認 + smoke runner 引数契約テスト） |
| 5 | [phase-05.md](phase-05.md) | 実装ランブック（smoke スクリプト新設 / redact filter / evidence 配置） |
| 6 | [phase-06.md](phase-06.md) | コードレビュー観点（secret hygiene / shell 安全性 / 冪等性） |
| 7 | [phase-07.md](phase-07.md) | 静的解析・型チェック（shellcheck / typecheck） |
| 8 | [phase-08.md](phase-08.md) | unit / integration test 実行 |
| 9 | [phase-09.md](phase-09.md) | 不変条件・契約整合性検査（D1 直接アクセス禁止 / route 契約） |
| 10 | [phase-10.md](phase-10.md) | リスク再評価（staging WAF / rate limit / production 誤打鍵） |
| 11 | [phase-11.md](phase-11.md) | contract evidence + runtime smoke evidence（NON_VISUAL） |
| 12 | [phase-12.md](phase-12.md) | implementation-guide / 親タスク state 境界 / unassigned 検出 / skill feedback / compliance |
| 13 | [phase-13.md](phase-13.md) | commit / PR 承認ゲート（user 明示承認必須） |
