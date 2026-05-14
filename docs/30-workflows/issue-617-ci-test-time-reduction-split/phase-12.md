# Phase 12: strict 7 outputs / task-spec compliance

## 目的

task-specification-creator の Phase 12 仕様に従い、strict 7 outputs を作成し、仕様・正本・未タスク・skill feedback・compliance を同一 wave で閉じる。

## 必須 outputs

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 総括 |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベルの実装ガイド |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 同期内容 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 更新履歴と検証コマンド |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 未タスク 0 件でも必須 |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 改善なしでも必須 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 3-state suffix 付き最終判定 |

## implementation-guide.md 必須項目

1. **Part 1: 中学生レベル**
   - 「給食の列を分ける」など日常例で、なぜ待ち時間を減らすかを説明する
   - 専門用語セルフチェック表を 5 件以上置く
   - 「なぜ必要か」を「何を変えるか」より先に書く
2. **Part 2: 技術者レベル**
   - 背景
   - `apps/api` の test は D1 を 1 つずつ立てる都合で遅い（軸 B / serial 化）
   - `apps/web` は別物なのに同じ runner で待たされている
   - CI 全体時間が長くなっており、PR レビューサイクルを圧迫している
   - やること
   - root `vitest.config.ts` を unit / d1 に論理分割
   - `apps/api` script を `test:coverage:{unit,d1}` に分け、最後に merge
   - `apps/web` は既存 `test:coverage` を CI から個別に呼ぶ
   - CI `coverage-gate-shard` を 4 並列 matrix（web / api-unit / api-d1 / packages）
   - 後段 `coverage-gate` で coverage を merge → 80% gate 判定
3. **やらないこと**
   - 実装ロジック変更 / schema 変更 / coverage 閾値変更 / E2E 構成変更
4. **動作確認**
   - Phase 10 のコマンド一式
   - CI matrix が成功し、aggregate `coverage-gate` が成功し、80% gate 維持
5. **before/after evidence**
   - Phase 11 の `outputs/phase-11/before-after.md` リンク
6. **rollback**
   - revert PR で `vitest.d1.config.ts` 削除、`apps/api/package.json` の `test:coverage` を旧 1 行に戻し、`.github/workflows/ci.yml` の matrix を旧 single job に戻す
   - `scripts/coverage-merge.mjs` / `coverage-guard.sh --group` は残置しても無害（呼ばなければ no-op）
7. **branch protection**
   - 既存 required context `coverage-gate` を維持するため、branch protection mutation は本設計では不要
   - 将来 context 名を変える場合のみ、dev/main 個別 GET、payload 保存、user approval marker、after GET を Phase 13 evidence に追加する

## 完了条件

- strict 7 files がすべて存在する
- `phase12-task-spec-compliance-check.md` が `PASS` 単独表記を使わず、`spec_created` / `runtime_pending` / `completed` suffix を持つ
- aiworkflow-requirements の `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` と起票元 unassigned trace が同一 wave で同期されている
