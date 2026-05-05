# UT-26 Phase 1 成果物 — 要件定義 main.md

| 項目 | 値 |
| --- | --- |
| タスク | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase | 1 / 13（要件定義） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL（CLI / curl / wrangler 出力ログ） |

---

## 1. 真の論点 (true issue)

UT-26 の本質は「疎通スクリプトを書く」ことではなく、以下 2 点を docs と実機証跡として確定することにある。

1. **実機認証保証**: Cloudflare Workers Edge Runtime の Web Crypto API による RSA-SHA256 署名と、Google OAuth 2.0 token endpoint への HTTPS 通信、`spreadsheets.values.get` の 3 段階 e2e フローが、UT-03 の fetch mock では検証できない領域で実 API 上で成立することを保証する。
2. **403 切り分け runbook 化**: 403 PERMISSION_DENIED が観測された際に、(a) Service Account メールが対象 Sheets に共有されていない、(b) `GOOGLE_SHEETS_SA_JSON` の改行コード破損、(c) Google Sheets API が GCP プロジェクトで有効化されていない、(d) `formId` と `spreadsheetId` の取り違え、の 4 候補を段階的に切り分けられる runbook を残す。

副次的論点として、production 環境への誤書き込みおよび smoke route の意図せぬ露出を防ぐため、`SMOKE_ADMIN_TOKEN` Bearer 認証 + `wrangler.toml` の env 分岐 + runtime env-guard の三段ガードを認可境界として確定する。

---

## 2. 依存境界（上流 3 / 下流 2）

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-03（Sheets API 認証方式設定） | `sheets-fetcher.ts` 内 `getAccessToken` および `packages/integrations/google/src/forms/auth.ts` の認証 client（JWT 生成・token cache 含む）が存在し export 済み | UT-26 では認証 client を再利用するのみ。modify は禁止 |
| 上流 | UT-25（Cloudflare Secrets 配置） | staging 環境の Cloudflare Secret に `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN` が配置済み | UT-26 では値を参照のみ。新規 Secret は導入しない |
| 上流 | 01c-parallel-google-workspace-bootstrap | Service Account メールが対象 Google Sheets の閲覧者として共有設定済み、Sheets API が GCP プロジェクトで有効化済み | 共有 SA メールアドレスを Phase 2 設計の認可境界記述に明記 |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 「実 API 疎通成立」を本タスクが保証 | 疎通成功 evidence + `outputs/phase-11/troubleshooting-runbook.md` を引き渡す |
| 下流 | UT-10（エラーハンドリング標準化） | 401/403/429 の実機観測ログと分類が UT-26 で得られる | 実機観測ベースの error mapping を標準化対象として渡す |

---

## 3. 4 条件評価（全 PASS + 根拠）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 以降の実 API 障害切り分けコストを事前に消す。UT-03 fetch mock では到達不能な Web Crypto + OAuth + Sheets API の 3 段 HTTPS 通信を一度通せば、後続タスクは認証起因の障害を疑わずに済む |
| 実現性 | PASS | 上流 UT-03 / UT-25 / 01c が完了済（前提）。Hono / Web Crypto / wrangler / curl の既存技術範囲で完結し、新規ライブラリ導入なし。コード増分は smoke route + middleware + helper で約 50〜80 LOC |
| 整合性 | PASS | 不変条件 #1（schema 固定回避）/ #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api に閉じる）すべてに違反しない。書き込み API（`values.update` 等）は呼ばない |
| 運用性 | PASS | troubleshooting-runbook により 403 切り分けが手順化され、後続オペレーターも再現可能。in-memory token cache は同一 isolate で 1 回のみの OAuth fetch を実機確認できる粒度 |

---

## 4. 受入条件 AC-1〜AC-11（index.md と一致）

