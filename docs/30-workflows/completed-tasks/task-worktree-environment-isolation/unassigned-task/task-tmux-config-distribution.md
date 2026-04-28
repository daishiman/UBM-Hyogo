# task-tmux-config-distribution

| 項目 | 内容 |
| --- | --- |
| status | detected |
| detected_in | task-worktree-environment-isolation |
| priority | low |
| owner_candidate | platform / dev-environment |

## Why

tmux の `~/.tmux.conf` はリポジトリ管理外の個人設定であり、仕様書にスニペットを置くだけでは全開発者へ同じ設定が届かない。

## What

- `update-environment` 最小化スニペットの配布先を決める。
- CLAUDE.md、getting started docs、dotfiles のいずれを正本にするか決める。
- `tmux source-file ~/.tmux.conf` 後の検証手順を提示する。

## Acceptance Criteria

- 開発者が 2 ホップ以内で tmux 設定テンプレートへ到達できる。
- `tmux show-environment -g | grep -E '^UBM_WT_' || true` が空である確認手順が記載される。
- tmux 非利用者に影響しないことが明記される。

## References

- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/development-guidelines-details.md`
