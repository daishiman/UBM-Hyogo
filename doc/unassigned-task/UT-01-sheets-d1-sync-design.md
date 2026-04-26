# UT-01: Sheets→D1 同期方式定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-01 |
| タスク名 | Sheets→D1 同期方式定義 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

Google Sheets を入力源、Cloudflare D1 を canonical store として位置づけ、両者間のデータ同期アーキテクチャ（方式・タイミング・エラーハンドリング）を設計文書として確定する。同期の責務境界と障害時の復旧基準を一意に定義し、後続の実装タスク (UT-09) が迷いなく着手できる状態を作る。

## スコープ

### 含む
- 同期方式の選定（push / pull / webhook / cron の比較評価と採択理由）
- 同期タイミング定義（手動トリガー / スケジュール / バックフィル の3種）
- エラーハンドリング方針（リトライ戦略・冪等性確保・部分失敗時の扱い）
- Sheets → D1 フロー図（シーケンス図またはデータフロー図）
- source-of-truth の優先順位決定（Sheets 優先 vs D1 優先）
- 同期ログ・監査証跡の設計方針

### 含まない
- 実際の同期ジョブコード実装（→ UT-09 で実施）
- D1 スキーマ設計（→ UT-04 で実施）
- Sheets API 認証実装（→ UT-03 で実施）
- 本番データ投入

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation | monorepo 構造・packages/integrations の責務確定後に設計可能 |
| 上流 | doc/completed-tasks/01b-parallel-cloudflare-base-bootstrap | D1 バインディング名・namespace が確定している必要がある |
| 上流 | doc/completed-tasks/01c-parallel-google-workspace-bootstrap | Sheets API の接続先 ID・権限設計が確定している必要がある |
| 下流 | UT-03 (Sheets API 認証方式設定) | 本 UT-01 の同期フロー設計を受けて認証実装詳細が決まる |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本仕様書を設計根拠として実装する |
| 下流 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract | 契約定義はここで行い、sync 設計本体は UT-01 が持つ |

## 着手タイミング

> **着手前提**: `02-serial-monorepo-runtime-foundation`・`01b-parallel-cloudflare-base-bootstrap`・`01c-parallel-google-workspace-bootstrap` の3タスクが完了してから着手すること。

| 条件 | 理由 |
| --- | --- |
| 02-serial-monorepo-runtime-foundation 完了 | D1 バインディング・Workers の monorepo 構造が確定していないと同期フローの設計が宙に浮く |
| 01b-parallel-cloudflare-base-bootstrap 完了 | D1 namespace・バインディング名が確定している必要がある |
| 01c-parallel-google-workspace-bootstrap 完了 | Sheets の接続先 ID・権限設計が確定している必要がある |

UT-03（Sheets API 認証方式設定）とは並列着手が可能。

## 苦戦箇所・知見

**1. push vs pull の判断が状況依存で揺れやすい**
Cloudflare Workers から Sheets API を push-trigger で呼ぶ場合、Workers の CPU 制限（30ms バースト）と Sheets API の応答遅延（~200ms〜1s）が衝突する。設計段階で「Sheets 側が変更を通知する webhook か、Workers が定期的に pull するか」を明確に決めないと、後続実装で迷走する。Cloudflare Workers Cron Triggers（1分〜1時間単位）を pull 方式のベースに置く形が、無料枠内で最も安定する可能性が高い。

**2. 冪等性の担保が難しい**
Sheets の行データには一意キーが存在しないことが多い。D1 への UPSERT を行う際に行RowIndex を一意キーとして使うと、行の挿入・削除で意図しない上書きが発生する。バンドマン固有の ID フィールドを先行定義するか、Sheets のスプレッドシート行ハッシュを管理テーブルに持つ設計が必要になる。

**3. 部分失敗時のリトライと監査証跡**
1000行の Sheets データを D1 に同期する途中でエラーが発生した場合、どこまで書き込み済みかを追跡する仕組みがないと full-resync のたびにデータ整合が崩れる。`sync_log` テーブルを D1 内に設けてオフセット・タイムスタンプを記録するパターンが推奨される。

**4. Sheets API の quota 制限との衝突**
Google Sheets API v4 は 1プロジェクト 500 req/100s の quota がある。バックフィル時や障害後の一括再同期で quota 超過が起きると Exponential Backoff が必要になる。設計段階でバッチサイズ（1回 100〜500 行程度）と待機戦略を明記しないと、実装フェーズで後付け対応になる。

## 実行概要

- 同期方式を「Cloudflare Workers Cron Triggers による定期 pull 方式」に絞り込み、push (Apps Script webhook) との比較表を作成して採択理由を文書化する
- 手動同期・定期同期・バックフィルの3種それぞれについてシーケンス図を作成し、エラーパスを含むフロー全体を可視化する
- D1 内に `sync_log` テーブルの論理設計を行い、ジョブIDと同期ステータス（pending / in_progress / completed / failed）を追跡できる構造を定義する
- リトライ方針（最大3回 / Exponential Backoff / Dead Letter Queue 相当の failed ログ保持）をポリシー文書として記述する
- 障害時の復旧基準（Sheets 優先での再同期 vs D1 データ保持）を決定し、ロールバック判断フローチャートを作成する

## 完了条件

- [ ] 同期方式（push / pull / webhook / cron）の比較評価表が作成され、採択方式の理由が明文化されている
- [ ] 手動・定期・バックフィルの3種のフロー図が outputs に存在する
- [ ] エラーハンドリング方針（リトライ戦略・冪等性確保・部分失敗扱い）が設計文書に記載されている
- [ ] `sync_log` テーブルの論理スキーマが定義されている
- [ ] source-of-truth の優先順位（Sheets 優先 / D1 優先）が明文化されている
- [ ] Sheets API quota 制限への対処方針が記載されている
- [ ] UT-09 が本仕様書を参照して実装に着手できる状態になっている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract/index.md | Sheets / D1 契約の上位定義 |
| 必須 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/index.md | packages/integrations の責務境界 |
| 必須 | doc/completed-tasks/01c-parallel-google-workspace-bootstrap/index.md | Sheets API 接続先・権限設計 |
| 必須 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-01 の検出コンテキスト（OOS-01 / G-01） |
| 参考 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | D1 / API route 設計方針 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 基本手順・Cron Triggers |
