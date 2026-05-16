# E2E Quality Uplift Stage 0-3 実装教訓（2026-05）

## 対象

- workflow: `docs/30-workflows/e2e-quality-uplift-stage-{0,1,2,3}/`
- 起案ブランチ: `feat/e2e-quality-uplift`
- 同期 changelog: `.claude/skills/aiworkflow-requirements/changelog/20260509-e2e-quality-uplift-stage0-3.md`
- artifact inventory: `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`

## Lessons

### L-E2EQU-001: Stage 0..3 4 段分割と spec_verified_pending_dependency 状態の運用

- **状況**: E2E 品質向上を 1 ワークフローで完結させると Phase 4-13 が肥大化し、tier-aware coverage / regression assertion / branch protection contexts 正本化など責務の異なる作業が混入する。実装が他ステージの land に gated されるため、PR 単位でも実装責務と仕様確定責務が混じってしまう。
- **学び**: classification-first で「Stage 0/1 は実装、Stage 2-3 は spec のみ確定（spec_verified_pending_dependency）」と明示分割すれば、Phase 11 evidence の placeholder vs runtime の区別が破綻しない。`spec_verified_pending_dependency` は spec_created と異なり「spec レビュー完了・実装未着手」を表すため、後続 cycle の起点として再利用可能。
- **再発防止**: 同種の「複数依存ステージにまたがる品質 uplift」は最初から 4 stage 分割を default にする。各 stage 直下で完結する `phase-{1..13}.md` + `outputs/phase-{11,12}/` を持たせ、Stage N+1 は Stage N artifact を input として参照する。
- **関連 refs**: `references/task-workflow-active.md`（Stage 0-3 のリンク）, `references/workflow-e2e-quality-uplift-stage-0-3-artifact-inventory.md`

### L-E2EQU-002: Phase 11 placeholder evidence と runtime evidence の lifecycle 分離

- **状況**: Stage 2-3 では実 Playwright run を回さず spec のみ確定する。Phase 11 に placeholder `main.md` だけを置くと、compliance-check が evidence captured と誤判定して false positive を出すリスクがある（L-06B-002 と同型課題）。Stage 1 のように実装へ昇格した stage は tracked runtime evidence に切り替える。
- **学び**: Phase 11 evidence_status を `PLANNED_BECAUSE_PHASE11_NOT_EXECUTED` で明示すれば、Phase 12 strict 7 outputs を先行作成しても compliance-check は「実 evidence 未取得」と正しく判定する。runtime evidence は Stage 0 merge 後の別 cycle に外出し、追跡 workflow を別途立てる。
- **再発防止**: spec-only stage の `phase-11.md` には必ず evidence_status を明記。Phase 11 の `outputs/phase-11/main.md` 冒頭に `> evidence_status: PLANNED_BECAUSE_PHASE11_NOT_EXECUTED` を 1 行入れる慣習を `task-specification-creator/references/phase-template-core.md` 経由で展開する。
- **関連 refs**: `lessons-learned-06b-profile-logged-in-visual-evidence-2026-04.md` の L-06B-002

### L-E2EQU-002A: Server Component fetch は browser route mock では検証できない

- **状況**: `/profile` は Server Component が `fetchAuthed("/me/profile")` を Node 側で実行するため、Playwright の `page.route("**/api/me/profile")` では server state を差し替えられない。
- **学び**: server state round-trip を証明する E2E は、browser request mock ではなく、server fetch 経路へ効く mock API / seed / `INTERNAL_API_BASE_URL` 差し替えを使う。Stage 1 では `apps/web/playwright/fixtures/auth.ts` に local API mock を置き、`/me/profile` の `pendingRequests` を test state として制御する。
- **再発防止**: Next Server Component / route handler の fetch を含む E2E は、Phase 4 の test design で「browser request / server fetch」の2軸を明記する。server fetch に対する `page.route()` だけの AC は FAIL とする。
- **関連 refs**: `apps/web/app/profile/page.tsx`, `apps/web/src/lib/fetch/authed.ts`, `apps/web/playwright/fixtures/auth.ts`

