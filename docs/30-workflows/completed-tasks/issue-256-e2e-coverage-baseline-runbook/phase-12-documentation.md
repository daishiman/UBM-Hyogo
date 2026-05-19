# Phase 12 — ドキュメント更新

`[実装区分: 実装仕様書]`

## 必須 7 成果物

| # | ファイル | 内容 |
|---|---------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 root evidence |
| 2 | `outputs/phase-12/implementation-guide.md` | Part 1 (中学生レベル) + Part 2 (技術詳細) |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A / 1-B / 1-C / Step 2 判定 |
| 4 | `outputs/phase-12/documentation-changelog.md` | 全 Step の変更履歴 |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | 0 件でも出力 (Phase 10 MINOR 候補を formalize) |
| 6 | `outputs/phase-12/skill-feedback-report.md` | 改善点なしでも出力 |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | compliance root evidence |

## Step 2 判定

| 観点 | 判定 |
|------|------|
| 新規 interface 追加 | 内部 script の test 用 export のみ。apps / packages の public API・共有型・runtime contract 追加なし |
| API 変更 | なし |
| 公開定数 | なし |

→ Step 2 (`aiworkflow-requirements/` API / system interface 正本更新) は **N/A**。ただし workflow ledger / artifact inventory / indexes は Step 1-A〜1-C として同一 wave で同期する。

## Step 1-A (タスク完了記録)

更新対象:
- `.claude/skills/task-specification-creator/LOGS/_legacy.md`
- `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
- (該当があれば) `docs/30-workflows/LOGS.md`

## Step 1-B (実装状況テーブル)

- 本 workflow の `index.md` / `artifacts.json` は `implemented_local_evidence_captured`
- Phase 13 は commit / push / PR のみ user-gated

## Step 1-C (関連タスクテーブル)

- `docs/30-workflows/unassigned-task/task-e2e-playwright-coverage-001.md` の status を `partial_fix` / 残存指摘へ更新
- 本 workflow への link を追加

## artifacts 整合

`artifacts.json` と `outputs/artifacts.json` は full mirror とし、`cmp -s artifacts.json outputs/artifacts.json` で一致確認する。
