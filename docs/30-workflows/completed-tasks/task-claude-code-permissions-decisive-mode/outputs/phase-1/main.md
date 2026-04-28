# Phase 1: 要件定義 — 成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | task-claude-code-permissions-decisive-mode |
| Phase | 1 / 13（要件定義） |
| 種別 | docs-only / spec_created / NON_VISUAL |
| 作成日 | 2026-04-28 |

## 1. 真の論点

1. 起動直後と reload 後で観測モードが異なる原因の特定
2. `~/.claude/settings.json` の `defaultMode: acceptEdits` が「最終値」となる経路の有無
3. `--permission-mode bypassPermissions` のみで塞げない初期化中 prompt の有無
4. グローバル設定変更が他プロジェクトへ与える波及範囲
5. whitelist で許可・拒否すべきコマンド群の確定

## 2. 3 層 settings ダンプ（キー名のみ・実値非記録）

`.env`・API token・OAuth トークン・モデルキー・URL は一切記録しない。**キー名と行番号のみ**を記録する。

### 2.1 グローバル: `~/.claude/settings.json`

| キー | 行 | 値の種別 |
| --- | --- | --- |
| `defaultMode` | 318 | `acceptEdits`（既知の不整合） |
| `permissions.allow` | 未記録 | 配列（実値非記録） |
| `permissions.deny` | 未記録 | 配列（実値非記録） |
| `env` | 未記録 | キー名のみ把握（値は非記録） |

### 2.2 グローバル(local): `~/.claude/settings.local.json`

| キー | 行 | 値の種別 |
| --- | --- | --- |
| `defaultMode` | 61 | `bypassPermissions` |
| `permissions.allow` | 未記録 | 配列（実値非記録） |
| `permissions.deny` | 未記録 | 配列（実値非記録） |
| `env` | 未記録 | キー名のみ |

### 2.3 プロジェクト: `<project>/.claude/settings.json`

| キー | 行 | 値の種別 |
| --- | --- | --- |
| `defaultMode` | 130 | `bypassPermissions` |
| `permissions.allow` | 未記録 | 配列（実値非記録） |
| `permissions.deny` | 未記録 | 配列（実値非記録） |
| `env` | 未記録 | キー名のみ |

### 2.4 シェル alias

| 項目 | 値 |
| --- | --- |
| 定義場所 | `~/.zshrc` または `~/.config/zsh/conf.d/<n>-claude.zsh`（実ファイル名は本タスクで非確定） |
| 現在の alias | `alias cc='claude --verbose --permission-mode bypassPermissions'` |

## 3. 現状要約

- 3 層のうち最上位（global 本体）のみ `acceptEdits`、それ以外は `bypassPermissions`
- 仮説の階層解決順は「project.local > project > global.local > global」
- 仮説どおりなら最終値は `bypassPermissions` で安定するはずだが、初期化中に上位値を一時参照する経路がある可能性
- alias は session モードのみ指定し、起動初期化中の prompt 経路は塞げていない

## 4. 要件

### 機能要件

- F-1: 3 層の `defaultMode` を **案 A（全層 `bypassPermissions` 統一）** で揃える設計を確定する
- F-2: `cc` alias に `--dangerously-skip-permissions` を併用する設計を確定する（実 deny の実効性は Phase 3 blocker）
- F-3: `permissions.allow` / `deny` の whitelist パターンを project 層に整備する設計を確定する
- F-4: 階層優先順位の説明を `docs/00-getting-started-manual/claude-code-config.md` へ追記する方針を Phase 12 に渡す

### 非機能要件

- N-1: 設計のみで完結し、実 settings ファイル / `.zshrc` を本タスクで書き換えない
- N-2: `.env` / API token / OAuth token / 機密値をドキュメントへ転記しない
- N-3: 他プロジェクトへの波及を Phase 3 で評価できる粒度で記述する
- N-4: 各成果物は 250 行以内（QA 基準）

## 5. スコープ外

- 実 `~/.claude/settings.json` / `~/.claude/settings.local.json` への書き込み
- 実 `<project>/.claude/settings.json` への書き込み
- 実 `~/.zshrc` または zsh fragment への書き込み
- pre-commit / CI hook の改修
- Claude Code SDK 側の挙動変更
- secrets 管理（1Password / Cloudflare Secrets）改修

## 6. 制約事項

- `.env` を Read / cat 禁止（CLAUDE.md ルール）
- `wrangler` 直接実行禁止（`scripts/cf.sh` 経由）
- グローバル設定変更は他プロジェクトに silent 波及するため Phase 3 で必ず影響評価する
- `--dangerously-skip-permissions` と `permissions.deny` の相互作用が未確認の場合、Phase 3 で blocker 扱いとする

## 7. 採用方針サマリ（Phase 2 への入力）

| 項目 | 採用 |
| --- | --- |
| settings 統一案 | 案 A（全層 `bypassPermissions`） |
| alias 強化 | `--dangerously-skip-permissions` 併用 |
| whitelist 配置層 | project 層を主正本（global は不変更） |
| 代替案 B（上位層キー削除＋local 委譲） | Phase 3 で波及許容不可と判定された場合のフォールバック |

## 8. whitelist 候補（Phase 2 入力）

### allow

- `Bash(pnpm *)`, `Bash(mise *)`, `Bash(git *)`, `Bash(gh *)`, `Bash(node *)`, `Bash(bash scripts/cf.sh *)`
- `Read(*)`, `Edit(*)`, `Write(*)`

### deny

- `Bash(rm -rf /*)`, `Bash(rm -rf ~/*)`
- `Bash(git push --force origin main)`, `Bash(git push --force origin master)`
- `Bash(wrangler *)`
- `Read(.env)`

## 9. 受入条件（本 Phase の完了条件）

- [x] 3 層 settings ダンプ（キー名のみ）が記録された
- [x] 現状要約が記録された
- [x] 要件 / 非要件が分離された
- [x] スコープ外が明文化された
- [x] Phase 2 への入力（採用案 + whitelist 候補）が確定した

## 10. ハンドオフ

- Phase 2 へ: 案 A 採用前提で diff レベルの完全形を作る
- Phase 3 へ: 案 A 維持の Go/No-Go 判定の入力として、本 main.md と Phase 2 設計を参照
