[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新

## 目的

Phase 12 必須 7 outputs を生成し、CONST_005 / Phase 12 canonical heading SSOT 準拠を保証する。

---

## 入力

- Phase 1〜11 outputs 全件
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（参照）

---

## 1. 必須 7 outputs（Phase 12 canonical heading SSOT）

| # | ファイル | 役割 |
|---|---------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 root（全 6 outputs への目次） |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル概念説明） + Part 2（技術者向け実装ガイド） |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | CONST_005 必須項目チェックリスト |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | システム仕様への影響と同期項目 |
| 5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill 改善点 |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出（0 件でも出力必須） |
| 7 | `outputs/phase-12/documentation-changelog.md` | Step 1-A/1-B/1-C/Step 2 判定記録 |

---

## 2. 各 output の必須セクション

### 2.1 implementation-guide.md

#### Part 1: 中学生レベル概念説明

- なぜ画面を全部スクリーンショットで比べるのか
- 17 routes × 3 viewport の意味（PC / iPad / iPhone）
- baseline と diff の関係（写真の正解版と現在版の比較）
- なぜ nightly に走らせるのか（ユーザーが寝てる間に確認）
- なぜ baseline 更新には承認が必要か（勝手に書き換えられると検知できない）

#### Part 2: 技術者向け実装ガイド

- `visual-full-chromium-{desktop,tablet,mobile}` project の追加箇所と diff
- `VISUAL_ROUTES` / `VIEWPORTS` fixture の使い方
- `expect.toHaveScreenshot` パラメータ詳細
- 既存 `adminLogin(context)` / `memberLogin(context)` auth helper の再利用方針
- `playwright-visual-full.yml` の path-filter と nightly cron
- `playwright-visual-baseline-update.yml` の approval gate 構造
- baseline 更新の正式手順（`gh workflow run` + approval + merge PR）
- ロールバック手順

### 2.2 phase12-task-spec-compliance-check.md

| CONST_005 項目 | 充足判定 | 該当 Phase |
|---------------|----------|-----------|
| 変更対象ファイル明示 | `spec_created` | index.md §「変更対象ファイル一覧」、phase-1 §6、phase-5 §1 |
| 関数シグネチャ明示 | `spec_created` | phase-2 §2〜4, §8 |
| テスト明示 | `spec_created` | phase-4, phase-6, phase-7 |
| 実行コマンド逐語明記 | `spec_created` | phase-4 §1, phase-5 §3, phase-9 §1 |
| DoD 明示 | `spec_created` | 各 Phase 末尾 |

### 2.3 system-spec-update-summary.md

- CLAUDE.md "UI prototype alignment / MVP recovery" §不変条件への影響: なし（既存条件を継承するのみ）
- `docs/00-getting-started-manual/specs/` への追加: なし
- branch protection への影響: 後続タスク（本タスク範囲外）
- `docs/30-workflows/operations/` への追加: visual baseline 運用手順を必要に応じて追記（候補）

### 2.4 skill-feedback-report.md

- task-specification-creator 適用時の所見
- VISUAL classification のテンプレ拡張要望（51 baseline のような大量 evidence ケース）
- 改善なしの場合も「改善なし」と明記

### 2.5 unassigned-task-detection.md

- 未タスク 0 件確認手順
- 検出された場合は `docs/30-workflows/unassigned-task/` に追加するルールを再掲

### 2.6 documentation-changelog.md

- Step 1-A: spec_created（本タスク Phase 1〜13 仕様書）
- Step 1-B: implementation-guide Part 1 / Part 2 整備
- Step 1-C: 不変条件・依存関係への変更なし
- Step 2: system-spec-update-summary の発行

---

## 3. CONST_005 必須項目チェックリスト

| 項目 | 充足 | 証跡 |
|------|------|------|
| 変更対象ファイル一覧 | `spec_created` | index.md, phase-1, phase-5 |
| 関数/設定シグネチャ | `spec_created` | phase-2 §2〜4, phase-8 §2 |
| テスト計画 | `spec_created` | phase-4, phase-6, phase-7 |
| 実行コマンド | `spec_created` | phase-4 §1, phase-5 §3, phase-7 §1, phase-9 §1 |
| DoD | `spec_created` | 各 Phase 末尾 |
| ロールバック | `spec_created` | phase-5 §4 |
| visualEvidence 分類 | `spec_created` | index.md frontmatter |
| 不変条件 | `spec_created` | index.md §不変条件 |

---

## 4. DoD

1. 7 outputs すべてが `outputs/phase-12/` 配下に存在し、未記入マーカーが残っていない
2. implementation-guide.md が Part 1 + Part 2 構造を持つ
3. phase12-task-spec-compliance-check.md の CONST_005 チェックリストが全項目 YES
4. canonical heading SSOT 検証 (`verify-phase12-compliance`) が PASS

---

## 5. 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/documentation-changelog.md`
