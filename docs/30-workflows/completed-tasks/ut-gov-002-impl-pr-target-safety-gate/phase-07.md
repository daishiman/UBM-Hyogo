# Phase 07: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 7 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204 |

## 目的

Phase 4 のテストマトリクス T-1〜T-5 と Phase 6 の失敗ケース FC-1〜FC-8 が、AC-1〜AC-9 と検証手段（actionlint / yq / grep / gh）と VISUAL evidence を **網羅的にカバーしているか**を `outputs/phase-7/coverage.md` で検証する。本タスクは implementation だが、coverage 表は「観点 × テスト × 失敗ケース × 証跡」のクロス表として扱う。

## 実行タスク

- `outputs/phase-7/coverage.md` に 3 つのマトリクスを作成する：

  **(1) シナリオ × 失敗ケース クロス表**

  | | FC-1 | FC-2 | FC-3 | FC-4 | FC-5 | FC-6 | FC-7 | FC-8 |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | T-1 same-repo PR | | | ✓ | ✓ | | ✓ | | ✓ |
  | T-2 fork PR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ |
  | T-3 labeled trigger | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ |
  | T-4 workflow_dispatch audit | ✓ | | ✓ | ✓ | ✓ | | | ✓ |
  | T-5 re-run | | | ✓ | ✓ | | | | ✓ |

  - セルが空欄の組合せはカバレッジ穴。FC ごとに最低 1 シナリオで覆われていることを保証する。

  **(2) 検証コマンド × FC カバレッジ表**

  | コマンド | 担当する FC |
  | --- | --- |
  | `actionlint` | FC-1, FC-3, FC-4 |
  | `yq '.permissions'` | FC-4 |
  | `grep persist-credentials: false` | FC-3 |
  | `grep head.(ref\|sha)` | FC-1 |
  | `grep secrets\.` | FC-2, FC-6 |
  | `grep workflow_run` | FC-5 |
  | `gh run view --log` + grep | FC-2, FC-3, FC-6（実走時の動的検証） |
  | `gh api .../branches/{main,dev}/protection` | FC-8 |
  | 運用ルール / リポジトリ設定確認 | FC-7 |

  - 全 8 FC が少なくとも 1 つのコマンド or 運用確認でカバーされていることを宣言。

  **(3) VISUAL evidence × AC カバレッジ表**

  | VISUAL | カバーする AC |
  | --- | --- |
  | GitHub Actions UI（run summary + permissions） | AC-1, AC-2, AC-3, AC-4 |
  | branch protection 画面（required status checks 一覧） | AC-5, AC-6 |
  | 各 workflow run（T-1〜T-5） | AC-4 |

  - 計 7 枚以上のスクリーンショットを `outputs/phase-11/screenshots/` に保存することを Phase 7 で確約する。

- カバレッジ穴がある場合の追補方針：test-matrix.md に追補テストを追加 / failure-cases.md に新 FC 追加 / Phase 12 unassigned-task-detection.md に未カバー項目を起票、の 3 経路を明記する。
- 最低限実走必須項目（M-1〜M-3）：(M-1) same-repo PR の dry-run + UI スクショ、(M-2) fork PR の dry-run + `gh run view --log` grep、(M-3) branch protection の required status checks 名同期確認 + スクショ。
- カバレッジ宣言：観点 coverage AC 9/9 = 100% を完了条件とする。実走 coverage は Phase 11 manual-smoke-log.md で 100% を確認する。

## 参照資料

- `.claude/skills/task-specification-creator/SKILL.md`
- `outputs/phase-4/test-matrix.md`
- `outputs/phase-6/failure-cases.md`
- `outputs/phase-3/review.md`
- `index.md`（AC-1〜AC-9）
- `docs/30-workflows/completed-tasks/ut-gov-002-pr-target-safety-gate-dry-run/outputs/phase-7/coverage.md`

## 成果物

- `outputs/phase-7/main.md`
- `outputs/phase-7/coverage.md`

## 統合テスト連携

3 マトリクスは Phase 9 quality-gate.md でセキュリティゲート（MAJOR 0 件）と AC 全件 ✓ の根拠として参照される。実走 coverage の最終検証は Phase 11 manual-smoke-log.md と screenshots/ で完結する。

## 完了条件

- [ ] coverage.md にシナリオ × FC / コマンド × FC / VISUAL × AC の 3 マトリクスが作成されている。
- [ ] 全 FC（FC-1〜FC-8）が少なくとも 1 シナリオ + 1 コマンドでカバーされている。
- [ ] カバレッジ穴ゼロ、または穴の追補先（test-matrix / failure-cases / Phase 12）が明示されている。
- [ ] 最低限実走必須 M-1〜M-3 が選定されている。
- [ ] 観点 coverage AC 9/9 = 100% が宣言されている。
- [ ] artifacts.json の Phase 7 status が同期されている。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。
