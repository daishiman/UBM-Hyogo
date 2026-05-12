# Phase 2: 既存実装調査

## 目的

`phase12-task-spec-compliance-check` 系の既存検証 / 類似 CI gate を網羅調査し、再利用候補と新規実装範囲を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 調査対象

| Task | 内容 | 期待結果 |
| --- | --- | --- |
| 2-1 | `rg 'phase12-task-spec-compliance-check\|phase12-compliance-check-template' .github/ scripts/` | 0 件（新規実装が必要）を確認 |
| 2-2 | `.github/workflows/verify-indexes.yml` を参照 | PR diff 連動 + Node 24 + pnpm 10 の workflow 骨格を流用 |
| 2-3 | `scripts/` 配下の既存 verify 系 TS（例: skill indexes 再生成系） | runner / glob / path 解決 utility の再利用候補洗い出し |
| 2-4 | `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` | Required Sections 9 項目の確認 |
| 2-5 | `docs/30-workflows/` 配下の既存 workflow root 群 | 検査対象 root 構造の典型化（`outputs/phase-12/phase12-task-spec-compliance-check.md` パターンの普及率）|

## 出力

- `outputs/phase-02/main.md`（調査メモ）
- 既存実装の再利用可能箇所一覧
- 新規実装が必要な範囲一覧

## 完了条件

- [ ] 既存 phase-12 compliance gate が存在しないことを `rg` 出力で確認
- [ ] `verify-indexes.yml` の骨格構造を抽出
- [ ] 再利用可能な utility（`scripts/` 配下）を列挙

## Next Phase

- [Phase 3](phase-03.md): アーキテクチャ設計
