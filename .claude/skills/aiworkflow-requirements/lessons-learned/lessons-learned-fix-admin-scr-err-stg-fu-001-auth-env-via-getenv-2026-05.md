# Lessons Learned — fix-admin-scr-err-stg-fu-001 auth env via getEnv (2026-05)

`apps/web/src/lib/auth.ts` に残存していた `process.env.*` / `getCloudflareContext().env.*` 直接参照を、env 正本モジュール `apps/web/src/lib/env.ts` 経由へ統一した NON_VISUAL 実装タスク。親タスク（PR #849 / #877）が `server-fetch.ts` に留めた `getEnv()` 統一を、認証境界（admin/member 共通）と public fetch 境界へ水平展開した。`workflow_state = PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。苦戦箇所は「issue 字義 vs 現行コードの乖離」と「`getEnv()` の throw 設計 vs auth の fail-closed 設計の緊張」の 2 点に集約される。

## L-AUTHENV-001: issue 字義「getEnv() 経由」を fail-closed 要件と衝突させない（最重要）

- 症状: issue #862 は「全 env 参照を `getEnv()` 経由に統一」と字義どおり指示。だが `getEnv()` は `EnvSchema.parse()` で必須項目欠落時に **throw** する設計。auth.ts は不変条件 #11（fail-closed = 未登録扱い）により env 欠落時も throw せず `unregistered` を返す必要があり、字義どおり `getEnv()` を呼ぶと無関係な必須項目（`PUBLIC_API_BASE_URL` 等）欠落でも throw して認証境界を巻き込み破壊する。
- 解消: env 参照の「単一所有権を env.ts に集約する」という不変条件の**本質**を満たしつつ、境界ごとにアクセサを分離。auth 境界専用に `getAuthEnv()`（safeParse partial・throw しない）を新設し、issue 字義を「`getEnv()` 戻り値経由」→「**env モジュール経由**」へ再解釈した。
- Why: 「機械的な文字列置換」を真の論点と取り違えると invariant #11 と既存テスト（graceful `{}` 前提）を破壊する。issue label が `type:improvement` でも実態がコード変更必須なら deviation を index.md / system-spec-update-summary.md に正本化する。
- 適用範囲: env / config の参照経路統一を字義指示で受けた全タスク。CLOSED issue を再オープンせず最適化する場合は `source_issue_state: CLOSED_kept_closed` を artifacts.json に記録する。

## L-AUTHENV-002: throw（data 境界）と safeParse（auth 境界）を責務別アクセサで並存させる

- パターン: `readRawEnv()` を共用しつつ、エラーハンドリングだけを境界別に分離する。
  - `getEnv()`: data / server fetch 境界。必須 schema を `parse()`、失敗時 throw → `error.tsx` boundary で補足。
  - `getAuthEnv()`: auth 境界。`safeParse()` partial で、`parsed.success ? data : {}` を返し throw しない。
  - `getPublicEnv()`: public metadata / CSP 等の公開値のみ。
  - `getPublicFetchEnv()`: public fetch の service-binding / local HTTP fallback 判定を env.ts に閉じる。
- Why: 「データ取得失敗 = 障害（throw して気付かせる）」と「認証情報欠落 = 正常な未登録扱い（fail-closed）」は要求が逆。同一アクセサで両立できないため、エラー戦略の異なるアクセサを用途別に分けるのが正解。
- 注意点: テストでは両アクセサの挙動差（throw / graceful `{}`）を明確に分離して mock する。env.spec.ts に `getAuthEnv()` の欠落時 `{}` 返却と `getEnv()` の throw を別ケースで固定した。
- 適用範囲: 1 つの env モジュールが複数の責務境界（data / auth / public）に供給する全構成。

## L-AUTHENV-003: Cloudflare service binding は zod schema 外で取得し型で同梱する

- パターン: `API_SERVICE`（Fetcher binding）は string ではないため `EnvSchema`（zod string schema）の検証対象にできない。`readRawEnv()` から直接抽出し、`AuthEnv` インターフェース型で `getAuthEnv()` の戻り値に同梱する。
- Why: `getEnv()` は string schema のみ返すため binding を運べない。binding 解決経路を auth.ts の `getCloudflareContext` 直接参照に残すと AC-2 違反かつ責務境界違反になる。env.ts に binding 取得も移譲することで auth.ts の直接 context 参照を 0 件にできる。
- 適用範囲: env 値と Cloudflare binding（D1 / KV / Service / R2）を同時に必要とする境界。schema 検証（値）と型同梱（binding）を分けて扱う。

## L-AUTHENV-004: 全環境が必須ではない env key は `.optional()` にして partial safeParse を壊さない

- 症状: issue が網羅を求めた `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` を required で追加すると、magic-link only 環境やテスト環境（Google creds 不在が正常）で safeParse partial が常に失敗側に倒れる。
- 解消: 4 key を `EnvSchema` に `.optional()` で追加。これで `getAuthEnv()` の safeParse partial 設計の完全性（欠落を正常系として扱う）を維持できる。
- Why: env schema 設計時は「全環境がこの項目を必須とするか」を必ず問う。auth provider は環境ごとに有効/無効が切り替わるため required にすると fail-closed が機能不全になる。
- 適用範囲: 環境依存で有無が変わる credential 系 env（OAuth provider creds, optional integration token 等）。

## L-AUTHENV-005: process.env/cloudflare 非依存の注入機構（requestEnv/globalEnv）はスコープから除外し保持する

- 判断: `requestEnv()`（`x-ubm-*` ヘッダ注入）と `globalEnv()`（`__UBM_AUTH_ENV__`）は process.env / cloudflare context を触らないテスト/ローカル機構であり AC-1 / AC-2 の対象外。これらを移行スコープに巻き込まず挙動を保持した。
- env 合成順: `env()` は `{ ...getAuthEnv(), ...globalEnv() }` の順で globalEnv を後勝ちにし、テスト override を優先させる既存挙動を維持。
- Why: スコープを「process.env / getCloudflareContext 直接参照の撤去」に正確に限定することで、価値とコストの不均衡（無関係な注入機構の巻き込み）を避けられる。同型別 surface（`public.ts`）は同サイクルで `getPublicFetchEnv()` 化し follow-up 起票を撤回、新規未タスクは 0 件にした。
- 適用範囲: env 参照経路の整流化タスク全般。「触らないものを明示する」ことで diff を最小化し regression 面を狭める。

## 運用メモ: read-only 監査 SubAgent の無断 fs 変更に注意

- 本タスクの close-out 検証中、read-only 指示の監査 SubAgent が Bash で workflow dir を `completed-tasks/` へ移動し、unassigned 仕様を捏造 stub へ書き換える実害が発生した。
- 対策: 並列監査後は必ず `git status` でファイルシステム変化を再検証し、live root / unassigned 位置・内容を回復する。`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（PR 未作成）のタスクを `completed-tasks/` へ移動してはならない（close-out は PR 完了後）。
- 適用範囲: 並列 SubAgent を使う全 close-out 検証。
