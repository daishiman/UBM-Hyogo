# Phase 4: 前提整備 / 依存確認

## 目的

Node 24 / pnpm 10 / TypeScript / vitest 動作確認と、`pnpm verify:phase12-compliance` script の追加方針を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

| Task | 内容 |
| --- | --- |
| 4-1 | `mise exec -- pnpm typecheck` がローカルで通る状態を確認 |
| 4-2 | `package.json` に `verify:phase12-compliance` script を追加する方針を確定（実装は Phase 5） |
| 4-3 | git diff 取得方法を `git diff --name-only ${GITHUB_BASE_REF}...HEAD` に確定 |
| 4-4 | tsx / ts-node のどちらで script を実行するか確定（既存に揃える） |

## 依存パッケージ

- 既存依存のみ使用（新規依存追加なし）
- `node:fs/promises` / `node:child_process` / `node:path` を使用

## 完了条件

- [ ] `package.json#scripts.verify:phase12-compliance` の追加プランを記述
- [ ] script 実行 runner を確定（既存に揃える）

## Next Phase

- [Phase 5](phase-05.md): 中核実装
