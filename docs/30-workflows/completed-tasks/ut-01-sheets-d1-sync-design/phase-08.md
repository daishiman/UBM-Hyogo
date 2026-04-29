# Phase 8: DRY 化（仕様書内重複の整理）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化（仕様書内重複の整理） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 7（AC マトリクス） |
| 下流 | Phase 9（品質保証） |
| 状態 | spec_created |
| user_approval_required | false |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| workflow_state | spec_created |

## 目的

Phase 1〜7 で作成した本仕様書の各 outputs 配下（`phase-01/main.md` / `phase-02/sync-method-comparison.md` / `phase-02/sync-flow-diagrams.md` / `phase-02/sync-log-schema.md` / `phase-03/main.md` / `phase-03/alternatives.md` / `phase-04` 〜 `phase-07`）に発生した **同期フロー記述・エラーハンドリング方針・冪等性戦略・sync_log カラム定義・quota 対処方針** の重複を、単一正本へ集約し相互参照リンクで冗長を排除する。本仕様書は 13 Phase 構成で同じ概念が複数 Phase に再登場する構造のため、DRY を放置すると UT-09 着手時に「どの版が最新か」を判定できなくなる。

加えて、`.claude/skills/aiworkflow-requirements/references/` 配下の既存正本（`deployment-cloudflare.md` / `database-schema.md` / `architecture-overview-core.md`）と本仕様書の記述が **重複していないか** を検証し、aiworkflow-requirements 側にすでに記述がある内容は **リンクのみに縮約** する（仕様書内に再掲しない）。

本タスクは docs-only / NON_VISUAL のため、refactor 対象は **本仕様書の Markdown テキストと相互参照リンクのみ**。コード・設定ファイル・skill 本体は触らない。

## 入力

