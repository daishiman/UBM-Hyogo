# Phase 3: 設計レビュー — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 3 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 の要件と Phase 2 の設計を、3 系統（システム / 戦略・価値 / 問題解決）と 4 条件（矛盾なし・漏れなし・整合性・依存関係整合）でレビューし、不変条件 #14 / #15 / #16 との整合および上流・下流タスクとのブロック解消条件を確定する。

## 3 系統レビュー

### A. システム系（構造・契約・実装整合）

| 観点 | 確認内容 | 判定 |
| --- | --- | --- |
| 命名の責務一致 | `MAIL_PROVIDER_KEY` は provider 抽象、`AUTH_URL` は Auth.js 規約近接、`MAIL_FROM_ADDRESS` は意味直接 | OK |
| 実装と仕様の同名性 | `apps/api/src/env.ts` の Env type が新正本名と一致 | OK |
| Variable / Secret 区分の正しさ | `MAIL_PROVIDER_KEY` のみ Secret、`MAIL_FROM_ADDRESS` / `AUTH_URL` は Variable で `wrangler.toml [vars]` 配置可（公開可能性で分離） | OK |
| API 契約の保全 | `POST /auth/magic-link` の 200 / 502 `MAIL_FAILED` 仕様は既存 `routes/auth/index.ts` (L91-92) と一致 | OK |
| AuthRouteEnv の整合 | `AuthRouteEnv` (L34-39) は `AUTH_URL` / `MAIL_FROM_ADDRESS` を保持。`MAIL_PROVIDER_KEY` は親 Env からのみ参照され `resolveMailSender` factory で抽象化される | OK |
| `defaultBuildMagicLinkUrl` (L54-62) | `AUTH_URL` を fallback `http://localhost:3000` で組み立て、staging / production ではかならず env で上書きされる前提 | OK |

### B. 戦略・価値系（運用・コスト・将来拡張）

