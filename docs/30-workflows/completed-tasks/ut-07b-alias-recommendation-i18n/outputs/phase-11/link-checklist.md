# Phase 11 — link checklist（NON_VISUAL）

[実装区分: 実装仕様書 / 実行済み]

## 対象

`docs/30-workflows/ut-07b-alias-recommendation-i18n/` 配下の workflow 内リンク整合確認。

## チェック項目

| 起点 | リンク先 | 判定 |
| --- | --- | --- |
| `index.md` | `phase-01.md` 〜 `phase-13.md` | PASS |
| `artifacts.json` | Phase 1-12 outputs | PASS |
| `phase-NN.md` 内の `outputs/phase-MM/...` 相対参照 | 実ファイル | PASS（Phase 1-12 実体化済み） |
| `phase-12.md` | `docs/00-getting-started-manual/specs/01-api-schema.md` | PASS |
| `phase-12.md` | `docs/30-workflows/completed-tasks/UT-07B-alias-recommendation-i18n-001.md` | PASS |

## 確認コマンド

```bash
# 相対リンク抽出して存在確認（参考）
grep -rohE '\]\(([^)]+\.md)\)' docs/30-workflows/ut-07b-alias-recommendation-i18n
```

## 完了確認

- [x] index.md から全 phase へ到達可能
- [x] phase-12 で参照する spec / ledger / aiworkflow-requirements path が解決する
- [x] dangling link なし
