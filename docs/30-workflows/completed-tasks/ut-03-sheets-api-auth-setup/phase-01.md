# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 機能名 | Google Sheets API 認証基盤（Service Account JSON key + Web Crypto JWT） |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel（UT-01 と並列着手可能、UT-09 等の下流タスクのブロッカー） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed（実装・仕様書フェーズ完了。workflow root は `completed`） |
| タスク種別 | implementation（`packages/integrations` への認証モジュール追加 + runbook 作成。docs-only ではない） |
| visualEvidence | NON_VISUAL（CLI / API 疎通結果のみで evidence を確保。UI screenshot は不要） |
| scope | `packages/integrations/google` 配下の認証モジュール、`apps/api` からの呼び出し点、Cloudflare Secrets / `.dev.vars` / `.gitignore` の運用文書 |
| taskType | implementation |
| workflow_state | completed |
| Issue | GitHub Issue #52（クローズ済み・タスク仕様書のみ作成） |

> **必須項目**: 上記 14 行は省略不可。Phase 1 完了時点で `artifacts.json.metadata.{taskType, visualEvidence, scope, workflow_state}` を確定する（task-specification-creator SKILL §「タスクタイプ判定フロー」）。

## 目的

Google Sheets API v4 への接続認証方式（Service Account JSON key vs OAuth 2.0）を選定し、Cloudflare Workers の Edge Runtime で動作する認証フローを `packages/integrations` 内に閉じて構築する。UT-01 の同期方式設計と並列に進め、UT-09（Sheets→D1 Cron 同期ジョブ実装）が利用する認証 client を、Service Account メールへの Sheets 共有設定込みで再利用可能な状態に固める。

## 真の論点 (true issue)

- 「認証ライブラリを採用すること」ではなく、「Cloudflare Workers Edge Runtime 上で Node API に依存せず、Service Account JSON を Cloudflare Secrets / 1Password 連動の経路でのみ授受し、Web Crypto API による JWT 署名 + アクセストークン取得 + TTL 1h キャッシュを `packages/integrations` 内に閉じて提供する」ことが本質。
- 副次的論点として、ローカル開発時の `.dev.vars` 運用と `.gitignore` ガード、および Service Account メールアドレスの Sheets 共有手順を runbook 化し、403 PERMISSION_DENIED の苦戦箇所を再現性のある手順として固定すること。

## 不変条件 touched / Schema・共有コード Ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | `packages/integrations/google/src/sheets/auth.ts` 新設（モジュール公開）、`apps/api` 側の env binding 型定義、`.gitignore` の `.dev.vars` ガード |
| 本タスクが ownership を持つか | yes（Sheets 認証モジュールの初出 owner。後続 UT-09 / UT-21 は consumer） |
| 他 wave への影響 | UT-09（Cron 同期ジョブ）と UT-21（sheets-d1-sync-endpoint-and-audit）が consumer。本タスクの export 名・引数 shape を変えると下流が壊れる |
| 競合リスク | 並列 wave で `packages/integrations/google` を編集する他タスクは現時点で無し。命名予約として `packages/integrations/google/src/sheets/auth.ts` / `getSheetsAccessToken()` / `SheetsAuthEnv` を本タスクで占有 |
| 不変条件 touched | #5（D1 アクセスは apps/api に閉じる）に違反しないよう、本モジュールは D1 を触らず Sheets API トークンのみ提供。シークレット平文の `.env` 混入禁止（CLAUDE.md ルール）に整合 |

> 並列 wave 必須事項。`task-specification-creator/references/phase-template-phase1.md §1.X` に従い宣言する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap | Google Cloud Project / Service Account / OAuth client 発行が完了 | 本タスクは Google Cloud 側のリソース作成を再実装しない |
| 上流 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation | `packages/integrations` の責務境界が確定 | 認証モジュール配置先を踏襲 |
| 上流 | UT-01 (Sheets→D1 同期方式定義) | 同期で必要となる Sheets API スコープ（`spreadsheets.readonly`）が確定 | 必要スコープを認証 client の固定値として持つ |
| 下流 | UT-09 (Sheets→D1 Cron 同期ジョブ実装) | 認証 client `getSheetsAccessToken()` を再利用 | 公開 API・引数 shape を契約として渡す |
| 下流 | UT-21 (sheets-d1-sync-endpoint-and-audit) | 同上 | 同上 |
| 下流 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract | Sheets 接続認証が確立済 | Secret 名 `GOOGLE_SERVICE_ACCOUNT_JSON` を契約 |
| 連携 | docs/30-workflows/completed-tasks/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | CI/CD 環境への secret 配置経路 | secret 名・形式を 04 タスクへ提示 |

