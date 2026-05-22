# Lessons Learned — Issue #300 Direct Stable Key Update Guard（2026-05-15）

> task: `issue-300-direct-stable-key-update-guard`
> 関連 spec: `docs/30-workflows/issue-300-direct-stable-key-update-guard/`、`docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md`（consumed origin）
> 関連 source: `scripts/lint-stable-key-update.mjs`、`scripts/lint-stable-key-update.spec.ts`、`scripts/__fixtures__/stable-key-update-lint/`、`apps/api/src/repository/schemaQuestions.ts`、`.github/workflows/verify-stable-key-update.yml`、`lefthook.yml`、`package.json`
> 関連 reference: `references/database-implementation-core.md`（§Schema Alias Resolution Contract / Static guard）、`references/task-workflow-active.md`、`references/workflow-issue-300-direct-stable-key-update-guard-artifact-inventory.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`indexes/topic-map.md`、`indexes/keywords.json`、`changelog/20260515-issue-300-direct-stable-key-update-guard.md`

## 教訓一覧

### L-ISSUE300-001: detector の severity 設計は「呼び出し名」と「実書き込み」を分離する

- **背景**: `schema_questions.stable_key` への direct mutation を遮断するため、`scripts/lint-stable-key-update.mjs` に 3 種 detector を実装した。`sql-direct-update`（SQL `UPDATE schema_questions ... SET ... stable_key`）と `builder-direct-update`（`.update(schemaQuestions).set({ stable_key | stableKey })`）は **`error`** 固定にして CI / lefthook で reject する判断をしたが、`function-direct-update`（`updateStableKey(...)` 呼び出し名）は legacy helper の名残検出に過ぎず、現コードベースに実体がないため **`warning`** に留めた。同時に `apps/api/src/repository/schemaQuestions.ts` から未使用の `updateStableKey()` を削除し、warning 発生面を 0 にした。
- **教訓**: detector severity は「契約違反の有無」と「シグネチャ一致のみで判定可能か」を切り分ける。実書き込み箇所（SQL / builder）の検出は契約違反として error、関数名一致のみは false-positive リスク（ヘルパー命名が偶然一致した将来追加など）が残るため warning として将来 grep に残す方針。helper 削除は detector 追加と同一 wave で行い、新 helper の再導入経路を `lefthook` `block-stable-key-update` が即時遮断する状態にする。
- **将来アクション**: 同種 guard を新設する際は「detector 別 severity 行列」を Phase 1 仕様に明記する。helper 削除は repository 層 spec test の reference を巻き取った後に同 PR で実施する。
- **関連ファイル**: `scripts/lint-stable-key-update.mjs`、`apps/api/src/repository/schemaQuestions.ts`

### L-ISSUE300-002: allowed boundary は EXCEPTION_GLOBS で 4 種を網羅する

- **背景**: guard が真に遮断したい対象は production runtime path の `apps/**` / `packages/**` / `scripts/**` の direct write のみであり、以下 4 種は明示的に除外する必要があった。
  1. `schema_aliases` write（07b `POST /admin/schema/aliases`、Phase 12 design 通り `schema_aliases` テーブルへの INSERT に置換済み）
  2. `schema_questions.stable_key` の **read fallback**（03a alias miss 時の lookup、`SELECT ... stable_key FROM schema_questions`）
  3. fixtures（`scripts/__fixtures__/stable-key-update-lint/` 配下の意図的違反コード）
  4. migrations（`apps/api/migrations/`、DDL 上での `stable_key` 列定義）
- **教訓**: `EXCEPTION_PATTERNS` には `__fixtures__` / `__tests__` / `migrations` / `node_modules` / `.next` / `.open-next` / `coverage` / `dist` / `docs` / `*.spec.{ts,tsx,mjs,js}` / 自身（`lint-stable-key-update.mjs`）を含める。read fallback はそもそも `UPDATE` / `.update()` シグネチャに該当しないため pattern レベルで自動的に除外される（path 除外は不要）。fixture と spec は path 除外として解決し、spec が「違反コードを文字列リテラルで含む」ケースに耐える設計にする。
- **将来アクション**: 新規 guard を追加する際、boundary 4 種を実装前に列挙し、`EXCEPTION_PATTERNS` の網羅性を spec で fixture-driven に検証する（`scripts/lint-stable-key-update.spec.ts` 12 cases 参照）。
- **関連ファイル**: `scripts/lint-stable-key-update.mjs`、`scripts/lint-stable-key-update.spec.ts`、`scripts/__fixtures__/stable-key-update-lint/`

### L-ISSUE300-003: 多段 guard は 4 経路並走で配置し sync-merge skip 条件を予め検討する

- **背景**: 単一 guard では bypass を完全には防げないため、以下 4 経路で並走配置した。
  1. **root lint chain**: `package.json#scripts.lint:stable-key-update` / `:strict` を root `lint` 連鎖に組み込み、`pnpm lint` で常時実行
  2. **lefthook**: `lefthook.yml#block-stable-key-update` で pre-commit に `:strict` を配置
  3. **CI workflow**: `.github/workflows/verify-stable-key-update.yml` で push / pull_request (`main` / `dev`) に対し `pnpm lint:stable-key-update:strict` を実行
  4. **package script**: `:strict` (exit 1) と非 strict (warning のみ exit 0) の 2 モードを提供し、開発時は warning、ゲート時は error
- **教訓**: 多段 guard の評価順は **lefthook → CI → root lint** の順に「先に止める」設計。sync-merge（main → feature 取り込み）時は `MERGE_HEAD` / `CHERRY_PICK_HEAD` / `REVERT_HEAD` 検知で hook を skip する既存パターン（`scripts/hooks/staged-task-dir-guard.sh` 参照）を踏襲するか個別検討する。本 issue では guard が repo 全体スキャンであり、merge commit が違反を新規導入するケースは構造的に稀（main 側に既に guard 通過済み）なため、現状は merge skip 機構を入れずに観測する判断とした。誤検知が発生した時点で既存 sync-merge skip pattern と同型の対処を `lefthook.yml` 側に追加する。
- **将来アクション**: 新 guard を多段配置するときは「経路間の評価順 / mode (strict/warning) / sync-merge skip 条件」を Phase 1 仕様に並列 4 行で明記する。
- **関連ファイル**: `lefthook.yml`、`.github/workflows/verify-stable-key-update.yml`、`package.json`、`scripts/lint-stable-key-update.mjs`

### L-ISSUE300-004: Issue #191 follow-up の consume 表記は inventory 横並びで統一する

- **背景**: 本 issue は Issue #191 の Phase 12 unassigned-task `task-issue-191-direct-stable-key-update-guard-001.md` を消費して `docs/30-workflows/issue-300-direct-stable-key-update-guard/` として workflow 化したものである。issue-191 系の artifact inventory は次の 3 ファイルが既存し、それぞれ unassigned-task への参照を含んでいた。
  - `references/workflow-issue-191-schema-aliases-artifact-inventory.md`
  - `references/workflow-task-issue-191-production-d1-schema-aliases-apply-001-artifact-inventory.md`
  - `references/workflow-task-issue-191-schema-aliases-implementation-001-artifact-inventory.md`
- **教訓**: 統一表記は「`consumed trace; implemented by docs/30-workflows/issue-300-direct-stable-key-update-guard/`」を Current Canonical Set 表の Role 列末尾に追記する形で 3 ファイル横並びに適用する。表外の Notes セクションでも「The direct update guard was consumed by Issue #300 and implemented locally in `docs/30-workflows/issue-300-direct-stable-key-update-guard/`」を明記する。3 inventory に同一文を伝搬させることで、後続の grep / index 再生成で trace 切れを検出可能になる。
- **将来アクション**: unassigned-task → 新 issue 化が起きた時は、上流 inventory 全件に `consumed_by_issue_<N> -> <new-workflow-path>` トレースを同一 wave で追記する。`scripts/generate-index.js` 実行で resource-map / topic-map に伝搬する。
- **関連ファイル**: `references/workflow-issue-191-schema-aliases-artifact-inventory.md`、`references/workflow-task-issue-191-production-d1-schema-aliases-apply-001-artifact-inventory.md`、`references/workflow-task-issue-191-schema-aliases-implementation-001-artifact-inventory.md`、`docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md`

### L-ISSUE300-005: lint fixture は専用ディレクトリで scripts 配下に集約する

- **背景**: lint detector の単体テスト用 fixture は「意図的に違反コードを含む `.ts` ファイル群」が必要であり、production scan 対象（`apps/**` / `packages/**` / `scripts/**`）に紛れ込ませると guard 自体が CI で fail する。spec 隣接配置（`*.spec.ts` と同 dir）も検討したが、fixture が多数になるとテストファイル群の見通しが悪化する。
- **教訓**: lint guard 専用 fixture は `scripts/__fixtures__/<lint-name>/` に集約配置し、`EXCEPTION_PATTERNS` に `[\\/]__fixtures__[\\/]/` を含めて scanner 側から自動除外する。spec ファイル (`*.spec.{ts,tsx,mjs,js}`) も同様にパターン除外し、spec が違反コード文字列リテラルを含んでも guard が反応しないようにする。本 issue では `scripts/__fixtures__/stable-key-update-lint/` に positive / negative 両ケースを置き、12/12 PASS を Phase 11 evidence として記録した。
- **将来アクション**: 新規 lint script を追加する際は `scripts/__fixtures__/<lint-name>/` 配置規約を Phase 1 仕様に明記する。fixture を spec 隣接にするか集約するかの判断基準は「fixture 数 ≧ 5」で集約に倒す。
- **関連ファイル**: `scripts/__fixtures__/stable-key-update-lint/`、`scripts/lint-stable-key-update.spec.ts`、`scripts/lint-stable-key-update.mjs`

## 適用範囲

- 本 lessons は `schema_questions.stable_key` に対する direct mutation guard の保守 / 拡張 task に適用する。
- L-ISSUE300-001 / L-ISSUE300-002 は同種の「contract-violation lint script」全般に適用。
- L-ISSUE300-003 は多段 guard（lefthook + CI + root lint chain）を新設する全 task に適用。
- L-ISSUE300-004 は unassigned-task → 新 issue 化を伴う全 workflow に適用。
- L-ISSUE300-005 は `scripts/__fixtures__/` を新設する全 lint script task に適用。

## 追跡 / 未解放事項

| 項目 | 接続先 | 状態 |
| --- | --- | --- |
| GitHub Actions runtime evidence (`verify-stable-key-update` green run) | Phase 13 user-gated execution | pending_user_approval |
| commit / push / PR creation | Phase 13 user-gated execution | pending_user_approval |
| `completed-tasks/` archive 移動 | Phase 13 user-gated execution | pending_user_approval |
| `function-direct-update` warning detector の retire 判断 | future | not created（現状は legacy helper 再導入監視として保持） |
