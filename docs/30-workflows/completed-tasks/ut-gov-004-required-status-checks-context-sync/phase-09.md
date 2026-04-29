# Phase 9: 品質保証（governance QA）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Required Status Checks の context 名同期 (UT-GOV-004) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（governance QA） |

## 目的

UT-GOV-004 は CI 同期 / branch protection の前提整備というガバナンス領域に属するため、本 Phase の QA は **無料枠余裕度ではなく governance 観点** に焦点を絞る。具体的には (a) 段階適用 2 phase rollout が永続 merge block を構造的に防ぐか、(b) lefthook と CI の対応表に漏れがないか、(c) `strict` 採否のトレードオフ評価が記録され決定値が schema に埋まっているか、(d) UT-GOV-001 が直接参照可能な確定リスト形式（`confirmed-contexts.yml` v1）になっているか、の 4 観点を中核とする。a11y / 無料枠 / mirror parity は本タスクで N/A（governance ドキュメント中心）と明記する。

## 実行タスク

1. 段階適用 2 phase rollout の永続 block 防止性を検証する（完了条件: phase 1 投入リストに `last_green_run_at` が 30 日以内で全件埋まり、未出現 context は `deferred_contexts[]` に隔離されていることが確認されている）。
2. lefthook ↔ CI 対応表の漏れ検査を行う（完了条件: 三項キー `<hook>:<task>` / `<workflow> / <job>` / `pnpm <script>` 全 3 列が空欄ゼロ、片側 only 行ゼロ）。
3. `strict` 採否のトレードオフ評価を記録し dev / main の決定値を `confirmed-contexts.yml` の `strict_decision` に固定する（完了条件: dev=false / main=true 等の 2 値とその根拠 3 観点（merge 体験 / main 壊れ防止 / 緊急 rollback コスト）が記述されている）。
4. UT-GOV-001 直接参照可能性チェックを行う（完了条件: `confirmed-contexts.yml` の `contexts[].name` 配列が GitHub Branch Protection PATCH の `required_status_checks.contexts` にそのまま流せる文字列配列として取り出し可能、追加加工不要）。
5. governance チェックリストを `outputs/phase-09/main.md` に集約する（完了条件: 4 観点 × 各 PASS/FAIL 判定が一覧化）。
6. a11y / 無料枠 / mirror parity が N/A であることを明記する（完了条件: 各々に対する N/A 理由 1 行ずつ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-05/workflow-job-inventory.md | workflow / job 名の抽出結果 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-05/required-contexts-final.md | Phase 5 時点の確定 context 候補 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-05/lefthook-ci-mapping.md | lefthook と CI の対応表 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-05/staged-rollout-plan.md | 段階適用計画 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-05/strict-mode-decision.md | strict 採否の初期判断 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-08.md | DRY 化済みの schema / 共通ヘルパ |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典タスク（§8 苦戦箇所） |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | consumer 仕様 |
| 必須 | .github/workflows/ 配下全 YAML | 実在 job 名の正本 |
| 必須 | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge | lefthook 規約 |
| 参考 | https://docs.github.com/en/rest/branches/branch-protection | required_status_checks API |

## QA 観点 1: 段階適用 2 phase rollout の永続 block 防止性

| チェック | 確認方法 | 期待 |
| --- | --- | --- |
| phase 1 投入候補が全て `last_green_run_at` を持つ | `confirmed-contexts.yml` の `contexts[].apply_phase==1` を全件 grep | 全件で `last_green_run_at` 記入済み |
| `last_green_run_at` が 30 日以内 | ISO8601 値と現在日（2026-04-29）の差が ≤ 30d | 全件 PASS |
| 未出現 context は phase 1 から除外 | phase 1 候補と `deferred_contexts[]` の和集合に重複ゼロ | 重複ゼロ |
| matrix 展開 context は実行済みの全 matrix 値を列挙 | `contexts[].matrix_expansion` が `gh api` の実 check-run と一致 | 完全一致 |
| phase 2 への昇格条件が記述されている | `deferred_contexts[].promotion_criteria` が「dev で N 回連続成功」等で記述 | 全件記述 |

