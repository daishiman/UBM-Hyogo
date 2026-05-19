# Lessons Learned — issue-769 root error h1 auto-focus (2026-05)

`apps/web/app/error.tsx`（Next.js App Router root error boundary）に h1 auto-focus を追加した NON_VISUAL 実装タスク。Phase 1-13 を 1 サイクルで完走したが、テストファイル探索・Phase 12 strict 7 の必要性・親 spec / unassigned task の同期で学びがあった。

## L-I769-001: Root error boundary の h1 focus は ref + tabIndex={-1} + focus({ preventScroll: true })

- パターン: `useRef<HTMLHeadingElement>` を h1 に attach し、`useEffect` の `logger.error` 実行**後**に `headingRef.current?.focus({ preventScroll: true })` を呼ぶ。h1 側に `tabIndex={-1}` を付与して programmatic focus を可能にする。
- Why: `tabIndex={-1}` がないと heading 要素は focus を受け取らない（screen reader announce 不可）。`preventScroll: true` を指定しないと、`role="alert"` + `aria-live="assertive"` の組み合わせでブラウザが視覚的にスクロールを発火する可能性があり、視覚利用者の体験を壊す。
- ordering 不変条件: `logger.error` → `focus()` の順を守る。focus を先に呼ぶと error log が boundary mount 時の副作用順を逸脱し、Phase 6 test 期待値（caller order assertion）と乖離する。
- 適用範囲: Next.js App Router の `error.tsx` boundary。同パターンは `global-error.tsx` にも転用可能だが、global は body 全置換のため `role="alert"` の親要素を別途用意する必要がある。

## L-I769-002: 既存テストファイル探索を「新規テスト命名」より先に実行する

- 症状: 初期設計では `apps/web/app/__tests__/error.spec.tsx` を新規作成する想定だったが、既存に `error.component.spec.tsx` が存在しており、新規ファイル作成は**重複テスト**を生む手戻りになる寸前だった。
- 解消: Phase 4 test plan 確定前に `apps/web/app/__tests__/` を `ls` または `Grep` で走査し、対象コンポーネントに対応する `*.spec.tsx` の有無を確認する。あれば extend、なければ create。
- Why: 既存 test ファイルは過去タスクで命名規約（`*.component.spec.tsx` 等）に従って配置されているため、新規 ad-hoc 命名は CLAUDE.md の `*.spec.{ts,tsx}` 規約には合うが、責務重複を生む。
- 適用範囲: test ファイルを新規作成しようとする全タスク（component/util/integration いずれも）。

## L-I769-003: NON_VISUAL 小タスクでも Phase 12 strict 7 を省略しない

- 症状: 実装差分が 4 行（error.tsx）+ テスト 3 ケース（focus 移譲 / tabIndex / preventScroll 引数）程度の小タスクのため、Phase 12 を簡略化する誘惑があった。
- 解消: strict 7（implementation-guide / main / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）は全件作成。system spec 更新なしの場合も `system-spec-update-summary.md` で「更新なし、理由: ...」と明記する。
- Why: 「軽い」と判断したタスクほど後続タスクが参照する artifact inventory / canonical set への登録漏れが起きやすい。Phase 12 strict 7 は記録の最小単位として常時必要。
- 適用範囲: 全 workflow（NON_VISUAL / VISUAL / spec-only いずれも）。

## L-I769-004: 親 spec の status row と unassigned-task の consumed mark を同一 wave で更新する

- 症状: 実装完了後、`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` の i06 行と `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` のステータスを後で更新しそうになった。
- 解消: 実装 commit と同じ wave（同じ作業セッション内、commit はユーザー gate のため staging 状態）で以下を同期:
  - 親 integration-fixes index の i06 行 → `consumed_by_issue_769_local_implementation` 表記
  - source unassigned task のフロントマターまたは末尾ステータスに `consumed_by_issue_769_local_implementation` を追加
  - aiworkflow-requirements 側の resource-map / quick-reference / artifact inventory / changelog / LOGS / task-workflow-active / keywords も同一 wave
- Why: 親 spec と unassigned task の status drift は、後続タスクが「未消化タスク」と誤検出する原因になる（unassigned-task-detection.md gate が誤発火）。
- 適用範囲: parallel-i** 系を含む全 integration-fixes 子タスクと、unassigned-task を起点とする全ワークフロー。

## L-I769-005: interactive screen reader smoke / commit / push / PR は user-gate を維持する

- 症状: Phase 11 evidence として screen reader での読み上げ確認を Claude が自動実行したくなる場面があった。
- 解消: `outputs/phase-11/evidence/` に DOM snapshot / focus assertion ログまでを置き、screen reader（VoiceOver / NVDA）の発火確認は user-gated boundary として明示。Phase 13 PR テンプレートでも `interactive screen reader smoke` を user gate 行に記載する。
- Why: AT (assistive tech) の announce は OS / ブラウザ / SR バージョン依存で再現性が低く、自動化すると false PASS を生む。boundary を明示しないと PR review 時に「PASS」と誤読される。
- 適用範囲: a11y 系（focus / live region / aria-*）の検証を含む全タスク。
