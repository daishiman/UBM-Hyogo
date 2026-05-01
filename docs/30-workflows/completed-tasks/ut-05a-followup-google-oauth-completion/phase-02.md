# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (設計レビュー) |
| 状態 | spec_created |
| visualEvidence | VISUAL |

## 目的

Phase 1 で確定した「configuration 単一正本 + 段階適用」を **4 つの設計成果物**で具体化する: redirect URI 一覧表 / Secrets 配置表 / consent screen 仕様 / staging→production runbook。Phase 5（実装ランブック）と Phase 11（手動 smoke）が **コピーで実行できる粒度**まで固定する。

## 実行タスク

1. OAuth redirect URI matrix を local / staging / production の 3 環境で定義する。
2. Secrets placement matrix を 1Password / Cloudflare staging / Cloudflare production / GitHub Actions の配置先で定義する。
3. Consent screen spec を External / minimal scopes / authorized domain / privacy policy 条件で定義する。
4. Stage A/B/C の staging→production runbook とゲート条件を定義する。
5. Auth.js session cookie / JWT / admin gate の仕様語と実装語対応を Phase 5/11 へ引き渡せる形に固定する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 1 | `phase-01.md` | AC / true issue / 依存境界の入力 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/auth/session-resolve` と admin gate の現行契約 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | `AUTH_SECRET` / OAuth 系 secret の配置判断 |
| 正本仕様 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Cloudflare staging / production と `scripts/cf.sh` 運用 |
| skill | `.claude/skills/task-specification-creator/references/phase-template-core.md` | OAuth / session 共有契約 ADR の必須項目 |

## 設計成果物 1: oauth-redirect-uri-matrix.md

### 形式

| 環境 | host | callback URL | Google OAuth client 登録状態 | 動作確認方法 |
| --- | --- | --- | --- | --- |
| local dev | `http://localhost:3000` | `http://localhost:3000/api/auth/callback/google` | 登録済（dev 用 OAuth client または同一 client に追記） | `pnpm --filter web dev` で起動し M-01 を curl |
| staging | `https://<staging-domain>` | `https://<staging-domain>/api/auth/callback/google` | 登録済（同一 OAuth client） | Phase 11 staging smoke の M-01〜M-11 |
| production | `https://<production-domain>` | `https://<production-domain>/api/auth/callback/google` | 登録済（同一 OAuth client） | Phase 11 production smoke の M-01 / M-04 |

### 設計判断

- **OAuth client は単一 project 内で 1 個に統合**する（dev / staging / production の redirect URI を同一 client に列挙）。理由: consent screen は project 単位で 1 つしか持てず、verification 申請も project 単位で進むため、複数 client に分散すると申請対象 client / 動作確認対象 client が drift する。
- 例外: ローカル開発専用に第 2 client を分けたい場合は `consent-screen-spec.md` の `Internal` モードを併用する。本タスクでは原則 1 client に統合する。
- redirect URI の正規化: 末尾スラッシュ無し、scheme は本番 `https://` 固定、staging も `https://`。Cloudflare 既定 SSL を前提とし、`http://` redirect URI は登録しない（local dev のみ例外）。

### Phase 5 / Phase 11 での参照

- Phase 5 ステップ「Google Cloud Console redirect URI 登録」で本表をコピペ。
- Phase 11 staging / production smoke で実 host 名を埋めた版を `outputs/phase-11/staging/redirect-uri-actual.md` / `outputs/phase-11/production/redirect-uri-actual.md` に保存。

## 設計成果物 2: secrets-placement-matrix.md

### 形式

| key | 役割 | 1Password 参照 | Cloudflare Secrets (staging) | Cloudflare Secrets (production) | GitHub Secrets | ローカル `.env` |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH_SECRET | Auth.js JWT 署名鍵 | `op://Vault/UBM-Auth/auth-secret-staging` / `auth-secret-prod` | YES（staging 値） | YES（production 値） | YES（CI test 用） | `op://` 参照のみ |
| GOOGLE_CLIENT_ID | OAuth client ID | `op://Vault/UBM-Auth/google-client-id` | YES | YES | NO | `op://` 参照のみ |
| GOOGLE_CLIENT_SECRET | OAuth client secret | `op://Vault/UBM-Auth/google-client-secret` | YES | YES | NO | `op://` 参照のみ |
| AUTH_TRUST_HOST | Auth.js host trust | - | `true` | `true` | NO | 通常文字列 |
| AUTH_URL | Auth.js base URL | - | `https://<staging-domain>` | `https://<production-domain>` | NO | 通常文字列 |

### 設計判断

