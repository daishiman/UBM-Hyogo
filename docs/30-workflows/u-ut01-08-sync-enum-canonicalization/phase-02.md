# Phase 2: 設計（canonical set 決定）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 (U-UT01-08) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計（canonical set 決定） |
| 作成日 | 2026-04-30 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（設計レビューゲート） |
| 状態 | spec_created |
| タスク分類 | docs-only（契約決定の文書化のみ。コード変更なし） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で確定した「4 層が同一値ドメインを参照する契約固定」要件を、(1) `status` / `trigger_type` の canonical set 決定 / (2) 既存値 → canonical 値マッピング表 / (3) shared 配置決定 / (4) 既存実装書き換え対象範囲リスト の 4 成果物に分解し、Phase 3 のレビューが代替案比較で結論を出せる粒度の設計入力を作成する。実 migration や UI 文言更新は対象外（UT-04 / UT-09 / 別タスクへ委譲）。

## 設計判断（base case）

### 判断 1: `status` canonical set = 5 値（推奨）

| canonical 値 | 意味 | 終端性 |
| --- | --- | --- |
| `pending` | ジョブ受領済 / 未着手 | 非終端 |
| `in_progress` | 実行中（lock 取得済） | 非終端 |
| `completed` | 正常終了 | 終端 |
| `failed` | 異常終了（例外 / リトライ枯渇） | 終端 |
| `skipped` | 実行回避（前段 lock 競合 / 抑制条件成立） | 終端 |

**採択理由**:
- UT-01 論理 4 値（`pending` / `in_progress` / `completed` / `failed`）に、既存実装の `skipped` を独立 5 値目として昇格させる。
- `skipped` を `completed + skipReason` 列に畳み込む案（後述代替案 S-2）は、集計クエリで「正常終了率」を算出するときに `WHERE status='completed' AND skipReason IS NULL` という条件を全箇所で要求し、漏れによるメトリクス汚染リスクが大きい。
- 「ライフサイクル軸（pending → in_progress → 終端）」と「終端 3 種（成功 / 失敗 / 回避）」を直交させた設計とすることで、状態遷移図と集計軸の両方が一意に読める。

### 判断 2: `trigger_type` canonical set = 3 値（推奨）+ `triggered_by` 別カラム

| canonical 値 | 意味（how 軸 = 起動方式） |
| --- | --- |
| `manual` | 手動起動（API / 管理画面 / CLI 由来） |
| `cron` | スケジュール起動（Workers Cron） |
| `backfill` | 過去データ再同期起動 |

**採択理由**:
- `admin` は「誰が起動したか（who 軸 / actor）」由来の命名で、`manual` / `cron` / `backfill`（how 軸 / mechanism）と意味論が直交しない。混在させると後発機能（cron からの ad-hoc 再実行など）追加で再衝突する。
- canonical は **how 軸**に揃え、actor 情報は別カラム `triggered_by`（TEXT NULL / 例: `'admin'` / `'system'` / `'service-account:cron-runner'`）で表現する。これにより不変条件 #4（admin-managed data はフォーム外として分離）にも整合する。

### 判断 3: shared 配置 = `types` + `zod` 併設

- `packages/shared/src/types/sync.ts`: TypeScript 型 union リテラル（コンパイル時保証）
- `packages/shared/src/zod/sync.ts`: Zod schema（ランタイム検証 / API ハンドラ・migration runner で使用）
- 両者は同一 canonical set を参照（Zod schema を source とし、`z.infer` で TS 型を導出する形を推奨）。
- 実装コミットは U-UT01-10 の責務。本タスクは **配置先と型シグネチャ案**までで停止。U-UT01-10 と統合する判断は Phase 3 ゲートで最終確定（基本方針: 統合ではなく分離 = 本タスクで配置のみ確定し、実装は U-UT01-10 がコミット）。

### 判断 4: 既存実装書き換え対象範囲

下流 UT-04 / UT-09 がそのまま着手できる粒度のリストを作成する（行番号は概略レンジ。Phase 2 実行時に Read で確定）。

