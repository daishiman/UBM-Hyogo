# Phase 1 成果物: 要件定義 (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup |
| Phase | 1 / 13（要件定義） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| タスク種別 | docs-only / specification-cleanup |
| visualEvidence | NON_VISUAL |
| scope | CI/CD workflow topology と deployment spec の drift cleanup。task docs と承認済み aiworkflow-requirements 正本 docs のみを対象とし、実装変更は `UT-CICD-DRIFT-IMPL-*` へ分離 |
| workflow_state | spec_created |
| GitHub Issue | #58 (CLOSED, 再オープンしない) |

---

## 1. 真の論点 (true issue)

本タスクは「workflow yaml を直すタスク」ではなく、**「正本仕様 docs / 現行 yaml code / 05a 監視前提の三者の drift を一覧化し、docs-only で閉じる差分と impl 派生タスクで扱う差分を厳密に分離するタスク」** である。

副次的論点として、Pages build budget 監視前提（05a）と OpenNext Workers 方針（deployment-cloudflare.md）の二系統が混在している現状で、どちらを current contract として正本化するかの判断材料を提示すること（実 cutover は派生タスクへ委譲）。

---

## 2. 4 条件評価（全 PASS）

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 05a / UT-GOV-001 / UT-26 の前提を整合させる起点になり、後段タスクの誤作動（存在しない workflow を監視する等）を未然防止する |
| 実現性 | PASS | docs-only / 既存 yaml の参照のみで完結。新規実装・新規 Secret は不要。CI 実行コスト・Cloudflare 利用増加もゼロ |
| 整合性 | PASS | 不変条件 #5（D1 アクセスは apps/api 限定）/ #6（GAS prototype 除外）を侵さず、impl 必要差分は派生タスクへ明示分離する |
| 運用性 | PASS | Phase 12 で派生タスク起票方針を残すため、impl 必要差分の運用引き継ぎが明確 |

---

## 3. 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 05a observability and cost guardrails | 監視対象 workflow の名称・期待 topology が記録済み（observability-matrix.md） | drift 整理の起点 |
| 上流 | aiworkflow-requirements skill (`deployment-gha.md` / `deployment-cloudflare.md`) | 正本仕様の現状記述 | drift 比較の基準として参照 |
| 並列 | UT-GOV-001（branch protection） | required_status_checks 登録予定の workflow 名 | 整合した workflow 名一覧を提供 |
| 並列 | UT-GOV-003（CODEOWNERS） | `.github/workflows/**` の owner 宣言 | 名称が CODEOWNERS と一致することを担保 |
| 下流 | UT-CICD-DRIFT-IMPL-*（派生 implementation タスク） | impl 必要差分の一覧 | 起票方針・差分内容・受入条件を渡す |
| 下流 | UT-26（staging-deploy-smoke） | 修正後 workflow 名で smoke を回す前提 | 確定した workflow 名一覧 |

---

## 4. workflow 棚卸し（5 項目: Node / pnpm / job / trigger / deploy target）

`.github/workflows/` 配下の実体（5 ファイル）を逐語抽出した結果。

| ファイル | Node | pnpm | jobs | trigger | deploy target |
| --- | --- | --- | --- | --- | --- |
| `backend-ci.yml` | `'24'` | `10.33.2` | `deploy-staging` (if dev) / `deploy-production` (if main) | `push: [dev, main]` | Cloudflare Workers (`apps/api`)：`wrangler-action@v3` で `d1 migrations apply` → `deploy --env staging|production`。wranglerVersion `4.85.0` |
| `ci.yml` | `'24'` | `10.33.2` | `ci`（typecheck + lint）/ `coverage-gate`（continue-on-error: true、PR1/3 soft gate） | `push: [main, dev]` / `pull_request: [main, dev]` | （deploy なし。CI 専用。bootstrapped readiness check で skip 可） |
| `validate-build.yml` | `'24'` | `10.33.2` | `validate-build`（`pnpm build`） | `push: [main, dev]` / `pull_request: [main, dev]` | （deploy なし。build 検証専用） |
| `verify-indexes.yml` | `'24'` | `10.33.2` | `verify-indexes-up-to-date`（`pnpm indexes:rebuild` → `git diff --exit-code`） | `push: [main]` / `pull_request: [main, dev]` | （deploy なし。skill indexes drift 検出） |
| `web-cd.yml` | `'24'` | `10.33.2` | `deploy-staging` (if dev) / `deploy-production` (if main) | `push: [dev, main]` | **Cloudflare Pages**（`apps/web`）：`pages deploy .next --project-name=...`。wranglerVersion `4.85.0` |