- `outputs/phase-01/main.md`（要件 / AC-1〜10）
- `outputs/phase-02/sync-method-comparison.md`（4 方式比較・採択理由・エラーハンドリング 6 項目・quota 対処 5 項目）
- `outputs/phase-02/sync-flow-diagrams.md`（手動 / 定期 / バックフィル 3 種フロー図・ロールバック判断）
- `outputs/phase-02/sync-log-schema.md`（13 カラム論理スキーマ・状態遷移）
- `outputs/phase-03/main.md`（PASS/MINOR/MAJOR 判定・MINOR 追跡 TECH-M-01〜04）
- `outputs/phase-03/alternatives.md`（代替案 4 件比較）
- `outputs/phase-04/test-strategy.md`〜`outputs/phase-07/ac-matrix.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`（D1 / Cron Triggers 既存記述）
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`（隣接スキーマ / sync_log との境界）
- `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md`（apps/api 境界 / data flow）

## DRY 化観点

### 1. 同期フロー記述の重複検出（仕様書内）

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| フロー図の登場箇所 | 手動 / 定期 / バックフィルの 3 種フローが `phase-02/sync-flow-diagrams.md` 以外（`phase-02/sync-method-comparison.md` 採択理由節 / `phase-03/main.md` リスク節 / `phase-05` ランブック / `phase-06` 異常系）に再記述されていないか | 正本は `phase-02/sync-flow-diagrams.md`。他箇所は **「フロー図は phase-02/sync-flow-diagrams.md §X を参照」とリンク化** し、フロー本体（Mermaid 図 / シーケンス）の再掲は禁止 |
| トリガー定義の表記揺れ | `manual` / `cron` / `backfill` の trigger_type 値が複数箇所で不一致（例: `scheduled` と `cron` の混在）になっていないか | `phase-02/sync-log-schema.md` を正本とし、全箇所で `manual` / `cron` / `backfill` の 3 値に統一 |
| Cron スケジュール記述 | `0 */6 * * *`（6h 粒度）の記述が複数箇所で異なる例示（5 分 / 1h / 6h）で書かれていないか | base case を `0 */6 * * *` (6h) と `phase-02/sync-method-comparison.md` で固定し、他箇所は値そのままコピペで参照 |

### 2. エラーハンドリング方針の重複検出（仕様書内）

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| 6 項目の正本 | エラーハンドリング 6 項目（リトライ / quota 超過 / SQLITE_BUSY / 部分失敗 / Dead Letter / 二重実行防止）が `phase-02/sync-method-comparison.md` 以外（`phase-03/main.md` リスク節 / `phase-04/test-strategy.md` / `phase-06/failure-cases.md`）に同内容で再記述されていないか | 正本は `phase-02/sync-method-comparison.md` の §「エラーハンドリング方針」。他は項目名 + 観点のみ列挙し、本文（リトライ回数 / Backoff 値 / 待機時間）は再掲禁止 |
| Backoff 値の一貫性 | 「最大 3 回」「1s → 2s → 4s」「上限 32s」「100s 待機」が一字一句同じ値で書かれているか | 表記揺れ（例: 「3 回」と「最大 3 回」の混在 / 「2 倍」と「Exponential」の混在）を grep で検出し正本表記に統一 |
| 部分失敗の processed_offset 参照 | `processed_offset` カラムへの参照が `phase-02/sync-log-schema.md` の正本定義から逸脱していないか | sync_log カラム名は `phase-02/sync-log-schema.md` のみが正本。他箇所は名称のみ参照し型・制約は再掲禁止 |

### 3. sync_log 13 カラム定義の重複検出（仕様書内）

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| カラム表の正本 | 13 カラム（id / trigger_type / status / started_at / finished_at / processed_offset / total_rows / error_code / error_message / retry_count / created_at）の **型・制約付きフル定義** が `phase-02/sync-log-schema.md` 以外に再掲されていないか | 正本は `phase-02/sync-log-schema.md` のみ。他箇所は「sync_log カラム X / Y を参照」とリンク化 |
| status 値の表記揺れ | `pending` / `in_progress` / `completed` / `failed` の 4 状態が他値（例: `running` / `error` / `done`）と混在していないか | grep で `running` / `error` / `done` を検出し、混在があれば正本 4 値に統一 |

### 4. 冪等性戦略の重複検出（仕様書内）

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| 3 戦略の正本 | 行ハッシュ / バンドマン固有 ID / `INSERT ... ON CONFLICT DO UPDATE` の 3 戦略が `phase-02/sync-method-comparison.md` の §「冪等性担保戦略」以外（`phase-01/main.md` 苦戦箇所 / `phase-03/main.md` リスク R-4 / `phase-04` テスト戦略）に同内容で再記述されていないか | 正本は `phase-02/sync-method-comparison.md`。他は戦略名 + UT-04 / UT-09 引き継ぎの旨のみで本文再掲禁止 |
| UT-04 引き継ぎ表記 | 「UT-04 引き継ぎ事項」という表記が他表記（「UT-04 へ申し送り」「UT-04 で実装」）と混在していないか | 表記を「UT-04 引き継ぎ事項」に統一 |

### 5. Sheets API quota 対処方針の重複検出（仕様書内）

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| 5 項目の正本 | バッチサイズ 100 行 / 並列度 1 / Backoff 1〜32s / quota 超過判定（HTTP 429 / `RESOURCE_EXHAUSTED`）の 5 項目が `phase-02/sync-method-comparison.md` 以外に同内容で再記述されていないか | 正本を `phase-02/sync-method-comparison.md` に固定し、他はリンク化 |
| quota 値の一貫性 | `500 req/100s/project` が他値（例: `300 req/分` / `100 req/100s`）と混在していないか | grep で値を検出し、原典 Sheets API ドキュメント値（500 req/100s/project）に統一 |

### 6. aiworkflow-requirements references との重複検出（外部正本との境界）

| 観点 | チェック内容 | 判定基準 |
| --- | --- | --- |
| Cron Triggers 基本手順 | `deployment-cloudflare.md` に既述の Cron Triggers 設定手順（wrangler.toml `[triggers]` 節 / scheduled handler エントリ）を本仕様書で再掲していないか | 仕様書側は「Cron Triggers の基本構文は `deployment-cloudflare.md §X` を参照」とリンクのみ。手順本体の再掲は禁止 |
| D1 binding / SQLITE_BUSY | `deployment-cloudflare.md` / `database-schema.md` に既述の D1 binding 設定 / SQLITE_BUSY retry 方針を本仕様書で再掲していないか | 仕様書側は方針名のみ参照、手順本体はリンク化 |
| apps/api 境界 | `architecture-overview-core.md` に既述の「apps/api が D1 への唯一のアクセス境界」を本仕様書で長文再掲していないか | 不変条件 #5 として一文 + リンクのみで処理 |

## DRY 戦略

| 戦略 | 適用先 | 期待効果 |
| --- | --- | --- |
| 単一正本（Single Source of Truth） | フロー図 = `phase-02/sync-flow-diagrams.md` / エラーハンドリング・quota = `phase-02/sync-method-comparison.md` / sync_log = `phase-02/sync-log-schema.md` / 代替案比較 = `phase-03/alternatives.md` | UT-09 着手時に「どの版が最新か」の迷いをゼロにする |
| 相互参照リンク | 仕様書内 phase 間 / 仕様書 → aiworkflow-requirements references | 同一内容の再掲を禁止し、grep で正本 1 箇所のみヒットする状態を作る |
| 表記統一 | trigger_type 3 値 / status 4 値 / Backoff 値 / quota 値 / Cron スケジュール | 一字一句一致でないと grep 検出漏れが発生するため、Phase 8 で機械的に揃える |
| 外部正本リンク化 | aiworkflow-requirements references 既述の D1 / Cron Triggers / apps/api 境界 | 本仕様書を「同期方式設計に固有の判断のみ」に純化し、汎用基盤記述は外部正本に委譲 |

## TECH-M-DRY-01 として記録

| 項目 | 内容 |
| --- | --- |
| ID | TECH-M-DRY-01 |
| 種別 | MINOR（DRY 違反の構造化解消） |
| 内容 | 本仕様書 13 Phase 構成で同概念（フロー図 / エラーハンドリング / sync_log / 冪等性 / quota）が複数 Phase に再登場する構造のため、Phase 8 で正本集約 + リンク化 + 表記統一により恒久解消する |
| 戻り先 | Phase 2（設計）— 重複が残存する場合は設計段階の章立てを見直し |
| 完了条件 | 本 Phase 8 main.md に重複削除前後の before/after diff と正本所在マップが記録されている |

## 実行タスク

1. 入力ファイル（仕様書 outputs 配下 + aiworkflow-requirements references 3 件）を全文読み、観点 1〜6 の重複箇所を抽出する
2. 重複箇所を **正本所在マップ表**（ファイルパス × セクション × 観点 × 正本指定）として `outputs/phase-08/main.md` に記録する
3. 正本以外の箇所を相互参照リンクへ縮約する before/after を `outputs/phase-08/before-after.md` に記載する
4. 表記揺れ（trigger_type 3 値 / status 4 値 / Backoff 値 / quota 値 / Cron スケジュール `0 */6 * * *`）を grep で全文検索し、揺れがある場合は正本表記に統一する
5. aiworkflow-requirements references との重複を検証し、外部正本に委譲できる箇所をリンク化する（観点 6）
6. TECH-M-DRY-01 として MINOR 追跡テーブル（`outputs/phase-03/main.md`）に追記する
7. 重複削除後の AC-1〜AC-10 が全件 GREEN を維持していることを `outputs/phase-07/ac-matrix.md` と照合する

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `outputs/phase-02/sync-method-comparison.md` |
| 必須 | `outputs/phase-02/sync-flow-diagrams.md` |
| 必須 | `outputs/phase-02/sync-log-schema.md` |
| 必須 | `outputs/phase-03/main.md` |
| 必須 | `outputs/phase-03/alternatives.md` |
| 必須 | `outputs/phase-07/ac-matrix.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` |
| 必須 | `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-08.md`（フォーマット模倣元） |

## 依存Phase明示

- Phase 1 成果物（要件 / AC-1〜10）を参照する
- Phase 2 成果物（設計 3 点）を主入力とする
- Phase 3 成果物（MINOR 追跡）に TECH-M-DRY-01 を追記する
- Phase 7 成果物（AC マトリクス）で GREEN 維持を確認する

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-08/main.md` | 重複検出結果 / 正本所在マップ / DRY 適用結果 / 表記統一ログ / aiworkflow-requirements 境界整理 / TECH-M-DRY-01 記録 / AC GREEN 維持確認 |
| `outputs/phase-08/before-after.md` | 重複削除前後の before/after diff（観点 1〜6 ごとに、削除前テキストと相互参照リンク後テキストを併記） |

