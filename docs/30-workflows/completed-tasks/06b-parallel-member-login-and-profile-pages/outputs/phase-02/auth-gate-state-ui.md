# AuthGateState ↔ UI 対応

| state | Banner | 主 CTA | 副 CTA |
| --- | --- | --- | --- |
| `input` | なし | MagicLinkForm + Google OAuth ボタン | `/register` link |
| `sent` | success | 「メールをご確認ください」+ 60s cooldown | 別メールで再送 |
| `unregistered` | warn | `/register` ボタン | お問い合わせ |
| `rules_declined` | warn | Google Form responderUrl | `/register` 説明 |
| `deleted` | error | 管理者問い合わせ link | （ログイン不可、form 非表示） |

## 設計上の不変条件

- 5 状態は switch case で網羅（exhaustiveness check 必須）
- `deleted` 状態では MagicLinkForm / GoogleOAuthButton を一切描画しない
- `sent` 状態では URL から email を即座に削除（`history.replaceState`、不変条件 #8 + privacy）