| ファイル | 推定行範囲 | 変更種別 |
| --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `'running'` 書き込み箇所（推定 1 箇所） | リテラル置換 → `'in_progress'` |
| 同上 | `'success'` 書き込み箇所（推定 1 箇所） | リテラル置換 → `'completed'` |
| 同上 | `'skipped'` 書き込み箇所（推定 1〜2 箇所） | 維持（canonical 5 値目に昇格） |
| 同上 | `trigger_type: 'admin'` 書き込み箇所（推定 1 箇所） | `'manual'` + `triggered_by: 'admin'` の 2 列書き込みに分解 |
| `apps/api/migrations/0002_sync_logs_locks.sql` | `status` カラム定義 | CHECK (status IN ('pending','in_progress','completed','failed','skipped')) を新 migration で追加 |
| 同上 | `trigger_type` カラム定義 | CHECK (trigger_type IN ('manual','cron','backfill')) を新 migration で追加 |
| 同上 | （新規） `triggered_by` カラム | 新 migration で `ALTER TABLE sync_job_logs ADD COLUMN triggered_by TEXT` を追加 |

> 実 migration ファイル作成は **UT-04 / UT-09** で実施。本タスクは「変換 UPDATE → CHECK 追加 → ALTER TABLE」の 2〜3 段階順序を仕様で固定するのみ。

## 既存値 → canonical 値マッピング表

### `status`

| 既存値 | canonical 値 | 変換 UPDATE 疑似 SQL（実行は UT-04 で） |
| --- | --- | --- |
| `running` | `in_progress` | `UPDATE sync_job_logs SET status='in_progress' WHERE status='running';` |
| `success` | `completed` | `UPDATE sync_job_logs SET status='completed' WHERE status='success';` |
| `skipped` | `skipped` | （変換不要 / canonical 採用） |
| `failed` | `failed` | （変換不要 / canonical 採用） |
| （新規）`pending` | `pending` | （新規追加。ジョブ受領のみで lock 未取得の場合に使用） |

### `trigger_type`

| 既存値 | canonical 値 | `triggered_by` 補足 | 変換 UPDATE 疑似 SQL |
| --- | --- | --- | --- |
| `admin` | `manual` | `'admin'` | `UPDATE sync_job_logs SET trigger_type='manual', triggered_by='admin' WHERE trigger_type='admin';` |
| `cron` | `cron` | `'system'` or NULL | （変換不要） |
| `backfill` | `backfill` | （NULL or admin actor） | （変換不要） |

> 上記 SQL は **疑似 SQL**。実適用は UT-04 / UT-09 の migration ファイルで CHECK 句追加より **前** に実行する 2 段階構成とする。

## Schema / 共有コード Ownership 宣言

| 物理位置 | ownership | reader | writer |
| --- | --- | --- | --- |
| `packages/shared/src/types/sync.ts`（新規・本タスクで配置案を提示） | U-UT01-10（実装コミット） | apps/api / apps/web 双方 | U-UT01-10 のみ |
| `packages/shared/src/zod/sync.ts`（新規・本タスクで配置案を提示） | U-UT01-10（実装コミット） | apps/api（migration runner / API handler） | U-UT01-10 のみ |
| `apps/api/migrations/*.sql`（CHECK 追加 / 変換 UPDATE / triggered_by 列追加） | UT-04（schema 担当） | UT-09 / UT-21 | UT-04 のみ（後続変更は別 migration） |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | UT-09 | - | UT-09 のみ（本タスク決定の値リテラルに合わせて書き換え） |
| `outputs/phase-02/canonical-set-decision.md` | U-UT01-08 本タスク | UT-04 / UT-09 / U-UT01-10 | U-UT01-08 のみ |
| `outputs/phase-02/value-mapping-table.md` | U-UT01-08 本タスク | UT-04（migration 起草時） | U-UT01-08 のみ |
| `outputs/phase-02/shared-placement-decision.md` | U-UT01-08 本タスク | U-UT01-10 | U-UT01-08 のみ |

