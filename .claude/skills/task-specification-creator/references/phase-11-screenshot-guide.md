# Phase 11 Screenshot Guide

## docs-only task

実施内容:

1. `SKILL.md` から current canonical file へ辿る。
2. `LOGS.md` から archive / history へ辿れることを確認する。
3. `.claude` と `.agents` の file set / mirror parity を確認する。
4. validator command を replay する。

この場合、通常は screenshot は不要。`manual-test-result.md` に walkthrough を残す。

## docs-only task + explicit visual sanity request

ユーザーが branch 全体の画面 sanity check を明示要求した場合は、docs-only task でも補助的な screenshot capture を追加してよい。

実施内容:

1. representative state を 3-5 件に絞って撮る。
2. `ui-sanity-visual-review.md` に Apple UI/UX 観点の所見を書く。
3. 画像と metadata は `screenshots-app-sanity/` などの補助 directory に保存する。
4. `manual-test-result.md` に「docs-only だが user request により visual sanity を実施した」と記録する。

この経路では `validate-phase11-screenshot-coverage.js` は必須ではない。workflow 自体が UI task のときだけ実行する。

## UI task

実施内容:

1. `screenshot-plan.json` を作る。
2. representative state を撮る。
3. source surface から destination surface へ handoff する task は main shell 上で source-to-destination capture を行う。
4. destination 単独 screenshot は supplemental sanity evidence として扱い、handoff 本証跡の代替にしない。
5. Apple UI/UX 観点で視覚レビューを書く。
6. `validate-phase11-screenshot-coverage.js` を実行する。

### selector ルール

- responsive UI で desktop / mobile の両 DOM が同時に存在する場合は、visible container を特定してから selector を使う。
- `data-testid` が page 全体で二重一致する場合は panel / sheet locator を返す helper を先に作る。
- strict mode 回避のために first-match に逃げず、「どの surface を操作したか」を証跡とコードの両方で明示する。

### 必須証跡

- `manual-test-result.md`
- `manual-test-report.md`
- `issues.md` または `discovered-issues.md`
- `ui-sanity-visual-review.md`
- `screenshot-plan.json`
- `phase11-capture-metadata.json`
- `phase-11-manual-test.md` の `テストケース` / `画面カバレッジマトリクス`
- `screenshots/*.png`

## implementation-spec / Playwright evidence task の Phase 5 事前 gate

Playwright 系 visual evidence タスクで Phase 12 から path drift と storageState leakage を排除するため、Phase 5 ランブック確定前に以下 gate を必ず通す（出典: 06b-C 教訓 L-06B-006 / L-06B-007）。

### Path inventory check

- 仕様書中に登場する code path（`apps/web/playwright/...`, `scripts/...` 等）を `find` / `grep` で repo に存在するか確認する。
- 不在のパスを宣言した状態で Phase 5 ランブックを書かない。drift 発見時は documentation-changelog に「path correction」表として残す。
- 例: `find apps/web/playwright -type d`, `test -f scripts/capture-profile-evidence.sh`。

### storageState leakage check

- ログイン済み `storageState` JSON を扱うタスクでは以下を Phase 5 で固定する:
  - `.gitignore` に該当 JSON を追加（例: `apps/web/playwright/.auth/*.json`）。
  - `.gitkeep` のみコミットしてディレクトリを保持。
  - capture wrapper script に「production URL guard」と「storageState 不在時の non-zero exit」を構造で組み込む（人間が flag を渡し忘れても安全側に倒れる）。
- 実 runtime 実行は別 unassigned-task に分離し、Phase 13 user approval は runtime 実行 task 側で取得する。

### Phase 11 evidence_status 三段階

- `not_implemented` / `PENDING_RUNTIME_EVIDENCE`（spec・wrapper 揃い、実行のみ未済）/ `captured` を区別する。
- compliance-check の `Phase 11 screenshot evidence` 行は `PENDING_RUNTIME_EVIDENCE` を許容語彙に含めること。

## VISUAL タスクの local mock-screenshot 経路（staging 不在時の許容条件）

VISUAL タスクで staging 実機 deploy が **別 gate で pending** の場合、local Playwright fixture + standalone mock API を経由した screenshot を Phase 11 evidence の **暫定 canonical** として採用してよい（task-15 admin dashboard で適用された経路）。

### 許容条件（4 件すべて満たすこと）

1. staging 実機 smoke が `implemented-local-runtime-pending` 等で別タスクに分離され、Phase 13 で user 承認済みであること。
2. screenshot capture に使う mock は **standalone HTTP server**（例: `apps/web/playwright/fixtures/standalone-mock-server.ts`）として独立して起動し、Playwright の `page.route()` には依存しないこと（Next.js Server Component の `fetch()` は `page.route()` を捕捉しないため）。
3. SSR fetch 経路（`INTERNAL_API_BASE_URL` / `apps/api` への server-side `fetch()`）は **必ず standalone mock 側**を経由する。fixture-internal mock と並走させない。
4. `outputs/phase-11/` の screenshot に `provenance: local-mock` メタを `phase11-capture-metadata.json` に明記し、staging fresh evidence を取得した際の差し替え plan を `unassigned-task` として formalize する。

### 落とし穴

- **mock の二重実装**: fixture 内 `page.route()` mock と standalone server を同時に持つと state drift（A は更新済み、B は古い）が発生する。standalone mock のみを single source of truth とし、必要なら HTTP control endpoint（`POST /__mock/state`）で Playwright test から状態を切り替える。
- **selector drift**: page-object と実装側 `data-testid` の照合を `grep -rn 'data-testid="<id>"' apps/web/src` で必ず確認。`data-testid` 命名は機能 prefix + kebab で統一（例: `admin-kpi-card-total`）。
- **provenance 偽装**: local mock screenshot を staging fresh evidence のように記述しない。`provenance` 列を AC matrix に必ず置く。

