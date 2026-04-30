# ut-26-sheets-api-e2e-smoke-test - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-26 |
| タスク名 | Sheets API エンドツーエンド疎通確認 |
| ディレクトリ | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test |
| Wave | 1 |
| 実行種別 | parallel（UT-03 / UT-25 完了後に独立着手可能） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation / smoke-test（疎通確認スクリプト + 設計文書追記。アプリ機能は実装しない） |
| 既存タスク組み込み | なし（UT-03 はモジュール実装と fetch mock テスト、本タスクは実 API への疎通確認） |
| 組み込み先 | - |
| GitHub Issue | #41 (CLOSED) |
| visualEvidence | NON_VISUAL（CLI / curl / wrangler 出力ログによる証跡） |
| taskType | implementation |

## Decision Log

| 日付 | Decision | 根拠 |
| --- | --- | --- |
| 2026-04-29 | Issue #41 は CLOSED のまま reopen せず、UT-26 仕様書と後続 PR から "Re-link to closed issue #41" として参照する | task-specification-creator Phase 12 の CLOSED Issue governance。Issue ライフサイクルと仕様作成履歴を切り離し、双方向リンクだけを維持する |
| 2026-04-29 | 現行コードの `GOOGLE_SHEETS_SA_JSON` / `packages/integrations/google/src/forms/auth.ts` と、本仕様の `GOOGLE_SHEETS_SA_JSON` / `sheets-fetcher.ts` 表記差分は Phase 2 実装前ゲートで解消する | aiworkflow-requirements の正本照合。未決の env 名・export path を前提に実装しない |

## 目的

UT-03 で実装した `apps/api/src/jobs/sheets-fetcher.ts` モジュールと UT-25 で配置した `GOOGLE_SHEETS_SA_JSON` シークレットを使い、実際の Google Sheets API v4 への認証・データ取得疎通を Cloudflare Workers の Edge Runtime 上で確認する。fetch mock では検出できない JWT 署名（Web Crypto API / RSA-SHA256）・OAuth 2.0 token endpoint・`spreadsheets.values.get` の end-to-end 動作と、アクセストークンキャッシュ・401/403 エラーハンドリングの実機挙動を保証し、後続 UT-09（Sheets→D1 同期ジョブ）が本番 Sheets API に安全にアクセスできる前提を確立する。

## スコープ

### 含む

