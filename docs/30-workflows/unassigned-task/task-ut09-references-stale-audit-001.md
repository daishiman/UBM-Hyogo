# aiworkflow-requirements references stale audit + Sheets 系記述撤回 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-ut09-references-stale-audit-001 |
| タスク名 | aiworkflow-requirements references stale audit + Sheets 系記述撤回 |
| 分類 | 検証 / 仕様更新 |
| 対象機能 | Forms/Sheets to D1 sync |
| 優先度 | 中（次 wave 内） |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | UT-09 Phase 12 unassigned-task-detection（B-05） |
| 発見日 | 2026-04-29 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-ut09-direction-reconciliation-001` の Phase 12 review（30 種思考法）で、UT-09 の採用方針は **A 維持（現行 Forms 分割方針へ寄せる）** に確定した。

しかし、採用方針 A を「何も更新しない」と誤解すると、`.claude/skills/aiworkflow-requirements/references/` 内に Sheets 系の **current 風記述**（現行の正式仕様かのように見える表現）が残り続ける。後続タスク（03a / 03b / 04c / 09b）がこれらを正契約として参照してしまうリスクがある。

### 1.2 問題点・課題

Phase 12 の system-spec-update-summary（Step 2: A 維持時の stale 撤回発火条件）は、以下のファイルに Sheets 系 stale contract が残存している可能性を示している。

| ファイル | stale 候補記述 |
| --- | --- |
| `references/api-endpoints.md` | `POST /admin/sync` の説明が「Google Sheets 由来の既存同期ジョブ」と current 風に記述 |
| `references/database-schema.md` | `sync_locks` / `sync_job_logs` テーブルが current 風に登録されている可能性 |
| `references/deployment-cloudflare.md` | Sheets 系 cron schedule / runtime mount が current 風に記述されている可能性 |
| `references/environment-variables.md` | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` が current 風に記述されている可能性 |
| `indexes/topic-map.md` | Sheets 系キーワードが積極的に参照される形で残存している可能性 |

実際に `references/api-endpoints.md` の 69 行目には「Google Sheets 由来の既存同期ジョブを手動実行」という記述が確認されており、これは Forms 分割方針（`/admin/sync/schema` / `/admin/sync/responses` の 2 endpoint 体制）と矛盾する **stale な current 風記述**である。

### 1.3 放置した場合の影響

- 後続タスク（03a / 03b / 04c / 09b）が stale な Sheets 系 contract を正本として参照し、設計判断を誤る
- `POST /admin/sync`（Sheets 単一 endpoint）と `POST /admin/sync/schema` / `POST /admin/sync/responses`（Forms 分割体制）の二重正本状態が references レベルで温存される
- `pnpm indexes:rebuild` 後も stale キーワードが topic-map に残り、後続タスクのナビゲーションを汚染する

---

## 2. 何を達成するか（What）

### 2.1 目的

`aiworkflow-requirements/references/` 内に残存する Sheets 系 stale 記述を洗い出し、A 維持の注記または撤回文言に更新することで、後続タスクが誤った contract を参照しない状態を作る。

### 2.2 最終ゴール

以下の検証コマンドが **0 件** を返す状態を達成する。

```bash
pnpm indexes:rebuild

rg -n "GOOGLE_SHEETS_SA_JSON|/admin/sync\b|sync_locks|sync_job_logs" \
  .claude/skills/aiworkflow-requirements/references
```

ただし、`/admin/sync/schema` および `/admin/sync/responses` は Forms 分割方針の正式 endpoint であるため、これらは **撤回対象外**とする。`/admin/sync\b`（`/admin/sync` で終端する表現）のみが stale 撤回対象。

### 2.3 スコープ

#### 含むもの

