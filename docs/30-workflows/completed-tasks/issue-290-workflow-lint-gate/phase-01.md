# Phase 1: 要件定義

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
| 機能名 | issue-290-workflow-lint-gate |
| 作成日 | 2026-05-17 |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

`.github/workflows/*.yml` 全 32 件を CI で構文検査する gate を確立し、`yamllint` の採否判断を文書化し、ローカル復旧手順を runbook 化する。

## 実行タスク

- [ ] 現状の actionlint 適用 workflow リストを `outputs/phase-01/current-coverage.md` に固定する
- [ ] 未カバー workflow 21 件を列挙する
- [ ] yamllint 採否判断の評価軸（GH Actions 独自表現との衝突、ノイズ量）を整理する
- [ ] ローカル復旧手順（actionlint インストール / 実行）の前提を明確化する

## 実行手順

1. `rg --files .github/workflows | sort` で現行 32 workflow を確定する。
2. `.github/workflows/ci.yml` と `package.json` の actionlint 対象を `.github/workflows/*.yml` に統一する。
3. runbook と yamllint 不採用 decision を tracked file として追加する。
4. Phase 11 で local deterministic evidence を保存し、runtime GHA evidence は Phase 13 user gate として分離する。

## 統合テスト連携

production TypeScript runtime は変更しない。統合テスト相当の gate は `pnpm observation:lint` と `./actionlint -color .github/workflows/*.yml` で、GitHub Actions workflow 構文を全件検証する。

## 多角的チェック観点（AIが判断）

| 観点 | 判定 |
| --- | --- |
| 矛盾なし | `spec_created` ではなく `implemented_local_evidence_captured` に再分類する |
| 漏れなし | Phase 12 strict 7 / artifacts parity / same-wave sync を必須成果物に追加する |
| 整合性あり | CI と local command を同じ glob + version に揃える |
| 依存関係整合 | #526 subset gate を上書きせず、Issue #290 で全 workflow gate へ拡張する |

## サブタスク管理

| サブタスク | 状態 |
| --- | --- |
| workflow glob 化 | completed |
| runbook / yamllint decision | completed |
| aiworkflow same-wave sync | completed |

## 参照資料

| 参照資料 | パス |
| --- | --- |
| Issue | https://github.com/daishiman/UBM-Hyogo/issues/290 |
| Index | `index.md` |
| 先行実装 | `docs/30-workflows/completed-tasks/governance/issue-526-ci-actionlint-shellcheck-gate/` |
| 親 unassigned task | `docs/30-workflows/completed-tasks/ut-cicd-drift-impl-workflow-lint-gate.md` |
| 現状 lint 設定 | `.github/workflows/ci.yml` (line 46-50) |

## 成果物

| 成果物 | パス |
| --- | --- |
| 現状カバレッジ | `outputs/phase-01/current-coverage.md` |
| 要件定義 | `phase-01.md` |

## 完了条件

- [ ] 32 workflow ファイルの actionlint 適用状態がマトリクス化されている
- [ ] yamllint 採否評価軸が 3 観点以上整理されている
- [ ] ローカル復旧手順の前提（OS / 依存ツール）が固定されている
- [ ] タスク100%実行確認【必須】: 上記サブタスクが Phase 11 evidence と Phase 12 strict 7 に接続されている

## タスク100%実行確認【必須】

- [ ] `git status --short` と `git diff --stat` で実変更を確認する
- [ ] root/output `artifacts.json` parity を確認する
- [ ] `pnpm observation:lint` または actionlint equivalent を実行し、結果を Phase 11 に保存する

## 次Phase

Phase 2: 設計

## 依存 Phase

なし
