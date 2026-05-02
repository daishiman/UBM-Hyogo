# Phase 2 API Allowlist

## SSOT

このファイルは route inventory script の Cloudflare API allowlist と `InventoryReport` schema の参照点である。

## Read-only Endpoints

| # | HTTP method | endpoint | 用途 |
| --- | --- | --- | --- |
| 1 | GET | `/accounts/{account_id}/workers/scripts` | expected Worker と旧 Worker 候補の存在確認 |
| 2 | GET | `/zones/{zone_id}/workers/routes` | route pattern と target Worker の取得 |
| 3 | GET | `/accounts/{account_id}/workers/domains` | custom domain と target Worker の取得 |

`POST` / `PUT` / `PATCH` / `DELETE` は禁止。禁止語は仕様書内の説明に現れるため、grep gate は後続実装 script の API call layer と generated output に限定する。

## InventoryReport

```ts
interface RouteInventoryEntry {
  pattern: string;
  targetWorker: string;
  zone: string;
  source: "api" | "dashboard-fallback";
  notes?: string;
}

interface InventoryReport {
  generatedAt: string;
  expectedWorker: "ubm-hyogo-web-production";
  entries: RouteInventoryEntry[];
  mismatches: RouteInventoryEntry[];
}
```

`mismatches = entries.filter((entry) => entry.targetWorker !== expectedWorker)` が正本契約。
