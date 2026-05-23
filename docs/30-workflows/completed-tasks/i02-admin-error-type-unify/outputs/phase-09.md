**[実装区分: 実装仕様書]**

# Phase 9: 品質ゲート

## メタ情報

- task: `i02-admin-error-type-unify`
- 対象パッケージ: `@ubm-hyogo/web`（主）、monorepo 全体（typecheck / lint）
- 前提: Phase 8 で int test 追加済み、unit test の assertion 更新済み

## 目的

i02 の差分が以下の品質ゲートをすべて通過することを確認し、
PR 作成前に local 環境で fail 要因を排除する。

1. monorepo 全体の typecheck PASS
2. monorepo 全体の lint PASS
3. `@ubm-hyogo/web` の coverage 4 軸（Statements / Branches / Functions / Lines）すべて **>= 80%**
4. `bash scripts/coverage-guard.sh` が exit code 0 で完了

## 実行タスク

| ID | タスク | コマンド |
| --- | --- | --- |
| T-9-1 | 依存整合 | `mise exec -- pnpm install` |
| T-9-2 | 型検査 | `mise exec -- pnpm typecheck` |
| T-9-3 | lint | `mise exec -- pnpm lint` |
| T-9-4 | unit + int test 実行 | `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run` |
| T-9-5 | coverage 計測 | `mise exec -- pnpm -F "@ubm-hyogo/web" test:coverage` |
| T-9-6 | coverage 4 軸 ≥ 80% 確認 | `coverage/coverage-summary.json` を grep |
| T-9-7 | coverage-guard 実行 | `bash scripts/coverage-guard.sh` |

## 参照資料

| パス | 用途 |
| --- | --- |
| `scripts/coverage-guard.sh` | coverage gate 本体 |
| `apps/web/vitest.config.ts` | coverage 閾値設定 |
| `apps/web/coverage/coverage-summary.json` | 計測結果（生成物） |
| `CLAUDE.md` — sync-merge セクション | coverage-guard の挙動方針 |

## 実行手順

1. クリーン状態確認:
   ```bash
   git status --porcelain
   ```
2. 依存更新と型検査:
   ```bash
   mise exec -- pnpm install
   mise exec -- pnpm typecheck
   mise exec -- pnpm lint
   ```
3. テスト + coverage:
   ```bash
   mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run
   mise exec -- pnpm -F "@ubm-hyogo/web" test:coverage
   ```
4. coverage 閾値手動確認:
   ```bash
   node -e "const s=require('./apps/web/coverage/coverage-summary.json').total; \
   for (const k of ['statements','branches','functions','lines']) { \
     const p=s[k].pct; console.log(k, p); if (p<80) process.exit(1); }"
   ```
5. coverage-guard 実行:
   ```bash
   bash scripts/coverage-guard.sh
   echo "exit=$?"
   ```
6. 失敗時の対応
   - typecheck fail → import 整合 / `instanceof` の型 narrowing 確認（特に `AuthRequiredError` / `FetchAuthedError`）
   - lint fail → まず `mise exec -- pnpm lint --fix`、残り手修正
   - coverage fail → `useAdminMutation.ts` の error 分岐（401 / 403 / 5xx / network）を test で網羅、未カバー行を `coverage-final.json` で特定して追加

## 統合テスト連携

- Phase 8 で追加した int test は本 Phase の coverage 計測に必ず含める（`--run` で全件実行）。
- p-10 未実装で `it.todo` 状態の場合、当該行は coverage 対象から外れるため、unit test 側で 401/403/5xx の throw path を fully cover することで 80% 維持。

## 多角的チェック観点（AIが判断）

- `AdminMutationHttpError` の class 定義削除によって unused export 由来の lint 警告が出ていないか
- `instanceof FetchAuthedError` の type narrow 後の `.status` アクセスで TS error が出ないか
- `AuthRequiredError` は `status` プロパティを持たないため、誤って `.status` 参照していないか（typecheck で検出）
- coverage 4 軸のうち branches が最も落ちやすい（401 / 403 / 5xx 3 分岐）→ 3 ケース必須
- `coverage-guard.sh` は sync-merge 時に skip 仕様。i02 は通常 feature push のため必ず gate を通る

## サブタスク管理

- T-9-1 → T-9-2 → T-9-3 を直列で実行（fail 時は次に進まない）
- T-9-4 / T-9-5 はテスト系として 1 まとめ
- T-9-6 / T-9-7 を最後に直列で実行
- いずれかが fail した場合は修正コミット後に Phase 9 を**先頭から再実行**

## 成果物

- `apps/web/coverage/coverage-summary.json`（生成物・コミット対象外）
- 修正コミット（必要に応じて）

## 完了条件

- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run` 全件 PASS
- [ ] coverage Statements >= 80%
- [ ] coverage Branches >= 80%
- [ ] coverage Functions >= 80%
- [ ] coverage Lines >= 80%
- [ ] `bash scripts/coverage-guard.sh` exit code 0
- [ ] `git status --porcelain` がクリーン（または品質修復コミット済み）

## タスク100%実行確認【必須】

- [ ] T-9-1〜T-9-7 すべて完了し、各コマンドの exit code を記録
- [ ] coverage 4 軸の実測 pct を最終レポートに明記
- [ ] coverage-guard の exit code を最終レポートに明記
- [ ] 失敗 → 修復 → 再実行のループが 3 回以内に収束（超過時は Phase を巻き戻す）

## 次Phase

Phase 10: regression smoke（既存 admin 機能の 401/403/5xx ハンドリング動作確認）。
