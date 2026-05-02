# Lessons Learned — 05b-B Magic Link callback / Auth.js Credentials Provider（2026-05-01）

> task: `05b-B-magic-link-callback-credentials-provider`
> 関連 spec: `api-endpoints.md`（§Auth.js callback / Credentials Provider）/ `environment-variables.md`（§Auth.js callback route 境界）/ `task-workflow-active.md`（05b-B 行）/ `legacy-ordinal-family-register.md`（旧 `02-application-implementation/05b-B-...` path drift）
> 関連 source: `docs/30-workflows/05b-B-magic-link-callback-credentials-provider/outputs/phase-12/skill-feedback-report.md`、`outputs/phase-12/system-spec-update-summary.md`、`outputs/phase-12/phase12-task-spec-compliance-check.md`

## 教訓一覧

### L-05B-B-001: Auth.js Provider ID は **`magic-link`** に統一する
- **背景**: 起票元 `task-05b-authjs-callback-route-credentials-provider-001.md` 初稿で `signIn("credentials")` 表記が混在し、Phase 2 設計と実装で provider id がドリフトした。
- **教訓**: Auth.js は内部的に `account.provider="credentials"` を保持するが、ユーザー記述・spec 文面では `id="magic-link"` を正本とする。`signIn("magic-link", ...)` を呼び、`signIn` callback では `account?.provider === "credentials"` で credentials family を判定する（Auth.js 仕様による family 名）。両者を spec/コードで使い分け、**spec 上の id 名と Auth.js 内部 family 名を混同しない**。
- **将来アクション**: Provider 系タスクでは Phase 2 設計時に「ユーザー記述 id（spec 正本）」と「Auth.js 内部 family（callback 判定子）」を 2 軸で表に書き出す。

### L-05B-B-002: `apps/web` callback は `apps/api` verify への単方向委譲、D1 直参照禁止を維持する
- **背景**: callback route で session 確立まで完結させると `apps/web` が D1 binding を取得しがちで、不変条件 #5（D1 access は apps/api 内の use-case / repository に閉じる）を破る。
- **教訓**: `GET /api/auth/callback/email?token=&email=` は **token 検証を `apps/api` `POST /auth/magic-link/verify` に委譲**し、戻り値の `SessionUser` を Credentials Provider の `verifiedUser` に渡して `signIn("magic-link", ...)` でのみ session を確立する。`apps/web` は D1 binding を一切持たない。boundary check で fs-check を回し、`apps/web` 配下の D1 import 0 件を不変条件として固定する。
- **将来アクション**: Auth bridge 系タスクでは Phase 4（テスト戦略）に boundary check（fs-check）を必ず含め、Phase 11 の evidence にも boundary 結果を載せる。

### L-05B-B-003: docs-only / spec_created と implemented-local は **artifacts.json metadata で wave 同期**する
- **背景**: 旧 `_legacy` path にあった頃は `spec_created` 想定で artifacts.json と正本索引が組まれていたが、本 wave で実装が走った結果 `implemented-local` に切り替わり、index/artifacts/system-spec の 3 箇所で stale contract が残りやすかった。
- **教訓**: status を `implemented-local / implementation / NON_VISUAL` に切り替えるときは、root `artifacts.json` / `outputs/artifacts.json` / `system-spec-update-summary.md` / `task-workflow-active.md` / `resource-map.md` / `quick-reference.md` を **同一 wave で sync** し、stale contract withdrawal セクションに「旧記述 → 現行記述」を残す。`commit / push / PR` を伴わない docs-only でも、metadata の `taskType` / `visualEvidence` / Phase 13 approval gate を必ず明記する。
- **将来アクション**: status 遷移時は `system-spec-update-summary.md` の `stale contract withdrawal` を 必須セクション化し、Phase 12 compliance check で 5 sync target の差分を grep で確認する。

### L-05B-B-004: Path drift（カテゴリ移動）は **legacy-ordinal-family-register.md** で必ず追跡する
- **背景**: 当初は `02-application-implementation/05b-B-magic-link-callback-credentials-provider/` 配下で起票されたが、canonical workflow 直下（`docs/30-workflows/05b-B-...`）へ移動した。旧 path の citation が複数 reference に残っていた。
- **教訓**: 親 dir を移動・削除する場合は、`legacy-ordinal-family-register.md` に `旧 path → 現行 path` 行を追加し、参照 reference 全て（resource-map / quick-reference / task-workflow-active / api-endpoints / environment-variables）を grep で再点検する。`docs/30-workflows/02-application-implementation/...` 配下の deletion は legacy register に登録するまでマージしない。
- **将来アクション**: workflow root の rename / move 時は `legacy-ordinal-family-register.md` 更新を Phase 12 の必須 task に含める（compliance check で empty diff の場合は move なしと判定）。

### L-05B-B-005: dev-server curl / Auth.js real Set-Cookie / staging smoke は **09a 系 runtime evidence に委譲**する
- **背景**: 05b-B local implementation は typecheck / focused tests / boundary check で PASS だが、dev-server curl / Auth.js real Set-Cookie / Cloudflare Workers runtime / staging deploy 経由の cookie smoke は wrangler dev 起動と AUTH_URL / INTERNAL_API_BASE_URL の env binding が前提。
- **教訓**: `implemented-local` で完結し、runtime smoke を後続 wave に委譲する場合は、`unassigned-task-detection.md` で **新規 unassigned task を作らない**ことを明記し、09a / 08b の既存 staging smoke task に「auth flow を検査範囲に含める」ことだけ追記する。新規 unassigned task の濫造は backlog 肥大化を招く。
- **将来アクション**: implemented-local close-out では `delegated_to_<existing-task>` 列を `unassigned-task-detection.md` に必ず付け、新規起票の根拠（既存 task で吸収不能な独立成果物がある場合のみ）を明示する。
