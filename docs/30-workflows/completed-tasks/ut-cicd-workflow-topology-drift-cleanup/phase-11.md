# Phase 11: 手動 smoke test（NON_VISUAL 縮約）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke test |
| 作成日 | 2026-04-29 |
| 前 Phase | 10 (最終レビュー) |
| 次 Phase | 12 (ドキュメント更新) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（manual smoke / non-visual） |
| user_approval_required | false |

## VISUAL / NON_VISUAL 判定

- **mode: NON_VISUAL**
- 判定理由:
  - 本タスクは `.github/workflows/*.yml` の棚卸しと正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）の drift 整理を行う docs-only タスクで、ランタイム挙動・UI を伴わない。
  - 成果物はすべて Markdown ドキュメントであり、画面 / コンポーネント / レイアウト / インタラクションを生成しない。
  - 一次証跡は `rg` / `yamllint` / `actionlint` / `gh api` の stdout、および参照リンクの死活確認となる。
- 必須 outputs:
  - `outputs/phase-11/main.md`（smoke 実行サマリー / 既知制限）
  - `outputs/phase-11/manual-smoke-log.md`（コマンド単位の実行ログ）
  - `outputs/phase-11/link-checklist.md`（参照リンクの死活確認）
- **`outputs/phase-11/screenshots/.gitkeep` は作成しない**（NON_VISUAL のため screenshots ディレクトリ自体を作らない）。

## 目的

Phase 5 の implementation-runbook（仕様書更新手順）と Phase 8 の DRY 化結果を踏まえ、本タスクが docs-only として閉じられたことを `rg` / `yamllint` / `actionlint` / link checker / `gh api` の組み合わせで検証する。範囲は **「drift マトリクスが current facts を反映している」「派生 implementation タスクの起票方針に矛盾がない」「正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）の更新案が `.github/workflows/*.yml` 実体と一致している」** の 3 点に絞る。

## 実行タスク

1. `.github/workflows/` 配下の yaml を `rg` で棚卸しし、Phase 2 の drift マトリクスと一致するか確認する（完了条件: Node / pnpm / job / trigger / deploy target 列の全行で diff = 0）。
2. `yamllint` / `actionlint` を全 workflow yaml に対して実行し、構文エラーがないことを確認する（完了条件: exit 0、warning は許容しログに残す）。
3. `apps/web/wrangler.toml` / `apps/api/wrangler.toml` を `rg "pages_build_output_dir|main\\s*=|compatibility_date|\\[triggers\\]"` で抽出し、`deployment-cloudflare.md` 更新案と整合するか確認する（完了条件: 抽出結果と更新案の差分が説明可能）。
4. 05a observability-matrix の workflow 名参照を `rg` で抽出し、現実体との対応表が Phase 2 の mapping table と一致することを確認する（完了条件: マッピング不能な workflow 名が 0 件、または impl 必要差分として記録済み）。
5. 派生 implementation タスクの起票方針が `unassigned-task/` 命名規則（`UT-CICD-DRIFT-IMPL-*.md`）に整合することを確認する（完了条件: 命名衝突 0 件）。
6. GitHub Issue #58 の状態を `gh issue view 58 --json state,title,url` で確認し、CLOSED のままであることを記録する（完了条件: state == CLOSED）。
7. 参照リンク（外部 URL / 相対 path）の死活確認を `link-checklist.md` に列挙する（完了条件: 死リンク 0 件、または代替リンクが提示されている）。
8. 既知制限を `outputs/phase-11/main.md` に列挙する（完了条件: docs-only として検証できない事項が委譲先付きで明記）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md | drift マトリクスの検証対象 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/canonical-spec-update-plan.md | 正本仕様の更新案検証 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-05/implementation-runbook.md | 仕様書更新手順 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-07/ac-matrix.md | AC × smoke 項目の対応 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-10/go-no-go.md | GO 判定の前提確認 |
| 必須 | .github/workflows/backend-ci.yml | drift 検証対象 |
| 必須 | .github/workflows/ci.yml | drift 検証対象 |
| 必須 | .github/workflows/validate-build.yml | drift 検証対象 |
| 必須 | .github/workflows/verify-indexes.yml | drift 検証対象 |
| 必須 | .github/workflows/web-cd.yml | drift 検証対象 |
| 必須 | apps/web/wrangler.toml | deploy target 実体 |
| 必須 | apps/api/wrangler.toml | deploy target 実体 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | 正本仕様（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 正本仕様（更新対象） |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md | 監視対象 mapping 検証 |

## 実行手順

### ステップ 1: workflow yaml 棚卸し（rg）

```bash
rg -n "node-version|pnpm|on:|jobs:|deploy|wrangler" .github/workflows/
rg -n "uses:\\s*actions/" .github/workflows/
rg -n "runs-on:" .github/workflows/
```