### L-E2EQU-003: Tier-aware E2E coverage policy と workspace 80% guard の責務分離

- **状況**: E2E coverage を全テストに一律 80% で課すと、`evidence-capture` project や experimental spec が常時 fail し、開発を阻害する。一方で workspace 全体の unit/integration coverage 80% guard を緩めると quality regression を招く。
- **学び**: E2E は `tier`（critical ≥80% / standard ≥70% / experimental ≥50%）で運用し、workspace coverage guard は unit/integration の合算 80% を維持する責務分離が成立する。tier は spec-level（`coverageTier`）で宣言し、Playwright project filter で実行を分ける（`evidence-capture` は default run から除外）。
- **再発防止**: `task-specification-creator/SKILL.md` および `references/coverage-standards.md` に tier 定義を canonical 化。`quality-gates.md §7.1 (4)` に `evidence-capture` project 除外条項を 8 行で記述。`coverageTier` が未指定の spec は `standard` を default とする。
- **関連 refs**: `task-specification-creator/SKILL.md`, `task-specification-creator/references/coverage-standards.md`, `task-specification-creator/references/quality-gates.md`

### L-E2EQU-004: Playwright project filter と `evidence-capture` 分離

- **状況**: 06b-C の logged-in visual evidence 用 spec が `desktop-chromium` 等の通常 e2e run に混在し、storageState 不在時に常時 skip ログを吐いて signal-to-noise 比が悪化していた。
- **学び**: `apps/web/playwright.config.ts` の `projects[]` に `evidence-capture` を追加し、`apps/web/package.json` の `e2e` script で `--project=desktop-chromium,desktop-firefox,mobile-webkit` を明示すれば、default run から evidence project を除外できる。evidence 取得は `scripts/capture-profile-evidence.sh` 経由の専用 entrypoint に閉じる。
- **再発防止**: 「default run と evidence run を Playwright project で分離する」を Playwright spec の設計指針として `apps/web/playwright/README.md` に節立てで記述。新規 evidence spec は `evidence-capture` project に紐付ける。
- **関連 refs**: `apps/web/playwright.config.ts`, `apps/web/package.json`, `apps/web/playwright/README.md`, `scripts/capture-profile-evidence.sh`

### L-E2EQU-005: Spec rename / extract 時の責務名 drift 解消（profile-readonly logged-in spec）

- **状況**: `apps/web/playwright/tests/profile-readonly.spec.ts` の中に `06b-C` evidence-only 責務が同居し、ファイル名と中身の責務がずれていた（drift）。stale comment も古い責務を指していた。
- **学び**: 責務が分離可能な spec は「rename + extract（案 A）」が確実。新ファイル `profile-readonly-logged-in.spec.ts` に evidence 責務を移植し、旧ファイルの責務外コードを完全削除。stale comment は 1 行ずつ削除して履歴を git に委ねる。
- **再発防止**: spec の責務 drift を見つけたら、案 A（rename/extract）を default とし、案 B（同居維持）は明確な理由がある場合のみ。06b-C artifact inventory に rename 元情報を 1 行残し、citation 切れを防ぐ。
- **関連 refs**: `apps/web/playwright/tests/profile-readonly-logged-in.spec.ts`, `references/workflow-06b-c-profile-logged-in-visual-evidence-artifact-inventory.md`

### L-E2EQU-006: docs-only spec stage で Phase 12 strict 7 outputs を完備する意義

- **状況**: spec_verified_pending_dependency の stage では「実装が走らないなら Phase 12 outputs を簡略化していいのでは」という誘惑が生じる。しかし簡略化すると後続 cycle で再生成コストが発生し、aiworkflow indexes の整合も崩れる。
- **学び**: docs-only stage でも Phase 12 strict 7 outputs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）を完備するのが trade-off 的に最安。compliance-check で `evidence_status` を正しく書けば false positive は出ない。
- **再発防止**: `task-specification-creator/SKILL.md` の Phase 12 セクションに「docs-only stage でも strict 7 outputs を維持する」を明文化。aiworkflow `quick-reference` / `resource-map` に登録する際、Phase 12 strict 7 の present/absent を明示するカラムを残す。
- **関連 refs**: `task-specification-creator/SKILL.md`, `indexes/quick-reference.md`, `indexes/resource-map.md`

