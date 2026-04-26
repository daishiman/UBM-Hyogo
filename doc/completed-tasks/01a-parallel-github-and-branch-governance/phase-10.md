# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | github-and-branch-governance |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | pending |

## 目的

Phase 7（検証項目網羅性）と Phase 9（品質保証）の結果を統合し、branch governance 設定が正本仕様に完全一致していることを最終確認する。
PR 作成（Phase 13）の直前サインオフ段階として、AC-1〜5 の全 PASS と 4条件全 PASS を判定し、Phase 11（手動 smoke test）への進行可否を決定する。

## 真の論点

1. **AC 全 PASS の確証**: Phase 7 トレースマトリクス + Phase 9 QA 結果の双方を根拠として、AC-1〜5 がすべて PASS できるか
2. **正本仕様との最終整合**: `deployment-branch-strategy.md` で規定された reviewer 数・force push 禁止・environment マッピングが各 Phase 成果物に反映されているか
3. **scope 外混入の排除**: Cloudflare deploy 実行・secret 実値・実コードが一切含まれていないか
4. **downstream path の確定**: `02-serial-monorepo-runtime-foundation` および `04-serial-cicd-secrets-and-environment-sync` が参照できる output path が固まっているか

## 依存関係・責務境界

- **上流**: Phase 9 の品質保証結果（outputs/phase-09/main.md）が作成済みであること
- **下流**: Phase 11 への GO 判定、Phase 12・13 への handoff 情報
- **境界**: コード実装・GitHub への実適用はこの Phase のスコープ外。ドキュメント整合確認のみを行う

## 実行タスク

### ステップ 1: 上流 Phase 成果物の読み込み

Phase 7 と Phase 9 の出力を読み込み、最終 gate チェックの入力を整える。

| 読み込み対象 | 確認内容 |
| --- | --- |
| `doc/01a-parallel-github-and-branch-governance/outputs/phase-07/main.md` | AC トレースマトリクス（AC-1〜5 の検証観点・方法・Phase 一覧） |
| `doc/01a-parallel-github-and-branch-governance/outputs/phase-09/main.md` | 命名規則・参照整合性・secrets 漏洩チェック結果 |
| `doc/01a-parallel-github-and-branch-governance/index.md` | スコープ・依存関係・AC 定義 |

### ステップ 2: 最終 gate チェックリストの実行

以下の各項目を一つ一つ確認し、PASS / FAIL / N/A を記録する。

| # | チェック項目 | 根拠 | 判定 |
| --- | --- | --- | --- |
| G-01 | AC-1〜5 が全て PASS（Phase 7 トレースマトリクスで確認） | `outputs/phase-07/main.md` | TBD |
| G-02 | 正本仕様（`deployment-branch-strategy.md`）との完全整合 | Phase 2 設計書・Phase 5 runbook | TBD |
| G-03 | 設計書（`github-governance-map.md`）と runbook の矛盾なし | `outputs/phase-02/main.md`, `outputs/phase-05/repository-settings-runbook.md` | TBD |
| G-04 | secrets 実値の混入なし（プレースホルダーのみ） | Phase 9 secrets 漏洩チェック | TBD |
| G-05 | scope 外サービス（Cloudflare deploy, secret 実値投入, 実コード）が含まれていない | index.md スコープ定義 | TBD |
| G-06 | 下流タスク（02, 04）が参照できる path が確定している | `artifacts.json` infra_artifacts | TBD |
| G-07 | same-wave sync（01b, 01c との CODEOWNERS 衝突なし） | Phase 4 事前検証・Phase 9 QA | TBD |

### ステップ 3: 4条件最終評価

全て PASS でなければ Phase 11 に進まない。いずれかが FAIL の場合は該当 Phase に差し戻す。

### ステップ 4: 未解決 open questions の記録

存在する場合は ID・内容・対処方針・担当 Phase を明記する。未解決事項がゼロであれば「なし」と明記する。

### ステップ 5: PR 作成可否の判定

G-01〜G-07 が全 PASS かつ 4条件全 PASS の場合のみ「GO」とし、`outputs/phase-10/main.md` に判定結果を記録する。

### ステップ 6: 成果物の作成・更新

`outputs/phase-10/main.md` に最終レビュー結果を出力する。

## AC 全項目 PASS 判定表

| AC | 内容 | 根拠 Phase | 判定 |
| --- | --- | --- | --- |
| AC-1 | main は reviewer 2 名、dev は reviewer 1 名 | Phase 7 matrix + Phase 9 QA | TBD |
| AC-2 | production は main、staging は dev のみ受け付ける | Phase 7 matrix + Phase 9 QA | TBD |
| AC-3 | PR template に true issue / dependency / 4条件の欄がある | Phase 7 matrix + Phase 9 QA | TBD |
| AC-4 | CODEOWNERS と task 責務が衝突しない | Phase 7 matrix + Phase 9 QA | TBD |
| AC-5 | local-check-result.md と change-summary.md の close-out path がある | Phase 7 matrix + Phase 9 QA | TBD |

## blocker 一覧

| ID | blocker | 解消条件 | 差し戻し先 |
| --- | --- | --- | --- |
| B-01 | 正本仕様と矛盾する文言が残る | 該当 Phase のドキュメントを修正し再確認 | Phase 2 または Phase 3 |
| B-02 | 下流タスクが参照できない output path がある | path を補正し artifacts.json を更新 | Phase 5 または Phase 8 |
| B-03 | secrets 実値の混入が検出される | 実値を削除しプレースホルダーに置換 | Phase 9 |
| B-04 | CODEOWNERS で 01b / 01c との衝突が解消されていない | 衝突パスを分離しレビュー担当を再割当て | Phase 4 |

