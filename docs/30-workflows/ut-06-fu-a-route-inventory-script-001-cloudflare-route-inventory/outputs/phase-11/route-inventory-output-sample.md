# Route Inventory Output Sample

> Design sample only. This is not production runtime evidence.

```json
{
  "generatedAt": "2026-05-01T00:00:00.000Z",
  "expectedWorker": "ubm-hyogo-web-production",
  "entries": [
    {
      "pattern": "<host>/*",
      "targetWorker": "ubm-hyogo-web-production",
      "zone": "<MASKED>",
      "source": "api"
    },
    {
      "pattern": "<legacy-host>/*",
      "targetWorker": "<legacy-worker-name>",
      "zone": "<MASKED>",
      "source": "api",
      "notes": "legacy worker still has route"
    }
  ],
  "mismatches": [
    {
      "pattern": "<legacy-host>/*",
      "targetWorker": "<legacy-worker-name>",
      "zone": "<MASKED>",
      "source": "api",
      "notes": "legacy worker still has route"
    }
  ]
}
```

実測 PASS 時はこのファイルを後続実装タスクの mask 済み出力で上書きする。
