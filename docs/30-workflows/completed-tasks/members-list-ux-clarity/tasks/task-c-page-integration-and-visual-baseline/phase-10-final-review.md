<!-- workflow: members-list-ux-clarity / task: C / phase: 10 -->

[実装区分: 実装仕様書]

# Phase 10 — 最終レビュー (Task C)

## 1. レビュー観点

| 観点 | 確認 |
| ---- | ---- |
| Phase 1 AC (C-AC-1..C-AC-8) | すべて Phase 5 実装で充足 |
| 親 workflow AC (AC-4 / AC-7 / AC-8 / AC-9) | 本 task で対応する範囲が Phase 1 §4 表に明示 |
| 不変条件 (INV-1..6) | Phase 9 QA でチェックリスト化 |
| Task A/B 依存 | Phase 5 § 2 で事前確認手順を明示 |
| both-or-none preflight | Phase 5 § 7 で baseline と spec の同一 PR 制約を明示 |
| D'+0 リセット運用 | Phase 5 § 7 で Linux runner baseline 正本を明示 |
| 1 サイクル完了 (CONST_007) | LOC +200 / -11 / 新 primitive 0 / 新 project 0 |

## 2. 統合 PR との関係

- Task A / Task B / Task C は同一 branch (`feat/members-list-ux-clarity`) で開発
- 単一 PR (`dev` base) でまとめて統合する
- Phase 13 で PR 本文に Task A/B/C それぞれの責務と AC を記述

## 3. ロールバック観点

| シナリオ | 対応 |
| -------- | ---- |
| visual baseline が flaky で CI が落ち続ける | mask 対象拡張 (`result-count` mask 追加) → 再撮影 |
| Task B prop API が想定と異なる | page.tsx 側で `MemberFilters` 呼び出しの型修正、必要なら Task B 側修正依頼 |
| `pagination-meta` `aria-hidden` で既存 spec が落ちる | aria-hidden 付与位置を `<span>` ラップに変更、または既存 spec の expect を更新 |

## DoD

- [x] レビュー観点が AC / 不変条件 / 依存 / 運用方針 / サイクル制約の 5 軸でチェック済
- [x] 統合 PR との関係が記述されている
- [x] ロールバックシナリオが列挙されている
