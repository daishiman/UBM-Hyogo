---
timestamp: 2026-04-29T00:00:00Z
branch: feat/wt-8
author: claude-code
type: lessons-learned
---

# Lessons Learned: UT-06-FU-A apps/web OpenNext Workers 移行 (2026-04)

本ファイルは UT-06-FU-A（`apps/web/wrangler.toml` を Cloudflare Pages 形式から OpenNext Workers 形式へ移行）で遭遇した8つの主要な苦戦点を記録する。

## 概要

| 項目 | 値 |
| --- | --- |
| ID | L-UT06-FU-A |
| タスク | docs/30-workflows/ut-06-followup-A-opennext-workers-migration/ |
| 期間 | 2026-04 |
| 関連 PR | (TBD：Phase 13 approval_required) |
| 関連 Issue | #114 (CLOSED 後に正本仕様化) |
| 上流 | UT-06 production-deploy-execution Phase 12 UNASSIGNED-A / 実行前ブロッカー B-1 |

---

## L-UT06-FU-A-001: Pages 形式 vs OpenNext Workers 形式の判別

### 症状

`apps/web/wrangler.toml` に `pages_build_output_dir = ".next"` が残ったまま OpenNext Workers 形式の `main` / `[assets]` を追記すると、wrangler が Pages として解釈する経路が残り、build 成果物の参照先が分岐する。レガシー設定が残っている状態で deploy が走るとデプロイ先のサーフェスが想定と異なる事故になる。

### 根本原因

判定軸が「`pages_build_output_dir` キーの有無」という一点に集約されているにもかかわらず、CLAUDE.md・正本仕様・実ファイルで Pages / Workers のどちらが canonical かの宣言が分散しており、コードレビュー時に「両方併記しても動くのでは」という誤解が混入した。

### 解決

- Phase 1 冒頭で「`pages_build_output_dir` を撤去すること」を AC-1 として明示し、AC-2 (`main = ".open-next/worker.js"`) と双子化
- `deployment-cloudflare.md` に Pages vs OpenNext 判定フローを Phase 12 で追記（既存 skill-feedback として反映済）
- Phase 12 documentation 同期で「OpenNext Workers が canonical」「Pages は UT-28 で別管理」を明示

### 今後の予防

- wrangler.toml レビュー時は「Pages key と Workers key の混在禁止」をチェックリスト化
- 新規 worker 追加時は `pages_build_output_dir` キーが残っていないか pre-commit / CI で grep 検出する候補を将来検討

---

## L-UT06-FU-A-002: `bash scripts/cf.sh deploy` が `.open-next/` 生成物を見つけられない

### 症状

`build:cloudflare` を実行せずに `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` を実行すると、`.open-next/worker.js` / `.open-next/assets/` が存在せず deploy が即時 fail する。fresh clone・新ワークツリー・CI runner で再現しやすい。

### 根本原因

OpenNext Workers 形式では Next.js の通常ビルド (`.next/`) と OpenNext ビルド (`.open-next/`) が別生成物であり、deploy 経路が前者ではなく後者を要求する。`.gitignore` で `.open-next/` を除外しているため fresh 環境では必ず build が必要だが、その必須性がランブックに明示されていなかった。

### 解決

- Phase 5 implementation-runbook に「deploy 前に必ず `pnpm --filter @ubm-hyogo/web build:cloudflare` 相当を実行する」pre-deploy step を明文化
- Phase 8 DRY 化で deploy-runbook を共通化し、build → bundle size 確認 → deploy → smoke の順序を固定
- AC-8 として「`.open-next/worker.js` と `.open-next/assets/` が生成される」を独立検証項目化

### 今後の予防

- `scripts/cf.sh deploy` 内で `.open-next/worker.js` の存在確認を行い、無ければ build を促す警告を出すことを将来検討
- ランブックは「build 必須」を必ず1行目に書く規約を deployment-cloudflare 系に拡張

---

## L-UT06-FU-A-003: `compatibility_flags` の `nodejs_compat` 漏れ