- staging 環境の Cloudflare Workers から Google Sheets API v4 `spreadsheets.values.get` への疎通確認スクリプト/エンドポイントの追加（`apps/api/src/scripts/smoke-test-sheets.ts` または `/admin/smoke/sheets` 等の dev 限定ルート）
- Service Account 認証フロー（JWT 生成 → access token 取得 → API 呼び出し）の end-to-end 動作確認
- 対象スプレッドシート（formId: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` に紐づく Google Sheets）からの値取得
- アクセストークンキャッシュ（TTL 1時間 / Workers in-memory or KV）の動作確認（2回目以降の OAuth fetch 省略）
- 401 / 403 / 429 エラーのハンドリング検証と、原因切り分け runbook の整備
- ローカル開発環境（`.dev.vars` + `wrangler dev`）での疎通確認
- 疎通確認結果（成功ログ・レスポンスサマリー）の `outputs/phase-11/manual-smoke-log.md` 等への記録
- UT-03 設計文書および本タスクの完了記録への追記

### 含まない

- 同期ロジックの実装（UT-09 のスコープ）
- D1 へのデータ書き込み（UT-09 / UT-21 のスコープ）
- production 環境への本番データ書き込み（疎通確認は staging 読み取りのみ）
- Sheets API のレート制限対策本体の実装（UT-09 のスコープ。本タスクでは 429 ハンドリング確認のみ）
- `sheets-fetcher.ts` モジュールの機能追加（UT-03 のスコープ）
- 通知・モニタリング基盤との連携（UT-07 / UT-08）
- Cron 起動・定期実行（UT-09）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-03（Sheets API 認証方式設定） | `sheets-fetcher.ts` の実装が存在しないと疎通確認スクリプトが作成できない |
| 上流 | UT-25（Cloudflare Secrets 本番配置） | `GOOGLE_SHEETS_SA_JSON` が staging に配置済みでないと認証フローが動作しない |
| 上流 | 01c-parallel-google-workspace-bootstrap | Service Account に対象 Sheets の閲覧権限が共有設定されていること |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 本タスク完了により本番 Sheets API へのアクセスが保証される |
| 下流 | UT-10（エラーハンドリング標準化） | 本タスクで観測した 401/403/429 挙動を formalize 対象として渡す |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-26-sheets-api-e2e-smoke-test.md | 原典 unassigned-task スペック |
| 必須 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | sheets-fetcher.ts の実装詳細・認証フロー |
| 必須 | docs/30-workflows/unassigned-task/UT-25-cloudflare-secrets-sa-json-deploy.md | シークレット配置の前提 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/ | 完了後の次ステップ |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets / .dev.vars 管理方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/arch-integration-packages.md | `packages/integrations/{service}/` 外部連携構成 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | dev 限定 smoke route 命名規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | 既存 `GOOGLE_SHEETS_SA_JSON` との env 名照合 |
| 参考 | .claude/skills/aiworkflow-requirements/references/quality-e2e-testing.md | NON_VISUAL smoke と UI E2E の責務分離 |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 リファレンス |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account | Service Account 認証フロー公式 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Workers Web Crypto API |

## 受入条件 (AC)

- AC-1: staging 環境の Cloudflare Workers から `spreadsheets.values.get` が HTTP 200 で成功する
- AC-2: JWT 生成 → アクセストークン取得 → API 呼び出しの end-to-end フローが Workers Edge Runtime 上で動作する
- AC-3: 対象スプレッドシート（formId: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` に紐づく Sheets）から値が取得できる（シート名・行数・サンプル行を証跡に記録）
- AC-4: アクセストークンキャッシュが動作し、2回目以降の API 呼び出しで OAuth token endpoint への fetch が省略される
- AC-5: 401（無効トークン）/ 403（権限不足 = SA 共有未設定）/ 429（レート制限）の各ケースで期待されるエラー分類とログが出力される
- AC-6: ローカル開発環境（`.dev.vars` + `wrangler dev`）で同等の疎通確認が成功する
- AC-7: 疎通確認結果（成功日時・環境・取得データのサマリー・トラブルシュート手順）が verification-report として記録される
- AC-8: Service Account JSON は Cloudflare Secrets / 1Password 経由のみで注入され、リポジトリ・ログ・PR 説明文に平文値が一切残らない
- AC-9: 403 エラー発生時の原因切り分け手順（SA 共有 / JSON 改行コード / Sheets API 有効化 / formId vs spreadsheetId 取り違え）が runbook 化されている
- AC-10: UT-09 が本番 Sheets API に安全にアクセスできる前提が満たされたとマークされる
- AC-11: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md（Schema / 共有コード Ownership 宣言含む） |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/smoke-test-design.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック | phase-05.md | spec_created | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke test | phase-11.md | spec_created | outputs/phase-11/manual-smoke-log.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/implementation-guide.md |
| 13 | PR 作成 | phase-13.md | approval_required | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（4条件評価・true issue） |
| 設計 | outputs/phase-02/smoke-test-design.md | 疎通確認スクリプト/ルートのモジュール設計・シーケンス図 |
| 設計 | outputs/phase-02/cache-and-error-mapping.md | アクセストークンキャッシュ / 401/403/429 mapping |
| レビュー | outputs/phase-03/main.md | 代替案 3種以上 + PASS/MINOR/MAJOR 判定 |
| テスト | outputs/phase-04/test-strategy.md | unit / contract / smoke / authorization 設計 |
| 実装 | outputs/phase-05/implementation-runbook.md | ファイル一覧・擬似コード・手順 |
| 異常系 | outputs/phase-06/failure-cases.md | 401/403/429/JSON parse / network 切断シナリオ |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 のトレーサビリティ |
| QA | outputs/phase-09/free-tier-estimation.md | Workers / Sheets API 無料枠見積もり |
| ゲート | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・blocker 一覧 |
| 証跡 | outputs/phase-11/manual-smoke-log.md | wrangler dev / staging 実行ログ・curl 出力 |
| 証跡 | outputs/phase-11/troubleshooting-runbook.md | 403 切り分け手順書 |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生向け）+ Part 2（技術者向け） |
| ガイド | outputs/phase-12/system-spec-update-summary.md | 仕様書同期サマリー |
| ガイド | outputs/phase-12/documentation-changelog.md | ドキュメント更新履歴 |
| ガイド | outputs/phase-12/unassigned-task-detection.md | 未タスク検出レポート（0件でも出力） |
| ガイド | outputs/phase-12/skill-feedback-report.md | スキルフィードバック |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/api smoke route ランタイム | 無料枠（1日100,000 requests） |
| Cloudflare Secrets | Service Account JSON 格納 | 無料 |
| Google Sheets API v4 | 疎通確認の対象 API | 無料（300 req/min/project） |
| Google OAuth 2.0 token endpoint | アクセストークン取得 | 無料 |
| wrangler CLI | dev 起動・staging deploy | 無料 |
| 1Password Environments | SA JSON の正本管理 | 既存契約 |

