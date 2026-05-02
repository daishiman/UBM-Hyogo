# Phase 2: 設計 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 2 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した真因と方向性を受けて、最小責務で「env 名・配置先・fail-closed 仕様・追従対象」を確定する設計を提示する。実装変更は最小化し、spec docs と aiworkflow references の片寄せ更新で drift を解消する。

## 採用 env 名の決定

### 決定: 実装語に片寄せする（aiworkflow-requirements と整合）

| 概念 | 採用 env 名 (正本) | 種別 | 不採用とする旧名 |
| --- | --- | --- | --- |
| Magic Link mail provider API key | `MAIL_PROVIDER_KEY` | Secret | `RESEND_API_KEY` |
| 差出人メールアドレス | `MAIL_FROM_ADDRESS` | Variable | `RESEND_FROM_EMAIL` |
| Magic Link URL の base | `AUTH_URL` | Variable | `SITE_URL` |
| Auth.js セッション署名鍵 | `AUTH_SECRET` | Secret | （変更なし、05a 共有） |

### 決定理由

1. **実装契約が既に `MAIL_PROVIDER_KEY` 等で固定**: `apps/api/src/env.ts` が Workers binding の env 名を定義し、`apps/api/src/index.ts` の mail sender factory が `MAIL_PROVIDER_KEY` を採用済み。`createResendSender` は実装の一形態であり、provider 名を env に露出しないことで将来の差し替えに耐える。
2. **aiworkflow-requirements が同名で配置を規定済み**: `environment-variables.md` § "Cloudflare Workers / Auth + Magic Link" に `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` を Secret / Variable で列挙済み。
3. **`SITE_URL` よりも `AUTH_URL` が責務的に正確**: Magic Link callback URL の組み立てに使う値であり、`/api/auth/callback/email` と一体で意味を持つため Auth.js 規約に近い `AUTH_URL` の方が責務名として妥当。
4. **spec docs は概念表記であり、実装非依存名への置換に副作用が少ない**: 仕様書側を片寄せ更新してもユーザー UX には影響しない。一方、実装側を `RESEND_*` に変えると `MAIL_*` 抽象化の意義（provider 中立化）が損なわれる。

## 仕様語 ↔ 実装語 対応表

| 旧 spec 名 (10-notification-auth.md / 08-free-database.md) | 新正本名 (本タスク確定) | 用途 | 配置 |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | `MAIL_PROVIDER_KEY` | Resend HTTP API Bearer (`Authorization`) | Cloudflare Secrets (staging / production) |
| `RESEND_FROM_EMAIL` | `MAIL_FROM_ADDRESS` | `from` フィールド既定値 | `apps/api/wrangler.toml` `[vars]` (環境別) |
| `SITE_URL` | `AUTH_URL` | `defaultBuildMagicLinkUrl` の base、`/api/auth/callback/email` 連結元 | `apps/api/wrangler.toml` `[vars]` (環境別) |
| `AUTH_SECRET` | `AUTH_SECRET` (変更なし) | Auth.js HS256 / JWT 署名 (05a 共有) | Cloudflare Secrets |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | 同上 (変更なし) | Google OAuth | Cloudflare Secrets |

## 後方互換 alias の判断

### 決定: alias を実装側に **新規追加しない**。spec / aiworkflow を実装に片寄せする一方向更新で完了とする。

| 観点 | 判断 |
| --- | --- |
| Cloudflare Secrets に旧名 (`RESEND_API_KEY` 等) が既に投入されているか | **No**（本タスクは secret 投入前の契約整流タスク。`bash scripts/cf.sh secret list` の name 確認は Phase 11 で実施） |
| 実装が旧名を fallback として読んでいるか | **No**（`apps/api/src/env.ts` と `apps/api/src/index.ts` に `RESEND_*` / `SITE_URL` への参照は無い） |
| solo dev / MVP 運用で alias を残す利益 | **小**（複数 owner / 同時運用がないため、廃語アクセス経路を保持するコストの方が高い） |
| 不変条件 #16 への影響 | alias を増やすほど secret 投入経路が分散し、誤投入時のクリーンアップコストが上がる |

例外: 万一 staging / production の Cloudflare Secrets に旧名が既投入されている事実が Phase 11 で検出された場合、Phase 5 runbook の rollback 経路（`secret delete` 後に正本名で再投入）に従って整流し、alias を実装側に追加しない。

## 同期マッピング（Cloudflare / 1Password / `.env` op 参照 / docs）