### 症状

OpenNext で配信される Next.js サーバーコンポーネントが Node 互換 API（`Buffer` / `process` 等）を使用すると、`nodejs_compat` flag が無いまま Workers で実行され `Buffer is not defined` などの runtime error が発生する。Pages 形式では暗黙の挙動だったため、Workers 形式に移行した瞬間に顕在化する。

### 根本原因

Pages 形式と Workers 形式の defaults の違い（`nodejs_compat` の暗黙 vs 明示）が CLAUDE.md / 仕様書のいずれにも明記されていなかった。`compatibility_date` の要件（`nodejs_compat` のため 2024-09-23 以降）も別軸で必要となるため、二重の漏れが発生しやすい。

### 解決

- AC-3 に `compatibility_flags` への `nodejs_compat` 包含を、AC-4 に `compatibility_date >= 2024-09-23` を independent に明文化
- Phase 5 / Phase 13 の証跡に Cloudflare 公式 changelog 確認日・採用日・採用理由を記録するルールを追加

### 今後の予防

- 新規 wrangler.toml 作成時のテンプレートに `compatibility_flags = ["nodejs_compat"]` と `compatibility_date` の最小値コメントを記述
- runtime error は staging smoke 段階で必ず再現できるよう `Buffer` を含むテストパスを Phase 11 smoke S-01〜S-10 に組み込む

---

## L-UT06-FU-A-004: 既存 Pages プロジェクトとの並走方針（料金重複リスク）

### 症状

UT-28 で作成予定の Cloudflare Pages プロジェクトを残したまま OpenNext Workers に移行すると、同じ apps/web を 2 経路で配信する状態になり、料金・キャッシュ・DNS・運用面で意図せぬ重複・混乱が生じる。

### 根本原因

「Pages → Workers 移行」を実行する一方で、Pages プロジェクトの「保持 / staging 専用 / 廃止」の意思決定経路が別タスク（UT-28）にあり、本タスクのスコープ外として整理しにくい構造になっていた。

### 解決

- Phase 2 で `outputs/phase-02/rollback-plan.md` に Pages リソースの保持期間・判定条件を明文化
- スコープ「含まない」に「Pages プロジェクトの物理削除」を明示し、Phase 2 では「保持 / 廃止判断」のみ扱うと境界を確定
- 関連タスク欄で UT-28 を「関連」として明記し、相互参照可能にした

### 今後の予防

- 配信形式を切り替えるタスクでは必ず「旧形式リソースの取扱い判断」を rollback-plan に記述する規約を追加
- 二経路配信が一時的に発生する場合は「いつまで」「どちらが canonical」を Phase 2 で必ず宣言

---

## L-UT06-FU-A-005: Worker bundle size 上限（Free 3 MiB / Paid 10 MiB）

### 症状

Next.js のサーバーコンポーネント / RSC payload / 依存関係が積み上がると、Worker bundle が Free tier の 3 MiB を超え deploy できない。Paid tier でも 10 MiB が上限。

### 根本原因

Pages 形式では bundle size の上限が緩く、Workers 形式へ移行すると同じコードでも上限に到達するリスクがある。Next.js + RSC + node polyfill は依存が膨らみやすく、事前 audit を行わないと初回 deploy で初めて検知する。

### 解決

- AC-11 で「Free 3 MiB に収まる、または超過時は Paid 切替判断が文書化されている」ことを必須化
- Phase 9 free-tier-estimation で Workers / R2 cache の無料枠見積もりを実施
- Phase 6 異常系で「bundle size 超過」シナリオを明示的に検証

### 今後の予防

- `@opennextjs/cloudflare` の `--minify` を build pipeline に固定
- bundle analyzer を Phase 4 test-strategy に組み込み、PR 単位で bundle size diff を確認できる体制を将来候補化

---

## L-UT06-FU-A-006: 404 / SPA fallback の明示設定

### 症状

