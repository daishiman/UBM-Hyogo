# Phase 11: smoke 検証

[実装区分: 実装仕様書]
visualEvidence: NON_VISUAL

## smoke シナリオ

| # | シナリオ | 手順 | 期待 |
| --- | --- | --- | --- |
| SM1 | ローカル lint 全件 pass | `./actionlint -color .github/workflows/*.yml` | exit 0 |
| SM2 | 意図的 error 注入 → 検出 | 一時 yaml に `on: { push: { branches: not-an-array } }` を作り SM1 を再実行 → 削除 | error 検出 (exit 1)、削除後 exit 0 |
| SM3 | runbook 通り再現 | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` の手順を新規シェルで実行 | actionlint インストール + SM1 が通る |
| SM4 | CI 上で actionlint job 緑 | PR を draft で push し Actions 確認 | `workflow-shell-lint` success |
| SM5 | regression: 自己 lint も依然 pass | `verify-gate-metadata.yml` / `audit-correlation-verify.yml` の手動 dispatch | 両 job success |

## 実装サンプル injection

SM2 で使う一時 yaml の例（実行後は必ず削除）:

```yaml
# .github/workflows/_smoke-injection.yml （SM2 のみ・実行後削除）
name: smoke-injection
on:
  push:
    branches: not-an-array  # 意図的 error: branches は配列
jobs:
  noop:
    runs-on: ubuntu-24.04
    steps:
      - run: echo ok
```

## evidence 保存

`outputs/phase-11/smoke-log.md` に SM1〜SM5 の実行ログを記録。視覚 evidence は不要。

## 実行タスク

- [ ] `./actionlint -color .github/workflows/*.yml`
- [ ] `pnpm observation:lint`
- [ ] `test -f` による runbook / decision / artifacts parity / Phase 12 strict 7 確認
- [ ] GitHub Actions runtime evidence は Phase 13 user gate として明記

## 参照資料

| 参照資料 | パス |
| --- | --- |
| smoke log | `outputs/phase-11/smoke-log.md` |
| static log | `outputs/phase-08/static-check-log.md` |

## 統合テスト連携

`pnpm observation:lint` は既存 shell unit と actionlint all-workflows gate を束ねるため、本タスクの local integration gate とする。

## 多角的チェック観点（AIが判断）

| 条件 | 判定 |
| --- | --- |
| 矛盾なし | local evidence と runtime pending を分ける |
| 漏れなし | SM1-SM5 のうち user-gated な SM4/SM5 は pending として扱う |
| 整合性あり | evidence path を Phase 12 compliance と一致させる |
| 依存関係整合 | Phase 13 が commit / push / PR の唯一の実行地点 |

## サブタスク管理

| サブタスク | 状態 |
| --- | --- |
| local static smoke | completed |
| CI runtime smoke | pending_user_approval |

## 成果物

| 成果物 | パス |
| --- | --- |
| smoke log | `outputs/phase-11/smoke-log.md` |

## 完了条件

- [ ] local deterministic evidence が tracked file に保存されている
- [ ] runtime pending の境界が Phase 12 compliance に反映されている

## タスク100%実行確認【必須】

- [ ] `git status` / `git diff --stat` / actionlint evidence を確認する

## 次Phase

Phase 12: 実装ガイド
