[実装区分: 実装仕様書]

# Phase 9: ローカル検証実行

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 9 / 13 |
| 名称 | ローカル検証実行（typecheck / lint / verify:tokens / vitest self-test / e2e:smoke / e2e:visual） |
| 依存 (前) | Phase 1〜8（コード成果物・CI workflow が確定） |
| 依存 (後) | Phase 10（required status checks 追加） |
| 想定工数 | 0.1 人日 |
| ブランチ | `feat/ui-mvp-task-18-regression-gate` |

## 2. ゴール / 非ゴール

### ゴール
1. ローカルで全 6 コマンドを順次実行し、すべて exit 0 で完了する
2. verify-design-tokens self-test (C1〜C7) が全 PASS
3. 19 routes smoke の skip 件数が 0
4. visual baseline 4 png が `__screenshots__/` に作成・commit される
5. failure 時の retries 戦略・troubleshooting を確立

### 非ゴール
- CI 上の actual run（Phase 10〜11 で扱う）
- baseline 画像の意図的更新運用（付録 A 例外運用へ委譲）

## 3. 変更対象ファイル

| パス | 種別 | 説明 |
|------|------|------|
| `apps/web/tests/e2e/visual/__screenshots__/login.spec.ts/login.png` | new (gen) | 初回 e2e:visual:update で生成 |
| `apps/web/tests/e2e/visual/__screenshots__/public-top.spec.ts/public-top.png` | new (gen) | 同上 |
| `apps/web/tests/e2e/visual/__screenshots__/admin-dashboard.spec.ts/admin-dashboard.png` | new (gen) | 同上 |
| `apps/web/tests/e2e/visual/__screenshots__/profile.spec.ts/profile.png` | new (gen) | 同上 |
| ローカル log（commit しない） | tmp | `outputs/phase-11/evidence/` 用に手元で保管 |

## 4. 手順 / コマンド

### 4.1 事前準備

```bash
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
```

### 4.2 順次実行（6 ステップ）

| # | コマンド | 期待 | log 出力先 (Phase 11 へ渡す) |
|---|---------|------|--------------------------|
| 1 | `mise exec -- pnpm typecheck` | exit 0 | `evidence/typecheck.log` |
| 2 | `mise exec -- pnpm lint` | exit 0 | `evidence/lint.log` |
| 3 | `mise exec -- pnpm verify:tokens` | stdout に `✓ design tokens in sync (N tracked)` / exit 0 | `evidence/verify-tokens.log` |
| 4 | `mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts` | 7 ケース全 PASS / exit 0 | `evidence/test.log` |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke` | 19 routes 全 PASS / exit 0 | `evidence/e2e-smoke.log` |
| 6 | `mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual` | 4 画面 baseline 一致 / exit 0 | `evidence/e2e-visual.log` |

初回は baseline 未確立のため、ステップ 6 の前に **1 度だけ** `mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:update` を実行し、生成された 4 png を `git add` する。

### 4.3 log 取得テンプレート

```bash
mkdir -p /tmp/task-18-evidence
mise exec -- pnpm typecheck                                               2>&1 | tee /tmp/task-18-evidence/typecheck.log
mise exec -- pnpm lint                                                    2>&1 | tee /tmp/task-18-evidence/lint.log
mise exec -- pnpm verify:tokens                                           2>&1 | tee /tmp/task-18-evidence/verify-tokens.log
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts         2>&1 | tee /tmp/task-18-evidence/test.log
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke                       2>&1 | tee /tmp/task-18-evidence/e2e-smoke.log
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual                      2>&1 | tee /tmp/task-18-evidence/e2e-visual.log
```

## 5. テスト・検証方針

### 5.1 self-test ケース実施手順（元仕様 §6）

verify-design-tokens 自身の self-test は Phase 9 のステップ 4 に含まれる。元仕様 §6.1 の表 C1〜C7 を Vitest で実行することで、本 task の「gate 自身が機能していること」を担保する。

Smoke の self-test S2〜S4（壊して通るか）は **PR レビュー前に手動で 1 回だけ実施**:

| ケース | 手順 | 期待 |
|--------|------|------|
| S2 | `/admin/audit` の page で一時的に `throw new Error('test')` を追加 → smoke 実行 | 1 件 fail / exit 1 |
| S3 | `/login` の `<label>` を一時削除 → smoke 実行 | a11y serious violation で fail |
| S4 | `/profile` の `<main>` を一時削除 → smoke 実行 | landmark waitFor timeout |

実施後は **必ず変更を revert** してから commit。

### 5.2 retries 戦略

| 失敗種別 | 対応 |
|---------|------|
| Playwright network flaky | `retries: process.env.CI ? 2 : 0` 既設定で自動再試行（ローカルは retry なし＝即失敗で原因特定） |
| visual sub-pixel diff | `maxDiffPixelRatio: 0.02` 内なら PASS。超過は **baseline 更新の意図確認** を最初に行う |
| auth fixture cookie 不一致 | `process.env.PLAYWRIGHT_BASE_URL` のホスト名と cookie domain が一致するかを確認 |
| dev サーバ未起動 | `webServer` 設定が自動起動するが、別 process でポート 3000 を占有していないか確認 |

## 6. ローカル実行コマンド

```bash
# まとめて実行（途中失敗で中断）
set -e
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
```

## 7. DoD チェックリスト

- [ ] 6 コマンドすべて exit 0
- [ ] verify-design-tokens self-test 7 ケース全 PASS
- [ ] 19 routes smoke で skip 0 件・fail 0 件
- [ ] 4 png baseline が `apps/web/tests/e2e/visual/__screenshots__/**` に commit 済み
- [ ] S2〜S4 の手動 self-test を 1 回ずつ実施し、各々 fail を確認したうえで revert 済み
- [ ] log 6 本（typecheck / lint / verify-tokens / test / e2e-smoke / e2e-visual）を Phase 11 へ引き渡せる状態に保管
