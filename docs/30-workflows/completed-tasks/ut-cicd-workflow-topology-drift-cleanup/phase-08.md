# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（DRY / single source of truth 集約） |

## 目的

Phase 1〜7 で抽出した workflow drift の差分マトリクスにおいて、重複表記（同一の workflow 名・Node version・pnpm version・deploy target 名・Cron 表記）が `deployment-gha.md` / `deployment-cloudflare.md` / 05a observability-matrix.md / index.md / 各 phase-XX.md に分散している状態を整理し、**単一情報源 (SSOT)** に集約する DRY 化方針を確定する。本タスクは docs-only であり、対象は仕様書側の表記のみ。workflow yaml そのものの DRY 化（reusable-workflow への切り出し等）は impl 派生タスクで扱う。

## 実行タスク

1. Phase 1〜7 の仕様書 / outputs / index.md / artifacts.json / 正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）を横断 grep し、重複表記を洗い出す（完了条件: 重複件数が表化されている）。
2. SSOT を確定する。`deployment-gha.md` を「workflow 名 / Node / pnpm / job topology」の正本、`deployment-cloudflare.md` を「deploy target / Pages vs Workers 方針 / Cron / wrangler 設定」の正本として固定する（完了条件: SSOT 表が 5 軸で完成）。
3. 命名揺れ（`web-cd.yml` / `web-deploy.yml`、`backend-ci` / `api-ci`、`pages_build_output_dir` / `pages-build-output-dir` 等）を抽出し、After 表記に統一する（完了条件: Before/After 表で揺れ件数 0）。
4. Node version / pnpm version 表記を `mise.toml` 由来の単一値（Node 24.15.0 / pnpm 10.33.2）に集約する方針を記述する（完了条件: 各 workflow の表記揺れが Phase 12 更新案として 1 つに収束）。
5. navigation drift（artifacts.json `phases[*].outputs` × 各 phase-XX.md × index.md `Phase 一覧` × 実 path）が 0 であることを確認する（完了条件: drift 0）。
6. 重複コード（reusable workflow / composite action）の抽出可否を判定し、impl 派生タスクの候補に列挙する（完了条件: 抽出候補が 4 件以上、転用可否付き）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/index.md | 用語・命名の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | workflow topology SSOT |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | deploy target SSOT |
| 必須 | .github/workflows/*.yml | current facts の実体 |
| 必須 | apps/web/wrangler.toml / apps/api/wrangler.toml | deploy target 実体 |
| 必須 | .mise.toml | Node / pnpm version の単一値起点 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | DRY 化フォーマット参照事例 |

## SSOT（単一情報源）集約方針

| 軸 | SSOT（正本） | 参照側（参照のみ） | 集約方針 |
| --- | --- | --- | --- |
| workflow 名 | `deployment-gha.md` | index.md / phase-XX.md / 05a observability-matrix.md | `deployment-gha.md` の表が更新されたら参照側は link で参照のみ |
| job topology（typecheck / lint / build / verify-indexes / deploy） | `deployment-gha.md` | 同上 | 同上 |
| Node version | `.mise.toml` (Node 24.15.0) | `deployment-gha.md` が `.mise.toml` を参照、各 workflow yaml で `node-version-file: .mise.toml` 推奨 | yaml に固定値直書きを避け、`.mise.toml` を参照する形へ統一 |
| pnpm version | `.mise.toml` (pnpm 10.33.2) | 同上 | 同上 |
| deploy target（Workers / Pages） | `deployment-cloudflare.md` | `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / 05a / index.md | `deployment-cloudflare.md` が Pages vs Workers の current contract を確定し、wrangler.toml はそれに整合 |
| Cron 表記 | `deployment-cloudflare.md` | wrangler.toml / 05a | cron 式を文字列で 1 か所に固定（例 `'0 */6 * * *'`） |

## Before / After 比較テーブル

### workflow 名 / job 命名