- 期待値: Phase 2 drift-matrix-design.md の表に列挙された workflow / job 名と完全一致。
- 失敗時: drift マトリクスを差し戻し、Phase 2 の更新を要求。

### ステップ 2: yamllint / actionlint

```bash
yamllint .github/workflows/
actionlint .github/workflows/*.yml
```

- 期待値: exit 0。warning は `manual-smoke-log.md` に列挙し、impl 必要差分かを判定。
- 失敗時: syntax error は impl 必要差分として記録。

### ステップ 3: wrangler.toml の整合確認

```bash
rg -n "pages_build_output_dir|^main\\s*=|compatibility_date|\\[triggers\\]|\\[\\[d1_databases\\]\\]" apps/web/wrangler.toml apps/api/wrangler.toml
```

- 期待値: `apps/web/wrangler.toml` の `main` entry / `pages_build_output_dir` 表記が Phase 2 の current contract 案と整合。
- 失敗時: impl 必要差分（`UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION`）として記録。

### ステップ 4: 05a observability-matrix mapping 検証

```bash
rg -n "ci\\.yml|backend-ci\\.yml|validate-build\\.yml|verify-indexes\\.yml|web-cd\\.yml" \
   docs/05a-parallel-observability-and-cost-guardrails/
```

- 期待値: 抽出された workflow 名がすべて `.github/workflows/` に実在。
- 失敗時: 存在しない workflow 名は impl 必要差分として記録。

### ステップ 5: 派生タスク命名衝突チェック

```bash
ls docs/30-workflows/unassigned-task/ | rg "UT-CICD-DRIFT-IMPL"
```

- 期待値: Phase 2 で起票方針が示された派生タスク ID と既存ファイルの衝突なし。

### ステップ 6: GitHub Issue #58 状態確認

```bash
gh issue view 58 --json state,title,url
```

- 期待値: `state: CLOSED`。CLOSED のまま仕様書を成果物として残す方針が CLAUDE.md / 原典指示と整合。

### ステップ 7: link checklist

