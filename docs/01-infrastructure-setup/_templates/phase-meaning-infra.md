# インフラ文脈での Phase 意味定義

- docs-first package として扱う。
- Phase 5 も実値ではなく runbook と placeholder を基本とする。
- Phase 12 は docs-only / spec_created 前提で Step 1-A〜1-C を same-wave sync で閉じる。
- Phase 13 は user approval があるまで blocked とみなす。

| Phase | 意味 |
| --- | --- |
| 1 | 正本仕様と要求を照合し、scope と AC を固定する |
| 2 | branch / env / runtime / data / secret の設計を diagrams と tables で固める |
| 3 | simpler alternative を含めてレビューする |
| 4 | verify suite を先に作る |
| 5 | runbook と placeholder を作成する |
| 6 | failure case を洗う |
| 7 | AC と validation を一対一対応させる |
| 8 | naming / wording / path を DRY 化する |
| 9 | 品質・無料枠・secret hygiene を確認する |
| 10 | GO/NO-GO を出す |
| 11 | manual smoke で人が迷わないか確認する |
| 12 | implementation guide / changelog / unassigned / compliance check を閉じる |
| 13 | 承認後のみ PR 化する |
