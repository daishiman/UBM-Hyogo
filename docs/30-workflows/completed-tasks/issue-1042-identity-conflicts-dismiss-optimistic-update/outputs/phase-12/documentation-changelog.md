# Phase 12 / Task 12-3: ドキュメント更新履歴

`[実装区分: 実装仕様書]` / `workflow_state: implemented_local_evidence_captured`

> 全 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に記録する（「該当なし」も記録）。
> workflow-local 同期と global skill sync を別ブロックで記録する（BEFORE-QUIT-003）。
> 本サイクルは実コード実装・focused tests・screenshot 取得・台帳同期まで完了。commit / push / PR は user-gated。

---

## ブロック 1 — workflow-local 同期

| Step | 対象ファイル | 本サイクルの結果 | 残境界 |
| --- | --- | --- | --- |
| 1-A | `index.md`（本 workflow） | `workflow_state: implemented_local_evidence_captured` を記録。Phase 1-12 = completed（仕様書）、Phase 13 = `pending_user_approval` | 実装 / commit / PR は user-gated |
| 1-A | `artifacts.json` / `outputs/artifacts.json` | `status: implemented_local_evidence_captured`、metadata 4キー、gates（Gate-A/B passed、Gate-C pending）、root相対 evidence path を同期。parity 確認対象 | Gate-C は external ops 後 |
| 1-B | 実装状況テーブル（`system-spec-update-summary.md`） | dismiss optimistic / rollback / render guard 統合 = `implemented_local_evidence_captured` で記録 | 実装済み |
| 1-C | 関連タスクテーブル（同上） | Issue #1042 CLOSED / 親 #988 implemented / fade animation 別 followup を記録 | Issue 状態は変更しない（CLOSED 維持） |
| Step 2 | aiworkflow-requirements interfaces / api-ipc 正本 | **該当なし**（新規 IF なし、N/A 判定） | 不要 |

---

## ブロック 2 — global skill sync

| 対象 | 本サイクルの結果 | 残境界 |
| --- | --- | --- |
| `aiworkflow-requirements/LOGS/_legacy.md` | headline 追記（**同期済み**） | 実コード wave で確定 |
| `task-specification-creator` | 新規 rule 追加なし。既存の同一 wave 実装・Phase 11/12 close-out ルールで吸収 | 変更なし |
| aiworkflow-requirements task-workflow-active / quick-reference / resource-map | Issue #1042 implemented_local_evidence_captured を current fact として追記（**同期済み**） | topic-map / keywords は `indexes:rebuild` で冪等同期 |
| topic-map / keywords.json | `pnpm indexes:rebuild` で冪等再生成（**同期済み**） | drift 0 を確認 |
| `.agents/skills/` mirror parity | skill 本体変更なし。LOGS/index 追記のみのため mirror 対象外（symlink ミラー自明一致） | skill 本体変更が発生した場合のみ mirror 同期 |

> skill sync は同一 wave で同期済み。SKILL-changelog dated 行も追加済み。

---

## ブロック 3 — 成果物 parity 確認

| 確認項目 | 結果 |
| --- | --- |
| strict 7 outputs（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） | 7 件すべて present |
| `outputs/artifacts.json` の `phase_12_outputs` と実体ファイルの 1:1 突合 | 一致 |
| Phase 11 screenshot canonical 名（3 枚）の implementation-guide / phase-1 spec 間の一致 | 一致（`identity-conflict-row-dismiss-confirm.png` / `-dismiss-optimistic-removed.png` / `-dismiss-rollback-error.png`）。status は **captured** |

> 本サイクルは commit / push を行わない。実コード差分・local focused evidence・screenshot・台帳同期は同一サイクルで確定済みで、残る user-gated 境界は commit / push / PR のみ。

## 完了条件

- ブロック 1（workflow-local）/ ブロック 2（global skill sync）/ ブロック 3（parity）がそれぞれ独立ブロックで記載されていること。
- 全 Step（1-A / 1-B / 1-C / Step 2）の結果が「該当なし」を含め個別に記録されていること。
- skill sync が implemented_local_evidence_captured として記録されていること。
