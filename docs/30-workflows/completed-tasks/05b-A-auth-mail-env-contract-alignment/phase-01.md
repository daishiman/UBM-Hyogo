# Phase 1: 要件定義 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 1 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Magic Link / 認証メールに関する環境変数名のドリフト（spec docs / 現行実装 / aiworkflow-requirements の三者不一致）を構造化し、正本 env 名・配置先・production fail-closed 仕様・追従対象を確定するための要件を文書化する。本 Phase ではコード変更・secret 投入・deploy・commit / push / PR を一切行わない。

## 真因 (root cause)

3 系統のドキュメント / コードが別々の env 名で同一概念を表しており、Cloudflare Secrets 投入・runbook・実装のどこを正本にするかが曖昧になっている。

| 概念 | `docs/00-getting-started-manual/specs/10-notification-auth.md` (#83-85) と `08-free-database.md` (#69-79) | 現行実装 (`apps/api/src/index.ts` L46-66, `routes/auth/index.ts` L34-62) | aiworkflow-requirements (`environment-variables.md` L73-82, `deployment-secrets-management.md`) |
| --- | --- | --- | --- |
| Resend API key | `RESEND_API_KEY` | `MAIL_PROVIDER_KEY` | `MAIL_PROVIDER_KEY` |
| 差出人アドレス | `RESEND_FROM_EMAIL` | `MAIL_FROM_ADDRESS` | `MAIL_FROM_ADDRESS` |
| Magic Link base URL | `SITE_URL` | `AUTH_URL` | `AUTH_URL` |

実装側はすでに `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を Variable / Secret 契約として運用しており、Resend は実装の一形態（`createResendSender`）であって provider 名ではない。spec docs だけが provider 固有名 (`RESEND_*`) を露出している点が drift の起点となっている。

## scope と境界

### Scope In

- 正本 env 名の確定: `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を採用する方向の評価軸を明文化する
- 後方互換 alias の必要性判断（MVP / solo dev 運用の前提下）
- spec docs (10-notification-auth.md / 08-free-database.md) を実装・aiworkflow に合わせて更新する片寄せ方針
- Cloudflare Secrets / 1Password Vault path / `.env` op 参照 / runbook の同期マッピング
- production 未設定時 fail-closed の仕様（HTTP status / error code / 起動時 boot fail の有無）
- staging Magic Link smoke の AC 更新ポイント
- 追従ドキュメントの一覧化（spec / aiworkflow references / runbook / Phase 5 / Phase 11）

### Scope Out

- メール provider の差し替え（Resend 以外への変更）
- secret 実値の取得・登録・rotation 実行
- production deploy の自走実行
- 通知基盤 UT-07 の機能追加
- 本タスク内での commit / push / PR

## 影響範囲

| 種別 | パス / 対象 | 想定変更 |
| --- | --- | --- |
| 仕様書 | `docs/00-getting-started-manual/specs/10-notification-auth.md` (環境変数表) | `RESEND_API_KEY` → `MAIL_PROVIDER_KEY`、`RESEND_FROM_EMAIL` → `MAIL_FROM_ADDRESS`、`SITE_URL` → `AUTH_URL` に更新（実装語に正本を片寄せ） |
| 仕様書 | `docs/00-getting-started-manual/specs/08-free-database.md` (シークレット配置表) | `RESEND_API_KEY` 行を `MAIL_PROVIDER_KEY` に置換、`MAIL_FROM_ADDRESS` / `AUTH_URL` を追記 |
| 実装 | `apps/api/src/index.ts` (Env interface), `apps/api/src/routes/auth/index.ts`, `apps/api/src/services/mail/magic-link-mailer.ts` | env 名は変更しない。production 未設定時 fail-closed の挙動を仕様として裏打ちする |
| aiworkflow refs | `.claude/skills/aiworkflow-requirements/references/environment-variables.md`, `deployment-secrets-management.md` | 正本確定後 cross reference を spec docs に張り直す |
| runbook | Phase 5 (実装ランブック), Phase 11 (手動 smoke) | `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を `bash scripts/cf.sh secret put / wrangler.toml [vars]` 経路で配置する手順を確定 |
| 1Password | `op://UBM-Hyogo/auth-mail/MAIL_PROVIDER_KEY`（仮 path）等の Vault item | 正本配置を runbook で指示するのみ。本タスクで実値登録は行わない |
| Cloudflare | `bash scripts/cf.sh secret put MAIL_PROVIDER_KEY --config apps/api/wrangler.toml --env <staging\|production>` | 実投入は user 承認後の Phase 5 / Phase 11 で実施 |

## 自走禁止操作 (approval gate)

以下は本仕様作成タスクおよび後続実装フェーズで Claude Code が自走してはならない。user の明示承認を取ってから実行する。

1. 1Password / Cloudflare Secrets への実 secret 値の `op read` / `secret put`
2. `bash scripts/cf.sh deploy` の staging / production 実行
3. Magic Link 実送信を伴う smoke (Resend 課金経路への到達)
4. spec / aiworkflow / runbook の commit / push / PR 作成
5. 旧 env 名 (`RESEND_API_KEY` 等) を Cloudflare Secrets / 1Password に新規投入する操作

## AC と evidence path 対応表

| # | AC（index.md より） | 達成条件 | evidence path（実測時） |
| --- | --- | --- | --- |
| AC-1 | env 名の正本が 1 つに統一される | spec docs / 実装 / aiworkflow が `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を共通参照する | `outputs/phase-12/main.md`（spec diff サマリ） |
| AC-2 | Cloudflare / 1Password / runbook の配置先が一致する | 三者で env 名・vault path・配置先 (Secret/Variable) が table で一致 | `outputs/phase-02/main.md`（同期マッピング表）, `outputs/phase-05/main.md`（runbook） |
| AC-3 | production で未設定時 fail-closed の仕様が明記される | `MAIL_PROVIDER_KEY` 未設定時 production は 502 `MAIL_FAILED`（既存実装挙動）を spec として明文化 | `outputs/phase-02/main.md`（fail-closed 仕様）, `outputs/phase-06/main.md`（異常系） |
| AC-4 | staging smoke で Magic Link メール送信設定を確認できる | staging で `bash scripts/cf.sh secret list --env staging` の name 確認と `POST /auth/magic-link` の `state=sent` evidence | `outputs/phase-11/main.md`（smoke evidence） |
| AC-5 | secret 実値が repo / evidence に残らない | 全 outputs に env 名と `op://` 参照のみ。値および値ハッシュ・JSON 抜粋を記録しない | `outputs/phase-09/main.md`（QA チェック）, `outputs/phase-10/main.md`（最終レビュー） |

## 実行タスク

1. 真因（spec / 実装 / aiworkflow の env 名ドリフト）を 3 列対応表として記録する。完了条件: 上記「真因」セクションが固定される。
2. Scope In / Out と影響範囲を確定する。完了条件: 影響範囲表のすべての行に「想定変更」が記載される。
3. 自走禁止操作を列挙し、Phase 5 / 11 への申し送り対象として整理する。完了条件: approval gate リストが本 Phase に明記される。
4. AC ↔ evidence path 対応表を確定する。完了条件: AC-1〜AC-5 すべてに evidence 出力先が割り当てられる。

## 参照資料

- docs/00-getting-started-manual/specs/10-notification-auth.md（§ 環境変数 #76-87）
- docs/00-getting-started-manual/specs/08-free-database.md（§ シークレット配置 #65-79）
- .claude/skills/aiworkflow-requirements/references/environment-variables.md（Cloudflare Workers / Auth + Magic Link 表 #72-82）
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- apps/api/src/index.ts（Env interface L46-66, mail sender resolve L204-225）
- apps/api/src/routes/auth/index.ts（AuthRouteEnv L34-62）
- apps/api/src/services/mail/magic-link-mailer.ts（`createResendSender` L64-97）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit / push / PR 作成、Cloudflare Secrets / 1Password への実値登録を行わない。
- 実装・実測時は Phase 5（実装ランブック）/ Phase 11（手動 smoke / 実測 evidence）の runbook と evidence path に従う。
- secret 値は `op read` の出力をログ・evidence・PR 本文に転記しない。env 名と `op://Vault/Item/Field` 参照のみを記録する。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体タスク, `10-notification-auth.md`, `environment-variables.md`, `deployment-secrets-management.md`
- 下流:
  - `05b-B-magic-link-callback-credentials-provider`（callback 経路 / Credentials provider 統合の前提として env 契約が確定している必要）
  - `09a-A-staging-deploy-smoke-execution`（staging Magic Link smoke は本タスク確定の env 名を前提）
  - `09c-A-production-deploy-execution`（production deploy readiness、特に fail-closed 検証）

## 多角的チェック観点

- 不変条件 #16 (secret values never documented): 実値・JSON 抜粋・値ハッシュを記録しないこと
- 不変条件 #15 (Auth session boundary): env 名整理の影響が JWT-only セッション境界 (`13-mvp-auth.md`) を侵食しないこと
- 不変条件 #14 (Cloudflare free-tier): Resend 1 経路維持・KV / D1 を新規追加しないこと
- 未実装 / 未実測を PASS と扱わない: spec 更新だけで AC-4 (smoke) を満たしたとみなさない
- プロトタイプと仕様書の採用 / 不採用を混同しない: GAS prototype の挙動を本タスクの正本判断材料にしない
- spec を実装側へ片寄せする判断が、過去の `RESEND_*` 命名に依存する外部ドキュメント / runbook を孤立させないか確認する

## サブタスク管理

- [ ] 真因を 3 列対応表で記録した
- [ ] Scope In / Out と影響範囲を確定した
- [ ] approval gate を明記した
- [ ] AC と evidence path を対応付けた
- [ ] outputs/phase-01/main.md に上記要件を転記した

## 成果物

- outputs/phase-01/main.md（本 Phase で確定した要件・真因・影響範囲・AC マッピング・approval gate）

## 完了条件

- env 名の正本候補（`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`）が 1 つの基準軸（実装と aiworkflow に片寄せ）として明文化されている
- Cloudflare / 1Password / runbook / spec docs の配置先マッピング案が表で示されている
- production 未設定時 fail-closed の現行挙動（502 `MAIL_FAILED`）が要件として記録されている
- staging smoke の AC が evidence path と紐付いている
- secret 実値が repo / evidence に残らないルールが明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 2（設計）へ次を渡す:

- 採用 env 名の方向性: 実装語（`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`）への片寄せ
- 後方互換 alias の判断材料: solo dev / MVP / 既存 Cloudflare Secrets 未投入の前提
- 同期マッピング対象: spec 2 ファイル / aiworkflow 2 ファイル / runbook (Phase 5 / 11)
- production fail-closed 要件: 502 `MAIL_FAILED` を仕様として明文化
- approval gate リストと AC ↔ evidence path 対応表