## 未解決 open questions テンプレート

| ID | 内容 | 対処方針 | 担当 Phase |
| --- | --- | --- | --- |
| OQ-01 | （記録なし） | — | — |

## Phase 11 進行 GO / NO-GO

| 判定 | 条件 |
| --- | --- |
| GO | G-01〜G-07 全 PASS かつ 4条件全 PASS。blockers なし、または docs-only で吸収可能 |
| NO-GO | source-of-truth / branch / secret placement の重大矛盾が残る。または AC がひとつでも FAIL |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md` | branch / reviewers / env mapping の正本 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-core.md` | CI/CD 品質ゲート |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | PR は承認後のみ |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-07/main.md` | AC トレースマトリクス |
| 必須 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-09/main.md` | 品質保証チェック結果 |
| 参考 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-02/github-governance-map.md` | branch / env / review map |
| 参考 | `doc/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md` | GitHub 設定適用 runbook |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | AC トレースマトリクスを最終 gate の根拠として使用 |
| Phase 9 | 品質保証チェック結果を最終 gate の根拠として使用 |
| Phase 11 | 本 Phase の GO 判定を smoke test 実施の前提として使用 |
| Phase 12 | close-out と spec sync 判断に本 Phase の判定結果を使用 |
| Phase 13 | PR 作成の直接上流として本 Phase の PASS を要求 |

## 多角的チェック観点

- **価値性**: reviewer 不在・force push 許容によるリリース事故リスクを機械的に封じていることを最終確認する
- **実現性**: 全設定が GitHub UI 手動操作 + runbook の範囲内で完結し、追加費用が発生しないことを確認する
- **整合性**: branch / env / reviewer 数 / secret placement が `deployment-branch-strategy.md` と一字一句矛盾しないことを確認する
- **運用性**: rollback（branch protection 一時解除）・handoff（downstream task への path 明示）・same-wave sync（01b, 01c との CODEOWNERS 衝突なし）が成立することを確認する

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 上流成果物（Phase 7, 9）の読み込み | 10 | pending | outputs/phase-07, 09 を読む |
| 2 | 最終 gate チェックリスト（G-01〜G-07）実行 | 10 | pending | 全項目に PASS/FAIL を記録 |
| 3 | AC-1〜5 全 PASS 判定 | 10 | pending | Phase 7 matrix + Phase 9 QA を根拠に判定 |
| 4 | 4条件最終評価 | 10 | pending | 価値性 / 実現性 / 整合性 / 運用性 |
| 5 | open questions の洗い出しと記録 | 10 | pending | 未解決があれば対処方針を明記 |
| 6 | GO / NO-GO 判定と outputs/phase-10/main.md 作成 | 10 | pending | blockers ゼロなら GO |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `doc/01a-parallel-github-and-branch-governance/outputs/phase-10/main.md` | 最終レビュー結果（gate チェック・AC 判定・GO/NO-GO） |
| メタ | `doc/01a-parallel-github-and-branch-governance/artifacts.json` | Phase 10 status を completed に更新 |

## 完了条件

- [ ] `outputs/phase-10/main.md` が作成済み
- [ ] G-01〜G-07 の全項目に PASS / FAIL の記録がある
- [ ] AC-1〜5 の全 PASS が根拠付きで確認済み
- [ ] 4条件（価値性 / 実現性 / 整合性 / 運用性）が全 PASS
- [ ] GO / NO-GO 判定結果が明記されている
- [ ] open questions が存在する場合は対処方針と担当 Phase が記録されている
- [ ] `artifacts.json` の phase 10 が completed に更新済み

## タスク 100% 実行確認【必須】

- [ ] 全実行タスク（ステップ 1〜6）が completed
- [ ] `outputs/phase-10/main.md` が指定パスに作成済み
- [ ] G-01〜G-07 チェックリストに PASS/FAIL が全て記録済み
- [ ] AC-1〜5 判定表に根拠付き結果が記録済み
- [ ] 4条件評価テーブルが全 PASS（または FAIL の場合は差し戻し先を明記）
- [ ] open questions のリストが最新状態（なければ「なし」と明記）
- [ ] GO / NO-GO 判定結果が `outputs/phase-10/main.md` に記録済み
- [ ] 異常系（権限不足・scope 外混入・drift・secrets 漏洩）も検証済み
- [ ] Phase 11 への引き継ぎ事項を記述済み
- [ ] `artifacts.json` の phase 10 を completed に更新済み

## 次Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: GO 判定の根拠（G-01〜G-07 全 PASS・AC-1〜5 全 PASS・4条件全 PASS）を Phase 11 smoke test の前提として渡す。open questions が残る場合は ID と対処方針を渡す
- ブロック条件: `outputs/phase-10/main.md` が未作成、または GO 判定が出ていない場合は Phase 11 に進まない

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | Phase 7/9 の結果が reviewer 不在・force push リスクを排除していることを最終確認できるか | TBD（Phase 7/9 結果を根拠に判定） |
| 実現性 | 全成果物が docs-only・GitHub UI 手動操作の範囲内に収まり、無料枠で成立するか | TBD（scope 外混入チェック G-05 で確認） |
| 整合性 | branch / env / reviewer 数 / secret placement が正本仕様と矛盾なく全 Phase に反映されているか | TBD（G-01〜G-04 で確認） |
| 運用性 | rollback・handoff・same-wave sync（01b, 01c CODEOWNERS 衝突なし）が成立するか | TBD（G-07 + blocker 一覧で確認） |
