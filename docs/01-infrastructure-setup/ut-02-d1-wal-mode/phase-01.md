# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 WAL mode 設定 (UT-02) |
| Phase 番号 | 1 / 6 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-26 |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | pending |

## 目的

D1 WAL mode 設定タスクの必要性・スコープ・受入条件を確定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- WAL mode 設定が必要な真の論点を特定する
- スコープ・依存境界を確定する
- 受入条件 (AC) を正式定義する
- 4条件評価を行い、実施可否を判断する
- 既存資産インベントリを洗い出す

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順・wrangler 操作 |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md | タスク概要・AC |
| 参考 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | 組み込み先タスクの概要・AC（存在する場合） |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 実行手順

### ステップ 1: input と前提の確認

- index.md・上流タスク（01b-parallel-cloudflare-base-bootstrap）を読む
- 02-serial-monorepo-runtime-foundation との整合を確認する
- Cloudflare D1 の WAL mode サポート状況を deployment-cloudflare.md で確認する

### ステップ 2: Phase 成果物の作成

- 本 Phase の成果物として受入条件・スコープ・4条件評価を確定する
- downstream Phase から参照されるパスを具体化する

### ステップ 3: 4条件と handoff の確認

- 価値性 / 実現性 / 整合性 / 運用性を評価する
- 次 Phase に渡す blocker と open question を記録する

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 本 Phase の AC・スコープを設計の入力として使用 |
| Phase 5 | AC-3 (runbook 記録) の実施根拠 |
| Phase 6 | AC-2 (PRAGMA 適用確認) の異常系設計の根拠 |

## 多角的チェック観点（AIが判断）

- 価値性: Sheets→D1 同期と API 同時実行時のロック競合を減らす効果が定量化できるか
- 実現性: 無料枠内で WAL mode を有効化でき、wrangler CLI のみで完結するか
- 整合性: local / staging / production の WAL mode 差異が文書化されているか
- 運用性: WAL mode が無効化された場合の rollback 手順が明確か

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点・依存境界の確定 | 1 | pending | index.md と上流タスクを読む |
| 2 | 4条件評価 | 1 | pending | 価値性 / 実現性 / 整合性 / 運用性 |
| 3 | AC 正式定義 | 1 | pending | index.md の AC を Phase に反映 |
| 4 | 既存資産インベントリ | 1 | pending | wrangler.toml・D1 binding の現状確認 |
| 5 | 正本仕様参照表の確認 | 1 | pending | deployment-cloudflare.md 確認 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義の主成果物 |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- 真の論点・依存境界が確定している
- 4条件評価が全て TBD でない
- AC が正式定義されている
- 既存資産インベントリが作成されている
- downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（WAL非対応環境・wranglerバージョン差異）も確認済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項: AC・スコープ・4条件評価の結果を設計の入力として渡す
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない

## 真の論点

- Cloudflare D1 の WAL mode は `wrangler d1 execute` による PRAGMA 実行で有効化可能か、あるいは D1 がデフォルトで WAL を使用しているか確認が必要
- local 開発環境（wrangler dev）と staging / production で WAL mode の挙動が一致するか
- WAL mode 設定を 02-serial-monorepo-runtime-foundation に組み込む場合、どの Phase に挿入するのが最適か

## 依存関係・責務境界

| 種別 | 対象 | 内容 |
| --- | --- | --- |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | D1 インスタンスの作成・namespace 確定が必要 |
| 上流 | 02-serial-monorepo-runtime-foundation | 本タスクはここに組み込まれる |
| 下流 | UT-01 (Sheets→D1 同期方式定義) | WAL mode 前提で同期フロー設計 |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | WAL mode 設定済みの D1 に対して実装 |

## 価値とコスト

- 初回価値: 読み書き競合を最小化し、同期ジョブと API の並行実行を安定させる
- 初回で払わないコスト: D1 のバックアップ設計・スキーマ設計・パフォーマンス監視基盤
- コスト: wrangler CLI での PRAGMA 実行のみ（設定コストはほぼゼロ）

## 4条件評価

| 条件 | 問い | 判定 |
| --- | --- | --- |
| 価値性 | 同期ジョブと API 並行実行時のロック競合削減に直結するか | TBD |
| 実現性 | 無料枠・wrangler CLI のみで WAL mode 設定が完結するか | TBD |
| 整合性 | local / staging / production の WAL 差異が文書化されているか | TBD |
| 運用性 | WAL mode 未設定時の rollback・確認手順が明確か | TBD |

## スコープ

### 含む

- `wrangler.toml` への D1 バインディング定義と WAL mode 設定根拠コメント
- `PRAGMA journal_mode=WAL` の適用確認（staging / production）
- WAL mode 設定手順の runbook への記録
- ローカル開発環境との WAL mode 差異の文書化

### 含まない

- D1 スキーマ設計（→ UT-04）
- Sheets→D1 同期実装（→ UT-09）
- D1 バックアップ・リストア設計（→ 03-serial-data-source-and-storage-contract）
- パフォーマンス監視基盤の構築

## 受入条件 (AC)

- AC-1: `wrangler.toml` に D1 バインディングが定義され、WAL mode の設定根拠がコメントで記載されている
- AC-2: staging / production D1 に対して `PRAGMA journal_mode=WAL` が適用されていることが確認できる
- AC-3: WAL mode 設定手順が 02-serial-monorepo-runtime-foundation の runbook に記録されている
- AC-4: ローカル開発環境との WAL mode 差異が文書化されている
- AC-5: 02-serial-monorepo-runtime-foundation の AC との整合が確認されている

## 既存資産インベントリ

| 項目 | 確認内容 | 現状 |
| --- | --- | --- |
| wrangler.toml (api) | D1 バインディングの有無・現在の設定 | 要確認 |
| wrangler.toml (web) | D1 バインディングの有無（web は api 経由のみ） | 要確認 |
| D1 インスタンス | staging / production の D1 database_id | 要確認（01b タスク依存） |
| wrangler CLI バージョン | WAL mode PRAGMA 実行に必要なバージョン | 要確認（3.x 以降推奨） |
| local WAL 設定 | wrangler dev での D1 ローカルエミュレーション仕様 | 要確認 |

## 正本仕様参照表

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順・wrangler 操作・D1 binding 設定例 |
| 必須 | docs/01-infrastructure-setup/ut-02-d1-wal-mode/index.md | タスク概要・AC・依存関係の正本 |
| 参考 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | 組み込み先タスク（存在する場合） |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |
