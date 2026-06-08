# Phase 13 — PR 作成

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

| key | value |
| --- | --- |
| status | `pending_user_approval` |
| base ブランチ | `dev` |
| branch | `docs/issue-1112-attendance-count-badge-emphasis-spec` |
| issue | #1112（`CLOSED`・状態変更しない） |

## 本 Phase の方針

本 Phase では **何も実行しない**。以下はすべて user の明示承認後にのみ実行する。

- `git add` / `git commit`
- `git push`
- `gh pr create --base dev`（PR 作成・base は `dev`）
- staging deploy
- staging screenshot 3 点（`attendance-badge-level-none/normal/high.png`）の追加取得と PR 本文への添付
- Issue #1112 の状態確認（reopen / close は行わない）

## PR 作成手順（後続・user 承認後）

1. user 承認後、必要なら品質検証（targeted vitest / typecheck / verify-design-tokens）を再実行する。
2. `outputs/phase-12/implementation-guide.md` と Phase 12 summary を PR 本文へ反映する。
3. VISUAL_ON_EXECUTION のため、staging で 3 段階（none/normal/high）の screenshot を追加取得し PR 本文に参照を含める。
4. `git add` / `git commit` / `git push` を実行する。
5. `gh pr create --base dev` で PR を作成する。

## 注意

- 本タスクは `implemented_local_evidence_captured`。本 Phase は実行待ち（`pending_user_approval`）であり、
  commit / push / PR / staging deploy / screenshot / Issue mutation は user の明示承認なしには実行しない。
- 新規 GitHub Issue の起票はしない。Issue #1112 の状態は変更しない。
