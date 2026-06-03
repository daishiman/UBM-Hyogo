# Lessons Learned — sidebar-visibility-conditional-and-ux

> Scope: `docs/30-workflows/completed-tasks/sidebar-visibility-conditional-and-ux/`（`implemented_local_evidence_captured / implementation / VISUAL`）
> Inventory: `references/workflow-sidebar-visibility-conditional-and-ux-artifact-inventory.md`（`## Lessons Learned` から本ファイルを参照）

## L-SVC-001: Spec drift bug は新仕様創作ではなく正本への実装一致として扱う

09h §1.6 が既に `/login` を shell 外 bare と規定している場合、`/login` に sidebar が出る不具合は新しい UI 仕様ではなく **実装が正本から逸脱した spec drift bug** と分類する。
Phase 1 の真の論点では「正本仕様」「現実装」「差分修正」を分離し、Phase 12 では正本と実装を同一 wave で同期する。

## L-SVC-002: shell 表示条件は route group が単一所有する

「どの route が shell を被るか」は layout 内の条件分岐ではなく、Next.js App Router の route group で表現する。
`(auth)` は bare、`(public)` / `(member)` / `(admin)` は SidebarShell とし、invariant test で `(auth)` layout が shell primitive を import しないことを固定する。

## L-SVC-003: VISUAL task は local deterministic evidence と pixel evidence を分離する

UI 実装は focused Vitest / typecheck / lint / grep gates で local deterministic evidence を完了できる。
一方、認証済み staging screenshot は external runtime 依存のため user-gated として分離し、`implemented_local_evidence_captured` と `pixel_screenshot_pending_user_gate` を併記する。

## L-SVC-004: role→nav 契約は item 数・route・外部リンクまで正本同期する

shell の role→nav 仕様は「大分類が存在する」だけで PASS にしない。`buildNavForRole` が返す item 数、route、外部リンク（例: admin の `Form回答`）まで 09h §1.2 と同期し、
static invariant test で仕様側の古い item 数表記を検出できるようにする。
