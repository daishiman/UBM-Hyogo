# Phase 8: リファクタリング

> 実装区分: **実装仕様書**
> Source issue: [#266](https://github.com/daishiman/UBM-Hyogo/issues/266)
> Phase 5: [`phase-5-implementation.md`](./phase-5-implementation.md)

---

## 1. リファクタリング方針

Phase 5 で「shared 由来 import + 文字列リテラル置換 + `lockTriggerOf` 削除」を実施済み。Phase 8 ではそれを **構造的に固定** するために、以下を確認・最適化する。

| # | 項目 | 対応 |
|---|------|------|
| R1 | shared 経由 import への一斉置換 | 完了確認（grep） |
| R2 | `apps/api/src/**` の deep import 禁止確認 | grep（`@ubm-hyogo/shared/zod/sync-log` 等のサブパス import が無いこと） |
| R3 | ESLint rule 追加検討 | 本 PR では追加せず、後続 task に分離（記録のみ） |
| R4 | コメント・docstring の canonical 値統一 | 旧記述（`manual` / `scheduled`）の clean-up |

---

## 2. R1: shared 経由 import への一斉置換

### 2.1 確認 grep

```bash
# apps/api/src/sync/ 配下で SyncTrigger / SyncLogStatus / SyncTriggerType の import が shared 由来かを確認
grep -rn 'SyncTrigger\|SyncLogStatus\|AuditStatus' apps/api/src/

# 期待:
# - apps/api/src/sync/types.ts : @ubm-hyogo/shared から import
# - その他: ./types または ../sync/types 経由（types.ts re-export 経由）
```

### 2.2 違反パターン

| パターン | 修正 |
|---------|------|
| `apps/api` 配下のファイルが `"cron" \| "admin" \| "backfill"` を独立 literal 宣言 | shared `SyncTriggerType` import に置換 |
| `apps/api` 配下のファイルが `"running" \| "success" \| ...` を独立 literal 宣言 | shared `SyncLogStatus` import に置換 |

Phase 5 §10 で `sync-sheets-to-d1.ts` を統合済みのため、`grep -rn '"cron" | "admin" | "backfill"' apps/api/src/` は 0 件想定。

---

## 3. R2: deep import 禁止確認

### 3.1 grep gate

```bash
# 期待: 0 件（全 import は @ubm-hyogo/shared ルート経由）
grep -rn '@ubm-hyogo/shared/zod/sync-log\|@ubm-hyogo/shared/src/' apps/api/src/
grep -rn '@ubm-hyogo/shared/zod/sync-log\|@ubm-hyogo/shared/src/' apps/web/src/
```

### 3.2 違反時の修正

```diff
-import { SyncLogStatusZ } from "@ubm-hyogo/shared/zod/sync-log";
+import { SyncLogStatusZ } from "@ubm-hyogo/shared";
```

shared package の `exports` field がルート単独の場合、deep import は build エラーとなる。typecheck で自然に検出される。

---

## 4. R3: ESLint rule 追加検討（本 PR では追加しない）

### 4.1 候補 rule

```jsonc
// .eslintrc 候補（後続 lint 強化 task）
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["@ubm-hyogo/shared/zod/*", "@ubm-hyogo/shared/src/*"],
          "message": "Use @ubm-hyogo/shared root import instead (issue #266)"
        }
      ]
    }],
    "no-restricted-syntax": ["error", {
      "selector": "TSTypeAliasDeclaration[id.name=/^(SyncTrigger|SyncLogStatus|AuditStatus)$/]",
      "message": "Use SyncTriggerType / SyncLogStatus from @ubm-hyogo/shared (issue #266)"
    }]
  }
}
```

### 4.2 本 PR で追加しない理由

- ESLint config 変更は影響範囲が monorepo 全体に及び、本タスクの SRP（shared schema 化）を超える
- 既存 grep gate + typecheck で同等の構造的封じ込めが成立する
- 追加は別 issue「sync 契約の lint 強化」として起票候補（Phase 12 §6 で記録）

---

## 5. R4: コメント・docstring の clean-up

### 5.1 対象

| ファイル | 旧記述 | 新記述 |
|---------|-------|-------|
| `apps/api/src/sync/audit.ts` 冒頭 | `trigger 値は manual / scheduled / backfill。互換用に外部 'admin' を受けたら manual に正規化。` | `trigger 値は shared canonical = cron / admin / backfill（物理 DDL 一致）。issue-266 で旧 TS 値 manual / scheduled を物理に揃え、lockTriggerOf 変換を廃止した。` |
| `apps/api/src/sync/scheduled.ts` 冒頭 | `cursor = sync_job_logs から trigger_type IN (manual, scheduled, admin, cron) で` | `cursor = sync_job_logs から trigger_type IN (cron, admin, backfill) で` |
| `apps/api/src/sync/types.ts` 冒頭 | `SyncTrigger は契約論理名 (manual / scheduled / backfill)` | `SyncTrigger / AuditStatus は @ubm-hyogo/shared canonical を参照` |

Phase 5 で実装済みのため、Phase 8 では grep で残存を確認するのみ。

### 5.2 grep 確認

```bash
grep -rn 'manual\|scheduled' apps/api/src/sync/*.ts \
  --include='*.ts' \
  --exclude='*.spec.ts' \
  | grep -v '/\*' | grep -v '\* ' | grep -v '// '
# 期待: 0 件（コメント・spec を除く runtime 経路）
```

> `manual.ts` というファイル名自体は `runManualSync` API 名を保持するため不変。grep 結果に `manual.ts` のファイル path が出てきても誤検知として除外する。

---

## 6. 後続 task に分離する項目（YAGNI / SRP 越境）

| 項目 | 分離先 |
|------|--------|
| ESLint custom rule の追加 | 「sync 契約 lint 強化」別 issue |
| `apps/web` 側の `SyncLogRecordZ.safeParse` 適用 | 「admin/audit 画面の shared schema 適用」別 issue |
| `sync_jobs`（#195）契約の shared 化 | #195 系の後続 task |
| 物理テーブル名 `sync_job_logs` → `sync_log` rename | U-7 別 task |

---

## 7. Phase 8 DoD

- [ ] R1 grep: `apps/api` 配下で独立 literal 宣言が 0 件
- [ ] R2 grep: deep import が 0 件
- [ ] R4 grep: runtime 経路のコメント残存が 0 件
- [ ] `mise exec -- pnpm typecheck && mise exec -- pnpm lint` green
