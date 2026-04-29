# UT-21 実装パス境界再整理（`apps/api/src/sync/*` 想定 vs 実構成）

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ut21-impl-path-boundary-realignment-001 |
| タスク名 | UT-21 想定実装パスを現行 `apps/api/src/jobs/*` + `apps/api/src/sync/schema/*` 構成に整合させる |
| 分類 | 仕様精査 / 境界整理 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1（closeout-001 の Phase 1 棚卸しと並走可） |
| 状態 | 未実施 |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | 03a / 03b / 04c / 09b（実装パス記述の整合修正先） |
| 検出元 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` (UT21-U05) |
| 親タスク | `task-ut21-forms-sync-conflict-closeout-001.md` |

---

## 1. 目的

UT-21 仕様および UT-09 由来の旧仕様が想定する `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 構成と、現行 Forms sync 実装の実ファイル構成（`apps/api/src/jobs/sync-forms-responses.ts` および `apps/api/src/sync/schema/*`）の境界差を整理し、03a / 03b / 04c / 09b の各仕様書・runbook の参照パスを実構成に合わせる。

---

## 2. スコープ

### 含むもの

- 「想定パス → 実パス」マッピング表を作成
- 03a / 03b / 04c / 09b の index.md 内 path 参照を確認し、ずれている箇所を列挙
- ずれの修正方針（仕様側を実構成に合わせる）を決定
- 修正適用先の指示を closeout-001 へ反映

### 含まないもの

- 実ファイルの移動・リネーム（実装側を仕様に合わせる方向の変更は不可）
- 新規実装の追加
- commit / PR 作成

---

## 3. 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `task-ut21-forms-sync-conflict-closeout-001.md` | 親 close-out |
| 上流 | 03a / 03b / 04c / 09b の現行 index | 修正対象の仕様書 |
| 上流 | `apps/api/` 実装 | 実構成の正本 |

---

## 4. 想定パス vs 実パス マッピング

| UT-21 / UT-09 想定 | 実構成 | 役割 |
| --- | --- | --- |
| `apps/api/src/sync/core.ts`（pure runSync） | `apps/api/src/jobs/sync-forms-responses.ts` 内の job 関数 | sync コアロジック |
| `apps/api/src/sync/manual.ts`（Hono route） | `apps/api/src/routes/admin/sync/*`（04c で定義） | admin endpoint |
| `apps/api/src/sync/scheduled.ts`（ScheduledController handler） | Workers `scheduled` handler（09b で定義） | Cron Triggers |
| `apps/api/src/sync/audit.ts`（writer + outbox） | `sync_jobs` repository（02c）+ `metrics_json` | 監査台帳書き込み |
| `apps/api/src/sync/types.ts` `SheetRow` | Forms response DTO + `sync_jobs.metrics_json` 契約 | DTO |
| `apps/api/src/sync/sheets-client.ts`（Sheets API JWT） | Forms API client（schema sync 側）+ `apps/api/src/sync/schema/*` | Google API client |
| `apps/api/src/sync/mapper.ts`（COL 定数） | Forms response → D1 row mapper（03b 側） | mapping |

---

## 5. Phase 構成

### Phase 1: 実構成スキャン

```bash
ls apps/api/src/jobs/
ls apps/api/src/sync/schema/
rg -n "apps/api/src/sync/(core|manual|scheduled|audit|types|sheets-client|mapper)" \
  docs/30-workflows/02-application-implementation \
  docs/30-workflows/unassigned-task
```

### Phase 2: 仕様書 path 参照の差分抽出

03a / 03b / 04c / 09b の index.md 内で、上記 stale path を参照している箇所を一覧化。

### Phase 3: 修正方針の決定

- 仕様側を実構成に合わせる（実装側の移動・リネームはしない）
- `apps/api/src/sync/*` 一式の表記は legacy として残し、実構成パスを併記する

### Phase 4: 反映指示

closeout-001 の「移植要件」または各 sub task の "実装パス" 欄へ実構成パスを明記。

---

## 6. 苦戦箇所【記入必須】

### 中学生レベルの説明

- 設計図に書かれていた「ここに置く」場所と、実際にコードを置いた場所が違う
- 設計図を見て探した人が「ここにあるはずなのに無い」と迷子になるので、設計図の方を「実際の場所」に書き換える
- 逆向き（実際のコードを設計図通りに動かす）は混乱が広がるのでやらない

### 技術詳細

| 項目 | 内容 |
| --- | --- |
| 症状 | UT-21 が `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を提案するが、実構成は `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` |
| 原因 1 | UT-21 当初仕様（Sheets API）と現行 Forms sync 実装で responsibility が異なるため、ファイル分割粒度も `core/manual/scheduled/audit` の 4 分割から `jobs/*` + `sync/schema/*` 構成へ変化した |
| 原因 2 | `apps/api/src/sync/sheets-client.ts` 等の Sheets 系ファイルは現行コードに存在しない。仕様書だけ読むと「無いファイルを探す」事故が起きる |
| 修正方向の選択 | 「実装側を仕様に合わせる」を選ぶと、Forms sync 実装を Sheets 仕様の構成へリファクタするため広範囲の壊れにつながる。よって「仕様側を実構成に合わせる」方向のみ採用 |
| 副作用 | UT-21 に紐づく Vitest テスト想定（`runSync` pure function 単体テスト）も `apps/api/src/jobs/*` 配下のテスト想定へ読み替えが必要 |
| 再発防止 | 仕様書に実装パスを書く場合、(a) 実装が main にマージされたタイミングで仕様書 path を grep し直す、(b) 仕様書側のパス記述は relative ではなく実構成 root（`apps/api/src/jobs/...`）から固定で書く |

---

## 7. システム仕様反映メモ

| 領域 | 反映先 | 内容 |
| --- | --- | --- |
| sync 実装本体 | `apps/api/src/jobs/sync-forms-responses.ts` | Forms response sync の正本 |
| schema sync | `apps/api/src/sync/schema/*` | `forms.get` 経由の schema 反映 |
| admin endpoint | 04c で定義する route 配置 | `POST /admin/sync/schema` / `POST /admin/sync/responses` |
| Cron handler | 09b で定義する Workers `scheduled` handler | Cron Triggers エントリ |
| 監査 | `sync_jobs` repository（02c）+ `metrics_json` | `sync_audit_logs` / `sync_audit_outbox` は新設しない（U02 判定後） |
| D1 アクセス境界 | `apps/api` のみ | `apps/web` から D1 直接アクセス禁止 |

---

## 8. 完了条件

- [ ] stale path 参照の grep 結果が記録済み
- [ ] 想定パス → 実パスのマッピング表が完成
- [ ] 03a / 03b / 04c / 09b の path 記述ずれが closeout-001 の移植要件として登録済み
- [ ] 実装側の移動・リネームは行っていない
- [ ] commit / PR は実行しない

---

## 9. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` | 検出原典 |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/implementation-guide.md` | 想定パス記述の元 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md` | 親 close-out |
| 必須 | `apps/api/src/jobs/` | 実構成 |
| 必須 | `apps/api/src/sync/schema/` | 実構成 |
| 必須 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | 実装境界 current facts |
