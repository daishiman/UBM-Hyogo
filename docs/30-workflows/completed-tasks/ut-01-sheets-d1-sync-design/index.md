# ut-01-sheets-d1-sync-design - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-01 |
| タスク名 | Sheets→D1 同期方式定義 |
| ディレクトリ | docs/30-workflows/ut-01-sheets-d1-sync-design |
| Wave | 1 |
| 実行種別 | parallel（UT-03 と並列着手可、上流 3 タスク完了後） |
| 作成日 | 2026-04-29 |
| 担当 | unassigned |
| 状態 | spec_created |
| タスク種別 | docs-only / design_specification |
| visualEvidence | NON_VISUAL |
| scope | design_specification |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #50 (CLOSED のままタスク仕様書として再構築) |
| 原典スペック | docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md |

## 目的

Google Sheets を入力源、Cloudflare D1 を canonical store として位置づけ、両者間のデータ同期アーキテクチャ（方式・タイミング・エラーハンドリング・冪等性確保・監査証跡）を **設計文書として確定** する。同期の責務境界と障害時の復旧基準を一意に定義し、後続実装タスク（UT-09 sheets-to-d1-cron-sync-job、UT-03 sheets-api-auth-setup）が迷いなく着手できる状態を作る。

本タスクは **docs-only / NON_VISUAL** の設計タスクであり、コード実装は行わない。実装は UT-09 で別途実施する。`workflow_state = spec_created` を Phase 12 close-out 後も据え置く（実装完了タスクではない）。

## スコープ

### 含む

- 同期方式の選定（push / pull / webhook / cron の比較評価と採択理由の文書化）
- 同期タイミング定義（手動トリガー / スケジュール（Cron） / バックフィル の3種フロー）
- エラーハンドリング方針（リトライ戦略・Exponential Backoff・冪等性確保・部分失敗時の扱い・Dead Letter 相当の failed ログ保持）
- Sheets → D1 フロー図（手動 / 定期 / バックフィルのシーケンス図またはデータフロー図）
- source-of-truth の優先順位決定（Sheets 優先 vs D1 優先）と障害時のロールバック判断フローチャート
- `sync_log` テーブルの **論理スキーマ設計**（ジョブID / 状態 / オフセット / タイムスタンプ）
- Google Sheets API v4 quota（500 req/100s/project）への対処方針（バッチサイズ・待機戦略）

### 含まない

- 実際の同期ジョブコード実装（→ UT-09 で実施）
- D1 物理スキーマのマイグレーション作成（→ UT-04 で実施。本タスクは `sync_log` の **論理設計** のみ）
- Sheets API 認証実装・Service Account JSON の Secret 化（→ UT-03 で実施）
- 通知基盤との統合（→ UT-07）
- モニタリング/アラート設計（→ UT-08）
- エラーハンドリング標準化のフォーマライズ（→ UT-10）
- 本番データ投入・staging E2E（→ UT-26）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation | monorepo 構造・packages/integrations の責務確定後に設計可能 |
| 上流 | docs/30-workflows/completed-tasks/01b-parallel-cloudflare-base-bootstrap | D1 バインディング名・namespace 確定が前提 |
| 上流 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap | Sheets API の接続先 ID・権限設計確定が前提 |
| 並列 | UT-03（Sheets API 認証方式設定） | 認証は UT-03、同期フローは UT-01 で並列着手可 |
| 下流 | UT-03（Sheets API 認証方式設定） | 本仕様の同期フロー設計を受けて認証実装詳細が決まる |
| 下流 | UT-09（Sheets→D1 同期ジョブ実装） | 本仕様書を設計根拠として実装する |
| 下流 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract | 契約定義は当該タスクで行い、sync 設計本体は UT-01 が持つ |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md | 原典スペック。AC / 苦戦箇所 / スコープ境界の正本 |
| 必須 | docs/30-workflows/completed-tasks/03-serial-data-source-and-storage-contract/index.md | Sheets / D1 契約の上位定義 |
| 必須 | docs/30-workflows/completed-tasks/02-serial-monorepo-runtime-foundation/index.md | packages/integrations の責務境界 |
| 必須 | docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/index.md | Sheets API 接続先・権限設計 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界 / data flow |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 / Cron Triggers 基本手順 |
| 参考 | .claude/skills/aiworkflow-requirements/references/database-schema.md | sync_log 論理設計の隣接スキーマ |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 下流実装タスクの構造 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | Cron Triggers 公式 |
| 参考 | https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get | Sheets API v4 quota / range |

