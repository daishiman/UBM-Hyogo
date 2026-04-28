# Phase 5 — 実装ランブックサマリ

## Status

completed

## サマリ

本タスクは implementation であり、本 Phase の責務は「後続 `feat/*` 実装タスクが順序通りに作業できるランブック」を確定することに限る。実コードを作成する。

実装タスクが触るファイルパスを先に固定する [Feedback RT-03]:

### 新規作成

| パス | 役割 |
| --- | --- |
| `lefthook.yml` | 正本設定（全 supported lane × commands） |
| `scripts/hooks/staged-task-dir-guard.sh` | 旧 `.git/hooks/pre-commit` から移植 |
| `scripts/hooks/stale-worktree-notice.sh` | 旧 post-merge から共通化 |

### 修正

| パス | 修正内容 |
| --- | --- |
| `package.json` | `devDependencies.lefthook` 追加 / `scripts.prepare` / `scripts.indexes:rebuild` 追加 |
| `.gitignore` | `lefthook-local.yml` 追記 |
| `scripts/new-worktree.sh` | 末尾に `pnpm exec lefthook install` 追加 |

### 削除（lefthook install で上書きされるため明示削除は不要）

| パス | 備考 |
| --- | --- |
| `.git/hooks/pre-commit` | lefthook install で置換 |
| `.git/hooks/post-merge` | 同上（再生成ロジックは消滅） |

## canUseTool 適用範囲 [Feedback P0-09-U1]

shell + yaml + package.json のみで SDK callback を使わない。N/A。

## 詳細手順

`outputs/phase-5/runbook.md` を参照。