補足:

- 全 workflow が `actions/setup-node@v4`（`node-version: '24'`）+ `pnpm/action-setup@v4`（`version: 10.33.2`）で統一済み。
- `wrangler-action@v3` の `wranglerVersion` は backend-ci/web-cd 双方で `4.85.0`。
- `concurrency` group は backend-ci / verify-indexes / web-cd に設定済み（cancel-in-progress: true）。
- ci.yml の `coverage-gate` job は `continue-on-error: true`（PR1/3 soft gate、PR3/3 で hard gate 化予定）。

---

## 5. 正本仕様（docs）逐語引用

### 5.1 `deployment-gha.md` — workflow 関連箇所

> **ワークフロー構成**:
>
> | ファイル | 用途 |
> | -------- | ---- |
> | `ci.yml` | PR 時の CI（Lint・型チェック・テスト・ビルド） |
> | `web-cd.yml` | Web アプリ CD（dev: staging / main: production 自動デプロイ + Discord 通知） |
> | `backend-ci.yml` | API アプリ CD（dev: staging / main: production 自動デプロイ + Discord 通知） |

> **CI 実行ステップ**:
>
> 2. pnpm のセットアップ（バージョン: 9.x）
> 3. Node.js のセットアップ（バージョン: 22.x LTS）

> **CD 実行内容**（web-cd.yml）:
>
> 1. ブランチに応じて Cloudflare Pages へ自動デプロイ（`cloudflare/wrangler-action@v3`）
> 2. デプロイ完了後、Discord Webhook で通知を送信

> **Backend CD 実行内容**（backend-ci.yml）:
>
> 1. D1 migrations apply を先に実行して、スキーマ変更を反映する
> 2. ブランチに応じて Cloudflare Workers へ自動デプロイ（`wrangler deploy`）
> 3. デプロイ完了後、Discord Webhook で通知を送信

注: deployment-gha.md は `validate-build.yml` / `verify-indexes.yml` を **明示的に列挙していない**（drift 候補）。

### 5.2 `deployment-cloudflare.md` — deploy target 関連箇所

> **Pages 形式と OpenNext Workers 形式の判定**
>
> | wrangler.toml の特徴 | 判定 | UT-06 での扱い |
> | --- | --- | --- |
> | `pages_build_output_dir = ".next"` | Pages 形式 | OpenNext Workers AC とは非整合。移行または AC 再定義が必要 |
> | `main = ".open-next/worker.js"` + `[assets] directory = ".open-next/assets"` | OpenNext Workers 形式 | UT-06 AC-1 の前提を満たす |

> **Cloudflare Workers デプロイ（Next.js / OpenNext）** wrangler.toml 例:
>
> ```toml
> name = "ubm-hyogo-web"
> main = ".open-next/worker.js"
> compatibility_date = "2026-04-26"
> [assets]
> directory = ".open-next/assets"
> binding = "ASSETS"
> ```

> **デプロイフロー（web-cd.yml）**:
>
> ```
> push to main
>   → Validate Build（型チェック・Lint・ビルド）
>   → Deploy to Cloudflare Pages（wrangler-action）
>   → Discord 通知
> ```

注: deployment-cloudflare.md は **OpenNext Workers 形式を期待値として記述する一方、web-cd.yml フローは「Cloudflare Pages へのデプロイ」を記述**しており、本ドキュメント内で二系統が混在している。

### 5.3 `apps/web/wrangler.toml` 実体

```toml
name = "ubm-hyogo-web"
pages_build_output_dir = ".next"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
```

→ deployment-cloudflare.md の判定マトリクスに従えば **「Pages 形式」**。OpenNext Workers 期待値（`main = ".open-next/worker.js"`）とは非整合。

### 5.4 `apps/api/wrangler.toml` 実体

- `main = "src/index.ts"`、D1 binding `DB`（prod / staging 両 env 設定済み）
- 不変条件 #5 整合: D1 binding は `apps/api` のみ。`apps/web/wrangler.toml` には D1 binding なし。

---

## 6. 05a 監視前提の引用

`docs/30-workflows/completed-tasks/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` より監視対象 workflow 名:

| 環境 | 観測対象 | 確認先（workflow 名） |
| --- | --- | --- |
| dev (staging) | GitHub Actions CI runs | `ci.yml` |
| main (production) | GitHub Actions build validation | `validate-build.yml` |
| main (production) | GitHub Actions typecheck / lint | `ci.yml` |

また Cloudflare 側監視対象:

- **Pages builds**（500ビルド/月）: 「現行 `apps/web/wrangler.toml` は `pages_build_output_dir = ".next"` を持つため、05a では Pages builds を初回監視対象に含める。正本仕様に残る OpenNext Workers 方針との差分整理は `task-ref-cicd-workflow-topology-drift-001` で扱う」と 05a 内に明記。
- Workers requests / D1 reads/writes/storage / KV / R2 各種無料枠を監視対象として登録。

注: 05a は `web-cd.yml` / `backend-ci.yml` / `verify-indexes.yml` を **環境別観測対象に列挙していない**（drift 候補）。

---

## 7. 既存規約・既存記述の確認結果

| 観点 | 確認対象 | 現状把握 |
| --- | --- | --- |
| 現行 workflow 一覧 | `.github/workflows/*.yml` | 5 ファイル: backend-ci / ci / validate-build / verify-indexes / web-cd |
| Node / pnpm バージョン | 各 yaml | 全 yaml で Node 24 / pnpm 10.33.2 統一 |
| trigger | 各 yaml の `on:` | push / pull_request の組合せ。schedule / workflow_dispatch は未使用 |
| deploy target | web-cd.yml / wrangler.toml | web-cd.yml は `pages deploy`（Pages）、wrangler.toml も `pages_build_output_dir = ".next"`（Pages 形式） |
| 正本仕様記述 | deployment-gha.md / deployment-cloudflare.md | gha.md は Node 22 / pnpm 9.x と記載（実体と乖離）。cloudflare.md は OpenNext Workers と Pages が混在 |
| 監視対象 | observability-matrix.md | ci.yml / validate-build.yml のみ列挙、web-cd.yml / backend-ci.yml / verify-indexes.yml は未列挙 |

---

## 8. AC 一覧（index.md と完全一致 / AC-1〜AC-11）

