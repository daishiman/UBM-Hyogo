# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 10 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

Phase 5-9 の成果物を最終レビューし、PR 作成可否を判定する。MINOR 追跡テーブルの解決状況を確認する。

## レビュー観点

| 観点 | 確認内容 |
| --- | --- |
| AC 達成 | AC-1〜AC-7 すべて達成 |
| diff 最小性 | 変更が `.github/workflows/ci.yml` の `coverage-gate` job 範囲 + 関連 cross-ref のみ |
| 後方互換 | skip path / upload-artifact / needs 連鎖が維持 |
| rollback 経路 | `git revert <commit>` で hard gate 化を即座に取り消せる |
| MINOR 追跡 | Phase 3 で記録した MINOR が解決 or unassigned-task に formalize 済 |

## MINOR 追跡テーブル（gate-decision）

| MINOR ID | 指摘内容 | 解決予定 Phase | 解決確認 Phase | 備考 |
| --- | --- | --- | --- | --- |
| (Phase 3 で記録があれば転記) | - | - | - | - |

## rollback 手順

```bash
# 緊急時: hard gate を soft gate に戻す
git log --oneline -- .github/workflows/ci.yml | head -5
git revert <task-e-commit-sha>
git push
```

## 成果物

- `outputs/phase-10/final-review.md`（レビュー結果 + rollback 手順）

## 完了条件

- [ ] 5 観点すべて PASS
- [ ] rollback 手順記載
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] AC × 7 すべての達成状況が表で確認されている

## 次 Phase

Phase 11（手動テスト / runtime evidence）。