| 対象 | Before（drift） | After（SSOT） | 理由 |
| --- | --- | --- | --- |
| apps/web の CD | `web-cd.yml` / `web-deploy.yml` 表記揺れ想定 | 実体 `web-cd.yml` に統一（`deployment-gha.md` 側を current facts に同期） | 実 yaml が正、仕様書側を更新 |
| apps/api の CI | `backend-ci.yml` / `api-ci.yml` 表記揺れ想定 | 実体 `backend-ci.yml` に統一 | 同上 |
| monorepo CI | `ci.yml` を「monorepo 全体 CI」と明示 | 同上 | 役割を明文化 |
| build 検証 | `validate-build.yml` の役割が曖昧 | 「Workers ビルド成果物の検証」と明示 | 役割を `deployment-gha.md` で固定 |
| skill indexes | `verify-indexes.yml` の trigger 条件が散在 | `.claude/skills/aiworkflow-requirements/indexes` 変更時のみと明示 | `deployment-gha.md` に集約 |

### Node / pnpm version

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Node 表記 | yaml ごとに `node-version: 24` / `24.15.0` / `>=24` 混在想定 | `node-version-file: .mise.toml` で単一参照 | `.mise.toml` を SSOT 化 |
| pnpm 表記 | `pnpm/action-setup@v4` で `version: 10` / `10.33.2` 混在想定 | `package.json` の `packageManager` フィールドまたは `.mise.toml` を参照 | 単一値ソース |
| 仕様書側表記 | `deployment-gha.md` / index.md / phase-XX.md で個別記述 | `deployment-gha.md` のみが具体値、他は参照リンク | 表記揺れの根を断つ |

### deploy target / Pages vs Workers

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| apps/web deploy target | `pages_build_output_dir`（Pages 前提） vs `main = ".open-next/worker.js"`（Workers 前提）の混在 | 派生タスク `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` で current contract 確定後に `deployment-cloudflare.md` を SSOT 化 | 本タスクは判断委譲、After は派生タスクでの確定値を後追いで反映 |
| apps/api deploy target | Workers 単一（drift なし想定） | Workers 単一を `deployment-cloudflare.md` で明記 | 既に整合 |
| Cron 表記 | wrangler.toml と仕様書で個別記述 | `deployment-cloudflare.md` に cron 式の正本を集約 | 単一文字列 |

### endpoint / 設定キー

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| wrangler 設定キー | `pages_build_output_dir` / `main` / `[assets]` の意味が散在 | `deployment-cloudflare.md` に「Pages 用」「Workers 用」「OpenNext on Workers 用」の対応表を 1 つだけ置く | キー混乱の解消 |
| Secret 名 | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の参照箇所が散在 | `deployment-secrets-management.md` を SSOT として参照 | 既存 SSOT を再利用 |

## 重複コード（reusable workflow / composite action）抽出候補

| # | 重複候補 | 抽出先（impl 派生タスクで実装） | 他 workflow 転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `actions/checkout` + `mise install` + `pnpm install` の反復 | `.github/actions/setup-node-pnpm/action.yml`（composite action） | 可（全 workflow で使用） | impl 派生タスク `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP` で起票 |
| 2 | typecheck / lint / build の reusable job | `.github/workflows/_reusable-quality.yml` | 可（ci.yml / backend-ci.yml で再利用） | impl 派生タスク `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY` で起票 |
| 3 | wrangler deploy step（API token 注入 + esbuild 解決） | `.github/actions/cf-deploy/action.yml` | 可（apps/web / apps/api 両方） | `scripts/cf.sh` と整合する composite |
| 4 | skill indexes drift 検出 | `verify-indexes.yml` 既存（reusable 化候補） | 限定的 | `pnpm indexes:rebuild` を呼ぶ単一 step を切り出し |
| 5 | concurrency / cancel-in-progress 設定 | yaml フラグメントとして共通化（YAML anchor は GHA 非対応のため reusable workflow inputs で代用） | 可 | 派生タスク化 |

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の `outputs/phase-XX/...` 参照 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | ls | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の `../phase-YY.md` 相対参照 | 全件確認 | リンク切れ 0 |
| 原典 unassigned-task への参照 | `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md` 実在確認 | 実在 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/deployment-*.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/58` | 200 OK / CLOSED |
| 05a 監視対象 link | `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | 実在 |

## 共通化パターン

- 命名: snake_case（DB） / camelCase（TS） / PascalCase（型） / kebab-case（ファイル・workflow yaml）の住み分け徹底。
- workflow 名は実 yaml ファイル名を SSOT とする（仕様書側を yaml に合わせる、yaml を仕様書に合わせない）。
- 4条件は「価値性 / 実現性 / 整合性 / 運用性」の順序固定。
- AC ID は `AC-1`〜`AC-11` のハイフン区切りで統一。
- Pages vs Workers 表記は「current contract」「target contract」を明示し、混在時は派生タスク化。

