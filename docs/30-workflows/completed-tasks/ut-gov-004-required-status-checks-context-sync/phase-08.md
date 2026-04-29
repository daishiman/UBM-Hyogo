# Phase 8: DRY 化 / リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Required Status Checks の context 名同期 (UT-GOV-004) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / リファクタリング |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（governance / refactoring / dry） |

## 目的

UT-GOV-004 はコード実装よりも「実在 workflow / job 名抽出」「草案 8 contexts との対応表生成」「段階適用判定」「lefthook ↔ CI 対応表」「strict 採否決定」を主要成果物とするドキュメント中心タスクである。Phase 8 では、これら抽出・対応表生成・段階適用判定の3工程に内在する **手順とデータ構造の重複** を抽象化し、Phase 9 以降で `outputs/phase-XX/*.md` と「UT-GOV-001 が直接参照する確定リスト schema」が二重メンテにならない状態を作る。コード実装はせず、共通ヘルパ方針と確定リスト schema 化方針のみを仕様として確定する。

## 実行タスク

1. 抽出ロジックの共通ヘルパ化方針を定義する（完了条件: `.github/workflows/*.yml` から `name:` / `jobs.<key>.name` / `strategy.matrix` を 1 経路で抽出する擬似ヘルパの入出力契約が記述されている）。
2. 対応表生成ロジックの共通ヘルパ化方針を定義する（完了条件: 草案 context → 実在 context の名寄せを「workflow name」「job name」「matrix value」を引数化する形で 1 経路に集約する擬似ヘルパが記述されている）。
3. 段階適用判定（phase 1 既出 / phase 2 新規）の判定関数化方針を定義する（完了条件: `hasGreenRunInLastNDays(context, n=30)` 相当の擬似関数 1 個に集約され、各 context の判定がそれを呼ぶだけになる）。
4. 確定 context リストの schema 化方針を確定する（完了条件: UT-GOV-001 がそのまま branch protection PATCH body の `required_status_checks.contexts` に流し込める YAML / JSON 形式が定義されている）。
5. lefthook ↔ CI 対応表のキー設計を確定する（完了条件: 両側のキーが `pnpm <script>` 名で揃い、片側のみで完結する記述が排除されている）。
6. navigation drift（artifacts.json / index.md / phase-XX.md / outputs path / 原典 `docs/30-workflows/completed-tasks/UT-GOV-004-...` への参照）が 0 であることを確認する（完了条件: 不一致 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典タスク仕様 |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 後続タスク（確定リストの consumer） |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/context-name-mapping.md | 草案 8 contexts と実在 context の対応表 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/staged-rollout-plan.md | 段階適用案 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-02/lefthook-ci-correspondence.md | lefthook と CI の対応表 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/outputs/phase-07/ac-matrix.md | AC トレース表 |
| 必須 | docs/30-workflows/ut-gov-004-required-status-checks-context-sync/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | .github/workflows/ 配下全 YAML | 抽出対象（読取専用） |
| 必須 | docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge | lefthook hook 名規約 |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | DRY 化記法の参照事例 |

## Before / After 比較テーブル

### 命名規則

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| context 表記 | `lint` / `ci / lint` / `pr-check / lint` 混在 | 必ず `<workflow name> / <job name>` フルパス | 同名 job の workflow 横断衝突回避（原典 §8.3） |
| matrix 展開 context | `build (node-22)` 等の口頭注記のみ | `<workflow> / <job> (<matrix-value-1>, <matrix-value-2>)` 形式に統一 | GitHub 内部規則に準拠（原典 §8.2） |
| 草案 8 contexts | `typecheck` / `lint` 等の単独語 | `draft:typecheck` 等の prefix で「草案」と「確定」を区別 | 確定後に同名で参照されても誤読しない |
| lefthook hook 名 | `pre-commit-lint` 等の独自名 | `pre-commit:lint` の `<stage>:<task>` 形式 | lefthook.yml キーと CI job 名と pnpm script を一意に紐付け |
| strict 設定 | `strict-true` / `up_to_date_required` 揺れ | `required_status_checks.strict` (bool) | GitHub API key 名そのまま採用 |

### 型 / データ構造

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 抽出結果 | 各 phase で adhoc Markdown 表 | `WorkflowJob { workflow: string; job: string; matrix?: string[]; contextName: string }` の擬似型を 1 箇所で定義 | 抽出 → 対応表生成 → 段階適用判定の 3 工程で同一型を流す |
| 対応表エントリ | `{草案名, 実在名}` の 2 列のみ | `MappingEntry { draftName; resolvedContext; status: 'present'\|'missing'\|'matrix-expanded'; lastGreenRunAt?: ISO8601 }` | 段階適用判定をエントリ単位で完結させる |
| 確定リスト | Markdown 箇条書き | `confirmed-contexts.yml`（後述 schema 化方針） | UT-GOV-001 が機械可読で読み込める |
| lefthook ↔ CI 対応表 | 片側だけの表 | `Mapping { hook: string; ciContext: string; pnpmScript: string }` | 三項一意キーで drift を検出可能 |

