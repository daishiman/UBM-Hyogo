# Unassigned Task Detection

検出元を網羅的に表で記録（0 件であっても表自体は出力する方針）。

## 検出元一覧

| # | 検出元 | 候補タスク | 状態 | 反映先 |
| --- | --- | --- | --- | --- |
| 1 | 元タスク Phase 12 unassigned-task-detection | pre-commit hook で alias 整合 check | **継続未タスク**（本タスクは TC-R-01 guard を **手動実行用** として確定し、CI 化 / pre-commit 化は別タスクへ） | 後続タスクとして登録候補（下記 N1） |
| 2 | 元タスク Phase 12 unassigned-task-detection | MCP server permission の挙動検証 | **継続未タスク**（本タスク範囲外） | 後続タスクとして登録候補（下記 N3） |
| 3 | Phase 10 MINOR #1 | `Edit` / `Write` whitelist 化 | **継続未タスク**（元タスク Phase 10 MINOR 保留分） | 後続タスクとして登録候補（下記 N2） |
| 4 | Phase 10 MINOR #2 | `permissions.deny` 実効性追跡（bypass 下） | **継続未タスク**（前提タスク `deny-bypass-verification-001` の継続運用化） | 既存 unassigned task の継続化 |
| 5 | Phase 10 MINOR #3 | MCP server / hook permission 検証 | **継続未タスク** | 後続タスク（#2 と統合候補） |
| 6 | Phase 10 MINOR #4 | TC-R-01 guard スクリプトの CI 化 | **継続未タスク**（GitHub Actions zsh job への組み込み） | 後続タスクとして登録候補（下記 N1 と統合候補） |
| 7 | Phase 11 TC-05 BLOCKED 由来 | bypass + deny 実効性追検証 | **継続未タスク**（前提タスク `deny-bypass-verification-001` の継続運用化） | 既存 unassigned task の継続化 |
| 8 | TC-05 関連 #2 | `project-local-first-comparison-001` 比較タスク | **継続未タスク**（前提タスクスキップ済） | 既存 unassigned task の継続化 |
| 9 | コードコメント TODO grep | `grep -rn "TODO" outputs/` | **0 件** | 該当なし |

## TODO grep 実行結果

```bash
grep -rn "TODO" docs/30-workflows/task-claude-code-permissions-apply-001/outputs/ | wc -l
# → 0
```

## 新規未タスク登録（物理ファイル作成済）

| ID | 候補タスク名 | スコープ | 優先度 |
| --- | --- | --- | --- |
| N1 | `task-claude-code-cc-alias-guard-ci-001` | TC-R-01 guard を pre-commit hook + CI（GitHub Actions zsh job）に組み込み | MEDIUM |
| N2 | `task-claude-code-permissions-allowlist-minimization-001` | `rm` / `git:*` / `Edit` / `Write` の allowlist 最小化と backup 混入方針確定 | HIGH |
| N3 | `task-claude-code-mcp-hook-permission-verification-001` | MCP server / hook permission の挙動検証 | LOW |
| N4 | `task-claude-code-workflow-skill-template-hardening-001` | host/NON_VISUAL/FORCED-GO 状態語彙を skill テンプレートへ反映 | MEDIUM |

上記 N1〜N4 は `docs/30-workflows/unassigned-task/` 配下に物理 spec を作成済み。

## 既存 unassigned 継続化

| 既存タスク | 継続化判定 |
| --- | --- |
| `task-claude-code-permissions-deny-bypass-verification-001` | **継続化**（TC-05 / Phase 10 MINOR #2 と統合的に追跡） |
| `task-claude-code-permissions-project-local-first-comparison-001` | **継続化**（本タスクで採用方針 (b) 確定済だが、project-local-first 採否の比較は将来再検討の余地あり） |

## 検出件数サマリ

| 区分 | 件数 |
| --- | --- |
| TODO grep | 0 |
| 新規登録 | 4（N1 / N2 / N3 / N4） |
| 既存 unassigned 継続化 | 2 |
| 合計（要対応） | 5 |
