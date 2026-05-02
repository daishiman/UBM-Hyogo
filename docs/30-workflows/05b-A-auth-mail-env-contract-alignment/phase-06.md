# Phase 6: 異常系検証 — 05b-A-auth-mail-env-contract-alignment

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 05b-A-auth-mail-env-contract-alignment |
| phase | 6 / 13 |
| wave | 05b-fu |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation-spec / docs-only |
| visualEvidence | NON_VISUAL |

## 目的

`MAIL_PROVIDER_KEY` / `MAIL_FROM_ADDRESS` / `AUTH_URL` の未設定・不正・不一致・rotation 中・env drift 等の異常パターンを網羅し、検出方法と期待挙動を仕様化する。本 Phase は実測ではなく検証設計のみ。

## 異常系マトリクス

| # | 異常パターン | 検出経路 | 期待挙動 | HTTP / error code | evidence |
| --- | --- | --- | --- | --- | --- |
| E-1 | production で `MAIL_PROVIDER_KEY` 未設定 | `POST /auth/magic-link` 実行時 | request 単位 fail-closed | 502 `{ code: "MAIL_FAILED", message: "MAIL_PROVIDER_KEY not configured" }` | `outputs/phase-06/main.md` + 09c で runtime 再現 |
| E-2 | staging で `MAIL_PROVIDER_KEY` 未設定 | smoke 実行時 (Phase 11) | dev 同等 no-op success（送信せず `state: "sent"`）。smoke では NG 扱い | 200（smoke 上は AC fail） | `outputs/phase-11/main.md`（smoke fail として記録） |
| E-3 | `MAIL_FROM_ADDRESS` 未設定 | `POST /auth/magic-link` 実行時 | `defaultFromAddress` fallback (`auth@ubm-hyogo.example`) を使用。送信は成功するが意図と異なる from で配信 | 200 | 警告ログ（実装時別タスク） |
| E-4 | `MAIL_FROM_ADDRESS` 不正（`@` 含まない / 空） | Resend API 応答 | Resend が 422 を返す → `createResendSender` が `ok: false` で route が 502 `MAIL_FAILED` | 502 `MAIL_FAILED` | `outputs/phase-06/main.md` + 単体テスト L1 |
| E-5 | `AUTH_URL` 未設定 | Magic Link メール本文の URL | `defaultBuildMagicLinkUrl` が `http://localhost:3000` fallback → 受信者が click してもアクセス不可（production / staging では症状） | 200（送信は成功、click 後にエラー） | E-5 検出は受信側 click test、Phase 11 で staging smoke 失敗として記録 |
| E-6 | `AUTH_URL` 不一致（実 origin と異なる値） | Magic Link click 後の callback resolution | callback host mismatch → Auth.js が 4xx で reject。click 失敗を smoke で検出 | callback 側 4xx | Phase 11 evidence（click 後 status 値のみ、token は記録しない） |
| E-7 | secret rotation 中（旧値→新値の切替） | 切替時 window | `secret put` は atomic（Cloudflare Workers の secret 反映は次の cold start から）。rotation 中の inflight request は旧値で応答完了。新 request から新値 | 200（境界 1〜2 リクエストの旧値応答は許容） | rotation 設計は Phase 11 で実測委譲 |
| E-8 | staging→production の env drift | `bash scripts/cf.sh secret list --env <env>` の name 比較 | name 集合が一致しない場合は drift。Phase 5 runbook で再投入 | name 比較スクリプト | `outputs/phase-09/main.md`（QA 時の drift check ログ） |
| E-9 | 旧名 (`RESEND_API_KEY`) を誤投入 | Phase 5 Step 4 secret put 時のタイポ / 旧 runbook 残存 | `secret list` に旧名が出現 → `secret delete` で削除し正本名で再投入 | `secret delete RESEND_API_KEY` | Phase 5 runbook の rollback 経路 |
| E-10 | docs に旧名残存 | L3 doc grep | `rg` hit → CI fail | grep 結果サマリ | `outputs/phase-04/main.md`（test plan）+ Phase 9 実行ログ |

## E-1: production fail-closed 仕様（詳細）

### 仕様

