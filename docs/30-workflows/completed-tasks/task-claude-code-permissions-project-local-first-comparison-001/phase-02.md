# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（4 層責務表ドラフト + 比較軸の決定） |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 |
| 下流 | Phase 3 (設計レビュー) |
| 状態 | pending |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で固定した要件のうち、F-1（4 層責務表）と F-3（5 評価軸）を **設計レベルで完成形** に近づける。本 Phase では実ファイルの書き換えは行わず、設計成果物（Markdown）のみを出力する。比較表の本体（採用案確定後の評価値入り）は Phase 5 で完成させる。

## 設計対象

### D-1: 4 層責務表のドラフト（ソース MD Phase 1）

各層が「誰のどの判断を表現する層か」を 1 表に集約する。列構成は最低でも以下とする。

| 階層 | パス（例） | 想定利用者 | 変更頻度 | git 管理可否 | 担当キー（例） |
| --- | --- | --- | --- | --- | --- |
| global | `~/.claude/settings.json` | マシン横断のオペレータ自身 | 低 | git 管理外（dotfile 個別運用） | `defaultMode`（マシン全体既定） |
| global.local | `~/.claude/settings.local.json` | 同上（local override） | 中 | git 管理外（実機固有値） | `defaultMode`（マシン上書き）/ `apiKey` 等の実値 |
| project | `<project>/.claude/settings.json` | プロジェクト共有設定 | 低 | リポジトリにコミット | `permissions.allow`/`deny`、プロジェクト共有モード |
| project.local | `<project>/.claude/settings.local.json` | プロジェクト個人 override | 中〜高 | 通常 git ignore（個別運用） | `defaultMode`（個人開発時 bypass）/ 個人秘密 |

> **手順**: 公式 docs（Claude Code settings の階層仕様）を Phase 3 で再確認し優先順位を確定。本 Phase では仮説をドラフトとして記載し、Phase 3 のレビュー対象として明示する。

### D-2: 5 評価軸の決定（ソース MD Phase 3）

比較表で採用する 5 軸を以下に固定する。

| 軸 | 定義 | スコアリング方針 |
| --- | --- | --- |
| 影響半径 | 設定変更が波及するスコープ（マシン全体 / 当該プロジェクト / 当該 worktree） | 狭いほど良。global > global.local > project > project.local の順で広い |
| 再発リスク | 新規 worktree / 新規プロジェクトで prompt 復帰が起きる可能性 | 低いほど良。`.local` を git ignore する運用と相性 |
| rollback コスト | 設定を元に戻すための手間（差分保存 / 復元コマンド数） | 低いほど良。global は dotfile バックアップ必須、project.local は file 削除のみ |
| 他プロジェクト副作用 | `scripts/cf.sh` / `op run` / 他 worktree の権限評価への影響 | 0 件が理想。global 変更時は必ず列挙が必要 |
| fresh 環境挙動 | global.local や project.local が未配置の fresh 環境での `defaultMode` 最終値 | 案ごとに「想定値」を明記し、許容可否を判定 |

### D-3: 候補案の整理（Phase 5 で評価値を埋める前提）

| 案 | 内容 | 配置層 |
| --- | --- | --- |
| A | global の `defaultMode` を `bypassPermissions` に変更 + `cc` alias に `--dangerously-skip-permissions` を追加 | global / shell |
| B | project.local のみで `bypassPermissions` を維持（global は触らない） | project.local |
| ハイブリッド | 案 B を default とし、案 A は fresh 環境補強の fallback として位置付け | project.local + global（条件付き） |

### D-4: 出典スロットの設計

比較表の各セルには出典スロットを 1 つ以上紐付ける。

- `[公式 docs: settings 階層]`
- `[公式 docs: --dangerously-skip-permissions]`
- `[実機観測: fresh プロジェクト, 2026-04-28]`
- `[Phase 3 シナリオ A / B / C / D 対応]`

## ステップ間の state 引き渡し

| 入力 (from Phase 1) | 出力 (to Phase 3) |
| --- | --- |
| 4 層列構成（階層 / 想定利用者 / 変更頻度 / git 管理可否 / 担当キー） | 4 層責務表ドラフト |
| 5 軸候補（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動） | 5 軸の正式採用 + スコアリング方針 |
| 案 A / 案 B / ハイブリッド方針 | レビュー対象として明示 |

## 主成果物

- `outputs/phase-2/main.md`（要約）
- `outputs/phase-2/layer-responsibility-table.md`（4 層責務表ドラフト）
- `outputs/phase-2/comparison-axes.md`（5 評価軸の定義とスコアリング方針）

## 次 Phase へのハンドオフ

Phase 3 で確認すべき質問:

1. 4 層の優先順位仮説は Anthropic 公式 docs と一致するか
2. project-local-first（案 B）単独で fresh プロジェクトの `defaultMode` が `bypassPermissions` を維持するか（公式 or 実機）
3. 案 A 採用時、`~/dev` 配下の他プロジェクトで `defaultMode` 明示しているリポジトリは何件あるか（grep メタ情報）
4. `--dangerously-skip-permissions` の deny 実効性が `task-claude-code-permissions-deny-bypass-verification-001` で確定しているか

## Skill 準拠補遺

## 実行タスク

- 本文に記載済みのタスクを実行単位とする。
- docs-only / spec_created の境界を維持する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`
- `artifacts.json`
- ソース MD `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` §4 Phase 1 / Phase 3

## 成果物

- `artifacts.json` の該当 Phase outputs を正本とする。

## 安全設計の優先順位

1. 第一候補: project-local settings（案 B）の最小変更で解決する。
2. 第二候補: ハイブリッド案（B を default、A を fallback）。
3. 最終候補: global settings の `defaultMode` 統一（案 A）。採用には他プロジェクト影響レビュー（Phase 3）を必須とする。
4. `--dangerously-skip-permissions` を default 案に含めるのは deny 実効性が確認できてから。

## 完了条件

- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない。
- [ ] 4 層責務表ドラフトの列構成が確定し、`layer-responsibility-table.md` 骨子が記述されている。
- [ ] 5 評価軸の定義とスコアリング方針が `comparison-axes.md` に記述されている。

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、統合テストは実装タスク（`task-claude-code-permissions-apply-001`）で実行する。ここでは手順、証跡名、リンク整合を固定する。