- `AUTH_SECRET` のみ staging / production で **異なる値**にする（漏洩時 blast radius 限定）。`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` は同一 OAuth client なので環境間で同値。
- 注入経路の正本化:
  - Cloudflare Secrets 投入: `bash scripts/cf.sh secret put <KEY> --config apps/api/wrangler.toml --env <staging|production>`（実値は stdin で 1Password から `op read "op://..."` で渡す）。
  - GitHub Secrets 投入: `gh secret set <KEY> --body "$(op read 'op://...')"`。
  - ローカル `.env`: `KEY=op://Vault/UBM-Auth/...` のみ。`scripts/with-env.sh` が `op run --env-file=.env` で実行時注入。
- 禁止: 仕様書 / outputs / log / git 履歴 / Slack 等あらゆる場所に実値を貼らない。

## OAuth / session 共有契約 ADR

| 項目 | 決定 |
| --- | --- |
| session 型 | `memberId` / `email` / `isAdmin` / `gateReason` を最小 payload とし、profile 本文や responseId は含めない |
| token 形式 | 05a 正本に従い Auth.js session cookie と API verifier は共有 HS256 JWT / `AUTH_SECRET` で互換させる |
| encode/decode owner | `packages/shared/src/auth.ts` の `encodeAuthSessionJwt` / `decodeAuthSessionJwt` と API 側 `verifySessionJwt` |
| admin gate | `admin_users.active` ではなく、05a 正本の Auth.js JWT + `admin_users.active` + `requireAdmin` を採用する |
| provider 共有 | Google OAuth と Magic Link は session payload / error reason / `/auth/session-resolve` 契約を共有し、provider 固有 secret だけを分離する |
| 互換テスト | Phase 4/11 で 05a の JWT/session-resolve/admin route tests を再実行し、実 cookie/token と API verifier の互換を確認する |

### Phase 12 で `02-auth.md` / `13-mvp-auth.md` から参照

- 参照リンクの形式: `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-02/secrets-placement-matrix.md` を **secrets 配置の正本** として明示。

## 設計成果物 3: consent-screen-spec.md

### 形式

| 項目 | 値 / 仕様 | 根拠 |
| --- | --- | --- |
| User Type | External | UBM 会員は Google Workspace 内ユーザーに限定しないため |
| Publishing status | Testing → In production（verification 申請時に遷移） | testing user 制限解除のため |
| App name | UBM 兵庫支部会 | サイト表示名と一致 |
| User support email | UBM 運用担当 mail | Google Cloud Console 上で管理 |
| App logo | UBM ロゴ（任意） | Google verification の信頼性向上 |
| Application home page | `https://<production-domain>/` | privacy / terms と同一 origin |
| Application privacy policy link | `https://<production-domain>/privacy` | 200 を返す URL（Phase 5 で確認） |
| Application terms of service link | `https://<production-domain>/terms` | 200 を返す URL |
| Authorized domains | `<production-domain>` | privacy / terms / home と一致 |
| Developer contact | UBM 開発 mail | Google からの審査連絡先 |
| Scopes | `openid` / `email` / `profile` | Auth.js Google provider 既定。それ以外は申請しない |
| Test users（Publishing status=Testing 期間） | UBM 開発 + admin_users.active 一部 | verification 完了時は不要 |

### 設計判断

- scope は最小権限（`openid` / `email` / `profile` の 3 つ）に固定。`https://www.googleapis.com/auth/gmail.send` 等の sensitive scope は使わない（verification 審査が長期化するため）。
- Authorized domain は production の root domain のみ登録。staging が独立 domain（preview-*.example.com 等）の場合は domain 追加が必要となるため、本タスクで domain 構成を確認した上で **staging を production と同一 root domain のサブドメイン**に統一する設計を Phase 5 runbook で明示。
- privacy policy / terms / home の URL が **必ず 200 を返す**ことを Phase 5 のチェックリストに含める（Google verification 提出時の必須要件）。

## 設計成果物 4: staging-vs-production-runbook.md

### 段階適用フロー

```
[Stage A] staging smoke
  A-1: Google Cloud Console で staging redirect URI 登録（既登録なら skip）
  A-2: Cloudflare Secrets staging 投入（scripts/cf.sh secret put）
  A-3: 05a smoke-checklist.md の M-01〜M-11 / F-09 / F-15 / F-16 / B-01 を実行
  A-4: screenshot 9 / curl / session-member.json / session-admin.json / wrangler-dev.log を outputs/phase-11/staging/ に保存
  A-5: PASS 判定でなければ Stage B に進まず Phase 5 runbook で原因切り分け
[Stage B] production verification 申請
  B-1: consent screen を Production publishing で submit
  B-2: privacy / terms / home URL が 200 であることを再確認
  B-3: Google Cloud Console submission screenshot を保存
  B-4: 審査ステータスを outputs/phase-11/production/verification-submission.md に記録
[Stage C] production smoke
  C-1: Cloudflare Secrets production 投入確認
  C-2: testing user 以外の Gmail account で /login → /admin 到達確認
  C-3: screenshot を outputs/phase-11/production/login-smoke.png に保存
  C-4: B-03 解除状態を docs/00-getting-started-manual/specs/13-mvp-auth.md に反映（Phase 12 で実施）
```

