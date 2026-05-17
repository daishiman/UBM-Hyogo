# Phase 7: カバレッジ確認

## メタ情報

- phase: 7 / coverage
- prev: phase-6-test-additions
- next: phase-8-refactor

## 目的

カバレッジ AC の適用可否を判定し、適用外である根拠を記録する。

## 判定

本タスクは以下の理由により **coverage AC 適用外** とする（index.md `coverage_ac: 適用外` と整合）:

1. 変更対象は `.github/workflows/*.yml`（CI 設定）と `scripts/__tests__/*.sh`（bash test）のみ
2. application code（`apps/api/src`、`apps/web/src`、`packages/*/src`）への変更は 0 行
3. vitest/jest が走る対象ファイルへの変更がないため、Statements/Branches/Functions/Lines は変動しない

## 代替検証

| 項目 | 検証 |
|------|------|
| workflow YAML 構文 | `gh workflow view web-cd.yml` などで構文 OK が確認可能 |
| bash gate 動作 | Phase 6 で TC-1 / TC-2 の正例 + 負例双方が確認済み |
| 既存 test regression | Phase 6 で `cf-token-arg.test.sh` / `redaction-check.test.sh` が pass |

## 実行コマンド（任意・補強として）

```bash
# 全体 coverage を流して regression していないことだけ確認（任意）
mise exec -- pnpm test --reporter=verbose --run 2>&1 | tail -50
mise exec -- pnpm --filter "@ubm-hyogo/api" test:cov --run 2>&1 | tail -20
```

期待: 既存 coverage 値から有意な低下がないこと。本タスク差分起因の coverage 低下は構造的に発生しない。

## 成果物

- `outputs/phase-7/coverage-ac-exemption.md`（適用外判定とその根拠）

## 完了条件

- [ ] coverage AC 適用外の判定と根拠が記録されている
- [ ] 代替検証が Phase 6 結果と整合している

## タスク100%実行確認【必須】

- [ ] 成果物 1 ファイル作成

## 次Phase

phase-8-refactor.md
