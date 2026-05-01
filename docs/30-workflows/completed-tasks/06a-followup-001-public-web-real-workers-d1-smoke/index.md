# 06a-followup-001-public-web-real-workers-d1-smoke — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | public-web-real-workers-d1-smoke |
| ディレクトリ | docs/30-workflows/completed-tasks/06a-followup-001-public-web-real-workers-d1-smoke |
| 親タスク | docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages |
| GitHub Issue | #273（CLOSED — 再オープンせず仕様書化のみ） |
| 発見元 | 06a Phase 12 再検証 / unassigned task-06a-followup-001 |
| Wave | 6 (followup) |
| 実行種別 | sequential（local → staging の順序固定） |
| 作成日 | 2026-04-30 |
| 担当 | qa-tests / infra-runbook |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL（curl evidence 主体・staging screenshot は補助 evidence のため visualEvidence 判定には使わない） |
| visualEvidence | NON_VISUAL |

## purpose

06a 公開導線（`/`, `/members`, `/members/[id]`, `/register`）について、Phase 11 で **local mock API のみ** で smoke を完了させた残タスクを解消する。具体的には **04a public API 実体 + Cloudflare D1 binding** を使った local smoke と staging smoke を実施し、wrangler runtime / D1 binding / `PUBLIC_API_BASE_URL` 経路に潜む不具合（mock では検出不能な領域）を網羅する。esbuild Host/Binary version mismatch（`0.27.3` vs `0.21.5`）は本タスクの最初の障壁であり、`scripts/cf.sh` ラッパー経由で恒久回避できることを AC-1 で検証する。

## scope in / out

### scope in

- 04a public API 実体（`apps/api`）を **`scripts/cf.sh` 経由で wrangler dev 起動** する手順確立
- local D1 binding（`ubm-hyogo-db-dev` または同等）に対する `apps/web` → `apps/api` → D1 経路の curl smoke
- 対象 4 route family / 5 smoke cases: `/`, `/members`, `/members/{seeded-id}`, `/members/UNKNOWN`, `/register` の `200` / `404` 応答観測
- staging 環境（Cloudflare Workers / D1 production-or-staging binding）に対する同 4 route family / 5 smoke cases
- staging 側の `PUBLIC_API_BASE_URL` env 設定確認（未設定時の localhost fallback 検出）
- 06a `outputs/phase-11/evidence/` への追記（curl ログ + staging screenshot 1 枚）
- esbuild version mismatch 恒久対策の手順書化（`scripts/cf.sh` 経由ルートのみ採用）

### scope out

- 06a UI 機能追加実装（responsive 改善 / OGP 等は別 followup）
- 04a API contract 変更（zod schema / endpoint 追加変更）
- D1 migration の新規追加（既存 migration を前提）
- Playwright E2E（08b の責務）
- visual regression（NON_VISUAL タスク）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 06a-parallel-public-landing-directory-and-registration-pages | Phase 11 evidence への追記対象 |
| 上流 | 04a-parallel-public-api-endpoints | smoke 対象の API 実体 |
| 上流 | 02b-parallel-d1-schema-and-migrations | D1 binding と migration が apply 済み |
| 並列 | 06a-followup-002 / 003 | 同親の独立 followup |
| 下流 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | staging smoke 結果を deploy gate の参考に提供 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md | 苦戦箇所 / 検証方法 |
| 必須 | CLAUDE.md（`scripts/cf.sh` ルール / 不変条件 #5） | wrangler 直接実行禁止 / 3層分離 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件と 3 層構成 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | D1 binding 構成 |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | staging deploy / smoke 運用 |
| 参考 | docs/30-workflows/completed-tasks/06a-parallel-public-landing-directory-and-registration-pages/outputs/phase-11/ | 既存 evidence の追記先 |

## AC（Acceptance Criteria）