### 段階間ゲート

| ゲート | 通過条件 | 失敗時の動作 |
| --- | --- | --- |
| A → B | M-01〜M-11 / F-09 / F-15 / F-16 / B-01 すべて PASS | Phase 5 runbook の原因切り分けに戻り、修正後再実行 |
| B → C | verification submitted（または verified）/ consent screen が production publishing | 必要修正後に再 submit。verified 待ちの場合は B-03 解除条件 b（submitted 暫定運用）を採用 |
| C → 完了 | 外部 Gmail account login smoke PASS | 失敗時は audience を再確認し、verification status と redirect URI 整合を再点検 |

## Schema / 共有コード Ownership 宣言（仕様語 ↔ 実装語対応）

| 仕様語 | 実装語 / 物理位置 | 備考 |
| --- | --- | --- |
| OAuth client | Google Cloud Console「OAuth 2.0 クライアント ID」 | Web application タイプ |
| consent screen | Google Cloud Console「OAuth 同意画面」 | External / Production |
| Cloudflare Secrets | `wrangler secret put`（呼び出しは `scripts/cf.sh secret put`） | env=staging / production |
| Auth.js session cookie | `next-auth.session-token`（Auth.js v5 既定） | Secure / SameSite=Lax / domain は host 自動 |
| admin 判定 | `admin_users.active` + `requireAdmin` | 05a 正本。`admin_users.active` は本タスクの正本 secret として扱わない |
| `/admin/*` gate | Auth.js middleware + apps/api `requireAdmin` | 既存 05a 実装 |
| `/no-access` | 仕様上は不在固定 | 05a で生成しないことを smoke で再確認 |

## 完了条件チェックリスト

- [ ] 4 設計成果物（redirect-uri-matrix / secrets-placement-matrix / consent-screen-spec / staging-vs-production-runbook）の構造が定義済
- [ ] 単一 OAuth client / 単一 consent screen 方針が固定
- [ ] secrets 配置表が `op://` 参照のみで構成され、実値の場所が指定されていない
- [ ] consent screen scope が最小権限（openid / email / profile）に固定
- [ ] privacy / terms / home URL が 200 必須であることを runbook に記載
- [ ] 段階適用フロー A → B → C と段階間ゲート条件が固定
- [ ] B-03 解除条件 a/b/c のうち優先順位が a > b > c で確定
- [ ] 仕様語 ↔ 実装語対応表が 6 行以上

## 多角的チェック観点

- 不変条件: D1 / Sheets / `apps/web` 直接 D1 アクセスのいずれにも影響しない。
- セキュリティ: secrets を平文で出さない。screenshot に token / secret が映らないように撮影手順を Phase 5 で固定。
- AI 学習混入防止: 仕様書内に client_id / client_secret / auth-secret 等の実値を絶対に書かない。
- 運用: `wrangler login` 禁止 / `scripts/cf.sh` 単一経路の方針を runbook に再掲。
- 観測性: `wrangler-dev.log` を staging smoke 中に取得し、callback / session resolve / admin gate の各 log entry が出ていることを Phase 11 で確認できる粒度で runbook を書く。

## 統合テスト連携

| 連携先 | 本 Phase の扱い |
| --- | --- |
| 05a JWT/session tests | Phase 4 で再実行対象にし、Auth.js cookie と API verifier の互換確認へ接続する |
| OAuth smoke checklist | Redirect URI / consent screen / secrets matrix を Phase 11 smoke の入力にする |
| aiworkflow indexes | Phase 12 same-wave sync の対象として、本 Phase の 4 設計成果物名を引き渡す |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/oauth-redirect-uri-matrix.md | redirect URI 一覧表 |
| ドキュメント | outputs/phase-02/secrets-placement-matrix.md | Secrets 配置表 |
| ドキュメント | outputs/phase-02/consent-screen-spec.md | consent screen 仕様 |
| ドキュメント | outputs/phase-02/staging-vs-production-runbook.md | 段階適用 runbook |

## 次 Phase への引き渡し

- 次 Phase: 3 (設計レビューゲート)
- 引き継ぎ事項:
  - 4 設計成果物の構造と方針（単一 OAuth client / 最小権限 scope / 段階適用 / B-03 解除条件 a > b > c）
  - 仕様語 ↔ 実装語対応表
  - secrets 配置表の `op://` 参照原則
- ブロック条件:
  - 4 設計成果物のいずれかに drift（redirect URI と consent screen authorized domain の不一致など）
  - secrets 配置表に実値が混入
  - scope が最小権限を超える
