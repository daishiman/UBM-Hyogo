# ut-28-cloudflare-pages-projects-creation - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | ut-28-cloudflare-pages-projects-creation |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 |
| ディレクトリ | docs/30-workflows/ut-28-cloudflare-pages-projects-creation |
| Wave | 1 |
| 実行種別 | serial（01b / UT-05 完了後の単独 PR） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL（Cloudflare Dashboard / `wrangler pages project create` 操作） |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_pages_projects_creation |
| implementation_mode | new |
| 親仕様 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md |
| GitHub Issue | #48 |

## 状態語彙と実行境界

| レイヤ | 値 | 意味 |
| --- | --- | --- |
| workflow root | `spec_created` | タスク仕様書と必須 outputs は作成済み。Cloudflare Pages の実プロジェクト作成は未実行 |
| taskType | `implementation` | Phase 13 の承認後オペレーションで Cloudflare Pages 状態を変更する実装タスク |
| visualEvidence | `NON_VISUAL` | UI 変更ではないため screenshot は不要。代替証跡は project list / GitHub Actions run / HTTP 応答 |
| repository PR の差分 | docs/spec files | PR のファイル差分は Markdown / JSON 中心だが、タスク分類は docs-only ではなく implementation |
| Phase 1〜3 | `completed` | 要件定義・設計・設計レビューの仕様化が完了 |
| Phase 4〜13 | `pending` | 実 Cloudflare apply / smoke / close-out は user 承認後に完了化 |

### 2 軸整理（誤読防止）

| 軸 | 本 workflow の扱い |
| --- | --- |
| 仕様完了 vs 実走完了 | 仕様書・outputs は揃える。実 `bash scripts/cf.sh pages project create` と dev/main smoke は Phase 13 承認後 |
| 本タスク vs 他タスク | Pages プロジェクト作成だけを扱う。UT-05 は CD ファイル修正、UT-27 は GitHub Variable、UT-06 は本番 deploy |

## 目的

`web-cd.yml` が `dev` push / `main` push でそれぞれ参照する 2 つの Cloudflare Pages プロジェクト（production: `ubm-hyogo-web` / staging: `ubm-hyogo-web-staging`）を Cloudflare 側に作成し、`production_branch` / `compatibility_date` / `compatibility_flags` / アップロード成果物ディレクトリ（`.next` または `.open-next/...`）/ Pages Git 連携の有無 / 命名規則 を確定する。Workers 側 (`apps/api/wrangler.toml`) には既に `[env.staging]` / `[env.production]` が宣言済みなのに対し、Pages 側のプロジェクト分離が Cloudflare アカウントに実体として作成されていないため、現状では `web-cd.yml` の `pages deploy` が 8000017 (Project not found) で失敗する。本ワークフローはこの欠落を解消し、UT-27 へ `CLOUDFLARE_PAGES_PROJECT` Variable の確定値を、UT-06 へ production deploy の成功前提を引き渡す。本ワークフローは Phase 1〜13 のタスク仕様書整備に閉じ、実プロジェクト作成（`wrangler pages project create` 等）は Phase 13 ユーザー承認後の別オペレーションで実施する。

## スコープ

### 含む

- Phase 1〜13 のタスク仕様書（`phase-NN.md`）作成
- Phase outputs 骨格（Phase 1〜13 の `outputs/phase-NN/main.md` と NON_VISUAL / Phase 12 必須補助成果物）作成方針
- `index.md`（本ファイル）と `artifacts.json` / `outputs/artifacts.json` parity の作成
- 上流タスク（01b / UT-05）完了確認 inventory の Phase 1 への記録
- Cloudflare Pages プロジェクト 2 件の命名・`production_branch` 設計（production: `ubm-hyogo-web` + main、staging: `ubm-hyogo-web-staging` + dev）
- `nodejs_compat` フラグの ON 化と `compatibility_date` の Workers (`2025-01-01`) 同期方針
- アップロード成果物ディレクトリ確定（OpenNext 採用 → `.next` のままでよいか、`.open-next/assets` + `_worker.js` への切替が必要か）の判定基準と UT-05 へのフィードバック条件
- Pages Git 連携 OFF（GitHub Actions 主導）方針の明文化
- 命名規則「production = `<base>` / staging = `<base>-staging`」と Variable `CLOUDFLARE_PAGES_PROJECT` 値の引き渡しルール
- `wrangler pages project create` / `bash scripts/cf.sh ...` のコマンド草案（仕様レベル）
- 動作確認手順（dev push → staging deploy success / main push → production deploy success / project list 確認）の仕様化
- 手順書実行禁止事項（Pages Git 連携 ON にしない / production_branch を取り違えない / 値転記禁止）

