# Phase 11: 手動 smoke test（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | エラーハンドリング標準化 (UT-10) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test（NON_VISUAL） |
| 作成日 | 2026-04-27 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 依存 Phase | Phase 1, Phase 2, Phase 5, Phase 6, Phase 7, Phase 8, Phase 9, Phase 10 |
| 状態 | spec_created |
| タスク種別 | NON_VISUAL（UI 変更なし／バックエンド・SDK 標準化） |

## 目的

UT-10 はバックエンド共通基盤と SDK 標準化のみを対象とし、ユーザー操作可能な UI 画面を生み出さない **NON_VISUAL** タスクである。
そのため、本 Phase では「実地操作不可」を明示したうえで、自動 smoke test の実行結果と既知制限リストを **代替の手動証跡** として記録する。
Phase 5 で実装された `ApiError` / `errorHandler` ミドルウェア / `withRetry` / D1 補償処理 / 構造化ログが、結合状態でも仕様どおり動くことを最終確認する。

## NON_VISUAL 明示【必須】

[UBM-002 / UBM-003 / Feedback BEFORE-QUIT-001] に従い、以下を本フェーズの絶対前提として宣言する。

- 本タスクは **NON_VISUAL** である（UI 表示・画面遷移・ユーザー操作の追加なし）
- 画面のないバックエンド・SDK 標準化のため **実地操作（manual smoke）は不可**
- 代替記録として **(a) 自動 smoke test の実行ログ + (b) 既知制限リスト** の 2 種を `outputs/phase-11/` に必ず残す
- スクリーンショットは作成しない（screenshot-plan.json で `mode: "NON_VISUAL"` を明示）
- ブラウザ操作・目視確認の代わりに、CI で再実行可能な **コマンドベースの smoke test** を主証跡とする

## 実行タスク

- 自動 smoke test スクリプトの一覧化（`apps/api` 起動・500 発火・Sheets 5xx 模擬・D1 batch 部分失敗）
- 自動 smoke test の実行結果を `manual-smoke-log.md` に時系列で記録
- 既知制限（Workers 制約由来）の網羅リストを作成
- `link-checklist.md` に各成果物・runbook・テストファイルへのリンク健全性を記録
- screenshot-plan.json を `mode: "NON_VISUAL"` で生成
- Phase 12 へ引き継ぐ証跡パスをまとめる

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-05/ | 実装成果物（errors / retry / transaction / logging / middleware） |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-02/api-error-schema.md | smoke 対象のレスポンス形式 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-06/security-leak-tests.md | 機密情報非開示の検証観点 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-07/coverage-report.md | 自動検証の網羅性根拠 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-08/refactor-summary.md | smoke 前の構造整理結果 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-09/test-result-summary.md | 自動テスト結果の参照 |
| 必須 | docs/30-workflows/ut-10-error-handling-standardization/outputs/phase-10/go-nogo.md | GO 判定確認 |
| 必須 | apps/api/docs/error-handling.md | 開発者向け運用ガイド |
| 参考 | .claude/skills/aiworkflow-requirements/references/ | NON_VISUAL タスク証跡ルール |

## 自動 smoke test 対象【必須】

