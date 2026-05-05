# Phase 4 成果物: テスト戦略（整合性検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-CICD-DRIFT |
| Phase | 4 / 13 |
| 作成日 | 2026-04-29 |
| タスク分類 | docs-only / specification-cleanup |
| 検証方針 | docs / code / obs の三者整合検証（rg / yamllint / actionlint / cross-doc link / manual review） |

## 全体方針

本タスクは docs-only / specification-cleanup であり、実行可能コードを生成しない。よって従来の unit / integration / e2e テストではなく、`docs（正本仕様）/ code（workflow yaml・wrangler.toml）/ obs（05a 監視前提）` の三者整合を機械的に検証する **整合性検証戦略** を採用する。検証は ripgrep / yamllint / actionlint / cross-doc link check / 手動目視レビュー の 5 種を組み合わせ、Phase 7 の AC マトリクスへトレースする。

## 検証スイート 5 種 × 対象パスのマトリクス

| スイート | docs（正本仕様） | code（yaml / wrangler.toml） | obs（05a） | unassigned-task |
| --- | --- | --- | --- | --- |
| 1. rg-based grep | 対象（差分根拠） | 対象（current facts） | 対象（監視対象一覧） | 対象（派生タスク数突合） |
| 2. yamllint | N/A | 対象（`.github/workflows/*.yml`） | N/A | N/A |
| 3. actionlint | N/A | 対象（`.github/workflows/*.yml`） | N/A | N/A |
| 4. cross-doc link | 対象（参照先実在確認） | 対象（実体確認） | 対象（参照先実在確認） | 対象（命名規則一致） |
| 5. manual review | 対象（意味的整合） | 対象（dual edit 検出） | 対象（マッピング妥当性） | 対象（粒度評価） |

空セルなし（N/A は yaml lint が docs に対象外であることを意味する明示的な未適用）。

## 1. rg-based grep（drift 機械検出）

AC-10 で要求されている検証コマンドを含む 7 件の rg コマンドを以下に列挙する。

| # | 観点 | 対象 | コマンド |
| --- | --- | --- | --- |
| 1 | workflow 名一覧 | docs / obs / code の差分 | `rg -n "ci\.yml\|web-cd\.yml\|backend-ci\.yml\|validate-build\.yml\|verify-indexes\.yml" .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails .github/workflows` |
| 2 | Node version | docs / yaml 差分 | `rg -n "node-version" .github/workflows .claude/skills/aiworkflow-requirements/references` |
| 3 | pnpm version | docs / yaml 差分 | `rg -n "pnpm/action-setup\|version: [0-9]" .github/workflows .claude/skills/aiworkflow-requirements/references` |
| 4 | deploy target | Pages vs Workers 混在 | `rg -n "pages_build_output_dir\|main = \|pages-action\|wrangler deploy" apps .github/workflows .claude/skills/aiworkflow-requirements/references` |
| 5 | cron schedule | dev / production 一貫性 | `rg -n "cron:\|\\[triggers\\]\|crons = " .github/workflows apps` |
| 6 | 不変条件 #5 抵触 | apps/web からの D1 直接アクセス誘発 | `rg -n "DB\\b\|d1_databases" apps/web .github/workflows` |
| 7 | AC-10 必須統合検証 | 全観点をまとめて差分根拠記録 | `rg -n "node-version\|pnpm\|web-cd\|ci.yml\|validate-build\|wrangler\|pages_build_output_dir" .github apps/web .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails` |

合計 7 件で 6 件以上の要件を満たす。AC-10 必須コマンドは #7 に含まれる。

## 2. yamllint（yaml 構文検証）

| 対象 | コマンド | 許容ルール |
| --- | --- | --- |
| `.github/workflows/*.yml` | `yamllint -d "{extends: default, rules: {line-length: disable, document-start: disable}}" .github/workflows` | `line-length` / `document-start` を disable（既存 CI と同等の許容） |

- 失敗 = 構文崩壊。CI gate と整合。
- 本タスクで yaml 自身は変更しないため、現状を baseline として記録するのみ。

## 3. actionlint（GitHub Actions 静的検査）

| 対象 | コマンド |
| --- | --- |
| `.github/workflows/*.yml` | `actionlint .github/workflows/*.yml` |

- 失敗 = 構造的問題（job 依存循環、shellcheck 警告等）。
- 本タスクでは既存 CI の状態を baseline として記録するのみ。

## 4. cross-doc link / 参照整合

| # | 観点 | 検証手順 |
| --- | --- | --- |
| 1 | docs → code の workflow 名参照が実在 | `rg -oN "[a-z-]+\.yml" .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails \| sort -u > /tmp/docs-workflows.txt && ls .github/workflows \| sort -u > /tmp/code-workflows.txt && diff /tmp/docs-workflows.txt /tmp/code-workflows.txt` |
| 2 | obs → code の workflow 名参照が実在 | `observability-matrix.md` 内の workflow 名を抽出し `.github/workflows/` と diff |
| 3 | docs → wrangler.toml セクション参照が事実と一致 | `rg -n "pages_build_output_dir\|main =" apps/web/wrangler.toml` と仕様書記述を突合 |
| 4 | unassigned-task 起票元 ID と drift マトリクス DRIFT-NN ID の対応 | 各 `UT-CICD-DRIFT-IMPL-*.md` の起票元 ID と drift マトリクス行を突合 |

