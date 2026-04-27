# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-27 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |

## 目的

UT-10 の要件を確定する。具体的には、API エラーレスポンス形式・Sheets API リトライ戦略・D1 ロールバック方針・エラーログフォーマット・クライアント向けメッセージガイドラインの 5 領域に対し、AC-1〜AC-7 を検証可能な形に落とし込み、エラーコード体系の枠組み（命名規則・桁数・カテゴリ分け）を後続 Phase 2 の設計入力として整備する。

## 実行タスク

- 5 領域（API レスポンス / リトライ / ロールバック / ログ / メッセージ）の要件を確定する
- AC-1〜AC-7 を検証可能（テスト・ドキュメント・コードレビューのいずれかで判定可）な形に再定義する
- エラーコード命名規則を調査・決定する（RFC 7807 の `code` 拡張、UBM プレフィックス、4 桁番号体系）
- エラーコード体系のカテゴリ枠組みを決定する（client / auth / server / external integration の 4 大区分）
- 「内部エラー漏洩なし」の判定基準を確定する（ホワイトリスト・ブラックリスト方式の選択）
- 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）を確定する
- 既存コードの命名規則 inventory を作成し、Phase 4 のテスト命名と Phase 5 の実装ファイル名に引き継ぐ
- `git log --oneline -5` で前タスク成果物を棚卸しし、UT-10 の新規作業との差分を記録する
- 全件 `pnpm test` が重い場合に備え、targeted run 対象ファイルとコマンドを事前列挙する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 全体構成 |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | API 契約 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | D1 制約 |
| 必須 | RFC 7807 Problem Details for HTTP APIs | 標準仕様 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/index.md | タスク概要・AC |
| 参考 | .claude/skills/aiworkflow-requirements/ | ランタイム/ストレージ正本仕様 |

## 実行手順

### ステップ 1: スコープ確認と前提整理

- index.md の「含む / 含まない」と Issue #12 の本文を突き合わせ、要件の取りこぼしがないことを確認する
- 上流（02-serial / 03-serial）の完了状況を確認し、`@ubm-hyogo/shared` と Hono ランタイムが利用可能であることを前提として明記する
- 「全社的標準」の対象範囲を `apps/api` + `@ubm-hyogo/shared` に限定し、`apps/web` 側は契約整合のみであることを明記する

### ステップ 1.5: 既存コード inventory と carry-over 確認

| 確認項目 | コマンド | Phase 1 成果物 |
| --- | --- | --- |
| 前タスク成果物棚卸し | `git log --oneline -5` | `outputs/phase-01/carry-over-inventory.md` |
| 命名規則調査 | `rg --files packages apps | rg '(error|retry|transaction|logging|api-client)'` | `outputs/phase-01/naming-inventory.md` |
| 既存ユーティリティ重複確認 | `rg -n \"ApiError|withRetry|compensat|problem\\+json|traceId|requestId\" packages apps` | `outputs/phase-01/existing-error-utility-inventory.md` |
| targeted test 方針 | `rg --files packages apps | rg '\\.(test|spec)\\.(ts|tsx)$'` | `outputs/phase-01/targeted-run-plan.md` |

命名規則は既存の `kebab-case` ファイル名、`camelCase` 関数名、`PascalCase` 型名を優先する。既存実装が見つかった場合は Phase 2 で再利用可否を判定し、Phase 4 のテスト名は `describe` / `it` の実名と仕様番号を対応させる。

### ステップ 2: エラーコード体系の枠組み調査

- RFC 7807 の 5 フィールド（`type` / `title` / `status` / `detail` / `instance`）を確認し、UBM 固有 `code` 拡張の根拠を整理する
- 命名規則を `UBM-Nxxx` 形式（N = カテゴリ番号、xxx = 連番）と決定する
- カテゴリ枠組み案を以下とする:
  - `UBM-1xxx`: クライアントエラー（バリデーション・リクエスト不正）
  - `UBM-4xxx`: 認証・認可エラー
  - `UBM-5xxx`: サーバ内部エラー（D1 / 内部処理失敗）
  - `UBM-6xxx`: 外部統合エラー（Google Sheets / Auth.js / 外部サービス）