## 受入条件 (AC)

- **AC-1**: 同期方式（push / pull / webhook / cron）の **比較評価表** が `outputs/phase-02/sync-method-comparison.md` に作成され、採択方式（Cloudflare Workers Cron Triggers による定期 pull）の理由が明文化されている。
- **AC-2**: 手動トリガー / 定期同期 / バックフィルの **3 種フロー図**（シーケンス図またはデータフロー図）が `outputs/phase-02/sync-flow-diagrams.md` に存在し、エラーパスを含めて可視化されている。
- **AC-3**: エラーハンドリング方針（最大 3 回リトライ / Exponential Backoff / 冪等性確保 / 部分失敗時の継続戦略 / failed ログ保持）が設計文書に記載されている。
- **AC-4**: `sync_log` テーブルの **論理スキーマ**（ジョブ ID / 同期ステータス `pending|in_progress|completed|failed` / オフセット / タイムスタンプ / エラーメッセージ）が `outputs/phase-02/sync-log-schema.md` に定義されている。
- **AC-5**: source-of-truth の優先順位（Sheets 優先 / D1 優先）が **明文化** され、障害時の復旧基準・ロールバック判断フローチャートが設計文書に含まれている。
- **AC-6**: Google Sheets API quota（500 req/100s/project）への対処方針（バッチサイズ 100〜500 行、Exponential Backoff、quota 超過時の待機戦略）が設計文書に記載されている。
- **AC-7**: 冪等性の担保戦略（行ハッシュ管理 / バンドマン固有 ID 先行定義 / `INSERT ... ON CONFLICT DO UPDATE` の前提）が文書化され、UT-04 への引き継ぎ事項として整理されている。
- **AC-8**: Phase 3 で代替案 3 件以上（A: push / Apps Script webhook、B: pull / Cron、C: hybrid（webhook + cron fallback））が PASS / MINOR / MAJOR で評価され、base case が確定している。
- **AC-9**: UT-09 が本仕様書を **参照のみで実装に着手できる** 状態（曖昧さの解消、open question 0 件）になっている。
- **AC-10**: タスク種別 `docs-only` / `visualEvidence: NON_VISUAL` / `workflow_state: spec_created` / `scope: design_specification` が Phase 1 で固定され、`artifacts.json.metadata` と完全一致している。

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | spec_created | outputs/phase-02/sync-method-comparison.md / sync-flow-diagrams.md / sync-log-schema.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md / alternatives.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/test-strategy.md |
| 5 | 実装ランブック（設計タスクは spec walkthrough） | phase-05.md | spec_created | outputs/phase-05/implementation-runbook.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/failure-cases.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/ac-matrix.md |
| 8 | DRY 化 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/go-no-go.md |
| 11 | 手動 smoke（docs-only / NON_VISUAL 縮約テンプレ） | phase-11.md | spec_created | outputs/phase-11/main.md / manual-smoke-log.md / link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | spec_created | outputs/phase-12/main.md / implementation-guide.md / system-spec-update-summary.md / documentation-changelog.md / unassigned-task-detection.md / skill-feedback-report.md / phase12-task-spec-compliance-check.md |
| 13 | PR作成 | phase-13.md | blocked | outputs/phase-13/main.md / change-summary.md / local-check-result.md / pr-template.md |

## 主要成果物（Phase 1〜3 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-01/main.md | 要件定義（背景 / 課題 / 苦戦箇所 / スコープ / AC-1〜10 / 4 条件評価 / NON_VISUAL 確定） |
| 設計 | outputs/phase-02/sync-method-comparison.md | push / pull / webhook / cron 比較表と採択理由 |
| 設計 | outputs/phase-02/sync-flow-diagrams.md | 手動 / 定期 / バックフィルの 3 種フロー図プレースホルダ |
| 設計 | outputs/phase-02/sync-log-schema.md | sync_log 論理スキーマ |
| レビュー | outputs/phase-03/main.md | PASS/MINOR/MAJOR 判定 / 4 条件再評価 / 着手可否ゲート |
| レビュー | outputs/phase-03/alternatives.md | 代替案 3 件以上の比較 |
| メタ | artifacts.json | Phase 1〜13 機械可読サマリー（visualEvidence=NON_VISUAL / taskType=docs-only） |
| 仕様書 | phase-NN.md × 13 | Phase 別仕様（Phase 1〜3 = 本タスクで詳細化、4〜12 = 骨格、13 = blocked） |

## 関連サービス・ツール

