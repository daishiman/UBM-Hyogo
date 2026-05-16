# Phase 12: ドキュメント更新

## 12.1 必須 strict 7 成果物

`outputs/phase-12/` 配下に以下 7 ファイルを必ず作成する（0 件・該当なしでも空ファイルは禁止、明示記載する）。

| # | ファイル | 責務 |
|---|---------|------|
| 12-0 | `main.md` | Phase 12 close-out index |
| 12-1 | `implementation-guide.md` | Part 1/2 構成の実装ガイド |
| 12-2 | `system-spec-update-summary.md` | Step 1-A/1-B/1-C + Step 2 判定 |
| 12-3 | `documentation-changelog.md` | 全 Step 結果の明示記録 |
| 12-4 | `unassigned-task-detection.md` | 0 件でも出力 |
| 12-5 | `skill-feedback-report.md` | 改善点なしでも出力 |
| 12-6 | `phase12-task-spec-compliance-check.md` | root evidence |

## 12.2 Task 12-1: implementation-guide.md

### Part 1: 中学生レベル概念説明（必須）

例え話の骨子:
> 「Cloudflare に site を載せる作業は、現場監督（wrangler）が大工さん（esbuild）に細かい指示を出してビルドさせる流れに似ている。現場監督（wrangler 4.85.0）は新しい大工さん（esbuild 0.27.3）を前提にしているのに、うちの現場では古い大工さん（esbuild 0.25.4）に固定していたので作業がストップしていた。対策は、現場監督が前提にしている大工さんへ揃え、ほかの作業も実際に動くか確認すること。」

要件:
- 日常の例え話を必ず含める
- 「なぜ必要か」を先、「何をするか」を後
- 専門用語は即座に説明

### Part 2: 技術者向け詳細（必須）

含めるセクション:
- 根本原因（wrangler 4.85.0 が esbuild に渡す `supported.import-source`）
- `pnpm.overrides.esbuild` の波及範囲（monorepo 全体）
- 採用版 `0.27.3` と決定根拠（wrangler exact version 優先、OpenNext は実 build で検証）
- 検証コマンド一覧（EXT-1〜9 + C-1〜3）
- 関連設定ファイル: `package.json`, `pnpm-lock.yaml`, `scripts/cf.sh`
- エッジケース: 既存 `patchedDependencies` との衝突 / darwin-arm64 / linux-x64 platform 差
- 次回 wrangler bump 時の運用手順（`scripts/cf.sh` コメント参照）

### 視覚証跡セクション

```
## 視覚証跡

UI/UX 変更なしのため Phase 11 スクリーンショット不要。
代替証跡: `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` 参照。
```

## 12.3 Task 12-2: system-spec-update-summary.md

| Step | 内容 | 想定結果 |
|------|------|---------|
| Step 1-A | 完了タスク記録（タスクID・テスト件数・成果物テーブル）+ LOGS.md x2（aiworkflow-requirements / task-specification-creator）+ topic-map.md | 実行必須 |
| Step 1-B | 実装状況テーブル更新 (`未実装` → `完了`) | 実行必須 |
| Step 1-C | 関連タスクテーブル更新 | 該当なしと記録 |
| Step 2 | 新規 interface 追加 → 仕様更新 | **N/A**（pnpm.overrides 値変更のみ・新規 interface なし） |

## 12.4 Task 12-3: documentation-changelog.md

[Feedback BEFORE-QUIT-003] 対応: **workflow-local 同期** と **global skill sync** を別ブロックで記録する。

```markdown
## workflow-local 同期

- `docs/30-workflows/fix-wrangler-esbuild-import-source-error/index.md` 更新
- `outputs/phase-*/` 13 ファイル新規作成
- `artifacts.json` を `implemented_local_evidence_captured` / Phase 13 blocked に更新

## global skill sync

- 該当なし（本タスクは skill 自体を変更しない）
```

## 12.5 Task 12-4: unassigned-task-detection.md

0 件でも以下の検出ソースを巡回し、結果を明示する。

| ソース | 巡回方法 | 検出 |
|--------|---------|------|
| 元仕様書のスコープ外項目 | `index.md` §5 「含まない」 | wrangler upgrade 自動化（未タスク化候補） |
| Phase 10 MINOR 指摘 | `phase-10.md` §10.3 | 3 件（wrangler 自動 bump 化 / CI gate / drift check） |
| Phase 11 手動テスト発見 | `phase-11.md` 実施ログ | 0 件想定 |
| コードコメント TODO/FIXME | `grep -rn "TODO\|FIXME\|HACK\|XXX" package.json scripts/cf.sh` | 0 件想定 |

検出される未タスク化候補:

1. **wrangler 自動 bump (Renovate / Dependabot) 化**
   - 状態: backlog
   - 残存部位: `.github/dependabot.yml` 等のリポジトリレベル設定
   - 関連: 本タスク

2. **`pnpm view wrangler@<X>.<Y>.<Z> dependencies.esbuild` を確認する CI gate**
   - 状態: backlog
   - 目的: esbuild override と wrangler 同梱版の drift 事前検知

3. **OpenNext / wrangler / esbuild 三者 drift check スクリプト**
   - 状態: backlog
   - 目的: 月次で drift を検出し、本タスクと同種のエラーを未然に防ぐ

> 関連タスク差分確認: 既存の `unassigned-task/` に同種起票がないかを Phase 12 着手前に grep で確認する（[FB-CANCEL-004-2] 対応）。

## 12.6 Task 12-5: skill-feedback-report.md

| 観点 | 改善余地 |
|------|---------|
| テンプレート | hotfix 単一ファイル変更タスク向けの簡素テンプレートが欲しい（現状 Phase 1-13 はやや重い） |
| ワークフロー | `pnpm view <pkg> dependencies.<dep>` を仕様書段階で自動取得して固定化する script があると Phase 2 が確実化する |
| ドキュメント | 「monorepo overrides 影響範囲」の横断ガイドラインが未整備 |

## 12.7 Task 12-6: phase12-task-spec-compliance-check.md

[Feedback W1-02b-3] 対応: implementation-guide.md 内の識別子（バージョン文字列・コマンド名・ファイルパス）が実コードと一致しているかを `grep` で検証した結果を記録。

確認項目:
- esbuild バージョン文字列が `package.json` の実値と一致
- `scripts/cf.sh` 参照パスが実在
- ワークフロー名（`web-cd` / `backend-ci`）が `.github/workflows/` の実ファイルと一致

## 12.8 三者同期チェック（[FB-04] 対応）

Step 1-A の冒頭で以下 5 ファイルを **同一ターン** で更新する:

| # | ファイル | 更新内容 |
|---|---------|---------|
| 1 | 本ワークフロー `index.md` | `workflow_state: implemented_local_evidence_captured` |
| 2 | 本ワークフロー `artifacts.json` | `phase-12.status: completed` |
| 3 | `outputs/artifacts.json`（あれば） | 同期 |
| 4 | `docs/30-workflows/completed-tasks/` への移管エントリ | Phase 13 merge 後に実施。本サイクルでは移管しない |
| 5 | `docs/30-workflows/LOGS.md` | 完了ログ追記 |

## 12.9 DoD

- 12.1 の strict 7 ファイルが `outputs/phase-12/` に存在。
- `artifacts.json` / `outputs/artifacts.json`（あれば）の parity 確認済み。
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行で drift 0。
- 12.8 の 5 ファイル同期完了。