### L-E2EQU-008: SSR Server Component 配下の Playwright fixture 注入境界

- **状況**: `task-spec-2a-admin-requests-e2e` の `/admin/requests` は Next.js Server Component で `apps/web/src/lib/admin/server-fetch.ts` の `fetchAdmin()` を呼び出し SSR 段階で初期 HTML を組み立てる。`page.route("**/admin/requests*")` で API mock を仕込んでも、SSR fetch は browser context の外（Workers/Node 側）で実行されるため intercept されず、初期 HTML が空 list で返ってきて E2E が常時 fail した。
- **学び**: SSR fetch を E2E から差し替えるには「test fixture mode を環境変数で early return させる」二重 guard が現実解。`server-fetch.ts` 冒頭で `process.env.PLAYWRIGHT_ADMIN_REQUESTS_FIXTURE === "1" && process.env.NODE_ENV !== "production"` のときに固定 fixture を return し、production には絶対に到達しない設計とする。`page.route()` は同じ test 内で client-side の `POST /resolve` と二度目の `GET` のみを mock する責務に分離する。
- **再発防止**: SSR を含む admin 系 E2E spec を新規追加する際は、target が SSR 経由か client fetch 経由かを Phase 4 設計で明示し、SSR 経由なら必ず env guard fixture を `apps/web/src/lib/<area>/server-fetch.ts` に同居させる。env 名は `PLAYWRIGHT_<AREA>_FIXTURE` 規約に統一。production guard（`NODE_ENV !== "production"`）と組み合わせ、`apps/web/wrangler.toml` の `[env.production.vars]` には絶対に登録しない。
- **関連 refs**: `apps/web/playwright/tests/admin-requests.spec.ts`, `apps/web/src/lib/admin/server-fetch.ts`, `apps/web/playwright/fixtures/auth.ts`, `docs/30-workflows/task-spec-2a-admin-requests-e2e/phase-4.md`, `docs/30-workflows/task-spec-2a-admin-requests-e2e/outputs/phase-12/implementation-guide.md`

### L-E2EQU-009: middleware admin gate redirect 仕様の E2E 整合（`/login?gate=admin_required`）

- **状況**: 2a で member 権限で `/admin/requests` にアクセスしたときの期待 redirect 先を初版 spec では `/login` としていたが、実 middleware は `/login?gate=admin_required` query を付与する仕様だった。spec 通りに assertion を書くと test が常時 fail する。
- **学び**: middleware が付与する query/hash を含めた最終 URL を E2E 期待値の正本にする。spec 側を実 middleware 仕様に合わせて補正し、middleware 側は変更しない（middleware は他画面でも参照されるため副作用範囲が広い）。
- **再発防止**: admin gate を持つ画面の E2E spec を起こす前に `apps/web/middleware.ts` の admin redirect 分岐を一読して正確な query を Phase 4 に転記する。anonymous は `/login`、member は `/login?gate=admin_required` を共通規約として `references/architecture-admin-api-client.md` 等に追記する。
- **関連 refs**: `apps/web/middleware.ts`, `apps/web/playwright/tests/admin-requests.spec.ts`, `docs/30-workflows/task-spec-2a-admin-requests-e2e/phase-4.md`

### L-E2EQU-007: Branch protection contexts 正本化（Stage 3）の運用ドリフト対策

