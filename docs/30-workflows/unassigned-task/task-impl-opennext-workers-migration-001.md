# apps/web OpenNext Workers 形式移行 (Pages → `.open-next/`) - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-impl-opennext-workers-migration-001                                      |
| タスク名     | apps/web `wrangler.toml` Pages → OpenNext Workers migration                    |
| 分類         | 実装 / インフラ移行                                                           |
| 対象機能     | apps/web Cloudflare 配信形式 (`@opennextjs/cloudflare`)                       |
| 優先度       | 高 (HIGH ブロッカー)                                                          |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | UT-06 (production deploy execution)                                           |
| 発見元       | UT-06 Phase 12 unassigned-task-detection (UNASSIGNED-A)                       |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

CLAUDE.md および正本仕様は apps/web を「Cloudflare Workers + Next.js via `@opennextjs/cloudflare`」と定義している。しかし現状の `apps/web/wrangler.toml` は `pages_build_output_dir = ".next"` の Pages 形式のままで、正本仕様と乖離している。UT-06 AC-1 の本番実行前ブロッカーとして検出された。

### 1.2 問題点・課題

- 正本仕様（Workers + OpenNext）と `wrangler.toml`（Pages）の drift
- `.open-next/` 出力ではなく `.next` を直接配信しており、エッジランタイム最適化が効かない
- UT-06 では応急的に Pages 形式のまま deploy したため、本来の Workers 配信が未検証

### 1.3 放置した場合の影響

- Pages builds の制約（minutes 上限・無料枠）に縛られたままになる
- OpenNext が前提とする配信機能（middleware・edge function 等）が動かない
- 別環境を期待した後続タスク（UT-12 R2 / UT-13 KV 等）の前提が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

apps/web を正本仕様どおりの「OpenNext (`.open-next/`) on Cloudflare Workers」配信へ移行し、`pages_build_output_dir` を撤去する。

### 2.2 想定 AC

1. `pnpm --filter @ubm-hyogo/web build:cloudflare` が `.open-next/` を生成する
2. `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production` で Workers として配信される
3. UT-06 Phase 11 smoke (S-01〜S-10) 全件 PASS
4. staging 検証完了 (URL 疎通 + Web→API 連携)
5. `pages_build_output_dir` 行が `wrangler.toml` から削除される
6. main_module / assets binding 等 OpenNext 推奨設定が反映される

### 2.3 スコープ

#### 含むもの

- `apps/web/wrangler.toml` の Workers 形式書き換え
- `@opennextjs/cloudflare` のビルドコマンド整備（`open-next build` 等）
- staging / production の deploy / rollback 確認
- OpenNext 配下 assets / cache の Cloudflare binding 設定

#### 含まないもの

- Cloudflare Pages プロジェクトの削除（UT-28 と整合確認）
- DNS / カスタムドメイン切替（UT-16）

### 2.4 成果物

- `apps/web/wrangler.toml` 更新差分
- `package.json` build script 更新差分
- staging smoke ログ
- production rollback 手順メモ

---

## 3. 影響範囲

- `apps/web/wrangler.toml`
- `apps/web/package.json` (build:cloudflare)
- apps/web ビルド・デプロイパイプライン全体
- UT-06 smoke 結果と整合性
- UT-28 (Pages projects creation) との関係再確認

---

## 4. 依存・関連タスク

- 依存: UNASSIGNED-G (`task-infra-cloudflare-cli-wrapper-001`)（deploy 経路）
- 関連: `task-impl-web-next-config-worktree-root-001`（Next.js 設定整合）
- 関連: UT-28 (cloudflare-pages-projects-creation) — 既存 Pages プロジェクトの扱い
- 関連: UT-29 (cd-post-deploy-smoke-healthcheck)

---

## 5. 推奨タスクタイプ

implementation

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md` の UNASSIGNED-A
- CLAUDE.md スタックセクション (`Cloudflare Workers + Next.js via @opennextjs/cloudflare`)
- 関連ファイル: `apps/web/wrangler.toml`, `apps/web/package.json`, `apps/web/next.config.ts`
- 公式: `@opennextjs/cloudflare` README

---

## 7. 備考

UT-06 では Pages 形式のまま AC を緩めて通したが、本タスクで正本仕様への一致を完了させる。HIGH 優先度のため、UT-06 完了直後 / 次 Wave の先頭で着手することを推奨する。
