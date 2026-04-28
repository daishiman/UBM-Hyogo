# Claude Code 設定リファレンス

このプロジェクトにおける Claude Code の設定・権限・ワークフローの正本。

---

## 設定ファイル場所

| ファイル | 役割 |
|---------|------|
| `CLAUDE.md` (プロジェクトルート) | Claude Code が自動読み込みするプロジェクト基準仕様 |
| `.claude/settings.json` | プロジェクト共通の権限・MCP サーバー・出力スタイルの設定 |
| `.claude/settings.local.json` | プロジェクト個人用の上書き設定（存在しない場合は作成しない） |
| `~/.claude/settings.json` | グローバル Claude Code 設定（全プロジェクト共通） |
| `~/.claude/CLAUDE.md` | グローバル Claude Code 設定（全プロジェクト共通） |

---

## 出力言語

```json
"outputStyle": "日本語。thinkingモードも含めて、すべての処理・思考プロセスも含めて日本語を使うこと。"
```

すべての出力（thinking モード含む）は日本語で行う。

---

## 権限モード

```json
"permissions": {
  "defaultMode": "bypassPermissions"
}
```

`defaultMode` は root 直下ではなく `permissions.defaultMode` に置く。よく使うコマンドは事前に allow リスト登録済み。新規コマンドの追加は `update-config` スキルを使う。

### 設定階層

Claude Code settings は上位のファイルが下位を上書きする。

```
project/.claude/settings.local.json
  > project/.claude/settings.json
    > ~/.claude/settings.local.json
      > ~/.claude/settings.json
```

`settings.local.json` が存在しない場合は N/A として扱い、明示的な上書きが必要になるまで作成しない。

### allow（主要なもの）

```
git, gh, pnpm, npm, npx, node
find, grep, cat, ls, echo, sed, awk, head, tail, wc, sort, uniq
mv, cp, mkdir, chmod, tree, open
pm2, tmux, bash, zsh, sh
pandoc, playwright, claude
python, python3, pip, pip3
brew, zip, unzip, tar
```

### ask（実行前に確認が必要）

```
rm -rf:*
sudo:*
chown:*
```

### deny（常に禁止）

```
rm -rf /:*
rm -rf ~:*
rm -rf /Users:*
curl * | bash
curl * | sh
wget * | bash
wget * | sh
~/.ssh/**
~/.aws/**
~/.gnupg/**
**/.env
**/.env.*
**/secrets/**
```

---

## MCP サーバー

`.claude/settings.local.json` の `mcpServers` セクションで定義。

| サーバー名 | 用途 | 起動方法 |
|-----------|------|---------|
| `desktop-commander` | デスクトップ操作補助 | `npx @wonderwhy-er/desktop-commander@latest` |
| `arxiv-mcp-server` | 論文検索・取得 | `uv tool run arxiv-mcp-server` |
| `pdf-agent` | PDF 解析 | Node.js スクリプト |
| `mcp-pdf-reader` | PDF 読み取り | `uvx mcp_pdf_reader` |
| `claude_ai_Google_Drive` | Google Drive 操作 | Claude.ai 統合 MCP |

---

## 利用可能スキル

`/スキル名` または Skill ツールで呼び出す。

| スキル | 用途 |
|-------|------|
| `task-specification-creator` | タスク仕様書生成（Phase 1-13 フォーマット） |
| `aiworkflow-requirements` | 正本仕様の検索・参照・更新 |
| `github-issue-manager` | GitHub Issue 管理・タスク仕様書との連携 |
| `skill-creator` | スキルの作成・更新 |
| `ai:diff-to-pr` | 差分 → PR 作成の完全自動化ワークフロー |
| `claude-agent-sdk` | Claude Agent SDK 実装支援 |
| `int-test-skill` | Vitest 統合テスト設計支援 |
| `update-config` | settings.json の権限・フック設定変更 |
| `review` | PR レビュー |
| `security-review` | セキュリティレビュー |
| `simplify` | コード品質改善 |

---

## タスク実行フロー

```
1. 要件確認
   -> doc/00-getting-started-manual/specs/ で仕様を確認
   -> aiworkflow-requirements スキルで詳細検索

2. タスク仕様書生成
   -> task-specification-creator スキルで Phase 1-13 仕様書を生成
   -> doc/01-infrastructure-setup/ 以下に配置

3. 実装
   -> feature/* ブランチで作業
   -> pnpm typecheck && pnpm lint && pnpm test で品質確認

4. PR 作成
   -> ai:diff-to-pr スキルで PR を作成
   -> feature/* → dev → main の順にマージ

5. Issue 連携
   -> github-issue-manager スキルで Issue との同期
```

---

## プロジェクト固有の設定補足

`cc` alias は zsh の conf.d 経路で管理する。

```zsh
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

正本配置先は `~/.config/zsh/conf.d/79-aliases-tools.zsh`。`~/.zshrc` は conf.d ファイルを source する入口として扱い、alias を直書きしない。

注意: `--dangerously-skip-permissions` と広い allow 設定は利便性を上げる一方で、破壊的操作の確認機会を減らす。`permissions.deny` が bypass 下でどこまで実効するかは継続検証対象のため、`rm` 系、`git push --force` 系、secret 読み取り系は deny / ask 側で明示し、allow の最小化を継続課題として管理する。

---

## 設定変更方法

権限や MCP サーバーを追加・変更する場合は `update-config` スキルを使う。
直接 `settings.local.json` を編集しても構わないが、変更内容はこのドキュメントにも反映すること。
