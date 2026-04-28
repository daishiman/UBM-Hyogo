# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 |
| 下流 | Phase 3 (設計レビュー) |
| 状態 | pending |

## 目的

Phase 1 で固定した要件に基づき、E-1 / E-2 / E-3 の **完全形**（diff レベル）を設計する。本 Phase では実ファイルを書き換えず、設計成果物（Markdown）のみを出力する。

## E-1: settings 階層の `defaultMode` 統一設計

### 階層優先順位（仮説）

```
project/.claude/settings.local.json   ← 最優先
project/.claude/settings.json
~/.claude/settings.local.json
~/.claude/settings.json               ← 最下位
```

> 実挙動の最終確定は Phase 3 レビューで Anthropic 公式ドキュメントを再確認する。

### 採用案（A）: 全層 `bypassPermissions` 統一

| ファイル | Before | After |
| --- | --- | --- |
| `~/.claude/settings.json` | `"defaultMode": "acceptEdits"` | `"defaultMode": "bypassPermissions"` |
| `~/.claude/settings.local.json` | `"defaultMode": "bypassPermissions"` | （変更なし） |
| `<project>/.claude/settings.json` | `"defaultMode": "bypassPermissions"` | （変更なし） |

### 代替案（B）: 上位層からキー削除し local 委譲

| ファイル | After |
| --- | --- |
| `~/.claude/settings.json` | `defaultMode` キー **削除**（local が値を持つ） |
| `~/.claude/settings.local.json` | `"defaultMode": "bypassPermissions"`（変更なし） |
| `<project>/.claude/settings.json` | `"defaultMode": "bypassPermissions"`（変更なし） |

> **採用判定**: 案 A を採用（全層明示の方が「どの値が効いているか」を後から読めるため）。
> Phase 3 で他プロジェクトへの波及を再評価し、波及が許容できない場合は案 B にフォールバック。

### 出力先

`outputs/phase-2/settings-diff.md` に before / after を完全形で記載（実値の `apiKey` 等は記述しない）。

## E-2: `cc` エイリアス書き換え設計

### Before

```zsh
alias cc='claude --verbose --permission-mode bypassPermissions'
```

### After

```zsh
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

### 設計理由

- `--permission-mode bypassPermissions` は **session 内** モード設定。起動初期化中の prompt は別経路で発火し得る
- `--dangerously-skip-permissions` は permission チェック自体をスキップする
- 両者併用で「起動瞬間から bypass」を確定的に保証

### 副作用と運用注意

- セキュリティ警告がスキップされる。誤って destructive コマンドを実行するリスクが上がる
- `permissions.deny` で破壊的コマンドを必ず塞ぐ（E-3 で担保）
- 対象 alias は **個人開発環境** のみ。共有 / 本番運用環境では使わない方針を明記

### 出力先

`outputs/phase-2/alias-diff.md`

## E-3: permissions whitelist 整理

### `permissions.allow` 設計

| パターン | 用途 |
| --- | --- |
| `Bash(pnpm *)` | パッケージ管理 / build / test |
| `Bash(mise *)` | Node 24 / pnpm 10 ランタイム切替 |
| `Bash(git *)` | バージョン管理（push / force 系は deny で塞ぐ） |
| `Bash(gh *)` | GitHub CLI |
| `Bash(node *)` | スクリプト実行 |
| `Bash(bash scripts/cf.sh *)` | Cloudflare ラッパー（直接 wrangler は不可） |
| `Read(*)` | プロジェクトファイル読込 |
| `Edit(*)` | プロジェクトファイル編集 |
| `Write(*)` | プロジェクトファイル作成 |

### `permissions.deny` 設計

| パターン | 理由 |
| --- | --- |
| `Bash(rm -rf /*)` | 破壊操作 |
| `Bash(rm -rf ~/*)` | 破壊操作 |
| `Bash(git push --force origin main)` | main へのリスクある push |
| `Bash(git push --force origin master)` | 同上 |
| `Bash(wrangler *)` | `scripts/cf.sh` 経由ルール準拠 |
| `Read(.env)` | secrets 混入防止（CLAUDE.md ルール） |

### 配置層

- `<project>/.claude/settings.json` の `permissions` を主正本とする
- `~/.claude/settings.json` 側は **既存定義に追記しない**（他プロジェクトへの波及を最小化）

### 出力先

`outputs/phase-2/whitelist-design.md`

## ステップ間の state 引き渡し

| 入力 (from Phase 1) | 出力 (to Phase 3) |
| --- | --- |
| 3 層 settings ダンプ | 統一後の完全形 diff |
| 既存 alias 行 | 書き換え diff |
| whitelist 候補 | allow / deny 完全形 |
| 階層優先順位の仮説 | レビュー対象として明示 |

## 主成果物

- `outputs/phase-2/main.md`（要約）
- `outputs/phase-2/settings-diff.md`
- `outputs/phase-2/alias-diff.md`
- `outputs/phase-2/whitelist-design.md`

## 次 Phase へのハンドオフ

Phase 3 で確認すべき質問:

1. グローバル `~/.claude/settings.json` の `defaultMode` 変更は他プロジェクト（特に `permissions` がプロジェクト未定義のケース）にどう波及するか
2. `--dangerously-skip-permissions` は MCP server / hook 起動時の permission を含めて完全にスキップするか
3. whitelist の `Edit(*)` / `Write(*)` は project 内に限定する書き方ができるか

## Skill準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 安全設計の優先順位

1. 第一候補: project-local settings と `cc` alias の最小変更で解決する。
2. 第二候補: global.local settings を使い、global settings 本体の変更を避ける。
3. 最終候補: global settings の `defaultMode` 統一。採用には他プロジェクト影響レビューを必須とする。
4. `--dangerously-skip-permissions` は deny rule の実効性が確認できるまで既定案にしない。

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。
