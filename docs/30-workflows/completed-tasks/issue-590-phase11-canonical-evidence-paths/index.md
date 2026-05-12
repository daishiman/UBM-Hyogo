# issue-590-phase11-canonical-evidence-paths - タスク仕様書 index

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| タスク名 | Phase 11 canonical evidence path schema + validator 導入 |
| ディレクトリ | docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths |
| Wave | 1 |
| 実行種別 | serial（schema 設計 → validator 実装 → 既存 workflow への schema 参照追加） |
| 作成日 | 2026-05-10 |
| 担当 | unassigned |
| 状態 | implemented-local |
| taskType | implementation |
| subtype | tooling-schema-validator |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| priority | LOW |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/590（CLOSED、Refs #590 で運用） |
| 親 | docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/ |
| 由来仕様 | docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md |

## 目的

`phase11-evidence-canonical-paths.json` の **JSON Schema** と **validator スクリプト**を導入し、Phase 11 で取得する runtime evidence の保存先 path（typecheck / lint / test / build / grep-gate / runtime observation）の表記揺れを構造的に排除する。

これにより:

1. 各 workflow の `outputs/phase-11/canonical-paths.json` が schema で機械検証可能になる
2. compliance check が「予約 path に実体が存在するか」を runtime と独立に検査できる
3. Phase 12 判定条件が「どの path の log を見ればよいか」一意に解決される
4. Issue #549 の Phase 11 で予約された 5 点セット（typecheck / lint / test / build / grep-gate）+ runtime observation 7 日分 path の正本フォーマットを確立する

## 背景・派生元

- 親タスク `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md` で「canonical evidence path（実装サイクルで取得する 5 点セット予約）」が表として定義されたが、JSON / 機械可読フォーマットの正本がない
- 派生元 `docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md` で「runtime evidence path の揺れを排除する」要件が立てられた
- 既存の schema 群（`.claude/skills/task-specification-creator/schemas/*.json`）と validator 群（`.claude/skills/task-specification-creator/scripts/validate-*.js`）の規約に従い、同 skill 配下に追加配置する

## スコープ

### 含む（今回実装サイクルで完了）

1. **Schema 新規作成**: `.claude/skills/task-specification-creator/schemas/phase11-evidence-canonical-paths.schema.json`
   - JSON Schema 2020-12 形式
   - 必須キー: `taskId`, `workflowDir`, `evidence` 配列
   - `evidence` 各要素必須キー: `id`, `kind`(enum: typecheck / lint / test / build / grep-gate / runtime-observation), `path`(workflow 相対 path), `command`, `acquiredBy` (`spec_created` / `implementation_cycle` / `post_merge`)
2. **Validator 実装**: `.claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js`
   - 既存 skill script と同じ軽量 ESM validator による schema 互換検証
   - 対象 JSON ファイル走査（CLI 引数 / 既定 glob）
   - `--check-existence` フラグで実体ファイル存在チェック
   - exit code 規約: 0 = OK, 1 = schema 不正, 2 = path 不存在, 3 = 引数不正
3. **テスト追加**: `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-canonical-evidence-paths.test.mjs`
   - 正常系 / schema 違反 / path 不存在 / kind enum 違反 / 重複 id 検出
4. **package.json scripts** に `validate:phase11-paths` を追加（root の `package.json` または同 skill 内の任意の規約に従う）
5. **親 workflow 適用**: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/phase-11/canonical-paths.json` を新 schema 形式で生成し、Phase 11 の表と整合させる
6. **schema 参照リンク追加**: 親 `phase-11.md` 末尾に schema 参照 1 行を追記
7. **CI gate（任意 / 軽量）**: 既存 `verify-indexes` 系 workflow と同列の任意 gate を追加するかは Phase 8 / Phase 12 で再評価（必須ではない）
8. aiworkflow-requirements の参照同期（Phase 12）
9. 派生元 `unassigned-task/u-fix-cf-acct-01-...-followup-05.md` を `completed-tasks/` 相当に supersede 記述

### 含まない

- Phase 11 evidence の **runtime 取得実行**（schema / validator 導入のみ。実 evidence 取得は親 issue-549 の close-out サイクルで実施）
- 他 workflow（issue-549 以外）への遡及適用（schema 形式のみ提供。各 workflow の Phase 11 設計時に随時採用）
- Phase 11 以外の evidence path 標準化（本タスクは Phase 11 限定）
- Cloudflare D1 / Worker / Pages 構成変更
- Google Form schema 変更
- aiworkflow-requirements の indexes 構造変更

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | issue-549 Phase 11（completed） | canonical path 表が定義済み。schema 化の入力 |
| 上流 | task-specification-creator skill 既存 schemas / scripts 規約 | 配置先・naming convention を継承 |
| 並列 | なし | 単一 PR で完結 |
| 下流 | 他 workflow の Phase 11 設計 | 新 schema を任意採用可能になる |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md | 由来仕様 |
| 必須 | docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md | canonical path 表（入力） |
| 必須 | .claude/skills/task-specification-creator/schemas/ | schema 配置 convention |
| 必須 | .claude/skills/task-specification-creator/scripts/validate-schema.js | validator 実装の参照先 |
| 必須 | .claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-screenshot-coverage.test.mjs | テスト構成の参照先 |
| 推奨 | .claude/skills/aiworkflow-requirements/ | Phase 12 同期対象 |

## 完了条件（Definition of Done / 全 Phase 横断）

- [x] schema ファイルが存在し、JSON Schema 2020-12 互換の構造として local validator で OK
- [x] validator スクリプトが存在し、CLI として動作する
- [x] Node test で正常系 / 異常系がすべて pass
- [x] 親 issue-549 の Phase 11 canonical path JSON が新 schema で validate 0
- [x] `--check-existence` で path の実体存在判定が動作する（テスト用 fixture と本タスク manifest で検証）
- [x] 本タスク差分起因の validator/test エラーなし（`node --test` 11 件 PASS、`validate:phase11-paths` exit 0）
- [x] aiworkflow-requirements 該当 references が新 schema を参照している
- [x] 派生元 unassigned-task が supersede マーキング済み
- [ ] PR 作成は user 承認後

## ブランチ戦略

- ブランチ名: `docs/issue-590-phase11-canonical-evidence-paths-spec`（仕様書のみの場合）または `feat/issue-590-phase11-canonical-evidence-paths`（実装含む場合）
- base: `dev`
- 本仕様書 phase-13 で実装ブランチ運用と PR 作成手順を定義する

## 実装区分判定根拠

由来仕様（`u-fix-cf-acct-01-...-followup-05.md`）の DoD は `typecheck / lint / test / build / grep-gate / runtime observation path JSON / validator` で、JSON schema ファイルの新規追加・validator スクリプトの新規実装・テスト追加が含意されるため、**実装仕様書**として作成する（CONST_004）。
