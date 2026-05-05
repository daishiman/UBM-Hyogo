# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel（UT-03 / UT-25 完了後に独立着手可能） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | implementation / smoke-test（`apps/api` に dev 限定 smoke route を追加 + 設計文書追記） |
| taskType | implementation |
| visualEvidence | NON_VISUAL（CLI / curl / wrangler 出力ログ。screenshots 不要） |

## 目的

UT-03 で実装した `sheets-fetcher.ts` モジュールと UT-25 で配置した `GOOGLE_SHEETS_SA_JSON` シークレットを使い、Cloudflare Workers Edge Runtime 上で Google Sheets API v4 への end-to-end 疎通を実機検証する要件を確定する。fetch mock では検出できない JWT 署名・OAuth 2.0 token 取得・`spreadsheets.values.get` 呼び出しの実機挙動と、アクセストークンキャッシュ・401/403/429 エラーハンドリングの仕様を docs として固定し、Phase 2 設計が一意に判断できる入力を作成する。

## 真の論点 (true issue)

- 「疎通確認スクリプトを書く」ことではなく、「Workers Edge Runtime の Web Crypto API による RSA-SHA256 署名と OAuth 2.0 token endpoint 通信が実 API 環境で成立し、403 が出た際に SA 共有 / JSON 改行 / Sheets API 有効化 / spreadsheetId 取り違えのいずれかを切り分けられる runbook を残す」ことが本質。
- 副次的論点として、production への誤書き込みを防ぐため smoke route を dev 限定に閉じる認可境界（`SMOKE_ADMIN_TOKEN` または `wrangler.toml` の env 分岐）を確定すること。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-03（Sheets API 認証） | `sheets-fetcher.ts` の認証 client / JWT 生成 / token cache 実装 | 認証 client を再利用するのみで再実装しない |
| 上流 | UT-25（Cloudflare Secrets 配置） | `GOOGLE_SHEETS_SA_JSON` が staging に配置済み | 値の参照のみ。新規 Secret は導入しない |
| 上流 | 01c-parallel-google-workspace-bootstrap | Service Account メールに対象 Sheets の閲覧権限が共有設定済み | 共有 SA メールを Phase 2 設計に明記 |
| 下流 | UT-09（Sheets→D1 同期ジョブ） | 本タスクで保証する「実 API 疎通成立」を前提として実装着手 | 疎通成功証跡 + troubleshooting runbook |
| 下流 | UT-10（エラーハンドリング標準化） | 401/403/429 の観測ログと分類 | 実機観測の error mapping を提供 |

## 価値とコスト

- 価値: UT-03 のモック検証では不可能だった Workers Edge Runtime での実 API 疎通を保証し、UT-09 着手時の「動かない原因が認証なのか同期ロジックなのか」の切り分けコストを排除する。
- コスト: smoke route 1 個 (~50 LOC) + 検証ログ記録のみ。Workers / Sheets API いずれも free tier の使用量に対して誤差レベル。
- 機会コスト: 本タスクをスキップした場合、UT-09 実装中に認証起因の障害が発生し、原因切り分けに数時間〜半日のオーバーヘッドが発生し得る。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 以降の実 API 障害切り分けコストを事前に消す。UT-03 モックでは不可能な検証を一度だけ通せば再利用が効く |
| 実現性 | PASS | UT-03 / UT-25 / 01c が完了済み。Workers / wrangler / curl の既存技術範囲で完結 |
| 整合性 | PASS | 不変条件 #1（schema 固定回避）/ #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api に閉じる）に違反しない。書き込み無し |
| 運用性 | PASS | troubleshooting runbook により、後続でも 403 切り分けが再現可能 |

## 既存コード命名規則の確認

Phase 2 設計の前に、`apps/api` の以下既存規約を確認する。

| 観点 | 確認対象 | 期待される規則 |
| --- | --- | --- |
| Hono ルート命名 | `apps/api/src/routes/admin/` | kebab-case ディレクトリ + `index.ts` で export。`/admin/smoke/*` は dev 環境のみ有効 |
| Smoke スクリプト | `apps/api/src/scripts/`（あれば） | `smoke-<source>.ts` 形式（本タスクは `smoke-test-sheets.ts`） |
| 認証 client 再利用 | `apps/api/src/jobs/sheets-fetcher.ts` | export 済み関数（`getAccessToken` 等）をそのまま import |
| 環境変数 | `apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` | `[env.production]` には smoke route を露出させない（または `enabled=false` フラグ） |
| Logger | `apps/api/src/lib/logger.ts`（あれば） | structured log で event=`sheets_smoke_test`, status, latency_ms を出力 |