- **状況**: CLAUDE.md と GitHub branch protection 実値の間で `required_status_checks.contexts` が drift しがちで、CI 名の表記揺れが発生していた（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）。
- **学び**: 正本は GitHub branch protection 実値とし、CLAUDE.md は運用参照に位置付ける。drift 検出は `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection | jq '.required_status_checks.contexts'` を runbook 化して定期実行する。
- **再発防止**: Stage 3 spec は CLAUDE.md の「ブランチ戦略 / Governance」セクションに contexts 表を追加するだけで、enforcement 実体は GitHub API で確認する手順に分離。CLAUDE.md 編集だけで「protection を変えた気になる」事故を防ぐ。
- **関連 refs**: `CLAUDE.md`（ブランチ戦略 / Governance）, `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-12.md`

### L-E2EQU-008: Runtime 評価と spec 完了の状態混同防止（`spec_created / runtime_pending / completed` 三値）

- **状況**: Stage 3 系 spec で「Phase 12 strict 7 outputs が揃った時点で `completed`」と誤記すると、実 CI run（lighthouse-ci / e2e-tests-coverage-gate）未実行のまま `completed` 扱いになり、Phase-12 compliance check が後段で FAIL を返す。`spec_created` と `completed` の二値運用では runtime 未実行と spec 完成を区別できない。
- **学び**: spec 完成 + 実装着地 + runtime 評価という 3 段階を `spec_created` / `runtime_pending` / `completed` の 3 値で厳格に運用する。`runtime_pending` は「spec / 実装は届いているが CI run / branch protection mutation 等の runtime evidence 未確定」状態を表し、Phase-12 compliance check の canonical vocabulary とする。task-workflow-active / artifacts.json / SKILL changelog の status 値はこの三値からのみ採用し、自由記述を許さない。
- **再発防止**: task-workflow-active 行と SKILL changelog の status 列を canonical 値（`spec_created` / `implemented-local` / `runtime_pending` / `completed` / `runtime_evidence_captured` 等）に閉じる lint を入れ、未登録語彙は PR レビューで reject する。Stage 3 系のように runtime gate が user 承認に依存する spec は default で `runtime_pending` を貼る。
- **関連 refs**: `references/task-workflow-active.md` (Stage 3 行), `indexes/quick-reference.md` Stage 3 lookup 表, `SKILL-changelog.md` の status 表記揺れ対策

### L-E2EQU-009: 親 workflow 移動 (`completed-tasks/`) 時の child path drift

- **状況**: Stage 3 親 umbrella を `docs/30-workflows/e2e-quality-uplift-stage-3/` から `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/` に移動した際、子タスク 3a / 3b / 3c の parent ref / lessons-learned 内 cross-reference / resource-map 行に旧 path が残り、後段の link check で drift が露呈した。親移動と子参照更新が別 PR に分かれると修正コストが指数的に増える。
- **学び**: 親 workflow を `completed-tasks/` に archive する PR では、`grep -rn "30-workflows/<old>" docs/ .claude/` を必須 gate にして 0 hits を確認するまで merge しない。子タスクの parent ref（artifacts.json の `parent_workflow` キー、lessons-learned 内の関連 refs、resource-map / quick-reference / task-workflow-active 行）を同 PR 内で同時更新する。
- **再発防止**: workflow 移動チェックリストに「親移動 PR は (a) 親 path replace、(b) 子 spec の parent_workflow / cross-ref replace、(c) skill side の resource-map / quick-reference / task-workflow-active replace、(d) `grep -r` 0 hits、を 1 wave で実施する」を追加。skill-side の verification は `pnpm indexes:rebuild` 後の drift 0 で評価する。
- **関連 refs**: `indexes/resource-map.md` Stage 3 entry, `indexes/quick-reference.md` Stage 3 lookup, `references/task-workflow-active.md` Stage 3 行

### L-E2EQU-010: 決定 ID の単一情報源（phase / artifacts.json / evidence file 3 か所同時更新）