| 観点 | 確認内容 | 判定 |
| --- | --- | --- |
| provider 中立化の価値 | `MAIL_PROVIDER_KEY` は Resend 以外 (SendGrid / SES) への差し替えに耐える命名 | OK |
| solo dev / MVP 運用適合 | alias 不採用は廃語経路の保守コストを排除し誤投入リスクを下げる | OK |
| Cloudflare free-tier (#14) | 新規 Secret 数を増やさず、3 値の名前統一に留める。KV / D1 への新規依存なし | OK |
| 1Password 正本運用 | `op://UBM-Hyogo/auth-mail-<env>/MAIL_PROVIDER_KEY` で UT-25 / UT-27 と整合 | OK |
| 将来の Auth.js Email Provider 統合 | `AUTH_URL` 命名は Auth.js v5 の `AUTH_URL` / `NEXTAUTH_URL` 系と互換性が高く、05b-B の Credentials Provider 接続でも再利用可 | OK |

### C. 問題解決系（真の論点・因果・改善優先順位）

#### 真の論点

「spec docs を実装に合わせるか、実装を spec に合わせるか」ではなく、「provider 固有名 (`RESEND_*`) を契約面に出すか / 抽象名 (`MAIL_*`) を出すか」が真の論点。後者は将来 provider 差し替えに耐え、前者は運用名と実装名の二重メンテを生む。

#### 因果と境界

| 因 | 果 | 境界 |
| --- | --- | --- |
| spec が `RESEND_*` を要求 | Cloudflare Secrets / runbook が provider 名で固定化 | provider 切替時に Cloudflare Secrets 名 rename が必要になる |
| 実装が `MAIL_PROVIDER_KEY` を採用 | provider 切替時はコード差分のみで済む | 切替時に Resend 固有レスポンス (`json.id`) のパースは別タスクで剥がす必要 |

#### 価値とコスト

| 案 | 価値 | コスト |
| --- | --- | --- |
| spec を実装に片寄せ（採用） | 一度きりの spec diff、長期の provider 中立性確保 | spec 読者が `MAIL_PROVIDER_KEY` を Resend と理解する補助記述が必要 |
| 実装を spec に片寄せ（不採用） | spec の Resend 固有名がそのまま読みやすい | 実装抽象化の利点喪失、`createResendSender` の再命名・provider 切替時の env rename 必要 |
| alias を実装に追加（不採用） | 旧 secret 投入経路の互換性 | 廃語経路の保守と secret 二重投入リスク |

#### 改善優先順位

1. spec docs (10-notification-auth.md / 08-free-database.md) の片寄せ更新（Phase 12）
2. Phase 5 runbook で `bash scripts/cf.sh secret put` 手順の明記
3. Phase 11 staging smoke AC の更新（name 確認 + 200 evidence）
4. aiworkflow references への cross-reference 追記（任意拡張）

## 4 条件評価

### 矛盾なし

- spec の更新方向（実装に片寄せ）と aiworkflow-requirements の現状記述が一致する
- production 502 `MAIL_FAILED` は実装挙動 (L213-218) と仕様提案が一致する
- 矛盾なし: PASS

### 漏れなし

- 旧名 3 つ (`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`) すべてに新正本名が割り当て済み
- staging / production / dev / test の 4 環境で `MAIL_PROVIDER_KEY` 設定状態 × 期待挙動マトリクスが網羅
- 追従対象に runbook (Phase 5) / smoke (Phase 11) / docs (Phase 12) の 3 経路が含まれる
- 漏れなし: PASS

### 整合性

- Variable / Secret 区分が `08-free-database.md` § "シークレット配置" と `wrangler.toml [vars]` 運用で整合
- 1Password vault path 形式が UT-25 (`GOOGLE_SERVICE_ACCOUNT_JSON`) / UT-27 (`CLOUDFLARE_API_TOKEN`) と命名規則上整合
- 整合性: PASS

### 依存関係整合

- 上流 05b（Magic Link provider 本体）は実装側 env が `MAIL_PROVIDER_KEY` で確定済み → 本タスクは確定済み実装に spec を合わせるだけで blocking 解消
- 下流 05b-B（callback credentials provider）は `AUTH_URL` を流用するため、本タスクで `AUTH_URL` を正本固定することで前提条件が整う
- 下流 09a（staging deploy smoke）は本タスクで AC-4 を `secret list` name 確認 + 200 evidence に明文化することで実行可能になる
- 下流 09c（production deploy）は production fail-closed (502 `MAIL_FAILED`) 仕様化により未設定 deploy が即発見される（fail-closed の運用契約）
- 依存関係整合: PASS

## 不変条件との整合確認

| 不変条件 | 確認内容 | 判定 |
| --- | --- | --- |
| #16 secret values never documented | 全 Phase outputs / 仕様書本文に env 名・op:// 参照のみ。値・値ハッシュ・JSON 抜粋・provider response body を記録しない。staging smoke evidence は state 値と timestamp のみ | OK |
| #15 Auth session boundary | `AUTH_SECRET` は 05a と共有のまま据え置き。本タスクは Magic Link send 側の env のみ触り、session JWT 経路 (`13-mvp-auth.md`) に影響しない | OK |
| #14 Cloudflare free-tier | 新規 Secret / Variable を作らず既存 3 値の名前確定に留める。KV / D1 / cron 追加なし。Resend 1 経路維持 | OK |

## 上流 / 下流ブロック解消条件

### 上流ブロック

| 上流タスク | 解消条件 |
| --- | --- |
| 05b Magic Link provider 本体 | 本タスクは「実装に spec を合わせる」一方向更新のため、05b 実装の env 命名再変更を要求しない。05b 完了状態を保ったまま blocking 解消 |
| `10-notification-auth.md` / `08-free-database.md` | Phase 12 で 3 行（`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`）の置換と Variable / Secret 種別追記 |
| `environment-variables.md` / `deployment-secrets-management.md` | 既に正本表記。spec への cross-reference を Phase 12 で追加（任意） |

### 下流ブロック解消

| 下流タスク | 解消条件 |
| --- | --- |
| `05b-B-magic-link-callback-credentials-provider` | `AUTH_URL` / `MAIL_FROM_ADDRESS` の正本確定により callback URL 組み立てと from 表示の前提が固まる |
| `09a-A-staging-deploy-smoke-execution` | staging smoke AC が「`secret list` name 3 値確認 + `POST /auth/magic-link` 200 + 受信トレイ到達」に明文化される。実値・本文・token は evidence に残さない |
| `09c-A-production-deploy-execution` | production 未設定時の fail-closed (502 `MAIL_FAILED`) が仕様化され、deploy readiness check で `secret list` name 不在を検出可能 |

## 真因の再確認（Phase 1 との整合）

Phase 1 で記録した真因「spec / 実装 / aiworkflow の 3 者ドリフト」は Phase 2 の設計（実装語に片寄せ）で解消方針が確定。本 Phase で 4 条件すべて PASS かつ不変条件 #14 / #15 / #16 整合を確認したため、レビューゲートを通過とする。

## レビュー結果サマリ

| 項目 | 結果 |
| --- | --- |
| 採用 env 名 | `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`（実装語に片寄せ） |
| 後方互換 alias | 不採用（spec / aiworkflow / runbook の一方向更新で完了） |
| production fail-closed | request 単位 502 `MAIL_FAILED`（boot fail 不採用） |
| 追従対象 | spec 2 / aiworkflow 2 / runbook (Phase 5 / 11) / smoke AC |
| 不変条件 #14 / #15 / #16 | 全 PASS |
| 4 条件評価 | 全 PASS |
| 上流 / 下流ブロック | 解消条件確定 |

## 実行タスク

1. 3 系統（システム / 戦略・価値 / 問題解決）でレビューする。完了条件: 各系統で OK / NG 判定が記録される。
2. 4 条件（矛盾なし・漏れなし・整合性・依存関係整合）を評価する。完了条件: 全 4 条件で PASS 判定が固定される。
3. 不変条件 #14 / #15 / #16 との整合を確認する。完了条件: 各不変条件に確認内容が紐付く。
4. 上流 / 下流のブロック解消条件を確定する。完了条件: 5 タスク（05b / spec 2 / aiworkflow 2 = 上流、05b-B / 09a / 09c = 下流）すべてに解消条件が記載される。

## 参照資料

- Phase 1 の真因・影響範囲・AC 対応表
- Phase 2 の採用 env 名・対応表・同期マッピング・fail-closed 仕様
- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/13-mvp-auth.md（session 境界の不変条件 #15 確認用）
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- apps/api/src/index.ts, routes/auth/index.ts, services/mail/magic-link-mailer.ts

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit / push / PR 作成、Cloudflare Secrets / 1Password への実値登録を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体, `10-notification-auth.md`, `environment-variables.md`, `deployment-secrets-management.md`
- 下流: `05b-B-magic-link-callback-credentials-provider`, `09a-A-staging-deploy-smoke-execution`, `09c-A-production-deploy-execution`

## 多角的チェック観点

- #16 secret values never documented: レビュー結論にも実値・値ハッシュを残さない
- #15 Auth session boundary: `AUTH_SECRET` を本タスクで触らないことの確認
- #14 Cloudflare free-tier: Secret / Variable の新規追加ゼロ
- 未実装 / 未実測を PASS と扱わない: レビュー PASS は AC-4 の smoke 実測代替にならない
- プロトタイプと仕様書の採用 / 不採用を混同しない: GAS prototype の `RESEND_*` をレビュー判断材料に持ち込まない

## サブタスク管理

- [ ] 3 系統レビューを完了した
- [ ] 4 条件評価で全 PASS を確認した
- [ ] 不変条件 #14 / #15 / #16 の整合を確認した
- [ ] 上流 / 下流のブロック解消条件を確定した
- [ ] outputs/phase-03/main.md を作成した

## 成果物

- outputs/phase-03/main.md（3 系統レビュー / 4 条件評価 / 不変条件整合 / 上流下流ブロック解消条件 / レビュー結果サマリ）

## 完了条件

- 3 系統レビューと 4 条件評価で全 PASS が記録されている
- 不変条件 #14 / #15 / #16 への整合確認が表で残っている
- 上流 / 下流のブロック解消条件が下流 3 タスクすべてに紐付いている
- レビュー結果サマリが Phase 4 以降の判断材料として参照可能になっている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 4（テスト戦略）へ次を渡す:

- レビュー PASS 済みの採用 env 名 3 値と fail-closed 仕様
- staging smoke の AC（`secret list` name 確認 + 200 + 受信トレイ到達）
- production fail-closed のテスト観点（502 `MAIL_FAILED` の error code 検証）
- secret 実値を evidence に残さないテスト記録ルール
- 上流 / 下流ブロック解消条件（テスト戦略の出口判断材料）