## 削除対象一覧

- 旧 workflow 名（仕様書側に残った `web-deploy.yml` 等の幻想表記）。
- `apps/web/wrangler.toml` 内の不要 binding コメントアウト（impl 派生タスクで cleanup）。
- 仕様書内の Node / pnpm 固定値直書き（後段で `.mise.toml` 参照に置換）。
- Pages 前提のみで書かれた古い記述（OpenNext on Workers 方針確定後に impl 派生で削除）。

## 実行手順

### ステップ 1: 重複表記の洗い出し
- `rg -n "node-version|pnpm|web-cd|web-deploy|backend-ci|pages_build_output_dir|opennext" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup .claude/skills/aiworkflow-requirements/references` を実行。
- 重複を表化。

### ステップ 2: SSOT 表の作成
- 5 軸（workflow 名 / job topology / Node / pnpm / deploy target / Cron）で SSOT を確定。

### ステップ 3: Before / After 比較テーブル作成
- 4 区分（命名 / Node・pnpm / deploy target / endpoint・設定キー）で記述。

### ステップ 4: 重複コード抽出候補の特定
- 4 件以上の reusable / composite action 候補を列挙し、impl 派生タスク名を付与。

### ステップ 5: navigation drift 確認
- artifacts.json と各 phase-XX.md / index.md の path を照合。
- リンク切れ 0 を確認。

### ステップ 6: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済みの命名・SSOT を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 / SSOT 集約完了を GO/NO-GO の根拠に使用 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に SSOT 集約結果を反映 |
| 派生タスク UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP 等 | reusable / composite action 候補を引き渡し |
| UT-GOV-001 | required_status_checks 名と SSOT 化された workflow 名の整合確認 |

## 多角的チェック観点

- 価値性: SSOT 化により、05a cost guardrail・branch protection・CODEOWNERS との整合が単一更新で完結する。
- 実現性: docs-only に閉じる範囲で集約方針を確定でき、yaml 変更は派生タスクに委譲済み。
- 整合性: 不変条件 #5（D1 access apps/api 内閉鎖）と #6（GAS prototype 非昇格）が SSOT に明文化される。
- 運用性: Node / pnpm 単一値ソース化で `.mise.toml` 変更時の追従コストが激減。
- 認可境界: workflow に注入される Secret 名は `deployment-secrets-management.md` SSOT を参照、本タスクで新規導入なし。
- 無料枠: docs-only のため CI 実行コストへの影響なし。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 重複表記の洗い出し | 8 | spec_created | rg で網羅 |
| 2 | SSOT 5 軸の確定 | 8 | spec_created | deployment-gha.md / deployment-cloudflare.md |
| 3 | Before / After 4 区分 | 8 | spec_created | 命名 / Node・pnpm / target / endpoint |
| 4 | 重複コード抽出候補 4 件以上 | 8 | spec_created | impl 派生タスク化 |
| 5 | navigation drift 確認 | 8 | spec_created | リンク切れ 0 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 全項目集約 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（SSOT 表・Before/After・重複抽出・navigation drift） |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] SSOT 表が 5 軸（workflow 名 / job topology / Node / pnpm / deploy target / Cron）で埋まっている
- [ ] Before / After 比較テーブルが 4 区分（命名 / Node・pnpm / deploy target / endpoint）で埋まっている
- [ ] 重複コード抽出候補が 4 件以上、impl 派生タスク名付きで列挙されている
- [ ] navigation drift（artifacts.json / index.md / phase-XX.md / outputs path）が 0
- [ ] Node / pnpm 単一値ソース（`.mise.toml`）への集約方針が記述されている
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物が `outputs/phase-08/main.md` に配置予定
- SSOT 5 軸網羅
- Before / After 4 区分網羅
- 重複抽出 4 件以上
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - SSOT 5 軸の確定表（Phase 9 secret hygiene / 無料枠評価の前提として参照）
  - 重複抽出 reusable / composite action 候補（impl 派生タスクで起票）
  - navigation drift 0 状態の維持（Phase 9 link 検証で再確認）
- ブロック条件:
  - SSOT 表に空セルが残る
  - Before / After に空セルが残る
  - navigation drift が 0 にならない
  - Pages vs Workers の派生タスク化方針が確定していない
