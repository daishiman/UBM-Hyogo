# implementation-guide.md

> Task 12-1: 実装ガイド。Part 1（中学生向け）+ Part 2（技術者向け）の 2 部構成。
> 本ファイルは Phase 13 の PR 説明本文の一次ソースとしても利用される（PR 用サマリは末尾「PR 説明テンプレ用サマリ」章を参照）。

## Part 1: 中学生向け概念説明

### なぜ必要か（先に説明）

UBM 兵庫支部会のサイトでは、みんなが Google Form に書いた回答が、まず Google Sheets という「学級日誌」みたいな大きな表に並んでいく。でもその学級日誌を毎回そのまま見に行くと、検索や集計が遅いし、Google Sheets 側の利用回数の上限（1 日に使える回数の上限 = quota）にもすぐ引っかかる。だから、サーバーの中にある「公式ノート」（Cloudflare D1 というデータベース）に書き写しておきたい。本タスクは、その「書き写しの段取り」を **設計だけ** ちゃんと決める仕事。実際にコードで書き写すのは別のタスク（UT-09）が担当する。

### 何をするか（あとで説明）

「定期的に動く目覚まし時計のようなしくみ」（Cron）を Cloudflare 上に置いて、決まった時間ごと（最初は 6 時間に 1 回）に、学級日誌（Sheets）を覗きに行く係を動かす。係は 100 行ずつ取りに行って、公式ノート（D1）にまだ書いてない行を見つけたら書き写す。書き写した時刻と「最後にどの行まで写したか」を **当番表**（`sync_log` というテーブル）にメモしておく。途中で止まったら、次の係はメモを見て続きから再開する。同じ行を 2 回写しても結果が変わらないように工夫する（これを「冪等性」と呼ぶ）。

### アナロジー対応表

| 専門用語 | 日常語 |
| --- | --- |
| Google Sheets | 学級日誌（みんなが書き込む元のノート） |
| Cloudflare D1 | サーバーの公式ノート（検索や集計が速い清書） |
| Cloudflare Workers Cron Triggers | 毎時間ノートに書き写しに行く係（目覚まし時計式） |
| `sync_log` テーブル | いつ・どこまで・成功したかを書き留める当番表 |
| 冪等性 | 同じ作業を何回やっても結果が変わらない性質 |
| バックオフ | 失敗したら少し待ってから再挑戦する作戦 |
| バッチサイズ | 1 回の往復で運ぶ荷物の数（100 行ずつ運ぶ） |
| quota | 1 日に使える回数の上限（500 回 / 100 秒） |
| source-of-truth（SoT） | 「どっちが本物の正本か」を決めるルール（ふだんは Sheets が正本） |

### 全体の流れ（中学生向け要約）

1. みんなが Google Form に回答 → 学級日誌（Sheets）に並ぶ
2. Cloudflare の係（Cron）が決まった時間に起きて、学級日誌を 100 行ずつ覗きに行く
3. 公式ノート（D1）にまだ書いてない行を見つけたら、書き写す
4. 書き写した時刻と最後の行番号を当番表（`sync_log`）にメモする
5. もし途中で止まっても、当番表のメモを見て続きから再開する
6. 同じ行を 2 回書き写しても上書きで結果は変わらない（冪等性）
7. もし学級日誌（Sheets）と公式ノート（D1）が食い違ったら、原則は学級日誌が正本（MVP の SoT 方針）

## Part 2: 技術者向け実装ガイド

### C12P2-1 TypeScript 型定義

**該当なし**（本タスクは docs-only / 設計仕様の確定に閉じる。コード変更なし。実 TS 型定義は UT-09 が `apps/api` 配下で実装する。本タスクの `outputs/phase-02/sync-log-schema.md` の論理スキーマ 13 カラムが UT-04 の D1 物理マイグレーションおよび UT-09 の TypeScript 型定義の入力となる）。

### C12P2-2 API シグネチャ

**該当なし**（本タスクは設計のみ。実 API は UT-09 で `apps/api` の Hono ルート + Cron handler として実装する。本タスクは「採択方式 = Cloudflare Workers Cron Triggers による定期 pull」「手動トリガー / 定期 / バックフィルの 3 種フロー」を確定するに留める。`POST /admin/sync` 等の REST API シグネチャは UT-09 で確定する）。

### C12P2-3 使用例（UT-09 が本仕様書のみで実装着手するときの参照フロー）

step-by-step:

