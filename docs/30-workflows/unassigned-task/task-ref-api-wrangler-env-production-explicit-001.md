# apps/api wrangler.toml `[env.production]` 明示化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-ref-api-wrangler-env-production-explicit-001                             |
| タスク名     | apps/api `[env.production]` explicit section refactor                         |
| 分類         | リファクタリング                                                              |
| 対象機能     | apps/api Cloudflare Workers デプロイ設定                                      |
| 優先度       | 中                                                                            |
| 見積もり規模 | 小規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | UT-06 (production deploy execution)                                           |
| 発見元       | UT-06 Phase 12 unassigned-task-detection (UNASSIGNED-B)                       |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-06 で本番デプロイを実行する際、`apps/api/wrangler.toml` のトップレベル設定と `[env.production]` セクションに同値が重複していた。本ワークツリーで `[env.production]` を追加したが、トップレベル定義もそのまま残っており、Phase 8/12 docs の旧記述と drift している。

### 1.2 問題点・課題

- どちらが正かが不明確で `wrangler deploy --env production` の挙動が読みにくい
- 重複定義の保守コスト増
- トップレベルが production 用の値を持っていると、デフォルト env / staging へ意図せず影響する可能性

### 1.3 放置した場合の影響

- 設定変更の二重管理ミスで本番のみ更新漏れが起きる
- 新規開発者が誤った設定箇所を参照する

---

## 2. 何を達成するか（What）

### 2.1 目的

`[env.production]` セクションを唯一の正として明示化し、トップレベルから production 専用値を撤去する。

### 2.2 想定 AC

1. `[env.production]` セクションで全 production 設定が明示される
2. トップレベルにはデフォルト / 共通値のみが残る
3. `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production` の挙動が現状と完全一致
4. staging 環境で smoke 全件 PASS
5. Phase 8/12 docs と整合

### 2.3 スコープ

#### 含むもの

- `apps/api/wrangler.toml` のトップレベル / `[env.production]` / `[env.staging]` の整理
- 重複値の特定と DRY 化（`[vars]` 共通化は UNASSIGNED-D とは別 commit に分離）
- staging / production 双方の動作確認

#### 含まないもの

- `database_id` の CI/CD 注入式化（UNASSIGNED-C）
- `SHEET_ID` / `FORM_ID` 共通化（UNASSIGNED-D）

---

## 3. 影響範囲

- `apps/api/wrangler.toml`
- apps/api デプロイパイプライン（staging / production）

---

## 4. 推奨タスクタイプ

refactor

---

## 5. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md` の UNASSIGNED-B
- 関連ファイル: `apps/api/wrangler.toml`
- 関連タスク: UNASSIGNED-C (database_id), UNASSIGNED-D (vars DRY 化)

---

## 6. 備考

本ワークツリーで先行追加した `[env.production]` セクションを正式化するリファクタ。挙動は変えず、設定の意味を明確にする。
