# scripts/new-worktree.sh への .claude/settings.local.json テンプレート組込み - タスク指示書

## メタ情報

| 項目         | 内容                                                              |
| ------------ | ----------------------------------------------------------------- |
| タスクID     | task-new-worktree-claude-settings-template-001                    |
| タスク名     | scripts/new-worktree.sh への .claude/settings.local.json テンプレ配置組込み |
| 分類         | 改善                                                              |
| 対象機能     | worktree 起動時の Claude Code 権限初期化                          |
| 優先度       | 中                                                                |
| 見積もり規模 | 小規模                                                            |
| ステータス   | 未実施                                                            |
| 発見元       | task-claude-code-permissions-project-local-first-comparison-001 Phase 5 / Phase 12 |
| 発見日       | 2026-04-28                                                        |
| 関連 Issue   | 起票予定（github-issue-manager で追加）                           |
| visualEvidence | NON_VISUAL                                                      |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-project-local-first-comparison-001` の Phase 5 比較で採用された方針は **ハイブリッド（B を default、A は fallback）** で、`<project>/.claude/settings.local.json` を 1 次の `defaultMode: bypassPermissions` 担当とする。これにより worktree ごと・プロジェクトごとに設定が独立し、global 変更による他プロジェクト副作用を回避できる。

しかし `scripts/new-worktree.sh` で worktree を新規作成した直後、`.claude/settings.local.json` が存在しないため、初回 `claude` 起動時に prompt 復帰（permission 確認のループ）が再発する。Phase 5 比較表の re-occurrence リスクで「project-local-first を選んだ後、新規 worktree で再発が頻発」が中リスクとして列挙されており、対策候補として「テンプレート `.claude/settings.local.json` を `scripts/new-worktree.sh` に組み込む」が明示されている。

### 1.2 問題点・課題

- 新規 worktree 作成のたびに `.claude/settings.local.json` を手動コピーしないと bypass が効かない
- 手動コピーを忘れると global にフォールバックし、想定外の prompt 確認が発生する（Phase 5 比較表 §6 の再発リスク）
- テンプレートの正本がどこにあるべきか（リポジトリ管理 vs gitignore）が未決
- apply タスク（`task-claude-code-permissions-apply-001`）の採用案次第でテンプレ内容が変わる可能性があり、apply 完了前は spec 未確定

### 1.3 放置した場合の影響

- 並列 worktree 開発で初回起動時の prompt 復帰が頻発し、Claude Code の bypassPermissions 運用が形骸化する
- ハイブリッド案の前提（project.local が常に存在する）が崩れ、global fallback に依存する場面が増えて Phase 5 採用案の意図が壊れる
- 開発者が個別に対応するため、worktree ごとに `.claude/settings.local.json` の内容が乖離するリスク

---

## 2. 何を達成するか（What）

### 2.1 目的

`scripts/new-worktree.sh` 実行時に `.claude/settings.local.json` のテンプレートを worktree 内へ自動配置し、project-local-first 方針が新規 worktree でも初回から有効になる状態を作る。

### 2.2 最終ゴール

- `bash scripts/new-worktree.sh feat/foo` 実行直後、`.worktrees/<name>/.claude/settings.local.json` に bypass 用テンプレが配置されている
- テンプレート正本の保管場所（例: `scripts/templates/claude-settings-local.json` または `.claude/settings.local.example.json`）が決まり、`.gitignore` 取り扱いが明確
- apply タスク採用案（global vs project.local の責務分担）と整合し、二重定義による衝突がない
- runbook（CLAUDE.md または `doc/00-getting-started-manual/`）にテンプレ更新手順が記載

### 2.3 スコープ

#### 含むもの

- `scripts/new-worktree.sh` の改修設計（テンプレ配置ステップ追加）
- テンプレート正本の保管場所と `.gitignore` 方針
- bypass キーの最小内容（`defaultMode` のみ / `permissions` も含めるか）の決定
- apply タスク採用案との整合性確認
- runbook 追記

#### 含まないもの

- 実 `~/.claude/settings.json` / `~/.zshrc` の書き換え（`task-claude-code-permissions-apply-001` で実施）
- `--dangerously-skip-permissions` の deny 実効性検証（`task-claude-code-permissions-deny-bypass-verification-001` で実施）
- MCP server / hook の permission 挙動検証（`task-mcp-hook-permission-behavior-verification-001` で実施）

### 2.4 成果物

- `scripts/new-worktree.sh` 改修差分
- テンプレ正本ファイル（パス確定後）
- `.gitignore` 差分（必要時）
- runbook 追記差分（CLAUDE.md or `doc/00-getting-started-manual/`）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-apply-001` の採用案が確定し、project.local が bypass の 1 次担当であることが apply 後の実 settings に反映されていること
- ハイブリッド案の責務分担（global は最低限の deny のみ、project.local が `defaultMode` を担当）が apply 後も維持されていること

