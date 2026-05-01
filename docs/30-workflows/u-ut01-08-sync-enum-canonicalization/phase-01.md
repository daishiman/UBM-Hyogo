# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-30 |
| Wave | 1 |
| 実行種別 | parallel（U-UT01-07 / U-UT01-09 / U-UT01-10 と並列着手可能） |
| 前 Phase | なし |
| 次 Phase | 2（設計 - canonical set 決定） |
| 状態 | spec_created |
| タスク分類 | docs-only（契約決定の文書化のみ。コード変更なし） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #262（CLOSED 維持・参照のみ） |
| 親タスク | UT-01（Issue #50 CLOSED） |

## 目的

UT-01 論理設計と既存実装（apps/api）の `status` / `trigger_type` enum の差分を整理し、Phase 2 で canonical set を一意に確定できる入力（真の論点 / 4 大苦戦箇所 / 依存境界 / AC）を作成する。本 Phase は決定そのものを行わず、Phase 2 の判断が一意に絞れる粒度まで論点と制約を文書化することに徹する。

## 真の論点 (true issue)

「enum 文字列を直すこと」ではない。本タスクの本質は **(1) DB 制約層 (CHECK 句) / (2) 集計クエリ層 (status='success' 等のリテラル比較) / (3) UI ラベル層 (バッジ表示) / (4) 監査・トリガ意味論 (who 軸 vs how 軸) の 4 層が、同一の値ドメイン（canonical set）を参照している状態を契約として固定すること** にある。

この契約が決まらないまま UT-04（物理 DDL）/ UT-09（同期ジョブ実装）が先行すると、各層が独自に値を採用しサイレントなドリフトが累積する（例: production の集計クエリは `status='success'` を見続ける一方、新規実装は `completed` を書き出す → メトリクスが沈黙する）。

## visualEvidence の確定

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| visualEvidence | NON_VISUAL | 成果物は契約定義の Markdown のみ。UI スクリーンショット・実装画面なし |
| 成果物の物理形態 | テキスト（Markdown） | `outputs/phase-01/main.md` ほか |
| 検証方法 | 既存値 grep（Read のみ）/ 表形式レビュー / 直交性突合 | 実 migration 適用は対象外（UT-04 / UT-09 へ委譲） |

artifacts.json の `metadata.visualEvidence` は `NON_VISUAL` で固定済み。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | UT-01（Sheets→D1 同期方式定義 / Issue #50 CLOSED） | `outputs/phase-02/sync-log-schema.md` §2, §9 の論理 enum 定義 | 論理側 canonical 候補 4 値 + `skipped` の取り扱い論点 |
| 並列 | U-UT01-07（命名整合: 論理 `sync_log` ↔ 物理 `sync_job_logs` / `sync_locks`） | テーブル名対応表 | 値ドメインのみを扱い、テーブル名は対象外（責務分離） |
| 並列 | U-UT01-09（retry / offset 統一） | `DEFAULT_MAX_RETRIES` の正本値方針 | カラム構造・回数ではなく enum 値のみを扱う |
| 並列 | U-UT01-10（shared 契約型 / Zod schema 化） | `packages/shared/src/types` / `src/zod` 規約 | 配置判断 + 型シグネチャ案までで停止し、実装は U-UT01-10 |
| 下流 | UT-04（D1 物理スキーマ） | canonical set + 変換 UPDATE 戦略 | CHECK 句に組み込む値リスト + 2 段階 migration 方針 |
| 下流 | UT-09（同期ジョブ実装） | canonical set + 既存実装書き換え対象範囲リスト | `apps/api/src/jobs/sync-sheets-to-d1.ts` の値リテラル置換指針 |

## 既存差分の前提（Phase 2 入力）

| 軸 | UT-01 論理設計 | 既存実装（apps/api） | 出典 |
| --- | --- | --- | --- |
| `status` | `pending` / `in_progress` / `completed` / `failed`（4 値） | `running` / `success` / `failed` / `skipped`（4 値、`skipped` は仕様外） | UT-01 phase-02/sync-log-schema.md §2、`apps/api/src/jobs/sync-sheets-to-d1.ts`、`apps/api/migrations/0002_sync_logs_locks.sql` |
| `trigger_type` | `manual` / `cron` / `backfill`（3 値） | `admin` / `cron` / `backfill`（actor 軸の `admin` 混入） | 同上 |
| 物理テーブル | 概念名 `sync_log`（13 カラム） | `sync_job_logs` + `sync_locks` 分離 | 同上 §9 |

## 苦戦箇所【記入必須】

enum 差分は単なる文字列の違いではなく、4 層に静かに波及する構造問題である。Phase 2 がいずれかを見落とした場合に発生する事故シナリオを 5 件明示する。

