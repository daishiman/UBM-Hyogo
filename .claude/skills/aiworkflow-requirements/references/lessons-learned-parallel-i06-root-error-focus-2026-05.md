# Lessons Learned — parallel-i06-root-error-focus (2026-05)

## 概要

`apps/web/app/error.tsx`（Next.js App Router root error boundary）に
h1 への自動 focus 移譲を実装したワークフロー。差分は 4 行・テスト 2 件と小規模だが、
canonical workflow root 昇格・evidence 整備・skill 同期の運用知見が複数得られた。

- canonical workflow root: `docs/30-workflows/completed-tasks/parallel-i06-root-error-focus/`
- source spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md`
- artifact inventory: [[workflow-parallel-i06-root-error-focus-artifact-inventory]]

## L-I06-001: root error boundary の a11y focus 実装パターン

App Router の `error.tsx` で screen reader にエラー発生を即時通知するパターンを SSOT 化する。

- `useRef<HTMLHeadingElement>(null)` を h1 に bind
- h1 に `tabIndex={-1}` を付与（programmatic focus 受領可能化）
- 既存 useEffect 内で `logger.error → headingRef.current?.focus({ preventScroll: true })` の順
- deps は `[error]` のみ。cleanup 不要（focus 移譲は冪等）

**Why:** error boundary は SSR/CSR 境界で mount される。focus 移譲がないと screen reader は
エラー表示に気付かないまま放置される。Next.js の error.tsx は client component 強制なので
useEffect が必ず動く前提に乗れる。

**How to apply:** 別の error boundary（route group `error.tsx`、segment-specific boundary）を
触る際は同パターンを 4 行で複製する。`preventScroll: true` を忘れると意図せぬ scroll jump が
起きるので必須。

## L-I06-002: focus 検証は `document.activeElement` 直接比較

`@testing-library/jest-dom` の `toHaveFocus()` matcher を避け
`expect(document.activeElement).toBe(heading)` で検証する。

**Why:** vitest.setup で jest-dom matcher 拡張が未整備なテスト環境でも動く。
`toHaveFocus` 依存は環境差で false negative を生む。素の DOM API 比較なら jsdom 標準で確実に動く。

**How to apply:** focus 系 spec は新規追加時もこの書き方で統一する。logger 等の副作用持ち module は
`vi.mock` で必ず隔離する（Pino 等が test runner を汚染するため）。

## L-I06-003: in-place spec → canonical workflow root 昇格時の同期忘れ

`improvements/integration-fixes/*/spec.md` 形式の小規模 spec を canonical workflow root に
昇格させる場合、以下 3 点を **同一 commit** で同期しないと drift が残る。

1. source spec の `status` を `consumed` に、`canonical_workflow` ポインタを追記
2. 親 `improvements/integration-fixes/index.md` の status 表更新
3. `unassigned-task/*.md` を `consumed_by: <canonical_workflow>` で closeout

**Why:** 小規模 spec は完了後の navigation 起点が in-place spec のままになりがちで、
後続作業者が「未着手 task」と誤認するリスクがある。

**How to apply:** Phase 12 outputs の `system-spec-update-summary.md` で 3 点同期チェックを
checklist 化する。1 点でも欠けると Phase 12 strict 7 が不完全。

## L-I06-004: completion 移動時の artifacts.json path drift

ワークフロー dir を `docs/30-workflows/<id>/` から `docs/30-workflows/completed-tasks/<id>/` へ
物理移動した際、内部 `artifacts.json` の `canonicalRoot` / `evidence_path` / `canonical_workflow` は
**自動追従しない**。skill 側 artifact inventory / changelog / resource-map / quick-reference /
LOGS / unassigned-task closeout も同様に手動更新が必要。

**Why:** `gate-metadata:validate` は文字列 path として参照解決を行うため、stale path は zod schema
通過後の実体参照で初めて失敗するか、最悪気付かれず放置される。

**How to apply:** completion 移動を行うスクリプト/手順に、以下 6 グループの path 一括更新を
含める（`sed -i '' 's|docs/30-workflows/<id>|docs/30-workflows/completed-tasks/<id>|g' ...`）:

- `<workflow>/artifacts.json` および `<workflow>/outputs/artifacts.json`
- `.claude/skills/aiworkflow-requirements/references/workflow-<id>-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/changelog/*<id>*.md`
- `.claude/skills/aiworkflow-requirements/indexes/{resource-map,quick-reference,topic-map}.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` および
  `docs/30-workflows/completed-tasks/unassigned-task/*.md`

## L-I06-005: NON_VISUAL タスクの Phase 11 evidence 5 点セット

visual regression 不要（focus / a11y / 副作用順序のみ）でも、Phase 11 evidence は以下を揃える運用が定着:

- `typecheck.log` — `pnpm typecheck` 全体
- `lint.log` — `pnpm lint` 全体
- `test.log` — 該当 spec のみ focused vitest 実行
- `grep-gate.log` — HEX / arbitrary color grep の空結果（design-tokens gate と互換）
- `diff.txt` — 実装差分（`git diff HEAD~1 -- <files>`）

**Why:** screenshot 不要でも CI gate の `phase11 evidence existence validator` は 5 点存在を期待する。
NON_VISUAL classifier を `phase-11-evidence-inventory.md` 冒頭に明示し、screenshot 不要理由を文章で残す。

**How to apply:** focus / a11y / 副作用順序系の小規模 task は本 5 点セットをデフォルトとする。
visual regression が必要な場合のみ Playwright PNG を追加する（task type の上位互換）。

## 関連

- [[workflow-parallel-i06-root-error-focus-artifact-inventory]] — artifact 一覧
- [[error-handling-core]] — error boundary 全体方針
- [[arch-ui-components-core]] — primitives と a11y 規約
