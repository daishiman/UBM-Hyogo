# whitelist-design: `permissions.allow` / `permissions.deny` 設計

## 配置層

- 主正本: `<project>/.claude/settings.json` の `permissions.allow` / `permissions.deny`
- `~/.claude/settings.json`（global 本体）には **追記しない**（他プロジェクトへの silent 波及防止）
- `~/.claude/settings.local.json` への追記も本タスクでは行わない

## allow リスト

| パターン | 用途 | 補足 |
| --- | --- | --- |
| `Bash(pnpm *)` | パッケージ管理 / build / typecheck / lint / test | monorepo 全コマンド |
| `Bash(mise *)` | Node 24 / pnpm 10 ランタイム切替 | `mise install` / `mise exec` 等 |
| `Bash(git *)` | バージョン管理 | force push 系は deny で塞ぐ |
| `Bash(gh *)` | GitHub CLI（issue / PR / API） | - |
| `Bash(node *)` | スクリプト直接実行 | - |
| `Bash(bash scripts/cf.sh *)` | Cloudflare ラッパー | wrangler 直接実行は禁止（CLAUDE.md ルール） |
| `Read(*)` | プロジェクトファイル読込 | `.env` は deny で個別塞ぎ |
| `Edit(*)` | プロジェクトファイル編集 | - |
| `Write(*)` | プロジェクトファイル作成 | - |

### JSON 表現（参考）

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm *)",
      "Bash(mise *)",
      "Bash(git *)",
      "Bash(gh *)",
      "Bash(node *)",
      "Bash(bash scripts/cf.sh *)",
      "Read(*)",
      "Edit(*)",
      "Write(*)"
    ]
  }
}
```

## deny リスト

| パターン | 理由 |
| --- | --- |
| `Bash(rm -rf /*)` | ルート以下の破壊操作を絶対禁止 |
| `Bash(rm -rf ~/*)` | ホーム直下の破壊操作を絶対禁止 |
| `Bash(git push --force origin main)` | main への強制 push 禁止（ブランチ戦略違反） |
| `Bash(git push --force origin master)` | 同上（master 命名のリポジトリにも対応） |
| `Bash(wrangler *)` | `scripts/cf.sh` 経由ルール準拠（CLAUDE.md / MEMORY.md） |
| `Read(.env)` | 平文 secret 読込防止（CLAUDE.md ルール） |

### JSON 表現（参考）

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf /*)",
      "Bash(rm -rf ~/*)",
      "Bash(git push --force origin main)",
      "Bash(git push --force origin master)",
      "Bash(wrangler *)",
      "Read(.env)"
    ]
  }
}
```

## 設計上の注意点

### `Bash(wrangler *)` deny と `scripts/cf.sh` の整合

- `scripts/cf.sh` 内部で wrangler バイナリを呼び出すが、これは shell プロセス内で完結し Claude の Bash tool 呼び出しではない
- したがって `Bash(bash scripts/cf.sh *)` allow と `Bash(wrangler *)` deny は両立する
- Claude が直接 `wrangler ...` を Bash tool で呼ぶ経路だけがブロックされる

### `Read(*)` allow + `Read(.env)` deny

- deny は allow より優先される前提
- `.env*` 系（`.env.local` 等）は別途 `Read(.env*)` 等への拡張余地あり（本タスクでは `Read(.env)` のみ確定、拡張は実装タスクで判定）

### `Edit(*)` / `Write(*)` のスコープ限定

- 現時点では project-wide。`Edit(./apps/**)` 等の path 限定構文は Phase 3 R-3 で公式仕様確認後に拡張可否を判断
- 確認結果次第で whitelist 案を絞り込む

## 既存 `permissions` との衝突確認

- 本タスクは設計のみのため、実 `<project>/.claude/settings.json` の既存 allow / deny を grep で重複チェックするのは Phase 3 R-3 の役割
- 衝突があった場合の解消方針: 既存 allow が本設計の allow を包含する場合は本設計を削除、矛盾する場合は既存側を再評価

## Phase 3 への確認質問

1. `--dangerously-skip-permissions` 適用時に `deny` リストは実効するか
2. allow / deny の評価順は「deny 優先」で確定しているか
3. `Edit(<glob>)` / `Write(<glob>)` で path 限定が公式に許容される構文は何か

## 実装タスクへの引き継ぎ事項

- 本ファイルは設計のみ。実 `<project>/.claude/settings.json` の `permissions` への書き込みは別実装タスク
- 実装時は既存 `permissions.allow` / `deny` の重複・衝突チェックを最初に行うこと
- 実装後は Phase 4 のテストシナリオに沿って、deny リスト各パターンが期待通り blocked されることを確認