### 含まない

- `apps/api` 側 Workers プロジェクトの新規作成（`apps/api/wrangler.toml` に既に定義され、`wrangler deploy --env <name>` 時に Cloudflare 側に自動登録される）
- カスタムドメインの本登録（UT-16 のスコープ）
- ワークフローファイル自体の編集（UT-05 のスコープ。OpenNext 切替が必要なら UT-05 へフィードバックする）
- GitHub Secrets / Variables の配置（UT-27 のスコープ。本タスクは値の出所を提供するに留める）
- Cloudflare Secrets / Service Account JSON の配置（UT-25 のスコープ）
- 本番デプロイ実行（UT-06 のスコープ）
- 実 `wrangler pages project create` の実行（Phase 13 ユーザー承認後の別オペレーション）
- 自動 commit / push / PR 発行（承認後に使う Phase 13 runbook は含むが、Codex / SubAgent が自動実行しない）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流（必須） | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント / API Token / Account ID の前提。`wrangler` / `scripts/cf.sh` で Pages API を叩くために必要 |
| 上流（必須） | UT-05（CI/CD パイプライン実装） | `web-cd.yml` のプロジェクト名参照仕様（`${{ vars.CLOUDFLARE_PAGES_PROJECT }}` + `-staging` suffix 連結）が確定していること |
| 関連 | `apps/web/wrangler.toml` | `name` / `compatibility_date` / `compatibility_flags` / `pages_build_output_dir` の値を Pages プロジェクトと整合させる |
| 関連 | `apps/api/wrangler.toml` | Workers 側 `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` を Pages 側に同期 |
| 関連 | `apps/web/open-next.config.ts` | OpenNext 採用時のビルド出力構造（`.open-next/`）の確認 |
| 下流 | UT-27（GitHub Secrets / Variables 配置） | 本タスクで命名確定する `CLOUDFLARE_PAGES_PROJECT` Variable の値が必要 |
| 下流 | UT-06（本番デプロイ実行） | Pages プロジェクトが両環境で実体化していなければ main → production deploy は失敗 |
| 下流 | UT-16（カスタムドメイン） | カスタムドメインバインドは Pages プロジェクト存在が前提 |
| 下流 | UT-29（CD 後スモーク） | スモーク URL `https://<project>.pages.dev` / `https://<project>-staging.pages.dev` の組み立てに本タスクの命名を再利用 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-28-cloudflare-pages-projects-creation.md | 親タスク仕様（写経元） |
| 必須 | .github/workflows/web-cd.yml | Pages プロジェクト名参照仕様（dev/main 切替）の確認 |
| 必須 | apps/web/wrangler.toml | Pages 側互換性設定の整合確認（`pages_build_output_dir = ".next"` / `compatibility_flags = ["nodejs_compat"]`） |
| 必須 | apps/web/open-next.config.ts | OpenNext 採用時のビルド出力構造確認 |
| 必須 | apps/api/wrangler.toml | Workers 側の `compatibility_date` / `compatibility_flags` 値の参照 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | デプロイ設計の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CD ワークフロー仕様の正本 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 1〜13 テンプレ正本 |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-core.md | Phase 1〜3 共通セクション順 |
| 参考 | docs/30-workflows/unassigned-task/UT-05-cicd-pipeline-implementation.md | CI/CD ワークフロー本体タスクとの境界 |
| 参考 | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md | `CLOUDFLARE_PAGES_PROJECT` Variable 値の引き渡し先 |
| 参考 | https://developers.cloudflare.com/pages/platform/branch-build-controls/ | `production_branch` / Preview Branch 仕様 |
| 参考 | https://developers.cloudflare.com/workers/configuration/compatibility-dates/ | `compatibility_date` / `compatibility_flags` 仕様 |
| 参考 | https://developers.cloudflare.com/pages/configuration/build-configuration/ | Pages のアップロード成果物仕様 |
| 参考 | https://github.com/opennextjs/opennextjs-cloudflare | OpenNext for Cloudflare のビルド出力 |

