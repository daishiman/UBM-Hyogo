# Phase 6 — 異常系検証: OAuth callback / JWT / admin gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Phase | 6 / 13 |
| Wave | 5 |
| 種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | phase-05（実装ランブック） |
| 下流 | phase-07（AC マトリクス） |

## 目的

Phase 5 の正常系に対して、401 / 403 / 404 / 422 / 5xx / consent 撤回 / admin 剥奪等の異常系をすべて洗い出し、期待 response と D1 状態を固定する。bypass 試行（`?bypass=true`、JWT 改ざん）も検証対象に含める。

## 実行タスク

1. OAuth callback 異常（state mismatch / CSRF / cancel）
2. JWT 異常（改ざん / 期限切れ / signature 不一致）
3. session-resolve 異常（DB 障害 / email 不正 / internal token 不正）
4. admin gate bypass 試行
5. consent 撤回 / admin 剥奪後の race condition
6. apps/web → D1 直接アクセス試行（lint レベルで阻止）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | 異常系の test ID |
| 必須 | outputs/phase-05/runbook.md | 正常系手順 |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | 異常時の UX |
| 参考 | doc/00-getting-started-manual/specs/11-admin-management.md | admin 権限境界 |

## 実行手順

### ステップ 1: failure cases 一覧

| ID | 入力 | 期待 status | 期待 body / 副作用 | 不変条件関連 |
| --- | --- | --- | --- | --- |
| F-01 | OAuth callback の state mismatch | 401 | `/login?error=oauth_state_mismatch` redirect | - |
| F-02 | OAuth callback の code 期限切れ | 401 | `/login?error=oauth_code_expired` redirect | - |
| F-03 | ユーザーが OAuth 同意画面で cancel | 302 | `/login?error=access_denied` redirect | - |
| F-04 | unregistered email で OAuth 完了 | 302 | `/login?gate=unregistered`、session 作らない | #9 |
| F-05 | rules_declined email で OAuth 完了 | 302 | `/login?gate=rules_declined`、session 作らない | #2, #9 |
| F-06 | deleted email で OAuth 完了 | 302 | `/login?gate=deleted`、session 作らない | #4, #9 |
| F-07 | session-resolve が 5xx | 302 | `/login?error=service_unavailable`、session 作らない | #5 |
| F-08 | session-resolve への internal token 不正 | 403 | apps/web 側で 5xx 扱い、session 作らない | - |
| F-09 | JWT 改ざん（payload 書き換え） | 401 | session 作らない、再ログイン要求 | #5 |
| F-10 | JWT 期限切れ | 401 | session 作らない | - |
| F-11 | JWT signature 不一致（別 secret） | 401 | session 作らない | #5 |
| F-12 | 一般 member が `/admin/*` 画面に access | 302 | `/login?gate=admin_required` | #11 |
| F-13 | 一般 member の JWT で `/admin/*` API call | 403 | `{error:"forbidden"}` | #11 |
| F-14 | 未認証で `/admin/*` API call | 401 | `{error:"unauthorized"}` | #11 |
| F-15 | `?bypass=true` クエリ付きで `/admin/*` | 302 | bypass 無視、通常の gate 動作 | #11 |
| F-16 | 偽造 cookie で `/admin/*` | 302 | verify fail、redirect | #5, #11 |
| F-17 | session 確立後に admin 剥奪 → 次の `/admin/*` access | 302 | JWT 内の isAdmin=true は古いが、次回 token 更新で false に。MVP では次回ログインまで残る（仕様）。**API 側 requireAdmin で D1 を毎回 lookup するか検討**（Q1） | #11 |
| F-18 | session 確立後に rules_consent 撤回 | gate 動作なし | JWT 内 memberId のみ。ログアウトまで影響なし（仕様）。撤回は admin が member を削除した時のみ | #2 |
| F-19 | apps/web 側で `import { getDb }` 試行 | lint で error | コンパイル失敗 | #5 |
| F-20 | apps/web の Auth.js callback 内で D1 を直接 fetch | lint で error | コンパイル失敗 | #5 |
| F-21 | session callback で session-resolve が timeout | 401 / fallback | session 作らない（fail closed） | #5 |
| F-22 | 同一 user が複数端末で同時にログイン | OK | 各端末で独立 JWT、削除は cookie 単位 | - |

