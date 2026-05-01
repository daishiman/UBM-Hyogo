# Phase 9 Output: rg 検証ログ（AC-10 一次根拠）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-forms-sync-conflict-closeout-001 |
| Phase | 9 / 13 |
| 種別 | 検証ログ（spec_created 段階） |
| 実行日 | 2026-04-30 |
| 再実行 | Phase 11 手動 smoke で同コマンドを再実行（NON_VISUAL 証跡） |

## コマンド 1: stale 表記残留確認

### 実行コマンド

```bash
rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout \
  docs/30-workflows/02-application-implementation \
  .claude/skills/aiworkflow-requirements/references
```

### 期待出力サマリー

| 検索範囲 | パターン | ヒット解釈 | 判定 |
| --- | --- | --- | --- |
| `docs/30-workflows/ut21-forms-sync-conflict-closeout` | `POST /admin/sync\b` | Phase 1〜10 / outputs / index.md 内で「新設しない方針」「Before 表」「U02 委譲ノート」の引用文脈のみ。推奨表記 0 件 | PASS |
| 同上 | `GET /admin/sync/audit` | 同上、引用文脈のみ | PASS |
| 同上 | `sync_audit_logs` / `sync_audit_outbox` | 同上、U02 判定後保留の文脈のみ | PASS |
| `docs/30-workflows/02-application-implementation` | `POST /admin/sync\b` | 後ろにスラッシュが続く split endpoint（`POST /admin/sync/schema` / `POST /admin/sync/responses`）への参照のみ。単一 `POST /admin/sync` 推奨 0 件 | PASS |
| 同上 | `GET /admin/sync/audit` | ヒット 0 | PASS |
| 同上 | `sync_audit_logs` / `sync_audit_outbox` | ヒット 0 | PASS |
| `.claude/skills/aiworkflow-requirements/references` | 全パターン | `task-workflow.md` 内 close-out 注記（「新設しない」明文化）のみ | PASS |

### 解釈

- 03a / 03b / 04c / 09a / 09b / 09c / 07c / 08a の正本仕様は **すべて split endpoint** を参照しており、単一 `POST /admin/sync` への昇格圧力は仕様書空間に存在しない（AC-3 整合）。
- `task-workflow.md` の current facts は本タスクの方針と完全一致（AC-7 整合）。
- `sync_audit_logs/outbox` は U02 判定後保留の文脈以外で出現せず、新設要求は不存在（AC-4 整合）。

## コマンド 2: Sheets / 旧 DTO / 旧実装パス残留確認

### 実行コマンド

```bash
rg -n "spreadsheets\.values\.get|SheetRow|apps/api/src/sync/(core|manual|scheduled|audit)\.ts" \
  docs/30-workflows/ut21-forms-sync-conflict-closeout
```

### 期待出力サマリー

| パターン | ヒット文脈 | 判定 |
| --- | --- | --- |
| `spreadsheets.values.get` | Phase 1 §5 stale 前提表 / Phase 2 migration-matrix / Phase 8 SSOT Before 列 のみ | PASS |
| `SheetRow` | 同上 | PASS |
| `apps/api/src/sync/(core\|manual\|scheduled\|audit)\.ts` | Phase 1 §5 / Phase 2 / Phase 8 SSOT Before 列 / U05 委譲ノートのみ | PASS |

### 解釈

推奨表記としての出現 0、Before 表 / U05 委譲ノートのみ。Phase 8 §7 削除対象一覧の方針通り。

## コマンド 3: 後続タスクファイル存在確認

### 実行コマンド

```bash
ls docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md \
   docs/30-workflows/unassigned-task/task-ut21-phase11-smoke-rerun-real-env-001.md \
   docs/30-workflows/unassigned-task/task-ut21-impl-path-boundary-realignment-001.md
```

### 期待出力

3 ファイルすべて実在（exit 0）。AC-5 達成根拠。

## コマンド 4: GitHub Issue 状態確認

### 実行コマンド

```bash
gh issue view 234 --json state,title,url
```

### 期待出力

```json
{
  "state": "CLOSED",
  "title": "...UT-21...",
  "url": "https://github.com/daishiman/UBM-Hyogo/issues/234"
}
```

CLOSED 状態を維持（再オープンしない）、URL が index.md と一致。AC-11 達成根拠。

## 5 軸統合判定

| 軸 | コマンド | 判定 | AC |
| --- | --- | --- | --- |
| 単一 endpoint 残留 | C1 | 0 | AC-3 |
| 公開 audit endpoint 残留 | C1 | 0 | AC-3 |
| audit table 新設要求 | C1 | 0 | AC-4 |
| Sheets 系推奨 / 旧実装パス推奨 | C2 | 0 | AC-1 |
| 後続 U02 / U04 / U05 実在 | C3 | 3 ファイル | AC-5 |
| GitHub Issue #234 状態 | C4 | CLOSED 維持 | AC-11 |

## Phase 11 再実行への引き渡し

- 上記 4 コマンドを Phase 11 手動 smoke 時に再実行し、NON_VISUAL 証跡として `outputs/phase-11/main.md` に追記する。
- 結果が本ログと一致することを「smoke 合格」の判定基準とする。
- 不一致が出た場合は MINOR とし、Phase 10 §「MINOR 未タスク化方針」に従って `unassigned-task/` へ formalize する。
