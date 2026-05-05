# Phase 8 成果物: DRY 化 / リファクタリング（SSOT 集約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 8 / 13 |
| 作成日 | 2026-04-29 |
| タスク分類 | docs-only / specification-cleanup（DRY / SSOT） |

## 全体方針

Phase 1〜7 で抽出した workflow drift の差分について、`deployment-gha.md` / `deployment-cloudflare.md` / 05a observability-matrix.md / index.md / 各 phase-XX.md に分散する重複表記を **単一情報源 (SSOT)** に集約する DRY 化方針を確定する。本タスクは docs-only であり対象は仕様書側の表記のみ。yaml 自身の DRY 化（reusable-workflow / composite action）は impl 派生タスクで扱う。

## SSOT 表（5 軸 / 6 行）

| 軸 | SSOT（正本） | 参照側（参照のみ） | 集約方針 |
| --- | --- | --- | --- |
| workflow 名 | `deployment-gha.md` | index.md / phase-XX.md / 05a observability-matrix.md | `deployment-gha.md` の表が更新されたら参照側は link で参照 |
| job topology（typecheck / lint / build / verify-indexes / deploy） | `deployment-gha.md` | 同上 | 同上 |
| Node version | `.mise.toml`（Node 24.15.0） | `deployment-gha.md` が `.mise.toml` を参照、各 yaml で `node-version-file: .mise.toml` 推奨 | yaml に固定値直書きを避け `.mise.toml` 参照に統一 |
| pnpm version | `.mise.toml`（pnpm 10.33.2） / `package.json` `packageManager` | 同上 | 同上 |
| deploy target（Workers / Pages） | `deployment-cloudflare.md` | `apps/web/wrangler.toml` / `apps/api/wrangler.toml` / 05a / index.md | `deployment-cloudflare.md` が current contract を確定し、wrangler.toml はそれに整合 |
| Cron 表記 | `deployment-cloudflare.md` | wrangler.toml / 05a | cron 式を文字列で 1 か所に固定（例 `'0 */6 * * *'`） |

5 軸網羅、空セルなし。

## Before / After 比較テーブル（4 区分）

### 区分 1: workflow 名 / job 命名

| 対象 | Before（drift） | After（SSOT） | 理由 |
| --- | --- | --- | --- |
| apps/web の CD | `web-cd.yml` / `web-deploy.yml` 表記揺れ想定 | 実体 `web-cd.yml` に統一 | 実 yaml が正、仕様書側を更新 |
| apps/api の CI | `backend-ci.yml` / `api-ci.yml` 表記揺れ想定 | 実体 `backend-ci.yml` に統一 | 同上 |
| monorepo CI | `ci.yml` を「monorepo 全体 CI」と明示 | 同上 | 役割明文化 |
| build 検証 | `validate-build.yml` の役割が曖昧 | 「Workers ビルド成果物の検証」と明示 | `deployment-gha.md` で固定 |
| skill indexes | `verify-indexes.yml` の trigger 条件が散在 | `.claude/skills/aiworkflow-requirements/indexes` 変更時のみと明示 | `deployment-gha.md` に集約 |

### 区分 2: Node / pnpm version

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| Node 表記 | yaml ごとに `node-version: 24` / `24.15.0` / `>=24` 混在想定 | `node-version-file: .mise.toml` で単一参照 | `.mise.toml` を SSOT 化 |
| pnpm 表記 | `pnpm/action-setup@v4` で `version: 10` / `10.33.2` 混在想定 | `package.json` `packageManager` または `.mise.toml` 参照 | 単一値ソース |
| 仕様書側表記 | `deployment-gha.md` / index.md / phase-XX.md で個別記述 | `deployment-gha.md` のみ具体値、他は参照リンク | 表記揺れの根を断つ |

### 区分 3: deploy target / Pages vs Workers

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| apps/web deploy target | `pages_build_output_dir`（Pages 前提）vs `main = ".open-next/worker.js"`（Workers 前提）の混在 | 派生 `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` で current contract 確定後に `deployment-cloudflare.md` を SSOT 化 | 本タスクは判断委譲、After は派生タスクの確定値を後追い反映 |
| apps/api deploy target | Workers 単一（drift なし想定） | Workers 単一を `deployment-cloudflare.md` で明記 | 既に整合 |
| Cron 表記 | wrangler.toml と仕様書で個別記述 | `deployment-cloudflare.md` に cron 式の正本を集約 | 単一文字列 |

