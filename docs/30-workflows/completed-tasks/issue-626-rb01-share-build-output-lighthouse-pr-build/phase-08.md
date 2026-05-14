# Phase 8: governance / branch protection 整合


## 目的

Issue #626 RB-01 の Phase 8 として、build output sharing 仕様の該当判断を固定する。
## メタ情報

| Phase | 値 |
| --- | --- |
| Phase | 8 |
| workflow | issue-626-rb01-share-build-output-lighthouse-pr-build |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 前提

`required_status_checks.contexts` の変更は user 明示承認 gate（CONST: governance mutation user gate）が必要な操作である。本タスクでは **context 名を変更しない** ため、`gh api -X PUT` による mutation は不要となる見込み。

## 確認手順（read-only / mutation なし）

```bash
# dev
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --jq '.required_status_checks.contexts' \
  > outputs/phase-11/branch-protection/dev-before.json

# main
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  --jq '.required_status_checks.contexts' \
  > outputs/phase-11/branch-protection/main-before.json

# 期待: current required context `lighthouse-ci` が両 branch の contexts に含まれていること。
# `build-test` は branch protection context ではなく `lighthouse-ci.needs` dependency として確認する。
```

PR merge 後も `contexts` 値は変わらない想定。同一コマンドを `outputs/phase-11/branch-protection/{dev,main}-after.json` として取得し、`outputs/phase-11/branch-protection/diff.txt` で before/after 差分 0 件を記録する。Phase 12 はこの Phase 11 evidence path を参照し、別名の drift check file は作らない。

## mutation 判定

| 条件 | 必要操作 | 承認 gate |
| --- | --- | --- |
| `contexts` 名が変更されない | mutation 不要 | 不要 |
| `contexts` 名を変更する必要が発生 | `gh api -X PUT ...` で `contexts` 配列更新 | **user 明示承認 + after JSON evidence**（CONST違反防止） |

本タスクでは前者を維持する。後者ケースが発生したら本仕様書 Phase 08 に再判定 evidence を追記し、user 承認を取るまで実行しない。

## 統合テスト連携

- NON_VISUAL CI workflow task. Integration evidence is represented by actionlint, typecheck, lint, focused regression, branch-protection read-only evidence, and PR runtime pending markers.

## 実行タスク

- [ ] この Phase の本文に記載した確認・設計・実装・検証項目を実行する。
- [ ] Phase 8 の結果を Phase 11 evidence または Phase 12 strict files に接続する。

## 参照資料

- Phase 1 (`phase-01.md`)
- Phase 2 (`phase-02.md`)
- Phase 5 (`phase-05.md`)
- Phase 6 (`phase-06.md`)
- Phase 7 (`phase-07.md`)
- `artifacts.json`
- `outputs/artifacts.json`

## 成果物

- `phase-08.md`
- Phase 8 の判断を反映した Phase 11 / Phase 12 evidence path

## 完了条件

- [ ] before/after JSON が evidence として保存され、diff = 0 件
- mutation が発生していないことを Phase 12 で明示記録
