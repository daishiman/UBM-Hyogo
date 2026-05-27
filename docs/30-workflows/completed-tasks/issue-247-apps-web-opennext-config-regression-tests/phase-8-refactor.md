# Phase 8 — リファクタ

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 1. リファクタ方針

単一ファイル / 4 it block / 約 50 行の小規模 spec のためリファクタは最小限。以下の Lint 観点のみ満たす。

## 2. 適用ルール

- `readText(rel)` を 1 度ずつ呼ぶ。重複読み込みは禁止
- `parseToml` の result は describe スコープで const 共有
- 必須行配列 `['node_modules', '*.test.*', '*.spec.*', '__tests__']` は const 配列で巻き上げ可（インライン許容）

## 3. 命名

| 識別子 | 命名 |
|--------|------|
| ファイル | `opennext-config-regression.spec.ts` |
| describe | `OpenNext Workers configuration regression guard` |
| it 名 | `AC{N}: <要約>` |

## 4. DoD

- ESLint / Prettier 違反 0
- 重複 read なし
- TypeScript strict pass
