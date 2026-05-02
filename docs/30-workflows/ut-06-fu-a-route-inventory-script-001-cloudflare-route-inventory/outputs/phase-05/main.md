# Phase 5 成果物: 実装（テンプレート化 / handoff 設計）

> 本タスクは **docs-only / infrastructure-automation** であり、本 PR では実 script コード / 実 test コード / fixture を一切生成しない。
> 本 Phase の outputs は **実装テンプレート（擬似コード）** / **`cf.sh` 経由 invocation 設計** / **受け側実装タスクへの handoff 仕様** の 3 文書で `template_created` 状態を確定する。実装本体は受け側 unassigned-task として後続起票する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 / 13（実装テンプレ化 / handoff 設計） |
| 状態 | spec_created |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 配置 path / 言語選定

| 案 | 配置 path | 採用 | 理由 |
| --- | --- | --- | --- |
| A | `scripts/cloudflare/route-inventory.ts` | **採用候補** | 型定義（`RouteInventoryEntry`）共有 / vitest で unit test 可 / 入口は `bash scripts/cf.sh route-inventory` |
| B | `scripts/cloudflare/route-inventory.sh` | 代替 | 軽量・依存少 / schema 整合と test 容易性で劣る |
| C | `apps/api` 内コマンド | 不採用 | API runtime 配置は責務違反。`scripts/` 配下が妥当 |

> 最終決定は受け側実装タスク。本 Phase は案 A を採用候補として擬似コード記述、案 B 採用時の差分（型廃止・jq parse）を備考扱い。

## 擬似コード骨格（案 A: TypeScript）

```
// scripts/cloudflare/route-inventory.ts （疑似コード）

// 1. main(args)
//    input:  --account-id <ACCOUNT_ID> --output-dir outputs/ --expected-worker ubm-hyogo-web-production
//    output: exit code 0 (PASS) / 1 (mismatch detected) / 2 (script error)
//    side effect: outputs/route-inventory.json と outputs/route-inventory.md を書き出す
//
// 2. fetchRoutes(accountId): Promise<ApiRoute[]>
//    GET /zones/{zone_id}/workers/routes
//    HTTP method allowlist = ["GET"]; 他 method を禁止
//    cf.sh 経由で取得した API token を環境変数から読み取り（値はログ・エラーに残さない）
//
// 3. fetchCustomDomains(accountId): Promise<ApiCustomDomain[]>
//    GET /accounts/:id/workers/domains
//    同上の allowlist 適用
//
// 4. buildInventoryReport(entries, expectedWorker): InventoryReport
//    expectedWorker = "ubm-hyogo-web-production"
//    mismatches = entries.filter(e => e.targetWorker !== expectedWorker)
//    entry ごとの competing mismatch field は作らない
//
// 5. writeOutput(report, outputDir): void
//    JSON: outputs/route-inventory.json
//    Markdown: outputs/route-inventory.md
//    secret pattern grep を最終 output に対して実行し、検出時 throw（safety guard）
```

5 関数すべてが Phase 4 の test ID（UT-01〜UT-08）と 1:1 で対応する。

### 案 B 採用時の差分（参考）

- `RouteInventoryEntry` schema は jq クエリで生成（型 SSOT 失われる）
- `cf.sh` 経由レスポンスを `jq` parse で JSON 出力 / `awk` で Markdown 表生成
- safety guard は `grep -nE` の正規表現で実装

## `cf.sh` 経由 invocation 設計（read-only scope）

```bash
# 認証確認（cf.sh が op 経由で CLOUDFLARE_API_TOKEN を揮発的に注入）
bash scripts/cf.sh whoami

# inventory 実行（案 A・案 B いずれも入口は cf.sh サブコマンドに集約）
bash scripts/cf.sh route-inventory \
  --account-id <ACCOUNT_ID プレースホルダ> \
  --output-dir outputs/ \
  --expected-worker ubm-hyogo-web-production
```

### read-only scope の遵守

- 利用 API endpoint: **GET のみ**（route list / custom domain list）
- POST / PUT / PATCH / DELETE は呼ばない（safety test ST-02）
- `secret put` / `secret delete` / `deploy` 系の `cf.sh` サブコマンドは本 script から呼び出さない
- token 値は CLI 引数に渡さず、`cf.sh` ラッパー経由で環境変数として揮発的に注入
- `wrangler` 直叩き禁止（全段階）

## output ファイルレイアウト

### JSON: `outputs/route-inventory.json`

```json
{
  "generatedAt": "2026-05-01T00:00:00.000Z",
  "expectedWorker": "ubm-hyogo-web-production",
  "entries": [
    { "pattern": "<host>/*", "targetWorker": "ubm-hyogo-web-production", "zone": "<MASKED>", "source": "api", "notes": "" },
    { "pattern": "<legacy-host>/*", "targetWorker": "<旧 Worker 名>", "zone": "<MASKED>", "source": "api", "notes": "legacy worker still has route" }
  ],
  "mismatches": [
    { "pattern": "<legacy-host>/*", "targetWorker": "<旧 Worker 名>", "zone": "<MASKED>", "source": "api", "notes": "legacy worker still has route" }
  ]
}
```

