# Output Phase 6: 異常系検証

## status

EXECUTED

## Failure Matrix（実装版検証）

| ケース | 入力 | 期待 redirect | 実装挙動 | route test |
| --- | --- | --- | --- | --- |
| token missing | email only | `/login?error=missing_token` | 早期 303 redirect、verify 呼ばず | PASS |
| email missing | token only | `/login?error=missing_email` | 早期 303 redirect、verify 呼ばず | PASS |
| token 形式違反 | hex64 でない | `/login?error=invalid_link` | 早期 303 redirect | PASS |
| email 形式違反 | RFC email shape 不一致 | `/login?error=invalid_link` | 早期 303 redirect | PASS |
| expired | API ok=false reason=expired | `/login?error=expired` | mapVerifyReasonToLoginError | PASS |
| already_used | API ok=false reason=already_used | `/login?error=already_used` | 同上 | PASS |
| not_found | API ok=false reason=not_found | `/login?error=invalid_link` | 同上（user enumeration 抑制） | PASS |
| resolve_failed | API ok=false reason=resolve_failed | `/login?error=resolve_failed` | 同上 | PASS |
| API unavailable | fetch throw / non-JSON | `/login?error=temporary_failure` | fail-closed | PASS |
| 不明 reason | API が予期しない reason | `/login?error=resolve_failed` | helper で正規化 | unit test PASS |

## セキュリティ確認

- token / email は応答 body にもログにも転記しない（route は redirect のみ）。
- redirect は `new URL("/login", req.url)` で同 origin に限定。
- 失敗 reason は AC-3 で定義した allowlist 識別子のみ。enumerate を助長する詳細は出さない。
- session cookie は `signIn("magic-link", ...)` 成功時のみ set。失敗パスでは cookie 操作を行わない。