| env 名 | 種別 | Cloudflare 配置 | 1Password Vault path（仮、実値登録は user 承認後） | `.env` 記述 (op 参照のみ) | docs 記述ルール |
| --- | --- | --- | --- | --- | --- |
| `MAIL_PROVIDER_KEY` | Secret | `bash scripts/cf.sh secret put MAIL_PROVIDER_KEY --config apps/api/wrangler.toml --env <staging\|production>` | `op://UBM-Hyogo/auth-mail-<env>/MAIL_PROVIDER_KEY` | `MAIL_PROVIDER_KEY=op://UBM-Hyogo/auth-mail-local/MAIL_PROVIDER_KEY` | 実値・値ハッシュ・provider 固有メタ情報を記載しない |
| `MAIL_FROM_ADDRESS` | Variable | `apps/api/wrangler.toml` `[env.<env>.vars]` に直接記述 (非機密) | （Variable のため必須ではない） | （任意） | アドレスは公開可 |
| `AUTH_URL` | Variable | 同上 (`https://api.ubm-hyogo.workers.dev` 等) | （任意） | （任意） | URL は公開可、staging / production で値を分離 |

> **値登録の運用ルール** (`deployment-secrets-management.md` UT-25 / UT-27 と整合):
>
> - `op read "op://UBM-Hyogo/auth-mail-staging/MAIL_PROVIDER_KEY" | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY --config apps/api/wrangler.toml --env staging`
> - `--body "実値"` のように shell history に残す形を禁止する。stdin 経由のみ許容。
> - staging-first 固定。production 投入は staging の `secret list` name 確認後だけ実施する。
> - 1Password Item Notes には Last-Updated 日時のみ記録、値ハッシュは記録しない。

## production fail-closed 仕様

### 既存実装挙動の仕様化（`apps/api/src/index.ts` mail sender factory）

| 環境 | `MAIL_PROVIDER_KEY` の状態 | 期待挙動 | HTTP / error code |
| --- | --- | --- | --- |
| `production` | 設定済み | Resend HTTP API 経由で送信。`createResendSender` 経路。 | `POST /auth/magic-link` → 200 `{ state: "sent" }` |
| `production` | 未設定 | fail-closed: no-op sender が `ok: false, errorMessage: "MAIL_PROVIDER_KEY not configured"` を返し、route が `MAIL_FAILED` 502 を返す | `POST /auth/magic-link` → 502 `{ code: "MAIL_FAILED", message: "MAIL_PROVIDER_KEY not configured" }` |
| `staging` | 設定済み | 本番同等の Resend 送信を行う（実 Resend 課金経路。smoke は user 承認後のみ） | 200 |
| `staging` | 未設定 | dev 同等の no-op success（送信せず `state: "sent"` を返す）。staging smoke では「設定済み」を AC とする | 200 (smoke では NG 扱い) |
| `development` / `test` | 未設定 | no-op success（`state: "sent"`、メールは送信されない） | 200 |

### 起動時 boot fail の有無

- 採用しない。boot 時に `MAIL_PROVIDER_KEY` 不在で Worker 起動を拒否する設計は、cron (`scheduled` ハンドラ) や `/healthz` などの mail 非依存経路まで巻き込み、不変条件 #14 (free-tier monitor) と衝突する。
- 代わりに **request 単位の fail-closed**（`POST /auth/magic-link` で 502 `MAIL_FAILED`）に閉じる。これにより `/healthz` / `/public/*` / sync cron は影響を受けない。

## 追従対象とその更新方針

| 種別 | 対象 | 更新内容 |
| --- | --- | --- |
| spec | `docs/00-getting-started-manual/specs/10-notification-auth.md` § "環境変数" | `RESEND_API_KEY` → `MAIL_PROVIDER_KEY`、`RESEND_FROM_EMAIL` → `MAIL_FROM_ADDRESS`、`SITE_URL` → `AUTH_URL` に置換。種別列に Variable / Secret を追記。production fail-closed (502 `MAIL_FAILED`) の脚注を追加 |
| spec | `docs/00-getting-started-manual/specs/08-free-database.md` § "シークレット配置" | `RESEND_API_KEY` 行を `MAIL_PROVIDER_KEY` に置換、`MAIL_FROM_ADDRESS` / `AUTH_URL` を Variable として追記 |
| aiworkflow | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | 既に正本表記。spec docs への cross-reference を Phase 12 で更新 |
| aiworkflow | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | UT-25 / UT-27 同様の投入運用ルールに `MAIL_PROVIDER_KEY` を追記 (任意拡張) |
| 実装 | `apps/api/src/env.ts`, `apps/api/src/index.ts`, `routes/auth/index.ts`, `services/mail/magic-link-mailer.ts` | env 名は変更しない。本タスクではコード差分なし |
| runbook | Phase 5 (実装ランブック) | `bash scripts/cf.sh secret put` 手順、staging-first 順序、stdin 投入を明記 |
| smoke | 09a / 09c downstream runtime tasks | Phase 11 は readiness template のみ。staging の `secret list` name 確認、`POST /auth/magic-link` 200、受信 evidence、production fail-closed 実測は 09a / 09c に委譲 |

