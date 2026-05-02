# UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001: route inventory script implementation

> 発生元: `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/outputs/phase-12/unassigned-task-detection.md`

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001 |
| 分類 | implementation / infrastructure-automation |
| ステータス | open |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親仕様 | `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/` |
| 作成日 | 2026-05-01 |

## 苦戦箇所【記入必須】

- 対象: `scripts/cf.sh` の wrapper 設計と repository-controlled entrypoint 切り出し
- 症状: 親仕様 (docs-only design) は Phase 2 で `InventoryReport` 契約を固定したものの、wrangler API 直接呼び出しと `scripts/cf.sh` subcommand 拡張のどちらが適切か Phase 5 まで結論が揺れた。account-scoped と zone-scoped の route endpoint で fixture が分かれ、unit fixture から「accounts/{id}/workers/routes」を誤って参照しないようガードする命名規約が必要だった。
- 知見: 後続実装は `pnpm tsx scripts/cloudflare/route-inventory.ts` を独立 entrypoint に置き、`scripts/cf.sh` は wrangler 透過 wrapper として変更しない方針を採用する。fixture 名に `zone-` prefix を付け、grep で account-scoped 呼び出しを検出可能にする。
- 参照: `docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/outputs/phase-02/api-allowlist.md`, `outputs/phase-11/route-inventory-output-sample.md`

## 目的

親仕様で固定した `InventoryReport` 契約に従い、Cloudflare route / custom domain inventory を read-only で取得し、JSON / Markdown の両形式で出力する script を実装する。

## スコープ

### 含む

- `bash scripts/cf.sh route-inventory ...` 相当の repository-controlled entrypoint
- 実装候補 path: `scripts/cloudflare/route-inventory.ts`
- 実行 command 候補: `pnpm tsx scripts/cloudflare/route-inventory.ts --config apps/web/wrangler.toml --env production --output-dir outputs/route-inventory`
- `scripts/cf.sh` は wrangler 直接 wrapper のまま維持してもよい。その場合は独自 subcommand を増やさず、上記 script を repository-controlled entrypoint として Phase 12 に記録する
- Phase 2 allowlist の GET endpoint のみを使う API call layer
- `InventoryReport` JSON / Markdown 出力
- mismatch detection
- secret-leak grep / mutation endpoint grep
- mask 済み NON_VISUAL evidence の取得
- 親 runbook `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md` への実 command / evidence path 追記

### 含まない

- production deploy
- DNS record 変更
- route / custom domain の付け替え
- Worker 削除
- secret put / delete
- CI 自動実行

## 完了条件

- Phase 2 `InventoryReport` と同じ schema で出力する
- route endpoint は `GET /zones/{zone_id}/workers/routes` を使い、account-scoped route endpoint を作らない
- `mismatches` が `targetWorker !== expectedWorker` を正しく分離する
- `mismatches[]` は `RouteInventoryEntry` と同一 schema とし、competing `reason` field を作らない。理由分類は任意 `notes` に入れる
- output / log に token / Bearer / OAuth / account id / zone id 実値が残らない
- API call は GET allowlist のみ
- 親 workflow `outputs/phase-11/*` を実測 evidence で更新できる
- 親 runbook に production preflight での inventory 実行手順と mask 済み evidence 添付先が追記されている
- fixture / test 方針: Cloudflare workers scripts、zone workers routes、workers domains の 3 fixture を使い、unit / contract / safety grep を実行する

## リスクと対策

| リスク | 対策 |
| --- | --- |
| Cloudflare API token の権限超過 | Phase 2 allowlist の GET endpoint のみを実行し、PUT/POST/DELETE が混入したら CI grep で fail させる |
| account-scoped route endpoint の誤用 | fixture 命名 (`zone-*`) と grep guard で `accounts/{id}/workers/routes` を検出 |
| token / Bearer / account id / zone id の漏出 | output / log は mask layer を経由し、`outputs/phase-11/secret-leak-grep.md` 同等の grep を CI に設置 |
| `scripts/cf.sh` への subcommand 増殖 | 本 script は独立 entrypoint (`scripts/cloudflare/route-inventory.ts`) に分離し、`cf.sh` は wrangler 透過 wrapper を維持 |
| 親 runbook 未更新によるオペレーション乖離 | 完了条件に runbook 追記を含め、未更新時は Phase 12 で fail とする |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/cloudflare
```

期待: 型・lint エラーなし、3 fixture (workers scripts / zone workers routes / workers domains) に対する unit / contract / safety grep が green。

### 統合検証

```bash
bash scripts/cf.sh whoami
mise exec -- pnpm tsx scripts/cloudflare/route-inventory.ts \
  --config apps/web/wrangler.toml --env production \
  --output-dir outputs/route-inventory --dry-run
```

期待: read-only inventory が JSON / Markdown で生成され、`mismatches[]` が `RouteInventoryEntry` schema と整合し、token / OAuth / account id / zone id 実値が出力されない。
