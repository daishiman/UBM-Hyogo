# phase12-task-spec-compliance-check

## 目的

task-specification-creator skill の Phase 12 必須 7 ファイル（main + 5 必須タスク + compliance check 自身）が `outputs/phase-12/` 配下に実体存在することを確認する。あわせて spec_created 段階のため、Phase 11 実 smoke evidence は planned output として分離する。

## チェックリスト

| # | ファイル | 必須 | 実体存在 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | ✓ | [x] |
| 2 | `outputs/phase-12/implementation-guide.md` | ✓ | [x] |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | ✓ | [x] |
| 4 | `outputs/phase-12/documentation-changelog.md` | ✓ | [x] |
| 5 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも必須） | ✓ | [x] |
| 6 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも必須） | ✓ | [x] |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md`（本ファイル） | ✓ | [x] |

## 検証コマンド（参考）

```bash
ls -1 docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke/outputs/phase-12/ | sort
```

期待結果（7 行）:
```
documentation-changelog.md
implementation-guide.md
main.md
phase12-task-spec-compliance-check.md
skill-feedback-report.md
system-spec-update-summary.md
unassigned-task-detection.md
```

## index.md outputs リストとの照合

`index.md` の outputs セクションに記載の Phase 12 ファイル群:

- `outputs/phase-12/main.md` ✓
- `outputs/phase-12/implementation-guide.md` ✓
- `outputs/phase-12/system-spec-update-summary.md` ✓
- `outputs/phase-12/documentation-changelog.md` ✓
- `outputs/phase-12/unassigned-task-detection.md` ✓
- `outputs/phase-12/skill-feedback-report.md` ✓
- `outputs/phase-12/phase12-task-spec-compliance-check.md` ✓

**Phase 12 outputs は完全一致**。

## Phase 11 planned evidence の扱い

以下 3 ファイルは Phase 11 smoke 実行時に生成する planned evidence であり、spec_created 段階の実体存在チェック対象には含めない。

- `outputs/phase-11/evidence/local-curl.log`
- `outputs/phase-11/evidence/staging-curl.log`
- `outputs/phase-11/evidence/staging-screenshot.png`

root `artifacts.json` では `metadata.planned_evidence_outputs` に集約し、Phase 11 の `outputs` は `main.md` と `evidence/` ディレクトリのみを実体チェック対象にする。

## root / outputs artifacts parity

- root `artifacts.json`: 存在
- `outputs/artifacts.json`: 存在
- 判定: root `artifacts.json` と `outputs/artifacts.json` を同期済み。

## aiworkflow-requirements 同一 wave 反映

- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`: current active task として登録
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`: UBM-Hyogo タスクワークフロー inventory に登録
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`: 06a follow-up smoke 早見導線を登録

## 判定

- Phase 12 required files: 7/7 OK
- Phase 11 actual evidence: pending by design（planned evidence）
- validator実測: 実行済み（詳細は本レビュー最終報告を参照）
- compliance check status: **SPEC_CREATED_PASS_WITH_PENDING_SMOKE_AND_VALIDATOR_RECHECK**

## 不変条件 trace（再確認）

- 不変条件 #5: implementation-guide / system-spec-update-summary 双方で `apps/web` → `apps/api` → D1 経路を明記済み
- 不変条件 #6: GAS prototype を smoke 対象外として明記済み

## Issue #273 の取り扱い再確認

- documentation-changelog.md / 後続 Phase 13 pr-template.md ともに `Refs #273` 表記固定
- `Closes #273` 表記が含まれていないことを目視確認済み
- Issue 再オープン記述: 含まれない
