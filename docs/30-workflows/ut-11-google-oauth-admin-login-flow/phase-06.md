# Phase 6: 異常系検証: state mismatch / redirect_uri_mismatch / 期限切れ / allowlist 外 / Cookie 無効 / Edge runtime 制限

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-11-google-oauth-admin-login-flow |
| Phase | 6 / 13 |
| Wave | 1 |
| 種別 | serial |
| 作成日 | 2026-04-27 |
| 上流 | phase-05（実装ランブック） |
| 下流 | phase-07（AC マトリクス） |

## 目的

Phase 5 の正常系に対して、OAuth callback / JWT / state / Cookie / allowlist / Edge runtime 互換 / バックドア試行 の異常系を網羅し、期待 status / body / 副作用を固定する。Phase 7 で AC × test ID × failure ID の対応表に流し込めるよう、failure ID を粒度よく付ける。

## 実行タスク

1. OAuth callback 異常（state mismatch / redirect_uri_mismatch / code 期限切れ / user cancel）
2. PKCE 異常（code_verifier 不在 / 不一致 / S256 以外）
3. Cookie 異常（temp Cookie 不在 / 期限切れ / SameSite 競合 / Cookie 無効化ブラウザ）
4. allowlist 異常（外 / 0 件 / 大文字小文字 / unverified email）
5. JWT 異常（改ざん / 期限切れ / signature mismatch / alg=none / 最小 claim 違反）
6. middleware bypass 試行（`?bypass=true` / 偽 Cookie / 直接 API 呼び出し）
7. Edge runtime 制限（Node.js `crypto` import / `Buffer` / 大きい body）
8. 運用異常（secret 未配置 / redirect URI 未登録 / Workers 未デプロイ）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-matrix.md | test ID（P / ST / CK / AL / MW / J / Z） |
| 必須 | outputs/phase-05/runbook.md | 正常系手順、sanity check |
| 必須 | outputs/phase-03/main.md | R1〜R8 リスク、Q1〜Q7 未解決事項 |
| 参考 | docs/30-workflows/02-application-implementation/05a-parallel-authjs-google-oauth-provider-and-admin-gate/phase-06.md | 異常系フォーマット参照 |
| 参考 | .claude/skills/aiworkflow-requirements/references/csrf-state-parameter.md | state 異常の根拠 |
| 参考 | .claude/skills/aiworkflow-requirements/references/security-principles.md | OAuth 異常の根拠 |

## 実行手順

### ステップ 1: failure cases 一覧

