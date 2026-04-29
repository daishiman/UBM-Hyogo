# Phase 8: DRY 化方針

## 結論: **YAGNI — 本タスク内では抽象化しない**

## 判定

| 観点 | 評価 |
| --- | --- |
| 現時点での再利用箇所数 | 1（Sheets API のみ）|
| 将来の追加候補 | Google Drive API（UT 未定義）/ Calendar API（未定義）|
| 抽象化コスト | `GoogleServiceAccountAuthBase` などの基底を導入すると test 容易性低下・型推論劣化 |
| CLAUDE.md 準拠 | 「3 similar lines is better than a premature abstraction」「Don't design for hypothetical future requirements」 |

→ **本タスクでは Sheets 専用の `getSheetsAccessToken()` のみを公開**。Drive / Calendar が追加されたタイミングで 3 箇所以上の重複が発生したら抽象化する（reactive abstraction）。

## redact / retry / cache はモジュール内 private util に留める

| util | 配置 |
| --- | --- |
| `redact(s)` | `packages/integrations/google/_internal/redact.ts`（private） |
| `withBackoff(fn)` | `packages/integrations/google/_internal/backoff.ts`（private）|
| token cache | `packages/integrations/google/src/sheets/auth.ts` 内 closure |

private util は `index.ts` から re-export しない（外部からの使用禁止）。

## 将来の抽象化トリガー

以下のいずれかが満たされた時点で Phase 8 を再開する:

1. Drive API or Calendar API の認証実装が新タスクで発生
2. 同一 SA で 2 つ以上の Google API を叩く必要が出る
3. retry / redact ロジックが 3 箇所以上で再利用される

## 完了条件

- [x] YAGNI 判定理由が明記
- [x] 将来の抽象化トリガーが定義
- [ ] before/after は **不要**（抽象化しないため）