## staging Magic Link smoke の AC 更新内容

| AC | 旧（暗黙） | 新（本タスクで明文化） |
| --- | --- | --- |
| smoke 前提 | RESEND_* が staging に登録されていること | `MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` が staging Cloudflare Secrets / Variables に登録されていることを `bash scripts/cf.sh secret list --env staging` の **name 一覧** で確認する（値は確認しない） |
| smoke 実行 | curl で `POST /auth/magic-link` | 09a / 09c で user 承認後に実行。本 Phase 11 では readiness template だけを作る |
| 期待結果 | 200 + メール受信 | 09a: 200 `{ state: "sent" }` + 受信トレイ到達確認。09c: production readiness / fail-closed 境界確認。evidence は state 値と timestamp のみ記録、メール本文・token・実アドレスは evidence に転記しない |
| 失敗時 | 不明 | 09a / 09c 側で 502 `MAIL_FAILED` 受信時に `secret list` name 不在を確認し Phase 5 runbook に従って再投入。実値は logs / PR に出さない |

## 実行タスク

1. 採用 env 名と理由を確定する。完了条件: 上記「採用 env 名の決定」と「決定理由」が固定される。
2. 仕様語 ↔ 実装語対応表、後方互換 alias 判断、同期マッピングを確定する。完了条件: 3 つの表が互いに矛盾しない。
3. production fail-closed の HTTP / error code 仕様を実装挙動と紐付けて記述する。完了条件: 環境 × 設定状態のマトリクスが埋まる。
4. 追従対象と staging smoke AC の更新内容を一覧化する。完了条件: Phase 5 / Phase 11 / Phase 12 へ引き渡せる粒度になっている。

## 参照資料

- docs/00-getting-started-manual/specs/10-notification-auth.md（§ 環境変数）
- docs/00-getting-started-manual/specs/08-free-database.md（§ シークレット配置）
- .claude/skills/aiworkflow-requirements/references/environment-variables.md（§ Cloudflare Workers / Auth + Magic Link）
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md（UT-25 / UT-27 投入運用）
- apps/api/src/env.ts（Env type）
- apps/api/src/index.ts（mail sender resolve）
- apps/api/src/routes/auth/index.ts（AuthRouteEnv）
- apps/api/src/services/mail/magic-link-mailer.ts（`createResendSender`）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード変更、deploy、commit / push / PR 作成、Cloudflare Secrets / 1Password への実値登録を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。
- env 値・op 出力・Resend response body をログ / evidence / PR に転記しない。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体, `10-notification-auth.md`, `environment-variables.md`, `deployment-secrets-management.md`
- 下流: `05b-B-magic-link-callback-credentials-provider`, `09a-A-staging-deploy-smoke-execution`, `09c-A-production-deploy-execution`

## 多角的チェック観点

- 不変条件 #16 secret values never documented: env 名・vault path のみ記載、値は転記しない
- 不変条件 #15 Auth session boundary: `AUTH_SECRET` は 05a と共有のまま据え置き、本タスクで触らない
- 不変条件 #14 Cloudflare free-tier: 新規 Secret / Variable を増やさず既存 3 値の名前確定に留める
- 未実装 / 未実測を PASS と扱わない: 設計表のみで AC-4（staging smoke）達成と扱わない
- プロトタイプと仕様書の採用 / 不採用を混同しない: GAS prototype の `RESEND_*` は本タスクの正本判断材料にしない

## サブタスク管理

- [ ] 採用 env 名と理由を固定した
- [ ] 対応表 / alias 判断 / 同期マッピングを互いに矛盾なく整理した
- [ ] production fail-closed の HTTP / error code を仕様化した
- [ ] 追従対象と staging smoke AC の更新点を Phase 5 / 11 / 12 に渡せる形にした
- [ ] outputs/phase-02/main.md を作成した

## 成果物

- outputs/phase-02/main.md（採用 env 名 / 対応表 / 同期マッピング / fail-closed 仕様 / 追従対象 / smoke AC 更新内容）

## 完了条件

- 採用 env 名 (`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`) と決定理由が明文化されている
- Cloudflare / 1Password / runbook / spec docs の同期マッピングが表で揃っている
- production 未設定時 fail-closed が HTTP 502 `MAIL_FAILED` として仕様化されている
- staging smoke の前提・実行・期待結果・失敗時手順が AC 単位で記載されている
- secret 実値が repo / evidence に残らないルールが明記されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 3（設計レビュー）へ次を渡す:

- 採用 env 名 3 値と決定理由
- 後方互換 alias 不採用の判断材料
- production fail-closed の request 単位閉込み（boot fail 不採用）の根拠
- 追従対象 5 種（spec 2 / aiworkflow 2 / runbook 2 / smoke AC）
- 上流 (05b) / 下流 (05b-B / 09a / 09c) のブロック解消条件
