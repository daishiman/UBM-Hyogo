# Phase 1 成果: 要件定義サマリ

本ファイルは `phase-01.md` 仕様の close-out 出力。AC / RISK / scope / ownership を一枚に集約する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-355-opennext-workers-cd-cutover-task-spec |
| タスク ID | task-impl-opennext-workers-migration-001 |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| Wave | 1（単独タスク、並列 wave 不在） |
| Mode | sequential |
| 作成日 | 2026-05-02 |
| 前 Phase | なし |
| 次 Phase | 2（設計） |
| 状態 | spec_created |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #355（CLOSED だが仕様書は通常通り作成） |

## 目的

ADR-0001 / UT-28 / UT-29 で決定済みの「OpenNext on Workers」配信形態を CD パイプラインへ反映し、`apps/web` の本番配信を Cloudflare Pages（`pages deploy .next`）から Cloudflare Workers (`wrangler deploy` + `.open-next/worker.js`) へ完全切替える。同時に Cloudflare コンソール側の Pages project deactivation・Workers script 昇格・custom domain / route 移譲・rollback 手順を runbook 化し、再現可能な cutover を確立する。

## scope

### 含む

- `.github/workflows/web-cd.yml` の build / deploy step 改修（`build` → `build:cloudflare`、`pages deploy .next` → `wrangler deploy --env <stage>`）
- `apps/web/wrangler.toml` 現状確認（OpenNext 形式維持）と必要なら微調整
- `apps/web/package.json` の `build:cloudflare` script 維持確認
- `apps/web/next.config.ts` の OpenNext 互換性確認
- Cloudflare side cutover runbook（Pages project deactivation / Workers script 昇格 / custom domain 移譲 / route 再割当 / rollback）
- staging での UT-06 smoke S-01〜S-10 再実行と PASS evidence 取得

### 含まない

- Next.js のメジャーバージョン更新や OpenNext の major 変更（既存 `@opennextjs/cloudflare 1.19.4` を維持）
- `apps/api`（Hono Worker）側の変更（service binding ターゲット変更を除く）
- 新 route / 新 page の追加（UI 変更ゼロ前提のためタスク種別は NON_VISUAL）
- Pages project の物理削除（dormant 保持期間内は残置）
- D1 schema / migration 変更
- E2E テスト（Playwright）の新規追加（既存 smoke の再実行のみ）

## 受け入れ基準（AC-1〜AC-6）

| ID | 受け入れ基準 | 検証方法 |
| --- | --- | --- |
| AC-1 | `pnpm --filter @ubm-hyogo/web build:cloudflare` が exit 0 で完了し `apps/web/.open-next/worker.js` および `apps/web/.open-next/assets/` が生成される | `ls apps/web/.open-next/worker.js apps/web/.open-next/assets/` が存在確認 |
| AC-2 | `.github/workflows/web-cd.yml` の deploy step が `pages deploy .next ...` から `wrangler deploy --env staging` / `wrangler deploy --env production` に置換されている | workflow ファイル diff が `pages deploy` を含まないこと |
| AC-3 | UT-06 Phase 11 smoke S-01〜S-10 を staging URL（`https://ubm-hyogo-web-staging.<account>.workers.dev`）に対し実行し、全件 PASS | `outputs/phase-11/staging-smoke-results.md` に S-01〜S-10 PASS 記録 |
| AC-4 | staging URL の疎通が確認でき、Web → API（`API_SERVICE` service binding 経由）連携が機能する | 代表 API 叩き route（例: `/api/health` 相当）の応答 200 確認、または smoke S-XX 内に統合 |
| AC-5 | `apps/web/wrangler.toml` から `pages_build_output_dir` が除去され、`main = ".open-next/worker.js"` および `[assets]` セクション（root / staging / production）が維持されている | `grep -n "pages_build_output_dir" apps/web/wrangler.toml` が結果ゼロ、`grep -n "main = " apps/web/wrangler.toml` が `.open-next/worker.js` を返す |
| AC-6 | Cloudflare 側 cutover runbook（custom domain 移譲 / route 再割当 / Pages project deactivation / rollback）が `outputs/phase-05/cutover-runbook.md` として作成され、staging / production 双方の手順を含む | runbook ファイル存在 + 6 セクション（前提 / staging cutover / production cutover / custom domain / rollback / Pages dormant 期間）を含む |

