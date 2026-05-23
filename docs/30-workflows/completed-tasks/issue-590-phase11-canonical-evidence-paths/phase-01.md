# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | ISSUE-590-PHASE11-EVIDENCE-PATHS-001 |
| Phase | 1 |
| 状態 | completed |
| taskType | implementation |
| subtype | tooling-schema-validator |
| visualEvidence | NON_VISUAL |

## 目的

Issue #590 が要求する `phase11-evidence-canonical-paths.json` の schema + validator の機能要件・受入条件を確定する。

## 入力

- 由来: `docs/30-workflows/completed-tasks/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-05.md`
- 親: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md`
- 既存 schema 規約: `.claude/skills/task-specification-creator/schemas/*.json`
- 既存 validator 規約: `.claude/skills/task-specification-creator/scripts/validate-*.js`
- 既存 test 規約: `.claude/skills/task-specification-creator/scripts/__tests__/validate-*.test.mjs`

## 真の論点

> Phase 11 で取得すべき evidence path が文書ごとに揺れると、Phase 12 で「どのファイルを見れば判定できるか」が一意に解決できず、false green / 取得漏れ / 古い path 参照が発生する。
> JSON schema + validator で path を正本化し、compliance check が実体存在まで確認できる状態を作る。

**根本原因**: 親 issue-549 の Phase 11 では canonical path 表が markdown でのみ定義され、機械可読な正本がない。各 workflow の Phase 11 設計者が表を見ながら手書きすると drift が発生する。

## P50 チェック

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在する | No | Phase 5 で新規実装 |
| 既存 validator pattern に準拠可能 | Yes | `validate-schema.js` / `validate-phase11-screenshot-coverage.js` を参考 |
| 既存 schema pattern に準拠可能 | Yes | `phase-spec.json` 等と同 directory に新規追加 |

`implementation_mode = "new"`。

## 機能要件

| ID | 要件 | 種別 |
| --- | --- | --- |
| FR-1 | JSON schema が `taskId` / `workflowDir` / `evidence[]` を必須化する | schema |
| FR-2 | `evidence[].kind` が enum（`typecheck` / `lint` / `test` / `build` / `grep-gate` / `runtime-observation`）に制限される | schema |
| FR-3 | `evidence[].id` が同一 JSON 内で unique | schema (uniqueItems on derived array) または validator 側 |
| FR-4 | `evidence[].path` が workflow ディレクトリからの相対 path（`outputs/phase-11/...` 始まり） | schema |
| FR-5 | `evidence[].command` が空でない string | schema |
| FR-6 | `evidence[].acquiredBy` が enum（`spec_created` / `implementation_cycle` / `post_merge`） | schema |
| FR-7 | validator が CLI として `node validate-phase11-canonical-evidence-paths.js <jsonPath...>` で起動可能 | validator |
| FR-8 | `--check-existence` フラグ指定時、各 `evidence[].path` の実体ファイル存在を検査 | validator |
| FR-9 | exit code: 0 = OK / 1 = schema 不正 / 2 = path 不存在 / 3 = 引数不正 | validator |
| FR-10 | エラー時に対象 JSON path / line / 違反項目を stderr に出力 | validator |

## 非機能要件

| ID | 要件 |
| --- | --- |
| NFR-1 | Node 24 + 既存 skill script 互換の軽量 ESM validator で動作 |
| NFR-2 | 既存 schema/validator の naming / 配置 convention に準拠 |
| NFR-3 | external network 呼び出しなし |
| NFR-4 | 実行時間 1 秒未満（小規模 JSON 想定） |

## 受入条件マッピング

| AC | 確認方法 |
| --- | --- |
| AC-1 | `validate-schema.js --schema schemas/phase11-evidence-canonical-paths.schema.json --data <manifest>` で検証成功 |
| AC-2 | fixture（valid JSON）に対して validator exit 0 |
| AC-3 | fixture（kind enum 違反）に対して validator exit 1 |
| AC-4 | fixture（重複 id）に対して validator exit 1 |
| AC-5 | fixture（path 不存在 + `--check-existence`）に対して validator exit 2 |
| AC-6 | issue-549 の実 JSON に対して `--check-existence` なしで validator exit 0 |
| AC-7 | vitest / node test で全テスト pass |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Phase 11 evidence drift 排除、compliance check 自動化の基盤 |
| 実現性 | PASS | 既存 validator pattern を再利用し、新規 dependency は追加しない |
| 整合性 | PASS | task-specification-creator skill の schemas/scripts 配置 convention に整合 |
| 運用性 | PASS | CLI と CI の双方から呼び出し可能、再利用範囲広い |

## 完了条件

- [x] FR-1〜FR-10 が列挙されている
- [x] NFR が列挙されている
- [x] 受入条件 AC-1〜AC-7 が確認方法とともに記載されている
- [x] スコープ外（runtime evidence の取得実行など）が明記されている

## 成果物

- `outputs/phase-01/main.md`

## 参照資料

- `docs/30-workflows/completed-tasks/issue-590-phase11-canonical-evidence-paths/index.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-11.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

NON_VISUAL tooling タスクのため、統合テストは validator 単体テストと issue-549 実 JSON での dry-run validation で代替する。
