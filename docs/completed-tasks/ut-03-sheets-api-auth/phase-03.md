# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API 認証方式設定 (UT-03) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (事前検証手順) |
| 状態 | completed |

## 目的

Phase 2 で作成した設計ドキュメント（認証方式比較・JWT フロー・インターフェース定義・シークレット管理マトリクス）を多角的な観点でレビューし、実装 Phase に進む前に設計上の欠陥・セキュリティリスク・Edge Runtime 制約との不整合を検出・解消する。

## レビュー観点と判定基準

### 判定基準

| 判定 | 意味 | 対応 |
| --- | --- | --- |
| PASS | 問題なし | 次 Phase に進む |
| MINOR | 軽微な改善点あり | 次 Phase 開始前に修正、ブロックしない |
| MAJOR | 重大な欠陥あり | 修正後に再レビュー必須（次 Phase に進まない） |

### 代替案検討（Alternatives）

以下の代替案が Phase 2 で棄却されていることを確認する。

| 代替案 | 棄却理由 | 確認済み |
| --- | --- | --- |
| OAuth 2.0 認可コードフロー | Workers は UI なし・ブラウザリダイレクト不可 | [ ] |
| Workload Identity Federation | GCP と Cloudflare の OIDC 連携が複雑でコスト高 | [ ] |
| API Key 認証 | Sheets API は API Key のみでは書き込み不可、Service Account が優位 | [ ] |
| `google-auth-library` npm パッケージ | Node.js 依存があり Edge Runtime 非対応 | [ ] |

## セキュリティレビュー観点

### Service Account JSON key の安全な管理

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| `.dev.vars` の `.gitignore` 記載 | リポジトリルートの `.gitignore` に `.dev.vars` が記載されているか | REVIEW_REQUIRED |
| Cloudflare Secrets への配置 | staging / production の `GOOGLE_SERVICE_ACCOUNT_JSON` が Cloudflare Secrets に格納されているか | REVIEW_REQUIRED |
| Service Account の権限最小化 | Sheets API スコープが `spreadsheets.readonly`（または UT-01 で確定した最小スコープ）に限定されているか | REVIEW_REQUIRED |
| JSON key のローテーション手順 | key の失効・再発行手順が runbook に含まれているか（設計時点では定義のみでよい） | REVIEW_REQUIRED |
| JWT 有効期限の設定 | JWT の `exp` が `iat + 3600`（最大値）に設定されており、不必要に長くないか | REVIEW_REQUIRED |
| トークンキャッシュのキー衝突 | 複数の Service Account を使う場合にキャッシュキーが衝突しないか | REVIEW_REQUIRED |
| エラーメッセージへの秘密鍵漏洩 | `SheetsAuthError` のメッセージや stack trace に秘密鍵が含まれないか | REVIEW_REQUIRED |

### Edge Runtime 制約レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| `crypto.subtle` の使用 | Node.js の `crypto` モジュールではなく `Web Crypto API (crypto.subtle)` を使用しているか | REVIEW_REQUIRED |
| PEM → DER 変換 | RSA 秘密鍵を `crypto.subtle.importKey` に渡す前に PEM ヘッダー除去・Base64 デコード・DER 変換が実装されているか | REVIEW_REQUIRED |
| `fetch` の使用 | `node-fetch` 等ではなく Workers 組み込みの `fetch` を使用しているか | REVIEW_REQUIRED |
| `Buffer` の不使用 | Node.js の `Buffer` は使用不可。`Uint8Array` / `TextEncoder` / `btoa` 等を使用しているか | REVIEW_REQUIRED |
| `process.env` の不使用 | Workers では `process.env` は使えない。`env.GOOGLE_SERVICE_ACCOUNT_JSON` を使用しているか | REVIEW_REQUIRED |
| 非同期処理の完結 | Workers リクエストの生存期間内に非同期処理が完結するよう `await` が正しく使われているか | REVIEW_REQUIRED |

### モジュール設計レビュー

| レビュー項目 | 確認内容 | 判定 |
| --- | --- | --- |
| 単一責務 | `sheets-auth.ts` が認証トークン取得・キャッシュのみを担い、Sheets データ操作を含まないか | REVIEW_REQUIRED |
| 公開インターフェースの安定性 | `getAccessToken(env)` のシグネチャが下流（UT-09）の変更を最小化する設計か | REVIEW_REQUIRED |
| エラー型の明確化 | `SheetsAuthError` で認証エラーを型安全に伝播できるか | REVIEW_REQUIRED |
| キャッシュ戦略の適切性 | KV binding がない場合の in-memory fallback が設計されているか | REVIEW_REQUIRED |


## 実行タスク

- [ ] この Phase の目的に沿って、既存セクションに記載されたレビュー、設計、検証を順番に実行する
- [ ] 実行結果は対応する outputs/phase-03/ 配下へ記録する
- [ ] 後続 Phase の入力として必要な差分、判断、未解決事項を明記する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/auth-design.md | レビュー対象（JWT フロー設計） |
| 必須 | outputs/phase-02/auth-comparison-table.md | レビュー対象（認証方式比較） |
| 必須 | outputs/phase-02/env-secret-matrix.md | レビュー対象（シークレット管理） |
| 必須 | docs/ut-03-sheets-api-auth/phase-02.md | インターフェース定義の参照 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Edge Runtime 制約の正本確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | レビュー結果（全項目の判定・MAJOR/MINOR の修正内容） |
| メタ | artifacts.json | phase-03 を completed に更新 |


## 統合テスト連携（Phase 1〜11は必須）

- 対象コマンド: `pnpm --filter @ubm-hyogo/integrations test:run`
- 連携対象: `packages/integrations/src/sheets-auth.ts` と Sheets API 認証境界
- 記録先: `outputs/phase-03/` 配下の Phase 成果物
- 依存確認: Phase 4 以降で `pnpm install` と `pnpm --filter @repo/shared build` の必要性を再確認する

## 完了条件

- [ ] 全レビュー項目の判定が PASS / MINOR / MAJOR / CRITICAL のいずれかで記録されている
- [ ] MAJOR 判定が存在しないこと（存在する場合は Phase 2 に差し戻し再設計）
- [ ] MINOR 判定がある場合、修正内容が `outputs/phase-03/design-review.md` に記録されている
- [ ] 代替案の棄却理由が全て確認済みである
- [ ] セキュリティ観点・Edge Runtime 制約観点の全項目が PASS または MINOR（修正内容記載）

## タスク100%実行確認【必須】

- 全レビュー項目が判定済み
- 全成果物が指定パスに配置済み
- MAJOR 判定がある場合は Phase 2 に差し戻し
- artifacts.json の phase-03 を completed に更新

## 次 Phase

- 次: 4 (事前検証手順)
- 引き継ぎ事項: レビュー結果（PASS/MINOR の修正内容）を事前検証手順の設計に反映する
- ブロック条件: MAJOR 判定が解消されていない場合は次 Phase に進まない
