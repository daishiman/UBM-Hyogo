# Phase 2 Output: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 2 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 1 |
| 下流 | Phase 3（設計レビュー） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. 結論サマリ

Phase 1 で確定した F-1（4 層責務表）と F-3（5 評価軸）を設計レベルで完成形に近づけ、Phase 5 で評価値を埋めるための骨子を確定した。本 Phase では実ファイルの書き換えを一切行わず、設計成果物（Markdown）のみを出力する。

設計の成果物は以下に分割した:

- `layer-responsibility-table.md` — D-1 4 層責務表ドラフト
- `comparison-axes.md` — D-2 5 評価軸の定義とスコアリング方針

## 1. 設計対象の確定

### D-1: 4 層責務表のドラフト

4 層（global / global.local / project / project.local）について、列構成を以下に確定した。詳細は `layer-responsibility-table.md` を参照。

- 階層 / パス / 想定利用者 / 変更頻度 / git 管理可否 / 担当キー
- 評価順序: `global → global.local → project → project.local`
- 勝ち優先順位: `project.local > project > global.local > global`

### D-2: 5 評価軸の決定

| 軸 | 定義（要旨） |
| --- | --- |
| 影響半径 | 設定変更が波及するスコープ |
| 再発リスク | 新規 worktree / 新規プロジェクトでの prompt 復帰確率 |
| rollback コスト | 復元手順の難易度 / 復元コマンド数 |
| 他プロジェクト副作用 | `scripts/cf.sh` / `op run` / 他 worktree への影響 |
| fresh 環境挙動 | local 系未配置の fresh 環境での `defaultMode` 最終値 |

詳細は `comparison-axes.md` を参照。

### D-3: 候補案の整理（Phase 5 で評価値を埋める）

| 案 | 内容 | 配置層 |
| --- | --- | --- |
| A | global の `defaultMode` を `bypassPermissions` に変更 + `cc` alias に `--dangerously-skip-permissions` を追加 | global / shell |
| B | project.local のみで `bypassPermissions` を維持（global は触らない） | project.local |
| ハイブリッド | 案 B を default、案 A を fresh 環境補強の fallback | project.local + global（条件付き） |

### D-4: 出典スロットの設計

比較表の各セルには以下の出典スロットを 1 つ以上紐付ける:

- `[公式 docs: settings 階層]`
- `[公式 docs: --dangerously-skip-permissions]`
- `[実機観測: fresh プロジェクト, 2026-04-28]`
- `[Phase 3 シナリオ A / B / C / D 対応]`

## 2. 安全設計の優先順位

1. 第一候補: project-local settings（案 B）の最小変更で解決する
2. 第二候補: ハイブリッド案（B を default、A を fallback）
3. 最終候補: global settings の `defaultMode` 統一（案 A）。採用には Phase 3 影響レビューを必須とする
4. `--dangerously-skip-permissions` を default 案に含めるのは、`task-claude-code-permissions-deny-bypass-verification-001` で deny 実効性が確認できてから

## 3. ステップ間の state 引き渡し

| 入力 (from Phase 1) | 出力 (to Phase 3) |
| --- | --- |
| 4 層列構成（階層 / 想定利用者 / 変更頻度 / git 管理可否 / 担当キー） | 4 層責務表ドラフト（`layer-responsibility-table.md`） |
| 5 軸候補（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動） | 5 軸の正式採用 + スコアリング方針（`comparison-axes.md`） |
| 案 A / 案 B / ハイブリッド方針 | レビュー対象として明示 |

## 4. 残課題（Phase 3 で確認）

1. 4 層の優先順位仮説は Anthropic 公式 docs と一致するか
2. project-local-first（案 B）単独で fresh プロジェクトの `defaultMode` が `bypassPermissions` を維持するか（公式 or 実機観測）
3. 案 A 採用時、`~/dev` 配下の他プロジェクトで `defaultMode` 明示しているリポジトリは何件あるか（grep メタ情報のみ）
4. `--dangerously-skip-permissions` の deny 実効性が `task-claude-code-permissions-deny-bypass-verification-001` で確定しているか

## 5. 完了条件チェック

- [x] 4 層責務表ドラフトの列構成を確定し `layer-responsibility-table.md` に記述
- [x] 5 評価軸の定義とスコアリング方針を `comparison-axes.md` に記述
- [x] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 6. 次 Phase へのハンドオフ

- 4 層責務表ドラフトを Phase 3 R-1 のレビュー対象として渡す
- 5 軸スコアリング方針を Phase 5 比較表本体の枠組みとして固定
- 「B を default、A を fallback」のハイブリッドを起点に評価する旨を申し送り
- Phase 3 R-2（再発判定）と R-3（影響分析）の合否によって採用案順位が変わる旨を明示

## 7. 参照資料

- `phase-02.md`（本 Phase 仕様）
- `outputs/phase-1/main.md`
- `.claude/skills/aiworkflow-requirements/references/claude-code-settings-hierarchy.md`
- `docs/30-workflows/completed-tasks/task-claude-code-permissions-decisive-mode/outputs/phase-3/`