### パス / 成果物配置

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| 抽出結果 | phase 内に散在 | `outputs/phase-08/extracted-jobs.md` に集約 | 単一ソース化 |
| 対応表 | 草案ごとに別ファイル | `outputs/phase-08/mapping-table.md` に集約 | 同上 |
| 確定 context リスト | Markdown 内 | `outputs/phase-08/confirmed-contexts.yml`（schema 付き） | UT-GOV-001 の入力 |
| lefthook ↔ CI 対応 | 別タスク文書に散在 | `outputs/phase-08/lefthook-ci-mapping.md` | 双方向同期の正本 |

## 確定 context リスト schema（UT-GOV-001 への引き渡し形式）

```yaml
# outputs/phase-08/confirmed-contexts.yml
version: 1
generated_at: "2026-04-29"
source_task: "UT-GOV-004"
target_consumer: "UT-GOV-001"
strict_decision:
  dev: false
  main: true   # ← Phase 9 で決定。Phase 10 GO 条件で確定済みであること。
contexts:
  - name: "ci / typecheck"          # GitHub に登録済みの実在 context 名
    draft_origin: "draft:typecheck" # 草案 8 件のどれに対応するか
    last_green_run_at: "2026-04-28T12:34:56Z"
    matrix_expansion: null
    apply_phase: 1                  # 1=既出のため即投入 / 2=新規で後追い投入
  - name: "ci / build (node-22)"
    draft_origin: "draft:build"
    last_green_run_at: "2026-04-28T11:00:00Z"
    matrix_expansion: ["node-22"]
    apply_phase: 1
  # ...
deferred_contexts:                  # phase 2 へ送る or UT-GOV-005 へリレー
  - draft_origin: "draft:phase-spec-validate"
    reason: "workflow 未存在"
    relay_to: "UT-GOV-005"
```

> UT-GOV-001 は `contexts[].name` と `strict_decision.<env>` のみを branch protection PATCH の body に流し込む。`deferred_contexts` は投入対象外。schema バージョンは `version: 1` 固定とし、破壊的変更は新 minor を切る。

## 共通ヘルパ化方針（擬似 spec）

```ts
// 抽出ヘルパ（Phase 5 の context-extractor 擬似仕様）
extractWorkflowJobs(workflowDir: string): WorkflowJob[]
// 対応表生成（Phase 5 の mapping-builder 擬似仕様）
buildMappingTable(draft: DraftContext[], extracted: WorkflowJob[]): MappingEntry[]
// 段階適用判定（Phase 6 の apply-phase-classifier 擬似仕様）
classifyApplyPhase(entry: MappingEntry, lookbackDays = 30): 1 | 2 | 'relay'
// 確定リスト emit（Phase 8 の出力）
emitConfirmedContexts(entries: MappingEntry[]): YamlString
```

> 上記は **擬似コード** であり実装はしない。Phase 5 / Phase 6 ランブックの実行手順を本ヘルパ単位で記述しなおすこと（重複手順の排除）。

## 重複箇所の抽出

| # | 重複候補 | 抽出先 | 他タスク転用可否 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `.github/workflows/*.yml` の YAML パース + `name:` 抽出 | `extractWorkflowJobs` | 可（UT-GOV-005 / UT-GOV-007 で再利用） | matrix 展開を必ず含む |
| 2 | `gh api repos/:owner/:repo/commits/:sha/check-runs` 呼び出し | `fetchRecentCheckRuns(lookbackDays)` | 可（UT-GOV-001 の事前検証でも使用） | レート制限考慮 |
| 3 | 草案 → 実在の名寄せ判定 | `buildMappingTable` | 限定的 | 本タスク固有 |
| 4 | 段階適用判定 | `classifyApplyPhase` | 可（branch protection 系全般） | lookbackDays を引数化 |
| 5 | lefthook.yml と CI workflow の対応キー算出 | `buildLefthookCiMapping` | 可（task-git-hooks-lefthook-and-post-merge と共有） | pnpm script 名を中継キーにする |
| 6 | 確定 context YAML emitter | `emitConfirmedContexts` | UT-GOV-001 と一対一 | schema バージョン固定 |

## navigation drift の確認