1. **DB 制約層の二段階 migration 必要性**: `0002_sync_logs_locks.sql` には現状 `CHECK (status IN (...))` がない。canonical set を決めずに後段で CHECK を追加すると、既存 `running` / `success` / `skipped` 行が一斉に `SQLITE_CONSTRAINT` を返し production migration が失敗する。`変換 UPDATE → CHECK 追加` の 2 段階を仕様で明示する必要がある。
2. **集計クエリ層のサイレント沈黙**: 監視ダッシュボード（UT-08 系）と Phase 9/11 の参照クエリが `status='success'` をハードコードしている可能性が高い。canonical を `completed` に切ると警告ゼロで「成功件数 = 0」が出続け、SLO アラートが沈黙する。Phase 2 で grep 対象範囲を明文化する。
3. **UI ラベル層の灰色バッジ事故**: 管理画面の status バッジが `running` / `success` を文字列マッチで色分けしている場合、未知 enum が default 分岐に落ちて灰色バッジで沈黙表示される。本タスクは UI 文言更新は対象外だが、書き換え対象範囲リストには「UI 側の影響あり / 別タスク委譲」を明記する必要がある。
4. **trigger 軸の意味論ねじれ**: `admin` は「誰が押したか（actor / who 軸）」由来、`manual` は「自動 vs 手動（mechanism / how 軸）」由来。canonical を決める前に意味論の軸を統一しないと、後発機能（cron からの ad-hoc 起動など）追加時に再衝突する。who 情報は別カラム `triggered_by` に分離する設計を Phase 2 で確定する。
5. **shared 配置のビルド波及 / 検証漏れトレードオフ**: `packages/shared/src/zod` のみに置くと API / Web 両 worker のビルド連動コストが上がる。`packages/shared/src/types` のみに置くと DB driver 側の値検証が漏れる。型 = 静的 / Zod = ランタイム検証の **併設** 判断を Phase 2 で明示し、U-UT01-10 との統合範囲を切り分ける必要がある。

## 価値とコスト

- 価値: UT-04 / UT-09 が canonical set に基づきコードを書ける状態を最小コスト（docs only）で提供。サイレント drift による production 障害（migration 失敗 / 集計沈黙）を未然に防止。
- コスト: 文書化のみ。Phase 2-3 の検討時間が主コスト。実コードに触らないため revert コストはゼロ。
- 機会コスト: 本タスクを skip して UT-04 / UT-09 が先行すると、CHECK 句修正・grep 全件置換・既存ログ行の一括 UPDATE が production 障害ハンドリングと同時に発生する。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 4 層（DB / 集計 / UI / 監査）が単一値ドメインを参照する状態を最小コストで実現。後続 UT-04 / UT-09 のリスクが線形化される |
| 実現性 | PASS | Read / Grep による既存値抽出と Markdown 表記述のみで完結。CLI / migration 実行は不要 |
| 整合性 | PASS | 不変条件 #4（admin-managed data 分離 → `triggered_by` 別カラム化）/ #5（D1 アクセスは apps/api 限定 → shared には型のみ）に沿う設計が可能 |
| 運用性 | PASS | 起票仕様（`unassigned-task/U-UT01-08-...md`）と index.md の AC が完全一致する設計を本 Phase で固定するため、Phase 2 以降の判断ブレがなくなる |

## 受入条件（AC）

index.md と完全一致。

- [ ] AC-1: `status` canonical set 確定（推奨 5 値: `pending` / `in_progress` / `completed` / `failed` / `skipped`）
- [ ] AC-2: `trigger_type` canonical set 確定（推奨 3 値: `manual` / `cron` / `backfill`）+ `admin` の `triggered_by` 別カラム分離方針
- [ ] AC-3: 既存値 → canonical 値マッピング表（変換 UPDATE 疑似 SQL を含む）
- [ ] AC-4: shared 配置先決定（types only / Zod 併設 / U-UT01-10 統合 or 分離）
- [ ] AC-5: 既存実装書き換え対象範囲リスト（ファイル + 行番号 + 変更種別）
- [ ] AC-6: U-UT01-07 / U-UT01-09 / U-UT01-10 との直交関係明記
- [ ] AC-7: 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- [ ] AC-8: Phase 12 で 7 必須成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check / main）を確認

## 完了条件チェックリスト

