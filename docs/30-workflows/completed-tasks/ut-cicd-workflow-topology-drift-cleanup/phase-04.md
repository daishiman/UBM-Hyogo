# Phase 4: テスト戦略（整合性検証戦略）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（整合性検証戦略） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック：仕様更新手順) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（test-strategy as consistency-verification） |

## 目的

本タスクは docs-only / specification-cleanup であり、実行可能コードを生成しない。したがって従来の「unit / integration / e2e」テストではなく、`docs（正本仕様）/ code（workflow yaml・wrangler.toml）/ obs（05a 監視前提）` の三者整合を機械的に検証する **整合性検証戦略** を Phase 5（仕様更新手順）に投入できる粒度で確定する。検証は ripgrep / yamllint / actionlint / link-checker / 手動目視レビュー の 5 種を組み合わせ、Phase 7 の AC マトリクスへトレースする。

## 実行タスク

1. 検証スイート 5 種類（rg-based grep / yamllint / actionlint / cross-doc link / manual review）の対象範囲と観点を確定する（完了条件: スイート × 検証対象パスのマトリクスに空セル無し）。
2. drift 検出のための rg コマンド集を確定する（完了条件: AC-10 で要求されている検証コマンドを含む 6 件以上の rg 行が列挙されている）。
3. yamllint / actionlint 実行範囲と許容ルールを定義する（完了条件: `.github/workflows/` 配下を対象とする実行コマンドと、CI で許容している既存の警告セットが明記されている）。
4. 正本仕様（docs）と現行 yaml（code）のクロス参照検証手順を定義する（完了条件: workflow 名・Node バージョン・pnpm バージョン・cron schedule・deploy target の 5 軸で grep ベースの突き合わせ手順がある）。
5. 派生タスク（impl 必要差分）が漏れなく `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` に対応する自動チェックを定義する（完了条件: drift マトリクスの「分類 = impl 必要」行数と派生タスクファイル数が一致するか確認するコマンドが記述）。
6. 手動目視レビュー観点リストを確定する（完了条件: rg / yamllint で機械検出できない論点 3 件以上を列挙）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-02.md | 差分マトリクス schema・判別ルール（検証対象の構造） |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/phase-03.md | GO 判定の前提・open question（検証で詰める事項） |
| 必須 | .github/workflows/ | yaml 実体（検証対象） |
| 必須 | apps/web/wrangler.toml | Pages vs Workers 判定の実体 |
| 必須 | apps/api/wrangler.toml | apps/api deploy 実体 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | docs 側の正本（突き合わせ基準） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | docs 側の正本（突き合わせ基準） |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md | obs 側の前提（突き合わせ基準） |
| 参考 | https://github.com/rhysd/actionlint | actionlint 仕様 |

## 検証スイート設計

### 1. rg-based grep（drift 機械検出）

| 対象 | 観点 | 想定ファイル / コマンド |
| --- | --- | --- |
| workflow 名一覧 | docs / obs に存在する workflow 名と code 実体の差分 | `rg -n "ci\.yml\|web-cd\.yml\|backend-ci\.yml\|validate-build\.yml\|verify-indexes\.yml" .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails .github/workflows` |
| Node バージョン | docs と yaml の `node-version` が一致するか | `rg -n "node-version" .github/workflows .claude/skills/aiworkflow-requirements/references` |
| pnpm バージョン | docs と yaml の pnpm バージョンが一致するか | `rg -n "pnpm/action-setup\|version: [0-9]" .github/workflows .claude/skills/aiworkflow-requirements/references` |
| deploy target | Pages vs Workers の混在検出 | `rg -n "pages_build_output_dir\|main = \|pages-action\|wrangler deploy" apps .github/workflows .claude/skills/aiworkflow-requirements/references` |
| cron schedule | dev / production の cron 表記の一貫性 | `rg -n "cron:\|\\[triggers\\]\|crons = " .github/workflows apps` |
| 不変条件 #5 抵触 | apps/web から D1 直接アクセスの誘発 | `rg -n "DB\\b\|d1_databases" apps/web .github/workflows` |

### 2. yamllint（yaml 構文）

| 対象 | コマンド |
| --- | --- |
| `.github/workflows/*.yml` | `yamllint -d "{extends: default, rules: {line-length: disable, document-start: disable}}" .github/workflows` |

- 失敗 = 構文崩壊。CI gate と整合。

### 3. actionlint（GitHub Actions 静的検査）

| 対象 | コマンド |
| --- | --- |
| `.github/workflows/*.yml` | `actionlint .github/workflows/*.yml` |

- 失敗 = 構造的問題（job 依存の循環、shellcheck 警告等）。本タスクで yaml 自身は変更しないため、既存 CI の状態を「現状の baseline」として記録するのみ。

### 4. cross-doc link / 参照整合

| 対象 | 観点 |
| --- | --- |
| docs → code への workflow 名参照 | docs に書かれている workflow 名が `.github/workflows/` に実在するか |
| obs → code への workflow 名参照 | observability-matrix.md の監視対象 workflow が実在するか |
| docs → wrangler.toml セクション参照 | `pages_build_output_dir` / `main` の有無記述が事実と一致するか |

検証コマンド例:

