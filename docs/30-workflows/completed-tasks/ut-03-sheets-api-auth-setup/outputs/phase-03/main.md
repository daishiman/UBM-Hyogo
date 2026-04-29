# Phase 3 成果物 — 設計レビュー (UT-03 Sheets API 認証方式設定)

## 1. レビュー対象

- Phase 2 設計: `docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-02/main.md`
- 採択 base case: Service Account JSON key + Web Crypto API（自前実装）+ TTL 1h キャッシュ + `packages/integrations/google/src/sheets/auth.ts` モジュール

## 2. 代替案サマリ（詳細は `alternatives.md`）

| 案 | 概要 | 採否 |
| --- | --- | --- |
| A | 自前実装 SA + Web Crypto API + TTL 1h キャッシュ | 採択（base case） |
| B | OAuth 2.0（offline access + refresh_token 永続化） | 却下 |
| C | `google-auth-library` (Node.js 公式) | 却下 |
| D | Workers 互換 JWT ライブラリ（`@tsndr/cloudflare-worker-jwt` / `jose`） | 却下（将来候補として保持） |

## 3. PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | base case の判断軸を満たす。Phase 4 へ進める。 |
| MINOR | Phase 5 実装時に補足対応（runbook / log 追記）が必要。Phase 4 移行は許可。 |
| MAJOR | block。Phase 2 へ差し戻すか open question 化。 |

## 4. 代替案 × 評価マトリクス

| 観点 | 案 A (base) | 案 B (OAuth 2.0) | 案 C (google-auth-library) | 案 D (Workers JWT lib) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | MINOR（同意 UI 開発で価値の出発が遅延） | PASS | PASS |
| 実現性 | PASS | MAJOR（refresh_token 永続化設計が必要） | MAJOR（Node API 依存で Workers 不動作） | PASS |
| 整合性（不変条件 #1/#4/#5） | PASS | MINOR（refresh_token を D1/KV に置く設計が #5 を圧迫） | PASS | PASS |
| 運用性 | PASS | MINOR（refresh_token 失効時の再同意 UI 運用） | MAJOR（実行不能） | PASS |
| Edge Runtime 互換 | PASS | PASS | MAJOR（`fs` / Node `crypto` 依存） | PASS |
| Secret hygiene | PASS | MINOR（永続 refresh_token の漏洩面積） | PASS | PASS |
| 無料枠 | PASS | MINOR（KV / D1 storage 消費） | PASS | PASS |
| 不変条件 #5 | PASS | MINOR（refresh_token を D1 に置く場合 utility パッケージから D1 に手が伸びる懸念） | PASS | PASS |

## 5. base case（案 A）最終判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 / UT-21 が再利用可能、運用ゼロ |
| 実現性 | PASS | 01c 完了済、Web Crypto API は Workers ネイティブ |
| 整合性 | PASS | 不変条件 #1/#4/#5 + CLAUDE.md Secret 運用ルール遵守 |
| 運用性 | PASS | TTL 1h キャッシュ + 1Password 集中管理 + runbook |
| Edge Runtime 互換 | PASS | Node API 非依存、Web Crypto のみ |
| Secret hygiene | PASS | 1Password `op://` 参照のみ、`.env` 平文禁止 |
| 無料枠 | PASS | 追加ストレージ不要、token 交換月数十回 |
| 不変条件 #5 | PASS | D1 を触らない |

## 6. 案 D（Workers 互換 JWT ライブラリ）の扱い

案 D は全観点 PASS だが、本タスクでは案 A を採択する。理由:

- 自前実装の規模が小さい（JWT 生成 + token 交換 + キャッシュで <200 行想定）。外部依存導入のメンテナンスコスト（脆弱性対応 / バージョン追従）の方が大きい。
- ライブラリの一部（`jose` 等）は token 交換まではカバーしないため、結局 token 交換を自前で書く必要があり差分メリットが小さい。
- ただし将来、JWT 関連処理が増える（複数 SA / 異なる aud / DPoP 等）場合に再評価。Phase 12 unassigned に open question #4 として登録。

## 7. 着手可否ゲート（Phase 4 への GO / NO-GO）

### GO 条件チェック

- [x] 代替案 4 案以上が評価マトリクスに並ぶ
- [x] base case 最終判定が全観点 PASS
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合の対応 Phase を指定（案 B/C/D に対する MINOR は不採用案のため対応不要、base case の MINOR は無し）
- [x] open question が 0 件 or 受け皿 Phase 明記（4 件すべて受け皿あり）
- [x] alternatives.md に各代替案の却下理由が明文化

### 結論: GO（Phase 4 への移行を承認）

## 8. open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase |
| --- | --- | --- |
| 1 | scale-out 時の token 交換コール頻度を staging 観測で再確認 | Phase 11 |
| 2 | private_key ローテーション運用手順整備 | Phase 12 unassigned |
| 3 | スコープを `spreadsheets.readonly` に固定するか書き込みも許容するか | Phase 4 / UT-09 |
| 4 | Workers 互換 JWT ライブラリ（D 案）の将来採択余地 | Phase 12 unassigned |

## 9. レビュー結果サマリ

- base case = 案 A は 4 条件 + 4 観点すべて PASS。
- 案 B / C は MAJOR が残るため却下。案 D は採択せず将来候補として open question #4 に保持。
- Phase 4（テスト戦略）への移行を **GO** で承認。
