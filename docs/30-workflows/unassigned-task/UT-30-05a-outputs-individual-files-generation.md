# UT-30: 05a parallel observability outputs 個別ファイル生成

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-30 |
| タスク名 | 05a parallel observability outputs 個別ファイル生成 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1.5（UT-08-IMPL 着手前） |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails |
| 起票理由 | UT-08 監視・アラート設計（spec_created）が参照する 05a outputs が未生成のため、UT-08-IMPL 着手前ゲートとして実体化が必要 |

## 目的

`doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/` 配下の個別 Markdown ファイル（`phase-02/observability-matrix.md` / `phase-05/cost-guardrail-runbook.md`）を 05a 自身のワークフローで生成し、UT-08 監視・アラート設計および UT-08-IMPL（実装）から参照可能な実体ファイルとして配置する。05a 既存の `index.md` / `phase-02.md` を上書きせず、`outputs/` 配下に新規生成する。

## スコープ

### 含む

- `outputs/phase-02/observability-matrix.md` の生成（観測項目・責務・自動化区分の正本テーブル）
- `outputs/phase-05/cost-guardrail-runbook.md` の生成（無料枠超過時の一次対応手順、05a の手動 runbook）
- 05a `index.md` / `phase-02.md` から `outputs/` 配下への参照リンク追加（双方向リンク化）
- UT-08 設計成果物との identifier drift 防止確認（メトリクス名・閾値・Secret 名の整合）

### 含まない

- UT-08 設計成果物（`docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/`）への変更
- 05a 既存の `index.md` / `phase-02.md` 本文の上書き編集
- WAE 計装コード・アラートワーカー実装（→ UT-08-IMPL）
- runbook への自動アラート受信時一次対応の追記（→ UT-08-IMPL 末尾の `runbook-diff-plan.md` 反映 PR）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 05a parallel observability の Phase 2 / Phase 5 設計 | 既存 `index.md` / `phase-02.md` の内容を outputs 個別ファイルへ抽出するため |
| 上流 | UT-08 monitoring-alert-design（spec_created） | observability-matrix.md の自動化区分が UT-08 metric-catalog と一致する必要がある |
| 下流 | UT-08-IMPL | 個別ファイル生成完了が実装着手前ゲート |
| 連携 | UT-09（Sheets→D1 同期ジョブ実装） | cost-guardrail-runbook.md に Sheets→D1 同期失敗時手順を含める |

## 着手タイミング

> **着手前提**: UT-08 monitoring-alert-design が `spec_created` に到達済（2026-04-27 完了）。UT-08-IMPL 着手前のゲートとして本タスクを完了させること。

## 苦戦箇所・知見

**05a 既存仕様の上書き禁止と outputs 抽出の境界**
05a の `index.md` / `phase-02.md` には observability-matrix と runbook の内容がインラインで記述されている。これらを **outputs 配下に抽出する際、既存ファイルから内容を切り出すのではなく、outputs を新規 SSOT として生成し既存ファイルから outputs を参照する形に再構成**する。逆方向（既存ファイルを outputs に移して既存ファイルを書き換える）は不変条件 1 違反となる。

**identifier drift 防止（UT-08 metric-catalog との整合）**
observability-matrix.md には UT-08 で定義した 20 メトリクス（`workers.errors_5xx` / `d1.row_reads` 等）の自動化区分（自動 14 / 手動 6）を記載する。識別子は UT-08 の `metric-catalog.md` を SSOT とし、observability-matrix 側は引用・参照に徹する。先に observability-matrix を書いて UT-08 と齟齬が出ると Phase 12 system-spec-update-summary の domain sync が崩れるため注意。

**cost-guardrail-runbook の責務分離**
本ファイルは 05a の手動観測 runbook（無料枠 70%/90% 到達時の人手対応）。自動アラート受信時の一次対応（Slack 通知から Runbook URL を辿る手順）は UT-08-IMPL 末尾で `runbook-diff-plan.md §3.1` の内容を末尾追記する別 PR で対応する。本タスクでは追記しない。

**M-01（Phase 10）の DEFERRED 解消**
UT-08 Phase 10 §7 で M-01 として記録された「05a outputs 個別ファイル未生成」は、本タスクが完了することで DEFERRED → CLOSED となる。完了報告時に UT-08 の `documentation-changelog.md` 末尾へ追記、または UT-08-IMPL 着手前チェックリストでの確認に統合する。

## 実行概要

- 05a `index.md` / `phase-02.md` を読み、observability-matrix と cost-guardrail-runbook 相当の記述を抽出方針として整理する
- UT-08 `outputs/phase-02/metric-catalog.md` と突合し、自動化区分を確定する
- `outputs/phase-02/observability-matrix.md` を新規作成（観測項目・責務分担・自動化区分の表 + UT-08 metric-catalog への参照リンク）
- `outputs/phase-05/cost-guardrail-runbook.md` を新規作成（無料枠超過時の手動一次対応手順）
- 05a `index.md` / `phase-02.md` の関連箇所から outputs 配下のリンクを追記（既存本文は変更せず、節末に「→ outputs/...」のリンク行追加で済ませる）
- UT-08 `documentation-changelog.md` または UT-08-IMPL 仕様書の実装前ゲートで「05a outputs 生成済」をチェックボックス更新

## 完了条件

- [ ] `doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-02/observability-matrix.md` が存在する
- [ ] `doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/outputs/phase-05/cost-guardrail-runbook.md` が存在する
- [ ] observability-matrix.md の自動化区分が UT-08 `metric-catalog.md` と整合している（メトリクス名・自動 14 / 手動 6 の区分）
- [ ] 05a 既存の `index.md` / `phase-02.md` 本文が**書き換えられていない**（節末リンク追加のみ）
- [ ] UT-08 設計成果物の `link-checklist.md §4` で OPEN になっていた 05a outputs 参照リンクが解決可能になる
- [ ] UT-08-IMPL の実装前ゲート「05a outputs 生成済」が確認可能な状態になっている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md` | 05a 既存仕様（書き換え禁止対象の確認） |
| 必須 | `doc/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/phase-02.md` | 05a Phase 2 既存記述（書き換え禁止対象の確認） |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/metric-catalog.md` | メトリクス名・自動化区分の SSOT |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-02/runbook-diff-plan.md` | 05a 追記計画（自動アラート用は本タスク対象外） |
| 必須 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-11/link-checklist.md` | OPEN になっていた参照リンク一覧 |
| 参考 | `docs/30-workflows/ut-08-monitoring-alert-design/outputs/phase-12/unassigned-task-detection.md` | M-01 DEFERRED 記録 / baseline #2 |
