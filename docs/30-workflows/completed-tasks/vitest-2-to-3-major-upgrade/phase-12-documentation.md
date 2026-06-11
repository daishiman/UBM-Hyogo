# Phase 12: Documentation（ドキュメント更新）

## メタ情報

| Key | Value |
| --- | --- |
| workflow | vitest-2-to-3-major-upgrade |
| 前提 | phase-11-manual-test.md（代替証跡採取済み） |
| 区分 | `[実装区分: 実装仕様書]` / NON_VISUAL |
| 目的 | アップグレード結果のドキュメント化と、後続が参照可能な strict 7 成果物の整備 |

## strict 7 成果物（全て `outputs/phase-12/` に出力）

後続実装者は Phase 12 で **以下 7 成果物を必ず作成** し、すべて `outputs/phase-12/` 配下へ出力する。0 件・N/A 判定でもファイルは出力する（省略禁止）。

> **注意**: 本仕様書は「Phase 12 で何を作るか」の仕様を固定するものであり、同じ workflow root の `outputs/phase-12/` には本仕様書パッケージ自体の strict 7 close-out evidence も配置する。実際の Vitest upgrade 実装後は同じ固定ファイル名で実装結果へ更新する。

### 成果物 0: `main.md`

- Phase 12 の本体 entry point。
- workflow_state、taskType、visualEvidence、strict 7 の実在一覧、実装とユーザーゲートの境界を明記する。
- `main.md` が欠落している場合、他 6 ファイルがあっても Phase 12 compliance は FAIL とする。

### 成果物 1: `implementation-guide.md`

| 構成 | 必須要件 |
| --- | --- |
| Part 1（中学生レベルの概念説明） | 専門用語を使わず、日常の例え話を必須とする。例: 「テストの自動チェック係（vitest）を古いバージョンから新しいバージョンに入れ替えた。係の名前と仕事は同じだが、ルールが少し厳しくなった部分に合わせて、こちらの書き方を直した」程度の平易さ。Markdown コードの羅列のみは不可 |
| Part 2（技術者向け） | `package.json` 差分（root / apps/api / apps/og の vitest `^3.2.6`、root の `@vitest/coverage-v8 ^3.2.6`）、config への影響（`vitest.config.ts` / `vitest.d1.config.ts` の非推奨 API 有無）、破壊的変更 C1〜C8 の技術詳細（各カテゴリの v3 変更点と当 repo での対応） |
| 視覚証跡セクション | 「UI/UX 変更なしのため Phase 11 スクリーンショット不要」と逐語明記する |

### 成果物 2: `system-spec-update-summary.md`

| ステップ | 必須要件 |
| --- | --- |
| Step 1-A | 完了タスク記録 + `docs/30-workflows/LOGS.md` への記録 ×2 + topic-map 反映 |
| Step 1-B | 実装状況テーブル（FR-1〜7 / AC-1〜8 の実装済み状況） |
| Step 1-C | 関連タスクテーブル（issue-747 runbook / PR #1177 等の関連参照） |
| Step 2 | **新規インターフェース追加なし → N/A 判定**。理由を逐語で記載: 「依存バージョン更新のみで、公開 API / 型 / 定数の変更がないため、新規インターフェース追加は N/A」 |

### 成果物 3: `documentation-changelog.md`

- 全 Step の結果を個別に明記する。
- **workflow-local 同期**（当 workflow ディレクトリ内の index / task-workflow-active 等の更新）と **global skill sync**（`.claude/skills/` 配下への反映）を **別ブロック** で記録する。

### 成果物 4: `unassigned-task-detection.md`

- 0 件でも出力必須。
- **current**（本サイクルで検出した未対応事項）と **baseline**（元タスクのスコープ外で将来タスク候補）を分離して記録する。
- baseline 候補として、元タスクのスコープ外項目である **vitest 4.x 化** と **vite の明示メジャーアップ** を記録する（index.md「含まないもの」と整合）。

### 成果物 5: `skill-feedback-report.md`

- 改善点なしでも出力必須。
- 依存アップグレード系タスクにおける Phase 再解釈（Phase 4 RED 設計 = 破壊的変更観測 / Phase 11 = NON_VISUAL 代替証跡 等）についての feedback を記録する。

### 成果物 6: `phase12-task-spec-compliance-check.md`（root evidence）

- Phase 12 成果物が task-specification-creator skill の strict 仕様（canonical 見出し / Phase 11 evidence 表 / strict 7 成果物 parity 等）に準拠していることを検証する root evidence。

## index 再生成・parity 確認手順

Phase 12 完了前に以下を実施する。

1. **index 再生成**: `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`（または `mise exec -- pnpm indexes:rebuild`）を実行し、topic-map / keywords 等の生成物 drift を解消する。
2. **artifacts.json parity 確認**: root `artifacts.json` と `outputs/artifacts.json` の内容 parity を確認する（Gate 状態・成果物リストの不整合がないこと）。
3. **drift ゼロ確認**: `bash scripts/verify-pr-ready.sh` の pre-flight（`verify:phase12-compliance` / `gate-metadata:validate` / `indexes:rebuild` drift）が全て green であることを確認する。

> index 再生成で生成物に差分が出た場合は `git add` でステージし、`git diff --quiet` がクリーンになることを確認する（既知の rebuild drift 是正パターン）。

## 完了条件

- [ ] strict 7 成果物の必須要件が各々列挙されている（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-compliance-check）
- [ ] implementation-guide.md の Part 1（中学生レベル・例え話必須）/ Part 2（技術詳細）/ 視覚証跡セクション要件が記載されている
- [ ] system-spec-update-summary.md の Step 2 = N/A 判定（理由付き）が記載されている
- [ ] unassigned-task-detection.md の baseline 候補（vitest 4.x 化 / vite メジャーアップ）が記載されている
- [ ] index 再生成・artifacts.json parity 確認・drift ゼロ確認の手順が記載されている