| # | 対象 | 実行コマンド（例） | 期待挙動 | 主ソース |
| --- | --- | --- | --- | --- |
| S-1 | `apps/api` 起動 → 意図的 500 発火 | `pnpm --filter api dev` 起動後 `curl -i http://localhost:8787/__debug/throw` | `application/problem+json` で `ApiError` 形式（`type` / `title` / `status:500` / `code:UBM-5xxx` / `instance`）が返る。stack trace / SQL / 外部 API レスポンス本文がレスポンスに含まれない | `apps/api/src/middleware/error-handler.test.ts` |
| S-2 | Sheets API 5xx 模擬 → `withRetry` リトライ後失敗 | `pnpm --filter shared test -- retry` | 既定の最大リトライ回数到達後に最終失敗を投げる。各試行と最終結果が構造化ログ（JSON）に `event=retry.attempt` / `event=retry.exhausted` として出力される | `packages/shared/src/retry.test.ts` |
| S-3 | D1 batch 部分失敗 → 補償処理（compensating transaction） | `pnpm --filter shared test -- transaction` | 事前状態スナップショットを利用した逆操作が実行され、不整合が残らない。`event=db.compensation.applied` ログが出力される | `packages/shared/src/db/transaction.test.ts` |
| S-4 | 構造化ログフォーマット | `pnpm --filter shared test -- logging` | 全イベントが必須フィールド（`timestamp` / `level` / `event` / `requestId` / `code`）を持つ。機密フィールドはマスク済み | `packages/shared/src/logging.test.ts` |
| S-5 | `apps/web` ApiError 型同期 | `pnpm --filter web typecheck` | `apps/web/app/lib/api-client.ts` が `@ubm-hyogo/shared` の `ApiError` を再エクスポートし、契約テストが通過する | `apps/web/src/lib/api-client.test.ts` |

## 必須 outputs【NON_VISUAL の 3 点】

| パス | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言・代替証跡方針・S-1〜S-5 の総合判定（PASS / FAIL）・Phase 12 への引き継ぎ事項 |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-5 を時系列で実行した記録（コマンド / 実行時刻 / 終了コード / 出力サマリー / 判定） |
| `outputs/phase-11/link-checklist.md` | 関連ファイル（実装・テスト・ドキュメント）の存在確認とリンク健全性チェック結果 |

## 証跡メタ【[Feedback 4] 準拠】

| 項目 | 値 |
| --- | --- |
| 主ソース種別 | 自動テスト（Vitest）+ ローカル `curl` smoke |
| 主ソースの本数 | S-1〜S-5（5 ケース） |
| 主ソース所在 | `outputs/phase-11/manual-smoke-log.md` に実行ログを集約 |
| スクリーンショット作成 | **作成しない** |
| 非作成の理由 | 本タスクは **NON_VISUAL**（UI なし）であり、ブラウザ画面の差分が存在しないため |
| 補助ソース | Phase 9 `test-result-summary.md` / Phase 10 `go-nogo.md` |
| 再現手段 | `manual-smoke-log.md` 記載のコマンドを実行することで CI / ローカル双方で再現可能 |

## 既知制限リスト【必須】

NON_VISUAL タスクとして、自動 smoke test では検証しきれない / 構造的に検証不可能な事項を以下にまとめ、Phase 12 の `unassigned-task-detection` および後続タスクへ委譲する。

| # | 既知制限 | 由来 | 委譲先 |
| --- | --- | --- | --- |
| L-1 | Workers in-request での `setTimeout` 長時間ウェイトが許容されない | Cloudflare Workers ランタイム制約 | UT-09（Cron / Queues 経由の遅延リトライで補完） |
| L-2 | in-request リトライは最大 1 回までに限定（短時間 bounded retry のみ） | L-1 から派生する設計上の制約 | UT-09（次回実行で再処理を主戦略） |
| L-3 | D1 ネスト TX 非サポートのため、補償処理は明示的逆操作パターンに依存 | Cloudflare D1 制約 | UT-04 / UT-09（実装時に compensating transaction template を使用） |
| L-4 | `db.batch()` の部分失敗に対する自動ロールバックがない | Cloudflare D1 制約 | 同上 |
| L-5 | クライアント向けの UI トースト / エラーモーダルの目視確認は本タスクでは行わない | NON_VISUAL タスクのため | UI 実装側タスク（apps/web のエラー表示実装が起票された時点） |
| L-6 | 通知基盤（Slack / メール）への dead letter 連携の E2E 確認 | スコープ外 | UT-07（通知基盤） |
| L-7 | アラート / メトリクスへの構造化ログ取り込み確認 | スコープ外 | UT-08（モニタリング） |
| L-8 | ローカル `wrangler dev` と本番 Workers の挙動差（特に `console.error` の出力先） | 環境差異 | 02-serial Phase 5 にて運用確認 |