1. UT-09 着手前に本タスクの `outputs/phase-02/sync-method-comparison.md` を読み、採択方式 = Workers Cron Triggers 定期 pull（base case B）を確認
2. `outputs/phase-02/sync-flow-diagrams.md` で手動 / 定期 / バックフィルの 3 種フロー（エラーパス含む）を把握
3. `outputs/phase-02/sync-log-schema.md` の論理スキーマ（13 カラム）を UT-04 の D1 物理マイグレーションへ引き渡す
4. 既存 `apps/api` 実装がある場合は、`outputs/phase-02/sync-log-schema.md` §9 の対応表を先に確認し、`sync_log` を新規物理テーブル名として扱わず `sync_job_logs` / `sync_locks` との整合を優先する
5. `outputs/phase-03/main.md` の リスク R-1〜R-7 を実装時のレビュー観点として参照、`alternatives.md` で却下案 A / C と将来オプション D（TECH-M-01）の経緯を確認
6. 引き継ぎ事項（冪等性キー：行ハッシュ + バンドマン固有 ID + `idempotency_key`）を UT-04 の schema 設計に反映
7. UT-09 の Phase 4 テスト戦略では本タスクの `outputs/phase-04/test-strategy.md` を起点とし、`outputs/phase-06/failure-cases.md` の異常系シナリオを継承する
8. 最終 Go 判定の根拠は `outputs/phase-10/go-no-go.md`、AC 充足 trace は `outputs/phase-07/ac-matrix.md` を参照

### C12P2-4 エラー処理（Phase 2 設計の再掲 + 補強）

| 観点 | 方針 |
| --- | --- |
| リトライ | 最大 3 回 |
| Backoff | Exponential（1s → 2s → 4s → 8s → 16s → 32s 上限） |
| 冪等性 | 行ハッシュ + バンドマン固有 ID + `idempotency_key` で `INSERT ... ON CONFLICT DO UPDATE` |
| 部分失敗 | 失敗行を skip してジョブ全体は継続 / 失敗行は `failed` ステータスで `sync_log` に保持 |
| Dead letter 相当 | `sync_log` の failed エントリを保持し、UT-08 監視と連動して通知 |
| Sheets API quota 超過 | 429 / quotaExceeded を Backoff 後に再試行 / バッチサイズ 100 行で抑制 |
| D1 SQLITE_BUSY | UT-02 方針継承（retry / backoff） |
| ロールバック判断 | SoT は MVP では Sheets 優先、障害時のみ D1 優先に切替（`outputs/phase-02/sync-flow-diagrams.md` の判断フローチャートを参照） |

### C12P2-5 設定可能パラメータ・定数

| パラメータ | 初期値 | 調整余地 / 引き継ぎ先 |
| --- | --- | --- |
| Cron 間隔 | 6h（MVP） | 1h / 5min まで縮小可（TECH-M-02 / UT-09 staging で測定） |
| バッチサイズ | 100 行 | 100〜500 行（quota / D1 SQLITE_BUSY 監視結果による） |
| Backoff 最小 | 1s | 固定 |
| Backoff 最大 | 32s | 固定 |
| リトライ回数上限 | 3 | 固定 |
| `sync_log` 保持期間 | 90 日想定 | UT-08 監視と連動して調整（TECH-M-04） |
| source-of-truth 優先順位 | Sheets 優先（MVP） | 障害時のみ D1 優先に切替（運用判断フローチャート参照） |
| `active_lock` | `sync_log` の active な run を 1 件に絞るロック列 | UT-04 の物理スキーマで `UNIQUE(active_lock)` partial index 化（TECH-M-03） |

### UT-09 / UT-04 への引き継ぎ事項（オープン課題 0 件）

- 行ハッシュ + バンドマン固有 ID 戦略の物理スキーマ反映 → UT-04
- Cron 間隔 staging 測定（6h / 1h / 5min）→ TECH-M-02 / UT-09
- partial index の D1 サポート確認 / 代替設計（通常 index + WHERE）→ TECH-M-03 / Phase 4 / UT-04
- `sync_log` 保持期間運用設定 → TECH-M-04 / UT-08
- `sync_log` 論理名と既存 `sync_job_logs` / `sync_locks` の対応固定 → U-7 / UT-09 / UT-04
- sync status / trigger enum 統一 → U-8 / shared 契約
- retry 回数（3 vs 5）と offset resume 採否 → U-9 / UT-09
- shared sync 契約型 / Zod schema 化 → U-10 / packages/shared
- 認証実装（Service Account JSON 等）→ UT-03
- 通知 / 監視統合 → UT-07 / UT-08
- 標準化 error handling → UT-10
- staging E2E → UT-26

