# user approval marker

- approved_at: 2026-05-16T00:00:00+09:00
- approved_by: daishiman
- approved_scope:
  - .github/workflows/playwright-visual-full.yml の `pull_request:` トリガー有効化
  - `gh workflow run playwright-visual-baseline-update.yml` 実行（51 baseline PNG capture）
  - baseline-update PR を task branch へ取り込み
  - playwright-visual-full CI の 2-run stability evidence 取得
  - task branch commit / push / PR 作成（`Closes #709`）
- approval_channel: Claude Code AskUserQuestion (in-session)
- notes: 本プロンプトの runtime gate (CONST_007) を満たすために in-session で取得した承認。`visual-baseline-approval` GitHub environment の approval gate は別途 GitHub UI 上でユーザーが対応する。
