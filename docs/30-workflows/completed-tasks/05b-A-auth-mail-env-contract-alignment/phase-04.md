# Phase 4: テスト戦略 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 4 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1-3 で確定した正本 env 契約（`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL`）と production fail-closed (502 `MAIL_FAILED`) を、自動テスト・契約テスト・手動 smoke・doc grep の 4 経路で検証するテスト境界を定義する。本 Phase は実装・実測を行わず、テスト計画と evidence path のみを定める。

## テスト境界の整理

| レイヤ | 対象 | 実行方式 | 実行タイミング |
| --- | --- | --- | --- |
| L1: 単体 | `resolveMailSender` factory / `createResendSender` の env 名読み取り | Vitest（API package、`process.env` 経由 mock） | CI / ローカル `pnpm test` |
| L2: 契約 | `apps/api` Workers binding 経由の Env interface (L62-66) と `wrangler.toml [vars]` の name 一致 | Vitest + 型 (`tsc --noEmit`) で Env interface key と spec docs の表記一致を検証 | CI |
| L3: doc grep | spec docs / aiworkflow / runbook に旧名 (`RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `SITE_URL`) 残存がないこと | `rg` ベースのスクリプト | CI / lefthook pre-commit |
| L4: staging smoke | `bash scripts/cf.sh secret list --env staging` の name 確認 + `POST /auth/magic-link` 200 | 手動 (Phase 11)、user 承認後 | Phase 11 |
| L5: production readiness | production 未設定時の 502 `MAIL_FAILED` を staging fixture で再現確認 | 手動 (Phase 11)、user 承認後 | Phase 11 |

## L1: env 名一致の単体検証

### テスト観点

- `Env.MAIL_PROVIDER_KEY` 未設定 → `resolveMailSender` が no-op sender を返し `ok: false` で `errorMessage: "MAIL_PROVIDER_KEY not configured"` を伝搬する
- `Env.MAIL_PROVIDER_KEY` 設定 + `MAIL_FROM_ADDRESS` 設定 → `createResendSender` が `Authorization: Bearer ***` ヘッダを構築する（mock 経由、実値は fixture に書かない）
- `AUTH_URL` 未設定 → `defaultBuildMagicLinkUrl` が `http://localhost:3000` fallback を返す（dev 用途）
- `AUTH_URL` 設定 → fallback ではなく env 値を使う

### fixture ルール

- env 値は `'TEST_PLACEHOLDER'` のような明示的プレースホルダのみ使用
- 実 Resend API key 形式 (`re_xxx`) を fixture に書かない（不変条件 #16）
- fetch は `vi.fn()` で stub し、Resend に到達しない

### evidence path

- `outputs/phase-04/main.md`（test plan）
- 実装時は `apps/api/src/services/mail/__tests__/magic-link-mailer.test.ts`（本タスクでは作成しない、別タスクへ委譲）

## L2: Workers binding 契約テスト

### テスト観点

- `apps/api/src/index.ts` の Env interface key と、`docs/00-getting-started-manual/specs/10-notification-auth.md` § "環境変数" 表に列挙された env 名が一致する（rg + jq ベースで型→docs の整合）
- `apps/api/wrangler.toml` の `[vars]` に `MAIL_FROM_ADDRESS` / `AUTH_URL` が staging / production 別に定義されている
- `[vars]` には `MAIL_PROVIDER_KEY` を **書かない**（Secret 専用）— 契約テストで存在しないことを検証

### evidence path

- `outputs/phase-04/main.md`（契約 matrix）
- 実装時 CI: `.github/workflows/verify-env-contract.yml`（本タスクでは作成しない）

## L3: doc grep test（旧名残存検出）

### テスト観点

```
rg -n 'RESEND_API_KEY|RESEND_FROM_EMAIL|\bSITE_URL\b' \
   docs/00-getting-started-manual/specs \
   .claude/skills/aiworkflow-requirements/references \
   docs/30-workflows
```

期待: 0 件 hit。hit した場合は CI fail。`SITE_URL` は単語境界 `\b` で囲い、`SITE_URL_PROD` のような派生名と衝突しないようにする。

### 例外パス

- 本タスク自身の Phase docs（drift 説明のため旧名を引用する箇所）には `<!-- doc-grep-allow: legacy-name -->` のようなコメントマーカーを付け、grep スクリプト側で除外する設計とする（実装は Phase 5 runbook で別タスク委譲）。

### evidence path

- `outputs/phase-04/main.md`（grep 設計）
- 実測 evidence: `outputs/phase-09/main.md`（QA 実行時に rg 結果ログを添付、ただし hit 0 件のサマリ行のみ記録）

## L4: staging Magic Link smoke のテスト境界

### 境界定義

| 検証項目 | 対象 | 境界 |
| --- | --- | --- |
| name 確認 | `bash scripts/cf.sh secret list --env staging` | 出力の name 列に `MAIL_PROVIDER_KEY` が存在することのみ確認。値・暗号化メタ情報は確認しない |
| from 確認 | `bash scripts/cf.sh wrangler vars list --env staging`（または `wrangler.toml` 直読み） | `MAIL_FROM_ADDRESS` / `AUTH_URL` が staging 値で存在 |
| 送信前バリデーション | `POST /auth/magic-link` ハンドラ内の Env 解決経路 | env 解決 → sender 構築まで成功し 200 `{ state: "sent" }` を返すこと |
| 実送信 | Resend HTTP API 到達 | user 承認後のみ。受信トレイ到達確認後、token / 本文を evidence に転記しない |

### 自走禁止

- `bash scripts/cf.sh deploy` の自動実行
- 実 Resend API への送信を伴う smoke の自走実行
- `op read` 出力のログ転記

### evidence path

- `outputs/phase-11/main.md`（手動 smoke evidence、state 値 + timestamp のみ）

## L5: production fail-closed 検証

### テスト観点

- production env で `MAIL_PROVIDER_KEY` 未設定 → `POST /auth/magic-link` が 502 `{ code: "MAIL_FAILED", message: "MAIL_PROVIDER_KEY not configured" }` を返す
- 検証は production への直接 deploy ではなく、staging で `MAIL_PROVIDER_KEY` を一時 unset した fixture 環境での再現に閉じる（user 承認後 Phase 11 で実施）
- 起動時 boot fail は採用しない（Phase 2 設計）ため `/healthz` は env 不在でも 200 を返すことを併せて検証

### evidence path

- `outputs/phase-11/main.md`（fail-closed 再現 evidence）
- `outputs/phase-06/main.md`（異常系 detail）

## secret 実値を test fixture に書かない方針

- fixture / mock / snapshot に Resend API key 形式 (`re_*`)、JWT、メールアドレス実値を書かない
- 例外は `noreply@example.com` のような明示的 dummy のみ
- `op read` 出力を test 内に直接転記しない。test は env 名の解決経路のみを検証する
- snapshot 更新時は値が含まれないことを review チェックリストに含める（Phase 9 / 10 で確認）

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 5 レイヤ（L1-L5）の境界が表で確定する。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC-1〜AC-5 と L1-L5 の対応が取れる。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作（deploy / 実送信 / op read 転記）が明記される。
4. doc grep 設計を確定する。完了条件: rg コマンドと例外マーカー設計が記録される。

## 参照資料

- docs/00-getting-started-manual/specs/10-notification-auth.md（§ 環境変数）
- docs/00-getting-started-manual/specs/08-free-database.md（§ シークレット配置）
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- apps/api/src/index.ts（Env interface, `resolveMailSender`）
- apps/api/src/routes/auth/index.ts（`POST /auth/magic-link` 502 path）
- apps/api/src/services/mail/magic-link-mailer.ts（`createResendSender` / no-op sender）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- テスト実装は別タスクへ委譲する旨を runbook (Phase 5) に明記する。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B Magic Link callback follow-up（`AUTH_URL` 共有）, 09a staging auth smoke（L4）, 09c production deploy readiness（L5）

## 多角的チェック観点

- #16 secret values never documented: fixture / snapshot に値・JSON 抜粋・値ハッシュを残さない
- #15 Auth session boundary: テストは Magic Link send 経路のみを対象とし `AUTH_SECRET` / JWT 経路に踏み込まない
- #14 Cloudflare free-tier: テストで Resend 課金を発生させない（mock 経由 / 受信確認は 1 通のみ）
- 未実装 / 未実測を PASS と扱わない: L1 の test plan のみで AC-4 (smoke) を満たしたとみなさない
- プロトタイプと仕様書の採用 / 不採用を混同しない: GAS prototype の挙動を test fixture の正本にしない

## サブタスク管理

- [ ] refs を確認する
- [ ] AC と evidence path を対応付ける（AC-1〜AC-5 ↔ L1-L5）
- [ ] blocker / approval gate を明記する（deploy / 実送信 / op read 転記）
- [ ] doc grep 設計（rg コマンド + 例外マーカー）を記録する
- [ ] secret 実値を fixture に書かない方針を明記する
- [ ] outputs/phase-04/main.md を作成する

## 成果物

- outputs/phase-04/main.md（5 レイヤテスト境界 / fixture ルール / doc grep 設計 / fail-closed 再現方針 / approval gate）

## 完了条件

- env 名の正本が1つに統一される（L2 契約テストで担保）
- Cloudflare/1Password/runbook の配置先が一致する（L4 name 確認で担保）
- production で未設定時 fail-closed の仕様が明記される（L5 で 502 `MAIL_FAILED` 再現方針）
- staging smoke で Magic Link メール送信設定を確認できる（L4 境界）
- secret 実値が repo/evidence に残らない（fixture ルール / evidence 記録ルール）

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 5（実装ランブック）へ次を渡す:

- L1-L5 のテスト境界と evidence path
- doc grep スクリプトの設計（rg コマンドと例外マーカー）
- fixture ルール（実値・JSON 抜粋を書かない）
- staging smoke / production fail-closed 再現の自走禁止操作
- テスト実装の別タスク委譲方針