| ID | カテゴリ | 入力 | 期待 status | 期待 body / 副作用 | 関連 AC | 関連 test ID |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | OAuth callback | state query と Cookie の不一致 | **400** | body `oauth_state_mismatch`、session 発行しない、temp Cookie 失効 | AC-3 | ST-04 |
| F-02 | OAuth callback | state Cookie が temp 期限（10 分）切れで欠落 | 400 | `oauth_state_missing` | AC-3 | ST-05 |
| F-03 | OAuth callback | Google 側 `redirect_uri_mismatch`（Console 未登録 URI） | 400（Google 側） | Google 認可画面でエラー、callback 到達せず。runbook で「3 環境 URI 登録」を必須化 | AC-11 | manual smoke |
| F-04 | OAuth callback | 認可コードの期限切れ（数分超過） | 400 | token endpoint が `invalid_grant`、`/login?error=oauth_code_expired` redirect | - | contract |
| F-05 | OAuth callback | ユーザーが同意画面で「キャンセル」 | 302 | callback に `?error=access_denied`、`/login?error=access_denied` redirect | - | manual |
| F-06 | PKCE | callback 時に `oauth_verifier` Cookie 不在 | 400 | `oauth_verifier_missing` | AC-2 | P-06 |
| F-07 | PKCE | `code_verifier` を改ざんして送信 | 400 | token endpoint が `invalid_grant` | AC-2 | contract |
| F-08 | PKCE | `code_challenge_method` を `plain` に書き換える diff | lint / contract test fail | S256 以外を許可しない | AC-2 | P-03 |
| F-09 | Cookie | temp Cookie の `Path` が広すぎる diff | lint / contract test fail | Path=`/api/auth/callback/google` 固定 | AC-6 | CK-01 |
| F-10 | Cookie | session Cookie に `SameSite=None` を付ける diff | snapshot test fail | Lax 固定 | AC-6 | CK-03 |
| F-11 | Cookie | production で `Secure` を外す diff | snapshot test fail | production は Secure 必須 | AC-6 | CK-06 |
| F-12 | Cookie | ブラウザが Cookie を無効化（プライベートモード等） | callback 失敗 | `oauth_state_missing` で 400、ユーザに「Cookie を有効化してください」案内文を表示する placeholder | - | manual |
| F-13 | allowlist | 認証成功 email が allowlist 外 | **403** | `not_in_allowlist`、session 作らない、temp Cookie 失効 | AC-4 | AL-04 |
| F-14 | allowlist | `ADMIN_EMAIL_ALLOWLIST` Secret 未配置 / 空文字 | 全員 403 | fail closed、運用上は Secret 配置 runbook の N-04 で必須化 | AC-4 / AC-12 | AL-05, AL-06 |
| F-15 | allowlist | Google response の `email_verified !== true` | 403 | allowlist 一致でも拒否 | AC-4 | AL-08 |
| F-16 | allowlist | 大文字混入 email（`Alice@X.com`）が allowlist に小文字で登録 | 200（許可） | lowercase 正規化が効く | AC-4 | AL-03 |
| F-17 | JWT | session Cookie の payload を base64 編集して `isAdmin=true` を付与 | 401 / redirect | signature mismatch で verify fail → `/login` | AC-7 | J-04, MW-03 |
| F-18 | JWT | session Cookie の `exp < now` | 302 → `/login` | middleware で expired 判定 | AC-7 | J-03, MW-04 |
| F-19 | JWT | `SESSION_SECRET` を別環境のものに差し替え | verify fail | デプロイ時の secret 不整合検知 | AC-12 | J-02 |
| F-20 | JWT | header `alg` を `none` に書き換えた token を渡す | reject | HS256 固定、`none` を絶対に許可しない | - | J-05 |
| F-21 | JWT | claim に profile / picture / responseId を載せる diff | snapshot test fail | 最小 claim 集合違反 | - | J-06 |
| F-22 | middleware | session Cookie 無しで `/admin/dashboard` access | 302 → `/login` | 未認証 redirect | AC-7 | MW-01 |
| F-23 | middleware | 一般 email（`isAdmin !== true` の JWT）で `/admin/*` | 302 → `/login?gate=admin_required` | gate 拒否 | AC-7 | MW-05 |
| F-24 | middleware | `?bypass=true` クエリで `/admin/dashboard` | bypass 無視、通常 gate | クエリで認可境界が動かない | AC-7 | MW-08 |
| F-25 | middleware | 偽造 JWT cookie | verify fail → 302 | signature mismatch | AC-7 | J-04, MW-03 |
| F-26 | middleware | matcher 外の `/login` access | middleware 何もしない | 通過 | AC-7 | MW-07 |
| F-27 | logout | logout 後に古い session Cookie で `/admin/*` | Max-Age=0 上書き済みなのでブラウザが送らない。送った場合は verify 成功するため **server-side blacklist は MVP 外**（仕様）。`exp` で自然失効。 | AC-8 | manual |
| F-28 | Edge runtime | 実装に `import { randomBytes } from "node:crypto"` が混入 | lint で error / runtime で TypeError | Workers Edge runtime 互換違反 | - | Z-01 |
| F-29 | Edge runtime | `Buffer.from(...)` を使うコード差分 | lint で error | Edge 互換のため `TextEncoder` 等を使う | - | lint |
| F-30 | Edge runtime | `apps/web` 内で D1 binding 直参照（`env.DB.prepare`） | lint で error | 不変条件 #5 違反 | - | Z-02 |
| F-31 | 運用 | `SESSION_SECRET` 未配置で Workers 起動 | 起動時 / 初回 callback で 500 | runbook D-02 の secret list 確認で予防 | AC-12 | manual |
| F-32 | 運用 | redirect URI が staging 用に未登録 | Google 側 400 | runbook O-03 で予防 | AC-11 | manual |
| F-33 | 運用 | allowlist 更新後の Workers 再デプロイ忘れ | 古い allowlist で動作 | runbook N-05 で再デプロイ必須化 | AC-13 | manual |
| F-34 | concurrency | 同一 user が複数端末で同時ログイン | 各端末で独立 JWT、互いに影響しない | 仕様 | - | manual |
| F-35 | concurrency | session 確立後に allowlist から削除 | JWT 有効期限内（24h）は古い role=admin で動く（仕様）。即時失効時は `SESSION_SECRET` ローテーションを実施する。server-side セッションは本タスク外。Phase 3 R3 / Q1 で再検討 | - | spec |

### ステップ 2: race condition / 即時失効の仕様確定

- **F-35（allowlist 削除後の取消し遅延）**: JWT は 24h 有効なので、allowlist から削除しても最大 24h は古い管理者がログイン状態を保つ。MVP では受容（Phase 3 Q1 で「server-side session は別タスク化」と確定済）。緊急時の対応は `SESSION_SECRET` ローテーション（全 session 一括無効化）で代替する runbook を Phase 12 に追記する。
- **F-27（logout 後の古い Cookie）**: server-side blacklist は MVP 外。Cookie の `Max-Age=0` 上書きでブラウザ側から削除させるのみ。

### ステップ 3: bypass 試行対策

- F-24（`?bypass=true`）: middleware は JWT verify のみで判定。クエリは無視。
- F-25（偽造 Cookie）: HS256 signature mismatch を検出して redirect。
- 追加: `x-admin-override` 等のカスタム header もすべて無視（test の snapshot で固定）。
- 追加: middleware に `process.env.DEBUG_BYPASS` 等の環境変数バックドアを **置かない**。lint rule で `DEBUG_BYPASS` 文字列の出現を禁止する placeholder を残す。

### ステップ 4: Edge runtime 制限の網羅