- 対象: `POST /auth/magic-link`（および将来追加される mail 依存 endpoint）
- 条件: `c.env.MAIL_PROVIDER_KEY` が undefined / 空文字列
- 挙動: route handler が `resolveMailSender` から no-op sender を取得し、`sender.send()` が `ok: false, errorMessage: "MAIL_PROVIDER_KEY not configured"` を返す。route はこれを 502 `MAIL_FAILED` に変換
- 副作用: ログに env 名のみ出力（`logger.error({ event: "mail_failed", reason: "MAIL_PROVIDER_KEY not configured" })`）。値は出力しない

### 非対象（boot fail を採用しない理由）

- `/healthz` / `/public/*` / cron `scheduled` は mail 非依存。boot fail 採用時はこれらまで巻き込まれ #14 free-tier monitor と衝突
- 採用方針: request 単位 fail-closed のみ

## E-3 / E-4: `MAIL_FROM_ADDRESS` の挙動

### E-3 (未設定時)

- 既存実装は `defaultFromAddress` (`auth@ubm-hyogo.example` 等) を fallback
- 仕様化: production 運用では Variable で必ず明示する。fallback は dev / test のみで許容
- 検出: L2 契約テストで `wrangler.toml [env.production.vars]` に `MAIL_FROM_ADDRESS` が存在することを assert

### E-4 (不正値)

- Resend API は `from` の RFC5322 違反を 422 で reject
- `createResendSender` は response.ok === false で `ok: false` を返し、route が 502 `MAIL_FAILED` に変換
- 検出: L1 単体（mock で 422 response を返す fixture）

## E-5 / E-6: `AUTH_URL` 不整合

### E-5 (未設定)

- `defaultBuildMagicLinkUrl` の `http://localhost:3000` fallback は dev 専用
- production / staging で env を設定し忘れると、メール本文の URL がローカル URL になる
- 検出: L4 staging smoke の click 試験で URL を目視確認（実 token は evidence に転記しない）

### E-6 (origin 不一致)

- `AUTH_URL=https://api-staging.ubm-hyogo.workers.dev` だが実 deploy origin が異なる場合、callback 側で host mismatch
- 検出: Phase 11 smoke で click → callback 4xx を観測
- 修復: Step 3 の `[env.<env>.vars]` を deploy 実値に合わせる

## E-7: secret rotation 中の挙動

### 動作モデル

- Cloudflare Workers secret の更新は atomic だが、既起動の Worker isolate には反映に最大 1〜2 リクエスト分の lag がある
- 旧値で送信中の inflight request は失敗せず完了
- 新 request は新値で動作

### 運用ルール

- rotation は staging で先行確認後 production
- rotation 直前直後 5 分以内の smoke は inflight 影響を受け得るため、smoke 結果判定は次の cold start 後で実施
- 旧 secret は新値投入 + smoke pass 後に `secret delete` で削除

## E-8: env drift 検出

### 検出方法

```bash
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | jq -r '.[].name' | sort > /tmp/staging-names.txt
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production | jq -r '.[].name' | sort > /tmp/production-names.txt
diff /tmp/staging-names.txt /tmp/production-names.txt
```