| チェック項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| artifacts.json `phases[*].outputs` と各 phase-XX.md の成果物 path 一致 | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` 表の file 列と実ファイル | ls 照合 | 完全一致 |
| 原典 `completed-tasks/UT-GOV-004-...md` への参照 | 全 phase からの相対 path | 実在 |
| UT-GOV-001 仕様書との相互リンク | `completed-tasks/UT-GOV-001-...md` を本タスク phase-10 から参照 | 双方向リンク成立 |
| `.github/workflows/` 各 YAML への参照 | `git ls-files .github/workflows/` と照合 | 100% 実在 |

## 共通化パターン

- context 名: 必ず `<workflow> / <job>` フルパス。matrix 展開時は ` (<v1>, <v2>)` を付加。
- 草案語と確定語の混同を避けるため、草案は `draft:<name>` prefix を必ず付ける。
- lefthook stage は `pre-commit` / `pre-push` / `commit-msg` の 3 種に限定し、それ以上は使わない。
- 段階適用 phase は数値 1 / 2、リレーは文字列 `'relay'` の 3 値で固定。

## 削除対象一覧

- 仮置きされた草案 8 件のうち、実在しない workflow への参照（`phase-spec-validate` 等が未存在の場合）
- 旧 husky 由来の hook 名（`task-husky-rejection-adr` で廃止済みのもの）
- `wrangler` 系 CI への参照（本タスクの context 抽出対象外）

## 実行手順

### ステップ 1: 抽出ヘルパの入出力契約を文書化
- `extractWorkflowJobs` の入出力を `outputs/phase-08/main.md` に記述。

### ステップ 2: 対応表エントリ型と段階適用判定関数を文書化
- `MappingEntry` / `classifyApplyPhase` を §共通ヘルパ化方針に整合する形で記述。

### ステップ 3: 確定 context schema (`confirmed-contexts.yml`) のサンプルを作成
- 上記 §確定 context リスト schema の YAML をそのまま出力する想定。

### ステップ 4: lefthook ↔ CI 対応の三項キー方針を文書化
- `<hook>:<task>` ↔ `<workflow> / <job>` ↔ `pnpm <script>` の 3 列表を作成。

### ステップ 5: navigation drift 確認
- artifacts.json と各 phase-XX.md / 原典 / UT-GOV-001 仕様の相互リンクを照合。

### ステップ 6: outputs/phase-08/main.md に集約
- 上記すべてを 1 ドキュメントに統合。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済みの schema を governance QA の前提として参照 |
| Phase 10 | 確定 context schema が GO 条件の必須入力 |
| Phase 11 | smoke で `gh api` 出力を schema と比較する |
| UT-GOV-001 | `confirmed-contexts.yml` を入力ファイルとして直接消費 |
| UT-GOV-005 | `deferred_contexts[].relay_to` で「未存在 context 新設タスク」を受け取る |

## 多角的チェック観点

- 価値性: 確定 context schema により UT-GOV-001 着手時の手戻りをゼロにする。
- 実現性: 抽出 / 対応表生成 / 判定の 3 工程が共通ヘルパ 4 個に収束する。
- 整合性: lefthook ↔ CI 対応で pnpm script を中継キーに固定し、ローカル / CI のドリフトを構造的に防ぐ。
- 運用性: schema バージョン化により将来の context 追加で UT-GOV-001 を再着手する手順が確定。
- 認可境界: 本 Phase は読取のみ、書込み（branch protection 適用）は UT-GOV-001 の責務。
- governance: strict 採否を schema の `strict_decision` に内包し、Phase 9 で値を埋める。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 抽出ヘルパ契約定義 | 8 | spec_created | `extractWorkflowJobs` |
| 2 | 対応表エントリ型定義 | 8 | spec_created | `MappingEntry` |
| 3 | 段階適用判定関数定義 | 8 | spec_created | `classifyApplyPhase` |
| 4 | 確定 context schema 化 | 8 | spec_created | `confirmed-contexts.yml` |
| 5 | lefthook ↔ CI 対応の三項キー設計 | 8 | spec_created | pnpm script 中継 |
| 6 | navigation drift 0 確認 | 8 | spec_created | 双方向リンク成立 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果（共通ヘルパ・schema・対応表方針） |
| schema | outputs/phase-08/confirmed-contexts.yml | UT-GOV-001 への引き渡し形式（version: 1） |
| ドキュメント | outputs/phase-08/lefthook-ci-mapping.md | hook ↔ CI ↔ pnpm script 三項対応 |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] 共通ヘルパ 4 個（extract / mapping / classify / emit）の入出力契約が記述されている
- [ ] `confirmed-contexts.yml` の schema バージョン 1 が定義され、UT-GOV-001 の入力として直接消費可能である
- [ ] lefthook ↔ CI 対応が pnpm script を中継キーとする三項表で記述されている
- [ ] context 名の表記が必ず `<workflow> / <job>` フルパス（matrix 展開含む）で揃っている
- [ ] navigation drift 0
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 3 ファイルが `outputs/phase-08/` に配置予定
- 共通ヘルパ 4 個が一覧化
- 確定 context schema が version 固定
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項:
  - 共通ヘルパ 4 個の擬似 spec（QA で「抽象化漏れ」を点検する基準として使用）
  - `confirmed-contexts.yml` schema（QA の機械可読性チェック・UT-GOV-001 直接参照可能性検証の前提）
  - lefthook ↔ CI 三項対応表（QA で漏れ検査）
  - strict 採否の決定枠（Phase 9 で値を埋める）
- ブロック条件:
  - 共通ヘルパが 3 個以下に収束しない（重複が残る）
  - schema が UT-GOV-001 の PATCH body にそのまま流せない形になっている
  - lefthook ↔ CI 対応の片側のみが記述された行が残る

## 依存成果物参照

- `outputs/phase-02/context-name-mapping.md`
- `outputs/phase-02/staged-rollout-plan.md`
- `outputs/phase-02/lefthook-ci-correspondence.md`
- `outputs/phase-07/ac-matrix.md`
