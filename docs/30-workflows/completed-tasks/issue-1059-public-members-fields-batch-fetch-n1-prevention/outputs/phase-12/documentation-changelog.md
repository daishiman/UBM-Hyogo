# Documentation Changelog

| 日付 | 対象 | 変更 |
| --- | --- | --- |
| 2026-06-02 | workflow artifacts | Phase 4-12 を implemented evidence captured 状態へ同期し、Phase 12 strict 7 を追加 |
| 2026-06-02 | aiworkflow-requirements | #1059 workflow を active ledger / indexes / artifact inventory / LOGS / changelog に登録 |
| 2026-06-02 | source unassigned | #224 U-2 を #1059 で consumed として記録 |
| 2026-06-02 | implementation guide | 実コードの `readonly ResponseId[]`、local placeholder join、`asResponseId`、`fieldsByResponseId` に合わせて補正 |
| 2026-06-02 | review addendum | quick-reference の issue-991 / issue-224 / issue-1059 セクション drift を補正し、`pnpm indexes:rebuild -- --quiet` で generated indexes を再同期 |

## 該当なし

公開 API 仕様、DB schema、Google Form 仕様、`apps/web` UI 仕様の変更履歴は不要。出力 contract は変えていない。