```bash
# docs に登場する workflow 名を抽出
rg -oN "[a-z-]+\.yml" .claude/skills/aiworkflow-requirements/references docs/05a-parallel-observability-and-cost-guardrails | sort -u > /tmp/docs-workflows.txt
ls .github/workflows | sort -u > /tmp/code-workflows.txt
diff /tmp/docs-workflows.txt /tmp/code-workflows.txt
```

### 5. 手動目視レビュー（機械検出不能な論点）

| # | 観点 |
| --- | --- |
| 1 | Pages build budget 監視前提と OpenNext Workers 方針の意味的整合（記述語句が一致しても運用 contract が違う可能性） |
| 2 | `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の起票粒度が単独実行可能か |
| 3 | UT-GOV-001 で branch protection に登録される workflow 名と本タスク整理結果の整合 |
| 4 | 不変条件 #5 / #6 抵触の文脈判定（grep 一致だけでは判定不能なケース） |

## 派生タスク漏れ検証

drift マトリクスの「分類 = impl 必要」行数と、起票される `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の件数が一致することを Phase 12 で確認する。

```bash
# impl 必要 件数（drift マトリクス側）
rg -c "^\\| impl 必要 \\|" docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/drift-matrix-design.md

# 派生タスクファイル件数
ls docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md 2>/dev/null | wc -l
```

両者が一致しなければ Phase 12 が NO-GO。

## TDD 相当の Red→Green サイクル（docs 版）

本タスクでは「Red = drift マトリクスに未解消行が残る状態」「Green = 全行が docs-only 解消 or 派生タスク起票で完了」とし、Phase 5 の仕様更新手順がこのサイクルを回す。

| サイクル | docs-only 差分 | impl 必要差分 |
| --- | --- | --- |
| Red | 正本仕様の記述が code と乖離 | 派生タスクが未起票 |
| Green | 正本仕様を更新（Phase 5 / Phase 12） | `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` を起票 |
| Refactor | docs 内の重複表記を 1 箇所に集約 | 派生タスク間の依存関係を整理 |

## 実行手順

1. 検証スイート 5 種のマトリクスを `outputs/phase-04/test-strategy.md` に転記する。
2. rg コマンド 6 件以上を runbook の Step 1（差分検出）として Phase 5 に渡す。
3. yamllint / actionlint コマンドを Phase 9（品質保証）の証跡コマンドとして予約する。
4. 派生タスク漏れ検証コマンドを Phase 12 のチェックリスト入力として登録する。
5. 手動目視観点 4 件を Phase 11（手動 smoke test）の観点リストへ予約する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | rg コマンド集を仕様更新手順の Step 1（drift 検出）として連結 |
| Phase 6 | 各検証スイートで検出される failure case を起点に異常系を設計 |
| Phase 7 | 検証コマンドを AC マトリクスの「検証」列に紐付け |
| Phase 9 | yamllint / actionlint / rg を品質保証ログとして実測 |
| Phase 11 | 手動目視観点 4 件を smoke 観点に転記 |
| Phase 12 | 派生タスク漏れ検証コマンドを `unassigned-task-detection.md` の自動チェックに含める |

## 多角的チェック観点

- 価値性: AC-1〜AC-11 すべてが少なくとも 1 つの検証手段に紐付くか。
- 実現性: rg / yamllint / actionlint がローカル / CI で再現可能か。
- 整合性: 既存 `.github/workflows/verify-indexes.yml` の検証アプローチと衝突しないか。
- 運用性: コマンドが copy-paste で動作するか（mise exec が必要なものは明示）。
- 認可境界: 検証コマンドが Cloudflare Secrets を要求しないか（読み取りのみ）。
- 不変条件: #5 / #6 の抵触検出が grep 観点に組み込まれているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | rg-based grep スイート 6 件以上 | spec_created |
| 2 | yamllint 実行範囲確定 | spec_created |
| 3 | actionlint 実行範囲確定 | spec_created |
| 4 | cross-doc link 検証手順 | spec_created |
| 5 | 派生タスク漏れ検証コマンド | spec_created |
| 6 | 手動目視観点 4 件 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 検証スイート 5 種・rg コマンド集・派生タスク漏れチェック・手動観点 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件

- [ ] 検証スイート 5 種 × 対象パスのマトリクスに空セル無し
- [ ] rg コマンドが 6 件以上列挙（AC-10 要求コマンドを含む）
- [ ] yamllint / actionlint の実行コマンドが明記
- [ ] cross-doc link 検証手順が記述
- [ ] 派生タスク漏れ検証コマンドが記述
- [ ] 手動目視観点が 3 件以上列挙

## タスク100%実行確認【必須】

- 実行タスク 6 件すべて `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置予定
- AC-1〜AC-11 すべてに 1 つ以上の検証手段を割当（Phase 7 で完全トレース）
- 不変条件 #5 / #6 抵触検出が rg 観点に含まれる

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック：仕様更新手順)
- 引き継ぎ事項:
  - rg コマンド集 → Step 1（drift 検出）
  - yamllint / actionlint → Phase 9 で再利用
  - 派生タスク漏れ検証 → Phase 12 で再利用
  - 手動観点 → Phase 11 で再利用
- ブロック条件:
  - rg コマンドが 6 件未満
  - 派生タスク漏れ検証コマンドが未定義
  - AC のいずれかに検証手段が割り当たらない