> **設計上の構造的保証**: phase 1 リストは「過去 30 日以内に GitHub 上で 1 回以上 success が記録されている context」のみで構成され、それ以外は `deferred_contexts` に隔離する。これにより原典 §8.1（存在しない context による merge 完全停止）は構造的に発生しない。

## QA 観点 2: lefthook ↔ CI 対応表の漏れ検査

| 列 | 期待 | 検査方法 |
| --- | --- | --- |
| `<hook>:<task>` 列 | lefthook.yml に存在する全エントリが網羅 | `lefthook.yml` の全 commands と一致 |
| `<workflow> / <job>` 列 | `confirmed-contexts.yml` の context 集合の subset または同等 | YAML grep |
| `pnpm <script>` 列 | `package.json` `scripts` に実在 | `pnpm run` 実行可能性確認（実行はしない、表上の記述確認のみ） |
| 片側 only 行 | ゼロ件 | 3 列全て埋まっているか目視 |
| ドリフト懸念 | hook と CI で **同じ pnpm script** を呼んでいる | 同一 script を中継キーに使用 |

> **構造的保証**: pnpm script を中継キーに固定することで、ローカル lefthook と CI が同一コマンドを実行する事になり、原典 §8.5（lefthook と CI のドリフト）は構造的に発生しない。

## QA 観点 3: `strict` 採否のトレードオフ評価

| 観点 | strict=true（up-to-date 必須） | strict=false |
| --- | --- | --- |
| merge 体験 | 他 PR が merge される度に rebase + CI 再実行が必要、開発体験悪化 | rebase 不要、開発体験良好 |
| main 壊れリスク | 低（base が最新であることが保証） | 中（古い base で PASS した PR が merge 後に壊す可能性） |
| 緊急 rollback コスト | 高（admin override 必要） | 低 |
| solo 運用との整合 | overkill 気味 | 適合 |

| 環境 | 決定値 | 根拠 |
| --- | --- | --- |
| dev | `strict: false` | 反復速度を優先。dev は staging 検証であり壊れても影響範囲が限定。 |
| main | `strict: true` | production 環境。main の整合性を最優先。merge は週次〜の頻度のため rebase コストは許容可能。 |

> 上記 2 値を Phase 8 の `confirmed-contexts.yml` `strict_decision` に固定する。Phase 10 GO 条件の 1 つ。

## QA 観点 4: UT-GOV-001 直接参照可能性チェック

| チェック | 期待 |
| --- | --- |
| `confirmed-contexts.yml` の `contexts[].name` を YAML loader で読み出すと `string[]` になる | PASS |
| その `string[]` が GitHub PATCH `required_status_checks.contexts` に追加加工なしで流せる | PASS |
| `strict_decision.<env>` が `required_status_checks.strict` に直接マップ可能 | PASS |
| `deferred_contexts[]` は UT-GOV-001 の対象外と明記 | PASS |
| schema バージョン (`version: 1`) が UT-GOV-001 仕様書側の入力契約と一致 | PASS |

## a11y / 無料枠 / mirror parity の N/A 明記

