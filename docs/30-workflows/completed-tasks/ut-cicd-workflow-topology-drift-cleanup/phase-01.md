# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | 1 |
| 実行種別 | parallel |
| 前 Phase | なし |
| 次 Phase | 2 (設計：差分マトリクス設計) |
| 状態 | spec_created |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| scope | CI/CD workflow topology と deployment spec の drift cleanup。task docs と承認済み aiworkflow-requirements 正本 docs のみを対象とし、実装変更は `UT-CICD-DRIFT-IMPL-*` へ分離 |
| workflow_state | spec_created |
| タスク分類 | docs-only / specification-cleanup（仕様書整合性 cleanup。実装変更が必要な差分は派生タスク化） |

> Phase 1 必須入力: `artifacts.json.metadata.taskType=docs-only`、`visualEvidence=NON_VISUAL`、`scope`、`workflow_state=spec_created` を本 Phase で確定する。

## 目的

`.github/workflows/*.yml` の現行 workflow 実体と、aiworkflow-requirements skill 正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）および 05a 観測性タスクの cost guardrail 前提との drift を、本タスクの「真の論点」として確定させる。Phase 2 の差分マトリクス設計が、docs-only で閉じる差分と implementation 派生タスクとして切り出す差分を一意に判別できる入力を提供する。

## 真の論点 (true issue)

- 「workflow を直すこと」ではなく、「正本仕様（docs）と現行 workflow 実体（code）と監視前提（05a）の三者の drift を一覧化し、docs-only で閉じる差分と impl 派生タスクで扱う差分を厳密に分離する」ことが本タスクの本質。
- 副次的論点として、Pages build budget 監視前提と OpenNext Workers 方針の二系統が混在している場合、どちらを current contract として正本化するかの判断材料を提示すること（cutover そのものは別タスク）。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | 05a observability and cost guardrails | 監視対象 workflow の名称・期待 topology が記録済み | drift 整理の起点 |
| 上流 | aiworkflow-requirements skill (`deployment-gha.md` / `deployment-cloudflare.md`) | 正本仕様の現状記述 | drift 比較の基準として参照 |
| 並列 | UT-GOV-001（branch protection） | required_status_checks 登録予定の workflow 名 | 整合した workflow 名一覧を提供 |
| 並列 | UT-GOV-003（CODEOWNERS） | `.github/workflows/**` の owner 宣言 | 名称が CODEOWNERS と一致することを担保 |
| 下流 | UT-CICD-DRIFT-IMPL-*（派生 implementation タスク） | impl 必要差分の一覧 | 起票方針・差分内容・受入条件を渡す |
| 下流 | UT-26（staging-deploy-smoke） | 修正後 workflow 名で smoke を回す前提 | 確定した workflow 名一覧 |

## 価値とコスト

- 価値: 05a の cost guardrail が「存在しない workflow」を監視する誤作動を未然防止し、Pages / Workers の deploy contract 二重化を解消する起点となる。正本仕様と現行実体の整合性を回復することで、以降のタスク（implementation / governance）の判断基準が一意に固定される。
- コスト: docs-only タスクのため CI 実行コスト・Cloudflare 利用増加はゼロ。Phase 1〜13 を通したドキュメント作成工数のみ。
- 機会コスト: drift を放置すると、05a / UT-GOV-001 / UT-26 のいずれかが誤った前提で進み、後段で大規模な手戻りが発生するリスク。本タスクで drift を顕在化することで手戻りを最小化する。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 05a / UT-GOV-001 / UT-26 の前提を整合させる起点になり、後段タスクの誤作動を未然防止する |
| 実現性 | PASS | docs-only / 既存 yaml の参照のみで完結。新規実装・新規 Secret は不要 |
| 整合性 | PASS | 不変条件 #5 / #6 を侵さず、implementation 必要差分は派生タスクへ明示的に分離する |
| 運用性 | PASS | Phase 12 で派生タスク起票方針を残すことで、impl 必要差分の運用引き継ぎが明確 |

## 既存規約・既存記述の確認

Phase 2 設計の前に、以下の既存記述・既存構成を確認すること。

| 観点 | 確認対象 | 期待される現状把握 |
| --- | --- | --- |
| 現行 workflow 一覧 | `.github/workflows/*.yml` | 実在する yaml ファイル名・job 名 |
| Node / pnpm バージョン | 各 yaml の `actions/setup-node` `pnpm/action-setup` 等 | 実体に書かれているバージョン値 |
| trigger | 各 yaml の `on:` セクション | push / pull_request / workflow_dispatch / schedule の組合せ |
| deploy target | `web-cd.yml` 内の wrangler コマンド / `apps/web/wrangler.toml` | Pages / Workers / OpenNext のいずれか |
| 正本仕様記述 | `deployment-gha.md` / `deployment-cloudflare.md` | workflow 名・Node 値・deploy target の正本記述 |
| 監視対象 | 05a observability-matrix.md | 監視対象として列挙された workflow 名 |

## Schema / 共有コード Ownership 宣言

| 項目 | 内容 |
| --- | --- |
| 編集する schema / 共通コード | なし（D1 schema / Zod schema / `packages/shared` / `_shared/` は編集しない） |
| 本タスクが ownership を持つか | no（docs-only cleanup。正本 docs の更新は Phase 12 の承認ゲートに従う） |
| 他 wave への影響 | `UT-CICD-DRIFT-IMPL-*` が workflow yaml / wrangler.toml の実装変更を引き受ける |
| 競合リスク | UT-GOV-001 / UT-GOV-003 と workflow 名の参照が競合し得るため、Phase 2/11 で current facts を照合 |
| migration 番号 / exports 改名の予約 | N/A |

## 実行タスク