### 3.2 実装方針（案）

1. テンプレ正本を `scripts/templates/claude-settings-local.example.json` に配置（リポジトリ管理）
2. `scripts/new-worktree.sh` 末尾で `mkdir -p .worktrees/<name>/.claude && cp scripts/templates/claude-settings-local.example.json .worktrees/<name>/.claude/settings.local.json` 相当の処理を追加
3. `.worktrees/*/.claude/settings.local.json` は `.gitignore` 対象（既存の worktree 全体除外で吸収可否を確認）
4. テンプレ更新時は正本のみ修正し、既存 worktree への波及は手動の旨を runbook に明記

### 3.3 想定される苦戦箇所（次回への引き継ぎ）

- **bypass キーの粒度**: `defaultMode: bypassPermissions` だけで足りるか、`permissions.allow` / `permissions.deny` も同梱すべきかは apply タスクの採用案次第。先行して網羅的に書くと apply 後に二重メンテになる
- **既存 worktree への遡及**: `new-worktree.sh` は新規作成時しか走らない。既存 worktree への一括適用スクリプトを別途用意するか、手動運用に留めるかは運用負荷次第
- **テンプレ drift 検知**: 正本テンプレと各 worktree の実体が乖離した場合の検知方法（CI gate / lefthook hook / 単純にドキュメント記載）の選択
- **secret 混入リスク**: テンプレに環境変数や API token を書かない運用ルールの明文化（CLAUDE.md「ローカル `.env` の運用ルール」と整合させる）

### 3.4 受入条件 (AC)

- AC-1: `bash scripts/new-worktree.sh <branch>` 実行直後、`.worktrees/<name>/.claude/settings.local.json` が配置されている
- AC-2: 配置直後の `claude` 起動で prompt 復帰が発生しない（手動 smoke）
- AC-3: テンプレ正本のパスが決定し、リポジトリ管理 / gitignore の方針が明文化
- AC-4: apply タスクの採用案と二重定義による衝突がない
- AC-5: runbook に正本更新手順と既存 worktree への波及方針が追記されている

---

## 4. 関連タスク

| タスクID | 関係 |
| --- | --- |
| task-claude-code-permissions-project-local-first-comparison-001 | 起票元（Phase 5 / Phase 12） |
| task-claude-code-permissions-apply-001 | 前提（採用案の実 settings 反映） |
| task-claude-code-permissions-deny-bypass-verification-001 | 並行（deny 実効性検証） |
| task-claude-code-mcp-hook-permission-verification-001 | 並行（Issue #167 既存） |

## 5. 参照資料

- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-5/comparison.md`（採用案 + 再発リスク §6）
- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-12/unassigned-task-detection.md`（候補 #3）
- `scripts/new-worktree.sh`（改修対象）
- `CLAUDE.md`（worktree 作成手順 / シークレット管理）
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`（4 層階層仕様）

## 6. 苦戦箇所（将来の同種タスクへの知見）

本未タスクの仕様化過程で気付いた事項:

- **採用案依存の連鎖**: テンプレ内容は apply タスクの採用案 (A/B/ハイブリッド) に依存するため、apply 完了前にテンプレ実体を確定するとリワークが発生する。`spec_only` で起票し、apply 完了をトリガに実装着手するのが安全。
- **worktree 全体除外と個別ファイル管理の干渉**: `.gitignore` で `.worktrees/` 全体を除外している場合、テンプレ正本を worktree 配下に置くと git 管理から外れる。正本は `scripts/templates/` 等の git 管理ディレクトリに置くのが衝突回避になる。
- **「テンプレ配置」と「実 settings 書換」の境界**: 本タスクは worktree のみが対象で global 設定は触らない。apply タスクとスコープが混ざらないよう「project.local の自動配置」のみに責務を限定する。
