# ut-03-sheets-api-auth - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-03 |
| タスク名 | Sheets API 認証方式設定 |
| ディレクトリ | docs/01-infrastructure-setup/ut-03-sheets-api-auth |
| Wave | 1 |
| 実行種別 | 独立タスク |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| 状態 | pending |
| タスク種別 | 実装タスク |
| GitHub Issue | #5 |

## 目的

Google Sheets API v4 への接続認証方式（Service Account JSON key）を選定し、Cloudflare Workers の Edge Runtime 上から安全かつ効率的に認証フローを実装する。
Web Crypto API を用いた JWT 署名・アクセストークン取得・TTL 1時間のキャッシュ機構を `packages/integrations/src/sheets-auth.ts` に実装し、下流タスク（UT-09 / 03-serial-data-source-and-storage-contract）が安全に Sheets API を呼び出せる基盤を提供する。

## スコープ

### 含む

- 認証方式の比較評価（Service Account JSON key vs OAuth 2.0）と選定根拠の文書化
- Cloudflare Secrets への `GOOGLE_SERVICE_ACCOUNT_JSON` 配置手順（runbook）
- `packages/integrations/src/sheets-auth.ts` モジュールの実装
  - Web Crypto API による RS256 JWT 署名
  - Google OAuth 2.0 Token Endpoint からのアクセストークン取得
  - TTL 1時間のアクセストークンキャッシュ（Workers KV または in-memory）
- `.dev.vars` を用いたローカル開発フローの文書化
- `.gitignore` への `.dev.vars` 除外確認
- Sheets スプレッドシートへのサービスアカウント共有手順の runbook 記載

### 含まない

- Google Sheets API v4 の読み書き実装（→ UT-09 で実施）
- D1 スキーマ設計（→ UT-04 で実施）
- Sheets→D1 同期ジョブ実装（→ UT-09 で実施）
- Google Cloud Project の作成・Service Account 発行（→ 01c-parallel-google-workspace-bootstrap で実施済み前提）
- 認証基盤以外の Workers バインディング設定（→ 02-serial-monorepo-runtime-foundation で実施済み前提）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap | Google Cloud Project・Service Account の発行・Sheets API 有効化が必要 |
| 上流 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation | `packages/integrations` ディレクトリ・wrangler.toml・Cloudflare Workers 環境が整備済みであること |
| 上流 | UT-01 (Sheets→D1 同期方式定義) | 同期方式の決定により、必要な Sheets API スコープが確定する |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本タスクの sheets-auth.ts を使って Sheets API を呼び出す |
| 下流 | 03-serial-data-source-and-storage-contract | Sheets API 認証を前提として、データソース契約が設計される |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Workers・Secrets・KV の基本手順 |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/index.md | タスク概要・AC |
| 参考 | docs/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap/index.md | 上流タスク（Service Account 発行済み前提） |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 受入条件 (AC)

- AC-1: Service Account JSON key と OAuth 2.0 の比較評価表が `outputs/phase-02/auth-comparison-table.md` に存在する
- AC-2: `GOOGLE_SERVICE_ACCOUNT_JSON` が Cloudflare Secrets（staging / production）に配置済みであることが確認できる
- AC-3: `packages/integrations/src/sheets-auth.ts` が実装済みで、JWT 署名・アクセストークン取得・TTL キャッシュが動作する
- AC-4: ローカル・staging・production 環境での動作確認（Sheets API 疎通）が verified である
- AC-5: `.dev.vars` が `.gitignore` に記載されており、機密情報がリポジトリにコミットされない状態が確認できる
- AC-6: Sheets スプレッドシートへのサービスアカウント共有手順が runbook に記載されている
- AC-7: ローカル開発フロー（`.dev.vars` を使ったシークレット注入）が文書化されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/requirements.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/ |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/design-review.md |
| 4 | 事前検証手順 | phase-04.md | pending | outputs/phase-04/pre-verify-checklist.md |
| 5 | 実装・セットアップ実行 | phase-05.md | pending | outputs/phase-05/ |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/ |
| 7 | 検証項目網羅性 | phase-07.md | pending | outputs/phase-07/ |
| 8 | 設定 DRY 化 | phase-08.md | pending | outputs/phase-08/ |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/ |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/ |
| 11 | 手動 smoke test | phase-11.md | pending | outputs/phase-11/ |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/ |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/ |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 実装 | packages/integrations/src/sheets-auth.ts | JWT 署名・トークン取得・キャッシュのメインモジュール |
| ドキュメント | outputs/phase-02/auth-design.md | 認証フロー設計ドキュメント |
| ドキュメント | outputs/phase-02/auth-comparison-table.md | Service Account vs OAuth 2.0 比較評価表 |
| ドキュメント | outputs/phase-02/env-secret-matrix.md | 環境別シークレット管理マトリクス |
| ドキュメント | outputs/phase-05/sheets-auth-runbook.md | 認証セットアップ runbook |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec update summary |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Google Sheets API v4 | スプレッドシートデータ取得 | 無料枠あり（500 req/100s） |
| Google Cloud IAM | Service Account 発行・権限管理 | 無料 |
| Cloudflare Secrets | シークレット安全管理（本番・staging） | 無料 |
| Cloudflare Workers KV | アクセストークンキャッシュ（TTL 1時間） | 無料枠あり |
| Web Crypto API | RS256 JWT 署名（Edge Runtime 対応） | Workers 標準組み込み |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見

**1. Cloudflare Workers Edge Runtime では Node.js の `crypto` モジュールが使えない**
`jsonwebtoken` 等の Node.js ライブラリは Edge Runtime 非対応のため、Web Crypto API (`crypto.subtle.importKey` / `crypto.subtle.sign`) を使った RS256 JWT 署名を自前で実装する必要がある。PEM 形式の秘密鍵を DER バイナリに変換してからインポートするステップが必要。

**2. Service Account JSON の安全な管理**
Service Account JSON key には秘密鍵が含まれるため、`.dev.vars`（ローカル）と Cloudflare Secrets（staging/production）で管理し、絶対にリポジトリにコミットしない。`.gitignore` への `.dev.vars` 記載確認を AC に含める。

**3. アクセストークンの TTL とキャッシュ戦略**
Google OAuth 2.0 アクセストークンの有効期間は 1時間（3600秒）。Workers リクエストごとに毎回トークンを取得すると API レート制限に抵触するリスクがある。Workers KV または module-scoped in-memory 変数でキャッシュし、残り有効期間が短い場合に再取得するロジックが必要。

**4. Sheets API のスコープ設定**
読み取りのみの場合は `https://www.googleapis.com/auth/spreadsheets.readonly` スコープで十分。書き込みが不要なのに `spreadsheets` フルスコープを要求しないよう、UT-01 の同期方式定義と連携してスコープを最小化する。

**5. ローカル開発と CI/CD での環境差異**
ローカルは `.dev.vars`、staging/production は Cloudflare Secrets と、環境によってシークレット注入方法が異なる。`wrangler dev` は `.dev.vars` を自動読み込みするが、`wrangler deploy` は Cloudflare Secrets のみ参照するため、env-secret-matrix.md での明示が重要。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-infra.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/5
