# Phase 7: カバレッジ

## カバレッジ目標

| Layer | Target |
| --- | --- |
| pure config | branch 100% (`viewer` / `member` / `admin`, schemaDiff 0/positive) |
| hooks | localStorage read/write and SSR branch covered |
| components | role rendering, collapsed rendering, drawer open/close covered |
| layouts | auth states and redirects covered |

## 完了条件

focused component/hook/layout tests が role と viewport contract を落とさず、coverage 未達がある場合は Phase 12 で未タスク化せず同一 execution wave で補完する。