- **状況**: 3a で `Q-02`（`/profile` 縮退判定）の evidence path が `phase-11.md` の説明、`artifacts.json` の outputs 列、`outputs/phase-11/lhci-profile-q02-judgement.md` の冒頭メタ行、の 3 か所で揺れて review fix が複数往復発生した。決定 ID の path 表記が同期しないと compliance-check / link check が偽陰性 / 偽陽性のどちらにも倒れる。
- **学び**: 決定 ID（`Q-NN`, `D-NN`, `O-NN` など）を採番した瞬間、(1) phase-N.md 該当節, (2) `artifacts.json` の `decisions[]` または `outputs[]` 行, (3) evidence file 自体の冒頭メタ行、の 3 か所を「同一文字列」で同期する template を持つ。後追い更新は drift 源になる。
- **再発防止**: phase template に `decision_id / evidence_path / artifacts_json_pointer` の 3 列を必須化し、Phase 12 compliance-check で 3 か所の文字列一致を gate にする。決定 ID 採番時は本体 phase だけでなく artifacts.json と evidence file を同時に作成する。
- **関連 refs**: `indexes/quick-reference.md` Stage 3 lookup（Q-02 evidence path 行）, Phase template (`task-specification-creator` 配下)

### L-E2EQU-011: CI command の決定論性（unpinned `npx` 排除）

- **状況**: 3a Lighthouse CI workflow の draft で `npx wait-on http://localhost:3000` を使ったところ、registry latency / version drift で flake が再現し、LHCI 評価そのものより前段で fail する事故が発生した。`npx <pkg>` は version pin が効かず、CI gate に乗せると非決定的になる。
- **学び**: CI で外部 CLI を呼ぶ場合は `pnpm exec <pkg>` または `node ./node_modules/.bin/<pkg>` で `package.json` lock の version に閉じる。`npx` の利用は禁止し、未インストール bin は dev dep に追加する方を default にする。Lighthouse CI / Playwright 等 retry に弱い flake 系 gate ほど、上流コマンドの決定論性が AC になる。
- **再発防止**: `.github/workflows/*.yml` に対して `grep -nE '\bnpx\b' .github/workflows/` を CI lint に追加し、検出時は fail させる。helper script 経由の場合も同 grep を `scripts/` に拡張する。例外（公式 init コマンド等）は許容ファイル一覧に明記する。
- **関連 refs**: `.github/workflows/lighthouse.yml` (3a), `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3a-lighthouse-ci/`

### L-E2EQU-013: `PLAYWRIGHT_TEST=1` 明示時だけ `PUBLIC_API_BASE_URL` を service binding より優先する

- **状況**: Cloudflare Workers ランタイムでは `apps/web/src/lib/fetch/public.ts` が `env.API_SERVICE` (service binding) を優先する設計だったため、CI 上で `scripts/e2e-mock-api.mjs` を `127.0.0.1:8787` に立てて `INTERNAL_API_BASE_URL` / `PUBLIC_API_BASE_URL` で差し替えても、binding 経由 fetch が先に走り mock に届かなかった。Server Component の SSR fetch を E2E から差し替える経路がふさがると、coverage gate を回しても挙動を再現できない。
- **学び**: `PUBLIC_API_BASE_URL` が明示されているだけで service binding を skip してはいけない。HTTP fallback 優先は `NODE_ENV=test` または `PLAYWRIGHT_TEST=1` の明示 context に限定する。GitHub Actions の一般的な `CI=true` は build/deploy でも立つため transport 判定に使わない。
- **再発防止**: SSR fetch を含む新 helper を作るときは「production / staging は service binding 優先」「Vitest / Playwright 明示時だけ base URL HTTP 優先」の二軸を helper の最上段に書く。`apps/web/src/lib/fetch/public.spec.ts` で `CI=true` 単独では service binding を維持する safety test と、`PLAYWRIGHT_TEST=1` fallback test の両方を固定する。
- **関連 refs**: `apps/web/src/lib/fetch/public.ts`, `apps/web/src/lib/fetch/public.test.ts`, `scripts/e2e-mock-api.mjs`, `.github/workflows/e2e-tests.yml`

### L-E2EQU-014: Playwright reporter 配列に monocart を追加するときは末尾追加で既存 3 件を維持する

