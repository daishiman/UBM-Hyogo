# Phase 6: テスト戦略（検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-346-08a-canonical-workflow-tree-restore |
| Phase 番号 | 6 / 13 |
| Phase 名称 | テスト戦略 |
| Wave | restore |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (受入条件マトリクス) |
| 状態 | completed |

## 目的

本タスクは docs-only / NON_VISUAL のため、Vitest / Playwright 等のコードテストではなく、**markdown / json 整合の検証戦略**を定義する。観測対象は (1) 物理 path 存在、(2) 参照 grep 整合、(3) aiworkflow-requirements 状態欄の一致、(4) indexes 再生成 drift の 4 軸。

## 検証 4 軸

| 軸 | 観測対象 | 検証コマンド | 期待観測 |
| --- | --- | --- | --- |
| 物理 path | canonical / completed-tasks / 派生 dir | `test -e ...` | A 採用時は canonical=不在、派生 dir=存在 |
| 参照 grep | docs/ 配下の 08a 言及 | `rg "08a-parallel-api-contract" docs/` | canonical path への直接参照が実在する |
| 状態欄一致 | aiworkflow-requirements 3 ファイル | `rg "08a" .claude/skills/aiworkflow-requirements/references/{legacy-ordinal-family-register,resource-map,task-workflow-active}.md` | 3 ファイルの状態語彙が `current/partial` で揃っている |
| indexes drift | aiworkflow-requirements indexes | `pnpm indexes:rebuild && git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/` | drift 0（exit 0） |

## 検証ケース

### Case 1: canonical path 復元確認

- 入力: `test -e docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/`
- 期待: exit 0（存在）→ A restore の物理事実と一致

### Case 2: follow-up 08a-A 実在の確認

- 入力: `test -e docs/30-workflows/02-application-implementation/08a-A-public-use-case-coverage-hardening/`
- 期待: exit 0（存在）→ 08a-A は canonical root の代替ではなく follow-up として有効

### Case 3: 09a / 09b / 09c の broken link 解消

- 入力: `rg "08a-parallel-api-contract-repository-and-authorization-tests" docs/30-workflows/09a-* docs/30-workflows/09b-* docs/30-workflows/09c-*`
- 期待: 0 件、または「canonical restoration 注記付き」の補足表現のみ

### Case 4: aiworkflow-requirements 3 ファイルの語彙一致

- 入力: 3 ファイル横断で 08a の状態欄を抽出
- 期待: いずれも `current/partial`（A 採用時）または採用案に応じた一致した状態語

### Case 5: unassigned-task 内 08a 参照同期

- 入力: `rg "08a-parallel-api-contract" docs/30-workflows/unassigned-task/`
- 期待: 直接参照が実在 canonical path に解決

### Case 6: indexes drift 0

- 入力: `pnpm indexes:rebuild` 後の `git diff --exit-code .claude/skills/aiworkflow-requirements/indexes/`
- 期待: exit 0

### Case 7: secret hygiene

- 入力: `grep -iE '(token|cookie|authorization|bearer|set-cookie|secret|api[_-]?key)' outputs/phase-11/evidence/*.log`
- 期待: 0 件 hit

## 既存テストへの影響

- 本タスクは `apps/api` / `apps/web` のソースに触れないため、Vitest / Playwright 既存スイートへの影響は **無し**。
- ただし `verify-indexes-up-to-date` CI gate は本タスクの直接対象なので、Phase 8 で必ず通過確認する。

## 検証実行のタイミング

| Phase | 実行内容 |
| --- | --- |
| Phase 5 Step 6 | runbook 内で Case 1〜6 を順次実行 |
| Phase 8 | CI gate として `verify-indexes-up-to-date` を gate 化 |
| Phase 9 | secret hygiene として Case 7 を実行 |
| Phase 11 | 全 7 種 evidence を取得 |

## 完了条件

- 4 軸の検証ケース 7 件が確定
- 既存テストへの影響範囲が明示（無し）
- 検証実行タイミングが Phase 5 / 8 / 9 / 11 にマッピング
- `outputs/phase-06/main.md` に記録

## 成果物

- `outputs/phase-06/main.md`
