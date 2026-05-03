# Phase 10: 最終レビュー — ut-web-cov-02-public-components-coverage

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-02-public-components-coverage |
| phase | 10 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 9 までの結果を踏まえ、CONST_005 充足 / unassigned-task-detection / コードレビュー観点で final gate を実施する。

## 参照資料

- 起票根拠: 2026-05-01 実測 apps/web coverage（lines=39.39%）
- docs/00-getting-started-manual/specs/00-overview.md
- docs/00-getting-started-manual/claude-design-prototype/
- phase-12 unassigned-task-detection（outputs/phase-12/unassigned-task-detection.md）

## CONST_005 self-check checklist

- [ ] 変更ファイル一覧が phase-09 / phase-12 implementation-guide に列挙されている
- [ ] 各テスト関数のシグネチャ（`describe`/`it` 名、async/await 有無）が一貫している
- [ ] 入力 fixture と出力 assertion がコード上で対応付いている
- [ ] happy / empty / interaction-or-variant の 3 ケースが component ごとに揃っている
- [ ] `mise exec -- pnpm typecheck` / `lint` / `--filter @ubm-hyogo/web test:coverage` 3 コマンドが Phase 9 で全 green
- [ ] DoD（threshold 達成 + regression なし）を `coverage-summary.json` で確認した

## phase-12 unassigned-task-detection 連携

- Phase 12 で生成する `unassigned-task-detection.md` が 0 件、または検出した未割当テストが本タスク scope 外であることを Phase 10 で確認する。
- scope 内に未割当が残る場合は Phase 5 にループバックし、再度 verify suite を回した上で Phase 10 を再実行する。

## code review focus points

| 観点 | 確認内容 |
| --- | --- |
| mock の漏れ | `next/navigation` / `next/link` / `next/image` などを `vi.mock` で stub しているか。実 fetch / D1 binding に依存していないか |
| async 待機漏れ | `await screen.findBy*` / `await user.click(...)` / `await waitFor(...)` を必要箇所で使い、`act(...)` 警告が出ていないか |
| snapshot 排除 | `toMatchSnapshot` / `toMatchInlineSnapshot` を使っていないか。明示 assertion (`toBeInTheDocument` / `toHaveAttribute` / `toHaveTextContent`) を採用しているか |
| 不変条件 #2 | fixture が `responseId` と `memberId` を混在させない |
| 不変条件 #5 | public component test に member/admin 用 mock が混入していない |
| 不変条件 #6 | apps/web からの D1 直接アクセスを誘発する import がない |
| 命名 | テストファイル名は `<Component>.test.tsx`、describe 名は component 名と一致 |
| flaky 防止 | timer / random は `vi.useFakeTimers` / `vi.spyOn(Math, 'random')` で固定 |

## 実行手順

1. CONST_005 checklist を上から順に確認する。
2. unassigned-task-detection.md を読み、scope 内 0 件であることを確認する。
3. code review focus points を 1 項目ずつ追加 test ファイルへ照合する。
4. 不備があれば Phase 5 / Phase 9 にループバックする。
5. 結果を outputs/phase-10/main.md に記載する。

## 統合テスト連携

- 上流: phase-09 verify suite
- 下流: phase-11 evidence capture

## 多角的チェック観点

- #2 responseId/memberId separation
- #5 public/member/admin boundary
- #6 apps/web D1 direct access forbidden
- 未実装/未実測を PASS と扱わない
- placeholder と実測 evidence を分離する

## サブタスク管理

- [ ] CONST_005 self-check を実施
- [ ] unassigned-task-detection を確認
- [ ] code review focus を全項目チェック
- [ ] outputs/phase-10/main.md に結果を記録

## 成果物

- outputs/phase-10/main.md

## 完了条件

- CONST_005 全項目 OK
- code review focus 全項目 OK
- scope 内 unassigned 0 件
- 既存 web test に regression なし

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ最終レビュー結果と evidence capture 対象パスを渡す。