| サービス/ツール | 用途 | コスト |
| --- | --- | --- |
| Cloudflare Workers Cron Triggers | 定期 pull 同期方式の基盤（設計上の採択候補） | 無料枠 |
| Cloudflare D1 | canonical store / sync_log 格納先（論理設計のみ） | 無料枠 |
| Google Sheets API v4 | 同期元（quota 設計対象） | 無料 |
| Mermaid / draw.io | フロー図記法（設計成果物の表現） | 無料 |

## Secrets 一覧

本タスクは **Secret を導入しない**。設計文書のみを生成し、`.env` / Cloudflare Secrets / 1Password Environments のいずれにも追加・変更を行わない。Secret の実体定義は UT-03（Sheets API 認証）と UT-09（同期ジョブ実装）が担う。

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| #1 | 実フォームの schema をコードに固定しすぎない | Sheets→D1 マッピングはスキーマ層に閉じる旨を設計に明記。違反なし |
| #4 | Google Form schema 外のデータは admin-managed data として分離 | Sheets 由来 admin-managed data の D1 配置方針を設計に含める |
| #5 | D1 への直接アクセスは `apps/api` に閉じる | 同期ジョブは `apps/api` のみ、と設計上で固定。違反なし |

## 完了判定

- Phase 1〜13 の状態が `artifacts.json` と一致する（Phase 1〜12 = spec_created、13 = blocked）
- AC-1〜AC-10 が Phase 1〜3 でカバーされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- `workflow_state = spec_created` が Phase 12 close-out 後も据え置かれる（実装完了 = UT-09 が担う）
- docs-only / NON_VISUAL 縮約テンプレ（main.md / manual-smoke-log.md / link-checklist.md の 3 点）が Phase 11 で適用される
- UT-09 が本仕様書のみで着手可能な状態（open question 0 件）

## 苦戦箇所・知見（原典スペック §「苦戦箇所」から抽出）

**1. push vs pull の判断が状況依存で揺れやすい**
Cloudflare Workers から Sheets API を push-trigger で呼ぶ場合、Workers の CPU 制限（30ms バースト）と Sheets API 応答遅延（~200ms〜1s）が衝突する。webhook（Apps Script 経由）か Workers 定期 pull かを設計段階で決めないと実装が迷走する。Cron Triggers（1分〜1時間単位）を pull のベースに置く構成が無料枠で最も安定する仮説で進める。

**2. 冪等性の担保が難しい**
Sheets の行データには一意キーが存在しないことが多い。D1 への UPSERT で行 RowIndex を一意キーとすると、行の挿入・削除で意図しない上書きが発生する。バンドマン固有 ID の先行定義、または Sheets 行ハッシュを管理テーブルに持つ設計が必要。UT-04 への引き継ぎ事項として明文化する。

**3. 部分失敗時のリトライと監査証跡**
1000 行の Sheets データ同期途中でエラー発生時、書き込み済みオフセットを追跡しないと full-resync のたびに整合が崩れる。`sync_log` テーブルでジョブ ID / オフセット / タイムスタンプ / ステータスを追跡する設計を Phase 2 で確定する。

**4. Sheets API quota との衝突**
Google Sheets API v4 は 500 req/100s/project の quota 制限。バックフィル時や障害後の一括再同期で quota 超過が起きると Exponential Backoff が必要。設計段階でバッチサイズ（100〜500 行）と待機戦略を明記しないと実装フェーズで後付け対応になる。

**5. workflow_state の誤書換え**
本タスクは docs-only / spec_created タスクであり、Phase 12 close-out で `workflow_state` を `completed` に書き換えてはならない（実装完了は UT-09 が担う）。task-specification-creator skill の docs-only / NON_VISUAL 縮約テンプレ（UT-GOV-005 で整備）に従い、状態分離を厳守する。

**6. 設計タスクの自己完結性**
UT-09 が本仕様書のみで実装着手できる状態を AC-9 で要求しているため、open question を Phase 3 / Phase 10 で必ず 0 件まで詰める。曖昧な「実装で判断」記述は禁止。

## 関連リンク

- 上位 README: ../README.md
- 原典 unassigned-task: ../unassigned-task/UT-01-sheets-d1-sync-design.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/50 (CLOSED)
- 下流実装タスク: ../ut-09-sheets-to-d1-cron-sync-job/index.md
- フォーマット模倣元（docs-only / NON_VISUAL）: ../ut-gov-005-docs-only-nonvisual-template-skill-sync/index.md
- 縮約テンプレ正本: ../../../.claude/skills/task-specification-creator/references/phase-template-phase11.md