`outputs/phase-08/main.md` および `outputs/phase-08/before-after.md` は本 Phase 実行時に記入する。期待される章立ては以下：

### `outputs/phase-08/main.md` 期待章立て

1. メタ情報（タスク名 / Phase / visualEvidence=NON_VISUAL / taskType=docs-only）
2. 入力ファイル一覧と精読ログ
3. 重複検出結果（観点 1〜6 ごとの一覧表）
4. 正本所在マップ（ファイル × セクション × 観点 × 正本指定）
5. 表記揺れ grep 結果（trigger_type / status / Backoff / quota / Cron）と統一後表記
6. aiworkflow-requirements references との境界整理（リンク化対象一覧）
7. TECH-M-DRY-01 記録（Phase 3 MINOR 追跡テーブルへの追記内容）
8. AC GREEN 維持確認（Phase 7 マトリクス再照合結果）
9. 次 Phase（Phase 9 品質保証）への引き継ぎ事項

### `outputs/phase-08/before-after.md` 期待章立て

1. 観点 1: 同期フロー記述 — before / after
2. 観点 2: エラーハンドリング 6 項目 — before / after
3. 観点 3: sync_log 13 カラム定義 — before / after
4. 観点 4: 冪等性 3 戦略 — before / after
5. 観点 5: Sheets API quota 5 項目 — before / after
6. 観点 6: aiworkflow-requirements 既存記述との境界 — before / after
7. 表記統一 grep ログ（揺れ検出 → 統一適用）