## Fixture 分離規約（07c-followup-002 / 2026-05-15 追記）

VISUAL タスクで複数の business domain（例: members / meetings / attendance / requests）を跨ぐ場合、Playwright fixture は **domain ごとに別 file に分離する**こと。単一 `auth.ts` に全 seed builder を集中させると state drift と test ごとの side-effect が判定不能になる。

### 分離基準

- standalone mock server（HTTP control endpoint / seed reset を含む）は `fixtures/auth.ts` に集約（single source of truth = INV-08）
- 各 domain の seed builder（例: meeting + attendance 候補生成）は `fixtures/<domain>.ts` に分離（例: `apps/web/playwright/fixtures/admin-meetings.ts`）
- spec は domain fixture を import し、`auth.ts` の standalone mock を介して状態を流し込む
- domain fixture が standalone mock に直接 HTTP 呼び出し（`POST /__mock/state`）する場合、mock 側 endpoint も同 wave で追加（後追い禁止）

### 落とし穴

- **detail endpoint の後追い**: list endpoint だけ mock した状態で detail page を visit すると Server Component fetch が 404 で render に到達しない。Phase 3-4 の段階で **list / detail / mutation の三点 set** を standalone mock に揃えること。
- **fixture-internal mock との並走禁止**: domain fixture 内で `page.route()` を増やすと standalone mock との二重実装になる。fixture は seed 投入と clean-up のみ担当し、intercept は standalone 側に閉じる。

## Page object と selector exposure の URL 1:1 規約（07c-followup-002 / 2026-05-15 追記）

page object の helper method は visit 先 URL（page 責務）と 1:1 で揃え、複数 URL に跨る共通 selector を作らない。

- list page と detail page で同名 selector を使い回すと、片方の page で no-match / multi-match が strict mode fail を引き起こす
- selector exposure（`data-testid`）は responsive 共通化に逃げず、page-level の責務分離で URL ごとに固有化する（例: list 側 `admin-meeting-row-*` / detail 側 `attendance-*`）
- page object 設計時に「この helper は list / detail どちらの URL を前提とするか」を docstring で明示する

## `test.skip` / `test.fixme` 残置禁止と先送り起票（07c-followup-002 / 2026-05-15 追記）

INV-04 / CONST_007（Phase 1-13 を 1 サイクル内で完了・先送り禁止）を構造化するため、Phase 7-8 で `test.skip` / `test.fixme` を残す merge は禁止する。残す場合は同 wave で:

1. 残置理由を `unassigned-task/<task-id>.md` に formalize
2. `outputs/phase-11/e2e-skip-count.txt` を生成し、現状の skip 件数を evidence 化
3. 将来的に CI で `e2e-skip-count.txt == 0` を gate する候補に挙げる

`TODO(<task-id>)` comment も同様に扱う（残すなら unassigned-task 起票を同 wave で）。

## Evidence 拡張子 / canonical 制約（task-18 W7 / 2026-05-12 追記）

Phase 11 PASS 根拠ファイルは **tracked `.txt` / `.json` のみ canonical** とする。`.log` 拡張子の evidence は repository root `.gitignore` で除外され、PR diff・CI・レビューで参照不能になるため非 canonical。

- **生成側**: `2>&1 | tee outputs/phase-11/<name>.txt` のように最初から `.txt` で書き出す
- **既存 spec**: `*.log` 例示を `*.txt` に書き換える（force-add（`git add -f`）回避）
- **JSON evidence**: `gh api ... > outputs/phase-11/<name>.json` で機械可読性を保つ

## Visual baseline の `--update-snapshots` 運用（task-18 W7 / 2026-05-12 追記）

`apps/web/playwright/tests/visual/<spec>-snapshots/` の baseline 画像は tracked。drift 検出時の更新は次の boundary を守る:

- `--update-snapshots` 実行は **user-gated**（自動 PR で baseline を更新しない）
- baseline 更新 PR は visual diff の人手確認を必須とし、`docs/30-workflows/<workflow>/outputs/phase-11/visual-baseline-update-rationale.md` に更新理由を残す
- 4 screen baseline（`/login` / `/` / `/admin` / `/profile`）の拡張は別 task（例: `task-18-full-visual-regression-suite-001`）で扱い、本 baseline と混ぜない

## SSR fixture と Server Component evidence（task-17 / task-18 共通）

Server Component の `fetch()` は Playwright `page.route()` で intercept できない。Phase 11 visual evidence を確定的に取るには SSR helper（例: `apps/web/src/lib/admin/server-fetch.ts`）に env-gated fixture branch を実装する:

- env 変数名は task ID prefix（`PLAYWRIGHT_TASK17_ADMIN_FIXTURE` / `PLAYWRIGHT_TASK18_ADMIN_FIXTURE`）で衝突回避
- `NODE_ENV !== "production"` で active な branch のみ許可（production には絶対に branch しない）
- Phase 4 設計時に「fetch 起点が SSR か CSR か」を分類し、SSR なら fixture 戦略を明記する

## Apple UI/UX 観点

- hierarchy が明確か
- 主要アクションが一目で分かるか
- contrast が十分か
- whitespace と grouping が自然か
- error / loading / empty state が破綻していないか
- destructive action と primary action が混在していないか
- keyboard focus や dismiss 導線が視覚的に追えるか
