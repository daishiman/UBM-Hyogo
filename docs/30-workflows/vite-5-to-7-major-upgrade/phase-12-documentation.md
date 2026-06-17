# Phase 12: Documentation（ドキュメント更新）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vite-5-to-7-major-upgrade |
| 前提 | phase-11-manual-test.md（代替証跡の採取計画固定） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| workflow_state | `implemented_local_evidence_captured` |
| 目的 | アップグレード結果のドキュメント化と、後続が参照可能な strict 7 成果物の整備 |

## strict 7 成果物（全て `outputs/phase-12/` に出力）

Phase 12 で **以下 7 成果物を必ず作成** し、すべて `outputs/phase-12/` 配下へ出力する。0 件・N/A 判定でもファイルは出力する（省略禁止）。

> 本サイクルで Vite 5→7 upgrade を実装したため、`outputs/phase-12/` は実装結果（package.json / lockfile 差分、local validation、Phase 11 evidence）を正本として記録する。

### 成果物 0: `main.md`

- Phase 12 の本体 entry point。
- workflow_state（`implemented_local_evidence_captured`）、taskType（`implementation`）、visualEvidence（`NON_VISUAL`）、strict 7 の実在一覧、実装とユーザーゲートの境界を明記する。
- `main.md` が欠落している場合、他 6 ファイルがあっても Phase 12 compliance は FAIL とする。

### 成果物 1: `implementation-guide.md`

| 構成 | 必須要件 |
| --- | --- |
| Part 1（中学生レベルの概念説明） | 専門用語を使わず、日常の例え話を必須とする。例:「テストの自動チェック道具 Vite を古い型 5 から新しい型 7 へ入れ替える。道具の使い方は同じだが、新しい型に合わせて設定を点検した。アプリ本体の見た目は何も変わらない」程度の平易さ。Markdown コードの羅列のみは不可 |
| Part 2（技術者向け） | root `package.json` への `vite ^7.0.0` 直接 devDependency 新規追加の差分、V1〜V8 破壊的変更カテゴリの技術詳細（各カテゴリの v6/v7 変更点と当 repo での対応）、`vitest.config.ts` / `vitest.d1.config.ts` への影響（条件付き最小修正・等価維持）、**apps/web は Vite 非影響**（`next build --webpack` 正本）である事実の明示 |
| 視覚証跡セクション | 「UI/UX 変更なしのため Phase 11 スクリーンショット不要」と逐語明記する |

### 成果物 2: `system-spec-update-summary.md`

| ステップ | 必須要件 |
| --- | --- |
| Step 1-A | 完了タスク記録 + `docs/30-workflows/LOGS.md` への記録 ×2 + topic-map 反映 |
| Step 1-B | 実装状況テーブル（FR / AC の実装済み状況と local evidence） |
| Step 1-C | 関連タスクテーブル（親 `vitest-2-to-3-major-upgrade` / issue-747 runbook / Issue #1201 等の関連参照） |
| Step 2 | **新規インターフェース追加なし → N/A 判定**。理由を逐語で記載:「依存バージョン更新のみで、公開 API / 型 / 定数の変更がないため、新規インターフェース追加は N/A」 |

### 成果物 3: `documentation-changelog.md`

- 全 Step の結果を個別に明記する。
- **workflow-local 同期**（当 workflow ディレクトリ内の index / task-workflow-active 等の更新）と **global skill sync**（`.claude/skills/` 配下への反映）を **別ブロック** で記録する。

### 成果物 4: `unassigned-task-detection.md`

- 0 件でも出力必須。
- **current**（本サイクルで検出した未対応事項）と **baseline**（元タスクのスコープ外で将来タスク候補）を分離して記録する。
- baseline 候補として、`_shared-context.md` §7「含まないもの」と整合する **Vitest 4.x 化（#1200 / followup-001）** と **Vite 8 化（Vitest 4 系と連動・`vitest@3.2.6` は v8 未サポート）** を将来候補として記録する。

### 成果物 5: `skill-feedback-report.md`

- 改善点なしでも出力必須。
- 依存アップグレード系タスクにおける Phase 再解釈（Phase 4 RED 設計 = 破壊的変更観測 / Phase 11 = NON_VISUAL 代替証跡 / 「specifier 更新」ではなく「直接 devDependency 新規追加」機構 等）についての feedback を記録する。

### 成果物 6: `phase12-task-spec-compliance-check.md`（root evidence）

- Phase 12 成果物が task-specification-creator skill の strict 仕様（canonical 見出し / Phase 11 evidence 表 / strict 7 成果物 parity 等）に準拠していることを検証する root evidence。
- **implemented_local_evidence_captured を正確に反映** し、実装済み local evidence と user-gated 境界を混同しない。

## index 再生成・parity 確認手順

Phase 12 完了前に以下を実施する。

1. **index 再生成**: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`（または `mise exec -- pnpm indexes:rebuild`）を実行し、topic-map / keywords 等の生成物 drift を解消する。
2. **artifacts.json parity 確認**: root `artifacts.json` と `outputs/artifacts.json` の内容 parity を確認する（Gate 状態・成果物リストの不整合がないこと）。
3. **drift ゼロ確認**: `bash scripts/verify-pr-ready.sh` の pre-flight（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift）が全て green であることを確認する。

> index 再生成で生成物に差分が出た場合は `git add` でステージし、`git diff --quiet` がクリーンになることを確認する（既知の rebuild drift 是正パターン）。

## 完了条件

- [x] strict 7 成果物の必須要件が各々列挙されている（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-compliance-check）
- [x] implementation-guide.md の Part 1（中学生レベル・例え話必須）/ Part 2（V1〜V8 + apps/web 非影響）/ 視覚証跡セクション要件が記載されている
- [x] system-spec-update-summary.md の Step 2 = N/A 判定（理由付き）が記載されている
- [x] unassigned-task-detection.md の baseline 候補（Vitest 4.x 化 / Vite 8 化）が記載されている
- [x] index 再生成・artifacts.json parity 確認・drift ゼロ確認の手順が記載されている
- [x] 実装済み local evidence と user-gated 境界（commit / push / PR）を分離して記載している
