# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

Phase 5 の正常系に対して、401 / 403 / 404 / 422 / 5xx / sync 失敗 / consent 撤回 / 削除済みユーザの再ログイン試行等の異常系をすべて洗い出し、期待 response と D1 状態を固定する。

## 実行タスク

1. HTTP status の異常系列挙
2. token 異常（期限切れ / 二重使用 / 改ざん / 不正発行）
3. mail provider 障害
4. consent / delete 状態が変わる際の race condition
5. レートリミット超過

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | 異常系の test ID |
| 必須 | outputs/phase-05/runbook.md | 正常系手順 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | 異常時の UX |

## 実行手順

### ステップ 1: failure cases 一覧

| ID | 入力 | 期待 status | 期待 body / 副作用 | 不変条件関連 |
| --- | --- | --- | --- | --- |
| F-01 | `POST /auth/magic-link` body 不正 (email なし) | 422 | `{error:"validation"}`、insert なし | - |
| F-02 | `POST` で email 形式不正 | 422 | zod parse error | - |
| F-03 | unregistered email | 200 | `{state:"unregistered"}`、insert なし、mail なし | #2 |
| F-04 | rules_declined | 200 | `{state:"rules_declined"}`、insert なし | #2 |
| F-05 | deleted | 200 | `{state:"deleted"}` | #4 |
| F-06 | レートリミット超過 | 429 | `Retry-After` header | #10 |
| F-07 | callback に期限切れ token | 401 | `/login?error=invalid_token` redirect | - |
| F-08 | callback に再使用 token | 401 | 同上 | - |
| F-09 | callback に署名不一致 token | 401 | 同上 | - |
| F-10 | callback の email mismatch | 401 | 同上 | - |
| F-11 | mail provider 5xx | 502 | `{error:"mail_failed"}`、token は insert 済みでも `state:"sent"` を返さず rollback | - |
| F-12 | D1 unavailable | 503 | `{error:"db_unavailable"}` | - |
| F-13 | callback 直前に rules_consent が撤回された | 401 | session 作らない、`/login?error=consent_revoked` | #2 |
| F-14 | callback 直前に isDeleted = true に変更 | 401 | session 作らない | #4 |
| F-15 | session callback で memberId 未解決 | 401 | session 作らない | #7 |
| F-16 | session callback で `/internal/me-by-email` が 5xx | 503 | session 作らない | #5 |
| F-17 | apps/web で localStorage に session 保存 | lint で error | - | #8 |

### ステップ 2: race condition 対策

- F-13 / F-14: callback で再度 `resolveGateState(email)` を呼び、`ok` でなければ session 不発（time-of-check vs time-of-use を最小化）
- F-08: `UPDATE magic_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL` で原子的に更新、affected rows = 0 なら 401

### ステップ 3: mail 障害対策

- F-11: trans 化が必要。mail provider 失敗時は `DELETE FROM magic_tokens WHERE token_hash=?` で rollback、ユーザーに 502 を返す
- 再送 UX: `/login` 画面で 60 秒待って再送可能（06b の責務）

### ステップ 4: 認可境界の異常

- F-15 / F-16: session callback が 401 を返した場合、Auth.js は session を作らず再 login を求める

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 異常系 ID を AC との対応表に組み込む |
| Phase 9 | secret hygiene チェックリスト |
| 08a | contract test の異常系入力 |

## 多角的チェック観点

- 不変条件 #2: F-04 の rules_declined は consent キーが正しく `rules_consent` を見ている
- 不変条件 #4: F-05 / F-14 で deleted の挙動 = 本人本文 D1 上書きを誘発しない（メッセージで管理者連絡へ）
- 不変条件 #5: F-16 で `/internal/me-by-email` を内部 API として apps/api 経由で呼ぶ
- 不変条件 #7: F-15 で memberId 未解決時は session 作らない
- 不変条件 #8: F-17 で localStorage 正本化を阻止
- 不変条件 #9: 全異常系で `/no-access` への redirect が一切起きない
- 不変条件 #10: F-06 のレートリミットで D1 / mail コスト抑制

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-01〜F-06 列挙 | 6 | pending | input 異常 |
| 2 | F-07〜F-10 token 異常 | 6 | pending | callback 系 |
| 3 | F-11 mail 障害 | 6 | pending | rollback 設計 |
| 4 | F-12 D1 障害 | 6 | pending | 503 response |
| 5 | F-13〜F-16 race / authz | 6 | pending | time-of-check |
| 6 | F-17 localStorage 阻止 | 6 | pending | lint |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases 一覧 + 対策 |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] F-01〜F-17 が網羅
- [ ] 各 case に期待 status / body / 副作用が明記
- [ ] race condition 対策が具体的
- [ ] mail rollback と D1 rollback の方針あり

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-06/main.md 配置
- 全完了条件にチェック
- 不変条件 #2, #4, #5, #7, #8, #9, #10 への対応が明記
- 次 Phase へ failure ID 一覧を引き渡し

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: F-XX を AC × test ID と組み合わせ
- ブロック条件: 異常系の網羅率が低い場合は進まない