- `references/api-endpoints.md` の `POST /admin/sync`「Google Sheets 由来」記述を A 維持注記または撤回文言へ更新
- `references/database-schema.md` に `sync_locks` / `sync_job_logs` が current 風に残存する場合、A 維持注記または撤回文言へ更新
- `references/deployment-cloudflare.md` に Sheets 系 cron / runtime mount が current 風に残存する場合、A 維持注記または撤回文言へ更新
- `references/environment-variables.md` に `GOOGLE_SHEETS_SA_JSON` が current 風に残存する場合、A 維持注記または撤回文言へ更新
- `indexes/topic-map.md` に Sheets 系キーワードが積極的参照形式で残存する場合、A 維持注記または撤回文言へ更新
- `pnpm indexes:rebuild` の実行と検証

#### 含まないもの

- `apps/api/src/jobs/sync-sheets-to-d1.ts` 系のコード削除（`task-ut09-sheets-impl-withdrawal-001` の担当）
- Cloudflare Secret（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）の実削除（`task-ut09-sheets-secrets-withdrawal-001` の担当）
- D1 migration `sync_locks` / `sync_job_logs` の down 実行（`task-ut09-sheets-migration-withdrawal-001` の担当）
- commit / push / PR 作成
- staging 実機 smoke（UT-26 で扱う）

### 2.4 成果物

- 各 references ファイルの stale 記述を A 維持注記または撤回文言へ更新した差分
- 検証コマンド `rg` の実行結果（0 件確認）
- `pnpm indexes:rebuild` 実行後の topic-map 更新確認

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-ut09-direction-reconciliation-001` の Phase 12 完了（base case = 案 a 確定）
- `task-sync-forms-d1-legacy-umbrella-001` の current 方針（Forms 分割体制）を読む
- 対象 references 5 ファイルを Read ツールで読む

### 3.2 依存タスク

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-ut09-direction-reconciliation-001 | 採用方針 A 確定が前提 |
| 上流 | task-sync-forms-d1-legacy-umbrella-001 | 正本の current 方針（Forms 分割体制）の根拠 |
| 並列 | task-ut09-sheets-impl-withdrawal-001 | コード削除（本タスクは docs 撤回のみ） |
| 並列 | task-ut09-sheets-migration-withdrawal-001 | migration down（本タスクは docs 撤回のみ） |
| 並列 | task-ut09-sheets-secrets-withdrawal-001 | Secret 削除（本タスクは docs 撤回のみ） |
| 下流 | UT-26 staging-deploy-smoke | 採用後の実機 smoke 証跡 |

### 3.3 必要な知識

- A 維持（Forms 分割体制）と B 採用（Sheets 単一体制）の差異
- `POST /admin/sync` と `POST /admin/sync/schema` / `POST /admin/sync/responses` の責務差
- `aiworkflow-requirements` references の更新ルール（current 風記述 vs 撤回注記の使い分け）
- `pnpm indexes:rebuild` の動作（`.claude/skills/aiworkflow-requirements/indexes/` を再生成）

### 3.4 推奨アプローチ

Step 1: 全対象ファイルを Read し、stale 記述箇所を一覧化する。
Step 2: stale 記述を以下のどちらかに更新する。

| ケース | 推奨表現 |
| --- | --- |
| 記述が Sheets 単一体制のみを指す（Forms 体制と共存不可） | `> [UT-09 direction-reconciliation] 採用方針 A 維持により撤回。Forms 分割体制（/admin/sync/schema / /admin/sync/responses）を正本とする。` |
| 記述が Sheets / Forms 両体制で共通利用できる可能性がある | A 維持の注記を付記し、`SYNC_ADMIN_TOKEN` Bearer 等の共通 Secret は維持する |

Step 3: `pnpm indexes:rebuild` を実行し、topic-map に stale キーワードが残らないことを確認する。
Step 4: 検証コマンドを実行し、0 件であることを確認する。

---

## 4. 実行手順

### Phase 1: stale 記述の洗い出し

1. 対象 5 ファイルを Read する。
   - `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`
   - `.claude/skills/aiworkflow-requirements/references/database-schema.md`
   - `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
   - `.claude/skills/aiworkflow-requirements/references/environment-variables.md`
   - `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`
