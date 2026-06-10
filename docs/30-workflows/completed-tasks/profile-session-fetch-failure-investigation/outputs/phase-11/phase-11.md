# Phase 11: 手動テスト検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| workflow_state | implemented_local_evidence_captured |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`/profile` の session fetch failure を 410 / 5xx / transport failure に切り分けられることを、local focused tests と staging user-gated 手順に分けて記録する。

## 実行タスク

1. local focused tests の結果を `manual-test-result.md` に記録する。
2. visual screenshot は `phase11-capture-metadata.json` で pending 境界を記録する。
3. staging 認証が必要な `/me` status / D1 read-only 確認は user-gated として手順のみ固定する。

## 成果物

- `manual-test-result.md`
- `manual-test-report.md`
- `discovered-issues.md`
- `ui-sanity-visual-review.md`
- `screenshot-plan.json`
- `phase11-capture-metadata.json`

## 完了条件

- [x] local focused tests PASS を記録する。
- [x] staging user-gated 境界を記録する。
- [x] screenshot pending metadata を記録する。

## 統合テスト連携

focused Vitest は `/profile` page、`mapProfileSessionErrorToDisplay` 純関数、member `SectionError`、`safeServerFetch` の4系統で実施する。

## 参照資料

- `manual-test-result.md`
- `../phase-12/phase12-task-spec-compliance-check.md`