- **AC-1**: `.github/workflows/` 配下の全 yaml が棚卸しされ、Node / pnpm / job / trigger / deploy target が表に固定されている → 本ドキュメント §4 で達成
- **AC-2**: `deployment-gha.md` 記述と current facts の差分マトリクスが作成され、各差分が「docs-only」「impl 必要」のいずれかに分類されている → Phase 2 で実施
- **AC-3**: `deployment-cloudflare.md` の Pages / Workers / OpenNext 方針と `apps/web/wrangler.toml` 実体の照合結果が表に記載されている → Phase 2 で実施（§5.3 で初出整理）
- **AC-4**: 05a の cost guardrail 監視対象がすべて実在する workflow を指していることを確認、または存在しない workflow への参照が「impl 必要」差分として明示されている → Phase 2 で実施
- **AC-5**: Pages build budget 監視前提と OpenNext Workers 方針のどちらを current contract とするかの判断材料（メリデメ・整合性）が Phase 2 で整理されている → Phase 2 で実施
- **AC-6**: docs-only 差分は本タスク内で正本仕様の更新案として記述されている（実体ファイルの編集は Phase 12 で実施） → Phase 2 / 12 で実施
- **AC-7**: impl 必要差分はすべて `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の起票方針として Phase 2 で列挙されている → Phase 2 で実施
- **AC-8**: 4条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定が PASS である → §2 で全 PASS 確定
- **AC-9**: 不変条件 #5（D1 への直接アクセスは `apps/api` に閉じる）に違反する workflow 構成が存在しないことを確認している → §5.4 で確認済み（`apps/web/wrangler.toml` に D1 binding なし、web-cd.yml に D1 操作なし）
- **AC-10**: 検証コマンド（`rg -n "node-version|pnpm|web-cd|ci.yml|validate-build|wrangler|pages_build_output_dir" .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails`）の出力に基づく差分根拠が記録されている → §4–§6 で逐語引用済み
- **AC-11**: GitHub Issue #58 が CLOSED 状態のまま、本タスク仕様書が成果物として参照可能になっている → 本ドキュメントを成果物として配置済み、Issue 再オープンせず

---

## 9. 不変条件 touched の確認

| # | 不変条件 | 確認結果 |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | `apps/web/wrangler.toml` に D1 binding なし。web-cd.yml に D1 操作なし。backend-ci.yml の `d1 migrations apply` は `workingDirectory: apps/api`。**違反なし** |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 全 workflow に GAS prototype を deploy 対象とするステップなし。`apps/api` / `apps/web` のみが deploy 対象。**違反なし** |

---

## 10. 多角的チェック結果

- 不変条件 #5 / #6: §9 で確認、違反なし
- docs-only / impl 境界: Phase 2 で判別ルール 5 件として固定（本 Phase はインプット整理のみ）
- CLOSED Issue 取扱: GitHub Issue #58 は CLOSED 維持、本仕様書側に番号のみ記録（§メタ情報）
- 派生タスク方針: impl 必要差分は Phase 2 で `UT-CICD-DRIFT-IMPL-NNN-<slug>` 命名規則で列挙
- required_status_checks 整合: UT-GOV-001 と並列して workflow 名（`ci`、`Validate Build`、`verify-indexes-up-to-date`、`backend-ci`、`web-cd`）の整合を Phase 2/11 で確認

---

## 11. 実行タスク完了状況

| # | サブタスク | 状態 | 出力箇所 |
| --- | --- | --- | --- |
| 1 | 真の論点を「drift 分類タスク」に再定義 | done | §1 |
| 2 | 依存境界（上流 2 / 並列 2 / 下流 2）の固定 | done | §3 |
| 3 | 4条件評価 PASS 確定 | done | §2 |
| 4 | 不変条件 #5 / #6 の touched 確認 | done | §9 |
| 5 | AC-1〜AC-11 の確定 | done | §8 |
| 6 | workflow 棚卸し結果の表化 | done | §4 |
| 7 | 正本仕様 / 監視前提の引用 | done | §5 / §6 |

---

## 12. 次 Phase への引き渡し

- 次 Phase: 2 (設計：差分マトリクス設計)
- 引き継ぎインプット:
  - 真の論点 = 三者（docs / code / 監視前提）の drift 分類
  - 4 条件評価 (全 PASS) の根拠
  - workflow 棚卸し結果 5 項目（§4）
  - 正本仕様の逐語引用と乖離箇所（§5）
  - 05a 監視対象一覧と未列挙 workflow（§6）
  - 並列タスク UT-GOV-001 / UT-GOV-003 との interface 整合の必要性
  - CLOSED Issue #58 の取り扱い方針（再オープン禁止）
- ブロック条件: なし（4 条件全 PASS、AC-1〜AC-11 を index.md と完全一致で固定済み）

---

## 13. 暫定 drift 候補（Phase 2 への入力）

Phase 1 での発見事項を Phase 2 の差分マトリクス入力として列挙。

| 候補 ID | 検出元 | 期待値（docs） | 実体値（code/obs） | 暫定分類 |
| --- | --- | --- | --- | --- |
| D1 | docs vs code | deployment-gha.md: Node 22.x / pnpm 9.x | 全 yaml: Node 24 / pnpm 10.33.2 | docs-only（仕様書を実体に同期） |
| D2 | docs vs code | deployment-gha.md: workflow 一覧に `validate-build.yml` / `verify-indexes.yml` が未列挙 | 実体は 5 ファイル | docs-only（仕様書を補完） |
| D3 | docs vs code | deployment-cloudflare.md: OpenNext Workers 形式（`main = ".open-next/worker.js"`）期待 | apps/web/wrangler.toml は Pages 形式（`pages_build_output_dir = ".next"`） | 判断保留（派生）→ Pages vs Workers 決定タスク |
| D4 | docs vs code | deployment-gha.md: web-cd.yml は Cloudflare Pages デプロイ + Discord 通知 | web-cd.yml は Pages デプロイは存在するが Discord 通知ステップなし | docs-only または impl（後者は Discord 通知ステップ追加） |
| D5 | docs vs code | deployment-gha.md: backend-ci.yml は Discord 通知含む | backend-ci.yml に Discord 通知ステップなし | docs-only または impl（同上） |
| D6 | obs vs code | observability-matrix.md は `ci.yml` / `validate-build.yml` のみ環境別観測対象に列挙 | 実在 workflow は 5 ファイル（web-cd / backend-ci / verify-indexes が未登録） | docs-only（観測対象表を補完）または別タスク（05a 側更新は本タスク対象外） |
| D7 | docs vs code | deployment-cloudflare.md は web-cd.yml が Pages へ deploy と記述 | 同記述と実体は整合（ただし OpenNext 方針と食い違い） | D3 と同根の混在（判断保留） |
| D8 | docs vs code | deployment-gha.md: CI に Vitest テスト + Codecov 80% 閾値ゲート記述 | ci.yml の `coverage-gate` job は continue-on-error: true（soft gate）、Vitest 直接実行は ci ジョブ内になし | docs-only（PR1/3 段階記述）または impl（hard gate 化） |
