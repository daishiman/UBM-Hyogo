# Phase 4: 事前検証手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | spec_created |

## 目的

Phase 5 のセットアップ実行前に、wrangler CLI の動作・D1 接続・PRAGMA 実行可否を事前検証し、実行時の失敗リスクを排除する。

## 実行タスク

- wrangler CLI のバージョンと動作を確認する
- D1 インスタンスへの接続を確認する
- PRAGMA 実行コマンドの動作を verify suite で確認する
- ローカル環境での D1 エミュレーションの WAL 対応状況を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | wrangler コマンド・D1 操作手順 |
| 必須 | docs/ut-02-d1-wal-mode/phase-02.md | 設計済みのコマンド |
| 必須 | docs/ut-02-d1-wal-mode/phase-03.md | レビュー結果・採用設計 |

## 実行手順

### ステップ 1: wrangler CLI 動作確認

- wrangler のバージョンを確認する（3.x 以上であることを検証）
- Cloudflare アカウントへのログイン状態を確認する
- `wrangler d1 list` で D1 インスタンス一覧を確認する

### ステップ 2: D1 接続確認

- staging 環境の D1 に対して接続テストを行う
- `wrangler d1 execute` でシンプルなクエリを実行して応答を確認する
- production 環境へのアクセス権限を確認する

### ステップ 3: verify suite の実行

- 下記 verify suite の各チェックを順番に実行する
- 失敗した場合は原因を特定し、Phase 5 実行前に解消する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計レビュー PASS を前提に実行 |
| Phase 5 | verify suite の全チェックが PASS なら Phase 5 に進む |
| Phase 6 | 異常系検証の前提条件を verify suite で確認 |

## 多角的チェック観点（AIが判断）

- 価値性: verify suite が AC-2 の事前確認として機能しているか
- 実現性: wrangler CLI のバージョン確認が自動化できるか
- 整合性: staging と production の両環境で接続確認が取れているか
- 運用性: verify suite の失敗時に Phase 5 をブロックする判断フローがあるか

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | wrangler バージョン確認 | 4 | spec_created | 3.x 以上を確認 |
| 2 | D1 接続確認（staging） | 4 | spec_created | list + simple query |
| 3 | D1 接続確認（production） | 4 | spec_created | アクセス権限確認 |
| 4 | verify suite 実行 | 4 | spec_created | 全チェック PASS を確認 |
| 5 | local WAL 対応状況確認 | 4 | spec_created | wrangler dev での挙動確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/verify-suite-result.md | verify suite の実行結果 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] wrangler CLI のバージョンが 3.x 以上であることを確認済み
- staging / production D1 への接続が確認済み
- verify suite の全チェックが PASS
- local WAL 対応状況が文書化されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- verify suite 失敗時の対応が記録されている
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 5 (セットアップ実行)
- 引き継ぎ事項: verify suite の実行結果・確認済みコマンドを Phase 5 に渡す
- ブロック条件: verify suite に FAIL が残っている場合は次 Phase に進まない

## verify suite

### チェックリスト

| # | チェック項目 | コマンド | 期待結果 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | wrangler バージョン確認 | `wrangler --version` | `3.x.x` 以上 | PASS（手順確認） |
| 2 | Cloudflare ログイン確認 | `wrangler whoami` | アカウント情報が表示される | 委譲（02-serial実行時） |
| 3 | D1 インスタンス一覧 | `wrangler d1 list` | ubm-hyogo-db が表示される | 委譲（02-serial実行時） |
| 4 | staging D1 接続テスト | `wrangler d1 execute ubm-hyogo-db --env staging --command "SELECT 1;"` | `1` が返る | 委譲（02-serial実行時） |
| 5 | production D1 接続テスト | `wrangler d1 execute ubm-hyogo-db --env production --command "SELECT 1;"` | `1` が返る | 委譲（02-serial実行時） |
| 6 | staging 現在の journal_mode 確認 | `wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode;"` | `delete` または `wal` が返る | 委譲（02-serial実行時） |
| 7 | production 現在の journal_mode 確認 | `wrangler d1 execute ubm-hyogo-db --env production --command "PRAGMA journal_mode;"` | `delete` または `wal` が返る | 委譲（02-serial実行時） |
| 8 | local D1 WAL 確認 | `wrangler d1 execute ubm-hyogo-db --local --command "PRAGMA journal_mode;"` | 任意の値（差異を記録） | PASS（手順確認） |
| 9 | PRAGMA WAL 設定テスト（staging） | `wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode=WAL;"` | `wal` が返る | N/A（docs-only、mutation禁止） |
| 10 | WAL 設定確認（staging） | `wrangler d1 execute ubm-hyogo-db --env staging --command "PRAGMA journal_mode;"` | `wal` が返る | 委譲（02-serial実行時） |

### 実行前提条件

- wrangler CLI がインストール済みであること
- `wrangler login` が完了していること
- D1 インスタンスが 01b タスクで作成済みであること
- staging / production の D1 database_id が wrangler.toml に設定済みであること

### verify suite 失敗時の対応フロー

```
チェック失敗
  ├── チェック 1-2 失敗: wrangler 再インストール / 再ログイン
  ├── チェック 3 失敗: D1 インスタンス未作成 → 01b タスクに差し戻し
  ├── チェック 4-5 失敗: database_id の確認 / wrangler.toml 修正
  ├── チェック 6-7 失敗: 予期しない journal_mode → Phase 3 に差し戻し
  └── チェック 9-10 失敗: Cloudflare D1 の PRAGMA 制限確認 → 代替案を Phase 3 で検討
```
