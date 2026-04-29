# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-28 |
| 上流 | - |
| 下流 | Phase 2 (設計) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |
| タスク種別 | docs-only |

## 目的

Claude Code `settings` 階層（global / global.local / project / project.local）で prompt 復帰を防ぐ際に、`task-claude-code-permissions-apply-001` が採用すべき層配置方針を確定するための **比較設計タスクの要件と非要件** を Phase 2 着手前に固定する。

`task-claude-code-permissions-decisive-mode` Phase 3 で CONDITIONAL ACCEPT に留まった案 A（global + shell alias 強化）と案 B（project-local-first）を、4 層責務 × 5 評価軸の比較表で trade-off 化することが、本タスクの最終ゴールである。

## 真の論点

1. global / global.local / project / project.local の各層が、誰のどの判断を表現する層かを明文化できているか
2. project-local-first（案 B）単独で、新規 worktree / 新規プロジェクトでも prompt 復帰が起きないかを公式仕様または実機観測で示せるか
3. 案 A（global 変更）採用時、`scripts/cf.sh` / `op run` / 他 worktree の権限評価に副作用を与えないか
4. fresh 環境（global.local 未配置）で常時 bypass になるリスクを許容できるか
5. global 採用時の rollback 手順（差分保存・復元）を実書き換え前に確定できているか

## P50 チェック

| 項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | No | spec_created のまま、実装は `task-claude-code-permissions-apply-001` で実行 |
| upstream にマージ済みか | No | - |
| 前提タスクが完了済みか | Yes | `task-claude-code-permissions-decisive-mode` Phase 3 / 12 成果物を入力に使う |

> **本タスクは `workflow: spec_created` / `taskType: docs-only` / `visualEvidence: NON_VISUAL`**。
> コードは書かず比較設計ドキュメントのみを作成する。`implementation_mode: "new"` は将来の apply タスクが参照する。

## 現状ダンプ要件（読み取りのみ）

実値を AI コンテキストへ持ち込まないため、以下のキー名のみを記録する（`apiKey` / OAuth トークン値は記録しない）。書き換えは禁止。

| 階層 | パス | 抽出キー |
| --- | --- | --- |
| グローバル | `~/.claude/settings.json` | `defaultMode`, `permissions.allow`, `permissions.deny`, `env`（キー名のみ） |
| グローバル(local) | `~/.claude/settings.local.json` | 同上 |
| プロジェクト | `<project>/.claude/settings.json` | 同上 |
| プロジェクト(local) | `<project>/.claude/settings.local.json` | 同上 |
| シェル | `~/.zshrc` および `~/.config/zsh/conf.d/*-claude.zsh` | `cc` 関連 alias 行のみ |
| 他プロジェクト | `~/dev/**/.claude/settings.json` | `defaultMode` 明示プロジェクトの列挙（`grep` メタ情報のみ） |

## 既知の前提（ソース MD §3.1 / §3.3 抜粋）

- `task-claude-code-permissions-decisive-mode` Phase 3 / Phase 12 成果物が参照可能
- 実機（個人開発マシン）で `~/.claude/settings.json` および各プロジェクトの `.claude/settings.json` の `defaultMode` を **読み取れる** 権限がある（書き換えはしない）
- Claude Code settings の階層優先順位（global / global.local / project / project.local）の理解
- `defaultMode` / `permissions.allow` / `permissions.deny` の評価順の理解
- `--dangerously-skip-permissions` フラグの効果範囲の理解
- ホームディレクトリ配下の他 worktree / 他リポジトリ構成（`scripts/cf.sh` / 1Password `op run` 等の他プロジェクト前提機能との衝突確認）

## 要件

### 機能要件

- F-1: 4 層（global / global.local / project / project.local）の責務・優先順位・想定利用者・変更頻度・git 管理可否を 1 表に集約する設計を確定する
- F-2: project-local-first 単独での再発有無を「公式仕様引用」または「fresh プロジェクト実機観測」のいずれかで判定する手順を確定する
- F-3: 案 A / 案 B / ハイブリッド の trade-off を 5 評価軸（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動）で比較する設計を確定する
- F-4: `task-claude-code-permissions-apply-001` 指示書の参照欄に本ドキュメントを追記する依頼を Phase 12 で残す方針を確定する
- F-5: global 採用時の rollback 手順（差分保存 / 復元コマンド）を Phase 5 比較表に併記する設計を確定する

### 非機能要件

- N-1: 設計のみで完結し、実コードや実 settings ファイルを本タスクで書き換えない（spec_only）
- N-2: `.env` 実値や API token を一切ドキュメントに残さない（CLAUDE.md ルール準拠）
- N-3: 他プロジェクトへの影響を Phase 3 で評価可能な粒度で記述する
- N-4: 出典（公式 docs / 実機ログ）を比較表の各行に紐付ける
- N-5: Phase 3 シナリオ A〜D との対応を比較表で明示する

## スコープ外

- 実 `~/.claude/settings.json` / `~/.zshrc` への書き込み（→ `task-claude-code-permissions-apply-001`）
- bypass モード下の deny 実効性検証（→ `task-claude-code-permissions-deny-bypass-verification-001`）
- MCP server / hook の permission 挙動検証
- Claude Code SDK のソース変更
- CI / pre-commit hook の追加変更
- secrets 管理（`.env` / 1Password）の改修

## タスク分類

- **タスク種別**: docs-only task（spec_created）
- **UI task / docs-only**: docs-only task（NON_VISUAL）
- **証跡の主ソース**: phase-05 comparison.md（比較表本体）/ phase-12 implementation-guide / phase-11 manual-smoke-log.md

## 受入条件のドラフト

- AC-1〜AC-10 は `index.md` の AC を参照
- 本 Phase 完了条件: `outputs/phase-1/main.md` に「現状ダンプ要件（キー名のみ）」「前提条件」「機能 / 非機能要件」「スコープ外」「真の論点」が揃う

## 主成果物

- `outputs/phase-1/main.md`

## 次 Phase へのハンドオフ

- 4 層責務表の暫定列構成（階層 / パス / 想定利用者 / 変更頻度 / git 管理可否 / 担当キー）を Phase 2 の設計入力として渡す
- 5 評価軸（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動）を Phase 2 の比較軸決定の入力として渡す
- 推奨アプローチ（ソース MD §3.4）: 「案 B を default、案 A を fallback」のハイブリッドを起点に評価する旨を Phase 2 へ申し送る

## Skill 準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md`（ソース正本）

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない。
- [ ] 4 層 × 5 軸の比較骨子（列名・行名）が Phase 2 へ申し送られている。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスク（`task-claude-code-permissions-apply-001`）で実行する。ここでは手順、証跡名、リンク整合を固定する。
