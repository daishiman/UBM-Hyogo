---
phase: 13
name: PR作成
task_id: issue-1102-usedismissable-hook-extraction
status: blocked
---

# Phase 13: PR作成（blocked）

## 13.1 user-gated（最重要・CONST_002）

**commit / push / PR の作成は、ユーザーの明示承認後のみ実行する。**
本 wave では実コードとローカル証跡を反映したが、commit も PR も作成しない。
本ファイルは PR 作成時に使う**ドラフトと前チェック**を定義するのみ。

## 13.2 blocked 理由

- 実装コードは反映済み（`implemented_local_evidence_captured`）。
- focused vitest は PASS（3 files / 35 tests）。
- commit / PR は user-gated。
- → ユーザー承認を得て初めて本フェーズを実行する。

## 13.3 ブランチ / base

| 項目 | 値 |
| --- | --- |
| 作業ブランチ | `docs/issue-1102-usedismissable-hook-extraction-spec`（実装込みの場合も同ブランチで継続可） |
| PR base | `dev`（CLAUDE.md PR フロー既定。`main` への PR は production リリース時のみ） |

## 13.4 PR タイトル案

```
refactor(web): <details> popover の dismiss を汎用 useDismissable hook へ抽出（issue-1102）
```

## 13.5 PR 本文ドラフト

```markdown
## 背景

`<details>` popover の dismiss（外側 pointerdown / Escape 閉じ）ロジックが
`SidebarUserMenu.tsx`（L34-58）と `DensityToggle.client.tsx`（L76-101）の
2 箇所にほぼ同一の inline `useEffect` として重複していた（計約 50 行）。
片側だけ Escape 漏れ / cleanup（removeEventListener）漏れが起きうる DRY 違反。
issue #1102 はこれを汎用 hook へ抽出することを求める。

## 変更点

- NEW `apps/web/src/hooks/useDismissable.ts`
  - `useDismissable(ref: RefObject<HTMLElement | null>, onClose: (reason: DismissReason) => void, options?: { enabled?: boolean })`
  - `DismissReason = "pointerdown-outside" | "escape"`
  - 内部は `browserDocument()` 経由。外側 pointerdown → `onClose("pointerdown-outside")` /
    Escape → `onClose("escape")` / 内側は無視 / `enabled:false` は no-op / cleanup で removeEventListener。
- NEW `apps/web/src/hooks/__tests__/useDismissable.spec.tsx`（hook 単体テスト）
- EDIT `apps/web/src/components/shell/SidebarUserMenu.tsx`
  - inline `useEffect` を `useDismissable(detailsRef, closeMenu)` へ置換。`browserDocument` 直接 import を除去。
  - route-close `useEffect`（pathname 依存）は責務別ゆえ残置。
- EDIT `apps/web/src/components/public/DensityToggle.client.tsx`
  - inline `useEffect` を `useDismissable(detailsRef, onDismiss)` へ置換。
  - Escape 時の summary focus 復帰は `reason === "escape"` 分岐で保持。`browserDocument` 直接 import を除去。

## テスト

- focused vitest（hook spec + consumer 回帰 spec 2 本）全 PASS。
- 既存 consumer spec 2 本は**無改修**でパス（挙動不変の証跡）。
- `pnpm typecheck` / `pnpm lint` 緑。

## 不変条件

- I-2: `<details>.open` を単一所有（hook は open を読み書きしない）。
- I-5: document アクセスは `browserDocument()` 経由のみ（consumer から素の document を除去）。
- NON_VISUAL: DOM / CSS / 表示は不変。

## 参照

- issue #1102（CLOSED 維持。本 PR は recovery spec に基づく実装で、issue 状態は変更しない）
```

## 13.6 PR 前チェックリスト（CLAUDE.md PR フロー準拠）

実行順（すべて user 承認後）:

1. `mise exec -- pnpm install --force`
2. `mise exec -- pnpm typecheck` → エラー 0
3. `mise exec -- pnpm lint`（失敗時はまず `pnpm lint --fix`）→ エラー 0
4. focused vitest（Phase 11 §11.4 のコマンド）→ 全 PASS
5. `bash scripts/verify-pr-ready.sh` → PASS
6. `git status --porcelain` が空（未コミット変更なし）
7. `git diff dev...HEAD --name-only` で PR 対象ファイル一覧を確認（hook + spec + consumer 2 + 本 spec docs）
8. `gh pr create --base dev`（タイトル §13.4 / 本文 §13.5）

スクリーンショット: NON_VISUAL のため `outputs/phase-11/` に画像なし → PR 本文にスクリーンショット section を作らない。

## 13.7 最終レポート項目（PR 作成完了時に 1 回だけ報告）

- PR URL / 採用ブランチ（base=dev）/ 実行した自動修復 / 解消したコンフリクト / 残課題の有無。
