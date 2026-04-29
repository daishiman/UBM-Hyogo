# AC × test ID × runbook step × failure × 不変条件

| AC | 内容 | test ID | runbook step | failure | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| AC-1 | `/login` 5 状態の UI 出し分け | U-01, U-02, E-01〜E-06 | 2 (LoginPanel switch) | F-01, F-02, F-14 | #8, #9 |
| AC-2 | Magic Link 送信 → `state="sent"` 遷移 + 60s cooldown | U-03, C-01, E-02 | 2 (MagicLinkForm) | F-03, F-17 | - |
| AC-3 | Google OAuth ボタン → callback redirect | C-02, E-03 | 2 (GoogleOAuthButton) | F-05 | - |
| AC-4 | `unregistered` で `/register` CTA、`/no-access` 不遷移 | E-04 | 2 (case unregistered) | - | #9 |
| AC-5 | `rules_declined` で responderUrl CTA | E-05 | 2 (case rules_declined) | - | #2, #4 |
| AC-6 | `deleted` で 管理者連絡 + ログイン form 非表示 | E-06 | 2 (case deleted) | F-14 | #9 |
| AC-7 | 未ログイン `/profile` → `/login?redirect=/profile` | E-07 | 1 (middleware) | F-06, F-07 | #5, #9 |
| AC-8 | `/profile` に編集 form / button 不在 | S-04, E-08 | 3 (Server only render) | F-13, F-15 | #4, #11 |
| AC-9 | `/profile` editResponseUrl ボタン + responderUrl リンク | E-09 | 3 (EditCta) | F-10 | #4 |
| AC-10 | `/profile` 状態サマリ（rulesConsent / publicConsent / publishState / 参加履歴） | E-10 | 3 (StatusSummary) | F-16 | #2 |
| AC-11 | profile field は stableKey 経由参照のみ、questionId 直書き 0 | S-01 | 3 (ProfileFields) | - | #1 |
| AC-12 | `localStorage` を session / route の正本にしない | S-02 | 4 (ESLint rule) | F-15 | #6, #8 |

## 未トレース 検出

| AC | 状態 | 備考 |
| --- | --- | --- |
| AC-1〜AC-12 | 全て trace 済 | test ID と runbook step の両方に対応あり |

## 不変条件 → AC マッピング

| 不変条件 | 対応 AC | 担保 |
| --- | --- | --- |
| #1 (schema 固定しない) | AC-11 | stableKey 参照のみ |
| #2 (consent キー統一) | AC-5, AC-10 | publicConsent / rulesConsent 表記固定 |
| #4 (本人本文編集は Google Form 経由) | AC-8, AC-9 | 編集 form 不在 + responderUrl / editResponseUrl 提供 |
| #5 (apps/web から D1 直接禁止) | AC-7, AC-8 | RSC fetch は 04b / 05b 経由のみ |
| #6 (GAS prototype 非昇格) | AC-12 | window.UBM / localStorage 不採用 |
| #7 (responseId と memberId 混同なし) | AC-7, AC-8 | session.memberId のみ参照 |
| #8 (localStorage 非正本) | AC-1, AC-12 | URL query 正本 |
| #9 (`/no-access` 不採用) | AC-4, AC-6, AC-7 | `/login` で 5 状態を吸収 |
| #10 (Cloudflare 無料枠) | - | Phase 9 で定量検証 |
| #11 (他人本文編集禁止) | AC-8 | 本タスクで本人含め編集 UI なし |
