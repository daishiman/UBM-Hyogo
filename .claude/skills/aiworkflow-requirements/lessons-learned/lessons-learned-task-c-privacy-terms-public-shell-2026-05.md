# Lessons Learned — task-c-privacy-terms-public-shell-spec 2026-05

`docs/30-workflows/task-c-privacy-terms-public-shell-spec/` の実装サイクル（`/privacy` / `/terms` への公開シェル mount）で得た苦戦箇所を体系化する。将来「公開シェルを後追いで mount する」「async page + `getAuthView()` 配線」「legal 本文を温存しつつ shell を増やす」「子 workflow の close-out 同期」を簡潔に解決するための原則を残す。

## L-TCPTS-001: `(public)` route group 移動ではなく page.tsx への shell 直 mount を選ぶ最小差分原則

- **苦戦**: `/privacy` / `/terms` は `app/privacy/page.tsx` / `app/terms/page.tsx` 配下にあり、`(public)/layout.tsx` の管理下に入っていなかった。「(public) route group へ移動すれば共通 layout に乗る」案が魅力的に見えたが、移動は file path 変更+`route group conflict` リスクを生む。
- **原因**: 共通化欲求が先行し「移動による DRY」を最適解だと錯覚した。実態は legal 2 page のみで、layout 統合よりも shell mount の方が差分が小さい。
- **対策**: 親仕様の「最小差分原則」を優先し、page.tsx 内で `<div data-testid="public-shell" data-route-group="public" data-theme="warm" data-auth-state={authView.kind}>` を直接構築。`<PublicHeader authView={authView} />` + `<PublicFooter />` を mount するだけで `(public)/layout.tsx` と DOM 構造を完全一致させる。route group 統合は別 wave の課題として deferred。

## L-TCPTS-002: async page + `getAuthView()` 配線は layout/page 双方で同じ awaiting を行う

- **苦戦**: `/privacy` / `/terms` page.tsx を `async function` 化し、`const authView = await getAuthView()` を呼んだ上で `<PublicHeader authView={authView} />` に prop 渡しした。一方 `(public)/layout.tsx` 側も同一の `await getAuthView()` を行うため、route group 配下の page では shell が二重に session 解決される可能性がある（今回は route group 外なので OK）。
- **原因**: PublicHeader 側が「prop が無ければ自前で fetch する」fallback を持つため、複数経路で `getAuthView()` が呼ばれうる。
- **対策**: shell を mount する page では必ず `authView` を prop で渡す（fallback 経路に頼らない）。PublicHeader の `authView?: AuthView` は optional だが、page.tsx 側で省略しない契約とする。これで session 解決は 1 page あたり 1 回に固定。spec test では `<PublicHeader authView={...} />` の prop 必須化は強制しないが、page test で「prop 渡し」のレンダーパスを spec する。

## L-TCPTS-003: legal prose 本文と既存 metadata は不変条件として grep gate で守る

- **苦戦**: `LegalProse` 配下の `<h1>` / `<h2>` / `<ul>` / `<p>` テキストは法務確認後の暫定版で、shell mount に伴う indentation 変更（`<main>` ネスト追加で 1 段 indent が増える）を含めても本文 1 文字も変えてはいけない。
- **原因**: shell 追加に伴う JSX 再フォーマットで Prettier が自動的に行折り返しや空白挿入を入れることがあり、git diff 上で見落とすと「本文変更」と区別できない。
- **対策**: Phase 9 grep gate に `grep -c "UBM 兵庫支部会（以下「当会」）は、会員管理サイトの運営にあたり" apps/web/app/privacy/page.tsx` のような **本文 anchor 文字列の出現数固定**を入れる。同様に metadata `title` / `description` も string literal の同一性を Vitest で固定する。

## L-TCPTS-004: 子 workflow（implementation-spec 派生）でも root/output artifacts parity + strict 7 を独立に持つ

- **苦戦**: `task-c-privacy-terms-public-shell-spec/` は親 `public-header-logged-in-nav-cleanup/` の Task C を展開した子 workflow。親側に既に Phase 12 strict 7 があるため「子は省略可」と誤認しがちだが、子 workflow を independent root として `verify:phase12-compliance` が拾うため、子側にも独立した strict 7 + root/output artifacts mirror が必要。
- **原因**: 親子関係を「親が ledger を持てば子は ledger 不要」と早合点した。実態は verifier が `docs/30-workflows/*` を独立 root として走査する。
- **対策**: 子 workflow を切る場合は **必ず親と独立に** root `artifacts.json` + `outputs/artifacts.json` + `outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` を揃える。`hasCompletedTasksAncestor=false` のまま `workflow_state=implemented_local_evidence_captured` で close-out 可能（completed-tasks/ への移動は親 workflow と同期させる）。

## L-TCPTS-005: VISUAL_ON_EXECUTION の Phase 11 evidence は guest/member/admin の 3 session × surface 数で固定する

- **苦戦**: `/privacy` と `/terms` の 2 surface × guest/member/admin の 3 session = 6 PNG を Phase 11 evidence として要求した。session-aware CTA 切替（ログイン / マイページ）が shell 上で初めて可視化されるため、guest 1 枚では契約検証として不十分。
- **原因**: VISUAL_ON_EXECUTION を「変更画面のスクショ 1 枚」と単純化していた。session-aware 契約は session × surface マトリクスで初めて完全に観測できる。
- **対策**: VISUAL_ON_EXECUTION かつ session-aware UI を含む workflow では、Phase 11 evidence inventory に `{surface}-{session}.png` を全組合せで列挙する。`phase12-task-spec-compliance-check.md` の §4 で行ごと present 判定する（glob 1 行で済ませない）。

## Anti-patterns（再発防止メモ）

1. **shell 後追い mount を route group 移動で解こうとする**: file path 変更 + route group conflict リスクで差分が膨らむ。page.tsx 内 shell 直 mount が最小差分。
2. **PublicHeader の `authView` fallback に依存して prop を省略する**: shell 経由で 2 重に `getAuthView()` が走るリスク。page では必ず prop 渡し。
3. **子 workflow を「親 ledger に同居」させて strict 7 を省略する**: verifier は子を独立 root として拾うため fail する。
4. **VISUAL_ON_EXECUTION を guest 1 枚で済ます**: session-aware CTA は session × surface マトリクスでないと観測不能。