## PR 説明テンプレ用サマリ（Phase 13 で再利用）

### 背景

GitHub Issue #50 / 原典 unassigned-task `UT-01-sheets-d1-sync-design.md` で要求されている「Google Sheets を入力源、Cloudflare D1 を canonical store とする同期方式の **設計確定**」を実施した。実装は別タスク（UT-09）で行い、本タスクは設計仕様の凍結に閉じる（docs-only / NON_VISUAL / `workflow_state=spec_created`）。

### 成果物一覧（追加・更新）

- `docs/30-workflows/ut-01-sheets-d1-sync-design/index.md` ・ `artifacts.json`（メタ正本）
- `phase-01.md` 〜 `phase-13.md`（13 ファイルの Phase 別仕様書）
- `outputs/phase-01/main.md`（要件定義 / 苦戦箇所 / 4 条件評価）
- `outputs/phase-02/{sync-method-comparison.md, sync-flow-diagrams.md, sync-log-schema.md}`（設計成果物 3 点）
- `outputs/phase-03/{main.md, alternatives.md}`（PASS 判定 / 代替案 4 件 / リスク R-1〜R-7）
- `outputs/phase-04/test-strategy.md`（設計検証戦略）
- `outputs/phase-05/implementation-runbook.md`（spec walkthrough）
- `outputs/phase-06/failure-cases.md`（異常系）
- `outputs/phase-07/ac-matrix.md`（AC-1〜10 trace）
- `outputs/phase-08/main.md`（DRY 化）
- `outputs/phase-09/{main.md, free-tier-estimation.md}`（QA / 無料枠試算）
- `outputs/phase-10/go-no-go.md`（Go 判定）
- `outputs/phase-11/{main.md, manual-smoke-log.md, link-checklist.md}`（NON_VISUAL 縮約 3 点）
- `outputs/phase-12/{main.md, implementation-guide.md, system-spec-update-summary.md, documentation-changelog.md, unassigned-task-detection.md, skill-feedback-report.md, phase12-task-spec-compliance-check.md}`（必須 7 点）

### AC 充足

- AC-1（同期方式比較表）/ AC-2（3 種フロー図）/ AC-3（エラーハンドリング）/ AC-4（`sync_log` 論理スキーマ）/ AC-5（SoT 優先順位）/ AC-6（quota 対処）/ AC-7（冪等性）/ AC-8（代替案 3 件以上）/ AC-9（UT-09 着手可能）/ AC-10（メタ整合）すべて GREEN（`outputs/phase-07/ac-matrix.md` / `outputs/phase-10/go-no-go.md` で確定）。

### 採択方式 B 案の要旨

代替案 4 件（A: push / Apps Script webhook、**B: pull / Cloudflare Workers Cron Triggers**、C: hybrid（webhook + cron fallback、即時性 SLA がある場合）、D: 将来オプション hybrid v2）の比較で **B を採択**。理由は (1) 無料枠完結（Cloudflare Cron Triggers / D1 / Sheets API すべて無料枠内）、(2) 不変条件 #5 整合（D1 アクセスは `apps/api` に閉じる）、(3) 冪等性確保が `sync_log` + `processed_offset` + `idempotency_key` で単純、(4) バックフィルが同一フローで再利用可能、(5) Sheets API quota との相性が良い（500 req/100s をバッチサイズ 100 で抑制）の 5 点。A は CPU バースト超過と quota 衝突で MAJOR 却下、C は MVP 早期に過剰、D は MINOR（TECH-M-01）として追跡。

### 引き継ぎ事項

- 実装: UT-09（Cron sync job）/ UT-04（D1 物理スキーマ）/ UT-03（Sheets API 認証）
- 監視: UT-08（`sync_log` 保持期間 / failed entry 通知）
- 標準化: UT-10（error handling フォーマライズ）
- staging E2E: UT-26
- 未タスク候補（U-1〜U-10）: `outputs/phase-12/unassigned-task-detection.md` を参照

### 重要な不変条件

- `workflow_state = spec_created` を Phase 12 close-out 後も据え置く（`completed` に書き換えない）
- 実装完了は UT-09 / UT-04 が担う
- `apps/api` / `apps/web` ランタイムコードへの変更なし
- `.claude` ↔ `.agents` mirror parity 維持（`diff -qr` 出力 0 行）