- name 集合が一致するべき項目: `MAIL_PROVIDER_KEY` / `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- 環境別に異なる Variable (`MAIL_FROM_ADDRESS` / `AUTH_URL`) は `wrangler.toml [env.*.vars]` で確認

### 一時ファイルの扱い

- `/tmp/*-names.txt` は name のみで実値を含まないため evidence 添付可
- ただし運用後は `rm -f /tmp/staging-names.txt /tmp/production-names.txt` で削除

## E-9: 旧名誤投入の rollback

```bash
# 誤投入確認
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep -E '^(RESEND_API_KEY|RESEND_FROM_EMAIL|SITE_URL)$'

# 削除
bash scripts/cf.sh secret delete RESEND_API_KEY --config apps/api/wrangler.toml --env staging

# 正本名で再投入（Phase 5 Step 4）
op read "op://UBM-Hyogo/auth-mail-staging/MAIL_PROVIDER_KEY" \
  | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY \
      --config apps/api/wrangler.toml --env staging
```

## E-10: docs 旧名残存検出

- Phase 4 L3 で定義した rg を CI / lefthook で実行
- hit 件数 0 を expected。1 件でも hit したら CI fail
- 例外マーカー (`<!-- doc-grep-allow: legacy-name -->`) は本タスクの Phase docs（drift 説明箇所）にのみ許可

## 異常系における #16 (secret values never documented) 遵守

- E-1〜E-10 すべてで evidence は env 名・state 値・status code・name 集合のみ記録
- Resend response body / token / 実メールアドレス / 値ハッシュを evidence に転記しない
- ログ出力時も `logger.error({ event, reason })` 構造で値そのものを含めない（実装側既存方針）

## 実行タスク

1. 参照資料と該当ソースを確認する。完了条件: 異常系マトリクス E-1〜E-10 が確定する。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: 各異常系の evidence path が AC-3 / AC-4 / AC-5 のいずれかに紐付く。
3. user approval または上流 gate が必要な操作を分離する。完了条件: rotation / rollback の自走禁止が明記される。
4. fail-closed 仕様（E-1）の boot fail 不採用根拠を記録する。完了条件: free-tier monitor との衝突回避が記述される。

## 参照資料

- docs/00-getting-started-manual/specs/10-notification-auth.md
- docs/00-getting-started-manual/specs/08-free-database.md
- .claude/skills/aiworkflow-requirements/references/environment-variables.md
- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
- apps/api/src/index.ts（`resolveMailSender` no-op 経路）
- apps/api/src/routes/auth/index.ts（502 `MAIL_FAILED` 変換）
- apps/api/src/services/mail/magic-link-mailer.ts（`createResendSender` の Resend 422 ハンドリング）

## 実行手順

- 対象 directory: `docs/30-workflows/05b-A-auth-mail-env-contract-alignment/`
- 本仕様書作成ではアプリケーションコード、deploy、commit、push、PR 作成を行わない。
- 実装・実測時は Phase 5 / Phase 11 の runbook と evidence path に従う。
- 異常系再現は staging fixture に閉じる。production への意図的な未設定 deploy は禁止。

## 統合テスト連携

- 上流: 05b Magic Link provider 本体, 10-notification-auth.md, environment-variables.md, deployment-secrets-management.md
- 下流: 05b-B Magic Link callback follow-up（E-6 callback mismatch）, 09a staging auth smoke（E-2 / E-5）, 09c production deploy readiness（E-1 / E-8）

## 多角的チェック観点

- #16 secret values never documented: E-1〜E-10 の evidence に値・本文・token を残さない
- #15 Auth session boundary: 異常系検証は Magic Link send 経路に閉じ、`AUTH_SECRET` / JWT 経路を侵食しない
- #14 Cloudflare free-tier: 異常系検証で Resend 課金を発生させない（mock 経由 / smoke 1 通のみ）
- 未実装 / 未実測を PASS と扱わない: 異常系設計のみで AC-3 (production fail-closed) を満たしたとみなさない
- プロトタイプと仕様書の採用 / 不採用を混同しない: GAS prototype の異常系挙動を本タスクの正本にしない

## サブタスク管理

- [ ] refs を確認する
- [ ] 異常系マトリクス E-1〜E-10 を確定する
- [ ] AC と evidence path を対応付ける
- [ ] blocker / approval gate（rotation / rollback / production 異常系再現禁止）を明記する
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md（異常系マトリクス / fail-closed 詳細仕様 / rotation 動作モデル / drift 検出スクリプト / 旧名 rollback 手順）

## 完了条件

- env 名の正本が1つに統一される（E-9 の rollback 経路で旧名誤投入を是正可能）
- Cloudflare/1Password/runbook の配置先が一致する（E-8 drift 検出）
- production で未設定時 fail-closed の仕様が明記される（E-1 詳細仕様）
- staging smoke で Magic Link メール送信設定を確認できる（E-2 / E-5 検出経路）
- secret 実値が repo/evidence に残らない（#16 遵守節）

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] secret 実値を記録していない（env 名と op:// 参照のみ）

## 次 Phase への引き渡し

Phase 7（AC マトリクス）へ次を渡す:

- 異常系マトリクス E-1〜E-10 と evidence path
- E-1 production fail-closed の詳細仕様（502 `MAIL_FAILED`）
- E-7 rotation の動作モデル（atomic + 1-2 リクエスト lag）
- E-8 drift 検出スクリプト
- E-9 旧名 rollback 手順
- 異常系における #16 遵守ルール
