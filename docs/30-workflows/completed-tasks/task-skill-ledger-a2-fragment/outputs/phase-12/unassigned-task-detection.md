# Unassigned Task Detection（0 件でも出力必須）

## 検出ソース

| ソース | ヒット数 |
| ------ | -------- |
| 元仕様書スコープ外項目 | 3 件（A-1 / A-3 / B-1 — 既登録） |
| Phase 3 / 10 MINOR 指摘 | 2 件 |
| Phase 11 smoke 改善余地 | 1 件（4 worktree smoke 実機未実行） |
| コードコメント TODO/FIXME/HACK/XXX | 0 件（grep 確認） |
| `describe.skip` 残存 | 0 件 |

合計: **新規未タスク 4 件**（既登録 3 件は除く）。`UT-A2-FOLLOW-001` は本レビューで解消したため完了記録として残す。

## 新規未タスク候補

### UT-A2-FOLLOW-001: log_usage.js writer 切替（完了）

#### 苦戦箇所【記入必須】
- 既存 4 skill（aiworkflow-requirements / automation-30 / github-issue-manager / int-test-skill）の `log_usage.js` が `LOGS.md` 直接 path に append する実装だった。fragment 化により書込み先が `LOGS/_legacy.md` に rename されているため、本レビューで fragment writer へ切替済み。

#### リスクと対策
- リスク: 上記 4 skill の log_usage 実行が壊れる。
- 対策: 各 `log_usage.js` が `LOGS/<timestamp>-<branch>-<nonce>.md` を生成するよう修正済み。

#### 検証方法
- `pnpm skill:logs:render --skill <skill>` で fragment が表示されること。
- `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills --glob "scripts/**"` の結果が 0 件。

#### スコープ
- 含む: 4 skill の log_usage.js 切替、SKILL.md の `LOGS.md` 言及更新。
- 含まない: 他 skill 系の writer（既に fragment 経由）。

---

### UT-A2-SMOKE-001: 4 worktree smoke 実機検証

#### 苦戦箇所【記入必須】
- fragment 化の主目的は 4 worktree 並列追記 conflict 0 件だが、現時点では単体テストと証跡フォーマット固定までで、実 worktree merge smoke は未実行。

#### リスクと対策
- リスク: 理論上は一意 path でも、実際の worktree 作成・merge・render 手順に環境依存の失敗が残る。
- 対策: `outputs/phase-11/4worktree-smoke-evidence.md` の手順で実機 smoke を実行し、`git ls-files --unmerged` 0 行と render 先頭出力を保存する。

#### 検証方法
- 4 worktree で fragment を作成し、main へ順次 merge して conflict 0 件を確認。
- `pnpm skill:logs:render --skill aiworkflow-requirements` に 4 entry が timestamp 降順で出ること。

#### スコープ
- 含む: smoke worktree 作成、fragment 生成、merge、証跡保存。
- 含まない: CI guard 追加、A-1/A-3/B-1 の実装。

---

### UT-A2-COV-001: extractTimestampFromLegacy mtime catch 経路テスト

#### 苦戦箇所【記入必須】
- `statSync` が同期 reject する状況が現実的に発生しないため、catch 経路（`return 0`）が単体テストで通っていない。

#### リスクと対策
- リスク: 安全策が腐敗する（実装意図が将来見えなくなる）。
- 対策: vitest の `vi.mock("node:fs")` で `statSync` を throw に差し替えるテストを 1 件追加。

#### 検証方法
- `pnpm vitest run scripts/skill-logs-render.test.ts` で当該分岐を coverage 100% にする。

#### スコープ
- 含む: 単体テスト 1 件追加。
- 含まない: 実装ロジック変更。

---

### UT-A2-CI-001: writer grep の CI 必須化

#### 苦戦箇所【記入必須】
- R-1 / R-2 回帰 guard を CI step として登録する作業が、本タスクスコープ外。

#### リスクと対策
- リスク: 将来の PR で writer 経路に `LOGS.md` が再混入しても CI が検出できない。
- 対策: `.github/workflows/*.yml` に `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills --glob "scripts/**"` step を追加。

#### 検証方法
- CI 実行ログでステップが実行され、ヒット時 fail することを確認。

#### スコープ
- 含む: GitHub Actions workflow 追加 / 既存 lint job への step 追加。
- 含まない: skill 本体の writer 改修（UT-A2-FOLLOW-001 と分離）。

---

### UT-A2-LINT-001: pnpm lint フルラン（完了）

#### 苦戦箇所【記入必須】
- 本タスクで scripts/ 配下を増やしたが `pnpm lint` フルラン未実施。

#### リスクと対策
- リスク: lint-boundaries 違反の見逃し。
- 対策: `pnpm lint` 実行済み。

#### 検証方法
- `pnpm lint` exit 0（確認済み）。

#### スコープ
- 含む: lint 違反の修正。
- 含まない: lint ルール変更。

## 既登録タスク（参考）

| ID | 概要 | 場所 |
| -- | ---- | ---- |
| A-1 | `.gitignore` 化 | `task-skill-ledger-a1-gitignore` |
| A-3 | Progressive Disclosure 分割 | `task-skill-ledger-a3-progressive-disclosure` |
| B-1 | `.gitattributes merge=union` | `task-skill-ledger-b1-gitattributes` |

## 検出スクリプト（参考）

```bash
node scripts/detect-unassigned-tasks.js --scan scripts --output .tmp/unassigned-candidates.json
```
