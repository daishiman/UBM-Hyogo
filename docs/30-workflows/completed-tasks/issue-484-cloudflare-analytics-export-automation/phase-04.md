# Phase 4: 実装計画・タスク分解

## 目的
Phase 5 以降のコード実装手順を、ファイル単位 / commit 単位の実行可能タスクに分解する。

## 実装タスク一覧（実行順）

| # | タスク | 対象ファイル | 推定 LoC |
| --- | --- | --- | --- |
| T-1 | 関数雛形 + 型定義作成 | `scripts/fetch-cloudflare-analytics.ts` | ~80 |
| T-2 | `whitelistFields` 実装 | 同上 | ~30 |
| T-3 | `formatOutputFilename` 実装 | 同上 | ~15 |
| T-4 | `atomicWriteJson` 実装 | 同上 | ~30 |
| T-5 | `rotateArchive` 実装 | 同上 | ~50 |
| T-6 | `fetchAnalytics`（GraphQL POST + parse + validate） | 同上 | ~80 |
| T-7 | `main` orchestration（env 読み / 順序制御 / error handling） | 同上 | ~60 |
| T-8 | unit test 作成 | `scripts/__tests__/fetch-cloudflare-analytics.test.ts` | ~200 |
| T-9 | `redaction-check-analytics.sh` 作成 | `scripts/redaction-check-analytics.sh` | ~40 |
| T-10 | GitHub Actions workflow 作成 | `.github/workflows/cloudflare-analytics-export.yml` | ~80 |
| T-11 | `package.json` script 追加 | `package.json` | ~5 |
| T-12 | skill ドキュメント反映 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | ~20 |
| T-13 | typecheck / lint / test 実行 | — | — |

## commit 戦略

| commit | 含む変更 |
| --- | --- |
| 1 | T-1〜T-7（fetch script 本体） |
| 2 | T-8（unit test） |
| 3 | T-9（redaction shell） |
| 4 | T-10〜T-11（workflow + package.json） |
| 5 | T-12（skill docs） |
| 6 | T-13 後の修正があれば fixup |

## 並列化可能性
- T-1 〜 T-7 は単一ファイル内のため直列
- T-8（test）は T-1〜T-7 完了後
- T-9（redaction shell）は T-1 完了後なら独立に書ける
- T-10（workflow）は T-7 完了後（実行 entry が確定してから）
- T-12（skill docs）は T-10 完了後

## ロールバック条件

- T-13 で typecheck / lint / test のいずれかが pass しない場合、該当 commit を fixup で修正
- redaction-check が dummy JSON で fail しない場合、T-9 を見直す

## 成果物
- 本ファイル
- `outputs/phase-4/phase-4.md`

## 完了条件
- 13 タスクが順序付きで列挙
- commit 戦略が確定

### システム仕様（aiworkflow-requirements）

- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` Cloudflare Analytics / secret boundary
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` issue-484 workflow registration
