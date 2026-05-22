# Lessons Learned — parallel-03 AppShell Layouts（2026-05-19）

> 親 workflow: `docs/30-workflows/ui-prototype-design-system-foundation/`
> sub-workflow: `parallel-03-appshell-layouts/`
> 関連 artifact inventory: [`workflow-ui-prototype-design-system-foundation-artifact-inventory.md`](../references/workflow-ui-prototype-design-system-foundation-artifact-inventory.md)
> ステータス: `implemented_local_evidence_captured / implementation / VISUAL (public chrome only)`

## 背景

`apps/web/app/(public|member|admin)/layout.tsx` の 3 layout を、parallel-01/02 で
`globals.css` に追加された `[data-theme]` / `[data-shell]` / `[data-route]` selector に
機械的にぶら下げるための data-* 契約付与タスク。新規 primitive / API / D1 schema 追加なし。
Phase-1 検証で 5 つの構造的な学びが抽出された。

## Lessons

### L-PAR03-001: `implementation_mode: existing-layout-alignment` を正式 mode 値として登録する

- **Why（中学生向け）**: タスクには「新しい部品を作る」モードと「すでにある部品に印を貼り直す」モードがあって、後者を正式に呼べる名前がなかったので、毎回「これは新規実装か？」と混乱していた。
- **How to apply**:
  - `implementation_mode` が `existing-layout-alignment` の sub-workflow は、新規 primitive / API endpoint / D1 schema / Google Form 仕様変更を **行わない** 不変条件を併記する。
  - 編集対象は既存 `apps/web/app/**/layout.tsx` (または同等の chrome 層) のみに限定し、`apps/web/src/components/**` の primitive props / signature 変更を禁止する。
  - Phase 3 task breakdown 時点で mode 値を artifacts.json `metadata.implementation_mode` に記録する（spec compliance check で正常値として通過させる）。
- 適用先 spec: `task-specification-creator` skill の mode enum 追記候補。

### L-PAR03-002: VISUAL gate と runtime evidence の分離（`deferred-to-serial-07` ラベル）

- **Why**: ログイン必須の admin/member chrome は本 sub-workflow の Playwright スコープでは安定に撮れないが、`visualEvidence=VISUAL` の sub-workflow を `screenshot 0 枚` で閉じると compliance check が落ちる。
- **How to apply**:
  - public 等の認証不要 chrome は本 sub-workflow で screenshot 取得する。
  - admin/member full chrome screenshot は `outputs/phase-11/screenshot-coverage.md` に `deferred-to-serial-07` ラベルで明記し、親 workflow `serial-07-regression-evidence/` で取得する owner 移譲を記録する。
  - Phase 12 compliance では、VISUAL gate を「本 sub-workflow 取得分 + deferred 明記」の両方を満たした時に PASS と判定する vocabulary を統一する（L-PAR03-005 参照）。

### L-PAR03-003: Server Component (async) + `next/navigation` redirect の test 戦略パターン

- **Why**: admin layout は `async function AdminLayout()` で `getSession()` 後に `redirect('/login?...')` を呼ぶ Server Component。通常の RTL `render()` では async コンポーネントを直接マウントできず、redirect 分岐の test がコケる/書けない。
- **How to apply**:
  - `vi.mock('next/navigation', () => ({ redirect: vi.fn((url) => { throw new RedirectError(url) }) }))` で redirect を throw 化し、`await expect(AdminLayout({ children })).rejects.toThrow(RedirectError)` で分岐検証する。
  - 認証成功 path は `redirect` mock が呼ばれないことを assert し、返却 JSX を `renderToStaticMarkup` 等で DOM 文字列化して `data-route-group="admin"` / chrome 構造を検証する。
  - `getSession` を `vi.mock` し、unauthenticated / non-admin / admin の 3 fixture を返すことで 3 分岐を網羅。

### L-PAR03-004: EV inventory path label vs 実体ファイルの drift 検出

- **Why**: `outputs/phase-11/evidence-inventory.md` に書いた path と実際に書き出した log file 名が drift しやすい（例: `verify-tokens.log` vs `verify-design-tokens.log`）。Phase 12 compliance の `verify-phase11-evidence-existence` で落ちる。
- **How to apply**:
  - Phase 11 inventory を書く前に `ls outputs/phase-11/` の出力を一度貼り付け、その path string をそのまま inventory table の `path` 列にコピーする。
  - inventory `path` 列の値を `pnpm verify:phase12-compliance` で物理実在検証する（Issue #730 validator）。
  - log filename は `<concern>.log` / `<concern>-spec.log` / `<concern>-scrape.txt` のセマンティクスで統一し、後付けの rename を避ける。

### L-PAR03-005: Phase-12 verdict vocabulary 統一

- **Why**: 同じ sub-workflow でも Phase 12 で `PASS` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `implemented_local_evidence_captured` 等の表記揺れがあり、resource-map / quick-reference / task-workflow-active で違う語が並ぶ。
- **How to apply**:
  - sub-workflow verdict は以下の固定語彙を使う:
    - `implemented_local_evidence_captured`: 実装完了・local evidence 取得済。runtime / commit / push / PR は user-gated。
    - `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`: 上記に加え CI / staging runtime evidence pending。
    - `VISUAL` / `NON_VISUAL` は visual evidence の class、`(public chrome only; admin/member deferred-to-serial-07)` のように deferred scope を括弧で補記する。
  - Phase 12 strict 7 outputs（`phase12-task-spec-compliance-check.md`, `implementation-guide.md`, ...）の verdict 行と、aiworkflow-requirements skill 側の 3 index（resource-map / quick-reference / task-workflow-active）に同じ語彙を採用する。

## 関連ドキュメント

- artifact inventory: `references/workflow-ui-prototype-design-system-foundation-artifact-inventory.md` § Sub-workflow: parallel-03 AppShell Layouts
- 親 workflow scope: `docs/30-workflows/ui-prototype-design-system-foundation/SCOPE.md`
- prototype coverage SSOT: `docs/30-workflows/ui-prototype-design-system-foundation/PROTOTYPE-COVERAGE.md`
- sub-workflow implementation guide: `docs/30-workflows/ui-prototype-design-system-foundation/parallel-03-appshell-layouts/outputs/phase-12/implementation-guide.md`

## 変更履歴

| date | change |
|------|--------|
| 2026-05-19 | parallel-03 AppShell Layouts Phase-1 検証由来の L-PAR03-001..005 を新規記録 |