- AC-1: `bash scripts/cf.sh` 経由で `apps/api` を local dev 起動でき、esbuild Host/Binary version mismatch エラーが再現しない（直近 2 回連続 fresh 起動で `Listening on http://127.0.0.1:8787` を観測）。
- AC-2: local 環境で `PUBLIC_API_BASE_URL=http://localhost:8787` を設定した `apps/web` から、4 route family / 5 smoke cases に対して `curl -s -o /dev/null -w "%{http_code}"` を実行し、`/`, `/members`, `/members/{seeded-id}`, `/register` で `200`、`/members/UNKNOWN` で `404` を観測（evidence ログ保存）。
- AC-3: local smoke が **mock ではなく実 D1 binding 経由** であることを、API 側 `GET /public/members` の `items.length >= 1` と、その ID を使った web `/members/{seeded-id}` の `200` で示す。`/members/UNKNOWN` の `404` は異常系確認であり、実 D1 経由の主証跡にはしない。
- AC-4: staging 環境で同じ 4 route family / 5 smoke cases を実行し、`/`, `/members`, `/members/{seeded-id}`, `/register` で `200`、`/members/UNKNOWN` で `404` を観測。staging URL は deployed worker vars を正本、`apps/web/wrangler.toml` の env 設定は補助確認のみとする。
- AC-5: staging 側 `PUBLIC_API_BASE_URL` が `apps/api` の staging URL を指していることを Cloudflare deployed vars（`bash scripts/cf.sh` 経由）で確認し、localhost fallback していないことを明示する。現状 `apps/web/wrangler.toml` には未定義のため、deployed vars 未設定なら Phase 11 は NO-GO。
- AC-6: 06a 親タスクには本タスク evidence index への相対リンクのみ追記し、実体ファイルは本 followup task 側に保持する。
- AC-7: 不変条件 #5（apps/web からの D1 直接アクセス禁止 = API 経由のみ）を smoke 経路自体で再確認し、実アプリコードに D1 直接 import が無いことを `pnpm --filter @ubm-hyogo/web exec rg -n "D1Database|env\\.DB" app src --glob '!**/*.test.*' --glob '!**/__tests__/**'` で 0 件確認。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（mock vs 実 binding / esbuild mismatch 恒久対応）/ AC-1〜7 確定 / 不変条件 trace |
| 2 | 設計 | phase-02.md | local smoke / staging smoke 手順、`scripts/cf.sh` 経路、D1 binding mermaid |
| 3 | 設計レビュー | phase-03.md | 代替案（all-staging vs local-required）、PASS-MINOR-MAJOR 判定 |
| 4 | テスト戦略 | phase-04.md | curl matrix（route × env × expected status）と evidence 命名規則 |
| 5 | 実装ランブック | phase-05.md | 起動 / smoke / evidence 保存の runbook（`scripts/cf.sh` 経由） |
| 6 | 異常系検証 | phase-06.md | esbuild mismatch 再発 / `PUBLIC_API_BASE_URL` 未設定 / D1 binding 未 apply |
| 7 | AC マトリクス | phase-07.md | AC × verify × evidence × 不変条件 trace |
| 8 | DRY 化 | phase-08.md | curl helper / evidence ファイル命名統一 |
| 9 | 品質保証 | phase-09.md | secret hygiene（API token / D1 id を log に出さない） |
| 10 | 最終レビュー | phase-10.md | GO / NO-GO（local + staging 両方 green が条件） |
| 11 | 手動 smoke | phase-11.md | curl 出力 + staging screenshot を evidence/ に保存 |
| 12 | ドキュメント更新 | phase-12.md | 06a Phase 11 evidence 追記 / changelog / unassigned 解消 |
| 13 | PR 作成 | phase-13.md | local-check-result / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/d1-binding-flow.mmd
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/curl-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/link-checklist.md
outputs/phase-11/evidence/
```

Planned Phase 11 evidence files (created only when smoke is executed):

```
outputs/phase-11/evidence/local-curl.log
outputs/phase-11/evidence/staging-curl.log
outputs/phase-11/evidence/staging-screenshot.png
```

```
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
outputs/phase-13/pr-info.md
outputs/phase-13/pr-creation-result.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| Wrangler | local dev runner | `bash scripts/cf.sh` 経由のみ（直接実行禁止） | esbuild mismatch を ESBUILD_BINARY_PATH で吸収 |
| Cloudflare D1 | dev / staging binding | `apps/api/wrangler.toml` env section | 既存 binding を再利用、新規作成なし |
| 環境変数 | `PUBLIC_API_BASE_URL` | local: `http://localhost:8787` / staging: cloudflare vars | `apps/web` から `apps/api` への参照経路 |
| Secrets | `CLOUDFLARE_API_TOKEN` 等 | 1Password 参照（`.env` の `op://...`） | 値はログに出さない |

## invariants touched

- **#5（中心）** D1 への直接アクセスは `apps/api` に閉じる。`apps/web` から直接アクセス禁止。本 smoke は `apps/web` → `apps/api` → D1 という 3 層分離経路をそのまま検証する。
- **#1** 実フォーム schema をコードに固定しすぎない（API レスポンスは extraFields 経路を保ったまま 200 を返すこと）
- **#6** GAS prototype は本番バックエンド仕様に昇格させない（smoke 対象は `apps/api` 実体のみ、GAS 経路を使わない）

## completion definition

### spec_created completion

- Phase 1〜13 の仕様ファイルと `outputs/phase-12/` 必須 7 ファイルが存在する
- root `artifacts.json` と `outputs/artifacts.json` が一致する
- aiworkflow-requirements の current task inventory に本 workflow が登録済み
- Phase 11 実 evidence は planned evidence として分離され、未取得であることが明記されている

### executed completion

- AC-1〜7 が Phase 7 マトリクスで完全トレース
- local + staging 両方の curl evidence と staging screenshot 1 枚が evidence/ に保存
- 不変条件 #5 が smoke 経路で再確認済み
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` と `docs/00-getting-started-manual/specs/08-free-database.md` が実 smoke 結果に基づいて更新済み
- Phase 13 で user 承認後に PR 作成完了
- GitHub Issue #273 は CLOSED のままで再オープンしない（仕様書化のみ）
