# Phase 12: Documentation

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-11-manual-test
**次 Phase**: phase-13-pr

## 目的

Phase 12 strict 7 outputs を生成し、canonical 9 headings 準拠を維持する。`verify-phase12-compliance` CI gate を通すことが完了条件。

本 workflow は `implemented_local_evidence_captured` のため、strict 7 は「ローカル実装と仕様同期完了」の証跡として生成する。authenticated runtime / staging evidence・PR 作成は完了扱いにしない。

## strict 7 outputs（生成計画）

| # | ファイル | 概要 |
|---|---|---|
| 1 | `outputs/phase-12/implementation-guide.md` | 中学生レベル概念説明含む実装ガイド（canonical 9 headings 準拠） |
| 2 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | task-specification-creator skill 準拠チェック |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | system spec 更新サマリ（本タスクは API 変更なし → 「更新なし」を明示） |
| 4 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill / aiworkflow-requirements skill への FB |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク検出（0 件でも出力） |
| 6 | `outputs/phase-12/documentation-changelog.md` | 本 workflow 内で生成・更新したドキュメント一覧 |
| 7 | `outputs/phase-12/main.md` | strict 7 outputs の index / 各リンク |

## implementation-guide.md 必須構成

```markdown
# implementation-guide.md

## Part 1: 中学生レベルの説明
...

## Part 2: 技術者向け詳細
...
```

canonical 9 headings は `phase12-task-spec-compliance-check.md` 用の要件であり、`implementation-guide.md` には Part 1 / Part 2 と専門用語セルフチェックを置く。

## phase12-task-spec-compliance-check.md 観点

- canonical 9 headings 全て存在（`phase12-task-spec-compliance-check.md`）
- Phase 11 evidence 表（5 点セット）が `implementation-guide.md` から参照可能
- artifacts.json `phases."12".outputs` に 7 ファイル全て登録
- workflow root に Phase 12 strict outputs 以外の重複なし

## ローカル実行コマンド

```bash
mise exec -- bash scripts/verify-phase12-compliance.sh \
  docs/30-workflows/step-07-requests-approve-reject

mise exec -- pnpm exec gate-metadata:validate
mise exec -- pnpm indexes:rebuild
```

## 完了条件

- strict 7 outputs 全て生成済
- `verify-phase12-compliance` PASS
- `gate-metadata:validate` (artifacts.json zod schema) PASS
- `indexes:rebuild` drift なし