2. 以下の grep を実行し、stale 候補を全件リストアップする。
   ```bash
   rg -n "GOOGLE_SHEETS_SA_JSON|/admin/sync\b|sync_locks|sync_job_logs" \
     .claude/skills/aiworkflow-requirements/references \
     .claude/skills/aiworkflow-requirements/indexes
   ```
3. 結果を「撤回対象 / 注記対象 / 維持」の 3 区分に分類する。

### Phase 2: stale 撤回 / 注記の適用

1. `references/api-endpoints.md` の `POST /admin/sync`「Google Sheets 由来」記述を撤回注記へ更新する。
   - `/admin/sync/schema` / `/admin/sync/responses` は Forms 分割体制の正式 endpoint であるため **変更しない**。
2. `references/database-schema.md` に `sync_locks` / `sync_job_logs` が current 風に残存する場合、A 維持の撤回注記へ更新する。
3. `references/deployment-cloudflare.md` に Sheets 系 cron / runtime mount が current 風に残存する場合、A 維持の撤回注記へ更新する。
4. `references/environment-variables.md` に `GOOGLE_SHEETS_SA_JSON` が current 風に残存する場合、A 維持の撤回注記へ更新する。
5. `indexes/topic-map.md` に Sheets 系キーワードが積極的参照形式で残存する場合、A 維持の注記を付記する。

### Phase 3: 検証

1. `pnpm indexes:rebuild` を実行する。
   ```bash
   mise exec -- pnpm indexes:rebuild
   ```
2. stale 撤回の検証コマンドを実行し、0 件を確認する。
   ```bash
   rg -n "GOOGLE_SHEETS_SA_JSON|/admin/sync\b|sync_locks|sync_job_logs" \
     .claude/skills/aiworkflow-requirements/references
   ```
3. `rg` が 0 件でない場合、残存箇所を再確認し Step 2 へ戻る。
4. `indexes/topic-map.md` を Read し、撤回注記が正しく反映されていることを目視確認する。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `POST /admin/sync`「Google Sheets 由来」記述が撤回注記または A 維持注記へ更新されている
- [ ] `sync_locks` / `sync_job_logs` が current 風に references に残存していない（存在する場合は撤回注記付き）
- [ ] `GOOGLE_SHEETS_SA_JSON` が current 風に references に残存していない（存在する場合は撤回注記付き）
- [ ] Sheets 系 cron / runtime mount が current 風に deployment-cloudflare.md に残存していない

### 品質要件

- [ ] `POST /admin/sync/schema` / `POST /admin/sync/responses` は **変更されていない**（Forms 分割体制の正式 endpoint）
- [ ] `SYNC_ADMIN_TOKEN` の記述は共通 Secret として維持されている
- [ ] `pnpm indexes:rebuild` が exit code 0 で完了している
- [ ] 検証コマンドが 0 件を返す

### ドキュメント要件

- [ ] 各ファイルの変更箇所に A 維持の根拠（`[UT-09 direction-reconciliation]` 注記）が明示されている
- [ ] `indexes/topic-map.md` に stale キーワードが積極的参照形式で残存していない

---

## 6. 検証方法

| ケース | 検証内容 | 期待結果 |
| --- | --- | --- |
| stale scan | `rg -n "GOOGLE_SHEETS_SA_JSON\|/admin/sync\b\|sync_locks\|sync_job_logs" .claude/skills/aiworkflow-requirements/references` | 0 件（撤回注記化により current 風表現が消える） |
| Forms 正式 endpoint 維持確認 | `rg -n "/admin/sync/schema\|/admin/sync/responses" .claude/skills/aiworkflow-requirements/references` | 1 件以上（Forms 分割体制の正式 endpoint は維持） |
| indexes rebuild | `pnpm indexes:rebuild` | exit code 0 |
| topic-map 確認 | `indexes/topic-map.md` を Read | Sheets 系積極参照キーワードが stale 撤回注記付きで整理されている |

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| A 維持を「何も更新しない」と誤判定し stale が残る | 高 | 高 | Step 2 に「stale 撤回」分岐を追加し、A 維持でも撤回注記を適用することを明文化 |
| `/admin/sync/schema` / `/admin/sync/responses` を誤って撤回する | 高 | 中 | 検証コマンドに Forms 正式 endpoint の維持確認（`rg -n "/admin/sync/schema"` が 1 件以上）を追加 |
| `pnpm indexes:rebuild` 後に新たな stale キーワードが topic-map に混入 | 中 | 低 | rebuild 後に topic-map を Read して目視確認する |
| Secret 名（`GOOGLE_SHEETS_SA_JSON`）を撤回注記化する際に、共通 Secret（`SYNC_ADMIN_TOKEN`）まで誤って撤回する | 中 | 低 | 撤回対象を `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` に限定し、`SYNC_ADMIN_TOKEN` は Forms / Sheets 共通として維持 |

