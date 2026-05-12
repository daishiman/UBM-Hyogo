# Phase 8: DRY 化

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 8 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## DRY 検討

### validator 共通化

既存 `validate-schema.js` / `validate-phase11-screenshot-coverage.js` と本 validator は JSON 読込 + exit code の構造が共通。共通 helper への抽出を検討:

| 案 | 評価 |
| --- | --- |
| `lib/schema-runner.js` を新設し全 validator が共有 | リファクタ範囲が広く、本タスクスコープを超える |
| 本 validator は単体実装、リファクタは別タスク | **採用** — 既存 validator に手を入れない |
| 本 validator のみ抽象化 | 効果なし（単体のため） |

→ **本タスクでは共通化しない。** リファクタは別 follow-up（unassigned-task 起票候補）。

### fixture 共通化

既存 fixture との共通化要素なし。phase11-canonical-paths 配下に専用 fixture group を新設する。

### schema 部品化（$defs）

`evidenceItem` を `$defs` に抽出済み。さらなる部品化は不要（phase-02.md 設計で完了）。

### CLI option parser 共通化

本 validator の CLI parser は既存 validator と独立（既存も簡易 parser を内包）。共通化は別タスク扱い。

## 完了条件

- [x] validator 共通化の検討と不採用根拠が記載されている
- [x] fixture 共通化の検討結果が記載されている
- [x] schema 部品化（$defs）の状況が記載されている

## 成果物

- `outputs/phase-08/main.md`

## 派生タスク候補（Phase 12 unassigned-task-detection.md 行き）

- `lib/schema-runner.js` 共通化（validator 群のリファクタ）
- CLI option parser の共通 helper 抽出

## 参照資料

- `phase-02.md` / `phase-05.md`
- `.claude/skills/task-specification-creator/scripts/validate-schema.js`
