# Phase 11 manual test result

- 証跡の主ソース: `pnpm test:phase12-compliance`
- スクリーンショットを作らない理由: validator (Node.js) の追加であり UI 変更を伴わないため (NON_VISUAL)
- 実行者: Codex
- 実行日時: 2026-05-17T00:00:00+09:00
- 実行環境: Node 24.x / pnpm 10.33.2 / local worktree

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test:phase12-compliance` | PASS | 1 file passed / 19 tests passed |

## Covered cases

- `fail-missing-evidence` returns `reason: "missing-evidence"`.
- `pass` fixture includes `main.md`, `manual-test-result.md`, `manual-smoke-log.md`, and `link-checklist.md`.
- `Present` is invalid and fails rather than being treated as `present`.
- `../outside.md` is rejected as workflow-root escape.
- Empty `present` paths fail as missing evidence.
- Directory paths fail because `present` requires a physical file.
- Numbered canonical heading `## 4. Phase 11 evidence file inventory` is parsed.
- Parser and existence checker direct unit coverage is included in the focused suite.
