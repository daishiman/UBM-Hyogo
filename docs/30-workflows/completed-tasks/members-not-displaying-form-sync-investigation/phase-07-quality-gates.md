# Phase 7: 品質ゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | members-not-displaying-form-sync-investigation |
| phase | 07 |
| state | implemented_local_runtime_pending |

## 目的

この Phase は Google Form response sync から public members 表示までの修復仕様とローカル実装状態を検証可能な形へ固定する。

## 実行タスク

- 既存実装との差分を仕様に反映する。
- ローカル実装済み項目は Gate-B passed、staging runtime 操作は Gate-C pending として明示する。

## 参照資料

- phase-05 / Phase 5
- phase-06 / Phase 6
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `.claude/skills/aiworkflow-requirements/references/workflow-members-not-displaying-form-sync-investigation-artifact-inventory.md`

## 成果物

- 本 Phase ファイル

## 完了条件

- [x] 必須セクションが存在する。
- [x] Phase 固有本文が後続セクションに保持されている。


## CI gates（既存）

| Gate | 通過条件 |
|------|---------|
| `pnpm typecheck` | green |
| `pnpm lint` | green |
| `pnpm test`（api workspace） | 全 spec green、新規 spec 含む |
| `pnpm build` | green |
| `verify-test-suffix` | `*.spec.ts` 命名のみ（不変条件 #8） |
| `verify-design-tokens` | UI 変更なしで対象外 |
| `verify:phase12-compliance` | 本 workflow root strict 7 / canonical 9 headings |
| `gate-metadata:validate` | artifacts.json zod schema OK |
| `indexes-up-to-date` | drift なし |

## Workflow gates

| Gate | 内容 |
|------|------|
| Gate-A: spec ready | Phase 1-13 + tasks 3 全 file 存在、内部リンク 200 |
| Gate-B: implementation local | 全 unit test green、`pnpm build` green |
| Gate-C: staging runtime | diagnostic script で `visiblePublicCount > 0`、`/members` browser smoke で 1 件以上表示（user-gated） |

## Manual review checklist

- [ ] `MEMBERS_AUTO_PUBLISH_ON_CONSENT` の production default が `"false"` であること
- [ ] backfill script の default が `--dry-run`（明示 `--apply` 無しでは書き込まない）
- [ ] admin override の判定が `member_status.updated_by` と `publish_state='hidden'` だけで行われ、存在しない history table に依存していないこと
- [ ] policy 純関数が DB に触れていないこと（unit test しやすさ確保）