各章は「実行時に記入」プレースホルダで開始し、実行時に before（削除前テキスト引用）と after（リンク縮約後テキスト）を併記する。

## 完了条件 (DoD)

- [ ] 観点 1〜6 すべてについて重複検出結果が `main.md` に記録済み
- [ ] 正本所在マップ（ファイル × セクション × 観点 × 正本指定）が表形式で記載済み
- [ ] `before-after.md` に観点 1〜6 ごとの before/after diff が記載済み
- [ ] 表記揺れ（trigger_type / status / Backoff / quota / Cron）が grep で 0 件
- [ ] aiworkflow-requirements references 既述内容の再掲が 0 件
- [ ] TECH-M-DRY-01 が Phase 3 MINOR 追跡テーブルに追記済み
- [ ] AC-1〜AC-10 が全件 GREEN を維持

## 苦戦箇所・注意

- **過剰 DRY の罠**: 短いセクション（5 行未満）まで集約すると Phase 9 / Phase 11 を実行する際に正本ファイルへの往復が増える。明示性優先で重複を許容する判断は `main.md` に理由付きで記録する
- **相互参照リンクの解像度**: `§X` 表記でセクション番号を引用すると、後続 Phase で正本ファイルが改版された場合にリンク切れが発生する。本タスクではセクション **見出しテキスト** を引用ターゲットとし、見出し変更を検知できるようにする
- **aiworkflow-requirements 越境**: 外部正本にリンク化する際、aiworkflow-requirements 側の見出しが将来変わる可能性がある。Phase 9 / Phase 11 で `verify-indexes-up-to-date` CI gate との整合を再確認する義務を残す
- **MINOR 流し**: TECH-M-DRY-01 を Phase 12 unassigned-task-detection で再確認する責務を Phase 8 の段階で文書化しておく
- **設計タスクの自己完結性破綻**: DRY 化で外部正本リンクが増えすぎると AC-9（UT-09 が本仕様書のみで着手可能）に反する。外部リンク化は **基盤・汎用記述のみ**、UT-01 固有判断（採択方式 / quota 値 / sync_log カラム）は仕様書内に残す

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する
- [ ] 成果物パス 2 点と `artifacts.json` の outputs（`outputs/phase-08/main.md`）の整合を確認する。`before-after.md` は補助成果物として `main.md` から参照リンクで紐付ける
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計タスクであり、アプリケーション統合テストは追加しない
- 統合検証は Phase 9 品質保証（`pnpm typecheck` / `pnpm lint` / mirror parity / 行数規約）と Phase 11 縮約テンプレ smoke / `artifacts.json` 整合で代替する

## 次 Phase

- 次: Phase 9（品質保証 / typecheck / lint / mirror diff / 行数規約 / 無料枠見積もり）
- 引き継ぎ: 正本所在マップ / before/after diff / TECH-M-DRY-01 / AC GREEN 維持確認 / 外部正本リンク化箇所一覧
