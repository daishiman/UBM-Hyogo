# Phase 11 — 手動 smoke main

## 状態

ローカル / staging 環境への deploy はユーザの実行範囲。本 Phase では smoke 手順と期待値を `manual-evidence.md` にテンプレ化し、ユーザが実行した結果を後追いで反映できる形にする（タスク仕様書の Phase 11 完了条件: 各 endpoint で 1 回以上の smoke 実施を、ユーザの後続作業で履行）。

## 実施対象

- `GET /public/stats`
- `GET /public/members?q=engineer&zone=0_to_1&tag=ai&page=1&limit=10`
- `GET /public/members/:memberId`（適格 / 不適格 各 1 件）
- `GET /public/form-preview`

## 確認観点

1. ステータスコードと JSON shape が AC に一致する。
2. `Cache-Control` header が AC-12 に一致する。
3. profile leak: response body に `responseEmail / rulesConsent / adminNotes` が含まれない。
4. 不適格 memberId が 404 で返り、本文に member 情報を含めない。
5. 認証 cookie 無しで 200 が返る (AC-9)。

## 完了条件

- [ ] `manual-evidence.md` にユーザが実行ログを貼付（後続作業）。
- [ ] 各 endpoint × 正常系 / 異常系で expected 一致。
