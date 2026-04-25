# UT-02: D1 WAL mode 設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-02 |
| タスク名 | D1 WAL mode 設定 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation |

## 目的

Cloudflare D1 の WAL (Write-Ahead Logging) mode を `wrangler.toml` に設定することで、Sheets→D1 同期ジョブと API からの読み取りが同時実行された際の読み書き競合を最小化する。本タスクは独立した作業ではなく、**02-serial-monorepo-runtime-foundation に組み込み済み**として扱う。

> **注意: このタスクは 02-serial-monorepo-runtime-foundation に組み込み済みです。**
> 独立したタスクとして起票・実施するのではなく、02-serial-monorepo-runtime-foundation の Phase 5 (セットアップ実行) または Phase 2 (設計) の中で対応することが推奨されます。
> 本仕様書は設定内容の記録・参照用として作成されています。

## スコープ

### 含む
- `wrangler.toml` への D1 WAL mode 設定（`journal_mode = "WAL"` または `wrangler d1 execute` による設定確認）
- WAL mode 有効化の動作確認（同時読み書き時のロック競合テスト）
- wrangler.toml の D1 バインディング設定との整合確認
- WAL mode 設定の環境別差異確認（local / staging / production）

### 含まない
- D1 スキーマ設計（→ UT-04 で実施）
- Sheets→D1 同期実装（→ UT-09 で実施）
- D1 のバックアップ・リストア設計（→ 03-serial-data-source-and-storage-contract で実施）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation | 本タスクはここに組み込まれるため、同タスクの開始と同時に実施する |
| 上流 | doc/01b-parallel-cloudflare-base-bootstrap | D1 インスタンスの作成・namespace 確定が必要 |
| 下流 | UT-01 (Sheets→D1 同期方式定義) | WAL mode 前提で同期フロー設計が行われる |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | WAL mode 設定済みの D1 に対して同期ジョブを実装する |

## 苦戦箇所・知見

**1. Cloudflare D1 の WAL mode 設定方法が wrangler バージョンによって異なる**
D1 の WAL mode は SQLite の機能をそのまま利用するが、Cloudflare のマネージド D1 では `PRAGMA journal_mode=WAL` を直接実行できる場合とできない場合がある。`wrangler d1 execute` を使って `PRAGMA journal_mode=WAL;` を発行した後、`PRAGMA journal_mode;` で確認する手順が必要。wrangler のバージョンが古いと D1 beta API との互換性問題が出るため、`wrangler@3.x` 以降を前提にすること。

**2. local 開発環境では miniflare / wrangler dev の D1 エミュレーションが WAL 非対応の場合がある**
`wrangler dev --local` で使われる D1 ローカルエミュレーションは SQLite ファイルをそのまま使うため、WAL mode の設定が production と食い違うことがある。開発時に WAL が効いているかどうかを確認する手順を runbook に残しておかないと、本番環境でのみ再現するロック競合に気付きにくい。

**3. WAL mode の効果が出るのは多数の読み取り + 少数の書き込みが重なるパターンに限られる**
Cloudflare Workers の無料枠では同時実行数が低く、WAL mode の恩恵が小さい可能性がある。設定自体はコストゼロなので実施は推奨されるが、パフォーマンス改善の「銀の弾丸」ではないことを認識したうえで設定する。

## 実行概要

- `wrangler.toml` の D1 バインディング定義に WAL mode に関するコメントを追記し、設定根拠を記録する
- `wrangler d1 execute <DB_NAME> --command "PRAGMA journal_mode=WAL;"` を staging / production に対して実行し、`WAL` が返ることを確認する
- `wrangler d1 execute <DB_NAME> --command "PRAGMA journal_mode;"` による確認手順を runbook に記録する
- ローカル開発環境における WAL mode の扱いを明記し、本番との差異を文書化する
- 02-serial-monorepo-runtime-foundation の Phase 5 成果物 (foundation-bootstrap-runbook.md) に本設定手順を組み込む

## 完了条件

- [ ] `wrangler.toml` に D1 バインディングが定義され、WAL mode の設定根拠がコメントで記載されている
- [ ] staging / production D1 に対して `PRAGMA journal_mode=WAL` が適用されていることが確認できる
- [ ] WAL mode 設定手順が 02-serial-monorepo-runtime-foundation の runbook に記録されている
- [ ] ローカル開発環境との WAL mode 差異が文書化されている
- [ ] 02-serial-monorepo-runtime-foundation の AC との整合が確認されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | 組み込み先タスクの概要・AC |
| 必須 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/phase-05.md | セットアップ実行フェーズ（組み込み対象） |
| 必須 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-02 の検出コンテキスト（OOS-03 / G-03） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順・wrangler 操作 |