---

## 8. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md` | 採用方針 A 確定の根拠 |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | Forms 分割体制 current 方針正本 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | stale 撤回対象（`POST /admin/sync` 「Google Sheets 由来」記述） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | stale 撤回対象（`sync_locks` / `sync_job_logs` 確認） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | stale 撤回対象（Sheets 系 cron / runtime mount 確認） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | stale 撤回対象（`GOOGLE_SHEETS_SA_JSON` 確認） |
| 必須 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | stale 撤回対象（Sheets 系積極参照キーワード確認） |
| 参考 | `docs/30-workflows/ut09-direction-reconciliation/phase-12.md` | Task 12-2 Step 2（A 維持時の stale 撤回発火条件）|
| 参考 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | Forms schema sync 正本 |
| 参考 | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | Forms response sync 正本 |

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | 採用方針 A（現行 Forms 分割方針へ寄せる）を「何も更新しない」と誤判定したまま実行すると、references / runtime に Sheets 系の stale 記述が current 風に残存し、後続タスク（03a / 03b / 04c / 09b）が誤った contract を参照してしまう |
| 原因 | direction-reconciliation の「A 維持 = Forms 方針を採用」という結論が、「references の Sheets 記述はそのまま残してよい」という誤解につながりやすい。特に `POST /admin/sync`（Sheets 単一 endpoint）と `POST /admin/sync/schema` / `POST /admin/sync/responses`（Forms 分割 endpoint）は endpoint パスが似ており、混同しやすい |
| 対応 | Phase 2（stale 撤回 / 注記の適用）の冒頭に「Step 2 には stale 撤回分岐がある」という注記を追加し、A 維持でも references の Sheets 系 current 風記述を撤回注記化することを明文化した。また検証コマンドに Forms 正式 endpoint（`/admin/sync/schema` / `/admin/sync/responses`）の維持確認を追加し、誤撤回を防止する |
| 再発防止 | direction-reconciliation 系タスクの実行時に「A 維持 = stale 撤回含む」「B 採用 = 広範囲更新」という 2 分岐を Phase 1 で明示し、A 維持を「何も変更しない」と混同させない設計にする（task-specification-creator skill の改善候補） |

### 作業ログ

- 2026-04-29: UT-09 Phase 12 review にて B-05 として検出。`references/api-endpoints.md` の 69 行目に「Google Sheets 由来の既存同期ジョブを手動実行」という current 風記述が確認された。unassigned-task として formalize。

### 補足事項

- 本タスクは **docs（references）の撤回注記化のみ**であり、コード削除 / Secret 実削除 / migration down は含まない。
- 検証コマンド `rg -n "GOOGLE_SHEETS_SA_JSON|/admin/sync\b|sync_locks|sync_job_logs"` が 0 件になった時点で完了とする。
- `POST /admin/sync/schema` / `POST /admin/sync/responses` は Forms 分割体制の正式 endpoint であるため、rg の正規表現で `/admin/sync\b`（ワード境界）を使い、これらが誤検知されないようにする。
- B 採用（Sheets 単一体制）に将来方針転換する場合、本タスクの撤回注記をすべて正式採用記述に戻す必要がある。その場合は user 承認後の別タスクで広範囲更新する。