```bash
# 相対パスの死活
rg -o "docs/[A-Za-z0-9_/.-]+\\.md" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/ | sort -u | xargs -I{} test -e {} && echo OK || echo MISSING
# 外部 URL の死活（offline でも参考記録）
rg -o "https?://[^\\s)]+" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/ | sort -u
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | test-strategy.md の rg / yamllint / link check 観点を本 Phase の手順に落とし込み |
| Phase 7 | AC matrix の smoke 列に本 Phase の証跡パスを記入 |
| Phase 9 | docs-only QA 結果（rg / yamllint / actionlint）を本 Phase の `main.md` に転記 |
| Phase 12 | 検証で判明した運用知見を `unassigned-task-detection.md` / `skill-feedback-report.md` に登録 |

## docs-only 検証サマリー（Phase 9 から転記、本 Phase の主証跡ソース）

| 種別 | チェック対象 | PASS | FAIL | 主な検証対象 |
| --- | --- | --- | --- | --- |
| rg 棚卸し | `.github/workflows/*.yml` | TBD | TBD | Node / pnpm / job / trigger 一致 |
| yamllint | `.github/workflows/` | TBD | TBD | yaml 構文 |
| actionlint | workflow yaml | TBD | TBD | GitHub Actions 構文 |
| wrangler.toml 抽出 | `apps/web` / `apps/api` | TBD | TBD | deploy target 整合 |
| observability mapping | 05a matrix | TBD | TBD | workflow 名実在性 |
| link checklist | 相対 path / 外部 URL | TBD | TBD | 死リンク 0 |

> **本 Phase は docs-only 検証**。screenshot / runtime smoke は不要で、上記 stdout が一次証跡。

## 多角的チェック観点

- 価値性: drift マトリクスが current facts を反映し、派生タスク起票方針が漏れなく整理されているか。
- 実現性: rg / yamllint / actionlint / link check が再現可能なコマンドとして記載されているか。
- 整合性: AC-1〜AC-11 の証跡パスが Phase 7 の AC matrix と整合しているか。
- 運用性: docs-only として閉じられない差分が「impl 必要」として明示され、派生タスク ID にマップされているか。
- 不変条件: workflow から `apps/web` 経由の D1 アクセス / GAS prototype deploy が誘発されていないこと（#5 / #6）。
- Secret hygiene: `manual-smoke-log.md` に Token / Account ID 実値が混入していないこと。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | rg 棚卸し（workflow yaml） | 11 | spec_created | drift マトリクス整合 |
| 2 | yamllint / actionlint | 11 | spec_created | syntax 検証 |
| 3 | wrangler.toml rg 抽出 | 11 | spec_created | deploy target 整合 |
| 4 | 05a observability mapping | 11 | spec_created | workflow 名実在性 |
| 5 | 派生タスク命名衝突 | 11 | spec_created | UT-CICD-DRIFT-IMPL-* |
| 6 | gh issue view #58 | 11 | spec_created | CLOSED 維持確認 |
| 7 | link checklist | 11 | spec_created | 死リンク 0 |
| 8 | 既知制限のリスト化 | 11 | spec_created | 委譲先明記 |

## manual evidence（実装後に採取するログの placeholder）【必須】

| 項目 | コマンド | 採取先 | 採取済 |
| --- | --- | --- | --- |
| workflow yaml 棚卸し | `rg -n "node-version\|pnpm\|on:\|jobs:" .github/workflows/` | outputs/phase-11/manual-smoke-log.md §1 | TBD |
| yamllint | `yamllint .github/workflows/` | outputs/phase-11/manual-smoke-log.md §2 | TBD |
| actionlint | `actionlint .github/workflows/*.yml` | outputs/phase-11/manual-smoke-log.md §3 | TBD |
| wrangler.toml 抽出 | `rg -n "pages_build_output_dir\|^main\\s*=" apps/web/wrangler.toml apps/api/wrangler.toml` | outputs/phase-11/manual-smoke-log.md §4 | TBD |
| 05a mapping | `rg -n "ci\\.yml\|backend-ci\\.yml\|validate-build\\.yml\|verify-indexes\\.yml\|web-cd\\.yml" docs/05a-parallel-observability-and-cost-guardrails/` | outputs/phase-11/manual-smoke-log.md §5 | TBD |
| 派生タスク命名衝突 | `ls docs/30-workflows/unassigned-task/ \| rg UT-CICD-DRIFT-IMPL` | outputs/phase-11/manual-smoke-log.md §6 | TBD |
| Issue #58 状態 | `gh issue view 58 --json state,title,url` | outputs/phase-11/manual-smoke-log.md §7 | TBD |
| link checklist | rg + test -e | outputs/phase-11/link-checklist.md | TBD |

> 各セクションには「コマンド」「実行日時」「stdout / stderr 抜粋」「期待値との一致 / 不一致」を記録すること。Token / Account ID は必ずマスクする。

## 既知制限リスト【必須】

| # | 制限 | 影響範囲 | 委譲先 / 補足 |
| --- | --- | --- | --- |
| 1 | docs-only タスクのため workflow yaml 自体は変更しない | 実体修正は適用されない | `UT-CICD-DRIFT-IMPL-*` 派生タスクで実装 |
| 2 | Pages vs Workers の最終判断は本タスクで行わない | current contract 確定が遅延する可能性 | `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` |
| 3 | actionlint / yamllint がローカル未導入の環境では実行不可 | 開発者によって smoke 結果差異 | mise / Homebrew でインストール手順を `manual-smoke-log.md` に記載 |
| 4 | `gh api` 経由の branch protection 確認は UT-GOV-001 が正本 | 整合性確認のみで本タスクでは結論を出さない | UT-GOV-001 の判断を参照 |
| 5 | 05a observability-matrix の更新が必要となった場合の起票要否 | 起票漏れ | Phase 12 unassigned-task-detection で判定 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | docs-only smoke 実行サマリー・既知制限 |
| ログ | outputs/phase-11/manual-smoke-log.md | 7 命令分の rg / lint / gh 実行ログ |
| チェックリスト | outputs/phase-11/link-checklist.md | 参照ドキュメントのリンク死活確認 |
| メタ | artifacts.json | Phase 11 状態の更新 |

## 完了条件

- [ ] `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 ファイルが揃っている
- [ ] manual evidence テーブルの 8 項目すべての採取列が完了（または各 N/A 理由が記載）
- [ ] docs-only 検証サマリー（rg / yamllint / actionlint / wrangler / mapping / link）が転記されている
- [ ] 既知制限が 5 項目以上列挙され、それぞれ委譲先または補足が記述されている
- [ ] `outputs/phase-11/screenshots/` を作成していない（NON_VISUAL 整合）

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-11/` 配下に配置される設計になっている
- AC-1〜AC-11 の証跡採取コマンドが定義済み
- 不変条件 #5 / #6 抵触懸念が manual evidence で確認可能
- artifacts.json の `phases[10].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 12 (ドキュメント更新)
- 引き継ぎ事項:
  - rg / yamllint / actionlint で得られた drift 検証結果を Phase 12 の `system-spec-update-summary.md` に転記
  - 既知制限 #2（Pages vs Workers 判断委譲）を `unassigned-task-detection.md` に register
  - link checklist の死リンクがあれば changelog の修正対象として渡す
- ブロック条件:
  - manual evidence の 8 項目に未採取 / 未 N/A 化が残っている
  - drift マトリクスと workflow yaml 実体が乖離している（→ Phase 5 へ差し戻し）
  - `screenshots/` ディレクトリが誤って作成されている
