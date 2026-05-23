# Phase 12: ドキュメント整合 / 中学生レベル概念説明

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 種別 | ドキュメント整合 |
| 入力 | Phase 4-11 すべての成果物 |
| 出力 | `outputs/phase-12/` 7 必須成果物 + integration-fixes/index.md 同期 |

## 目的

本タスクの完了に伴い、上位ドキュメント・skill 正本・integration-fixes トラッカーを同一サイクル内で同期し、`AdminMutationError` という概念がリポジトリ全体から完全に消えたことを文書面でも反映する。

## 中学生レベル概念説明

### このタスクは何をしたのか

`AdminMutationError` という「管理画面の操作で失敗したときに投げる例外クラス」が、別の `FetchAuthedError`（「サーバーに問い合わせて失敗したときに投げる例外クラス」）とほぼ同じ役割を持っていたため、**まったく同じ意味を持つクラスが 2 種類ある状態**になっていた。

これは「`bicycle` と `自転車` という別の単語で同じ乗り物を呼んでいる」ようなもので、コードを読む人は「この 2 つは違うものなのか？」と毎回迷ってしまう。今回はそのうちの片方（`AdminMutationError`）を削除し、`FetchAuthedError` だけに統一した。

### なぜ慎重な順番が必要なのか

クラスを削除する**前に**、それを使っている画面コードを先に書き換える必要がある。順番を逆にすると、「使うクラスが消えてしまってインポートできない」状態が一瞬発生し、TypeScript のコンパイルが通らなくなる。

これは「橋を渡り終わる前に橋を壊す」のと同じで、必ず**渡り終えてから橋を壊す**順序を守らなければならない。Phase 2 の実装順序（panel 3 → typecheck → hook の class 削除）はこのためにある。

## Phase 12 必須 7 outputs

| # | Path | 内容 |
| --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | 本サイクル全体の総括 |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装の概要（PR 本文に転記する用） |
| 3 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 9 canonical headings の compliance check |
| 4 | `outputs/phase-12/system-spec-update-summary.md` | system spec 更新有無のサマリ（本タスクは無し） |
| 5 | `outputs/phase-12/skill-feedback-report.md` | skill 反映候補（本タスクは「i02 closeout を仕組み化する仕組みは i02b spec 自体が役割を果たしたため反映なし」と記録） |
| 6 | `outputs/phase-12/unassigned-task-detection.md` | 未割当タスク検出（本タスクは 0 件） |
| 7 | `outputs/phase-12/documentation-changelog.md` | 編集ドキュメントの列挙（下記 §ドキュメント同期 と一致） |

## ドキュメント同期

| Path | 更新内容 |
| --- | --- |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` | 検出表で i02b を `completed locally`、i02 を `completed locally`（DoD 143 達成）に更新 |
| `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i02b-admin-mutation-error-finalize/spec.md` | DoD チェックボックスをすべて check に更新 |
| `docs/30-workflows/parallel-i02b-admin-mutation-error-finalize/index.md`（本 spec） | `workflow_state: implemented_local_evidence_captured` に更新 |

## 完了条件


- [x] Phase 12 の完了条件を満たす証跡が保存されている。
- 7 必須 outputs がすべて存在
- 中学生レベル概念説明（本 phase）が含まれている
- ドキュメント同期 3 件が完了
- `apps/` dirty diff と本 spec の Phase 4 変更が 1:1 対応している（dirty-code gate）
- placeholder token（`token-sized` / `09b-token-value` 等）残存 0 件
- §99 必須項目 content check 通過

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- Phase 11 evidence ledger

## 実行タスク

- Phase 12 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 成果物

- Phase 12 の検証結果と関連ログ。
