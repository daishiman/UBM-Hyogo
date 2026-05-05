# Phase 4: テスト戦略

## 目的

06a 公開導線 4 route family / 5 smoke cases の local / staging smoke を、04a public API 実体 + Cloudflare D1 binding 経由で実行するための **curl matrix** と **evidence 命名規則** を定義する。本タスクは NON_VISUAL かつ実体経路の確認を目的とするため、**coverage（unit/integration カバレッジ）は対象外**であることを明示する。

## 対象外（明示）

- **coverage 概念は対象外**: Vitest 等の line/branch coverage は本タスクのゲートに含めない。06a 親タスクおよび 04a public API 側で別途担保済み。
- visual regression / screenshot diff
- Playwright E2E（08b 責務）
- 04a API contract 変更を伴うリグレッションテスト

## テスト方針

| 観点 | 方針 |
| --- | --- |
| 経路 | `apps/web` (Next.js on Workers) → `apps/api` (Hono on Workers) → D1 binding |
| 検証手段 | `curl -s -o /dev/null -w "%{http_code}"` による HTTP status 観測 + 必要に応じてレスポンス body の `jq` 抽出 |
| 環境 | local（`scripts/cf.sh` 経由 wrangler dev）+ staging（Cloudflare deployed Workers） |
| 実体性確認 | `/members` 応答に seed member が 1 件以上含まれること（mock fallback 検出を兼ねる） |
| 不変条件 #5 | `apps/web/app` / `apps/web/src` の実アプリコードに D1 直接 import が無いことを `rg "D1Database|env\\.DB"` で 0 件確認 |

## curl matrix の構成軸

`outputs/phase-04/curl-matrix.md` に最低 8 行を定義する。軸は以下:

- **route**: `/`, `/members`, `/members/{seeded-id}`, `/members/UNKNOWN`, `/register`
- **env**: `local`, `staging`
- **method**: `GET`（POST submission は本タスク対象外）
- **expected status**: `200`（正常）/ `404`（unknown id）

## evidence 命名規則

| ファイル | 配置 | 用途 |
| --- | --- | --- |
| `local-curl.log` | `outputs/phase-11/evidence/` | local smoke の curl 出力（matrix 行ごとに `# route env status` 1 行ヘッダ + body 抜粋） |
| `staging-curl.log` | `outputs/phase-11/evidence/` | staging smoke の curl 出力 |
| `staging-screenshot.png` | `outputs/phase-11/evidence/` | staging `/members` の 1 枚（実体確認の補助） |

ログ書式（共通）:

```
# <ISO8601 timestamp> <env> <method> <route>
HTTP <status>
<body の最初 N 行>
---
```

- secret（API token / D1 ID 実値）は `redacted` で置換し、決して書き込まない。
- D1 query log を採取する場合も binding 名のみ記録し、ID は出さない。

## 合否判定

- matrix の全行が expected status と一致 → Phase 11 で GREEN を主張可能
- 1 行でも不一致 → Phase 6 異常系シナリオへ分岐し、原因切り分け後に再実行

## 採用判断

- **採用**: curl + manual screenshot による軽量 smoke（NON_VISUAL タスク）
- **不採用**: Playwright / Vitest coverage（責務が異なる）

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 4
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- curl matrix と evidence 命名規則を確定する
- 期待 status と実行環境の組み合わせを AC に対応付ける

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-04/main.md`

## 完了条件

- [ ] Phase 4 の成果物が存在する
- [ ] AC / evidence / dependency trace に矛盾がない

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。
