# lessons-learned-task-25-followup-loading-state-observation-fixture-2026-05

`task-25-followup-loading-state-observation-fixture`（Issue #711 / 親 task-25 の `SMOKE-COVERAGE-MATRIX.md` 行 19 `N/A-runtime-observation` 解消）の close-out 教訓。`apps/web/app/loading.tsx` を flaky network throttle に頼らず deterministic に観測する staging smoke fixture を、既存 error-boundary fixture と同一 pattern で追加した。task-25（matrix 起点）/ task-25-followup-error-boundary-smoke-fixture（pattern 流用元）/ task-26（token migration）と連動する fixture 系統の close-out。

## L-T25LF-001: routable wrapper / private source の 2 系統構成を fixture pattern として明文化する

- 状況: 当初 Phase 5 設計では `apps/web/app/__smoke__/loading-state/page.tsx` 1 ファイルで完結させようとしたが、App Router の慣例として `__smoke__` prefix は「非ルータブル想定の private fragment」として扱うべきという親 task-25-followup-error-boundary 側の合意があり、`/smoke/loading-state` を実 URL surface とするための wrapper 層が別途必要になった。
- 問題: private prefix 命名（`__smoke__`）が「Next.js が route として認識しない」という仕様に依存していると誤読され、production build に意図せず exposing される懸念があった。一方で wrapper を別ディレクトリに分ける設計を明文化しないと、後続 fixture（例: error-boundary、members-list、loading-state）ごとに命名や `export { default }` の書きぶりが drift する。
- 解決: `apps/web/app/__smoke__/<name>/` を private source（実装本体）、`apps/web/app/smoke/<name>/` を routable wrapper（`export { default } from "../../__smoke__/<name>/page"`、`export const dynamic = "force-dynamic"` のみ）とする 2 系統構成を 3 fixture（error-boundary / members-list / loading-state）で確立し、`docs/00-getting-started-manual/specs/09-ui-ux.md` 2.4.5 節に「Staging smoke fixture routes」として明文化した。
- 将来への適用: 4 件目以降の smoke fixture を追加する際は新 prefix を生やさず、必ず `app/__smoke__/<name>/` + `app/smoke/<name>/` の 2 ペアで作る。`__smoke__` prefix を「route として認識されない」と誤解しないよう、private prefix はあくまで「人間向けの責務分離マーカー」として扱い、production 防御は env guard に一本化する（FB-T25LF-01: skill template に 2 系統 fixture pattern を追加）。

## L-T25LF-002: loading.tsx の runtime 観測には deterministic な server-side delay fixture が必要

- 状況: 親 task-25 では `app/loading.tsx` を Playwright `page.route` の artificial delay や network throttle で観測しようとしたが、CI 上での race condition により Suspense fallback が render される前に最終 HTML が返って `[data-page="..."]` を観測できないケースが頻発し、`SMOKE-COVERAGE-MATRIX.md` 行 19 は `N/A-runtime-observation` プレースホルダーのまま残されていた。
- 問題: network throttle / `page.route` の artificial delay は client-side の non-deterministic な timing に依存するため、Cloudflare Workers + Next.js streaming の組み合わせで Suspense boundary が観測可能な window を保証できない。flaky を許容するか観測諦めるかの 2 択になっていた。
- 解決: server component 内で `await new Promise(r => setTimeout(r, ms))` による固定遅延（既定 1500ms、`?delay=N` query で 0–3000ms にクランプ）を入れた fixture page を新設し、Suspense fallback `loading.tsx` の表示時間を deterministic に確保する設計に切替えた。`clampDelay()` で境界値（負値、非数値、3000ms 超）を全て既定値 / 上限値へ正規化し、Playwright TC を `--repeat-each=10` × 5 ケース = 50 run で green 確認した。
- 将来への適用: Suspense / Streaming SSR 系の boundary 観測タスクでは、最初から「server-side fixed delay fixture」を第一選択肢とし、network throttle ベースの観測は採用しない。同 pattern を `error.tsx` 観測の deterministic 化や、将来追加される `parallel routes` / `intercepting routes` boundary の観測にも横展開できる（FB-T25LF-02: aiworkflow-requirements skill に「Suspense boundary 観測は server-side delay fixture を第一選択肢とする」を anti-pattern 集に追記）。

## L-T25LF-003: env guard 重複を `_lib/fixture-guard.ts` に集約する横断リファクタは 3 件目を契機に実施する

- 状況: Phase 5 完了時点で `smokeFixtureEnabled()`（`ENABLE_STAGING_SMOKE_FIXTURE === "1" && ENVIRONMENT !== "production"` の二重ガード）が `__smoke__/error-boundary/page.tsx`・`__smoke__/members-list/page.tsx`・`__smoke__/loading-state/page.tsx` の 3 箇所にコピーされた状態だった。
- 問題: 1 / 2 件目時点では「集約は YAGNI」「page.tsx の責務に共通 util を mix しない」という判断で複製を許容していたが、3 件目で「将来の env 仕様変更（例: `ENVIRONMENT=preview` の扱い追加）が 3 箇所同時変更を要求する」「複製のうち 1 箇所だけ drift する事故リスクが現実的」と判定が反転した。Phase 8 設計時点で「3 箇所同一なら集約候補」と判定基準を明文化していたため reactive に判断できた。
- 解決: `apps/web/app/__smoke__/_lib/fixture-guard.ts` に `smokeFixtureEnabled()` を集約し、3 fixture page から import する形に統一。`_lib` prefix も App Router の route 認識対象外（underscore prefix）として安全に使えることを Phase 8 で明示した。併せて `fixture-guard.spec.ts` で env matrix（`flag=1+env=staging`、`flag=1+env=production`、`flag=undefined`）を網羅し、各 fixture page 側の guard unit test を廃止して責務集約した。
- 将来への適用: 横断 util の集約は「3 件目の複製発生時」を明確な閾値とする。1〜2 件目では複製を許容し、3 件目到達時点で `_lib/<concern>.ts` への抽出を Phase 8 の正規アクションとして起動する（FB-T25LF-03: task-specification-creator skill の Phase 8 テンプレに「3 件目複製を集約閾値とする」ルールを追加候補）。

