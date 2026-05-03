# Phase 2: アーキテクチャ・依存関係

## 系の構成

```
作業者 ──(worktree from origin/dev)──▶ feature/*
            │
            ▼ PR (--base dev)
         origin/dev ──push trigger──▶ backend-ci.deploy-staging
                                  └──▶ web-cd.deploy-staging
            │
            ▼ PR (--base main, 別タスク)
         origin/main ──push trigger──▶ backend-ci.deploy-production
                                   └──▶ web-cd.deploy-production
```

## 関連ファイルと役割

| ファイル | 役割 | 本タスクでの変更 |
|---------|------|----------------|
| `scripts/new-worktree.sh` | worktree 生成 (分岐元) | `origin/main` → `origin/dev` |
| `CLAUDE.md` | PR 作成フロー記述 | `main` → `dev` 参照に書き換え |
| `.claude/commands/ai/diff-to-pr.md` | `diff-to-pr` slash command 仕様 | sync 元・`gh pr create --base` を `dev` |
| `.github/workflows/backend-ci.yml` | dev/main CD | 変更なし (既に対応済) |
| `.github/workflows/web-cd.yml` | dev/main CD | 変更なし (既に対応済) |
| Branch protection (`origin/dev`) | force-push 制御 | 一時緩和→force-push→再保護 |

## 依存関係

- `origin/main` 最新 HEAD（同期ソース）
- GitHub Branch Protection API（admin trust）
- 既存 secrets/env: `staging` / `production` GitHub Environments（変更不要）

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

branch flow と CI/CD 依存を整理する。

## 実行タスク

構成、関連ファイル、依存関係を定義する。

## 参照資料

`references/deployment-branch-strategy.md`、`.github/workflows/`。

## 成果物

本 Phase 文書。

## 完了条件

feature → dev → main の依存境界が明確である。

## 統合テスト連携

Phase 11 の remote sync / stale command grep に接続する。