## 価値とコスト

- 価値: 後続の Sheets→D1 同期および admin endpoint がすべて本モジュールを通じて認証することで、認証実装の重複と漏洩リスクを排除。Service Account 方式により無人実行（Cron / Cloudflare scheduled）が可能になる。
- コスト: `packages/integrations/google/src/sheets/auth.ts` 新設 1 ファイル + 単体テスト 1 ファイル。Cloudflare Secrets 配置 1 件（dev / staging / production）。Sheets 共有設定 1 件。
- 機会コスト: OAuth 2.0 を選んだ場合、refresh token のサーバー側保管と更新が必要となり、Workers 環境で永続ストレージ（KV / D1）に置く設計が増えるため Service Account 方式の方が無料枠維持の観点でも有利。

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-09 / UT-21 の認証基盤を一元化し、Sheets API 接続を再現可能化する |
| 実現性 | PASS | 01c で Service Account 発行完了、Web Crypto API は Workers Edge Runtime ネイティブ対応 |
| 整合性 | PASS | 不変条件 #5 を遵守（D1 を触らない）、CLAUDE.md のシークレット運用ルール（1Password 経由 / `.env` 平文禁止）に整合 |
| 運用性 | PASS | TTL 1h キャッシュにより Sheets API への JWT 交換コール頻度を最小化、`.dev.vars` 運用で local 再現性を確保 |

## 苦戦箇所の AC 写経（unassigned-task からの継承）

UT-03 原典の苦戦箇所 4 件を Phase 1 の AC として写経・拡張する。

| # | 苦戦箇所 | 対応 AC | 受け皿 Phase |
| --- | --- | --- | --- |
| 1 | Service Account JSON key vs OAuth 2.0 の選定で迷いやすい | AC-1 比較評価表が成果物に含まれる | Phase 2 設計 / Phase 3 代替案 |
| 2 | Workers での JWT 生成と Node API 非互換 | AC-2 Web Crypto API による JWT 署名フローが設計に含まれる | Phase 2 設計 |
| 3 | シークレット環境別管理と local 開発 (`.dev.vars` / `.gitignore`) | AC-3 シークレット管理マトリクスと `.gitignore` ガード手順が runbook 化 | Phase 2 設計 / Phase 5 runbook |
| 4 | Service Account メールへの Sheets 共有忘れによる 403 PERMISSION_DENIED | AC-4 共有手順 runbook と疎通確認スクリプトを成果物化 | Phase 5 runbook / Phase 11 疎通確認 |

## 受入条件 (Acceptance Criteria)

- AC-1: Service Account JSON key vs OAuth 2.0 の比較評価表が `outputs/phase-02/` に存在する。
- AC-2: Web Crypto API による JWT 署名 → access_token 取得 → TTL 1h キャッシュのフローが設計図とともに記述される。
- AC-3: `GOOGLE_SERVICE_ACCOUNT_JSON` の Cloudflare Secrets / `.dev.vars` / 1Password / `.gitignore` 配置マトリクスが文書化される。
- AC-4: Service Account メールアドレスの Sheets 共有手順が runbook 化される。
- AC-5: `packages/integrations/google/src/sheets/auth.ts` のモジュール構成（公開 API / 内部関数 / 依存）が設計に含まれる。
- AC-6: Sheets API v4 `spreadsheets.values.get` の疎通確認スクリプトが Phase 5 / Phase 11 の成果物として placeholder 化される。
- AC-7: 認証モジュールが Node API に依存しないことを設計レベルで確認（`google-auth-library` 不採用の理由を Phase 3 alternatives に記録）。
- AC-8: `JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)` の失敗時エラーハンドリング方針（fail-fast と log redact）が設計に含まれる。
- AC-9: 不変条件 #5 違反が無い（本モジュールは D1 を直接触らない）。
- AC-10: dev / staging / production 3 環境すべてに対する secret 配置経路が記述される。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-03-sheets-api-auth-setup.md | 原典スペック（苦戦箇所の写経元） |
| 必須 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/index.md | Service Account / OAuth client 発行手順・secrets 名統一 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md | `GOOGLE_SERVICE_ACCOUNT_JSON` 配置先定義 |
| 必須 | docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md | 必要 Sheets API スコープ確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | `packages/integrations` 責務境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env / `.dev.vars` 管理 |
| 参考 | https://developers.google.com/identity/protocols/oauth2/service-account | Service Account JWT フロー公式 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Web Crypto API 公式 |

## 実行手順

### ステップ 0: P50 既実装状態の確認