## aiworkflow 正本照合

| 正本 | 照合結果 | UT-26 での扱い |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/arch-integration-packages.md` | 外部連携は `packages/integrations/{service}/` の単一責務パッケージが原則。現行コードは `packages/integrations/google/src/forms/auth.ts` と `packages/integrations/src/index.ts` を export 起点にしている。 | `apps/api/src/jobs/sheets-fetcher.ts` という flat path を実体前提にしない。Phase 2 で現行 export を確認し、必要なら smoke adapter 側だけで吸収する。 |
| `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | dev 限定 smoke route は admin 配下・認可必須・production 無効が必要。 | `/admin/smoke/sheets` は dev/staging 限定、`SMOKE_ADMIN_TOKEN` 必須、production では runtime 404 を返す。 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Secret は Cloudflare / 1Password 経由、平文ログ禁止。 | SA JSON / token / client_email / private_key は成果物・ログ・PR に残さない。 |
| `.claude/skills/aiworkflow-requirements/references/environment-variables.md` と現行 `apps/api/src/jobs/sync-sheets-to-d1.ts` | 既存 sync job は `GOOGLE_SHEETS_SA_JSON` を参照。UT-26 仕様案は `GOOGLE_SHEETS_SA_JSON` を参照。 | 実装前ゲートで env 名を `GOOGLE_SHEETS_SA_JSON` reuse に寄せるか、UT-25 の `GOOGLE_SHEETS_SA_JSON` を正式 alias として正本更新するかを決める。未決のまま実装しない。 |
| `.claude/skills/aiworkflow-requirements/references/quality-e2e-testing.md` / `testing-playwright-e2e.md` | UI E2E / Playwright ではなく NON_VISUAL smoke。 | screenshot / browser E2E は N/A。CLI / curl / wrangler tail の再現可能ログを Phase 11 evidence とする。 |

## Schema / 共有コード Ownership 宣言

並列 wave の責務越境を防ぐため、本タスクが編集する可能性のある共有 schema / 共通コードの ownership を Phase 1 で固定する。

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | D1 schema / Zod schema / `packages/shared` exports は編集しない。`apps/api/src/jobs/sheets-fetcher.ts` は UT-03 が owner のため本タスクでは reuse のみ。 |
| 本タスクが ownership を持つか | no。UT-26 の ownership は `apps/api` の dev/staging 限定 smoke route、smoke client、ログ整形、テスト、runbook に限定する。 |
| 他 wave への影響 | UT-03 は認証 client producer、UT-25 は secret 配置 producer、UT-09 は Sheets→D1 同期 consumer、UT-10 は error mapping consumer。 |
| 競合リスク | `sheets-fetcher.ts` へ機能追加が必要になった場合は UT-03 owner へ差し戻し、UT-26 では wrapper / adapter 追加に留める。D1 migration は本タスクでは予約しない。 |
| migration 番号 / exports 改名の予約 | なし。DB migration / shared exports の追加が発生した場合は Phase 10 で NO-GO とし、Phase 12 `unassigned-task-detection.md` に owner wave を明記して起票する。 |

## 実行タスク

1. unassigned-task `UT-26-sheets-api-e2e-smoke-test.md` の苦戦箇所 5 件（fetch mock 差分 / SA 権限漏れ / formId vs spreadsheetId / wrangler dev 制約 / token TTL）を本 Phase の AC として写経・拡張する（完了条件: 各苦戦箇所が AC または多角的チェックに対応）。
2. 真の論点と依存境界を確定する（完了条件: 上流 3 件・下流 2 件すべてに前提・出力を記述）。
3. 4条件評価を全 PASS で確定する（完了条件: 各観点に PASS と根拠が記載）。
4. 不変条件 #1/#4/#5 の touched-list を確定する（完了条件: index.md と一致）。
5. 既存コード命名規則の確認項目を Phase 2 への引き渡しとして明記する（完了条件: 5 観点が表で固定）。
6. AC-1〜AC-11 を index.md と同期する（完了条件: 文言差分ゼロ）。
7. production への誤書き込み禁止を Phase 2 設計の絶対制約として明記する（完了条件: 認可境界が成果物に列挙）。
8. Schema / 共有コード Ownership 宣言を固定する（完了条件: owner / consumer wave、競合リスク、migration / exports 予約有無が表で明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md | 原典（苦戦箇所写経元） |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界の確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Service Account JSON 取り扱い |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | dev 限定 smoke route 命名規約 |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Workers Web Crypto API（RSA-SHA256） |

## 実行手順