## 仕様語 ↔ 実装語対応表（07a feedback 由来）

仕様書での canonical 表記と実装側の TypeScript / SQL 表記の対応を固定し、ドキュメント間 drift を防ぐ。

| 仕様語（本タスク内） | TS 型（U-UT01-10 で実装） | SQL リテラル（UT-04 で migration） | UI 表示語（別タスク委譲） |
| --- | --- | --- | --- |
| status: pending | `'pending'` | `'pending'` | 「受領済」 |
| status: in_progress | `'in_progress'` | `'in_progress'` | 「実行中」 |
| status: completed | `'completed'` | `'completed'` | 「完了」 |
| status: failed | `'failed'` | `'failed'` | 「失敗」 |
| status: skipped | `'skipped'` | `'skipped'` | 「スキップ」 |
| trigger_type: manual | `'manual'` | `'manual'` | 「手動」 |
| trigger_type: cron | `'cron'` | `'cron'` | 「定期」 |
| trigger_type: backfill | `'backfill'` | `'backfill'` | 「再同期」 |
| triggered_by: admin（actor） | `string \| null` | TEXT NULL | 表示時 actor 名で展開 |

UI 表示語は本タスクの責務外（参考情報）。i18n リソースは別タスクで実装する。

## 実行タスク

1. `outputs/phase-02/canonical-set-decision.md` を作成し、status 5 値 / trigger_type 3 値 / `triggered_by` 別カラム化方針を採択理由付きで記述する（完了条件: 5 値 + 3 値 + 別カラム化が表で確定し、代替案比較が最低 2 案ずつ含まれる）。
2. `outputs/phase-02/value-mapping-table.md` を作成し、既存値 → canonical 値マッピング表（status / trigger 両方）と変換 UPDATE 疑似 SQL を記述する（完了条件: 既存実装の全リテラルが網羅され、漏れがないことが grep で確認できる）。
3. `outputs/phase-02/shared-placement-decision.md` を作成し、`packages/shared/src/types/sync.ts` + `packages/shared/src/zod/sync.ts` 併設方針と U-UT01-10 との統合 / 分離判断を記述する（完了条件: 配置 2 ファイルの責務分離 + U-UT01-10 への引き渡し範囲が明示）。
4. 既存実装書き換え対象範囲リストを `canonical-set-decision.md` 末尾に表形式で添付する（完了条件: ファイルパス + 推定行範囲 + 変更種別が UT-04 / UT-09 がそのまま着手できる粒度で列挙）。
5. Schema / 共有コード Ownership 宣言を `canonical-set-decision.md` に含める（Phase 1 テンプレ必須項目）。
6. 仕様語 ↔ 実装語対応表を `canonical-set-decision.md` に含める（07a feedback 由来）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-01.md | 真の論点 / 苦戦箇所 5 件 / 既存差分前提表 |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-08-sync-enum-canonicalization.md | 起票元仕様（背景 / リスク / AC） |
| 必須 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md §2, §9 | UT-01 論理 enum 定義 / 既存実装対応表 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 既存値リテラル抽出（Read のみ） |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 既存物理スキーマ（Read のみ） |
| 参考 | packages/shared/src/types/ / packages/shared/src/zod/ | 配置判断比較 |
| 参考 | docs/30-workflows/unassigned-task/U-UT01-10-* | shared 契約型 / Zod schema 化の責務範囲 |

## 完了条件チェックリスト

- [ ] `status` canonical set 5 値が `canonical-set-decision.md` に表で確定（代替案 2 案以上の比較付き）
- [ ] `trigger_type` canonical set 3 値が確定し、`admin` の `triggered_by` 別カラム化方針が記述
- [ ] 既存値 → canonical 値マッピング表（status / trigger）が `value-mapping-table.md` に変換 UPDATE 疑似 SQL 付きで存在
- [ ] shared 配置（types + zod 併設 / U-UT01-10 分離方針）が `shared-placement-decision.md` に記述
- [ ] 既存実装書き換え対象範囲リスト（ファイル + 推定行範囲 + 変更種別）が UT-04 / UT-09 着手可能粒度
- [ ] Schema / 共有コード Ownership 宣言が含まれる
- [ ] 仕様語 ↔ 実装語対応表が含まれる
- [ ] 不変条件 #4（admin-managed data 分離）/ #5（D1 アクセスは apps/api 限定）への影響方針が明示

