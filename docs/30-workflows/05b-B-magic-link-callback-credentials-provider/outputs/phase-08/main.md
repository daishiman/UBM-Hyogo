# Output Phase 8: DRY 化

## status

EXECUTED

## 重複候補と対応

| 候補 | 既存 | 今回追加 | 対応 |
| --- | --- | --- | --- |
| API base 解決 | `magic-link/route.ts`、`magic-link/verify/route.ts` の `resolveApiBase` | `verify-magic-link.ts` の `resolveApiBase` | 各 route が POST proxy で body をパススルーする責務、helper は server-to-server で型付き呼び出しを行う責務。3 箇所の関数は同一 logic だが 5 行・依存ゼロのため共通化は YAGNI と判断 |
| Email 検証 | `EmailZ`（`apps/api`） | `route.ts` の `isValidEmail` | apps/web では zod 依存を避け軽量 regex のみ。upstream で再検証されるため二重検証として機能 |
| Session user shape | `SessionUser`（shared）、`SessionUserResponse`（apps/api） | `VerifyMagicLinkUser`（web local） | 将来 shared への昇格余地あり。現段階では web 側の依存を増やさず、3 フィールドのみ参照する閉じた型として保持 |

## リファクタリング所見

- helper / route / provider 各層に責務が単一化されており、追加 abstraction は不要と判断。
- magic-link 系 proxy（POST）と callback（GET）は責務が異なり統合しない。
