# apps/web OpenNext Workers 形式移行 (Pages → `.open-next/`) - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | task-impl-opennext-workers-migration-001                                      |
| GitHub Issue | #355                                                                          |
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

CLAUDE.md および ADR-0001 は apps/web を「Cloudflare Workers + Next.js via `@opennextjs/cloudflare`」と定義している。2026-05-01 時点で `apps/web/wrangler.toml` は Workers 形式へ移行済みだが、`.github/workflows/web-cd.yml` は `pages deploy .next` の Pages deploy 経路を呼び続けており、Cloudflare side の Pages project → Workers script 切替 runbook も未完了である。

### 1.2 問題点・課題

- ADR-0001（Workers + OpenNext）と `web-cd.yml`（Pages deploy）の drift
- `.open-next/` Worker を deploy する CD 経路が未整備
- Cloudflare ダッシュボード上の Pages project / Workers script / custom domain / route の切替確認が未整備

### 1.3 放置した場合の影響

- Pages builds の制約（minutes 上限・無料枠）に縛られたままになる
- OpenNext が前提とする配信機能（middleware・edge function 等）が動かない
- 別環境を期待した後続タスク（UT-12 R2 / UT-13 KV 等）の前提が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

apps/web を ADR-0001 どおりの「OpenNext (`.open-next/`) on Cloudflare Workers」配信へ移行完了させ、`web-cd.yml` と Cloudflare side を Workers deploy に同期する。

### 2.2 想定 AC

1. `pnpm --filter @ubm-hyogo/web build:cloudflare` が `.open-next/` を生成する
2. `.github/workflows/web-cd.yml` の Web deploy command が `pages deploy .next` ではなく `wrangler deploy --env staging` / `wrangler deploy --env production` 相当になっている
3. UT-06 Phase 11 smoke (S-01〜S-10) 全件 PASS
4. staging 検証完了 (URL 疎通 + Web→API 連携)
5. `apps/web/wrangler.toml` に `pages_build_output_dir` が存在せず、`main = ".open-next/worker.js"` と `[assets]` が維持される
6. Cloudflare side の Pages project → Workers script 切替 runbook が作成され、custom domain / route / rollback 確認手順が揃う

### 2.3 スコープ

#### 含むもの

- `.github/workflows/web-cd.yml` の Workers deploy 書き換え
- `@opennextjs/cloudflare` のビルドコマンド整備（`open-next build` 等）
- staging / production の deploy / rollback 確認
- OpenNext 配下 assets / cache の Cloudflare binding 設定
- Cloudflare side の Pages project / Workers script / route / custom domain 切替 runbook

#### 含まないもの

- Cloudflare Pages プロジェクトの削除（UT-28 と整合確認）
- DNS / カスタムドメイン切替（UT-16）

### 2.4 成果物

- `.github/workflows/web-cd.yml` 更新差分
- 必要な場合のみ `apps/web/wrangler.toml` の追補更新差分
- `package.json` build script 更新差分
- staging smoke ログ
- production rollback 手順メモ

---

## 3. 影響範囲

- `.github/workflows/web-cd.yml`
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
- 入力: ADR-0001 (`docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`)

---

## 5. 推奨タスクタイプ

implementation

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-12/unassigned-task-detection.md` の UNASSIGNED-A
- deploy target decision: `docs/00-getting-started-manual/specs/adr/0001-pages-vs-workers-deploy-target.md`
- CLAUDE.md スタックセクション (`Cloudflare Workers + Next.js via @opennextjs/cloudflare`)
- 関連ファイル: `.github/workflows/web-cd.yml`, `apps/web/wrangler.toml`, `apps/web/package.json`, `apps/web/next.config.ts`
- 公式: `@opennextjs/cloudflare` README

---

## 7. 備考

UT-06 では Pages 形式のまま AC を緩めて通したが、ADR-0001 で Workers cutover が採択された。本タスクで CD 経路と Cloudflare side を正本仕様へ一致させる。HIGH 優先度のため次 Wave の先頭で着手することを推奨する。

---

## 8. 苦戦箇所・再発防止メモ

- `wrangler.toml` は Workers 形式へ先行更新済みだった一方、`.github/workflows/web-cd.yml` は Pages deploy のまま残っていたため、単純な「Pages → Workers 移行」ではなく「ADR 採択後の CD 経路 / Cloudflare side cutover」に責務を絞り直す必要があった。
- `UT-GOV-006-web-deploy-target-canonical-sync` と `task-impl-opennext-workers-migration-001` は表面上どちらも deploy target drift を扱うため、ADR 決定責務・正本同期責務・実 cutover 責務を分離してから Issue 化する必要があった。
- `sync_new_issues.js --dry-run` は既存未同期仕様書 76 件を拾うため、今回の Issue 作成では一括同期を避け、対象仕様書だけを個別 Issue 化した。
