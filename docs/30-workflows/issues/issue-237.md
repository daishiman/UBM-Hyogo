# [#237] [task-ut21-impl-path-boundary-realignment-001] UT-21 想定実装パスを現行 apps/api/src/jobs/* + apps/api/src/sync/schema/* 構成に整合

## メタ情報

```yaml
issue_number: 237
title: [task-ut21-impl-path-boundary-realignment-001] UT-21 想定実装パスを現行 apps/api/src/jobs/* + apps/api/src/sync/schema/* 構成に整合
state: OPEN
priority: 中
scale: -
category: 要件
status: -
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/237
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | - |
| ステータス | - |

---

## 目的

UT-21 仕様および UT-09 由来の旧仕様が想定する `apps/api/src/sync/{core,manual,scheduled,audit}.ts` 構成と、現行 Forms sync 実装の実ファイル構成（`apps/api/src/jobs/sync-forms-responses.ts` および `apps/api/src/sync/schema/*`）の境界差を整理し、03a / 03b / 04c / 09b の各仕様書・runbook の参照パスを実構成に合わせる。

## スコープ

### 含むもの
- 「想定パス → 実パス」マッピング表を作成
- 03a / 03b / 04c / 09b の index.md 内 path 参照を確認し、ずれている箇所を列挙
- ずれの修正方針（仕様側を実構成に合わせる）を決定
- 修正適用先の指示を closeout-001 へ反映

### 含まないもの
- 実ファイルの移動・リネーム（実装側を仕様に合わせる方向の変更は不可）
- 新規実装の追加
- commit / PR 作成

## 依存関係

| 種別 | 対象 |
| --- | --- |
| 上流 | task-ut21-forms-sync-conflict-closeout-001（親 close-out） |
| 上流 | 03a / 03b / 04c / 09b の現行 index（修正対象仕様書） |
| 上流 | `apps/api/` 実装（実構成正本） |

## 想定パス vs 実パス（抜粋）

| UT-21 / UT-09 想定 | 実構成 |
| --- | --- |
| `apps/api/src/sync/core.ts` | `apps/api/src/jobs/sync-forms-responses.ts` |
| `apps/api/src/sync/manual.ts` | `apps/api/src/routes/admin/sync/*`（04c） |
| `apps/api/src/sync/scheduled.ts` | Workers `scheduled` handler（09b） |
| `apps/api/src/sync/audit.ts` | `sync_jobs` repository（02c）+ `metrics_json` |
| `apps/api/src/sync/sheets-client.ts` | Forms API client + `apps/api/src/sync/schema/*` |

## 苦戦箇所

- **症状**: UT-21 が `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を提案するが、実構成は `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`。
- **原因 1**: UT-21 当初仕様（Sheets API）と現行 Forms sync 実装で responsibility が異なるため、ファイル分割粒度も `core/manual/scheduled/audit` の 4 分割から `jobs/*` + `sync/schema/*` 構成へ変化。
- **原因 2**: `apps/api/src/sync/sheets-client.ts` 等の Sheets 系ファイルは現行コードに存在しない。仕様書だけ読むと「無いファイルを探す」事故が起きる。
- **修正方向の選択**: 「実装側を仕様に合わせる」を選ぶと広範囲の壊れにつながる。よって「仕様側を実構成に合わせる」方向のみ採用。
- **副作用**: UT-21 に紐づく Vitest テスト想定（`runSync` pure function 単体テスト）も `apps/api/src/jobs/*` 配下のテスト想定へ読み替えが必要。
- **再発防止**: 仕様書に実装パスを書く場合、(a) 実装が main マージされたタイミングで仕様書 path を grep し直す、(b) 仕様書側のパス記述は実構成 root から固定で書く。

---

Task spec: [docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md](https://github.com/daishiman/UBM-Hyogo/blob/main/docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md)
