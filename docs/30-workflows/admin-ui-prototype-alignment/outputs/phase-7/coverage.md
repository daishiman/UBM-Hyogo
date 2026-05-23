# Phase 7: カバレッジ確認 (変更ブロック単位)

新規 `_shared/` 6 component + safeServerFetch helper は **全 export が spec から呼ばれている** (33 spec / 全件 PASS)。詳細カバレッジ % 計測は本サイクルでは実施せず、構造的に未到達分岐が無いことを spec で担保:

| Module | 主要分岐 | カバー spec |
| --- | --- | --- |
| `AdminSectionCard` | description / actions / density / as | TC-SC-01..05 |
| `AdminSectionError` | code / correlationId / message / meta 省略 | TC-SE-01..05 |
| `AdminEmptyState` | description / primaryAction / icon variant | TC-ES-01..04 |
| `AdminStat` | tone / loading / hint | TC-ST-01..04 |
| `AdminTable` | sort asc/desc / onRowSelect / empty / caption / selectedKey | TC-TB-01..06 |
| `AdminQueuePanel` | onSelect / selectedId / empty fallback / detail | TC-QP-01..05 |
| `safeServerFetch` | ok / status 展開 / 非 Error / fallback | TC-SSF-01..04 |

既存テストの delta: 0 (regression 無し)。
