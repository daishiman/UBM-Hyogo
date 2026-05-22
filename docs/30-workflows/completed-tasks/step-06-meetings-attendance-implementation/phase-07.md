# Phase 7: CI/CD 統合

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 区分 | 設計 + 確認 |
| 想定所要 | 0.1 人日 |

## 目的

既存 CI gate と本タスクの整合を確認し、新規 gate / workflow を追加する必要があるか判定する。

## 7.1 既存 required status check（変更不要）

| check | 役割 | 本タスクとの関係 |
| --- | --- | --- |
| `pnpm typecheck` | 型 | 新規 hook / component の型を検証 |
| `pnpm lint` | ESLint | 新規ファイルの lint を検証 |
| `pnpm test` | vitest | 新規 spec を実行 |
| `verify-test-suffix` | `*.test.*` 禁止 | `*.spec.tsx` で命名すれば PASS |
| `verify-design-tokens` | HEX/任意色禁止 | ConfirmDialog で token のみ使用すれば PASS |
| `verify-indexes-up-to-date` | skill indexes drift | 本タスクは skill 変更なし |
| `verify-phase12-compliance` | Phase 12 canonical 9 heading | Phase 12 で satisfy |
| `playwright-smoke / smoke (chromium)` | smoke | /admin/meetings シナリオを確認 |
| `coverage-exclude-ratio` | coverage exclude 比率 | 新規 file は exclude しない |

## 7.2 新規 gate / workflow

**結論: 追加不要**

理由:
- 既存 `verify-design-tokens` / `verify-test-suffix` / `playwright-smoke` で本タスクの不変条件を充足
- `useConfirmDialog` は step-07 で再利用するが、step-07 着手時に追加 gate を検討する

## 7.3 CI 実行マトリクス（PR 時に走る workflow）

| workflow | jobs | 期待結果 |
| --- | --- | --- |
| `.github/workflows/ci.yml` (web) | typecheck / lint / test / build | green |
| `.github/workflows/verify-design-tokens.yml` | verify | green |
| `.github/workflows/playwright-smoke.yml` | smoke (chromium) | green |
| `.github/workflows/verify-test-suffix.yml` | verify | green |

## 7.4 PR pre-flight

PR push 前に `bash scripts/verify-pr-ready.sh` を実行し、5 系統の繰り返し失敗パターンを fail-fast 検出する。
(CLAUDE.md PR autonomous flow §「品質検証」と整合)

## 完了条件

- [ ] 既存 required check との整合確認済
- [ ] 新規 gate 追加なしの判定根拠が記録されている
- [ ] PR pre-flight script の実行を Phase 13 で実施することが明記されている

## リスク

- coverage CI gate が thresholds 未達で fail → Phase 5 の test を補強する
- visual regression が ConfirmDialog 追加で screenshot 差分を出す → 期待差分を snapshot update し、PR 内で差分を提示
