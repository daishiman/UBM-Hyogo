# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

Sheets API 認証方式設定タスクの必要性・スコープ・受入条件を確定し、下流 Phase の手戻りを防ぐ。
特に「Cloudflare Workers Edge Runtime で Google 認証をどう実現するか」という技術的論点を早期に特定し、設計 Phase に適切なインプットを渡す。

## 真の論点

UT-03 の本質的な問題は以下の3点である。

1. **Edge Runtime 制約**: Cloudflare Workers は Node.js 互換 API を持たないため、`jsonwebtoken` 等の Node.js ライブラリが使えない。Web Crypto API (`crypto.subtle`) のみで RS256 JWT 署名を実現する必要がある。

2. **シークレット管理の二重化**: Service Account JSON key はローカル（`.dev.vars`）と Cloudflare Secrets（staging/production）の2系統で管理しなければならない。環境差異を明確にしないと本番デプロイ時に認証エラーが発生する。

3. **アクセストークンのライフサイクル**: Google OAuth 2.0 アクセストークンの有効期間は 1時間。Workers リクエストごとに毎回取得すると Sheets API のレート制限（500 req/100s）に影響する。適切なキャッシュ戦略が必要。

## 依存境界と責務

| 種別 | 対象 | 本タスクとの境界 |
| --- | --- | --- |
| 上流 | 01c-parallel-google-workspace-bootstrap | GCP プロジェクト作成・Service Account 発行・Sheets API 有効化まで完了している前提 |
| 上流 | 02-serial-monorepo-runtime-foundation | `packages/integrations` ディレクトリ・pnpm workspace・wrangler.toml が整備済みの前提 |
| 上流 | UT-01 (Sheets→D1 同期方式定義) | 必要な Sheets API スコープ（readonly/readwrite）が確定している前提 |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本タスクの sheets-auth.ts を import して Sheets API 呼び出しを行う |
| 下流 | 03-serial-data-source-and-storage-contract | 本タスクの認証基盤を前提としてデータソース契約を設計する |
| 対象外 | Google Cloud Project の管理・課金 | 01c-parallel-google-workspace-bootstrap の責務 |
| 対象外 | Sheets データの読み書きロジック | UT-09 の責務 |

## 価値とコスト評価

- **初回提供価値**: Edge Runtime 対応の Sheets API 認証基盤を確立し、UT-09 以降の開発を安全・迅速に進める土台を作る
- **初回に払わないコスト**: Sheets データの読み書きロジック・D1 スキーマ設計・エラー通知基盤
- **実装コスト**: Web Crypto API を用いた JWT 署名の自前実装が必要（Node.js 標準ライブラリ非対応のため）
- **運用コスト**: Service Account JSON key のローテーション手順を runbook に含める必要がある（本 Phase では定義のみ）

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | Edge Runtime 対応の Sheets API 認証基盤が UT-09・03-serial の開発を unblock するか | TBD |
| 実現性 | Web Crypto API のみで RS256 JWT 署名が実現でき、Cloudflare Workers 無料枠内で完結するか | TBD |
| 整合性 | ローカル（`.dev.vars`）・staging・production のシークレット管理方式が一貫しているか | TBD |
| 運用性 | Service Account JSON key のローテーション・失効時のロールバック手順が明確か | TBD |

## 実行タスク

- [ ] index.md・上流タスク（01c / 02-serial / UT-01）を読み、前提条件を確認する
- [ ] 真の論点（Edge Runtime 制約・シークレット管理・トークンキャッシュ）を特定し文書化する
- [ ] スコープ（含む/含まない）を確定する
- [ ] 受入条件 (AC-1〜AC-7) を正式定義する
- [ ] 4条件評価を行い、実施可否を判断する
- [ ] 既存資産インベントリ（packages/integrations の有無・wrangler.toml の現状）を洗い出す
- [ ] `outputs/phase-01/requirements.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Workers・Secrets の基本手順 |
| 必須 | docs/01-infrastructure-setup/ut-03-sheets-api-auth/index.md | タスク概要・AC |
| 参考 | docs/01-infrastructure-setup/01c-parallel-google-workspace-bootstrap/index.md | 上流タスク（Service Account 発行済み前提の確認） |
| 参考 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | packages/integrations ディレクトリの整備状況確認 |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物（論点・スコープ・AC・4条件評価・インベントリ） |
| メタ | artifacts.json | phase-01 を completed に更新 |

## 完了条件

- 真の論点（Edge Runtime 制約・シークレット管理・トークンキャッシュ）が確定している
- 4条件評価が全て TBD でない（PASS / FAIL / CONDITIONAL の判定が出ている）
- AC-1〜AC-7 が正式定義されている
- 既存資産インベントリ（packages/integrations の有無・`.gitignore` の `.dev.vars` 記載状況）が記録されている
- downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- `outputs/phase-01/requirements.md` が作成されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（Service Account が未発行・上流タスク未完了）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の phase-01 を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC・スコープ・4条件評価・既存資産インベントリを設計の入力として渡す
- ブロック条件: 本 Phase の `outputs/phase-01/requirements.md` が未作成なら次 Phase に進まない
