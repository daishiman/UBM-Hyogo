# link-checklist

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-1069-tag-code-rename` |
| status | completed |

## 目的

Phase 11 evidence と Phase 12 close-out の参照先が実在することを確認する。

## 実行タスク

- Phase 11 evidence files の実在を確認する。
- Phase 12 strict outputs の実在を確認する。
- user-gated 境界の参照先を確認する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/outputs/artifacts.json`
- `docs/30-workflows/completed-tasks/issue-1069-tag-code-rename/outputs/phase-12/phase12-task-spec-compliance-check.md`

## 成果物

| Path | Status |
| --- | --- |
| `outputs/phase-11/main.md` | present |
| `outputs/phase-11/phase-11.md` | present |
| `outputs/phase-11/manual-test-result.md` | present |
| `outputs/phase-11/manual-smoke-log.md` | present |
| `outputs/phase-11/link-checklist.md` | present |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | present |

## 統合テスト連携

Phase 11 の evidence は local deterministic command に限定し、staging runtime は user-gated として Phase 13 境界に残す。

## 完了条件

- [x] Phase 11 canonical and helper files are present
- [x] Phase 12 strict output reference is present
- [x] user-gated boundary is recorded