1. `.github/workflows/` 配下の全 yaml ファイルを一覧化する（完了条件: ファイル名・最終更新日が表に固定されている）。
2. 各 yaml から Node / pnpm / job 名 / trigger / deploy target を抽出する（完了条件: 全 yaml × 5 項目で表が埋まっている）。
3. 正本仕様（`deployment-gha.md` / `deployment-cloudflare.md`）の workflow 関連記述を引用する（完了条件: 正本記述がそのまま引用されている）。
4. 05a 観測性タスクの監視対象一覧を引用する（完了条件: 監視対象 workflow 名がリスト化されている）。
5. 真の論点と依存境界を確定する（完了条件: 上流 2・並列 2・下流 2 すべてに前提・出力が記述）。
6. 4条件評価を全 PASS で確定する（完了条件: 各観点に PASS 判定と根拠が記載）。
7. AC-1〜AC-11 を index.md と同期する（完了条件: AC 文言の差分ゼロ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md | 原典 unassigned-task スペック |
| 必須 | .github/workflows/backend-ci.yml | apps/api CI 実体 |
| 必須 | .github/workflows/ci.yml | monorepo CI 実体 |
| 必須 | .github/workflows/validate-build.yml | build 検証実体 |
| 必須 | .github/workflows/verify-indexes.yml | indexes drift 検出実体 |
| 必須 | .github/workflows/web-cd.yml | apps/web CD 実体 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | GHA 正本仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare deploy 正本仕様 |
| 必須 | apps/web/wrangler.toml | apps/web deploy 実体 |
| 必須 | apps/api/wrangler.toml | apps/api deploy 実体 |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md | 05a 監視対象 |

## 実行手順

### ステップ 1: workflow yaml の棚卸し

- `ls .github/workflows/*.yml` で実体を列挙する
- 各 yaml を `Read` で読み、Node / pnpm / job / trigger / deploy target を抽出する
- 抽出結果を `outputs/phase-01/main.md` の表に固定する

### ステップ 2: 正本仕様と監視前提の引用

- `deployment-gha.md` / `deployment-cloudflare.md` から workflow 関連箇所を逐語引用する
- 05a observability-matrix.md から監視対象 workflow 名を抽出する

### ステップ 3: 真の論点・依存境界・4条件のロック

- 「workflow を直すタスク」ではなく「drift を分類するタスク」として記述されているか自己レビューする
- 依存境界表に並列タスク UT-GOV-001 / UT-GOV-003 との interface を明示する
- 4条件すべて PASS で固定する

### ステップ 4: AC のロック

- AC-1〜AC-11 を `outputs/phase-01/main.md` に列挙し index.md と完全一致させる

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・依存境界・4条件・棚卸し結果を差分マトリクス設計の入力として渡す |
| Phase 3 | 4条件評価の根拠を代替案 PASS/MINOR/MAJOR 判定の比較軸に再利用 |
| Phase 4 | AC-1〜AC-11 をテスト戦略のトレース対象に渡す |
| Phase 7 | AC matrix の左軸として AC-1〜AC-11 を使用 |
| Phase 12 | impl 必要差分を派生タスクとして起票する方針を unassigned-task-detection.md に出力 |

## 多角的チェック観点（AIが判断）

- 不変条件 #5: workflow から `apps/web` 経由で D1 へアクセスする deploy 構成が混入していないか
- 不変条件 #6: GAS prototype が CI/CD の deploy 対象に含まれていないか
- docs-only と impl 必要の境界: 仕様書の表記揺れにすぎないものと、yaml 構造変更が必要なものの境界が混同されていないか
- CLOSED Issue: GitHub Issue #58 を再オープンせず、仕様書側に番号のみ記録しているか
- 派生タスク方針: impl 必要差分すべてが `unassigned-task/UT-CICD-DRIFT-IMPL-*.md` の起票方針として記述されているか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「drift 分類タスク」に再定義 | 1 | spec_created | main.md 冒頭 |
| 2 | 依存境界（上流 2 / 並列 2 / 下流 2）の固定 | 1 | spec_created | UT-GOV-001 / UT-GOV-003 / UT-26 との interface 明示 |
| 3 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | 不変条件 #5 / #6 の touched 確認 | 1 | spec_created | index.md と同期 |
| 5 | AC-1〜AC-11 の確定 | 1 | spec_created | index.md と完全一致 |
| 6 | workflow 棚卸し結果の表化 | 1 | spec_created | Phase 2 入力 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件・真の論点・依存境界・棚卸し結果） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 真の論点が「drift を docs-only / impl 必要に分類するタスク」として再定義されている
- [ ] 4条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界表に上流 2・並列 2・下流 2 すべてが前提と出力付きで記述されている
- [ ] AC-1〜AC-11 が index.md と完全一致している
- [ ] workflow 棚卸しの 5 項目（Node / pnpm / job / trigger / deploy target）が確認指示として固定されている
- [ ] 不変条件 #5 / #6 のいずれにも違反する構成が想定されていない

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置予定
- 苦戦想定（docs-only / impl 境界、Pages vs Workers、05a 監視対象、CLOSED Issue、required_status_checks 整合）の 5 件が AC または多角的チェックに対応
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計：差分マトリクス設計)
- 引き継ぎ事項:
  - 真の論点 = 三者（docs / code / 監視前提）の drift 分類
  - 4条件評価 (全 PASS) の根拠
  - workflow 棚卸し結果 5 項目
  - 並列タスク UT-GOV-001 / UT-GOV-003 との interface 整合の必要性
  - CLOSED Issue #58 の取り扱い方針
- ブロック条件:
  - 4条件のいずれかが MINOR/MAJOR
  - AC-1〜AC-11 が index.md と乖離
  - workflow 棚卸し結果が空欄