### Markdown: `outputs/route-inventory.md`

```markdown
# Route / Custom Domain Inventory

| pattern | targetWorker | zone | source | notes |
| --- | --- | --- | --- | --- |
| <host>/* | ubm-hyogo-web-production | <MASKED> | api | |
| <legacy-host>/* | <旧 Worker 名> | <MASKED> | api | legacy worker still has route |

## Summary
- expectedWorker: ubm-hyogo-web-production
- entries count: <数値>
- mismatches count: <数値>
- generated at: <ISO timestamp>
```

> 列順・列名は Phase 4 contract test CT-04 で固定された field 名と一致。secret / Token / 個人情報を雛形に埋め込まない。

## 親 UT-06 production deploy runbook への差し込み

| 差し込み先 | 節 | 追記内容雛形 |
| --- | --- | --- |
| `…ut-06-fu-a-prod-route-secret-001-…/outputs/phase-05/runbook.md` | 節 0（前提と禁止事項） | 本 script は read-only / mutation 不実行 / `bash scripts/cf.sh` 経由のみ |
| 同上 | 節 2（Worker inventory）末尾 | 旧 / 新 Worker 名の inventory ソースを「dashboard 手動 + 本 script API 出力」の二重化に拡張 |
| 同上 | route / custom domain 突合手順の前段 | dashboard 操作前に inventory script を実行し JSON / Markdown を evidence 添付 |

> 親 runbook の編集は受け側実装タスクで実施。本 Phase は追記文面の **雛形** のみ確定する。

## 受け側実装タスクへの handoff（別 PR への引き継ぎ範囲）

| 項目 | 内容 |
| --- | --- |
| 受け側タスク ID | **未確定**。命名候補: `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` |
| 起票場所 | `docs/30-workflows/unassigned-task/<受け側 slug>.md` |
| 入力資料 | 本タスクの phase-04.md / phase-05.md / phase-06.md（test plan / schema / 擬似コード骨格 / safety guard） |
| 実装範囲 | (1) script 本体（案 A or B 選択）/ (2) test 本体（unit / contract / safety）/ (3) fixture / (4) 親 runbook 追記 |
| 完了条件（受け側） | unit / contract / safety すべて PASS / production 出力で旧 Worker route 件数 = 0 / 親 runbook 追記済み |
| 検証コマンド（受け側） | `pnpm typecheck` / `pnpm lint` / `pnpm test` / `bash scripts/cf.sh whoami` / inventory script 実行 |
| 引き継ぎ警告 | `wrangler` 直叩き禁止 / secret・Token を fixture・出力・log に残さない / mutation 呼び出し禁止 / `wrangler login` 禁止 |

## セキュリティガード（実装テンプレ冒頭で固定）

- secret 値 / OAuth トークン値 / API Token 値を出力・log・fixture・コミット・PR に転記しない
- `.env` の `cat` / `Read` / `grep` 禁止
- `wrangler login` 禁止（ローカル OAuth トークン保持禁止）
- `wrangler` 直叩き禁止（`bash scripts/cf.sh` ラッパーのみ）
- mutation HTTP method を script から発行しない
- 出力ファイルをコミット前にレビュー

## canUseTool 適用範囲

- 自動編集を許可: 仕様文書（`Write` / `Edit`）、擬似コード文書、handoff 文書
- 人手承認必須: 受け側実装タスク起票（unassigned-task 追加） / 親 runbook 追記反映
- 該当なし: 本 Phase で実 script コード / 実 test コードを書く行為（**禁止**）

## 完了条件

- [x] 配置 path 3 案で trade-off 表完成
- [x] 擬似コード骨格 5 関数で input / output / 副作用明記
- [x] `cf.sh` invocation 例が `wrangler` 直叩きゼロで記述
- [x] JSON / Markdown 雛形が Phase 4 schema と整合
- [x] 親 runbook 差し込み箇所（節 0 / 節 2 / 突合手順前段）に追記文面雛形
- [x] handoff 文書（受け側タスク `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001` / 起票場所 / 入力 / 実装範囲 / 完了条件 / 検証 / 警告）完成
- [x] セキュリティガード 6 項目を冒頭固定

## 次 Phase への引き渡し

- Phase 6: review checklist の「実装観点」「security」セクションに本テンプレを wire-in
- Phase 7: AC × 実装テンプレ × handoff のトレース表
- Phase 11: 受け側実装タスクで実 evidence（inventory 実行ログ）を生成
- Phase 12: 受け側実装タスク起票を unassigned-task-detection に登録
