# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-decisive-mode |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| 上流 | - |
| 下流 | Phase 2 (設計) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |

## 目的

Claude Code 起動時に Bypass Permissions Mode が安定しない問題について、3 層の settings 現状をダンプし、要件と非要件を Phase 2 着手前に確定する。

## 真の論点

1. 起動直後に観測されるモードと、reload 後に観測されるモードがなぜ異なるのか
2. グローバル `settings.json` の `defaultMode: "acceptEdits"` が実質的に「最終値」になる経路はどれか
3. `--permission-mode bypassPermissions` だけでは塞げない初期化フローの permission prompt が存在するか
4. グローバル設定の変更が **他プロジェクトに与える影響範囲** はどこまで広がるか
5. whitelist を保険として持たせる場合、どのコマンド群を許可リスト化するか

## P50 チェック

| 項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | No | 通常の実装 Phase（実装は別タスク） |
| upstream にマージ済みか | No | - |
| 前提タスクが完了済みか | Yes | 既存 settings 群があるためダンプのみ |

> **本タスクは `workflow: spec_created`**。コードは書かずドキュメントのみ。`implementation_mode: "new"` は将来の実装タスクが参照する。

## 現状ダンプ要件

実値を AI コンテキストへ持ち込まないため、以下のキーのみを記録する（**`apiKey` 等の値は記録しない**）。

| 階層 | パス | 抽出キー |
| --- | --- | --- |
| グローバル | `~/.claude/settings.json` | `defaultMode`, `permissions.allow`, `permissions.deny`, `env`（キー名のみ） |
| グローバル(local) | `~/.claude/settings.local.json` | 同上 |
| プロジェクト | `<project>/.claude/settings.json` | 同上 |
| シェル | `~/.zshrc` および `~/.config/zsh/conf.d/*-claude.zsh` | `cc` 関連 alias 行のみ |

## 既知の事実

| 観測 | 場所 | 値 |
| --- | --- | --- |
| `defaultMode` 不整合 | `~/.claude/settings.json:318` | `acceptEdits` |
| `defaultMode` | `~/.claude/settings.local.json:61` | `bypassPermissions` |
| `defaultMode` | `<project>/.claude/settings.json:130` | `bypassPermissions` |
| `cc` エイリアス | shell 設定 | `claude --verbose --permission-mode bypassPermissions` |

## 要件

### 機能要件

- F-1: 3 層の `defaultMode` を意図に沿って統一（または上位層から該当キーを削除し下位委譲）する設計を確定する
- F-2: `cc` エイリアスに `--dangerously-skip-permissions` を併用する設計を確定する
- F-3: `permissions.allow` / `deny` の whitelist パターンを設計する
- F-4: 階層優先順位を `docs/00-getting-started-manual/claude-code-config.md` に追記する方針を確定する

### 非機能要件

- N-1: 設計のみで完結し、実コードや実 settings は本タスクで書き換えない
- N-2: `.env` 実値や API token を一切ドキュメントに残さない
- N-3: 他プロジェクトへの影響を Phase 3 で評価可能な粒度で記述する

## スコープ外

- 実 settings ファイルへの書き込み
- `.zshrc` の実書き換え
- pre-commit / CI hook の改修
- Claude Code SDK 側の挙動変更

## タスク分類

- **タスク種別**: docs-only task（spec_created）
- **UI task / docs-only**: docs-only task（NON_VISUAL）
- **証跡の主ソース**: phase-12 implementation-guide / phase-11 manual-smoke-log.md（手動確認シナリオの記録）

## 受入条件のドラフト

- AC-1〜AC-8 は `index.md` の AC を参照
- 本 Phase 完了条件: `outputs/phase-1/main.md` に「3 層 settings ダンプ（キー名のみ）」「現状要約」「要件 / 非要件」「スコープ外」が揃う

## 主成果物

- `outputs/phase-1/main.md`

## 次 Phase へのハンドオフ

- 統一方針の暫定案（A: 全層 `bypassPermissions` / B: 上位層からキー削除し local 委譲）を Phase 2 で 1 つに絞る
- whitelist 候補コマンド群（`Bash(pnpm *)` 等）を Phase 2 設計の入力として渡す

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

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスクで実行する。ここでは手順、証跡名、リンク整合を固定する。

