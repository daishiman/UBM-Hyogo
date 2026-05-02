# Phase 2: 設計 — ut-09a-exec-staging-smoke-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-exec-staging-smoke-001 |
| phase | 2 / 13 |
| wave | Wave 9 |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

実 staging 実行のコード / オペレーション変更点を最小に抑えつつ、Phase 11 evidence
contract を実測値で満たすための実行設計を確定する。

## 実行タスク

1. UI smoke の実行手段（Playwright staging プロファイル / 手動 smoke ログ）の選択基準を整理する。
2. Forms sync 実行手段（admin endpoint or wrangler script）と audit dump 取得手段を確定する。
3. `bash scripts/cf.sh` 経由の staging tail 取得方法と redaction 規則を確定する。
4. Phase 11 evidence path / artifacts.json 更新差分を確定する。

## 参照資料

- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/phase-11.md
- docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/outputs/phase-12/implementation-guide.md
- apps/web/playwright.config.ts (存在する場合)
- apps/api/src/routes/admin/forms/*.ts (sync endpoint の実体)
- scripts/cf.sh / scripts/with-env.sh

## 実行手順

- 既存 repo 配下のパス・コマンド名は実在確認してから記述する（仮置き禁止）。
- staging URL / secret / project 名は値ではなく key 名のみを設計に書く。
- UI smoke と Forms sync は別フェーズ的に実行できるよう手順を分離する。

## 設計ポイント

### UI smoke 実行ルート

- 第一候補: Playwright staging profile（08b で scaffold 済の場合）
- 代替: 手動 smoke + screenshot（Playwright 未整備時）
- 取得対象: トップ / 公開ディレクトリ / ログイン / プロフィール / 管理画面 / 認可境界

### Forms sync 実行ルート

- admin endpoint POST 実行 → `sync_jobs` レコード生成
- audit dump（`sync_jobs`, `forms_responses` 差分）を JSON で保存
- 409 / lock 状態は失敗ではなく evidence として記録

### Cloudflare Workers tail

- `bash scripts/cf.sh tail --env staging` 系（実コマンドは scripts/cf.sh に従う）
- 30 分相当または取得不能理由を log に記録
- 個人情報・secret は redaction 後に保存

### artifacts.json 更新差分

- 09a 配下 `artifacts.json` / `outputs/artifacts.json` の Phase 11 status を実測結果に更新
- 本タスク（ut-09a-exec-staging-smoke-001）の `artifacts.json` も Phase ごとの status を更新

## 統合テスト連携

- 09a evidence contract（`implementation-guide.md`）と一字違わぬ path 名を採用する
- 09c blocker 更新は `references/task-workflow-active.md` 経由で行う

## 多角的チェック観点

- 仮想パスを設計に書かない（`apps/api/test/contract/...` 等の幻想ディレクトリ禁止）
- `wrangler` 直接呼出を設計に書かない（必ず `bash scripts/cf.sh` 経由）
- env 値の貼付禁止、`op://` 参照のみ
- 既存の Playwright / sync endpoint / audit ledger schema と整合させる

## サブタスク管理

- [ ] UI smoke ルート選択基準と手順を確定する
- [ ] Forms sync 実行コマンドと audit dump フォーマットを確定する
- [ ] `bash scripts/cf.sh` 経由 tail 取得手順と redaction ルールを確定する
- [ ] artifacts.json 更新差分テンプレを作成する
- [ ] outputs/phase-02/main.md を作成する

## 成果物

- outputs/phase-02/main.md

## 完了条件

- UI smoke / Forms sync / `bash scripts/cf.sh` 経由 tail の各実行ルートが実在パス・実在コマンドで記述されている
- evidence path が 09a `implementation-guide.md` と一致している
- artifacts.json 更新差分テンプレが用意されている

## タスク100%実行確認

- [ ] 仮置きパス / 仮置きコマンドが含まれていない
- [ ] secret 値が含まれていない
- [ ] `wrangler` 直接呼出が含まれていない

## 次 Phase への引き渡し

Phase 3 へ、UI / Forms / tail の実行ルート設計、evidence path、artifacts.json
更新差分を渡す。