## screenshot-plan.json【必須】

`outputs/phase-11/screenshot-plan.json` を以下構造で生成する（NON_VISUAL モード）。

```json
{
  "mode": "NON_VISUAL",
  "task": "ut-10-error-handling-standardization",
  "phase": 11,
  "screenshots": [],
  "reason": "Backend/SDK standardization task with no UI surface. Visual diff inapplicable.",
  "alternative_evidence": [
    "outputs/phase-11/main.md",
    "outputs/phase-11/manual-smoke-log.md",
    "outputs/phase-11/link-checklist.md"
  ]
}
```

## 多角的チェック観点（AIが判断）

- 価値性: 自動 smoke test 結果が AC-1〜AC-7 と紐付き、Phase 12 close-out に値する根拠になっているか。
- 実現性: NON_VISUAL の代替証跡（自動ログ + 既知制限）が CI で再実行可能か。
- 整合性: S-1〜S-5 の対象が Phase 5 の実装範囲（errors / retry / transaction / logging / error-handler / api-client）と一致しているか。
- 運用性: 既知制限が Phase 12 の unassigned-task-detection に正しく流れ、UT-07 / UT-08 / UT-09 へ漏れなく委譲されているか。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 単体・契約テストの結果を主証跡として再利用 |
| Phase 10 | GO 判定の前提として S-1〜S-5 全 PASS を要求 |
| Phase 12 | 既知制限リスト L-1〜L-8 を unassigned-task-detection / system-spec-update-summary に展開 |
| Phase 13 | merge-checklist の "smoke test green" 項目に S-1〜S-5 結果を引用 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | NON_VISUAL 宣言と方針記録（main.md） | 11 | spec_created | 代替証跡方針を明記 |
| 2 | S-1〜S-5 の自動 smoke 実行と manual-smoke-log.md 作成 | 11 | spec_created | コマンド・終了コード・出力サマリーを記録 |
| 3 | link-checklist.md 作成 | 11 | spec_created | 実装ファイル・テスト・ドキュメントへのリンク健全性 |
| 4 | 既知制限リスト L-1〜L-8 の整理 | 11 | spec_created | Phase 12 unassigned-task-detection の入力 |
| 5 | screenshot-plan.json 生成（mode=NON_VISUAL） | 11 | spec_created | スクリーンショット非作成理由を記載 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | NON_VISUAL 宣言・総合判定 |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | 自動 smoke 実行ログ（主証跡） |
| ドキュメント | outputs/phase-11/link-checklist.md | リンク健全性チェック |
| メタ | outputs/phase-11/screenshot-plan.json | NON_VISUAL モード明示 |
| メタ | artifacts.json | Phase 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` に NON_VISUAL 宣言と S-1〜S-5 総合判定が記載されている
- [ ] `outputs/phase-11/manual-smoke-log.md` に S-1〜S-5 の実行ログが時系列で記録されている
- [ ] `outputs/phase-11/link-checklist.md` の全リンクが解決している
- [ ] `outputs/phase-11/screenshot-plan.json` が `mode: "NON_VISUAL"` で生成されている
- [ ] 既知制限リスト L-1〜L-8 が Phase 12 へ引き継がれる形で記録されている
- [ ] 主ソース（自動テスト件数）と非作成理由が証跡メタに明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - `outputs/phase-11/manual-smoke-log.md` の S-1〜S-5 結果サマリー
  - 既知制限リスト L-1〜L-8（Phase 12 の unassigned-task-detection / system-spec-update-summary に展開）
  - NON_VISUAL 証跡方針（screenshot-plan.json `mode: "NON_VISUAL"`）
- ブロック条件: S-1〜S-5 のいずれかが FAIL のまま、または既知制限リストが未確定の場合は Phase 12 に進まない。
