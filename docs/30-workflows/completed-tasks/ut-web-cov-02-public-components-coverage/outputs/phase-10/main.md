# outputs phase 10: ut-web-cov-02-public-components-coverage

- status: implemented-local
- purpose: 最終レビュー (CONST_005 / unassigned-task-detection / code review focus)

## CONST_005 self-check 概要

| 項目 | 確認方法 |
| --- | --- |
| 変更ファイル | phase-09 / phase-12 implementation-guide で列挙 |
| シグネチャ | describe / it 名と async/await の一貫性 |
| 入出力 | fixture 入力と assertion 出力の対応 |
| テスト | happy/empty/variant 3 ケース有 |
| コマンド | typecheck / lint / test:coverage 全 green |
| DoD | threshold 達成 + regression なし |

## code review focus

- mock の漏れ（next/navigation, next/link, next/image stub）
- async 待機漏れ（findBy / waitFor / await user.click）
- snapshot 排除（toMatchSnapshot 禁止、明示 assertion 採用）
- 不変条件 #2 / #5 / #6 違反の不在

## unassigned-task-detection 連携

- outputs/phase-12/unassigned-task-detection.md を確認
- scope 内 0 件で Phase 11 へ進める

## evidence

- 実装・実測時 capture: review checklist 結果
- Phase 11 measured evidence captured.