### ステップ 1: 上流前提の確認

- UT-03 / UT-25 / 01c-parallel-google-workspace-bootstrap の完了 index.md を確認する。
- いずれか未完了の場合、本 Phase の status は spec_created のままで Phase 2 へは進まない。

### ステップ 2: 真の論点と依存境界の確定

- 「疎通スクリプト追加」ではなく「実機認証フロー保証 + 403 切り分け runbook 化」と再定義されているか自己レビュー。
- UT-09 / UT-10 への引き渡し contract を明記。

### ステップ 3: 4条件と AC のロック

- 4条件すべて PASS で固定。
- AC-1〜AC-11 を `outputs/phase-01/main.md` に列挙し index.md と完全一致。

### ステップ 4: 既存命名規則チェックリストの記述

- `apps/api/src/routes/`、`apps/api/src/scripts/`、`apps/api/src/jobs/sheets-fetcher.ts` 周辺の既存命名を Phase 2 設計者向けに整理。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | true issue / 依存境界 / 4条件 / 命名規則チェックリストを設計入力として渡す |
| Phase 3 | 4条件評価を代替案レビューの比較軸として再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象として渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 10 | 4条件最終判定の起点として再評価 |

## 多角的チェック観点（AIが判断）

- 不変条件 #1: Sheets schema をコードに固定していないか（Phase 2 で値の存在のみ検証する設計に閉じる）。
- 不変条件 #4: admin-managed data の分離。本タスクは読み取りのみで違反しない。
- 不変条件 #5: D1 直接アクセスは行わない。smoke route は `apps/api` に閉じる。
- 認可境界: smoke route が production に露出していないか（`wrangler.toml` の env 分岐 + `SMOKE_ADMIN_TOKEN`）。
- Secret hygiene: SA JSON が Cloudflare Secrets / 1Password 経由で、ログ・PR・コミットメッセージに平文を残さない。
- 無料枠: Workers / Sheets API の使用量が月数十リクエストで free tier 内。
- 書き込み禁止: production 環境でいかなる write も発生しないこと。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「実機認証 + 切り分け runbook」に再定義 | 1 | spec_created | main.md 冒頭に記載 |
| 2 | 依存境界（上流 3 / 下流 2）の固定 | 1 | spec_created | UT-09 / UT-10 への引き渡し contract 含む |
| 3 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | 不変条件 #1/#4/#5 の touched 確認 | 1 | spec_created | index.md と同期 |
| 5 | AC-1〜AC-11 の確定 | 1 | spec_created | index.md と完全一致 |
| 6 | 既存命名規則チェックリスト | 1 | spec_created | Phase 2 入力 |
| 7 | production 誤書き込み禁止の絶対制約明記 | 1 | spec_created | Phase 2 認可境界に伝搬 |
| 8 | Schema / 共有コード Ownership 宣言 | 1 | spec_created | UT-26 は shared schema owner ではない |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件・true issue・依存境界） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 真の論点が「実機認証保証 + 403 切り分け runbook 化」に再定義されている
- [ ] 4条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 3 / 下流 2 すべてが前提と出力付きで記述されている
- [ ] AC-1〜AC-11 が index.md と完全一致している
- [ ] 既存命名規則チェックリストが 5 観点で固定されている
- [ ] Schema / 共有コード Ownership 宣言で、UT-26 が `apps/api/src/jobs/sheets-fetcher.ts` / D1 schema / shared exports の owner ではないことが明記されている
- [ ] 不変条件 #1/#4/#5 のいずれにも違反しない範囲で要件が定義されている
- [ ] production への誤書き込み禁止が認可境界として明示されている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物パスが `outputs/phase-01/main.md` に固定済み
- 苦戦箇所 5 件すべてが AC または多角的チェックに対応
- 異常系（403 切り分け / token TTL / wrangler 制約 / formId 取り違え）の論点が要件レベルで提示
- Schema / 共有コード Ownership 宣言により、shared schema / `_shared/` / `packages/shared` / `packages/integrations` の責務越境がない
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 実機認証保証 + 403 切り分け runbook 化
  - 4条件評価 (全 PASS) の根拠
  - 既存命名規則チェックリスト 5 観点
  - Schema / 共有コード Ownership 宣言（UT-26 は shared schema owner ではない）
  - production 誤書き込み禁止の絶対制約
  - UT-09 / UT-10 への引き渡し contract
- ブロック条件:
  - UT-03 / UT-25 / 01c のいずれかが `completed` でない
  - 4条件のいずれかが MINOR/MAJOR
  - AC-1〜AC-11 が index.md と乖離
