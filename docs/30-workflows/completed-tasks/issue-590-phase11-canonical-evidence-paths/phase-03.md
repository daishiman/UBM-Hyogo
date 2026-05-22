# Phase 3: 既存実装調査

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 3 |
| 状態 | completed |
| visualEvidence | NON_VISUAL |

## 目的

新規実装に再利用する既存資産と、衝突を回避すべき既存実装を特定する。

## 既存資産（再利用対象）

| 区分 | パス | 再利用方法 |
| --- | --- | --- |
| schema 配置先 | `.claude/skills/task-specification-creator/schemas/` | 新 schema を同 directory に追加 |
| validator 規約 | `.claude/skills/task-specification-creator/scripts/validate-schema.js` | 軽量 schema 検証パターンと ESM import 構造を参考 |
| validator 規約 | `.claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js` | Phase 11 系 validator の前例として naming / CLI 構造を踏襲 |
| test 規約 | `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-screenshot-coverage.test.mjs` | テスト構造を踏襲（fixture 配置・vitest or node test） |
| 既存依存 | 追加 dependency なし | `package.json` / lockfile churn を避ける |

## 既存 schema 例（規約抽出）

`schemas/phase-spec.json` 等を確認し、以下の convention を踏襲:

- `$schema` = JSON Schema 2020-12（draft 表記は既存に合わせる）
- `additionalProperties: false` を全 object に明示
- `$defs` で 部品化
- naming は kebab-case（ファイル名）/ camelCase（フィールド）

## 既存 validator 例（規約抽出）

`scripts/validate-schema.js` / `scripts/validate-phase11-screenshot-coverage.js` を確認し、以下を踏襲:

- shebang `#!/usr/bin/env node` の有無は既存に合わせる
- script の import 形式は既存 ESM validator に揃える
- exit code を `process.exit(...)` で明示
- stderr 出力は `console.error`

## 衝突確認

| 項目 | 確認結果 | 対応 |
| --- | --- | --- |
| 同名 schema ファイル存在 | なし | 新規追加 OK |
| 同名 validator 存在 | なし | 新規追加 OK |
| `package.json` scripts 衝突 | `validate:phase11-paths` 未定義 | 追加 OK |
| 既存 `outputs/phase-11/canonical-paths.json` 存在 | 親 issue-549 配下に未存在（markdown 表のみ） | 新規生成 OK |

## 既存運用との連携

- `pnpm indexes:rebuild` への影響なし（aiworkflow-requirements indexes は schema を参照しない）
- 既存 lefthook hook への影響なし（pre-commit / pre-push に新 gate を強制追加しない方針）
- 既存 CI workflow への影響なし（任意の `verify-phase11-paths` job 追加は Phase 8 / 12 で再評価）

## 完了条件

- [x] 再利用対象の既存資産が列挙されている
- [x] 衝突がないことが確認されている
- [x] 既存規約（schema 構造 / validator import 形式 / exit code）の踏襲方針が記載されている

## 成果物

- `outputs/phase-03/main.md`

## 参照資料

- `.claude/skills/task-specification-creator/schemas/`
- `.claude/skills/task-specification-creator/scripts/validate-schema.js`
- `.claude/skills/task-specification-creator/scripts/validate-phase11-screenshot-coverage.js`
- `.claude/skills/task-specification-creator/scripts/__tests__/validate-phase11-screenshot-coverage.test.mjs`