## リスク（RISK-1〜RISK-5）

| ID | リスク | 影響 | 対策 |
| --- | --- | --- | --- |
| RISK-1 | `wrangler deploy` 切替後に staging で 5xx 多発 / route 不通 | cutover 後の本番影響 | staging 先行 cutover + UT-06 smoke S-01〜S-10 の AC-3 gate / NO-GO 条件で production への昇格を保留 |
| RISK-2 | Pages project が残存し DNS / route が新旧両方を指して trafic split が発生 | 一時的な不整合 / SSL 失効 | runbook で Pages project を dormant 化（custom domain unbind → branch deploy 停止）し、Workers route に一本化。UT-28 の配信形態決定との整合を Phase 2 で交差確認 |
| RISK-3 | `API_SERVICE` service binding が Workers 配信下で resolve できず Web → API 連携失敗 | 機能停止 | wrangler.toml の `[[env.<stage>.services]]` 維持確認（既に存在）。staging で `/api/*` 経路の疎通を AC-4 で gate |
| RISK-4 | rollback 不可（旧 Pages deploy が即時に呼べない） | インシデント長期化 | (a) Workers `wrangler rollback <VERSION_ID>` を一次手段とする、(b) Pages project を 1 sprint dormant 保持し二次手段として確保、(c) runbook に手順 / 所要時間目安を明示 |
| RISK-5 | `next.config.ts` が OpenNext 非互換オプションを含み build 失敗 | CD 失敗 | Phase 2 で `next.config.ts` を棚卸し、`output: "export"` 等 OpenNext 非対応 key の不在を確認 |

## Schema / 共有コード Ownership 宣言

| 編集対象 | 本タスクが ownership を持つか | 他 wave への影響 | 競合リスク | 備考 |
| --- | --- | --- | --- | --- |
| `.github/workflows/web-cd.yml` | yes | UT-29（API CD パイプライン）と job 構造を揃える慣性影響あり、ただし別ファイル | なし（apps/web 単独 owner） | 本タスクが正本化担当 |
| `apps/web/wrangler.toml` | yes | UT-28（apps/web 配信形態決定）が parent。UT-28 が決めた形を本タスクが CD へ反映 | なし | 既に OpenNext 形式に整備済、維持確認のみ |
| `apps/web/package.json` の `build:cloudflare` / `build` scripts | yes | monorepo build 全体には影響なし（filter 指定のため） | なし | 既存 script を維持 |
| `apps/web/next.config.ts` | yes | OpenNext 互換に限定 | なし | Phase 2 で互換性確認のみ |
| `apps/web/.open-next/`（生成物） | yes（生成 owner は build script、本タスクは CI 経由生成を保証） | なし（gitignore 対象） | なし | `.gitignore` 設定維持確認 |
| Cloudflare Pages project（外部リソース） | yes（cutover 期間中の運用 owner） | UT-28 配信形態決定の物理切替 | なし | runbook で dormant 化を明示 |
| `apps/api` 側 wrangler / 設定 | no | 影響なし | なし | 本タスク scope 外 |

宣言が `no` の領域を編集する事態となった場合は `unassigned-task-detection.md` にフォローアップ起票する。

## 真の論点（true issue）

- **論点 1**: 既に `apps/web/wrangler.toml` は OpenNext 形式（`main = ".open-next/worker.js"`、`pages_build_output_dir` 未設定、`[assets]` 配置済）であり、CD 側だけが Pages 残存。設計の中心は「`web-cd.yml` deploy step の切替」と「Cloudflare 側 cutover runbook」であり、wrangler.toml は維持確認のみ。
- **論点 2**: Build script は既に `build:cloudflare`（`opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs`）が存在。CD job が呼ぶスクリプトを `build` から `build:cloudflare` へ差し替える必要がある。
- **論点 3**: Pages → Workers cutover には DNS / custom domain 移譲が含まれる。staging は `*.workers.dev` で完結するが、production custom domain は Cloudflare Dashboard 上での切替手順が必要であり、runbook に明文化する。
- **論点 4**: rollback 戦略は (a) `wrangler rollback <VERSION_ID>`（Workers 内 rollback）と (b) Pages project への切戻し（cutover 完了直後に限る）の二段構え。Pages project は cutover 後 1 sprint は dormant 保持し即時切戻し可能性を担保。
- **論点 5**: UT-06 Phase 11 smoke S-01〜S-10 を staging で再実行することで「Workers 配信下でも全 route が機能する」ことを検証する gate 化が必要。