## OpenNext / Pages 形式 GO 条件

aiworkflow-requirements 正本では、OpenNext Workers 形式は `main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets"` を前提とし、`pages_build_output_dir = ".next"` が残る場合は実行前ブロッカーとして扱う。本 workflow は Pages プロジェクト作成タスクだが、実 apply 前に次を必須判定する。

| 判定 | 条件 | 扱い |
| --- | --- | --- |
| GO | UT-05 が Pages 形式を明示採用し、`.next` deploy の例外理由を正本仕様に記録済み | Pages project create に進める |
| GO | UT-05 が OpenNext Workers 形式へ修正済み | Pages project create に進める |
| NO-GO | `pages_build_output_dir = ".next"` が残り、例外理由も OpenNext Workers 形式への修正もない | 実 apply を停止し、UT-05 へフィードバック |

## 受入条件 (AC)

- AC-1: production プロジェクト `ubm-hyogo-web` を `production_branch=main` で作成する手順が仕様化されている。
- AC-2: staging プロジェクト `ubm-hyogo-web-staging` を `production_branch=dev` で作成する手順が仕様化されている。
- AC-3: 両プロジェクトに `nodejs_compat` 互換性フラグが ON で適用される手順が仕様化されている。
- AC-4: `compatibility_date` を Workers 側 `2025-01-01` と整合させる手順が仕様化されている（同一値、または以降の同一値で揃える方針が明記）。
- AC-5: アップロード対象ディレクトリ（`.next` のままで OpenNext と整合するか、`.open-next/assets` + `_worker.js` 構造に切り替えるか）の判定基準が明文化され、必要なら UT-05 へフィードバックする条件が定義されている。
- AC-6: 命名規則「production = `<base>` / staging = `<base>-staging`」が明文化され、UT-27 へ引き渡す `CLOUDFLARE_PAGES_PROJECT` Variable の値が `<base>`（suffix なし）であることが固定されている。
- AC-7: Pages の Git 連携を OFF にする方針（GitHub Actions 主導 deploy と二重起動しない）が明文化されている。
- AC-8: `dev` push で staging プロジェクトに deploy 成功することを確認する手順が定義されている（実走は Phase 11 / 13）。
- AC-9: `main` push で production プロジェクトに deploy 成功することを確認する手順が定義されている（実走は Phase 11 / 13）。
- AC-10: 苦戦箇所 5 件（OpenNext アップロード先 / `production_branch` 落とし穴 / `compatibility_date` Workers 同期 / 命名揺れ / Pages 自動 Git 連携）が Phase 2 リスク表 R-1〜R-5 にマップされている。
- AC-11: 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 の双方で PASS 確認されている。
- AC-12: 上流タスク（01b / UT-05）完了確認が Phase 1（前提）/ Phase 2（依存順序）/ Phase 3（NO-GO 条件）の 3 箇所で重複明記されている。
- AC-13: API Token 値・Account ID 値・実プロジェクト URL を含む実行ログが payload / runbook / Phase outputs に転記されない方針が明文化されている。
- AC-14: `bash scripts/cf.sh` 経由で `wrangler` を呼び出す（直接 `wrangler` 実行禁止）が運用ルールとして明記されている。
- AC-15: Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致しており、Phase 1〜3 = `completed` / Phase 4〜13 = `pending`。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック（`wrangler pages project create` / Dashboard 操作系列） | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証（命名衝突 / branch 設定ミス / OpenNext 不整合 / Git 連携二重起動） | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md / handoff-to-ut27.md |
| 11 | 手動 smoke test（dev push → staging green / main push → production green / project list 確認） | phase-11.md | pending | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md |
| 13 | PR 作成 / ユーザー承認後 Pages プロジェクト作成実行 | phase-13.md | pending | outputs/phase-13/main.md / apply-runbook.md / verification-log.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / AC / 4 条件評価 / スコープ / 苦戦箇所 / NON_VISUAL 明記 / 上流 carry-over inventory） |
| 設計 | outputs/phase-02/main.md | 配置トポロジ / SubAgent lane / 命名規則 / `production_branch` 配線 / OpenNext アップロード判定 / `compatibility_date` 同期 / Git 連携方針 / コマンド草案 |
| レビュー | outputs/phase-03/main.md | 代替案比較（CLI / Dashboard / Terraform Cloudflare Provider / Pages Git 連携自動）/ PASS/MINOR/MAJOR 判定 / 着手可否ゲート / リスクと緩和策 |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー（Phase 4 以降の整備時に作成） |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Cloudflare Pages | dev/main それぞれの Web フロント配信先（staging / production） | 無料枠 |
| Cloudflare Workers (D1 binding) | API 側（本タスクの直接対象外、互換性同期参照のみ） | 無料枠 |
| `wrangler pages project create` | Pages プロジェクトの宣言的作成 | 無料 |
| `bash scripts/cf.sh` | `op run` で `CLOUDFLARE_API_TOKEN` を 1Password から動的注入する `wrangler` ラッパー | 無料 |
| OpenNext for Cloudflare | Next.js → Pages 出力の生成（`.open-next/`） | 無料 |
| GitHub Issue #48 | 本タスクの追跡 | 無料 |

