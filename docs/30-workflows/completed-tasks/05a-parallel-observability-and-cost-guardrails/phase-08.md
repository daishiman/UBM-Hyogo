# Phase 8: 設定 DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | observability-and-cost-guardrails |
| Phase 番号 | 8 / 13 |
| Phase 名称 | 設定 DRY 化 |
| 作成日 | 2026-04-23 |
| 前 Phase | 7 (検証項目網羅性) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |

## 目的

観測性と無料枠ガードレール における Phase 8 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | quality gate / rollback |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Pages / Workers / D1 operational view |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | secret hygiene |
| 参考 | .claude/skills/task-specification-creator/SKILL.md | 運用性観点 |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物を outputs/phase-08/main.md に作成・更新する。
- downstream task から参照される path を具体化する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | 本 Phase の出力を入力として使用 |
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
| 1 | input 確認 | 8 | completed | upstream を読む |
| 2 | 成果物更新 | 8 | completed | outputs/phase-08/main.md |
| 3 | 4条件確認 | 8 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Phase 8 の主成果物 |
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

- 次: 9 (品質保証)
- 引き継ぎ事項: 観測性と無料枠ガードレール の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## Before / After 比較
| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| branch 記法 | develop 混在 | dev へ統一 | branch strategy 優先 |
| runtime 記法 | OpenNext 一体 | Pages / Workers 分離 | architecture と整合 |
| data ownership | Sheets / D1 混線 | Sheets input / D1 canonical | source-of-truth 一意化 |

## 共通化パターン
- branch / env / secret placement の表現を共通化する
- outputs 配置ルールを Phase 12 まで同一化する
- 4条件を 価値性 / 実現性 / 整合性 / 運用性 へ統一する

## 削除対象一覧
- legacy assumption の持ち込み
- scope 外サービスの先行導入
- 実値前提の secret 記述
