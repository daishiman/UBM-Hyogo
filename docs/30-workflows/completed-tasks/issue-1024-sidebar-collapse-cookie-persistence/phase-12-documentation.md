# Phase 12: ドキュメント同期

> issue-1024 — sidebar collapse 状態の cookie 永続化（SSR seed + lint 回避ハック撤廃）
> GitHub Issue #1024 は **CLOSED のまま現行コードへ再スコープ**して作成（reopen しない）。

## 12.1 ゴール

sidebar collapse 状態を **cookie（`ubm_shell_collapsed`）で永続化**し、`SidebarShellServer` が `next/headers` の `cookies()` で読み取って `initialCollapsed` を seed することで **初回 SSR HTML が collapse 状態を正しく反映**し、hydration 後のちらつきを排除する。あわせて `useSidebarState.ts` の `"local" + "Storage"` 文字列分割ハックと localStorage 依存を撤廃し、lint-boundaries を正当に満たす。本タスクは UI 見た目を変えない NON_VISUAL の状態 seed / 永続化 mechanism 変更である。

## 12.2 アーキテクチャ整合

- **D1 / API / Google Form schema 不変**: cookie は client UI 設定のみを保持し、API endpoint・D1 schema・auth middleware に触れない（親不変条件 #5）。`apps/web` から D1 直接アクセスも発生しない。
- **env アクセス境界**: 本タスクは env を新規参照しない。
- **`document` アクセス境界**: cookie の client 読み書きは `@/lib/is-browser` の `browserDocument()` 経由とし、`document` への直接参照を増やさない（`apps/web` の browser-API 正規入口に整合）。
- **Web Storage 境界**: cookie は `scripts/lint-boundaries.mjs` の禁止トークン（`localStorage` / `sessionStorage`）対象外。localStorage 依存と `"local"+"Storage"` 回避ハックを撤廃することで、トークン allowlist を経由しない正当な lint clean になる。
- **SSR / hydration 整合**: server で読んだ cookie → `initialCollapsed` → `useState` 初期値、と client 初期 render を同値にし、hydration mismatch を起こさない。
- **OpenNext Workers 互換**: `cookies()` は server component で標準利用でき、追加 runtime 依存を増やさない。

## 12.3 不変条件への反映

- I-1（hook 戻り値 shape 不変）: `useSidebarState()` の戻り値 `{ mode, drawerOpen, toggleCollapsed, setDrawerOpen }` を維持。引数 `initialCollapsed: boolean | null = null` を optional 追加するのみ（後方互換）。
- I-2（state owner 単一）: collapse/drawer state は `useSidebarState` 1 系のみ。新規 store を増やさない。
- I-5（Web Storage 禁止トークン）: `apps/web/src` 配下へ `localStorage` / `sessionStorage` を新規に焼き込まない。本タスクは既存トークンを**削減**する方向。
- I-6（cookie 属性）: `httpOnly` を付けない（client が読み書き）。`path=/` / `SameSite=Lax` / `max-age` 付き。秘匿情報を含まない UI 設定のみ。
- I-7（hydration 同値）: SSR seed 経路と client 初期 render を同値化。
- プロジェクト不変条件 #9（admin form は `FormField` 経由）・#10（admin mutation は `useAdminMutation` 経由）は本タスク非該当（form / mutation を増やさない）。

## 12.4 関連 task との接続

- **親**: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/`（統一 SidebarShell）。
- **sibling**: Task A（SidebarShell primitive）/ Task E（mobile drawer + 初期 collapsed 判定）。本タスクは Task A/E の上に cookie seed 層を**追加**する後方互換変更で、md viewport heuristic（seed=null 時）は Task E 仕様を維持する。
- **起点**: `docs/30-workflows/completed-tasks/admin-layout-sidebar-shell-migration/outputs/phase-12/unassigned-task-detection.md`（FU-ALSSM-001）。

## 12.5 公式ドキュメント更新

- `docs/00-getting-started-manual/specs/` 配下: 本タスクは API/D1/Form schema を変えないため**仕様正本の更新は不要**。
- CLAUDE.md「`apps/web` env アクセス不変条件」: 既存 `browserDocument()` 経由ルールに整合するのみで、追記は不要。
- design-tokens / OKLch: CSS 変更なしのため**更新なし**。
- 結論: API / D1 / Form / design token の公式仕様更新は **N/A**。ただし workflow inventory / lessons / quick-reference は aiworkflow-requirements へ同 wave で反映済み。

## 12.6 lessons-learned 反映候補

| 候補 | 内容 |
|------|------|
| L-I1024-cookie-vs-storage | UI 設定の永続化で SSR seed が必要なものは localStorage ではなく cookie を選ぶ（server が `cookies()` で読めるため初回ちらつきを構造的に排除できる）。 |
| L-I1024-lint-hack-smell | `"local" + "Storage"` のような文字列分割で lint 禁止トークン検査を回避するのは code smell。検査対象外の機構（cookie）へ移行して正当に解消する。 |
| L-I1024-ssr-seed-hydration | server で読んだ初期値を `useState` 初期値へ seed し、client 初期 render と同値化することで hydration mismatch を防ぐ。 |

> 実コード差分が同 wave で着地したため、aiworkflow-requirements の lessons-learned へ promote 済み。

## 12.7 evidence

- 設計証跡: `phase-1-requirements.md` / `phase-2-design.md` / `phase-3-design-review.md`。
- テスト計画: `phase-4-test-plan.md` / `phase-7-coverage.md`（カバレッジ対象限定）。
- 受入: `phase-10-final-review.md`（AC-1〜AC-5 + DoD）。
- 手動 / NON_VISUAL 証跡: `phase-11-manual-test.md` / `outputs/phase-11/manual-test-result.md`（主証跡 = focused vitest log + SSR HTML seed inspection、screenshot なし）。
- 実装ガイド: `outputs/phase-12/implementation-guide.md`。
- 30種思考法 + エレガント検証: `outputs/phase-12/elegant-review-result.md`。

## 12.8 未タスク検出 (unassigned-task)

詳細は `outputs/phase-12/unassigned-task-detection.md`。要旨: Issue #1024 本体（cookie 永続化・SSR seed・lint ハック撤廃）は本サイクルで完結し、follow-up として **2 件**を仕様書化・Issue 化済み（#1063 production `Secure` hardening、#1065 shell-collapse-cookie API 命名 drift 整合）。

## 12.9 完了条件

- 本 workflow の Phase 1-13 ドキュメントが揃い、`outputs/phase-12` strict 7 点 + `outputs/phase-11/manual-test-result.md` が存在する（implemented_local_evidence_captured）。
- 実装 DoD のうち local automated evidence（web lint/typecheck、focused vitest、grep gate）は取得済み。browser / DevTools による SSR source inspection は user-gated manual smoke として残す。
- commit / push / PR は **user 明示承認後のみ**（Gate-C / `phase-13-pr.md`）。
