# Phase 12 — skill-feedback-report

[実装区分: 実装仕様書]

## 本 spec 作成で得た skill 教訓候補

| ID | 教訓 | 反映先候補 |
|----|------|-----------|
| L-I903-001 | 「委譲先 sub-workflow への参照」は委譲先 phase-11 inventory / phase-08 DoD に **当該 EV-ID または対象 route が明示列挙** されているか grep で裏付けるまで委譲扱いにしない（followup-002 R-07 顕在化の根本原因） | `task-specification-creator` patterns-lessons |
| L-I903-002 | route group ディレクトリ（`(member)` 等）は URL に影響しない仕様を活かし、既存 route の **物理移動だけで** 親 layout の data-* 契約を継承させる手段を取れる。新規 stub route を land させる選択肢より副作用が小さい | `task-specification-creator` patterns-lessons / `aiworkflow-requirements` lessons |
| L-I903-003 | `app/profile` 等 path 文字列を含む static-invariants spec は route 移動時に同 wave で更新する。grep `join.*"app/<old-path>"` を Phase 5 のチェックリストに含める | `task-specification-creator` patterns-lessons |
| L-I903-004 | `verify:phase12-compliance` の strict 7 file inventory は `outputs/phase-12/` 配下に物理ファイルとして 7 つ揃える必要がある（spec_drafted 状態でも要件は同じ） | `task-specification-creator` references |
| L-I903-005 | route group 物理移動後は、新規 workflow だけでなく既存 artifact inventory / quick-reference / resource-map / active workflow の current physical path も同 wave で同期する。旧 path は「stale route removed」等の明示的な履歴行に限定する | `aiworkflow-requirements` indexes / references |

実装完了時に上記教訓を skill 末尾へ追記し、汎化文言と本 spec への back-link を残す。