## Pages プロジェクト命名・設定一覧

| 環境 | プロジェクト名 | `production_branch` | `compatibility_date` | `compatibility_flags` | アップロード対象（暫定） | Git 連携 |
| --- | --- | --- | --- | --- | --- | --- |
| production | `ubm-hyogo-web` | `main` | `2025-01-01` | `["nodejs_compat"]` | `.next`（OpenNext との整合性は Phase 2 で判定 / 必要なら `.open-next/...` へ切替を UT-05 にフィードバック） | OFF（GitHub Actions 主導） |
| staging | `ubm-hyogo-web-staging` | `dev` | `2025-01-01` | `["nodejs_compat"]` | 同上 | OFF |

> Variable `CLOUDFLARE_PAGES_PROJECT` には **production 名（suffix なし）= `ubm-hyogo-web`** を渡す。`web-cd.yml` 側で `${{ vars.CLOUDFLARE_PAGES_PROJECT }}-staging` と suffix 連結する設計と整合させる（既存 workflow 仕様）。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | D1 を触らない（Pages プロジェクト作成のみ）。違反なし |
| - | CLAUDE.md「`wrangler` 直接実行禁止 / `scripts/cf.sh` 経由」 | 本タスクのコマンド系列は `bash scripts/cf.sh ...` 経由で固定（AC-14） |
| - | CLAUDE.md「API Token 値・OAuth トークン値を出力やドキュメントに転記しない」 | AC-13 として明文化 |
| - | CLAUDE.md「ローカル `.env` には実値を絶対に書かない」 | プロジェクト ID / Account ID は payload / runbook / Phase outputs に転記しない方針で整合 |
| - | GAS prototype は本番バックエンド仕様に昇格させない | 本タスクの対象外（フロント/CD のみ） |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致（Phase 1〜3 = `completed` / Phase 4〜13 = `pending`）し、root / outputs `artifacts.json` parity が PASS
- `outputs/phase-01`〜`outputs/phase-13` の列挙済み成果物が実体として存在
- Phase 12 は `main.md` + 6 補助成果物（`phase12-task-spec-compliance-check.md` を含む）が存在
- AC-1〜AC-15 が Phase 1〜3 で全件カバー
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 上流タスク（01b / UT-05）完了確認が必須前提として 3 箇所（Phase 1 / 2 / 3）で重複明記
- 本ワークフローはタスク仕様書と Phase outputs 骨格の整備に閉じ、実プロジェクト作成は Phase 13 ユーザー承認後の別オペレーションで実施する旨を明文化