- **a11y**: 本タスクは Markdown / YAML の文書成果物のみで UI を持たない。WCAG 観点は対象外。
- **無料枠**: 抽出 / 対応表生成 / GitHub API 呼び出しはローカル / CI 上で完結し、追加 Cloudflare リソース消費なし。Workers / D1 / Sheets いずれも対象外。
- **mirror parity**: `.claude/skills/` の skill 資源は変更しない（参照のみ）。`.claude` 正本と `.agents` mirror の同期は本タスクで N/A。

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 〜200 行 | 250 行以内 | PASS（想定） |
| phase-08.md 〜 phase-11.md | 各 100-250 行 | 100-250 | PASS（想定） |
| outputs/phase-XX/*.md | 個別 200-400 行目安 | 個別 | 個別チェック |

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| 原典 `completed-tasks/UT-GOV-004-...md` 参照 | 全 phase からの相対 path | 実在 |
| UT-GOV-001 仕様書との双方向リンク | phase-10 / phase-12 から | 実在 |
| `.github/workflows/*.yml` への参照 | git ls-files と照合 | 100% 実在 |
| `confirmed-contexts.yml` 参照 | UT-GOV-001 spec と本タスク phase-08 outputs | 双方向で実在 |

## 実行手順

### ステップ 1: phase 1 投入候補に `last_green_run_at` 全件埋まりを確認
- `confirmed-contexts.yml` を loader で読み込み、apply_phase==1 を抽出。

### ステップ 2: lefthook ↔ CI 対応表の三項キー全列を埋めて漏れ検査
- `outputs/phase-08/lefthook-ci-mapping.md` の各行を確認。

### ステップ 3: strict 採否のトレードオフ評価を記述し、dev=false / main=true を schema に固定

### ステップ 4: UT-GOV-001 直接参照可能性を検証
- YAML を pseudo-load し、契約 4 項目を確認。

### ステップ 5: a11y / 無料枠 / mirror parity の N/A 理由記述

### ステップ 6: governance QA サマリーを `outputs/phase-09/main.md` に集約

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 4 QA 観点の PASS を GO 条件として直接参照 |
| Phase 11 | `gh api check-runs` 出力を確認するための事前 schema |
| Phase 12 | strict 採否の根拠を documentation-changelog に転記 |
| UT-GOV-001 | `confirmed-contexts.yml` の入力契約を保証 |
| UT-GOV-005 | `deferred_contexts[].relay_to` を新規 workflow 追加タスクとして引き渡す |

## 多角的チェック観点

- 価値性: branch protection apply 時の永続 block を構造的に発生させない。
- 実現性: 段階適用判定が `gh api` 出力 1 回で完結する。
- 整合性: lefthook ↔ CI が pnpm script で結ばれ、ローカル PASS → CI FAIL の摩擦を構造的に排除。
- 運用性: schema 化により次 wave で context 追加時の手順が確定。
- 認可境界: 本 Phase は読取と判定のみ、書込みは UT-GOV-001。
- governance: strict 値が dev / main で別々に固定されている。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | phase 1/2 rollout 永続 block 防止検証 | 9 | spec_created | last_green_run_at 全件 |
| 2 | lefthook ↔ CI 三項対応の漏れ検査 | 9 | spec_created | pnpm 中継キー |
| 3 | strict 採否トレードオフ記録 | 9 | spec_created | dev=false / main=true |
| 4 | UT-GOV-001 直接参照可能性検証 | 9 | spec_created | YAML 契約 4 項目 |
| 5 | governance QA サマリー記述 | 9 | spec_created | 4 観点 |
| 6 | a11y / 無料枠 / mirror parity N/A 明記 | 9 | spec_created | 各 1 行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | governance QA 4 観点サマリー |
| ドキュメント | outputs/phase-09/strict-decision.md | strict 採否のトレードオフ評価と決定値 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] phase 1 投入候補が全件 30 日以内の `last_green_run_at` を持つ
- [ ] 未出現 context は `deferred_contexts[]` に隔離されている
- [ ] lefthook ↔ CI 三項対応表に空欄 / 片側 only 行ゼロ
- [ ] strict 採否が dev=false / main=true（または等価の決定値）で固定され、根拠 3 観点が記述
- [ ] `confirmed-contexts.yml` から UT-GOV-001 が追加加工なしで PATCH body を組み立て可能
- [ ] a11y / 無料枠 / mirror parity が N/A と明記
- [ ] outputs/phase-09/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` に配置予定
- 4 QA 観点すべてに PASS/FAIL 判定が記述
- `strict_decision` 値が schema に固定
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー / GO-NO-GO)
- 引き継ぎ事項:
  - QA 4 観点の PASS 結果（GO 条件の必須入力）
  - `strict_decision` 確定値（schema に埋め込み済み）
  - `deferred_contexts[]` のリレー先（UT-GOV-005 等）
  - lefthook ↔ CI 三項対応の確定表
- ブロック条件:
  - phase 1 リストに `last_green_run_at` 未記入 / 30 日超過の行が残る
  - lefthook ↔ CI 対応に片側 only 行が残る
  - strict 採否が決定されていない
  - `confirmed-contexts.yml` から PATCH body が直接組み立てられない
