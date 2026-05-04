# Phase 5: 実装（workflow yml 編集）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

Phase 2 採用 diff を `.github/workflows/ci.yml` に適用し、関連 inline comment / 仕様書 cross-ref を更新する。

## 実行タスク

### Task 5-1: ci.yml の job レベル continue-on-error 削除

対象ファイル: `.github/workflows/ci.yml`

操作:
1. `coverage-gate` job 定義（line 56-62 付近）から `continue-on-error: true` を削除
2. 直前の inline コメント 2 行を Phase 2 設計案の文言に更新（PR1/3 履歴 → PR3/3 完了）

### Task 5-2: ci.yml の step レベル continue-on-error 削除

対象ファイル: `.github/workflows/ci.yml`

操作:
1. `Run coverage-guard` step（line 94-100 付近）から `continue-on-error: true` と直前の `# PR1/3:` コメントを削除

### Task 5-3: scripts/coverage-guard.sh の冒頭コメント更新（必要時）

対象ファイル: `scripts/coverage-guard.sh`

操作:
- 冒頭コメントの `仕様正本: docs/30-workflows/coverage-80-enforcement/...` 行は維持
- `PR1/3` 表現が含まれていれば `PR3/3` に書き換え（grep で確認、なければ no-op）

### Task 5-4: 完了履歴の追記（条件付き）

対象ファイル: `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-12/implementation-guide.md`

操作:
- ファイルが存在する場合、変更履歴セクションに「PR3/3 hard gate 化完了 (本タスク dir 参照)」を追記
- 存在しない場合は no-op、`outputs/phase-12/unassigned-task-detection.md` に「履歴追記対象 spec 不在」と記録

## 実装後の即時検証

```bash
yamllint .github/workflows/ci.yml
grep -nE "continue-on-error" .github/workflows/ci.yml | grep -v "^[0-9]*:#" || echo "OK: coverage-gate job has no continue-on-error"
gh workflow view ci.yml > outputs/phase-5/workflow-view.txt
```

## 成果物

- `outputs/phase-5/diff.patch`（適用 diff の記録）
- `outputs/phase-5/workflow-view.txt`（`gh workflow view` 出力）
- `outputs/phase-5/post-edit-grep.log`（grep 確認結果）

## 完了条件

- [ ] ci.yml の job レベル + step レベル両方から `continue-on-error: true` 削除
- [ ] inline comment が PR3/3 完了表現に更新
- [ ] yamllint exit 0
- [ ] `grep continue-on-error .github/workflows/ci.yml` が `coverage-gate` job 範囲内で 0 hit
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（全パッケージ）維持
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] Task 5-1〜5-4 すべてに「対象ファイル / 操作 / 検証」が記載
- [ ] 削除した行と更新後 comment の文言が Phase 2 と一致

## 次 Phase

Phase 6（テスト実装・カバレッジ確認）。