## 苦戦箇所・知見（親仕様 §「苦戦箇所・知見」写経）

**1. `@opennextjs/cloudflare` 採用時のアップロード先のぶれ**
`apps/web` は OpenNext を採用しているが、`apps/web/wrangler.toml` の `pages_build_output_dir = ".next"` と `web-cd.yml` の `pages deploy .next` は素の Next.js 流儀で書かれている。OpenNext は本来 `.open-next/assets/` + `_worker.js` 構造を生成するため、ランタイムで `_worker.js` が要求する形と素の `.next/` のままでは不整合を起こし得る。本タスクでアップロード対象ディレクトリを明示確定し、必要なら UT-05 にフィードバックする。

**2. `production_branch` の落とし穴**
production プロジェクトは `production_branch=main`、staging プロジェクトは `production_branch=dev` で別々に設定する必要がある。これを忘れると、Pages 側がブランチを「Preview」として扱い production スコープの環境変数・カスタムドメインを反映しない、URL が `<commit>.<project>.pages.dev` のプレビューエイリアスになる、といった事故が起きる。

**3. `compatibility_date` の Workers との同期**
`apps/api/wrangler.toml` で `compatibility_date = "2025-01-01"` / `compatibility_flags = ["nodejs_compat"]` としているため、Pages 側もこれに合わせる。バージョンがずれると Workers と Pages で `process` / `node:*` モジュールの可用性が変わり、共有 util を経由したコードが片側だけで壊れる事故になる。

**4. プロジェクト命名規則の固定**
命名は `production = ubm-hyogo-web` / `staging = ubm-hyogo-web-staging` のように suffix `-staging` 方式で統一する。Variable `CLOUDFLARE_PAGES_PROJECT` の値は production 名（suffix なし）に揃え、`web-cd.yml` 側で `${{ vars.X }}-staging` の suffix を連結する設計と整合させる。命名で揺れが出ると Variable 値とワークフロー内連結の両方を直す羽目になる。

**5. Pages の自動ブランチデプロイ機能との衝突**
Pages プロジェクトは Git 連携を ON にすると、Pages 側が独自に各ブランチを自動デプロイしようとする。本構成は GitHub Actions 主導での deploy を採用しているため、Git 連携は OFF のままにするか、production_branch だけに限定する必要がある。両方に任せると同一ブランチに対して二重 deploy が走り、ログが分散して原因追跡が困難になる。

## 関連リンク

- 上位 README: ../README.md
- 親タスク仕様: ../unassigned-task/UT-28-cloudflare-pages-projects-creation.md
- 関連タスク仕様（unassigned-task 配下）:
  - ../unassigned-task/UT-05-cicd-pipeline-implementation.md（仮）
  - ../unassigned-task/UT-27-github-secrets-variables-deployment.md
  - ../unassigned-task/UT-06-production-deployment.md（仮）
  - ../unassigned-task/UT-16-custom-domain.md（仮）
  - ../unassigned-task/UT-29-post-cd-smoke.md（仮）
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/48
- 参照 workflow: ../../../.github/workflows/web-cd.yml
- 参照 wrangler 設定: ../../../apps/web/wrangler.toml / ../../../apps/api/wrangler.toml
- 参照 OpenNext 設定: ../../../apps/web/open-next.config.ts
