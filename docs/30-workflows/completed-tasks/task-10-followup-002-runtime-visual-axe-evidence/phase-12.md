# Phase 12: ドキュメント同期（strict 7 outputs）

[実装区分: 実装仕様書]

## 目的

aiworkflow-requirements 正本と Phase 12 strict 7 outputs を同期する。

## 必須 7 outputs

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 サマリ |
| `outputs/phase-12/implementation-guide.md` | 実装内容を中学生レベルで説明する Phase 12 規約準拠ガイド（PR 本文に直接展開できる粒度） |
| `outputs/phase-12/documentation-changelog.md` | 本タスクで更新したドキュメント一覧 |
| `outputs/phase-12/system-spec-update-summary.md` | aiworkflow-requirements 正本への反映差分（`references/ui-ux-components.md` evidence reference 追記） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 1-13 必須セクション充足チェック |
| `outputs/phase-12/skill-feedback-report.md` | task-specification-creator skill の改善フィードバック（無ければ "none"） |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出結果（本タスクで追加 detection が出た場合のみ起票案を記載） |

## 中学生レベル概念説明（implementation-guide.md 冒頭）

- 「11 個の部品（ボタン・カード・バッジ・入力欄・選択欄・サイドバー・数値表示・空表示・人物アイコン・入力セット・お知らせ）の見た目を実際にブラウザで表示して写真を撮り、機械的にチェックする」
- 「写真は variant ごとに 1 枚ずつ保存される」
- 「axe というツールで、視覚障害ユーザーが困らない作りか自動チェックする」

## 検証コマンド

```bash
ls outputs/phase-12/ | wc -l   # 7 を期待
```

- [ ] strict 7 outputs が揃う
- [ ] aiworkflow-requirements への正本同期完了

## Validator Compliance Sections

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| workflow | task-10-followup-002-runtime-visual-axe-evidence |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| state | runtime_pending |

## 実行タスク

- [ ] 本 Phase の本文に記載した task を実行する。
- [ ] 実行結果を該当 outputs path に保存する。
- [ ] runtime 未実行のものは completed と書かず runtime_pending と記録する。

## 参照資料

| 参照 | パス |
| --- | --- |
| workflow root | docs/30-workflows/completed-tasks/task-10-followup-002-runtime-visual-axe-evidence/ |
| parent workflow | docs/30-workflows/completed-tasks/task-10-ui-primitives-spec/ |
| UI canonical | .claude/skills/aiworkflow-requirements/references/ui-ux-components.md |
| state vocabulary | .claude/skills/task-specification-creator/references/workflow-state-vocabulary.md |

## 成果物/実行手順

| 成果物 | 手順 |
| --- | --- |
| Phase output | 本文の command / checklist に従い outputs 配下へ保存する |
| Evidence | Phase 11 runtime 実行までは runtime_pending とする |

## 統合テスト連携

| 項目 | 値 |
| --- | --- |
| focused e2e | PLAYWRIGHT_EVIDENCE_TASK=task-10-followup-002 pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium ui-primitives-visual.spec.ts |
| local gates | typecheck / lint / token gate / artifacts parity |
| external gates | staging deploy / production smoke / commit / push / PR は user-gated |

## 完了条件チェックリスト

- [ ] 必須成果物 path が存在する。
- [ ] 状態語彙が canonical である。
- [ ] 未実行 runtime evidence を completed と表記していない。