## 多角的チェック観点

- **代替案網羅**: status は 4 値案（`skipped` 畳み込み） / 5 値案 / 6 値案（`canceled` 追加）の最低 2 案以上比較。trigger は who 軸維持案 / how 軸統一案の比較。
- **不変条件 #4**: `triggered_by` 別カラム化が admin metadata 分離原則に沿うこと。
- **不変条件 #5**: shared パッケージは型 / Zod のみ。`apps/web` から D1 binding を直接参照させない設計。
- **直交性**: U-UT01-07（テーブル名）/ U-UT01-09（retry/offset カラム）/ U-UT01-10（shared 実装）の決定事項を侵食しないこと。
- **2 段階 migration 順序**: 変換 UPDATE → CHECK 追加 → ALTER TABLE の順序が文書で固定されていること。
- **grep 漏れ防止**: `apps/api` 内の `'running'` / `'success'` / `'admin'` 全リテラル箇所が書き換え対象リストに列挙されていること。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | `canonical-set-decision.md` 起草 | 2 | pending | status 5 値 / trigger 3 値 / Ownership / 仕様語表 |
| 2 | `value-mapping-table.md` 起草 | 2 | pending | 変換 UPDATE 疑似 SQL 含む |
| 3 | `shared-placement-decision.md` 起草 | 2 | pending | types + zod 併設 / U-UT01-10 分離 |
| 4 | 既存実装書き換え対象範囲リスト確定 | 2 | pending | ファイル + 行範囲 + 変更種別 |
| 5 | 代替案比較（status 4 値 / 6 値 / trigger who 軸） | 2 | pending | Phase 3 入力 |
| 6 | 不変条件 #4 / #5 への影響方針記述 | 2 | pending | admin-managed / D1 境界 |
| 7 | 直交性チェック（U-UT01-07/09/10） | 2 | pending | 責務侵食ゼロ |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/canonical-set-decision.md | status 5 値 / trigger 3 値 / 採択理由 / Ownership / 仕様語対応表 / 既存実装書き換え対象範囲リスト |
| ドキュメント | outputs/phase-02/value-mapping-table.md | 既存値 → canonical 値マッピング + 変換 UPDATE 疑似 SQL |
| ドキュメント | outputs/phase-02/shared-placement-decision.md | shared 配置判断 + U-UT01-10 との統合 / 分離方針 |
| メタ | artifacts.json | Phase 2 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（6 件）が `spec_created` へ遷移
- 全成果物 3 ファイルが `outputs/phase-02/` 配下に配置済み
- 既存値 grep に対する漏れがゼロ（`'running'` / `'success'` / `'skipped'` / `'admin'` / `'cron'` / `'backfill'` / `'failed'` 全網羅）
- 不変条件 #4 / #5 を侵さない設計
- artifacts.json の `phases[1].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 3（設計レビューゲート）
- 引き継ぎ事項:
  - status 5 値 base case + 代替案 2 案以上
  - trigger 3 値 + `triggered_by` 別カラム化 base case + who 軸維持代替案
  - 既存値 → canonical 値マッピング表（変換 UPDATE 疑似 SQL 含む）
  - shared 配置（types + zod 併設）+ U-UT01-10 分離方針
  - 既存実装書き換え対象範囲リスト（UT-04 / UT-09 入力）
  - 不変条件 #4 / #5 への影響方針
- ブロック条件:
  - 代替案比較が 2 案未満
  - マッピング表に既存値漏れ
  - shared 配置と U-UT01-10 の責務境界が曖昧
  - 既存実装書き換え対象範囲が UT-04 / UT-09 着手不可粒度
