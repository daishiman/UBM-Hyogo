# Phase 8: NON_VISUAL governance（CI gate / lint / type）

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-400-admin-request-audit-target-taxonomy |
| phase | 08 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #400 の admin request audit target taxonomy を実装・検証・正本同期する。

## 実行タスク

- Phase 本文の内容を実行し、成果物と検証証跡を同期する。

## 参照資料

- `docs/30-workflows/issue-400-admin-request-audit-target-taxonomy/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

## 成果物

- root Phase 仕様書と `outputs/phase-*/main.md`


本タスクは `visualEvidence: NON_VISUAL`（UI 文言変更のみで挙動差分なし）。

## CI gate（既存運用に従う）

| gate | 役割 | 期待結果 |
| --- | --- | --- |
| `typecheck` | `pnpm typecheck` | PASS |
| `lint` | `pnpm lint` | PASS |
| `test-api` | api unit test | PASS（追加ケース含む） |
| `test-web` | web unit test | PASS |
| `coverage-gate` | 80% カバレッジ | PASS |
| `verify-indexes-up-to-date` | aiworkflow indexes drift gate | PASS（docs 同期時 `pnpm indexes:rebuild` 必要なら実行） |

## 二重承認

solo 開発ポリシーにより `required_pull_request_reviews: null`。CI gate のみが merge gate。

## NON_VISUAL evidence ファイル（Phase 11 で実体化）

- `outputs/phase-11/typecheck.log`
- `outputs/phase-11/lint.log`
- `outputs/phase-11/test-api.log`
- `outputs/phase-11/test-web.log`
- `outputs/phase-11/coverage-summary.log`

## 完了条件

- 全 CI gate が PASS
- evidence ファイルが outputs/phase-11/ に揃う

## 統合テスト連携

- focused unit / route tests と validator を Phase 11 で接続する。
