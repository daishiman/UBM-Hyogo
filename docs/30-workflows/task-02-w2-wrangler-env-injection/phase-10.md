# Phase 10: 最終レビュー

実装区分: 実装仕様書（CONST_004 デフォルト適用 — `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 整理 / `apps/web/.dev.vars.example` 新規 / `apps/web/src/lib/env.ts` 新規 / `apps/web/src/lib/__tests__/env.test.ts` 新規 / `apps/web/next.config.ts` 最小修正を伴う）

## 10.1 目的

Phase 1〜9 の確定事項と evidence を集約し、本タスク（task-02 wrangler-env-injection）の GO/NO-GO を判定する。GO 判定後は Phase 11（実装サイクル）への移行 gate を解放する。

## 10.2 GO/NO-GO 判定基準

以下のすべてが PASS で初めて GO。1 件でも fail があれば NO-GO（自動修復ループまたは上流フェーズ差し戻し）。

| 判定項目 | 由来 | 必須 |
|---------|------|-----|
| AC-1〜AC-11 全行 PASS | Phase 7 AC マトリクス | 必須 |
| Phase 6 異常系 F-01〜F-12 のうち test 化対象（F-01〜F-07, F-12）が env.test.ts で PASS | Phase 6 | 必須 |
| Phase 8 DRY 集約原則の grep ゲート（process.env.NEXT_PUBLIC_API_BASE_URL 直参照 = lib/env.ts のみ）が PASS | Phase 8, Phase 9 §9.2.8 | 必須 |
| `outputs/phase-09/` に 11 件 +α の evidence ファイルが揃っている | Phase 9 §9.6 | 必須 |
| 元タスク §11 DoD 9 行全件 check 済み | 元タスク | 必須 |
| 元タスク §12 リスク表のリスクが全て緩和済みまたは残課題として明示されている | 元タスク | 必須 |

## 10.3 Phase 1〜9 checklist 集約

### Phase 1（要件定義）

- [ ] Q1〜Q? 真の論点が確定（env access の単一エントリポイント / NEXT_PUBLIC_* 公開範囲 / Cloudflare Secrets 境界）
- [ ] 不変条件 #1〜#5 と本タスクの関係が宣言されている

### Phase 2（設計）

- [ ] `EnvSchema` の zod 定義が確定
- [ ] `getEnv()` / `getPublicEnv()` / `readRawEnv()` の関数シグネチャが固定
- [ ] wrangler.toml 差分（§5）の TOML 構造が valid

### Phase 3（実装計画）

- [ ] §3 変更対象ファイル表の 5 ファイルが確定
- [ ] §4 環境別キー一覧の 9 キーが確定

### Phase 4（テスト計画）

- [ ] env.test.ts のケース 4 件（§9.1）+ 異常系 8 件（Phase 6）の合計 12 件が確定

### Phase 5（実装）

- [ ] `apps/web/wrangler.toml` の `[vars]` / `[env.staging.vars]` / `[env.production.vars]` 編集完了
- [ ] `apps/web/.dev.vars.example` 作成完了（実値なし）
- [ ] `apps/web/src/lib/env.ts` 作成完了
- [ ] `apps/web/src/lib/__tests__/env.test.ts` 作成完了
- [ ] `apps/web/next.config.ts` 最小修正完了（必要時のみ）

### Phase 6（異常系検証）

- [ ] F-01〜F-12 の各ケースが Phase 7 AC マトリクスに紐付けられている
- [ ] env.test.ts に F-01〜F-07, F-12 の test 実装が含まれる

### Phase 7（AC マトリクス）

- [ ] AC-1〜AC-11 の N:M トレース表が完成
- [ ] 各 AC の evidence 出力先が `outputs/phase-09/` 配下に固定

### Phase 8（DRY 化）

- [ ] env access が `lib/env.ts` に集約
- [ ] Sentry / Auth / API base / 環境識別の 4 系統境界が `EnvSchema` 内で可視化
- [ ] task-03 が参照する SENTRY_* 3 キーが本 task の `EnvSchema` に存在

### Phase 9（品質保証）

- [ ] 9.2.1〜9.2.11 の全コマンドが終了コード 0（grep ゲートは「hit なし」を 0）で完了
- [ ] regression-check が compile fail / module not found / TypeError 0 件
- [ ] evidence ファイル群が揃っている

## 10.4 リスク残課題

| # | リスク | 状態 | 対応 |
|---|--------|------|------|
| R-1 | task-03 sentry-workers-sdk-unify との merge order | 緩和済み | 本 task が `EnvSchema` に SENTRY_* を先行定義。task-03 は `getEnv()` 経由でのみ参照するため merge order 非依存。両 task が同時に wrangler.toml を触るが、本 task が `[vars]` 集約担当、task-03 は instrumentation のみで競合回避（§0.2） |
| R-2 | `NEXT_PUBLIC_*` の build 時固定でローカル切替が効かない | 緩和済み | `.dev.vars` + `wrangler dev` 経路で local 切替可能（元タスク §12） |
| R-3 | `getCloudflareContext` が edge / node ランタイムで未定義 | 緩和済み | `try/catch` + `process.env` フォールバック（Phase 6 F-02） |
| R-4 | Cloudflare Secrets 投入忘れ（SENTRY_DSN_WEB / AUTH_SECRET の本番欠落） | 残課題 | 本 task の DoD では wrangler.toml 直書きを禁止するのみ。実値投入の確認は task-03 deploy 前 `wrangler secret list`（cf.sh 経由）で行う |
| R-5 | wrangler.toml typo（F-08）が staging dry-run で検出されない | 残課題 | build 段階（§9.2.5）で検出する。CI で `pnpm --filter @ubm-hyogo/web build` を必須 gate 化することで補償 |

## 10.5 Phase 11 移行 gate 条件

以下が全て満たされた時点で Phase 11（実装サイクル / curl evidence 取得）へ移行する。

1. 本 Phase の §10.2 GO 判定が PASS
2. `outputs/phase-09/` の evidence が揃っている
3. R-4, R-5 の残課題が下流 task（task-03 / task-18）の DoD に明示移送されている
4. 元タスク §11 DoD 9 行全件 check 済み

## 10.6 最終報告フォーマット

Phase 11 開始時の報告では以下を 1 回だけ出力する。

- 判定: GO / NO-GO
- 採用ブランチ: `feat/task-02-w2-wrangler-env-injection`（想定）
- 実行した自動修復: §9.5 ループの実行回数と内容
- 解消したコンフリクト: なし（02-runtime wave 最上流のため）
- 残課題: R-4, R-5（下流 task に移送）

## 10.7 完了基準

本 Phase 完了 = task-02 wrangler-env-injection の仕様書フェーズ完了。実装着手 / curl evidence / PR 作成は Phase 11 以降の責務。
