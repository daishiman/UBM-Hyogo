# U-UT01-08: sync 状態 enum / trigger enum の統一タスク

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-UT01-08 |
| タスク名 | sync 状態 enum / trigger enum の canonical 統一 |
| 親タスク | UT-01（Sheets→D1 同期方式定義） |
| 関連タスク | UT-09（同期ジョブ実装） / UT-04（D1 物理スキーマ） / U-UT01-07（命名整合: `sync_log` 論理名 vs `sync_job_logs` / `sync_locks`） / U-UT01-09（retry 回数 / offset resume 統一） / U-UT01-10（shared sync 契約型 / Zod schema 化） |
| 優先度 | HIGH |
| 状態 | unassigned |
| 起票日 | 2026-04-29 |
| visualEvidence | NON_VISUAL |
| taskType | docs-only-contract |
| 既存タスク組み込み | 未定（shared 契約 = U-UT01-10、または UT-09 仕様追補のいずれかに統合する判断を本タスクで実施） |
| 検出元 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` U-8 |

## 目的

UT-01 論理設計と既存実装（UT-09 系）に存在する `status` / `trigger_type` enum 差分を、shared 契約レベルで canonical set として確定し、後続の DB 制約・集計クエリ・UI ラベル・監査クエリが同一の値ドメインを参照できる状態を作る。本タスクは契約決定までを担い、実 migration / UI 文言更新は対象外とする。

## 背景（差分の現状）

| 軸 | UT-01 論理設計 | 既存実装（apps/api） | 出典 |
| --- | --- | --- | --- |
| `status` | `pending` / `in_progress` / `completed` / `failed` | `running` / `success` / `failed` / `skipped` | `outputs/phase-02/sync-log-schema.md` §2、`apps/api/migrations/0002_sync_logs_locks.sql`、`apps/api/src/jobs/sync-sheets-to-d1.ts` |
| `trigger_type` | `manual` / `cron` / `backfill` | `admin` / `cron` / `backfill` | 同上 |
| 物理テーブル | 概念名 `sync_log`（13 カラム） | `sync_job_logs` + `sync_locks` | 同上、§9 既存実装との対応表 |

差分を放置すると DB 制約（CHECK 句）/ 集計クエリ / 監視ダッシュボード / UI ラベル / Zod schema が個別に値ドメインを定義し、サイレントなドリフトが累積する。

## スコープ

### 含む
- `status` canonical set の決定（4 値以上 / `skipped` の扱い / `pending` と `in_progress` の分離可否）
- `trigger_type` canonical set の決定（`manual` 採用 vs `admin` 維持 vs 別名追加）
- 既存値 → canonical 値のマッピング表（migration 適用時の SQL 変換クエリ案を文章で記述。実行は対象外）
- `packages/shared/src/types` 配下に置くか、`packages/shared/src/zod` に Zod schema を配置するかの配置判断
- 既存実装書き換え範囲のリスト（`apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` / 関連クエリの行番号レベル特定）
- UT-09 / UT-04 / U-UT01-07 / U-UT01-09 / U-UT01-10 との直交関係明記

### 含まない
- 実 migration ファイルの作成・適用（→ UT-04 / UT-09 で実施）
- UI ラベル文言の更新・i18n リソース変更（→ UT-08 監視ダッシュボード or 別タスク）
- shared 契約型の Zod 実装コミット（→ U-UT01-10 と統合判断後に該当タスクで実施）
- 監視アラート閾値の改訂（→ U-UT01-04 と連動）

## 苦戦箇所【記入必須】

enum 差分は「単なる文字列の違い」に見えて、実際には DB 制約 / 集計クエリ / UI 表示の **3 層すべて** に静かに波及するため、後で発覚すると修正コストが指数的に膨らむ。具体的な事故シナリオ:

1. **DB 制約層**: `0002_sync_logs_locks.sql` には `CHECK (status IN (...))` が現状ない。canonical set を決めずに後段で CHECK を追加すると、既存 `running|success|skipped` の行が一斉に制約違反となり、migration が production で `SQLITE_CONSTRAINT` を返す。`pending|in_progress|completed|failed` を canonical 採用する場合、`running → in_progress` / `success → completed` / `skipped → ?` の変換 UPDATE を **CHECK 追加より先に** 流す必要がある。`skipped` は仕様 4 値に存在しないため、独立 5 値目に昇格させるか `completed + skipReason` に畳み込むかの判断が前提となる。
2. **集計クエリ層**: 監視ダッシュボード（UT-08）と Phase 9/11 の参照クエリが `status='success'` をハードコードしている可能性が高い。canonical を `completed` に切ると、何も警告なく「成功件数 = 0」のメトリクスが出続け、アラートが沈黙する。grep-and-replace 漏れが SLO 計測を歪める。
3. **UI ラベル層**: 管理画面の status バッジは「running」「success」を文字列マッチで色分けしている可能性がある。canonical 切替時に UI 側の switch 文を同期しないと、未知 enum が default 分岐に落ちて灰色バッジで沈黙表示される。
4. **trigger 差分の特殊性**: `admin` は「管理者が UI から押した」というアクター由来の命名、`manual` は「自動 vs 手動」という起動方式由来の命名。canonical を決める際、**意味論の軸（who か how か）** を先に揃えないと、別の機能（例: cron からの ad-hoc 起動）追加時に再度命名衝突する。
5. **shared 配置の罠**: `packages/shared/src/zod` に置く場合、API / Web の両方が依存するため、enum 拡張時に両 worker のビルドが同時に再ビルドされる。`packages/shared/src/types` の純型定義に留めると DB driver 側で値検証が漏れる。両方を併設する判断（型 = 静的、Zod = ランタイム検証）が必要。

## リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| canonical 切替時に既存 `sync_job_logs` の値が制約違反になる | production migration 失敗 | 変換 UPDATE → CHECK 追加の 2 段階 migration を仕様書で明示（実装は UT-04 / UT-09） |
| `skipped` を canonical 4 値に含めない決定をすると既存ログが消える | 監査証跡欠損 | `skipped` を 5 値目に昇格 or `completed` 内の `skipReason` フィールド昇格、いずれかを本タスクで決定し対応表に固定 |
| `manual` vs `admin` の意味論が混在 | 後発機能で再衝突 | who 軸（actor）と how 軸（mechanism）を分離し、canonical は「起動方式」軸（`manual` / `cron` / `backfill`）に揃える方針を提示。actor 情報が必要なら別カラム `triggered_by` を新設提案 |
| shared 配置を未決のまま UT-09 が実装着手 | drift 再発 | 本タスクの AC で配置先を確定し、U-UT01-10 と統合 or 分離を明記 |
| 既存 `DEFAULT_MAX_RETRIES=5` / offset 不在 と enum 統一が連動して肥大化 | スコープクリープ | retry / offset は U-UT01-09 の責務として切り離し、本タスクは enum のみに限定 |

## 検証方法

- **既存値抽出 grep**: `apps/api/src/jobs/sync-sheets-to-d1.ts` と `apps/api/migrations/0002_sync_logs_locks.sql` を Read / Grep で走査し、現行値リテラル（`'running' | 'success' | 'failed' | 'skipped' | 'admin' | 'cron' | 'backfill'`）の出現箇所を列挙する。
- **型テスト案（記述のみ）**: shared に置いた canonical 型に対する exhaustive switch / `satisfies` チェックの型テスト雛形を仕様書に提示する（実装は U-UT01-10）。
- **migration 変換戦略の table-driven 記述**: 「現行値 → canonical 値 → 変換 UPDATE 文（疑似 SQL）」の 3 列表を作り、レビュー時に値の漏れがないことを目視確認できる形にする。
- **直交性チェック**: 本タスクで決定した canonical が U-UT01-07（命名整合）/ U-UT01-09（retry/offset）/ U-UT01-10（shared 契約型）の決定事項を侵食していないことを、各タスクの「含まない」セクションと突き合わせる。

## 受入条件（AC）

- [ ] AC-1: `status` の canonical set が 1 つに確定し、推奨案として `pending` / `in_progress` / `completed` / `failed` / `skipped`（5 値、`skipped` は終端状態）が文書化されている。代替案を採る場合は採択理由が明記されている。
- [ ] AC-2: `trigger_type` の canonical set が 1 つに確定し、推奨案として `manual` / `cron` / `backfill` が文書化されている。`admin` は actor 情報を別カラム化することで意味論を分離する方針が明記されている。
- [ ] AC-3: 既存値 → canonical 値の **マッピング表** が成果物に存在し、`running → in_progress` / `success → completed` / `skipped → skipped` / `admin → manual`（+ `triggered_by='admin'` 補足）等の変換が網羅されている。
- [ ] AC-4: shared 型定義の **配置先**（`packages/shared/src/types/sync.ts` 案 + `packages/shared/src/zod/sync.ts` 案）が決定され、U-UT01-10 と統合するか分離するかの判断が記載されている。
- [ ] AC-5: 既存実装書き換え **対象範囲**（ファイルパス + 行番号レンジ + 変更種別）がリストアップされ、UT-09 / UT-04 がそのまま着手できる粒度になっている。
- [ ] AC-6: 関連タスク（U-UT01-07 / U-UT01-09 / U-UT01-10）との **直交関係** が記述され、本タスクが他タスクの責務を侵食していないことが確認できる。

## 直交関係（関連タスクとの責務分離）

| タスク | 担当範囲 | 本タスクとの境界 |
| --- | --- | --- |
| U-UT01-07（命名整合） | 論理名 `sync_log` と物理名 `sync_job_logs` / `sync_locks` の対応表確定 | テーブル名は対象外。本タスクは **値ドメイン** のみ扱う |
| U-UT01-09（retry / offset 統一） | `DEFAULT_MAX_RETRIES` の正本値、`processed_offset` カラム採否 | カラム構造・回数は対象外。本タスクは **enum 値** のみ |
| U-UT01-10（shared 契約型 / Zod schema 化） | shared パッケージへの実装コミット | 本タスクは **配置判断 + 型シグネチャ案** までで停止。実装コミットは U-UT01-10 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md` | 親タスク（模倣元） |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md` §2, §9 | 論理設計の enum 定義と既存実装対応表 |
| 必須 | `docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md` U-8 | 検出根拠 |
| 必須 | `apps/api/src/jobs/sync-sheets-to-d1.ts` | 既存実装の status / trigger 値リテラル |
| 必須 | `apps/api/migrations/0002_sync_logs_locks.sql` | 既存物理スキーマの enum 候補 |
| 参考 | `packages/shared/src/types/` / `packages/shared/src/zod/` | 配置判断の比較対象 |
| 参考 | `.claude/skills/task-specification-creator/SKILL.md` docs-only 縮約テンプレ | 本仕様書フォーマット定義 |

## 注意事項

- 本タスクは **コード変更なし / コミット禁止**。決定はすべて文書化のみで完結する。
- 実 migration / UI 文言更新は本タスクのスコープ外（UT-04 / UT-09 / 別タスクへ委譲）。
- U-UT01-10（shared 契約型化）と統合する判断を採る場合は、本タスクの AC-4 で明記し、独立タスクとしては close する。
