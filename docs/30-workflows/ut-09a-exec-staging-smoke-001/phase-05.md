# Phase 5: 実装ランブック — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 5 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実 staging 環境での smoke / sync validation 実行手順を、再現可能な runbook として
固定する。本仕様書はランブックの定義のみを行い、実行は user 承認後に Phase 11 で行う。

## 実行タスク（ランブック構造の確定のみ）

1. 事前確認: required secrets の存在確認（値は記録しない）
2. UI smoke 実行: Playwright staging profile または手動 smoke
3. Forms sync 実行: schema sync → responses sync → audit dump
4. staging tail 取得: `bash scripts/cf.sh` 経由で 30 分相当
5. evidence 集約: `outputs/phase-11/` 配下に保存
6. artifacts.json 更新: 09a / 本タスクの双方を Phase 11 status に更新
7. 09c blocker 更新: PASS 時 / FAIL 時の差分を `task-workflow-active.md` に反映

## 参照資料

- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md
- scripts/cf.sh / scripts/with-env.sh
- apps/web/wrangler.toml / apps/api/wrangler.toml

## 統合テスト連携

- UI smoke は 08b Playwright scaffold または手動 smoke fallback を利用する
- Forms sync は U-04 sync endpoint / audit ledger の実装契約に従う
- 09c production deploy は本 Phase 11 evidence が揃うまで blocked を維持する

## 実行手順（ランブック詳細）

### 0. 前提

- staging URL / Pages project / required secrets が ut-27 / ut-28 で揃っている
- `bash scripts/cf.sh whoami` で認証確認できる
- `wrangler` 直接実行は禁止（必ず `bash scripts/cf.sh` 経由）

### 1. UI smoke

```bash
# Playwright staging profile が存在する場合
bash scripts/with-env.sh pnpm --filter @ubm-hyogo/web playwright test --project=staging --reporter=html

# 未整備時は手動 smoke
# トップ / 公開ディレクトリ / ログイン / プロフィール / 管理画面 / 認可境界 を順に確認し
# 個人情報を redact したスクリーンショットを保存する
```

evidence:
- `outputs/phase-11/playwright-staging/` （report / trace / screenshots）
- `outputs/phase-11/manual-smoke-log.md`（手動時）

### 2. Forms sync

```bash
# admin sync endpoint を呼び出す（実体は apps/api/src/routes/admin/forms に従う）
# 例: bash scripts/with-env.sh curl -X POST "$STAGING_API_URL/admin/forms/sync" \
#       -H "Authorization: Bearer $STAGING_ADMIN_TOKEN" -d '{"target":"schema"}'
# secret は op:// 経由で動的注入し、ログに残さない
```

evidence:
- `outputs/phase-11/sync-jobs-staging.json`

### 3. staging tail

```bash
# scripts/cf.sh の tail サブコマンド経由（実コマンド名は scripts/cf.sh に従う）
# 取得不能時は理由を log 冒頭に記録
```

evidence:
- `outputs/phase-11/wrangler-tail.log`

### 4. artifacts.json 更新

- 09a 配下 `artifacts.json` / `outputs/artifacts.json` の Phase 11 status を実測結果に更新
- 本タスク `artifacts.json` の Phase 11 status を更新

### 5. 09c blocker 更新

- 実測 PASS 時: 09c の blocker 状態を `task-workflow-active.md` 上で「unblocked」相当に更新
- FAIL 時: blocker のまま、原因と再実行条件を追記

## 多角的チェック観点

- ランブックを「実行する」のではなく「定義する」フェーズである
- 全ての secret 取得は op:// 参照経由 / `bash scripts/with-env.sh` 経由
- evidence path 名は 09a `implementation-guide.md` と完全一致

## サブタスク管理

- [ ] 0〜5 の各ステップを実行可能な粒度で定義
- [ ] secret 利用箇所を全て op:// 化
- [ ] 取得不能時の記録手段を定義
- [ ] outputs/phase-05/main.md を作成する

## 成果物

- outputs/phase-05/main.md

## 完了条件

- ランブックの 0〜5 ステップが実行可能な粒度で確定している
- secret 取得経路が op:// に統一されている
- evidence path が 09a contract と一致している

## タスク100%実行確認

- [ ] `wrangler` 直接呼出が含まれていない
- [ ] secret 値が含まれていない
- [ ] 仮置きパスが含まれていない

## 次 Phase への引き渡し

Phase 6 へ、ランブックの異常系・失敗時手順を渡す。