- [ ] artifacts.json.metadata.visualEvidence が `NON_VISUAL` で固定確認済み
- [ ] 真の論点が「enum 文字列直し」ではなく「4 層が同一値ドメインを参照する契約固定」に再定義されている
- [ ] 4 条件評価が全 PASS で根拠付き
- [ ] 依存境界表に上流 1 / 並列 3 / 下流 2 すべて前提と出力付きで記述
- [ ] 既存差分の前提表（status / trigger / 物理テーブル）が出典付きで記述
- [ ] 苦戦箇所 5 件（DB 制約 / 集計クエリ / UI ラベル / trigger 意味論 / shared 配置）が明示
- [ ] AC-1〜AC-8 が index.md と完全一致
- [ ] 不変条件 #4 / #5 への影響方針が示されている

## 実行手順

### ステップ 1: 起票仕様の写経確認

- `docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md` を Read し、背景差分表 / スコープ含む含まない / リスク表 / AC を本 Phase 文書と齟齬がないか確認する。
- 齟齬があれば本 Phase 仕様を起票仕様に合わせる（起票仕様が source of truth）。

### ステップ 2: 既存値リテラル grep 範囲の確定

- `apps/api/src/jobs/sync-sheets-to-d1.ts` と `apps/api/migrations/0002_sync_logs_locks.sql` を Read 対象として固定。
- Phase 2 でこの 2 ファイルから `'running'` / `'success'` / `'skipped'` / `'admin'` / `'cron'` / `'backfill'` / `'failed'` の出現箇所を行番号付きで抽出する旨を引き継ぐ。

### ステップ 3: 4 層責務の言語化

- DB 制約層 / 集計クエリ層 / UI ラベル層 / 監査トリガ層の 4 層を `outputs/phase-01/main.md` で図表化し、Phase 2 の判断軸を一意化する。

### ステップ 4: 4 条件と AC のロック

- 4 条件すべて PASS で固定されていることを確認。
- AC-1〜AC-8 を index.md と完全一致で `outputs/phase-01/main.md` に列挙。

## 多角的チェック観点

- 不変条件 #4: `admin` を canonical から外し `triggered_by` 別カラム化することで、admin-managed metadata がフォーム外として独立分離される設計になっているか。
- 不変条件 #5: shared パッケージは型 / Zod のみ。D1 binding 参照を web 側に漏らさない方針が維持されているか。
- 直交性: 本 Phase が U-UT01-07（テーブル名）/ U-UT01-09（retry/offset カラム）/ U-UT01-10（shared 実装コミット）の責務を侵食していないか。
- 起票仕様一致: 起票元 `unassigned-task/U-UT01-08-...md` の AC / リスク / スコープと一字一句の論理矛盾がないか。
- ドキュメントオンリー性: コード変更や migration 実行を要求する記述が混入していないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | visualEvidence = NON_VISUAL の確定 | 1 | pending | artifacts.json と同期 |
| 2 | 真の論点を「4 層同期契約固定」に再定義 | 1 | pending | main.md 冒頭 |
| 3 | 依存境界（上流 1 / 並列 3 / 下流 2）の固定 | 1 | pending | UT-04 / UT-09 への引き渡し interface |
| 4 | 既存差分前提表の固定（status / trigger / table） | 1 | pending | 出典付き |
| 5 | 苦戦箇所 5 件の言語化 | 1 | pending | DB / 集計 / UI / trigger / shared |
| 6 | 4 条件 PASS 根拠の固定 | 1 | pending | 全件 PASS |
| 7 | AC-1〜AC-8 の確定 | 1 | pending | index.md と完全一致 |
| 8 | 不変条件 #4 / #5 への影響方針記述 | 1 | pending | admin-managed data / D1 境界 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（真の論点 / 依存境界 / 苦戦箇所 / 4 条件評価 / AC） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created` へ遷移
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 5 件すべてが Phase 2 の決定論点に対応している
- artifacts.json の `phases[0].status` が `spec_created`
- artifacts.json の `metadata.visualEvidence` が `NON_VISUAL`
- 起票仕様 `unassigned-task/U-UT01-08-sync-enum-canonicalization.md` と AC / 背景 / スコープが一致

## 次 Phase への引き渡し

- 次 Phase: 2（設計 - canonical set 決定）
- 引き継ぎ事項:
  - 真の論点 = 4 層（DB / 集計 / UI / 監査）が単一値ドメインを参照する契約固定
  - 既存差分前提表（status / trigger / 物理テーブル）
  - 苦戦箇所 5 件（DB 制約 / 集計クエリ / UI ラベル / trigger 意味論 / shared 配置）
  - 既存値 grep 対象 2 ファイル（`apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql`）
  - 不変条件 #4 / #5 を満たす設計上の制約
- ブロック条件:
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-8 が index.md と乖離
  - visualEvidence が NON_VISUAL 以外で誤確定
  - 起票仕様との論理矛盾
