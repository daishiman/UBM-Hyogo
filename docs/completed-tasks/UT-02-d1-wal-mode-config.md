# UT-02: D1 読み書き競合対策の設定可否確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-02 |
| タスク名 | D1 読み書き競合対策の設定可否確認 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | incorporated_spec_created |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation |

## 目的

Cloudflare D1 の WAL (Write-Ahead Logging) mode を永続設定できるという未検証前提を排除し、Sheets→D1 同期ジョブと API 読み取りが同時実行された際の競合対策を条件付き runbook と downstream runtime mitigation として確定する。本タスクは独立した作業ではなく、**02-serial-monorepo-runtime-foundation に組み込み済み**として扱う。

> **注意: このタスクは 02-serial-monorepo-runtime-foundation に組み込み済みです。**
> 独立したタスクとして起票・実施するのではなく、02-serial-monorepo-runtime-foundation の Phase 5 (セットアップ実行) または Phase 2 (設計) の中で対応することが推奨されます。
> 本仕様書は設定内容の記録・参照用として作成されています。

## スコープ

### 含む
- `wrangler.toml` への D1 バインディング定義と競合対策コメントの記録
- Cloudflare D1 が永続 `PRAGMA journal_mode=WAL` を公式サポートするかの確認手順
- 公式サポートが不明または非対応の場合の runtime mitigation（retry/backoff、queue serialization、短い transaction、batch-size 制限）の委譲
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
| 下流 | UT-01 (Sheets→D1 同期方式定義) | D1 競合対策の公式サポート確認結果を同期フロー設計へ渡す |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | WAL 非対応時の runtime mitigation を同期ジョブ側で実装する |

## 苦戦箇所・知見

**1. Cloudflare D1 の WAL mode 永続設定は公式サポート確認が必要**
Cloudflare D1 は SQLite 互換だが、マネージド D1 の compatible PRAGMA と永続効果は SQLite と同一とは限らない。`journal_mode` が公式 compatible PRAGMA として確認できない限り、production mutation を行わない。

**2. local 開発環境では miniflare / wrangler dev の D1 エミュレーションが WAL 非対応の場合がある**
`wrangler dev --local` で使われる D1 ローカルエミュレーションは SQLite ファイルをそのまま使うため、WAL mode の設定が production と食い違うことがある。開発時に WAL が効いているかどうかを確認する手順を runbook に残しておかないと、本番環境でのみ再現するロック競合に気付きにくい。

**3. WAL mode の効果が出るのは多数の読み取り + 少数の書き込みが重なるパターンに限られる**
Cloudflare Workers の無料枠では同時実行数が低く、WAL mode の恩恵が小さい可能性がある。公式サポートが確認できない場合は、retry/backoff、queue serialization、短い transaction、batch-size 制限を優先する。

## 実行概要

- `wrangler.toml` の D1 バインディング定義に D1 競合対策コメントを追記し、設定方針を記録する
- `wrangler d1 execute <DB_NAME> --command "PRAGMA journal_mode;"` による read-only 確認手順を runbook に記録する
- `PRAGMA journal_mode=WAL` は Cloudflare D1 の公式永続サポート確認後、明示承認がある場合だけ staging から検証する
- ローカル開発環境における WAL mode の扱いを明記し、本番との差異を文書化する
- 02-serial-monorepo-runtime-foundation の Phase 5 成果物 (foundation-bootstrap-runbook.md) に本設定手順を組み込む

## 完了条件

- [x] `wrangler.toml` に D1 バインディングが定義され、D1 競合対策の設定方針がコメントで記載されている
- [x] staging / production D1 に対する `PRAGMA journal_mode=WAL` は公式永続サポート確認後にのみ実行する方針が記録されている
- [x] D1 競合対策の確認手順が 02-serial-monorepo-runtime-foundation の runbook に記録されている
- [ ] ローカル開発環境との WAL mode 差異が文書化されている
- [ ] 02-serial-monorepo-runtime-foundation の AC との整合が確認されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | 組み込み先タスクの概要・AC |
| 必須 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/phase-05.md | セットアップ実行フェーズ（組み込み対象） |
| 必須 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-02 の検出コンテキスト（OOS-03 / G-03） |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順・wrangler 操作 |
