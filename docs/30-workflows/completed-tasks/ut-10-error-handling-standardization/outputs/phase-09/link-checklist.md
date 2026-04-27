# リンク検証チェックリスト（Phase 9 成果物）

## 検証対象

| 種別 | 対象 | 確認方法 |
| --- | --- | --- |
| outputs/phase-XX/*.md → 親 phase-XX.md | 各 outputs に対応する phase 仕様書 | 相対パスとファイル存在 |
| outputs/phase-XX/*.md → 他 phase outputs | クロス Phase 参照 | 相対パスとファイル存在 |
| `apps/api/docs/error-handling.md` → 親 spec | Phase 12で作成済み | 解消済み |
| `index.md` → 各 phase / outputs | Phase 12で整備済み | 解消済み |

## 各 outputs ファイル参照状況

### outputs/phase-01/

- requirements.md / error-code-taxonomy-draft.md
- 内部リンク: なし（自己完結）
- 外部参照: docs/30-workflows/.../phase-01.md（親仕様）→ 存在確認 ✅

### outputs/phase-02/

- 6 ファイル（api-error-schema, error-code-taxonomy, error-handler-middleware-design, retry-strategy-design, d1-compensation-pattern, structured-log-format）
- 相互参照: error-code-taxonomy.md ↔ api-error-schema.md → 同一ディレクトリ参照 ✅
- 外部参照: phase-02.md → 存在確認 ✅

### outputs/phase-03/

- design-review-report.md / gate-decision.md
- 参照: outputs/phase-02/* → 存在確認 ✅

### outputs/phase-04/

- test-design.md / test-cases.md / red-confirmation.md
- 参照: outputs/phase-02/api-error-schema.md → 存在確認 ✅

### outputs/phase-05/

- implementation-summary.md / file-change-list.md
- 参照: outputs/phase-04/test-cases.md, outputs/phase-02/* → 存在確認 ✅

### outputs/phase-06/

- edge-case-tests.md / regression-guards.md / security-leak-tests.md
- 参照: phase-05.md（実装内容）, outputs/phase-04/* → 存在確認 ✅

### outputs/phase-07/

- coverage-report.md / coverage-matrix.md
- 参照: outputs/phase-06/*, outputs/phase-04/test-cases.md → 存在確認 ✅

### outputs/phase-08/

- refactor-changes.md / refactor-decision-table.md
- 参照: outputs/phase-02/api-error-schema.md, outputs/phase-07/coverage-report.md, packages/shared/package.json → 存在確認 ✅

### outputs/phase-09/

- quality-report.md / link-checklist.md(本文書) / type-check-report.md
- 相互参照: 同一ディレクトリ → 存在確認 ✅

## 外部リンク（HTTP）検証

| URL | 用途 | 検証 |
| --- | --- | --- |
| RFC 7807 | api-error-schema.md / structured-log-format.md で参照 | URL ベタ書き、リンク切れ検証は manual scope 外（IETF 安定 URL） |
| GitHub URL | なし | – |

## index.md / 設計ドキュメント

| ファイル | 状態 | 対応 |
| --- | --- | --- |
| `docs/30-workflows/ut-10-error-handling-standardization/index.md` | Phase 12で作成済み | 解消済み |
| `apps/api/docs/error-handling.md` | Phase 12で作成済み | 解消済み |

## 結果

リンク切れゼロ。Phase 12 で error-handling.md 作成時に親 spec への相対パスを再検証する。

## 完了条件

- [x] outputs/phase-01〜09 の相互参照リンク切れゼロ
- [x] 親 phase-XX.md への back link がすべて解決
- [x] Phase 12 で必要となる新規リンク整備項目を記録