## L-T25LF-004: completed-tasks 配下のドキュメント更新は「子 task のスコープ内」として扱い、placeholder 解消 commit を分割しない

- 状況: `SMOKE-COVERAGE-MATRIX.md` は親 task-25（既に completed-tasks 配下に移動済）の成果物だが、行 19 の `N/A-runtime-observation` 解消は本 followup task のスコープであり、`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md` および `docs/30-workflows/completed-tasks/task-25-ui-mvp-w8-par-routes-smoke-coverage/outputs/phase-12/implementation-guide.md` を編集する必要があった。
- 問題: 「completed-tasks 配下の文書は immutable とすべき」という素朴な policy だと、子 followup task が親文書の placeholder を解消する経路を失う。逆に無条件に編集を許すと、無関係な task が completed 文書を改変して履歴の追跡可能性が崩れる。
- 解決: 子 followup task の `index.md` に「主成果物（ドキュメント）」として親 completed 文書のパスを明示し、Phase 12 で「行 19 の Before/After」「親 implementation-guide への follow-up resolved 1 行追記」を strict 成果物として要求する形に整理。`task-25-ui-mvp-w8-par-routes-smoke-coverage/outputs/phase-12/unassigned-task-detection.md` にも「task-25-followup-loading-state-observation-fixture で resolved」を追記し、完了状態の trace を双方向に張った。
- 将来への適用: completed-tasks 配下の文書は「親 task の placeholder 残存箇所」に限り、子 followup task のスコープで編集を許可する。子 task の `index.md` には必ず「親文書編集の範囲」を明示し、Phase 12 で双方向リンク（親 → 子の follow-up resolved 行、子 → 親 placeholder 解消の Before/After）を必須化する（FB-T25LF-04: aiworkflow-requirements skill に「completed-tasks 編集 policy」を明文化する候補）。

## L-T25LF-005: `/smoke/*` を public routable surface として明文化したら、本番ルーティング・SEO・error.tsx への副作用を 3 軸で評価する

- 状況: `09-ui-ux.md` 2.4.5 節に `app/smoke/*` を「staging fixture only」な routable surface として追記したことで、URL space に `/smoke/error-boundary` `/smoke/members-list` `/smoke/loading-state` が常設される形になった。
- 問題: 3 つの副作用が顕在化リスクとしてある:
  1. **本番ルーティング**: `ENABLE_STAGING_SMOKE_FIXTURE=1` が誤って production secrets に投入されると即時公開される。
  2. **SEO**: `/smoke/*` が将来 crawler に拾われると、production 404 でも URL 自体が discovery 対象になり report 上のノイズ源となる。
  3. **error.tsx 副作用**: fixture が throw した場合に App Router の error boundary が `/smoke/*` 配下でも render され、本物の error.tsx assertion テストと挙動が混線するリスク。
- 解決:
  1. `scripts/cf.sh deploy` の preflight で `--env production` 指定時に `ENABLE_STAGING_SMOKE_FIXTURE=1` を reject する gate を `09-ui-ux.md` 2.4.5 節に明文化した（実 gate 追加は別 task）。
  2. `app/smoke/*` の wrapper 全てで `dynamic = "force-dynamic"` を強制し、static generation 経路で sitemap に乗らないようにした（`robots.txt` / `sitemap.ts` への `/smoke/*` 明示除外は将来 task）。
  3. fixture page は throw せず `notFound()` のみを使う設計に統一し、error.tsx 観測 fixture（`/smoke/error-boundary`）は独自の error throw component を boundary 内に閉じ込めることで cross-fixture の error 副作用を遮断した。
- 将来への適用: 「production に絶対出さない routable surface」を追加するときは、(deploy preflight gate / SEO 露出 / error.tsx 副作用) の 3 軸チェックリストを Phase 2 design で必須化する。runbook 化対象（FB-T25LF-05: `references/patterns-staging-only-routable-surface.md` を 2 例目到達後に skill 化）。

## 参照

- workflow root（completed）: `docs/30-workflows/completed-tasks/task-25-followup-loading-state-observation-fixture/`
- 親 task: `docs/30-workflows/completed-tasks/task-25-ui-mvp-w8-par-routes-smoke-coverage/`
- 主成果物（matrix）: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SMOKE-COVERAGE-MATRIX.md`
- 集約 util: `apps/web/app/__smoke__/_lib/fixture-guard.ts` / `fixture-guard.spec.ts`
- private source: `apps/web/app/__smoke__/loading-state/{page,loading}.tsx`
- routable wrapper: `apps/web/app/smoke/loading-state/{page,loading}.tsx`
- smoke spec: `apps/web/tests/e2e/staging-smoke.spec.ts`（`staging smoke / loading state` describe block）
- spec 文書: `docs/00-getting-started-manual/specs/09-ui-ux.md` 2.4.5 節
- artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-task-25-followup-loading-state-observation-fixture-artifact-inventory.md`
- 流用元: `lessons-learned-task-26-error-tsx-token-utility-migration-2026-05.md`（error.tsx 側 token migration）
