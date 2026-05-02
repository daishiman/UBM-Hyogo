# S3 D1 binding confirmation

実行日時: 2026-05-02 22:00 JST (approx)
コマンド: `rg -n "database_name|binding|database_id" apps/api/wrangler.toml`

```
26:binding = "DB"
27:database_name = "ubm-hyogo-db-prod"
28:database_id = "24963f0a-7fbb-4508-a93a-f8e502aa4585"
52:binding = "DB"
53:database_name = "ubm-hyogo-db-prod"
54:database_id = "24963f0a-7fbb-4508-a93a-f8e502aa4585"
76:binding = "DB"
77:database_name = "ubm-hyogo-db-staging"
78:database_id = "990e5d6c-51eb-4826-9c13-c0ae007d5f46"
```

## 判定

- production binding: `DB` / `ubm-hyogo-db-prod` / `24963f0a-7fbb-4508-a93a-f8e502aa4585`
- staging binding: `DB` / `ubm-hyogo-db-staging` / `990e5d6c-51eb-4826-9c13-c0ae007d5f46`

## ⚠️ DRIFT 検出

| 項目 | 本タスク spec 記述 | 実 wrangler.toml | 採用 |
| --- | --- | --- | --- |
| production D1 名 | `ubm_hyogo_production` | `ubm-hyogo-db-prod` | **`ubm-hyogo-db-prod`** (実 config を正本) |

本タスクの phase-02 〜 phase-05 spec / 親 09c の implementation-guide に記述された `ubm_hyogo_production` は drift。CLAUDE.md の `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` 例とも整合する `ubm-hyogo-db-prod` を採用すべき。

## 修正方針

- 本タスク outputs / spec の DB 名を `ubm-hyogo-db-prod` に統一
- Phase 12 の system-spec-update-summary.md に drift と修正経緯を記録
- 親 09c の implementation-guide.md にも同 drift があれば伝播 fix

[DRY-RUN] 2026-05-02T22:00:34+09:00