- **状況**: 3b 初版 draft では `apps/web/playwright.config.ts` の `reporter` を `[['monocart-reporter', {...}]]` で置き換える形にしてしまい、既存の `html` / `json` / `list` reporter が失われ、08b-A artifact upload や CI ログ出力が壊れる回帰が発生しかけた。Phase 4 design で「既存 reporter を維持」を明示しないと、新 reporter 追加が既存 evidence パイプラインを壊す。
- **学び**: reporter 追加は **配列末尾追加** を default にする。`html` / `json` / `list` の 3 件は別 workflow（playwright-report upload / monocart-report upload / CI 行ログ）が依存しており、コミット前に `grep -nE "html|json|list" playwright.config.ts` で 3 件残存を機械検証する。`monocart-reporter` の出力先は `playwright/evidence/` 以下に閉じ、既存 `playwright-report/` には触れない。
- **再発防止**: Playwright reporter 系の Phase 12 compliance check に「既存 reporter 維持・末尾追加・出力先 path 衝突なし」の 3 項目を追加。`apps/web/playwright/README.md` の reporter 節に「追加は末尾、削除は別 PR」を明文化。
- **関連 refs**: `apps/web/playwright.config.ts`, `apps/web/playwright/README.md`, `docs/30-workflows/completed-tasks/08b-A-playwright-e2e-full-execution/`

### L-E2EQU-015: `THRESHOLD_FIXTURE` override と 3 fixture 構成で coverage gate スクリプト自体を unit test 可能にする

- **状況**: `scripts/coverage-gate-e2e.sh` を実 `coverage-summary.json` だけで検証すると、80% 境界・不在ケース・79.99% near-fail を再現できず、CI で初めて挙動が判明するため fail 修正サイクルが長くなる。`THRESHOLD_FIXTURE` を持たないと、しきい値変更時に regression が出ても気付けない。
- **学び**: shell gate スクリプトには `THRESHOLD_FIXTURE` 環境変数で `coverage-summary.json` 探索 path を override する仕組みを最初から入れる。fixture は `scripts/__tests__/coverage-gate-e2e.fixture/{pass,fail-79,missing}/` の 3 系統（PASS 85.0% / FAIL 79.99% / 不在）で固定し、ローカル T-3b-5..7 で `exit 0 / exit 1 / exit 1` を検証してから CI に乗せる。`set -euo pipefail` と `::error::` / `::notice::` の GitHub Actions annotation 出力を冒頭で固定し、CI ログから境界判定を即座に拾えるようにする。
- **再発防止**: 新規 CI gate shell スクリプトは「fixture override env」「pass / boundary-fail / missing の 3 fixture」「`set -euo pipefail`」「しきい値根拠の `references/quality-gates.md` path コメント」「`shellcheck` violation 0」の 5 点を着地条件にする。actionlint バイナリが用意できない環境では `pnpm dlx @action-validator/cli` で YAML 構文を代替検証し、Phase 12 DoD に「actionlint 不在時は @action-validator/cli」を但し書きで残す。
- **関連 refs**: `scripts/coverage-gate-e2e.sh`, `scripts/__tests__/coverage-gate-e2e.fixture/`, `scripts/e2e-mock-api.mjs`, `task-specification-creator/references/quality-gates.md` §7.5

### L-E2EQU-S3A-001: desired-state manifest と operational SSOT の二層運用（Stage 3 land）

