# CODEOWNERS

このファイルは `.github/CODEOWNERS` に配置する内容を定義する。

## 本文

```
# Global fallback
*                   @daishiman

# Infrastructure docs (Wave 1 parallel tasks)
doc/01a-*/          @daishiman
doc/01b-*/          @daishiman
doc/01c-*/          @daishiman

# GitHub governance files
.github/            @daishiman
```

## 設計根拠

| パターン | 担当 | 理由 |
| --- | --- | --- |
| `*` | @daishiman | 1名プロジェクトのグローバルフォールバック |
| `doc/01a-*/` | @daishiman | 本タスク（github-and-branch-governance）の担当ディレクトリ |
| `doc/01b-*/` | @daishiman | 並列タスク（cloudflare-base-bootstrap）の担当ディレクトリ |
| `doc/01c-*/` | @daishiman | 並列タスク（google-workspace-bootstrap）の担当ディレクトリ |
| `.github/` | @daishiman | PR template / CODEOWNERS 等の GitHub 設定ファイル |

## AC-4 準拠確認

- `doc/01a-*/`、`doc/01b-*/`、`doc/01c-*/` はパスが完全に分離されており、責務衝突なし
- Wave 1 並列タスク間（01a / 01b / 01c）での CODEOWNERS 衝突なし

## 配置手順

1. リポジトリルートで `.github/` ディレクトリを作成（未存在の場合）
2. `.github/CODEOWNERS` ファイルを作成し、本文の内容を貼り付ける
3. branch protection が有効な場合は PR 経由でマージする
