# CI 改善: dev sync 後の e2e 失敗 2 件を **in-process mock（auth.ts）と standalone mock（e2e-mock-api.mjs）の parity 漏れ**として解消（2026-06-09 `docs/public-member-detail-survey-fields-spec`）

- 日時: 2026-06-09（dev sync（behind9/union5）push 後の CI フォローアップ）
- ブランチ: `docs/public-member-detail-survey-fields-spec`（PR #1170・公開メンバー詳細を proto 準拠 5 セクション化）
- 起点: ユーザー指示「CI が失敗していたら CI を改善・コンフリクトが発生していたら解消」。`gh pr checks 1170` で **e2e（desktop-chromium/firefox/mobile-webkit）/ e2e-tests-coverage-gate / visual 系が fail**、CI は最新コミット `afcc4b894` に対する実失敗。コンフリクトは dev sync で解消済（残 0）。
- 失敗 2 件の特定（`gh api repos/.../actions/jobs/<id>/logs` を file 化して grep・`gh run view --log` は本リポジトリ巨大ログで空返しするため API 直叩きが有効）:
  1. `public-member-detail-richness-screenshots.spec.ts:30` → `Error: mock control /__test__/public-member-detail failed with 404`
  2. `serial-06-member-detail.spec.ts:25` → `expect(locator('[data-stable-key="urlOthers"]')).toBeVisible()` element not found
- **🔴根本原因＝mock の二重実装 parity 漏れ**: e2e mock は 2 実装が**同一契約で並走**する設計（`apps/web/playwright/fixtures/auth.ts:344` に明示コメント「CI では scripts/e2e-mock-api.mjs が応答するため、規約を揃える」）:
  - `apps/web/playwright/fixtures/auth.ts` = local `pnpm test:e2e` 用 **in-process** mock
  - `scripts/e2e-mock-api.mjs` = CI（`.github/workflows/e2e-tests.yml:48` の `node scripts/e2e-mock-api.mjs`）用 **standalone** mock
  - 5 セクション化 PR は in-process 側にのみ `/__test__/public-member-detail` 制御ルート + survey 全項目 scenario レスポンス（full/sparse/message-hidden）を追加し、**standalone 側の parity 更新が漏れていた**。CI は standalone を使うため (1) 制御ルート 404・(2) `buildPublicProfile` が最小 1 フィールド（`member_display_name`）のみで `urlOthers` 不在 → 2 件 fail。`git show dev:.../auth.ts | grep -c public-member-detail` = 0 / feature 側 = 2 で「feature 由来の新機能」と確定（dev sync が壊したのではない）。
- 解消（`scripts/e2e-mock-api.mjs` を auth.ts と同一契約へ）:
  1. `state` / `resetState()` に `publicMemberDetailScenario: "full"` を追加
  2. `buildPublicProfile(id)` を scenario 対応へ拡張（full/message-hidden = survey 全 stableKey `hometown`/`businessOverview`/`skills`/`canProvide`/`hobbies`/`recentInterest`/`motto`/`otherActivities`/`urlWebsite`/`urlOthers`/`selfIntroduction` を充填・sparse = profile 基本 2 項目へ縮約・message-hidden は `selfIntroduction` 空文字で MessageCard null 化）
  3. POST `/__test__/public-member-detail` 制御ルート追加（不正 scenario は 400）
- 検証（loopback で `node fetch`・`curl` は本 sandbox で deny されるため node script で代替）: standalone mock を `E2E_MOCK_API_PORT=8799` 起動 → full=13 fields/urlOthers true/businessOverview true/selfIntro 充填/attendance session_task18・制御ルート 200・sparse=2 fields/urlOthers false・message-hidden=selfIntro 空/urlOthers present・invalid=400 を全確認。`schemas.PublicMemberDetailZ` の `safeJson` 適合（500 violation ログ 0）。`pnpm lint` exit 0。
- **教訓（再発防止）**:
  - **L-CIE2E-MOCK-PARITY-001**: e2e mock は in-process（auth.ts）/ standalone（e2e-mock-api.mjs）の 2 実装 parity 契約。**新規 `/__test__/*` 制御ルート・新規 fixture レスポンスを追加する PR は必ず両方に同じ契約を実装する**。local `pnpm test:e2e`（in-process）は緑でも CI（standalone）だけ落ちるため、unit/typecheck/lint は全 pass のまま e2e のみ fail する形で表面化する（focused Vitest 緑 ≠ e2e 緑）。
  - **L-CIE2E-MOCK-PARITY-002**: 巨大 e2e ログは `gh run view --log` が空返ししやすい → `gh api repos/{o}/{r}/actions/jobs/{jobId}/logs > /tmp/x.log` で file 化し `✘`/`Error:`/`expect(`/`locator(` を grep するのが確実。`--log-failed` も空のことがある。
  - **L-CIE2E-MOCK-PARITY-003**: standalone mock（`e2e-mock-api.mjs`）は `schemas.*Z.safeParse` を通すため（issue-667）、移植レスポンスは contract schema 適合必須。`PublicMemberDetailZ` は `.passthrough()` + `publicSections: z.array(z.unknown())` と緩いが、`summary.{fullName,ubmZone,ubmMembershipType}` は必須。
- 反映先: 本 changelog + 両 SKILL-changelog.md 1 行。`task-specification-creator` には patterns-testing 観点で「e2e mock 二重実装 parity」を別途追補（後続編集）。新規 SSOT lesson 番号は L-CIE2E-MOCK-PARITY-001..003 として本 changelog に集約（lessons-learned 本体インフレ回避）。
