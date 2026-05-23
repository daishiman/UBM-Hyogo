# Phase 4: テスト戦略

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 |
| 機能名 | issue-290-workflow-lint-gate |
| 作成日 | 2026-05-17 |

## テスト戦略

本タスクは workflow YAML 構文検査 gate の拡張であり、実行可能 production code は変更しない。よってテストは「**CI workflow 自身の動作確認**」と「**事前 lint clean 確認**」の 2 種で構成する。

## 実行タスク

- [ ] actionlint 全件検査を実行する
- [ ] `pnpm observation:lint` で local reproduction path を検証する
- [ ] runbook / yamllint decision の存在を検証する
- [ ] GitHub Actions runtime evidence は Phase 13 user gate として分離する

## テストマトリクス

| # | 種別 | 対象 | 実行コマンド | 期待結果 |
| --- | --- | --- | --- | --- |
| T1 | 静的 | 全 workflow YAML | `./actionlint -color .github/workflows/*.yml` | exit 0 |
| T2 | 静的 | glob 解決 | `ls .github/workflows/*.yml \| wc -l` | 32（現状） |
| T3 | runbook | ローカル復旧 | runbook の手順を実行し T1 を再現 | T1 と同じ exit 0 |
| T4 | CI smoke | PR 上で `ci.yml` が pass | PR を draft で push し Actions tab を確認 | `workflow-shell-lint` が success |
| T5 | regression | 既存 self-lint 維持 | `rg -n "actionlint" .github/workflows/verify-gate-metadata.yml .github/workflows/audit-correlation-verify.yml` | hit を維持 |

## 失敗時の取り扱い

T1 で失敗 → 該当 workflow の lint error を 1 件ずつ修正してから本 PR に同梱する。yamllint 二重導入は行わない。

## 追加テストファイル

なし（コード変更が CI workflow YAML のみのため）。テストは CI 上で自己検証される。

## 参照資料

| 参照資料 | パス |
| --- | --- |
| CI workflow | `.github/workflows/ci.yml` |
| local script | `package.json` |
| runbook | `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` |

## ローカル実行コマンド集

```bash
# actionlint インストール
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7

# 全 workflow 検査
./actionlint -color .github/workflows/*.yml

# 対象件数確認
ls .github/workflows/*.yml | wc -l
```

## 統合テスト連携

`pnpm observation:lint` は shellcheck / shell unit / actionlint をまとめて実行する既存 CI 連携点。本タスクで actionlint 対象を全 workflow へ拡張する。

## 多角的チェック観点（AIが判断）

| 観点 | テスト反映 |
| --- | --- |
| 漏れなし | glob 件数と actionlint 全件を両方見る |
| 整合性あり | CI step と package script の対象を一致させる |
| 依存関係整合 | runtime CI は user-gated と明記し、local PASS と混同しない |

## サブタスク管理

| サブタスク | 状態 |
| --- | --- |
| local actionlint | completed |
| local reproduction script | completed |
| runtime GitHub Actions evidence | pending_user_approval |

## 成果物

| 成果物 | パス |
| --- | --- |
| テスト戦略 | `phase-04.md` |
| Phase 11 smoke log | `outputs/phase-11/smoke-log.md` |

## 完了条件

- [ ] actionlint 全件検査が exit 0
- [ ] `pnpm observation:lint` が exit 0
- [ ] coverage Statements/Branches/Functions/Lines は workflow-only 変更のため N/A（index.md に理由を記録済み）

## タスク100%実行確認【必須】

- [ ] T1-T5 が Phase 11 smoke log に記録されている

## 次Phase

Phase 5: 実装計画
