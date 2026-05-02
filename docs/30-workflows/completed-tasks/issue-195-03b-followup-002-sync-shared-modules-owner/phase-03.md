# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

## メタ情報

| Phase | 3 / 13 |
| --- | --- |
| 前 Phase | 2（設計） |
| 次 Phase | 4（実装計画） |
| 状態 | completed |

## レビュー観点

### R-1: 4 条件再評価

| 条件 | 問い | 判定 | 根拠 |
| --- | --- | --- | --- |
| 価値性 | owner 表が将来の sync 系並列 wave での衝突を spec 段階で予防するか | PASS | D-5 の変更ルールが PR 起票義務を gate 化 |
| 実現性 | 新規 2 ファイル + 既存 2 ファイル編集で完結するか | PASS | D-1〜D-6 がパスと差分を確定 |
| 整合性 | 不変条件 #5 / #6 / 既存 `_design/` 命名規約と整合するか | PASS | apps/* に触れない、GAS 昇格なし、既存 `_design/` 階層と並列扱い |
| 運用性 | 03a / 03b 以外の sync wave からも辿れるか | PASS | `_design/` 階層 + 命名で grep 可能 |

### R-2: ユビキタス言語整合

- "owner" / "co-owner" / "consumer" の語彙を本表で固定。03a / 03b の既存 spec 内で無意識に「主担当」「サブ担当」と書かれている箇所があれば後続タスクで揃える（本タスクのスコープ外、未割当として記録）。

### R-3: 後続タスク影響

- 未割当 #7（`sync_jobs` schema 集約）は本表行を出発点に起票される。表の行数が増えるたびに #7 派生タスクへの影響が出るため、変更ルール D-5 の「行追加 PR を先行させる」項を強調する。

### R-4: リンク relative path 健全性

- `completed-tasks/03a-.../index.md` から `_design/sync-shared-modules-owner.md` への相対パスは `../../_design/sync-shared-modules-owner.md` で 1 ホップ到達。
- markdown link checker で 404 にならないことを Phase 7 で検証する。

### R-5: secret hygiene

- 本表本文に実環境変数値・トークン値が含まれる余地はないが、「ledger.ts が `CLOUDFLARE_API_TOKEN` 等を扱うか」を備考に書く際に **値ではなく env 変数名のみ** を記載するルールとする。

### R-6: automation-30 compact evidence table

小規模 code / NON_VISUAL 仕様のため、30 種思考法は個別長文ではなく compact evidence table に集約する。ただしコード実体化、未タスク formalize、正本仕様同期、Phase evidence、skill feedback、4 条件検証は省略しない。

| カテゴリ | 適用した思考法 | 発見 | 改善への反映 |
| --- | --- | --- | --- |
| 論理分析系 | 批判的思考 / 演繹思考 / 帰納的思考 / アブダクション / 垂直思考 | owner 不在の根本原因は実装不足ではなく、03a 先行・03b consumer という暗黙合意が仕様に固定されていないこと | コード変更を scope out し、owner 表 + 03a/03b 1 ホップリンクに限定 |
| 構造分解系 | 要素分解 / MECE / 2軸思考 / プロセス思考 | 成果物・検証・後続タスクの境界が混ざると Phase 12 で PASS 断言が起きる | AC、Phase 6-9 gate、Phase 12 7 成果物、Phase 13 承認ゲートを分離 |
| メタ・抽象系 | メタ思考 / 抽象化思考 / ダブル・ループ思考 | `docs/30-workflows/_design/` は単なる置き場ではなく workflow 横断 governance の抽象 | `_design/README.md` を必須化し、既存 wave-local `_design/` との責務差を明記 |
| 発想・拡張系 | ブレインストーミング / 水平思考 / 逆説思考 / 類推思考 / if思考 / 素人思考 | 「表だけ作る」では発見性が弱い。後続者は 03a/03b index から辿る | owner 表単体ではなく 03a/03b index 追記を AC 化 |
| システム系 | システム思考 / 因果関係分析 / 因果ループ | owner 表が陳腐化すると後続 sync wave の drift を再生産する | 新規 `_shared/` モジュール追加時は owner 表行追加 PR を先行させる |
| 戦略・価値系 | トレードオン思考 / プラスサム思考 / 価値提案思考 / 戦略的思考 | skill 本体テンプレ改修は価値があるが本タスクの最小価値を超える | skill feedback に候補として残し、本タスクは governance 文書作成に集中 |
| 問題解決系 | why思考 / 改善思考 / 仮説思考 / 論点思考 / KJ法 | 未割当 #7 と owner 表の依存方向を逆にすると schema 集約が先行してしまう | 未割当 #7 は owner 表を foundation として Phase 12 に formalize |

## 決定事項

- D-1〜D-7 を採択。Phase 4 でサブタスク分解に進む。
- `_design/README.md` は **作成する**（owner 表単体だと `_design/` の趣旨が読み取れないため）。

## 成果物

- `outputs/phase-03/review-decision.md`

## 完了条件

- 4 条件再評価が全 PASS
- D-1〜D-7 への変更要求が記録されており、または「変更なし」と明記されている

## 目的

本 Phase の目的は、issue-195 follow-up 002 を code / NON_VISUAL workflow として矛盾なく完了させるための判断・作業・検証を記録すること。

## 実行タスク

- [x] 本 Phase の責務に対応する成果物を作成または更新する
- [x] code / NON_VISUAL の分類と owner 表 governance の整合を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-195-03b-followup-002-sync-shared-modules-owner/` | 対象仕様書 |
| owner 表 | `docs/30-workflows/_design/sync-shared-modules-owner.md` | owner / co-owner 正本 |

## 統合テスト連携

- `pnpm exec vitest run --config vitest.config.ts apps/api/src/jobs/_shared`
- `pnpm --filter @ubm-hyogo/api typecheck`
- `pnpm --filter @ubm-hyogo/api lint`
