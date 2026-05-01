# Phase 2 Output: 設計

## 決定事項

- session 確立は 05a/05b の既存機構を使い、本タスクでは新規 secret を導入しない。
- DevTools 出力は `location.pathname + location.search` のみを記録し、host / protocol / Cookie / storage を含めない。
- evidence 命名は `outputs/phase-02/evidence-naming.md` を正本にする。

## 引き継ぎ

- Phase 4 は canonical 10 evidence files（6 screenshots + 3 DevTools txt + 1 diff）と Phase 11 補助 metadata を checklist 化する。
- Phase 5 はこの設計を runbook と snippet に展開する。
