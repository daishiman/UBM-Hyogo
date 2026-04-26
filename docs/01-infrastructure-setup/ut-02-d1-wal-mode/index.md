# ut-02-d1-wal-mode - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-02 |
| タスク名 | D1 WAL mode 設定 |
| ディレクトリ | docs/01-infrastructure-setup/ut-02-d1-wal-mode |
| Wave | 1 |
| 実行種別 | 組み込み（02-serial-monorepo-runtime-foundation に統合） |
| 作成日 | 2026-04-26 |
| 担当 | delivery |
| 状態 | pending |
| タスク種別 | docs-only（設定内容の記録・参照用） |
| 既存タスク組み込み | あり |
| 組み込み先 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation |
| GitHub Issue | #4 |

## 目的

Cloudflare D1 の WAL (Write-Ahead Logging) mode を `wrangler.toml` に設定することで、Sheets→D1 同期ジョブと API からの読み取りが同時実行された際の読み書き競合を最小化する。

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
| 上流 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation | 本タスクはここに組み込まれるため、同タスクの開始と同時に実施する |
| 上流 | docs/01-infrastructure-setup/01b-parallel-cloudflare-base-bootstrap | D1 インスタンスの作成・namespace 確定が必要 |
| 下流 | UT-01 (Sheets→D1 同期方式定義) | WAL mode 前提で同期フロー設計が行われる |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | WAL mode 設定済みの D1 に対して同期ジョブを実装する |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順・wrangler 操作 |
| 必須 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | 組み込み先タスクの概要・AC |
| 必須 | docs/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/phase-05.md | セットアップ実行フェーズ（組み込み対象） |
| 参考 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 同期ルール |

## 受入条件 (AC)

- AC-1: `wrangler.toml` に D1 バインディングが定義され、WAL mode の設定根拠がコメントで記載されている
- AC-2: staging / production D1 に対して `PRAGMA journal_mode=WAL` が適用されていることが確認できる
- AC-3: WAL mode 設定手順が 02-serial-monorepo-runtime-foundation の runbook に記録されている
- AC-4: ローカル開発環境との WAL mode 差異が文書化されている
- AC-5: 02-serial-monorepo-runtime-foundation の AC との整合が確認されている

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01 |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02 |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03 |
| 4 | 事前検証手順 | phase-04.md | pending | outputs/phase-04 |
| 5 | セットアップ実行 | phase-05.md | pending | outputs/phase-05 |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06 |
| 7 | 検証項目網羅性 | phase-07.md | pending | outputs/phase-07 |
| 8 | 設定 DRY 化 | phase-08.md | pending | outputs/phase-08 |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09 |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10 |
| 11 | 手動 smoke test | phase-11.md | pending | outputs/phase-11 |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12 |
| 13 | PR作成 | phase-13.md | pending | outputs/phase-13 |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/wal-mode-design.md | WAL mode 設計・設定根拠 |
| ドキュメント | outputs/phase-02/env-diff-matrix.md | 環境別 WAL mode 差異マトリクス |
| ドキュメント | outputs/phase-05/foundation-bootstrap-runbook-wal-section.md | runbook の WAL mode セクション |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | spec update summary |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-*.md x 13 | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare D1 | DB（WAL mode 設定対象） | 無料枠 |
| wrangler CLI | D1 PRAGMA 実行・設定確認 | 無料 |

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC が Phase 7 / 10 で完全トレースされる
- 4条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 苦戦箇所・知見

**1. Cloudflare D1 の WAL mode 設定方法が wrangler バージョンによって異なる**
D1 の WAL mode は SQLite の機能をそのまま利用するが、Cloudflare のマネージド D1 では `PRAGMA journal_mode=WAL` を直接実行できる場合とできない場合がある。`wrangler@3.x` 以降を前提にすること。

**2. local 開発環境では miniflare / wrangler dev の D1 エミュレーションが WAL 非対応の場合がある**
`wrangler dev --local` で使われる D1 ローカルエミュレーションは SQLite ファイルをそのまま使うため、WAL mode の設定が production と食い違うことがある。

**3. WAL mode の効果が出るのは多数の読み取り + 少数の書き込みが重なるパターンに限られる**
Cloudflare Workers の無料枠では同時実行数が低く、WAL mode の恩恵が小さい可能性がある。設定自体はコストゼロなので実施は推奨されるが、パフォーマンス改善の「銀の弾丸」ではない。

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-infra.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/4