Pages の自動推定で動いていた 404 ページや SPA fallback 挙動が Workers では機能せず、未定義ルートで 500 / デフォルト Worker エラーが返る。

### 根本原因

Pages はディレクトリ構造から `_routes.json` / `404.html` を自動推定するが、Workers はそうした暗黙挙動を持たず、`[assets]` の `not_found_handling` を明示する必要がある。

### 解決

- AC-5 で `[assets]` セクションに `not_found_handling = "single-page-application"` を必須化
- AC-12 で「404 / SPA fallback の挙動が staging で確認されている」ことを独立検証
- `open-next.config.ts` または Worker handler 側で SPA fallback を明示

### 今後の予防

- Workers 形式の wrangler.toml テンプレートに `not_found_handling` を必須キーとして含める
- smoke S-01〜S-10 に「未定義ルートでの fallback 挙動」を必ず含める

---

## L-UT06-FU-A-007: Workers Builds の preview env が production env vars を共有

### 症状

Workers Builds で preview deploy を行うと、preview URL が production env の secret / vars を引き当ててしまうケースがある。preview URL 検証時に production secret が混入するリスク。

### 根本原因

Workers Builds の preview env は wrangler.toml の `[env.production]` を継承する設計で、明示的に staging / preview の env を分離しないと「preview = production の binding 共有」状態になる。

### 解決

- AC-14 で「staging / production の Worker が独立した env として分離されている」ことを必須化
- Phase 2 wrangler-migration-design で env マトリクスを設計し、staging 用に別 Worker name / env section を切る方針を確定

### 今後の予防

- wrangler.toml 作成時は `[env.staging]` / `[env.production]` を必ず別セクションで定義し、binding / secret / vars を独立させる
- preview URL での smoke は「staging env の secret しか見えていないこと」を確認するチェックを追加

---

## L-UT06-FU-A-008: `scripts/cf.sh` 経由の徹底（直接 wrangler 呼び出し / `wrangler login` 禁止）

### 症状

deploy / rollback / tail / secret 操作のドキュメントや scripts に直接 `wrangler ...` を書いてしまうと、CLAUDE.md の「Cloudflare CLI ラッパー方針」（1Password 経由の動的注入 + esbuild 解決 + mise 経路保証）が破られ、ローカル OAuth トークンの保持・実値の漏洩リスクが発生する。

### 根本原因

`wrangler` は単独で動作するため、ラッパー経由を強制する仕組みがコード/CI/ドキュメントの三位一体で揃っていないと、PR レビューで見落とされやすい。`apps/web/cf-typegen` のようなローカル型生成は対象外なのか否かの境界も曖昧だった。

### 解決

- AC-9 で「deploy / rollback / tail / secret 操作は `scripts/cf.sh` 経由」と明示。`wrangler types` などのローカル型生成は対象外と明文化
- Phase 5 / Phase 12 で全ドキュメント・全 scripts を走査し、直接 `wrangler` 呼び出しの残存を 0 にする
- `wrangler login` のローカル OAuth トークンを禁止し、`.env` の op 参照に一本化（CLAUDE.md と整合）

### 今後の予防

- 新規 PR で `wrangler` を grep し、`scripts/cf.sh` 経由でなければ block する CI gate を将来候補化
- ドキュメントには必ず `bash scripts/cf.sh ...` 形式で記述するスタイルガイドを deployment-cloudflare 系に集約

---

## 関連リンク

- index: `docs/30-workflows/ut-06-followup-A-opennext-workers-migration/index.md`
- 派生タスク: `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`
- 関連 follow-up: `docs/30-workflows/unassigned-task/UT-06-FU-A-R2-incremental-cache-decision.md`
- 関連 follow-up: `docs/30-workflows/unassigned-task/UT-06-FU-A-open-next-config-regression-tests.md`
- 関連 follow-up: `docs/30-workflows/completed-tasks/UT-06-FU-A-production-route-secret-observability.md`（2026-04-30 close-out / workflow `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`）
- canonical: `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
