# Phase 2 §3-§4: Inventory data shape / Output writer 設計

## 3.1 TypeScript 型定義 (仮)

実装は別 PR (`scripts/cloudflare/route-inventory.types.ts` 等) で行う。本タスクは型シグネチャの確定のみ。

```ts
export interface RouteInventoryEntry {
  /** route pattern または custom domain の hostname。例: "members.example.com/*" */
  pattern: string;
  /** route / custom domain が指している script 名 */
  targetWorker: string;
  /** zone 名または zone ID */
  zone: string;
  /** 取得経路 */
  source: 'api' | 'dashboard-fallback';
}

export interface InventoryReport {
  /** ISO8601 UTC */
  generatedAt: string;
  /** 期待 Worker 名 (apps/web/wrangler.toml の [env.production].name) */
  expectedWorker: 'ubm-hyogo-web-production';
  /** 全 route / custom domain entry */
  entries: RouteInventoryEntry[];
  /** expectedWorker と一致しない entry のみ抽出 */
  mismatches: RouteInventoryEntry[];
}
```

## 3.2 JSON schema (出力契約・仮)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["generatedAt", "expectedWorker", "entries", "mismatches"],
  "properties": {
    "generatedAt": { "type": "string", "format": "date-time" },
    "expectedWorker": { "const": "ubm-hyogo-web-production" },
    "entries": { "type": "array", "items": { "$ref": "#/$defs/entry" } },
    "mismatches": { "type": "array", "items": { "$ref": "#/$defs/entry" } }
  },
  "$defs": {
    "entry": {
      "type": "object",
      "required": ["pattern", "targetWorker", "zone", "source"],
      "properties": {
        "pattern": { "type": "string" },
        "targetWorker": { "type": "string" },
        "zone": { "type": "string" },
        "source": { "enum": ["api", "dashboard-fallback"] }
      },
      "additionalProperties": false
    }
  }
}
```

## 3.3 mismatch 抽出ロジック (疑似コード)

```
mismatches = entries.filter(e => e.targetWorker !== "ubm-hyogo-web-production")
```

- AC-2: `mismatches` が **0 件**であることが production deploy 承認の前提。
- 本タスクでは契約として明記。実行・gate 化は別 PR / 親タスク runbook 側の責務。

## 4.1 出力先

| 形式 | パス (仮) | 用途 |
| --- | --- | --- |
| JSON | `outputs/route-inventory.json` (script 実行時の作業ディレクトリ相対) | 機械可読・後続 gate 用の実行時出力 |
| Markdown | `outputs/route-inventory.md` | runbook 添付・人間レビュー用の実行時出力 |
| workflow evidence | `outputs/phase-11/route-inventory-output-sample.md` | 本 docs-only workflow の設計証跡。実測 JSON / Markdown そのものではない |

> 出力ディレクトリは引数または環境変数で上書き可能 (例: `--output-dir=./tmp/route-inventory`)。詳細は別 PR 実装で確定。

## 4.2 Markdown 雛形

```markdown
# Route Inventory Report

- generatedAt: 2026-05-01T00:00:00Z
- expectedWorker: `ubm-hyogo-web-production`

## Entries

| pattern | targetWorker | zone | source |
| --- | --- | --- | --- |
| members.example.com/* | ubm-hyogo-web-production | example.com | api |

## Mismatches

(none)

> mismatches が 0 件であることが production deploy 承認の前提条件です。
```

## 4.3 secret mask layer

| 観点 | 方針 |
| --- | --- |
| 出力フィールド | `pattern` / `targetWorker` / `zone` / `source` / `notes` のみ。値 (secret / token) を含むフィールドは存在しない |
| host 部分マスクオプション | `--mask-host` フラグで `pattern` の hostname を `***.example.com/*` に部分マスク (既定 OFF) |
| ログ | API レスポンスを stdout / stderr にダンプしない。エラー時も HTTP status / endpoint 名のみ |
| grep gate | 出力ファイルに対し既知 token prefix (例: `eyJ`、Bearer prefix) / 値パターンが含まれないことを Phase 3 で検証 |

## 出力契約まとめ (AC との対応)

- AC-1: `RouteInventoryEntry` 4 必須フィールド (`pattern` / `targetWorker` / `zone` / `source`) と任意 `notes` が JSON / Markdown 両形式に存在。
- AC-2: `mismatches` 配列が `entries` と分離して出力。
- AC-3: 値・token を含むフィールドは存在しない設計 (フィールドレベルでの secret 漏洩防止)。

`mismatches` の要素は `RouteInventoryEntry` と同一 schema を使う。理由分類は competing field `reason` を追加せず、必要な場合のみ `notes` に `legacy-worker-target` 等の短い分類文字列を入れる。
