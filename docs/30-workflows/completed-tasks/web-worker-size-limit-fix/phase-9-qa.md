# Phase 9: QA（品質ゲート）

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| phase | 9（QA） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | `implemented_local_evidence_captured`（本サイクルはローカル実装済み。コマンド実測は実装後） |
| 作成日 | 2026-05-29 |
| 依存 | phase-8（リファクタ） |

## 目的

Task A / Task B 本実装で、品質ゲート（typecheck / lint / test / build:cloudflare）が **全 green** であること、`next/og` が grep / wasm find で **完全除去** されていること、Worker gzip サイズが無料プラン制限（3072 KiB）を下回ることを QA ゲートとして固定する。secret を含まないため redaction は不要。

## 実行タスク

| # | QA 項目 | コマンド | 期待結果 |
| --- | --- | --- | --- |
| 9-1 | 型チェック | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | exit 0（型エラーなし） |
| 9-2 | Lint | `mise exec -- pnpm lint` | exit 0（違反なし） |
| 9-3 | テスト | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 全 spec PASS（public-metadata / opennext-config-regression 含む） |
| 9-4 | Cloudflare ビルド | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` | exit 0（`next build --webpack` ベースの OpenNext bundle 生成成功） |
| 9-5 | `next/og` grep | `rg -n "next/og\|ImageResponse" apps/web/app apps/web/src` | **0 件** |
| 9-6 | wasm find | `find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm'` | **0 件**（wasm 焼き込みなし） |
| 9-7 | Worker size 計測 | `bash scripts/check-worker-size.sh` | exit 0（gzip < 3072 KiB、warn 閾値 2800 超過時 warn 表示・3072 超過時 exit 1） |
| 9-8 | deploy dry-run | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` | size 超過エラーなし（`[code: 10027]` 不発） |
| 9-9 | coverage | `bash scripts/coverage-guard.sh` | exit 0（apps/web 4 軸 >= 80%） |

## 参照資料

- `phase-4-test-plan.md` / `phase-6-test-additions.md`（追加 spec）
- `phase-7-coverage.md`（coverage AC）
- `scripts/check-worker-size.sh`（Task B 新規 size gate）
- `docs/00-getting-started-manual/specs/08-free-database.md`（3 MiB 無料制限）
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md`（Worker bundle size ガード）

## 実行手順

1. 9-1〜9-4 の品質ゲートを順に実行し、全 exit 0 / 全 PASS を確認する。失敗時は phase-5 / phase-8 の差分を見直し修正する。
2. 9-5 grep で `next/og` / `ImageResponse` が 0 件であることを確認（撤去完了の静的検証）。
3. 9-4 ビルド成果物 `.open-next` に対し 9-6 wasm find を実行し `resvg.wasm` / `yoga.wasm` が 0 件であることを確認（bundle への焼き込み消失）。
4. 9-7 `check-worker-size.sh` で gzip サイズが 3072 KiB を下回ることを確認（試算 ~2.5 MiB）。warn 閾値 2800 KiB 超過時は warn のみ・3072 超過時 exit 1。
5. 9-8 dry-run で staging へのアップロードサイズ検証が通り、`[code: 10027]` が再発しないことを確認する（実 deploy は user-gated のため dry-run まで）。
6. 9-9 coverage-guard で apps/web の 4 軸カバレッジが 80% 以上を満たすことを確認する。
7. すべてのコマンド出力は secret を含まないためそのまま `outputs/phase-11/manual-smoke-log.md` に記録する（redaction 不要）。

## 統合テスト連携

- 9-3 test には Task A の `apps/web/playwright/tests/public-metadata.spec.ts`（OG meta tag が静的 path）と Task B の `apps/web/__tests__/opennext-config-regression.spec.ts`（production minify（`OPEN_NEXT_DEBUG` を有効化しない） assert）を含める。
- 9-7 / 9-8 は実バンドル（9-4 build 成果物）に対する統合検証であり、CI の `web-cd.yml` deploy 前段 size gate と同一スクリプトを使用する。
- 統合テストの最終 PASS 記録は phase-11（手動テスト）の `outputs/phase-11/` に集約する。

## 多角的チェック観点（AIが判断）

- **完全性**: grep 0 件 + wasm find 0 件の双方で撤去を二重検証しているか。
- **再発防止**: size gate（9-7）と CI 前段 gate が同一閾値（3072 KiB）で連動しているか。
- **無料構成維持**: Paid プラン前提の設定変更を含んでいないか。
- **セキュリティ**: secret を含まずログ転記時の redaction が不要であることを確認したか。
- **不変条件**: build は `next build --webpack` 経由か／Cloudflare CLI は `scripts/cf.sh` 経由か／env は `apps/web/src/lib/env.ts` 経由か。

## サブタスク管理

| サブタスク | コマンド | 状態 |
| --- | --- | --- |
| 9-1 typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | `implemented_local_evidence_captured` |
| 9-2 lint | `pnpm lint` | `implemented_local_evidence_captured` |
| 9-3 test | `pnpm --filter @ubm-hyogo/web test` | `implemented_local_evidence_captured` |
| 9-4 build:cloudflare | `pnpm --filter @ubm-hyogo/web build:cloudflare` | `implemented_local_evidence_captured` |
| 9-5 grep next/og | `rg -n "next/og\|ImageResponse" ...` | `implemented_local_evidence_captured` |
| 9-6 wasm find | `find apps/web/.open-next ...` | `implemented_local_evidence_captured` |
| 9-7 size 計測 | `bash scripts/check-worker-size.sh` | `implemented_local_evidence_captured` |
| 9-8 dry-run | `bash scripts/cf.sh deploy ... --dry-run` | `implemented_local_evidence_captured` |
| 9-9 coverage | `bash scripts/coverage-guard.sh` | `implemented_local_evidence_captured` |

## 成果物

- 本ファイル `phase-9-qa.md`（QA ゲート定義の正本）
- 実装後の実測ログは `outputs/phase-11/manual-smoke-log.md` に追記

## 完了条件

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` が exit 0
- [ ] `mise exec -- pnpm lint` が exit 0
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test` が全 PASS
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0
- [ ] `rg -n "next/og|ImageResponse" apps/web/app apps/web/src` が 0 件
- [ ] `find apps/web/.open-next -name 'resvg.wasm' -o -name 'yoga.wasm'` が 0 件
- [ ] `bash scripts/check-worker-size.sh` が exit 0（gzip < 3072 KiB）
- [ ] `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging --dry-run` が size 超過なし
- [ ] coverage AC: apps/web 4 軸（statements / branches / functions / lines）>= 80%、`bash scripts/coverage-guard.sh` exit 0

## タスク100%実行確認【必須】

- [ ] 品質ゲート 4 種（typecheck/lint/test/build:cloudflare）を全 green 条件として明記した
- [ ] grep 0 件 + wasm find 0 件の二重検証を記載した
- [ ] size 計測（3072 KiB 閾値）と dry-run の連動を記載した
- [ ] coverage AC（apps/web 4 軸 >= 80% / coverage-guard exit 0）を完了条件に含めた
- [ ] redaction 不要（secret 非含有）であることを明記した
- [ ] 統合テスト連携・成果物・次Phase を記載した

## 次Phase

phase-10（最終レビュー）: Phase3 MINOR の解決確認と Phase13 blocked 条件の再掲、実装完了の最終 go/no-go 判定へ進む。
