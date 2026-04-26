# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | google-workspace-bootstrap |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-23 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | pending |

## 目的

Google Workspace / Sheets 連携基盤 における Phase 10 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | integration package の責務 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | secret placement |
| 参考 | Google Cloud Console | Project / OAuth / service account |
| 参考 | User request on 2026-04-23 | Google スプレッドシート入力 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-10/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 10 | pending | upstream を読む |
| 2 | 成果物更新 | 10 | pending | outputs/phase-10/main.md |
| 3 | 4条件確認 | 10 | pending | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/main.md | Phase 10 の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 主成果物が作成済み
- 正本仕様参照が残っている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: Google Workspace / Sheets 連携基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## AC 全項目 PASS 判定表
| AC | 判定 | 根拠 |
| --- | --- | --- |
| AC-1 | TBD | Phase 7 matrix + Phase 9 QA |
| AC-2 | TBD | Phase 7 matrix + Phase 9 QA |
| AC-3 | TBD | Phase 7 matrix + Phase 9 QA |
| AC-4 | TBD | Phase 7 matrix + Phase 9 QA |
| AC-5 | TBD | Phase 7 matrix + Phase 9 QA |

## blocker 一覧
| ID | blocker | 解消条件 |
| --- | --- | --- |
| B-01 | 正本仕様と矛盾する文言が残る | 該当 phase を修正 |
| B-02 | 下流 task が参照できない output がある | path を補正 |

## Phase 11 進行 GO/NO-GO
- GO: blockers なし、または docs-only で吸収可能。
- NO-GO: source-of-truth / branch / secret placement の重大矛盾が残る。

## 最終レビュー結果

### AC 最終確認
| AC | 内容 | 判定 | 根拠ドキュメント |
|----|------|------|-----------------|
| AC-1 | OAuth client と SA の用途が分離されている | PASS | outputs/phase-02/google-contract-map.md |
| AC-2 | Sheet access contract が docs に残る | PASS | outputs/phase-05/sheets-access-contract.md |
| AC-3 | secret 名が task 間で一意 | PASS | outputs/phase-01/main.md の変数一覧 |
| AC-4 | Sheets input / D1 canonical の責務維持 | PASS | outputs/phase-05/sheets-access-contract.md |
| AC-5 | downstream 参照が明示 | PASS | 各 outputs に記載 |

### 4条件 最終評価
| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | Sheets/D1責務確定で03/04/05bの実装迷いゼロ |
| 実現性 | PASS | 全て無料枠内 |
| 整合性 | PASS | secret配置が正本仕様と一致 |
| 運用性 | PASS | rollback手順がPhase 6に文書化済み |

### 最終判定: PASS → Phase 11（手動 smoke test）へ進む
