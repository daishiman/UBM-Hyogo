# Phase 4 / main.md — 事前検証手順サマリ

## 概要

Phase 5 着手前に、Sheets API 接続 / D1 binding 疎通 / mapping 単体 / 冪等性 / 異常系 を CLI/curl/SQL で検証する手順を確定した。

## 成果物

- `outputs/phase-04/test-plan.md`（fixture / 期待値 / カテゴリ網羅）
- `outputs/phase-04/verification-commands.md`（curl / wrangler / SQL コマンド集）

## 完了条件チェック

- [x] test-plan.md が mapping / 冪等性 / 異常系の 3 カテゴリを網羅
- [x] verification-commands.md の各コマンドが Phase 5 でコピペ実行可能
- [x] Sheets API / D1 binding 双方の PASS 条件が記述済み
- [x] 不変条件 2 / 3 / 4 / 5 / 7 を検証する観点が test-plan に含まれる

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | OK | 実装者が即時疎通確認できる粒度 |
| 実現性 | OK | D1 free tier writes は最小 fixture |
| 整合性 | OK | 不変条件 2/3/4/5/7 を含む |
| 運用性 | OK | 失敗時切り分けが応答コード単位で一意 |

## blocker / handoff

- blocker: なし
- 引き継ぎ: verification-commands.md を Phase 5 の事前疎通および Phase 11 smoke に流用
- ブロック条件解除: Sheets API 認証と D1 binding 疎通の双方の PASS 条件が記述済み

## 次 Phase

Phase 5（セットアップ実行）。本 phase の test-plan / verification-commands を入力に、migration / wrangler.toml / secret 登録 / sync worker 配置を runbook 化する。