### 区分 4: endpoint / 設定キー

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| wrangler 設定キー | `pages_build_output_dir` / `main` / `[assets]` の意味散在 | `deployment-cloudflare.md` に「Pages 用」「Workers 用」「OpenNext on Workers 用」対応表を 1 つだけ置く | キー混乱の解消 |
| Secret 名 | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` の参照箇所散在 | `deployment-secrets-management.md` を SSOT として参照 | 既存 SSOT 再利用 |

4 区分（命名 / Node・pnpm / deploy target / endpoint・設定キー）すべて埋まっている。

## 重複コード（reusable / composite action）抽出候補

| # | 重複候補 | 抽出先（impl 派生で実装） | 他 workflow 転用可否 | 派生タスク ID |
| --- | --- | --- | --- | --- |
| 1 | `actions/checkout` + `mise install` + `pnpm install` の反復 | `.github/actions/setup-node-pnpm/action.yml`（composite action） | 可（全 workflow） | `UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP` |
| 2 | typecheck / lint / build の reusable job | `.github/workflows/_reusable-quality.yml` | 可（ci.yml / backend-ci.yml） | `UT-CICD-DRIFT-IMPL-REUSABLE-QUALITY` |
| 3 | wrangler deploy step（API token 注入 + esbuild 解決） | `.github/actions/cf-deploy/action.yml` | 可（apps/web / apps/api 両方） | （新規候補・`scripts/cf.sh` と整合する composite） |
| 4 | skill indexes drift 検出 | `verify-indexes.yml` 既存（reusable 化候補） | 限定的 | `UT-CICD-DRIFT-IMPL-VERIFY-INDEXES-TRIGGER` |
| 5 | concurrency / cancel-in-progress 設定 | yaml フラグメントとして共通化（YAML anchor は GHA 非対応のため reusable workflow inputs で代用） | 可 | （新規候補） |

5 件で要件 4 件以上を満たす。各候補は impl 派生タスクとして起票方針に紐付け済み。

## navigation drift 確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の `outputs/phase-XX/...` 参照 | `rg "outputs/phase-"` で突合 | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル名 | `ls phase-*.md` | 完全一致 |
| index.md `主要成果物` 表のパス | artifacts.json と突き合わせ | 完全一致 |
| phase-XX.md 内の `../phase-YY.md` 相対参照 | 全件確認 | リンク切れ 0 |
| 原典 unassigned-task | `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md` | 実在確認 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/deployment-*.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/58` | 200 OK / CLOSED |
| 05a 監視対象 link | `docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` | 実在 |

navigation drift = 0 を Phase 11 / 12 で確認・維持する。

## 共通化パターン

- 命名規則: snake_case（DB） / camelCase（TS） / PascalCase（型） / kebab-case（ファイル・workflow yaml）の住み分け徹底
- workflow 名は実 yaml ファイル名を SSOT とする（仕様書側を yaml に合わせる、yaml を仕様書に合わせない）
- 4条件は「価値性 / 実現性 / 整合性 / 運用性」の順序固定
- AC ID は `AC-1`〜`AC-11` のハイフン区切りで統一
- Pages vs Workers 表記は「current contract」「target contract」を明示し、混在時は派生タスク化

## 削除対象一覧

- 旧 workflow 名（仕様書側に残った `web-deploy.yml` 等の幻想表記）
- `apps/web/wrangler.toml` 内の不要 binding コメントアウト（impl 派生で cleanup）
- 仕様書内の Node / pnpm 固定値直書き（`.mise.toml` 参照に置換）
- Pages 前提のみで書かれた古い記述（OpenNext on Workers 確定後に impl 派生で削除）

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 9 | DRY 化済みの命名・SSOT を品質保証チェックリストの前提に使用 |
| Phase 10 | navigation drift 0 / SSOT 集約完了を GO/NO-GO 根拠に使用 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に SSOT 集約結果を反映 |
| 派生 UT-CICD-DRIFT-IMPL-* | reusable / composite action 候補を引き渡し |
| UT-GOV-001 | required_status_checks 名と SSOT 化 workflow 名の整合確認 |

## 多角的チェック観点

- 価値性: SSOT 化により 05a / branch protection / CODEOWNERS との整合が単一更新で完結
- 実現性: docs-only に閉じる範囲で集約方針を確定、yaml 変更は派生タスクへ委譲済み
- 整合性: 不変条件 #5 / #6 が SSOT に明文化される
- 運用性: Node / pnpm 単一値ソース化で `.mise.toml` 変更時の追従コストが激減
- 認可境界: workflow 注入 Secret 名は `deployment-secrets-management.md` SSOT 参照、新規導入なし
- 無料枠: docs-only のため CI 実行コストへの影響なし

## 完了条件チェック

- [x] SSOT 表が 5 軸（workflow 名 / job topology / Node / pnpm / deploy target / Cron）で埋まっている
- [x] Before / After 比較テーブルが 4 区分（命名 / Node・pnpm / deploy target / endpoint）で埋まっている
- [x] 重複コード抽出候補が 4 件以上（5 件）、impl 派生タスク名付きで列挙
- [x] navigation drift 0 を確認方法とともに記述
- [x] Node / pnpm 単一値ソース（`.mise.toml`）への集約方針を記述
- [x] 本ドキュメント `outputs/phase-08/main.md` 作成済み

## 次 Phase への引き渡し

- SSOT 5 軸確定表を Phase 9 secret hygiene / 無料枠評価の前提として参照
- 重複抽出 reusable / composite action 候補を impl 派生タスクで起票
- navigation drift 0 状態を Phase 9 link 検証で再確認
- ブロック条件: SSOT / Before・After 空セル残存 / navigation drift 残存 / Pages vs Workers 派生タスク化方針未確定