- 各カテゴリで HTTP ステータスコードとの対応規則を整理する

### ステップ 3: AC の検証可能化

- AC-1（型定義配置）: ファイル存在 + 型エクスポート確認で判定可能とする
- AC-2（ミドルウェア実装）: ユニットテスト通過で判定可能とする
- AC-3（漏洩なし）: 異常系テスト（stack trace / SQL / 外部 API 本文を含む例外を投げ、レスポンス body にこれらが含まれないことを確認）で判定可能とする
- AC-4（withRetry）: 関数定義 + Sheets クライアントから呼び出される配線確認で判定可能とする
- AC-5（補償処理サンプル）: ファイル配置 + ユニットテスト通過で判定可能とする
- AC-6（設計ドキュメント）: ファイル存在 + 必須セクション網羅で判定可能とする
- AC-7（クライアント整合）: 契約テスト（zod スキーマまたは型レベルテスト）で判定可能とする

### ステップ 4: 4 条件評価

- 価値性: 共通標準が UT-09 / UT-07 / UT-08 の実装コストを削減するか
- 実現性: Workers 制約（`setTimeout` 不可・ネスト TX 不可）下で全 AC が達成可能か
- 整合性: RFC 7807 と既存 API スキーマ（01-api-schema.md）の両方と矛盾しないか
- 運用性: 機密情報非開示が運用上強制可能か（ミドルウェアでの自動サニタイズ）

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | エラーコード体系枠組みと AC を設計入力にする |
| Phase 5 | 「漏洩なし」判定基準を実装テストの根拠にする |
| Phase 6 | 異常系テストパターン候補を引き継ぐ |
| Phase 10 | 4 条件評価結果を最終レビューの基準にする |

## 多角的チェック観点（AIが判断）

- 価値性: 共通標準化が下流タスク（UT-09 / UT-07 / UT-08）の実装判断コストを下げるか
- 実現性: Cloudflare Workers の制約下（`setTimeout` 不可・request lifetime 制限・ネスト TX 不可）で全 AC が現実的に達成できるか
- 整合性: RFC 7807 / 既存 API schema / 認証仕様（02-auth.md）と矛盾しないか
- 運用性: 機密情報の非開示が「ミドルウェアで自動」かつ「コードレビューで強制」できるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | スコープ確認・前提整理 | 1 | spec_created | index.md と Issue #12 の照合 |
| 2 | エラーコード体系枠組み決定 | 1 | spec_created | 4 大区分・命名規則 |
| 3 | AC 検証可能化 | 1 | spec_created | AC-1〜AC-7 すべて |
| 4 | 4 条件評価 | 1 | spec_created | 全件 PASS を目標 |
| 5 | 漏洩なし判定基準確定 | 1 | spec_created | ホワイトリスト方式採用方針 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| ドキュメント | outputs/phase-01/error-code-taxonomy-draft.md | エラーコード体系ドラフト |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 5 領域（API レスポンス / リトライ / ロールバック / ログ / メッセージ）の要件が確定している
- [ ] AC-1〜AC-7 が検証可能な形で定義されている
- [ ] エラーコード体系の枠組み（4 大区分・命名規則）が確定している
- [ ] 4 条件評価が全 PASS で確定している
- [ ] 内部エラー漏洩判定基準が確定している

## タスク100%実行確認【必須】

- 全実行タスクが spec_created
- 全成果物が指定パスに配置済み
- 異常系（外部 API レスポンス本文を含む例外・ネスト TX 失敗）の扱い方針も含まれている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を spec_created に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: エラーコード体系枠組み・AC 検証可能版・4 条件評価結果・漏洩判定基準を Phase 2 に渡す
- ブロック条件: エラーコード体系枠組みが未確定なら次 Phase に進まない