| 項目 | 対策 |
| --- | --- |
| `node:crypto` import | F-28、ESLint `no-restricted-imports` で禁止 |
| `Buffer` 使用 | F-29、lint rule + `TextEncoder` / `Uint8Array` への置換 |
| `fs` / `path` | 同上、Edge では使用不可 |
| 大きい request body | OAuth callback の body は小さいが、誤った middleware で stream 全読みする実装は避ける |
| `setTimeout` の長時間 | Workers の CPU time 制限 50ms（Free）を超えないように、PKCE / JWT 検証を軽量化（`crypto.subtle` 1 回のみ） |

### ステップ 5: 観測性 hook（将来用）

| イベント | log フィールド placeholder |
| --- | --- |
| state mismatch (F-01) | `event="oauth_callback", outcome="state_mismatch"` |
| allowlist deny (F-13) | `event="oauth_callback", outcome="allowlist_deny", email_hash="..."` |
| JWT verify fail (F-17) | `event="middleware", outcome="jwt_invalid"` |
| 成功 | `event="oauth_callback", outcome="issued"` |

> email を平文で残さず hash で残す（privacy 配慮）。本タスクでは hook の記述のみ、実装は別タスク。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | F-01〜F-35 を AC × test ID 対応表に組み込み |
| Phase 9 | lint rule（F-28, F-29, F-30）の実装を required-checks に |
| Phase 11 | F-03 / F-05 / F-12 / F-31 / F-32 / F-33 を手動 smoke で確認 |
| Phase 12 | `SESSION_SECRET` ローテーション runbook を追記（F-35 の緩和） |

## 多角的チェック観点

| 観点 | 内容 | 関連不変条件 |
| --- | --- | --- |
| セキュリティ | F-01 / F-17 / F-20 / F-25 で改ざん検出、F-08 で PKCE downgrade を阻止 | - |
| privacy | F-21 で session JWT に余分な情報を載せない、観測 hook で email を hash 化 | - |
| 認可境界 | F-22〜F-26 で middleware 漏れ無し、F-13 / F-14 で fail closed | - |
| 不変条件 #5 | F-30 で `apps/web` → D1 直接 import を lint で禁止 | #5 |
| 不変条件 #6 | F-28 / F-29 で Node.js `crypto` / `Buffer` を禁止し、GAS prototype の API 表面を踏襲しない | #6 |
| Cloudflare 互換 | ステップ 4 で Edge runtime 制限を網羅、`crypto.subtle` 1 回のみで CPU time 50ms を超えない | - |
| 運用性 | F-31〜F-33 で secret / redirect URI / 再デプロイの取りこぼしを runbook で予防 | - |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | F-01〜F-05 OAuth callback 異常 | 6 | pending | state / redirect_uri / code / cancel |
| 2 | F-06〜F-08 PKCE 異常 | 6 | pending | verifier / S256 |
| 3 | F-09〜F-12 Cookie 異常 | 6 | pending | 属性 / 無効化 |
| 4 | F-13〜F-16 allowlist 異常 | 6 | pending | 外 / 0 件 / unverified |
| 5 | F-17〜F-21 JWT 異常 | 6 | pending | 改ざん / 期限 / alg / claim |
| 6 | F-22〜F-27 middleware bypass / logout | 6 | pending | 二段 gate |
| 7 | F-28〜F-30 Edge runtime 制限 | 6 | pending | lint |
| 8 | F-31〜F-35 運用 / concurrency | 6 | pending | secret / 再デプロイ / race |
| 9 | bypass 試行対策まとめ | 6 | pending | ステップ 3 |
| 10 | 観測性 hook | 6 | pending | log placeholder |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure cases 一覧 + 対策 + 観測 hook |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] F-01〜F-35 が網羅
- [ ] 各 case に期待 status / body / 副作用 / 関連 AC / test ID が紐付き
- [ ] state mismatch / redirect_uri_mismatch / 期限切れ / allowlist 外 / Cookie 無効 / Edge runtime 制限のすべてが含まれる
- [ ] bypass 試行（F-24, F-25）が含まれる
- [ ] fail closed（F-14）が含まれる
- [ ] race condition / 即時失効の仕様（F-35）が `SESSION_SECRET` ローテーション緩和とともに明記
- [ ] 不変条件 #5 / #6 違反の lint test（F-28〜F-30）が含まれる

## タスク 100% 実行確認

- [ ] 全 10 サブタスクが completed
- [ ] outputs/phase-06/main.md が配置
- [ ] 全完了条件にチェック
- [ ] 不変条件 #5 / #6 への違反検出 case が含まれる
- [ ] 観測性 hook で email を平文で残さない方針が明記
- [ ] 次 Phase へ failure ID 一覧（F-01〜F-35）を引継ぎ

## 次 Phase

- 次: 7（AC マトリクス）
- 引き継ぎ事項: F-XX を AC × test ID と組み合わせて、AC-1〜AC-13 の trace 表を完成させる入力として渡す
- ブロック条件: 異常系の網羅率が低い（F が 25 件未満）の場合は進まない