## 既実装状態調査（P50）

| 対象 | 現状 | 本タスクでの扱い |
| --- | --- | --- |
| `apps/web/wrangler.toml` の `main` | `".open-next/worker.js"` に既設定済 | 維持確認のみ（AC-5） |
| `apps/web/wrangler.toml` の `pages_build_output_dir` | 既に未設定 | 維持確認のみ（AC-5） |
| `apps/web/wrangler.toml` の `[assets]` | root / staging / production すべてに `directory = ".open-next/assets"` 設定済 | 維持確認のみ |
| `apps/web/package.json` の `build:cloudflare` | `opennextjs-cloudflare build && node ../../scripts/patch-open-next-worker.mjs` で既存 | 維持確認のみ |
| `.github/workflows/web-cd.yml` build step | `pnpm --filter @ubm-hyogo/web build`（OpenNext build を呼んでいない） | `build:cloudflare` へ差し替え（AC-2 関連） |
| `.github/workflows/web-cd.yml` deploy step | `pages deploy .next --project-name=...` | `wrangler deploy --env staging` / `--env production` へ差し替え（AC-2） |
| Cloudflare Pages project | 稼働中（旧配信） | runbook で dormant 化（AC-6） |
| Cloudflare Workers script (`ubm-hyogo-web-staging` / `ubm-hyogo-web-production`) | wrangler.toml には定義済、deploy 経路未確立 | CD 経由で deploy 経路を確立（AC-2） |

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | ADR-0001 | OpenNext on Workers 採用決定 | CD パイプラインへの反映 |
| 上流 | UT-28 / UT-29 | apps/web 配信形態決定 / api 側 CD 構成 | wrangler.toml / web-cd.yml の最終形 |
| 上流 | UNASSIGNED-G (`task-infra-cloudflare-cli-wrapper-001`) | `scripts/cf.sh` ラッパー | runbook 内手動オペレーション例で `bash scripts/cf.sh deploy` を採用 |
| 上流参照 | UT-06 Phase 11 smoke S-01〜S-10 | 公開ルート smoke 仕様 | staging URL での再実行と PASS evidence |
| 後続 | 将来の web 機能タスク | Workers 配信下での CD 経路 | `wrangler deploy --env <stage>` を前提とする |

## 4 条件評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | Workers 配信統一による Pages 二重運用解消と service binding 経由の Web→API 連携の成立 | PASS | UT-28 / UT-29 / ADR-0001 で意思決定済。CD 反映が最後の barrier |
| 実現性 | 既存資産（wrangler.toml / build:cloudflare）が揃っており workflow 改修と runbook 整備で完了可能 | PASS | P50 調査で wrangler.toml / package.json は既設定。残作業は workflow 1 ファイルと runbook |
| 整合性 | 不変条件 #5（D1 直アクセス禁止）と矛盾しないか | PASS | apps/web は service binding 経由で apps/api を呼ぶ構成を維持。D1 直アクセスは発生しない |
| 運用性 | rollback / Pages dormant / custom domain 切替が再現可能か | PASS | AC-6 runbook が 6 セクションで網羅、RISK-4 で二段 rollback を担保 |

## Phase 2 への open question

1. `next.config.ts` に OpenNext 非互換オプション（`output: "export"` 等）が混入していないか棚卸し（Phase 2 で確認）
2. `web-cd.yml` の deploy step に `wrangler deploy` の `--var` / `--minify` 等オプションが必要か（Phase 2 で決定）
3. staging cutover と production cutover の gate（手動承認 / required reviewers）を environment protection rule で要求するかどうか
4. Pages project dormant 期間（提案: 1 sprint = 2 週間）と削除タイミングの正式合意

## 完了条件

- [x] AC-1〜AC-6 が検証可能形で定義されている
- [x] RISK-1〜RISK-5 と対策が記載されている
- [x] Schema / 共有コード ownership が宣言されている
- [x] `metadata.visualEvidence = NON_VISUAL` を artifacts.json に記録
- [x] `metadata.workflow_state = spec_created`
- [x] Phase 2 へ 4 件の open question が引き渡されている

## 次の Phase

Phase 2: 技術設計（wrangler.toml 最終形 / web-cd.yml deploy step 差分 / cutover runbook 設計）
