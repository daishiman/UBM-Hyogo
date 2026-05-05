# Phase 11 成果物: 手動 smoke 実行サマリー (UT-CICD-DRIFT)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスクID | UT-CICD-DRIFT |
| Phase | 11 / 13（手動 smoke test） |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（manual smoke / NON_VISUAL） |
| 前 Phase 判定 | Phase 10 GO（PASS） |

## NON_VISUAL 整合宣言

- 本タスクは UI / runtime 挙動を一切伴わない docs-only タスクである。
- `outputs/phase-11/screenshots/` ディレクトリは作成していない（NON_VISUAL 整合）。
- 一次証跡は `manual-smoke-log.md`（rg / gh の stdout）と `link-checklist.md`（リンク死活）。

## 検証サマリー（docs-only 検証マトリクス）

| 種別 | チェック対象 | 結果 | 主な根拠 | ログ参照 |
| --- | --- | --- | --- | --- |
| rg 棚卸し | `.github/workflows/*.yml` | **PASS** | 全 5 yaml が `node-version: '24'` / `pnpm/action-setup@v4` / `actions/checkout@v4` / `actions/setup-node@v4` で統一 | manual-smoke-log.md §1 |
| yamllint | `.github/workflows/` | **N/A** | ローカル未導入（既知制限 #3） | manual-smoke-log.md §2 |
| actionlint | workflow yaml | **N/A** | ローカル未導入（既知制限 #3） | manual-smoke-log.md §3 |
| wrangler.toml 抽出 | `apps/web` / `apps/api` | **PASS（差分は派生委譲）** | `apps/web` は Pages 形式、`apps/api` は Workers 形式 + `[triggers]` + `[[d1_databases]]` を保持 | manual-smoke-log.md §4 |
| observability mapping | 05a matrix | **PASS（差分は派生委譲）** | 05a は `ci.yml` / `validate-build.yml` のみ列挙。差分 3 件は `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` に委譲 | manual-smoke-log.md §5 |
| 派生タスク命名衝突 | `unassigned-task/` | **PASS** | `UT-CICD-DRIFT-IMPL-*` 既存 0 件 | manual-smoke-log.md §6 |
| Issue #58 状態 | gh CLI | **PASS** | `state: CLOSED` 維持 | manual-smoke-log.md §7 |
| link checklist | 相対 path / 外部 URL | **PASS** | 死リンク 0 件（旧 path 2 件は代替 path で実体確認） | link-checklist.md |

## AC × 証跡パス対応

| AC | 証跡 | 判定 |
| --- | --- | --- |
| AC-1 | manual-smoke-log.md §1 | PASS |
| AC-2 | drift-matrix-design.md（Phase 2）+ §1 | PASS |
| AC-3 | manual-smoke-log.md §4 | PASS |
| AC-4 | manual-smoke-log.md §5（派生委譲明示） | PASS |
| AC-5 | Phase 9 deploy-contract-integrity.md + §4 | PASS |
| AC-6 | canonical-spec-update-plan.md（Phase 12 で実体反映） | PASS（Phase 12 で完了） |
| AC-7 | Phase 12 unassigned-task-detection.md | PASS（Phase 12 で完了） |
| AC-8 | Phase 10 go-no-go.md | PASS |
| AC-9 | manual-smoke-log.md §4（apps/web に D1 binding なし） | PASS |
| AC-10 | manual-smoke-log.md §1〜§7 | PASS |
| AC-11 | manual-smoke-log.md §7 | PASS |

## 既知制限【必須・5 項目以上】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | docs-only タスクのため `.github/workflows/*.yml` 自体は本タスクで変更しない | 実体 yaml の修正は適用されない | `UT-CICD-DRIFT-IMPL-*` 派生タスク群（Phase 12 で起票方針 formalize） |
| 2 | Pages vs OpenNext Workers の current contract 確定は本タスクで行わない | `apps/web/wrangler.toml` の cutover が遅延 | `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` |
| 3 | `yamllint` / `actionlint` がローカル未導入のため §2 / §3 がスキップ | 構文検査が手動 review に依存 | `brew install yamllint actionlint` または mise plugin で導入。本タスクの GO 判定には影響なし（rg / gh で代替確認済み） |
| 4 | branch protection の workflow 名整合確認は UT-GOV-001 が正本 | 本タスクでは drift 検出のみ | UT-GOV-001 の `gh api repos/.../branches/{main,dev}/protection` 結果を参照 |
| 5 | 05a observability-matrix.md の workflow 名差分（DRIFT-06）は本タスクで修正しない | 監視対象が一部 workflow を欠く | `UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC` |
| 6 | 旧 path 参照（`docs/05a-parallel-observability-...` 直下）は移設済みの実体パス（`docs/30-workflows/completed-tasks/05a-parallel-observability-...`）に読み替え | 表記揺れ | Phase 12 documentation-changelog で path 移設情報を併記 |
| 7 | API Token / Account ID 等の実値検証は scripts/cf.sh 経由で揮発的に注入する設計のため本ログには出現しない | secret hygiene 上の制約ではなく設計通り | CLAUDE.md「Cloudflare 系 CLI 実行ルール」に従い `bash scripts/cf.sh whoami` 等で個別確認 |

## 不変条件抵触の最終確認

| # | 不変条件 | 確認結果 |
| --- | --- | --- |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | `apps/web/wrangler.toml` に `[[d1_databases]]` なし、`apps/api/wrangler.toml` のみ保持 → **抵触なし** |
| #6 | GAS prototype は本番バックエンド仕様に昇格させない | 全 workflow yaml に GAS prototype を deploy 対象とするステップなし → **抵触なし** |

## 完了条件（Phase 11）

- [x] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイル生成
- [x] manual evidence 8 項目の採取（§2 / §3 は N/A 理由付き）
- [x] docs-only 検証サマリー転記
- [x] 既知制限を 7 項目（>= 5）列挙、各々委譲先明記
- [x] `outputs/phase-11/screenshots/` 不在（NON_VISUAL 整合）

## 次 Phase への引き渡し

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ事項:
  - rg / gh で得られた drift 検証結果は `system-spec-update-summary.md` に転記
  - 既知制限 #2 は `unassigned-task-detection.md` に派生タスクとして registered
  - 既知制限 #5 は `unassigned-task-detection.md` に派生タスクとして registered
  - link checklist の旧 path 2 件は documentation-changelog の「path 移設情報併記」項目で扱う
- ブロック条件: なし（GO 維持）
