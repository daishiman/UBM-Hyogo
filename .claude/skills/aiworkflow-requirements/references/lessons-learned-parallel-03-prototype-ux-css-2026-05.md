# Lessons Learned — parallel-03 Prototype UX CSS（2026-05-15）

> task: `parallel-03-prototype-ux-css`
> 関連 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-03-prototype-ux-css/spec.md`、`docs/00-getting-started-manual/specs/09-ui-ux.md`、`docs/00-getting-started-manual/specs/design-tokens.md`
> 関連 source: `apps/web/src/styles/globals.css`、`apps/web/src/components/public/{MemberFilters.client,MemberCard,MemberDetailSections,FormPreviewSections}.tsx`、`apps/web/playwright/tests/visual/visual-feedback.spec.ts`、`apps/web/playwright/fixtures/auth.ts`
> 関連 reference: `references/workflow-parallel-03-prototype-ux-css-artifact-inventory.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`、`changelog/20260515-parallel-03-prototype-ux-css.md`

## 教訓一覧

### L-P03-001: active tag pill は `aria-pressed` を主契約とし、視覚 selector は `data-selected="true"` に寄せる

- **背景**: 通常 button に `aria-selected` を付与すると ARIA spec 違反になり、a11y lint や axe で警告が出る。一方で active filter を視覚的に表現するために CSS selector が必要だった。
- **教訓**: トグル型 button の active state は `aria-pressed` を **唯一の ARIA 契約** とし、CSS selector 側は `data-selected="true"` という data attribute に寄せる二層構造で分離する。`aria-selected` は `role="option"` / `role="tab"` / `role="row"` 等の listbox/tab/grid 文脈に限定する。
- **将来アクション**: 新規 toggle button / chip / pill primitive を作る際は (1) `aria-pressed` を必須化 (2) 視覚 selector は `data-selected` で命名 (3) `aria-selected` への置換 PR は reject、を component spec / artifact-inventory contract セクションに固定する。

### L-P03-002: profile section の visibility 表現は `[data-component][data-visibility]` の scoped selector に限定する

- **背景**: `[data-visibility]` を global selector として書くと、admin 画面など他コンポーネントで意図しない visibility marker が誘発される懸念があった。
- **教訓**: visibility 系の data attribute selector は必ず `[data-component="profile-section"][data-visibility]` のように component 名と組み合わせて scope する。global match を避けることで、後続コンポーネントが同名 attribute を使っても干渉しない。
- **将来アクション**: 新規 data attribute を CSS selector に使う場合、artifact-inventory の Contract セクションに「`[data-component="..."]` と組み合わせる」というルールを明記し、`globals.css` のレビュー時に grep で global 単独 attribute selector を弾く。

### L-P03-003: member card の hover-only feedback は keyboard parity 不在の a11y 退行を生む — `:focus-within` を必須化する

- **背景**: 初期実装は `:hover` のみで border / shadow / translate を変えていたが、keyboard tab で同じ視覚 feedback が出ず、axe / a11y レビューで keyboard parity 不在が指摘された。
- **教訓**: マウス hover feedback を入れる UI element には **同時に** `:focus-within`（または `:focus-visible`）を組み合わせ、keyboard / pointer 両方で同じ視覚 feedback を出す。member card のように内部に link / button を持つ container は `:focus-within` が適切。
- **将来アクション**: `:hover` を含む新規 CSS rule を追加する PR は、同一 selector chain に `:focus-within` または `:focus-visible` を含むかを grep gate で確認する。スプリッターは「`:hover`」を catch して隣接行の `:focus` 系を確認する。

### L-P03-004: `SectionVisibility` のような UI fallback type は **local type** に閉じ、public API contract に出さない

- **背景**: visibility 値は将来 API 側 `visibility` field として返される候補だったが、現 MVP では API は未提供で UI fallback `"public"` で成立する。`SectionVisibility` を shared package に出すと、API contract 不在の段階で公開型を作ってしまい後で削除コストが発生する。
- **教訓**: API contract が未確定な UI fallback type は `MemberDetailSections.tsx` 等の **local type** として閉じる。shared package（`packages/types-*`）には昇格しない。API 側に field が追加された時点で server-first の zod schema に昇格させる。
- **将来アクション**: 新規 visibility / role / state 系 type を追加する場合、(1) API endpoint が現存するか、(2) 現状 UI fallback のみか、を判断し、後者は local type / runtime normalize で閉じる。shared package へ昇格する PR は同一 wave で API schema + zod の追加を要求する。

### L-P03-005: `member` / `admin` visibility は production runtime page だけでは検証できない — component fixture または mock route で必ず証明する

- **背景**: production API は section visibility field を返さないため、`/members/[id]` を runtime で開いても visibility は常に `"public"` fallback になる。Playwright で `member` / `admin` 視覚を撮ろうとすると runtime page だけでは到達不能だった。
- **教訓**: API 未提供の visual variant は component fixture（`@testing-library/react` + 直接 props 注入）または Playwright `route.fulfill` mock で証明し、Phase 11 evidence ledger に「fixture mutation」種別を明示する。runtime page screenshot 一本で済ませない。
- **将来アクション**: VISUAL タスクの spec を書く際、AC ごとに「runtime page で取れるか / fixture が必須か / mock route が必須か」を Phase 4 test plan に分類する。Phase 11 evidence inventory に `completed (fixture mutation)` 状態種別を残す。

### L-P03-006: workflow を `completed-tasks/` 配下で生成した場合、自分自身の artifacts.json / Phase 12 docs の **自己参照パス** に `completed-tasks/` プレフィックスを含めること

- **背景**: 本タスクの workflow root を `docs/30-workflows/completed-tasks/parallel-03-prototype-ux-css/` 配下で生成したが、`artifacts.json`、`outputs/artifacts.json`、`outputs/phase-12/documentation-changelog.md`、`system-spec-update-summary.md`、`phase12-task-spec-compliance-check.md`、`phase-13-pr.md` 内の自己参照パスは `docs/30-workflows/parallel-03-prototype-ux-css/...`（completed-tasks プレフィックスなし）で書かれていた。同時に aiworkflow-requirements skill 側の `indexes/{quick-reference,resource-map}.md` と `references/task-workflow-active.md`、`changelog/...md` も同じ drift を持っていた。validator command（`cmp -s artifacts.json outputs/artifacts.json` 等）は `completed-tasks/` 付きを使わないと exit 0 にならない。
- **教訓**: workflow を初期から `completed-tasks/` 配下で生成する場合（Phase 13 user-gate 直前で active からスキップして完了済み bucket に置く運用）、(1) artifacts.json 内 `evidence_path` (2) Phase 12 documentation-changelog の Validator Execution Log (3) phase-13-pr.md の検証コマンド (4) aiworkflow-requirements skill 側の全自己参照行、を `docs/30-workflows/completed-tasks/<task-id>/` に揃える同期 gate を必須とする。task-23 / task-25 など先行 completed-tasks 直下生成タスクの artifacts.json と同じ convention で書く。
- **将来アクション**: `task-specification-creator` の Phase 12 documentation guide に「completed-tasks 直下で生成する場合、自己参照パスは必ず `completed-tasks/` プレフィックスを含む」rule を追加するか、Phase 12 compliance check に `grep -E "docs/30-workflows/<task-id>/" -r outputs/` で `completed-tasks/` を含まないパスを検出する gate を追加する。本タスクの skill-feedback-report は当初 no-op 判定だったが、本 lessons-learned はそのフォローとして「path drift 検出 gate の no-op 判定を将来 revisit する」根拠を残す。

### L-P03-007: Playwright runtime evidence（playwright-report results.json / monocart）の絶対パスは「実行時 outputDir」を凍結するため、後でディレクトリ rename しても **再生成しない限り更新できない**

- **背景**: Playwright report の `outputDir` フィールドは絶対パス（`/Users/.../docs/30-workflows/parallel-03-prototype-ux-css/...`）で凍結される。Phase 12 後にディレクトリを `completed-tasks/` 配下に移しても、JSON 内のパスは古いまま残った。手動で書き換えると evidence 整合性を損なう。
- **教訓**: Playwright JSON evidence の絶対パスを書き換えるのは禁止。`outputDir` を含むパス変更は **再実行で再生成** する。Phase 11 main.md / artifact-inventory には「runtime 整合のため記録として残す」note を付け、後追い rename を明示する。
- **将来アクション**: ディレクトリ rename を伴うタスクでは、Phase 11 evidence の絶対パス含有を確認し、必要なら Phase 11 を再実行する gate を Phase 12 compliance check に追加する。

### L-P03-008: token 値を変更しない VISUAL タスクでは、Phase 12 system-spec-update-summary の System Spec Change 判定は明確に `N/A` と書き、no-op 判定の根拠（API/D1/token 不変）を **同セクション内** に列挙する

- **背景**: visual feedback タスクは既存 token / 既存 API / 既存 D1 だけで成立するため、system spec への正本変更が発生しない。判定が曖昧だと「unassigned-task を起こす必要があるか」が読み手で揺れる。
- **教訓**: System Spec Change 判定 `N/A` は、(1) API endpoint 不変、(2) D1 schema 不変、(3) shared package 型不変、(4) token 値不変、の 4 不変条件を明示することで再現可能にする。unassigned-task-detection.md は全 routing が `no-op` の場合でも、各候補ごとに theoretical follow-up（例: 「API 側 visibility field 追加時に格上げ」）を残す。
- **将来アクション**: 既存 API / token のみで成立する VISUAL タスクでは、Phase 12 system-spec-update-summary template に上記 4 不変条件のチェックリストを fixed 化する。skill-feedback-report の `no-op (future product decision)` 判定は artifact-inventory の Open Follow-Ups にもミラーする。
