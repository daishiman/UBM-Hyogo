# Phase 9: QA

**[実装区分: 実装仕様書]**
**Workflow**: step-07-requests-approve-reject
**前提 Phase**: phase-8-refactor
**次 Phase**: phase-10-final-review

## 目的

automated test ではカバーしきれない手動 QA 観点と edge case を網羅し、phase-11 manual-test の事前チェックリストとする。

## 手動シナリオ（admin login 必須）

| # | シナリオ | 期待 |
|---|---|---|
| QA-01 | visibility_request 一覧から item 選択 → approve → submit | toast 成功 + list から除外 |
| QA-02 | visibility_request → reject → 理由入力 → submit | toast 成功 + list から除外 |
| QA-03 | reject → 理由空 → submit | inline validation error / 送信されない |
| QA-04 | delete_request 一覧から item 選択 → approve | dialog 警告色 + 文言「削除リクエスト承認」 |
| QA-05 | dialog 開いたまま別タブで同 item を解決 → 元タブで submit | 409 toast「他の管理者が既に処理済みです」+ refresh |
| QA-06 | dialog 開いた状態で ESC | dialog 閉じる |
| QA-07 | submit 中に cancel | cancel disabled / 押せない |
| QA-08 | 500 文字超の reject 理由入力 | validation error |
| QA-09 | reject 理由 500 文字ちょうど | submit 可能 |
| QA-10 | 公開申請なし状態 | empty state 表示 |

## edge case

| # | ケース | 期待挙動 |
|---|---|---|
| EC-01 | network 断 | toast「処理に失敗しました」 |
| EC-02 | API 5xx | toast「処理に失敗しました」 |
| EC-03 | 高速連打 (approve 連続押下) | mutation in-flight 中 disabled で 2 重発火しない |
| EC-04 | キーボード操作のみ | tab で list → detail → approve/reject → dialog form 到達 |
| EC-05 | スクリーンリーダ (VoiceOver / NVDA) | dialog 開閉と submit 結果が announce される |

## ブラウザ matrix

| browser | version | 結果 |
|---|---|---|
| Chrome | latest stable | dialog ネイティブサポート |
| Safari | 17.4+ | ネイティブサポート |
| Firefox | latest | ネイティブサポート |

iOS 17 未満は admin 対象外（CLAUDE.md UI prototype alignment スコープ）。

## 出力

- phase-11 で manual-smoke-log.md に上記 QA-01〜QA-10 / EC-01〜EC-05 結果を記録（NON_VISUAL のため screenshot は任意）
