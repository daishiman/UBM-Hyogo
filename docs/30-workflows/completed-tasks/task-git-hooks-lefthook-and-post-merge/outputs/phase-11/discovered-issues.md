# Phase 11 — discovered-issues

## Status

completed

| ID | 内容 | 影響 | 対応 |
| --- | --- | --- | --- |
| P0-01 | `post-fetch` lane が lefthook schema で無効 | `lefthook validate` 失敗 | `post-fetch` lane を削除し、仕様・運用ガイドを supported hook のみへ同期 |
| P0-02 | pre-commit guard が task directory を第3階層固定で誤判定する | 正当な task docs が block される | workflow 構造別に task root を抽出し、branch/task slug を token overlap で判定 |
| P1-01 | 旧分類表記が実装差分と矛盾 | Phase 12 N/A 判定が破綻 | artifacts / phase本文 / outputs / system spec を implementation / NON_VISUAL へ同期 |
| P1-02 | CI index drift gate が未実装 | index 鮮度保証が local 運用依存になる | `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md` を正式作成 |

## 未解決

CI `verify-indexes-up-to-date` job の実装のみ未解決。正式未タスクに分離済み。