```bash
# packages/integrations/google 配下の既存実装を確認
ls -la packages/integrations 2>/dev/null || echo "未作成"
grep -rn "sheets" packages/integrations/ 2>/dev/null
grep -rn "google-auth-library\|googleapis" package.json apps/ packages/ 2>/dev/null
```

既存実装が空であることを前提に Phase 2 設計へ進む。既に部分実装が存在する場合は Phase 2 で差分設計に切り替える。

### ステップ 1: 上流前提の確認

- 01c-parallel-google-workspace-bootstrap が `completed-tasks` に存在することを確認。
- Service Account の JSON key が 1Password Vault `UBM-Hyogo / dev|staging|production` に登録済みであることを確認（実値の閲覧は禁止、項目の存在確認のみ）。

### ステップ 2: 真の論点と AC のロック

- AC-1〜AC-10 を本ファイルと `outputs/phase-01/main.md` で完全一致させる。
- 4 条件 PASS を確定し、Phase 2 設計に渡す。

### ステップ 3: Schema / 共有コード Ownership 宣言の確定

- 公開 API 命名（`getSheetsAccessToken()` / `SheetsAuthEnv` / `packages/integrations/google/src/sheets/auth.ts`）を本タスクで予約。
- 下流 wave（UT-09 / UT-21）に対し本契約を変更しない約束を明示。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・AC・Ownership 宣言を設計入力として渡す |
| Phase 3 | 4 条件評価の根拠を代替案比較の評価軸として再利用 |
| Phase 4 | AC-1〜AC-10 をテスト戦略のトレース対象に渡す |
| Phase 11 | AC-4 / AC-6 を疎通確認の evidence として手動実行 |

## 多角的チェック観点

- 不変条件 #5: D1 を直接触らない。Sheets トークン取得のみを責務とする。
- Secret hygiene: `.env` に実値を書かない（CLAUDE.md 規定）、1Password 参照（`op://`）のみ。
- Edge Runtime 互換: Node API 依存（fs / crypto Node module）を含めない。Web Crypto API のみ。
- 認可境界: 本モジュール自体は内部 util。public 経路に露出しない。
- 無料枠: Sheets API 300 req/min/project、JWT 交換は TTL 1h キャッシュで月数十回程度に抑制。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「Edge Runtime 互換 + Secret 一貫運用」に再定義 | 1 | spec_created | main.md 冒頭 |
| 2 | 依存境界（上流 3 / 下流 3 / 連携 1）の固定 | 1 | spec_created | UT-09 / UT-21 への契約 |
| 3 | 4 条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | Schema / 共有コード Ownership 宣言 | 1 | spec_created | `packages/integrations/google/src/sheets/auth.ts` を本タスクで占有 |
| 5 | AC-1〜AC-10 確定 | 1 | spec_created | 苦戦箇所 4 件と紐付け |
| 6 | artifacts.json メタ確定 | 1 | spec_created | taskType / visualEvidence / scope / workflow_state |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（真の論点・AC・Ownership 宣言・4 条件評価） |
| メタ | artifacts.json | Phase 1 状態の更新（後続 Phase 群作成時に生成） |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 真の論点が「Edge Runtime 互換 + Secret 一貫運用」に再定義されている
- [ ] 4 条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 3 / 下流 3 / 連携 1 すべてが前提と出力付きで記述されている
- [ ] AC-1〜AC-10 が Phase 1 / Phase 2 / Phase 3 の入力として一貫している
- [ ] Schema / 共有コード Ownership が `yes` で宣言され、命名予約が確定している
- [ ] artifacts.json メタ 4 項目（taskType / visualEvidence / scope / workflow_state）が確定可能な状態
- [ ] 苦戦箇所 4 件すべてが AC または受け皿 Phase に紐付いている

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 4 件すべてが AC または多角的チェックに対応
- 異常系（JSON parse 失敗 / 403 PERMISSION_DENIED / Node API 非互換 / `.env` 平文混入）の論点が要件レベルで提示されている
- artifacts.json `metadata.visualEvidence = NON_VISUAL` を確定（Phase 1 完了 DoD）

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 採用方式 = Service Account JSON key（Phase 2 で詳細設計、Phase 3 で代替案として OAuth 2.0 / google-auth-library / Workers 互換 JWT ライブラリを比較）
  - 公開 API 名: `getSheetsAccessToken()`, 型: `SheetsAuthEnv`
  - TTL 1h キャッシュ採用、Web Crypto API 利用
  - シークレット名: `GOOGLE_SERVICE_ACCOUNT_JSON`
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - artifacts.json メタ 4 項目が未確定
  - Schema / 共有コード Ownership 宣言が欠落
