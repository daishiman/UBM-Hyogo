# Lessons Learned: 06b-A Me API Auth.js Session Resolver

## L-06BA-001: implementation が入ったら spec_created を残さない

コードが `apps/api` に入った後も workflow / aiworkflow 側が `spec_created / docs-only / not_started` のままだと、下流 gate が誤って未実装扱いになる。Phase 12 では code fact、artifact metadata、task-workflow、quick-reference、resource-map、api-endpoints を同じ classification に揃える。

## L-06BA-002: dev token は env 欠落時も fail-closed

`ENVIRONMENT` が未設定のときに development fallback を許可すると、staging / production binding drift が認証 bypass につながる。dev-only header は `ENVIRONMENT === "development"` の場合だけ有効にする。

## L-06BA-003: local PASS と live smoke PASS を分離する

resolver contract tests / route tests / typecheck / lint は local implementation evidence として PASS にできる。一方で real Auth.js cookie を使う staging / production smoke は deploy / secret / OAuth account に依存するため、09a / 09c gate に残す。

## L-06BA-004: shared extractor の互換 cookie は仕様に明記する

`requireAdmin` と共用する `extractJwt()` は Auth.js v5 cookie (`authjs.session-token` / `__Secure-authjs.session-token`) に加えて next-auth v4 migration cookie (`next-auth.session-token` / `__Secure-next-auth.session-token`) を受理する。secure prefix を片方だけ実装すると HTTPS 上の production cookie が拾えず 401 を起こすため、必ず 2 系統セットで扱う。認証 surface を広げる意図がある場合は、API 正本に互換範囲として明記する。

## L-06BA-005: `AUTH_SECRET` は web/api Worker 間で共有する

Auth.js cookie / Bearer JWT は `apps/web` の Auth.js が発行し、`apps/api` の resolver が同じ `AUTH_SECRET` で検証する前提。Worker binding を分けたまま secret を別値にすると invalid_session で 401 になるため、`apps/web` Worker と `apps/api` Worker に同一の `AUTH_SECRET` を配置することを deploy 契約として固定する。

## L-06BA-006: 単一 resolver factory に dev / production 経路を集約する

`createMeSessionResolver()` 1 関数に dev token / Auth.js cookie / Bearer JWT の判定を集約することで、Auth.js cookie 名追加や `ENVIRONMENT` 判定変更時の分岐ドリフトを防げる。inline で `apps/api/src/index.ts` に残すと dev path と production path の更新タイミングがずれ、env 欠落時の fail-closed が片肺になりやすい。

## L-06BA-007: secret 検証ロジックは shared extractor を再利用する

cookie 抽出は `apps/api/src/middleware/require-admin.ts` の `extractJwt()`、JWT 検証は `@ubm-hyogo/shared` の `verifySessionJwt()` を直接再利用する。`/me/*` resolver で独自に cookie parser や HMAC 検証を書き直すと、admin gate 側との secret/algorithm drift が発生する。

## L-06BA-008: `apps/web` は cookie forwarding 維持・D1 直接アクセス禁止

`/profile` SSR は `fetchAuthed` で cookie / Authorization header を `apps/api` に転送するだけに留め、Auth.js session の中身を web から D1 へ直接展開しない。CLAUDE.md 不変条件 #5「D1 への直接アクセスは `apps/api` に閉じる」と整合させ、resolver 実装も apps/api 側 middleware に閉じる。