- **状況**: branch protection は GitHub API 実値が operational source of truth であり、repo 内に full PUT body を JSON で固定すると Issue 範囲外の field（`required_pull_request_reviews` 詳細、`allow_force_pushes`、`allow_deletions`、`required_conversation_resolution` 等）まで巻き込んで上書きしかねず、Issue scope 外の rollback 境界が崩れる。Stage 3 では `required_status_checks.contexts` と `strict` のみを desired-state として宣言したい。
- **学び**: `.github/branch-protection/{dev,main}.json` は `required_status_checks.contexts` と `strict` のみを宣言する **desired-state manifest**（PUT body 全体ではない）と位置付け、`.github/branch-protection/apply.sh` を adapter として「fresh GET → contexts/strict 差し替え → CLAUDE.md 不変条件正規化 → optional fields は fresh 値を保持」の 4 段で適用する。drift 検査は read-only な `scripts/verify-branch-protection.sh` に閉じ、契約は最終行 `OK(<branch>): no drift` で表現する。Stage 4 以降で governance field を増やすときは manifest schema を拡張せず、apply.sh の正規化ブロックに不変条件を追加する形で責務分離を維持する。
- **Why:** full-PUT-body 正本化は repo 側の表現力が高すぎ、Issue scope を物理的に閉じ込められない。manifest+adapter+verifier の三層構成にすると「変えたい field のみを `gh api -X PUT` で正規化する」を構造で担保できる。
- **How to apply:** branch protection 変更 spec を立てるときは最初に「どの field を desired にし、どの field を fresh 保持にするか」を Phase 4 に表で書く。新規 invariant は CLAUDE.md 宣言済みのものだけを apply.sh の正規化対象にする（CLAUDE.md 未宣言の値は触らない）。
- **再発防止**: branch protection 系の Phase 12 compliance check に「manifest が full PUT body になっていないこと（=`required_status_checks.contexts`/`strict` 以外を含まない）」「apply.sh が fresh GET と desired を合成していること」「verify.sh の契約行が文字列 `OK(<branch>): no drift` であること」の 3 項目を追加する。
- **関連 refs**: `.github/branch-protection/{dev,main}.json`, `.github/branch-protection/apply.sh`, `scripts/verify-branch-protection.sh`, `references/branch-protection-desired-state-manifest.md`

### L-E2EQU-S3A-002: PR 範囲外の governance drift を同 PR で正規化するか別 issue 化するかの判定基準

- **状況**: Stage 3 の Phase 11 pre snapshot で `enforce_admins=false` / `required_linear_history=false` の drift を検知。Issue #608 のコア責務（required contexts 拡張）とは無関係だが、両者は CLAUDE.md で既に「solo 運用ポリシー」として宣言済みの不変条件であり、放置すると governance 表明と実値が乖離し続ける。一方で全 drift を同 PR で押し付けると scope creep でレビュー境界が膨張する。
- **学び**: drift 正規化の同 PR 取り込み可否は「CLAUDE.md で既に宣言済みの不変条件か」で 2 値判定する。宣言済み (INV-SOLO / INV-ENF / INV-LINEAR / INV-LOCK) は apply.sh の正規化対象として同 wave で吸収して良い。未宣言の field は別 issue 起票で 1 PR 1 責務を維持する。Stage 3 では同 PR 取り込みを選択し、apply.sh のコード内コメントに `INV-*` ラベルで根拠を明示した。
- **Why:** CLAUDE.md 宣言済みの不変条件は「将来どこかで必ず合わせるべき値」なので、観測タイミングで吸収するほうが drift 期間を短くできる。逆に未宣言の値は Issue scope 外の判断を巻き込みうるため、別 issue で議論を分離するほうが rollback 境界が綺麗に保てる。
- **How to apply:** branch protection 系 spec の Phase 4 design に「drift 検知時の判定表（宣言済み inv: 同 PR で正規化／未宣言: O-NN として別 issue 起票）」を必ず置き、apply.sh / verify.sh のコード内コメントには INV ラベルで根拠 path（CLAUDE.md の該当節）を残す。
- **再発防止**: branch protection 系 Phase 11 evidence に pre snapshot を必ず含め、drift 一覧と「宣言済み/未宣言」のラベル付き表を `phase-11/main.md` に固定する。
- **関連 refs**: `CLAUDE.md` Governance / CODEOWNERS 節, `.github/branch-protection/apply.sh`, `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/`, `docs/30-workflows/unassigned-task/task-e2e-stage3c-enforce-admins-claudemd-alignment-001.md`