- **AC-1**: staging 環境の Cloudflare Workers から `spreadsheets.values.get` が HTTP 200 で成功する。
- **AC-2**: JWT 生成 → アクセストークン取得 → API 呼び出しの end-to-end フローが Workers Edge Runtime 上で動作する。
- **AC-3**: 対象スプレッドシート（formId: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` に紐づく Sheets）から値が取得できる（シート名・行数・サンプル行を証跡に記録）。
- **AC-4**: アクセストークンキャッシュが動作し、2 回目以降の API 呼び出しで OAuth token endpoint への fetch が省略される。
- **AC-5**: 401（無効トークン）/ 403（権限不足 = SA 共有未設定）/ 429（レート制限）の各ケースで期待されるエラー分類とログが出力される。
- **AC-6**: ローカル開発環境（`.dev.vars` + `wrangler dev`）で同等の疎通確認が成功する。
- **AC-7**: 疎通確認結果（成功日時・環境・取得データのサマリー・トラブルシュート手順）が verification-report として記録される。
- **AC-8**: Service Account JSON は Cloudflare Secrets / 1Password 経由のみで注入され、リポジトリ・ログ・PR 説明文に平文値が一切残らない。
- **AC-9**: 403 エラー発生時の原因切り分け手順（SA 共有 / JSON 改行コード / Sheets API 有効化 / formId vs spreadsheetId 取り違え）が runbook 化されている。
- **AC-10**: UT-09 が本番 Sheets API に安全にアクセスできる前提が満たされたとマークされる。
- **AC-11**: 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である。

> 上記 11 件は `index.md` の 「受入条件 (AC)」セクションと文言レベルで完全一致させること。差分があれば本ファイルが正本ではなく `index.md` を正本とし、本ファイルを更新する。

---

## 5. 既存命名規則チェックリスト（5 観点）

Phase 2 設計で適用する既存規約を以下 5 観点で固定する。

| # | 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- | --- |
| 1 | Hono ルート命名 | `apps/api/src/routes/admin/` 配下 | kebab-case ディレクトリ + `index.ts` で export。`/admin/smoke/*` は dev/staging 限定で mount し、production では runtime 404 を返す |
| 2 | Smoke スクリプト命名 | `apps/api/src/scripts/`（存在時） | `smoke-<source>.ts` 形式。本タスクは route 採用が base case のため、script 単独実装は採らない（Phase 3 で確定） |
| 3 | 認証 client 再利用 | `apps/api/src/jobs/sheets-fetcher.ts` 内 `getAccessToken` および `packages/integrations/google/src/forms/auth.ts` | export 済み認証関数をそのまま import し、UT-26 内で再実装しない。env 名は既存 `GOOGLE_SHEETS_SA_JSON` を再利用する（後述 6 章 Decision） |
| 4 | 環境変数 / wrangler 分岐 | `apps/api/wrangler.toml` の `[env.dev]` / `[env.staging]` / `[env.production]` | `[env.production]` に smoke route 用の binding を追加しない。route 登録自体を `if (env.ENVIRONMENT !== "production")` でガード |
| 5 | Logger / 構造化ログ | `apps/api/src/lib/logger.ts`（存在時） | `event=sheets_smoke_test`、`status`、`latency_ms` を含む構造化ログを出力。SA JSON / access_token / Bearer token は出力しない（マスキング規約） |

---

## 6. Schema / 共有コード Ownership 宣言

並列 wave の責務越境を防ぐため、UT-26 が編集する可能性のある共有 schema / 共通コードについて ownership を以下のとおり固定する。

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | D1 schema / Zod schema / `packages/shared` exports は編集しない。`packages/integrations/google/` 配下および `apps/api/src/jobs/sheets-fetcher.ts` は UT-03 が owner のため、UT-26 では reuse のみ |
| 本タスクが ownership を持つか | **no**。UT-26 の ownership は `apps/api/src/routes/admin/smoke-sheets.ts`、`apps/api/src/lib/smoke/*`、smoke 用テスト、Phase 11 runbook、Phase 12 implementation-guide に限定する |
| 他 wave への影響 | UT-03 = 認証 client の producer / UT-25 = secret 配置 producer / UT-09 = Sheets→D1 同期 consumer / UT-10 = error mapping consumer。UT-26 は consumer + 疎通保証 producer の役割 |
| 競合リスク | `sheets-fetcher.ts` または `forms/auth.ts` への機能追加が必要になった場合は UT-03 owner へ差し戻し、UT-26 では wrapper / adapter 追加に留める |
| migration 番号 / exports 改名の予約 | なし。D1 migration / shared exports の追加が発生した場合は Phase 10 を NO-GO とし、Phase 12 `unassigned-task-detection.md` に owner wave を明記して起票する |
| env 名 Decision | 既存実装の `GOOGLE_SHEETS_SA_JSON` をそのまま使用する。仕様書側で表記揺れがあった `GOOGLE_SHEETS_SA_JSON` は UT-26 では採用せず、Phase 2 以降で `GOOGLE_SHEETS_SA_JSON` に統一する（Phase 5 implementation-runbook で再確認） |

---

## 7. 不変条件 #1 / #4 / #5 への準拠

| # | 不変条件 | UT-26 での扱い | 準拠状態 |
| --- | --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | smoke route は値の存在のみ確認（行数・任意 1 行のサンプル）し、列順 / カラム名にハードコード依存しない。range は `A1:Z10` のような汎用範囲を指定 | 準拠 |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | 本タスクは取得（`spreadsheets.values.get`）のみで書き込みを行わない。admin-managed data との混在が発生しないため対象外 | 準拠（違反対象なし） |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | smoke route は `apps/api/src/routes/admin/smoke-sheets.ts` 内に閉じ、`apps/web` から呼ばない。そもそも本タスクは D1 アクセス自体を行わない | 準拠 |

---

## 8. production 誤書込禁止の絶対制約

UT-26 では以下を**絶対制約**として Phase 2 以降に伝搬する。違反は Phase 10 NO-GO の即時条件とする。

1. **書き込み API 不使用**: `spreadsheets.values.update` / `append` / `batchUpdate` 等の write 系 API は smoke route から一切呼ばない。fetcher は GET 専用とする。
2. **production 環境への smoke route 露出禁止**:
   - **build-time ガード**: `apps/api/src/index.ts` で `if (env.ENVIRONMENT !== "production") app.route("/admin/smoke", smokeRouter)` の形式により、production 環境では route 自体が mount されない。
   - **runtime ガード**: `env-guard.ts`（または route handler 冒頭）で `c.env.ENVIRONMENT === "production"` を検出した場合に `c.notFound()` を返す（多重防御）。
   - **token ガード**: `SMOKE_ADMIN_TOKEN` Bearer 認証必須。production Cloudflare Secret には `SMOKE_ADMIN_TOKEN` を**配置しない**ことを SoR とし、Phase 11 で `wrangler secret list --env production` 相当で不在を検証する。
3. **production deploy コマンド禁止**: 本タスクの runbook に `--env production` を含む `bash scripts/cf.sh deploy` コマンドを一切登場させない（Phase 5 で再確認）。
4. **対象スプレッドシート保護**: smoke 対象は staging 用の sheet（または read-only 共有された production sheet）に限定。production sheet への書き込みは設計上不可能な構成を維持する。

---

## next: Phase 2 へ引き渡す事項

- **真の論点**: 実機認証保証 + 403 切り分け runbook 化（疎通スクリプト追加ではない）
- **依存境界**: 上流 3（UT-03 / UT-25 / 01c）+ 下流 2（UT-09 / UT-10）の前提と引き渡し contract
- **4 条件評価**: 全 PASS の根拠（価値性 / 実現性 / 整合性 / 運用性）
- **既存命名規則チェックリスト 5 観点**: Hono ルート / smoke スクリプト / 認証 client 再利用 / wrangler 分岐 / Logger
- **Schema / 共有コード Ownership 宣言**: UT-26 は `packages/integrations` / D1 schema / shared exports の owner ではない（reuse のみ）
- **env 名 Decision**: `GOOGLE_SHEETS_SA_JSON` を採用（既存実装に整合）
- **production 誤書込禁止の絶対制約**: build-time / runtime / token / runbook の四面ガード