## 5. 手動目視レビュー（機械検出不能な論点）

| # | 観点 | 担当 Phase |
| --- | --- | --- |
| 1 | Pages build budget 監視前提と OpenNext Workers 方針の意味的整合（記述語句が一致しても運用 contract が違う可能性） | Phase 11 |
| 2 | `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の起票粒度が単独実行可能か（1 task = 1 diff か関連グルーピングか） | Phase 11 / 12 |
| 3 | UT-GOV-001 で branch protection に登録される workflow 名と本タスク整理結果の整合 | Phase 11 |
| 4 | 不変条件 #5 / #6 抵触の文脈判定（grep 一致だけでは判定不能なケース） | Phase 11 |

合計 4 件（要件 3 件以上を満たす）。

## 派生タスク漏れ検証コマンド

drift マトリクス「分類 = impl 必要」行数と派生タスクファイル数の一致確認。

```bash
# impl 必要 件数（drift マトリクス側）
rg -c "^\\| impl 必要 \\|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md

# 派生タスクファイル件数
ls docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md 2>/dev/null | wc -l
```

両者が不一致であれば Phase 12 NO-GO。判断保留行 (`UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION`) は impl 必要 1 件として加算する。

## TDD 相当の Red→Green サイクル（docs 版）

| サイクル | docs-only 差分 | impl 必要差分 |
| --- | --- | --- |
| Red | 正本仕様の記述が code と乖離 | 派生タスク未起票 |
| Green | 正本仕様を更新（Phase 5 Step 4 / Phase 12） | `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` を起票 |
| Refactor | docs 内重複表記を 1 箇所集約（Phase 8 SSOT） | 派生タスク間依存整理（Phase 9） |

## AC × 検証スイート割当（Phase 7 の入力）

| AC | 主検証スイート | 補助 |
| --- | --- | --- |
| AC-1 | rg #1〜#5 + manual review | yamllint / actionlint |
| AC-2 | rg #1〜#7 + 派生タスク漏れ検証 | manual review |
| AC-3 | rg #4 + manual review | cross-doc link |
| AC-4 | cross-doc link + rg #1 | manual review |
| AC-5 | manual review #1 | - |
| AC-6 | rg before/after sanity | - |
| AC-7 | 派生タスク漏れ検証 | - |
| AC-8 | Phase 3 review + Phase 10 go-no-go | - |
| AC-9 | rg #6 + manual review #4 | - |
| AC-10 | rg #7（AC-10 必須コマンド） | - |
| AC-11 | `gh issue view 58 --json state` | - |

全 AC が 1 件以上の検証手段に紐付き、空セルなし。

## 統合テスト連携

| 連携先 Phase | 内容 |
| --- | --- |
| Phase 5 | rg コマンド集を Step 1（drift 検出）に連結 |
| Phase 6 | failure case の検出手段として再利用 |
| Phase 7 | AC マトリクス「検証」列に紐付け |
| Phase 9 | yamllint / actionlint / rg を品質保証ログとして実測 |
| Phase 11 | 手動目視観点 4 件を smoke 観点に転記 |
| Phase 12 | 派生タスク漏れ検証コマンドを `unassigned-task-detection.md` 自動チェックに含める |

## 多角的チェック観点

- 価値性: AC-1〜AC-11 すべてが少なくとも 1 つの検証手段に紐付く（上表で確認済み）
- 実現性: rg / yamllint / actionlint がローカル / CI で再現可能（OSS ツール）
- 整合性: 既存 `verify-indexes.yml` の検証アプローチと衝突しない
- 運用性: コマンドが copy-paste で動作（mise exec が必要なものはなし、CLI 単体）
- 認可境界: Cloudflare Secrets 不要（読み取りのみ）
- 不変条件: #5 / #6 抵触検出が rg #6 と manual review #4 に組み込まれている

## 完了条件チェック

- [x] 検証スイート 5 種 × 対象パスのマトリクス空セルなし
- [x] rg コマンド 7 件（要件 6 件以上）
- [x] yamllint / actionlint コマンド明記
- [x] cross-doc link 検証手順 4 件
- [x] 派生タスク漏れ検証コマンド記述
- [x] 手動目視観点 4 件（要件 3 件以上）

## 次 Phase への引き渡し

- Phase 5 Step 1 へ rg コマンド集を引き渡し
- Phase 6 へ failure case 検出スイート対応を引き渡し
- Phase 7 へ AC × 検証マッピングを引き渡し
- Phase 9 へ yamllint / actionlint / 派生タスク漏れ検証を引き渡し
- Phase 11 へ手動目視観点 4 件を引き渡し