### L-E2EQU-S3A-003: 集約 required context（`e2e-tests-coverage-gate`）と Lighthouse `nohup`+`wait-on` readiness による安定化

- **状況**: e2e matrix shard 個別（`e2e (desktop-chromium)` 等）を required context 化すると、shard 数だけ required context 表面が増え、shard 増減のたびに branch protection PUT が必要になる。Lighthouse CI 側は production server 起動待ちを手作りの retry loop で実装すると、早期成功時の二重起動・遅延時の SIGTERM 漏れ・ログ未収集が発生しやすい。
- **学び**: required context は **「全 shard 成功 + coverage gate」を集約する単一 job**（Stage 3 では `e2e-tests-coverage-gate`）に閉じる。shard 数や coverage threshold が変わっても required context 名は不変なので branch protection PUT が不要になる。Lighthouse の server 起動待ちは `nohup pnpm --filter @ubm-hyogo/web start > /tmp/web-server.log 2>&1 &` + `echo $! > /tmp/web-server.pid` + `pnpm dlx wait-on -t 120000 http-get://localhost:3000` の 3 行 pattern を default にし、exit code・timeout・cleanup を構造で担保する。
- **Why:** required context は branch protection で参照される「契約面」であり、shard 構成という実装詳細が漏れ出ると、shard 増減のたびに governance PUT を伴う変更になってしまう。Lighthouse の `wait-on` は exit code が明示され、timeout・retry interval が CLI arg で固定できるため、手作り loop よりも CI ログから状態遷移を再構成しやすい。
- **How to apply:** required context を増やすときは「context 名が contract 面を表しているか、実装詳細を漏らしていないか」を Phase 4 design で必ずレビューする。CI で外部サーバ起動を待つ step は `wait-on` を default にし、`npx` ではなく `pnpm dlx <pinned>` を使う（L-E2EQU-011 と整合）。
- **再発防止**: workflow `name:` フィールドと branch protection contexts manifest の文字列一致を Phase 12 compliance check の必須項目にし、`grep -n "^name:" .github/workflows/*.yml` の出力と manifest を突合する。
- **関連 refs**: `.github/workflows/e2e-tests.yml`, `.github/workflows/lighthouse.yml`, `.github/branch-protection/{dev,main}.json`, `references/branch-protection-desired-state-manifest.md`, `references/quality-e2e-testing.md`

### L-E2EQU-012: Branch protection mutation の user gate 設計と `enforce_admins` drift の別 issue 化

- **状況**: 3c で dev/main の required contexts 拡張に `gh api -X PUT /repos/.../branches/{dev,main}/protection` mutation が必要だが、AI agent が即時実行すると user policy（solo dev・enforce_admins / lock_branch などの drift）と衝突する恐れがある。さらに観測中に `enforce_admins` の drift（true → false 等）を検出した場合、同 PR で押し付けると scope creep になり revert コストが跳ねる。
- **学び**: `gh api -X PUT` mutation は spec / runtime / 配線が揃っても **AI が自動実行しない明示 gate** を 3c spec の Phase 13 に固定する。pre/post JSON の read-only evidence（`gh api -X GET ... protection > before.json` 等）は事前取得して spec に添付してよい。観測中に発見した `enforce_admins` / `lock_branch` / `required_pull_request_reviews` 等の drift は同 PR に含めず、O-NN 別 issue として起票し、3c は contexts 拡張の単一責務に閉じる。
- **再発防止**: branch protection 系 spec の Phase 13 雛形に「user 承認後のみ mutation 実行」「drift 観測は別 issue 起票で 1 PR 1 責務」「fresh GET evidence は before / after 双方取得」の 3 条項を必須化。`scripts/cf.sh` 等の wrapper で mutation コマンドを直接書かず、runbook 経由で操作させる。
- **関連 refs**: `docs/30-workflows/e2e-quality-uplift-stage-3-impl/3c-branch-protection-contexts/`, `CLAUDE.md` Governance / CODEOWNERS 節, `references/deployment-branch-strategy.md`