### ステップ 2: race condition 対策

- **F-17 (admin 剥奪)**: JWT 有効期限内（24h）は古い `isAdmin=true` で動く。**緩和案**: `requireAdmin` が D1 の `admin_users` を毎回 lookup する（API path のみ。middleware は JWT のみで判定）。Phase 3 Q1 で再検討
- **F-18 (consent 撤回)**: rules_consent 撤回は admin による削除を経由するため、F-06 の deleted フローに統合される
- **F-21 (session-resolve timeout)**: fail closed。例外を catch して `signIn` callback で `false` を返す → 再ログイン要求

### ステップ 3: bypass 試行対策

- F-15 (`?bypass=true`): クエリ無視。middleware は JWT verify のみで判定
- F-16 (偽造 cookie): Auth.js v5 の jwt verify で signature 不一致を検出 → next()/redirect 分岐
- **追加チェック**: `requireAdmin` で `c.req.header("x-admin-bypass")` 等のカスタム header も無視する（test で snapshot）

### ステップ 4: 認可境界の異常

- F-13 / F-14: requireAdmin が `c.json({error:"unauthorized"|"forbidden"}, 401|403)` を統一フォーマットで返す
- F-19 / F-20: ESLint rule で apps/web → D1 直接 import を error 化（Phase 5 ステップ 7 で実装済）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 異常系 ID を AC との対応表に組み込む |
| Phase 9 | secret hygiene チェックリスト（INTERNAL_AUTH_SECRET 取り扱い） |
| 05b | F-21 と同様の fail closed パターンを共有 |
| 07c | F-12〜F-14 の gate 拒否を audit log に記録 |
| 08a | contract test の異常系入力 |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| #2 (consent キー統一) | F-05 で `rules_consent` を直接参照 | #2 |
| #4 (deleted の挙動) | F-06 で session 不発 → 本人本文 D1 上書きを誘発しない | #4 |
| #5 (apps/web → D1 禁止) | F-19 / F-20 で lint error、F-07 / F-21 で fail closed | #5 |
| #7 (memberId と responseId 分離) | F-09 で JWT に `responseId` が無いことを snapshot | #7 |
| #9 (`/no-access` 不在) | F-04〜F-06 で全て `/login?gate=...` redirect | #9 |
| #11 (admin gate) | F-12〜F-17 で middleware + requireAdmin の漏れがないことを網羅 | #11 |
| 観測性 | F-12〜F-14 の gate 拒否を 07c の audit log に渡す hook | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-01〜F-03 OAuth callback 異常 | 6 | pending | provider 系 |
| 2 | F-04〜F-08 gate / resolve 異常 | 6 | pending | session 不発 |
| 3 | F-09〜F-11 JWT 異常 | 6 | pending | verify fail |
| 4 | F-12〜F-16 admin gate / bypass | 6 | pending | 二段防御 |
| 5 | F-17〜F-18 race condition | 6 | pending | 仕様確定 |
| 6 | F-19〜F-22 lint / 並行性 | 6 | pending | edge case |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases 一覧 + 対策 |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] F-01〜F-22 が網羅
- [ ] 各 case に期待 status / body / 副作用が明記
- [ ] race condition 対策が具体的（F-17 の Q1 残し含む）
- [ ] bypass 試行（F-15 / F-16）が含まれる

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-06/main.md 配置
- 全完了条件にチェック
- 不変条件 #2, #4, #5, #7, #9, #11 への対応が明記
- 次 Phase へ failure ID 一覧を引き渡し

## 次 Phase

- 次: 7 (AC マトリクス)
- 引き継ぎ事項: F-XX を AC × test ID と組み合わせ
- ブロック条件: 異常系の網羅率が低い場合は進まない