## Secrets 一覧（このタスクで参照）

| Secret 名 | 用途 | 注入経路 | 1Password Vault |
| --- | --- | --- | --- |
| `GOOGLE_SHEETS_SA_JSON` | Service Account JSON 文字列 | Cloudflare Secret / `.dev.vars` | UBM-Hyogo / staging |
| `SHEETS_SPREADSHEET_ID` | 疎通確認対象 spreadsheetId | Cloudflare Variable / `.dev.vars` | UBM-Hyogo / staging |
| `SMOKE_ADMIN_TOKEN` (任意) | dev 限定 smoke route の認証 | Cloudflare Secret / `.dev.vars` | UBM-Hyogo / staging |

> 本タスクで新規 Secret は導入しない。UT-25 で配置済みの値を参照する。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | 疎通確認は値の存在のみを確認し、列順 / カラム名にハードコード依存しない |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | 本タスクは取得のみで書き込まない。違反対象なし |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | smoke route は `apps/api` 内に閉じ、`apps/web` から呼ばない |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する
- Phase 1 に Schema / 共有コード Ownership 宣言があり、UT-26 が `apps/api/src/jobs/sheets-fetcher.ts` / D1 schema / shared exports の owner ではないことが明示されている
- AC-1〜AC-11 が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルール（LOGS.md / SKILL.md / topic-map）が破られていない
- Phase 13 はユーザー承認なしでは実行しない
- production 環境へは書き込みを行っていない

## 苦戦箇所・知見（原典より継承）

**1. fetch mock テストと実 API の差分**
UT-03 のユニットテストは `fetch` をモックしており、JWT 署名・トークン取得の HTTP 通信が検証されていない。Workers Edge Runtime の Web Crypto API による RSA-SHA256 署名が実機で正しく動作するかは、本タスクで初めて検証される。

**2. Service Account の権限付与漏れ**
403 PERMISSION_DENIED の原因は (a) SA メールが Sheets に共有されていない、(b) `GOOGLE_SHEETS_SA_JSON` の改行コード破損、(c) Sheets API が GCP プロジェクトで無効、のいずれかが多い。エラーメッセージだけでは特定しにくいため、各ステップを段階的に確認する runbook を Phase 11 で整備する。

**3. formId と spreadsheetId の対応確認**
Google Forms の formId と回答先 Google Sheets の spreadsheetId は別。疎通確認で使う spreadsheetId は Forms「回答」タブの連携シートから取得する。混同を防ぐため、Phase 2 設計で「定数定義の出典コメント」を必須化する。

**4. wrangler dev のローカル fetch 制約**
`wrangler dev --local` では外部 fetch に制限がかかる場合がある。`wrangler dev`（remote / preview モード）に切り替えて検証する旨を runbook に明記する。

**5. アクセストークン TTL とキャッシュ**
TTL 1時間のキャッシュが Workers の isolate 再起動で失われる前提が `sheets-fetcher.ts` にあるか、Phase 2 設計レビューで確認。in-memory cache でも疎通確認は可能だが、複数 isolate 跨ぎテストは out-of-scope とする。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../02-application-implementation/_templates/phase-template-app.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/41
- 原典 unassigned-task: ../unassigned-task/UT-26-sheets-api-e2e-smoke-test.md
