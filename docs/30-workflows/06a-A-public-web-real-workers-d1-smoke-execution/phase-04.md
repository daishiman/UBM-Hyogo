# Phase 4: テスト戦略 — 06a-A-public-web-real-workers-d1-smoke-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06a-A-public-web-real-workers-d1-smoke-execution |
| phase | 4 / 13 |
| wave | 6a-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec / docs-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

06a 公開導線 4 route family（`/`, `/members`, `/members/[id]`, `/register`）について、`apps/web` (Next.js on Workers) → `apps/api` (Hono on Workers) → Cloudflare D1 binding という **real Workers + real D1 経路** の smoke 検証戦略を確定させる。本タスクは **VISUAL_ON_EXECUTION（実行時 screenshot + curl 主体）** であり、Vitest line/branch coverage は本タスクのゲートに含めない。

## 対象外（明示）

- **coverage 概念は対象外**: line/branch/statement coverage は 04a / 06a 親タスクで担保済み
- visual regression（diff 比較は 08b 担当）
- Playwright E2E（08b 責務）
- 04a public API の contract 変更
- production 環境の smoke（09a 担当）

## テスト方針

| 観点 | 方針 |
| --- | --- |
| 経路 | `apps/web` (Next.js / `@opennextjs/cloudflare`) → `apps/api` (Hono) → D1 binding `DB` |
| 起動方式 | local: `bash scripts/cf.sh dev` 経由で `apps/api` + `apps/web` を別プロセス起動 / staging: `bash scripts/cf.sh deploy --env staging` 後の deployed Worker URL |
| 検証手段 | `curl -s -o /dev/null -w "%{http_code}\n"` による HTTP status 観測 + body の `jq` 抽出（必要に応じて HTML を `tee` で保存） |
| 環境 | local（`http://127.0.0.1:8788` for web / `http://127.0.0.1:8787` for api） + staging（`https://ubm-hyogo-web-staging.daishimanju.workers.dev`） |
| 実体性確認 | `/members` 応答 HTML に seed member 名が 1 件以上レンダリングされていること（mock fallback 検出を兼ねる） |
| 不変条件 #5 | `apps/web/app` / `apps/web/src` 配下に `D1Database` / `env.DB` 直接参照が無いことを `rg` で 0 件確認 |
| 不変条件 #6 | apps/web から D1 binding を直接呼ばず、必ず `PUBLIC_API_BASE_URL` 経由で `apps/api` に到達することを Network log / curl `-v` で確認 |

## 4 route × 5 smoke case 設計

local / staging 両方で同一 matrix を実行する。

| case | route | method | 期待 status | 主検証点 |
| --- | --- | --- | --- | --- |
| C1 | `/` | GET | 200 | landing が SSR で返る / API 接続成功表示 or 静的レンダ |
| C2 | `/members` | GET | 200 | member 一覧に seed 由来の表示が 1 件以上含まれる |
| C3 | `/members/{seeded-id}` | GET | 200 | seed の特定 ID 詳細ページが返る |
| C4 | `/members/UNKNOWN` | GET | 404 | 未存在 ID で 404（or apps/web の not-found） |
| C5 | `/register` | GET | 200 | フォーム導線ページが返る（Google Form 外部リンクで OK） |

> POST submission（フォーム実送信）は本タスク scope out。GET レンダリングのみ対象。

## evidence 配置（統一）

| ファイル | 配置 | 用途 |
| --- | --- | --- |
| `local-curl.log` | `outputs/phase-11/evidence/` | local smoke の curl 出力（matrix 行ごと） |
| `staging-curl.log` | `outputs/phase-11/evidence/` | staging smoke の curl 出力 |
| `local-<route>.png` | `outputs/phase-11/evidence/` | local 4 route のブラウザ screenshot |
| `staging-members.png` | `outputs/phase-11/evidence/` | staging `/members` の実体確認 1 枚（必須） |
| `staging-<route>.png` | `outputs/phase-11/evidence/` | staging 残り 3 route（任意） |

ログ書式（共通）:

```
# <ISO8601 timestamp> <env> <method> <route>
HTTP <status>
<body 抜粋>
---
```

- secret（API token / D1 ID 実値）は `redacted` で置換。記録しない。
- staging URL の path は許容、token / id 等は redact。

## 合否判定

- 5 case × 2 env = 10 行すべて期待 status と一致 → Phase 11 で GREEN
- 1 行でも不一致 → Phase 6 異常系に分岐し原因切り分け後に再実行
- AC matrix（Phase 7）の Pass 条件と一致

## 採用判断

- **採用**: curl matrix + manual screenshot による軽量 smoke（VISUAL_ON_EXECUTION）
- **不採用**: Playwright（08b 責務）/ Vitest coverage（責務違い）/ visual diff（08b）

## 多角的チェック観点

- #5 public/member/admin boundary
- #6 apps/web から D1 直接アクセス禁止
- #8 localStorage/GAS prototype を正本にしない
- #14 Cloudflare free-tier
- 未実装/未実測を PASS と扱わない
- placeholder と実測 evidence を分離する
- mock fallback を本物経路と誤認しない（seed 件数で実体検出）

## サブタスク管理

- [ ] curl matrix（4 route × 2 env）の最終形を確定
- [ ] evidence 命名規則を `outputs/phase-11/evidence/` と `outputs/phase-11/evidence/` に集約
- [ ] AC（index.md 4 項目）と verify 手段の対応を Phase 7 に渡す
- [ ] outputs/phase-04/main.md を作成

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `outputs/phase-04/main.md`
- `outputs/phase-04/curl-matrix.md`（任意：詳細表）

## 実行タスク

この Phase の実行タスクは本文中のタスク表、検証手順、またはチェックリストに記載済み。

## 統合テスト連携

この workflow は実行仕様作成 wave のため、新規テストコードは追加しない。Phase 11 実行時に curl / screenshot / D1 evidence を保存する。

## 完了条件

- [ ] local real Workers/D1 smoke の curl log path（`outputs/phase-11/evidence/local-curl.log`）が evidence 列に固定されている
- [ ] staging real Workers/D1 smoke の curl log path（`outputs/phase-11/evidence/staging-curl.log`）が evidence 列に固定されている
- [ ] 4 route family 全ての screenshot 配置先（`outputs/phase-11/evidence/`）が指定されている
- [ ] mock API ではなく real `apps/web → apps/api → D1` 経路を確認する手段が定義されている

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、curl matrix（5 case × 2 env）、evidence path 規則（`outputs/phase-11/evidence/` 集約）、不変条件 #5/#6 verify 手段、approval gate（user 確認なしに staging deploy しない）を渡す。
