# Phase 12 コンプライアンスチェック — Issue #325

## strict 7 file names

| ファイル | 判定 |
| --- | --- |
| `outputs/phase-12/main.md` | PASS |
| `outputs/phase-12/implementation-guide.md` | PASS |
| `outputs/phase-12/system-spec-update-summary.md` | PASS |
| `outputs/phase-12/documentation-changelog.md` | PASS |
| `outputs/phase-12/unassigned-task-detection.md` | PASS |
| `outputs/phase-12/skill-feedback-report.md` | PASS |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | PASS |
| `outputs/phase-12/test-file-suffix-adr.md` | PASS（補助 ADR） |

## 内容充足チェック

| ファイル | 必須要素 | 判定 |
| --- | --- | --- |
| implementation-guide.md | Part 1 中学生レベル / Part 2 技術者レベル両方 | PASS |
| test-file-suffix-adr.md | 4 分類定義 / 例 5 件 / scope out / implementation_completed 境界 | PASS |
| unassigned-task-detection.md | 未タスク 0 件 / scope-out 棚卸し / CONST_005 境界 | PASS |
| system-spec-update-summary.md | aiworkflow 同期点 / 更新しないもの / Issue #548 削除差分境界 | PASS |
| skill-feedback-report.md | テンプレート改善 / ワークフロー改善 / ドキュメント改善 | PASS |

## テスト常時実行可能性 DoD

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| 対象 spec 列挙 | PASS | `phase-02.md` fixed list 132 件 |
| 1 行実行コマンド | PASS | `mise exec -- pnpm --filter @ubm-hyogo/api test` |
| 実行前提 | PASS | repo root / `mise exec` / root `vitest.config.ts` |
| un-skip 不変条件 | PASS | rename-only で `test.describe.skip` 追加禁止 |
| CI gate 化 | PASS | 新規 workflow 追加なし。既存 `ci.yml` / `backend-ci.yml` / `pr-build-test.yml` の接続確認を Phase 11 で記録 |
| coverage 判定 | PASS | coverage AC は対象外。rename 前後 delta 0 を Phase 11 で記録 |

## 4 条件

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 実 tree / Phase 11 / Phase 12 / aiworkflow を `implementation_completed` に統一 |
| 漏れなし | PASS | Phase 12 strict 7 files + ADR + Phase 11 raw evidence が存在し、aiworkflow 同期点も列挙済み |
| 整合性あり | PASS | taskType=`implementation` / visualEvidence=`NON_VISUAL` / state=`implementation_completed` を root artifacts と本文で統一 |
| 依存関係整合 | PASS | UT-08A-06 → Issue #325 successor traceを親 inventory と aiworkflow に反映 |

## 未完了境界

PR 作成のみ未実行である。実 rename、typecheck、lint、api test は Phase 11 evidence に保存済み。

## artifacts parity

本 workflow は root `artifacts.json` を正本とし、Phase 1-12 を `completed`、Phase 13 を `pending` として記録する。`outputs/artifacts.json` はこの workflow では生成対象に含めない。
