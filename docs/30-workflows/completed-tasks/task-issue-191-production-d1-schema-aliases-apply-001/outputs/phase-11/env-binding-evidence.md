# Env Binding Evidence (EV-11-5)

実行日時: 2026-05-02

## 検査内容

`apps/api/wrangler.toml` に production environment の D1 binding が SSOT として固定されていることを確認する。

## 実行結果

```
$ rg -n "binding|database_name|database_id" apps/api/wrangler.toml | head -20
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

```
$ rg -n "\[env\.production" apps/api/wrangler.toml
31:[env.production]
34:[env.production.vars]
48:[env.production.triggers]
51:[[env.production.d1_databases]]
```

## SSOT 固定値

| key | source | 値 |
| --- | --- | --- |
| environment section | `apps/api/wrangler.toml` line 31 | `[env.production]` |
| binding | line 52 | `DB` |
| database_name | line 53 | `ubm-hyogo-db-prod` |
| database_id | line 54 | `24963f0a-7fbb-4508-a93a-f8e502aa4585` |
| staging binding (参考) | line 76-78 | `ubm-hyogo-db-staging` / `990e5d6c-51eb-4826-9c13-c0ae007d5f46` |

## 判定

- AC-2（target = `ubm-hyogo-db-prod` / `--env production`）✅ PASS
- staging と production の database_id が分離されていることを確認（E-8 誤環境 apply の予防）
