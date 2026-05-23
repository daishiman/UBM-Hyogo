# Phase 7: テストカバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 7 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 7 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-07/main.md

## 完了条件

- [x] Phase 7 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 07 — AC マトリクス

[実装区分: 実装仕様書]

## AC × 検証 × 実装

| AC | 内容 | 検証手段 | 実装 / script | 期待 |
| --- | --- | --- | --- | --- |
| AC-1 | 並行 POST が実行できる | `tag-queue-race.mjs --concurrency 5` | `runConcurrentResolve`（Promise.all） | 5 件 settle |
| AC-2 | 成功は 1 件のみ | `analyzeResults` | script | `successes === 1` |
| AC-3 | 敗者は 409 `race_lost` | `analyzeResults` | script | `raceLosts === concurrency - 1` |
| AC-4 | 副作用 = 成功 payload 分のみ | `scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging --command "SELECT ..."` + `--side-effect-input` | manual SQL + runner side-effect analysis | `member_tags` 増分 = tagCodes 行数（confirmed 時）、`audit_log` 増分 = 1、queue status resolved |
| AC-5 | evidence 保存 | `writeEvidence` | script | `outputs/phase-11/<ISO-ts>/result.json` が存在し JSON schema に準拠 |

## トレーサビリティ

| AC | 実装関数 | テスト | 手動検証 |
| --- | --- | --- | --- |
| AC-1 | `runConcurrentResolve` | shell test case 1（dry-run で options 化確認） | Phase 11 staging 実行 |
| AC-2 | `analyzeResults` | shell test case 2 / 3 | Phase 11 result.json |
| AC-3 | `analyzeResults` | shell test case 2 / 4 | Phase 11 result.json |
| AC-4 | `analyzeSideEffects` | shell side-effect pass/fail | Phase 11 before/after SQL + side-effects.json |
| AC-5 | `writeEvidence` | — | Phase 11 でファイル存在確認 |

## 成果物

- `outputs/phase-07/main.md`
- `outputs/phase-07/ac-matrix.md`

## 次 Phase

- [phase-08.md](./phase-08.md): DRY 化
