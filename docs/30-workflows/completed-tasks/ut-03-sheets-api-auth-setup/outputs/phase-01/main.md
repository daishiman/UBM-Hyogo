# Phase 1 成果物 — 要件定義 (UT-03 Sheets API 認証方式設定)

## 1. スコープ確定

UT-03 は Cloudflare Workers の Edge Runtime 上で動作する Google Sheets API v4 の認証基盤を、`packages/integrations/google` 配下に閉じて構築する implementation タスクである。Service Account JSON key を Cloudflare Secrets / 1Password 経由で授受し、Web Crypto API による JWT 署名 → access_token 取得 → TTL 1h キャッシュを行う。下流（UT-09 / UT-21）は本モジュールの公開 API のみを利用する。

## 2. artifacts.json metadata（Phase 1 確定値）

| フィールド | 値 |
| --- | --- |
| `metadata.taskType` | `implementation` |
| `metadata.visualEvidence` | `NON_VISUAL` |
| `metadata.scope` | `packages/integrations/google/src/sheets/auth.ts` 新設、`apps/api` env binding、Cloudflare Secrets / `.dev.vars` / `.gitignore` runbook |
| `metadata.workflow_state` | `completed` |

> NON_VISUAL 確定理由: 認証 util は CLI / API 疎通のレスポンス（200 / 行データ取得）が evidence になり、UI screenshot が原理的に存在しない。Phase 11 の evidence は `manual-smoke-log.md`（疎通確認スクリプトの実行ログテンプレート）で代替する（task-specification-creator §「タスクタイプ判定フロー」）。

## 3. 真の論点と採用方針

| 論点 | 採用方針 |
| --- | --- |
| 認証方式 | Service Account JSON key（Cloudflare Workers 無人実行に最適。OAuth 2.0 は Phase 3 で却下） |
| JWT 署名実装 | Web Crypto API（`SubtleCrypto.importKey` + `sign('RS256')`）、Node API 依存ライブラリは使わない |
| トークンキャッシュ | TTL 1h（access_token 有効期限 3600s に対し余裕を持たせ 3500s で expire 扱い）、in-memory（Workers isolate 内） |
| シークレット注入 | Cloudflare Secrets（`wrangler secret put`） + `.dev.vars`（local、`.gitignore` 必須） + 1Password Vault `UBM-Hyogo / dev|staging|production`（正本） |
| Sheets 共有 | Service Account メールアドレス（`xxx@project.iam.gserviceaccount.com`）を対象スプレッドシートに「閲覧者」として共有（runbook 化） |
| Schema 拡張余地 | OAuth 2.0 への移行は将来不要となる見込み。必要時は Phase 12 unassigned に起票 |

## 4. Schema / 共有コード Ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | `packages/integrations/google/src/sheets/auth.ts`（新設）、`packages/integrations/google/index.ts`（export 追加）、`apps/api/src/env.d.ts` 相当の env 型、`.gitignore`（`.dev.vars` ガード確認） |
| 本タスクが ownership を持つか | yes |
| 他 wave への影響 | UT-09（Cron 同期）/ UT-21（admin endpoint + audit）が consumer。公開 API・引数 shape を変えると下流が壊れるため Phase 2 で固定 |
| 競合リスク | 並列 wave で `packages/integrations/google` を編集する他タスクは現時点で無し。命名予約: `getSheetsAccessToken()` / `SheetsAuthEnv` / `packages/integrations/google/src/sheets/auth.ts` |
| migration 番号 / exports 改名の予約 | 不要（D1 migration なし）。export 名は本タスクで占有 |

## 5. 不変条件 touched

| # | 条文 | 本タスクでの触れ方 |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない | 本モジュールは Sheets schema を扱わない（認証のみ）。整合 |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | 本モジュールはデータマッピングを行わない。整合 |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 本モジュールは D1 を触らない。整合 |
| CLAUDE.md シークレット運用 | `.env` 平文禁止 / 1Password `op://` 参照のみ / `wrangler login` 禁止 | runbook で明示・遵守 |

## 6. 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 後続 UT-09 / UT-21 が認証実装を再利用でき、運用コストゼロで Sheets 接続が確立 |
| 実現性 | PASS | 01c 完了済（SA 発行済）、Web Crypto API は Workers ネイティブ対応、無料枠内 |
| 整合性 | PASS | 不変条件 #1/#4/#5 と整合、CLAUDE.md シークレット運用ルール遵守 |
| 運用性 | PASS | TTL 1h キャッシュ + 1Password 集中管理 + runbook により再現性高い運用が可能 |

## 7. 苦戦箇所 → AC 対応表

| 苦戦箇所 | AC | 受け皿 Phase |
| --- | --- | --- |
| 1. SA JSON vs OAuth 2.0 選定で迷う | AC-1（比較評価表） | Phase 2 設計 / Phase 3 alternatives |
| 2. Workers での JWT refresh が難しい（Node API 非互換） | AC-2（Web Crypto JWT フロー） / AC-7（Node API 非依存確認） | Phase 2 設計 |
| 3. シークレットの環境別管理と `.dev.vars` の `.gitignore` | AC-3（管理マトリクス） / AC-10（3 環境配置） | Phase 2 設計 / Phase 5 runbook |
| 4. SA メールへの Sheets 共有忘れ → 403 PERMISSION_DENIED | AC-4（共有 runbook） / AC-6（疎通確認スクリプト） | Phase 5 / Phase 11 |

## 8. AC 一覧（Phase 7 トレースマトリクス起点）

- AC-1: Service Account JSON key vs OAuth 2.0 の比較評価表が `outputs/phase-02/main.md` に存在する。
- AC-2: Web Crypto API による JWT 署名 → access_token 取得 → TTL 1h キャッシュのフロー設計が含まれる。
- AC-3: `GOOGLE_SERVICE_ACCOUNT_JSON` の Cloudflare Secrets / `.dev.vars` / 1Password / `.gitignore` 配置マトリクスが文書化される。
- AC-4: Service Account メールへの Sheets 共有手順が runbook 化される。
- AC-5: `packages/integrations/google/src/sheets/auth.ts` の公開 API・内部関数・依存が設計に含まれる。
- AC-6: Sheets API v4 `spreadsheets.values.get` 疎通確認スクリプトが Phase 5 / 11 で placeholder 化される。
- AC-7: 認証モジュールが Node API に依存しない（`google-auth-library` 等の不採用理由を Phase 3 alternatives に記録）。
- AC-8: `JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)` 失敗時の fail-fast / log redact 方針が設計に含まれる。
- AC-9: 不変条件 #5 違反が無い（D1 を直接触らない）。
- AC-10: dev / staging / production 3 環境すべてに対する secret 配置経路が記述される。

## 9. 依存境界 サマリ

- 上流: 01c-google-workspace-bootstrap（SA 発行）/ 02-monorepo-runtime-foundation（packages 境界）/ UT-01（必要スコープ）
- 下流: UT-09（Cron 同期）/ UT-21（admin endpoint + audit）/ 03-data-source-and-storage-contract
- 連携: 04-cicd-secrets-and-environment-sync（CI/CD secret 配置）

## 10. AC 引き渡し

AC-1〜AC-10 を Phase 7 のトレースマトリクスに引き渡す。本フェーズで blocker は検出されず、Phase 2（設計）へ進行可能。Phase 3 では Service Account 採択を 3 つ以上の代替案と比較し最終確定する。
