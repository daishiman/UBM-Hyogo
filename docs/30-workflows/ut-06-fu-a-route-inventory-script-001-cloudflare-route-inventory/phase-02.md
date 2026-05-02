# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 作成日 | 2026-05-01 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (テスト計画) |
| 状態 | spec_created |
| タスク分類 | docs-only / infrastructure-automation（script 設計のみ） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #328 |

## 目的

Phase 1 で確定した「split-brain を 0 にする出力契約の固定」要件を、4 concern に分解して設計する:

1. **Cloudflare API call layer**: `bash scripts/cf.sh` 経由の read-only endpoint allowlist
2. **Inventory data shape**: TypeScript 型としての `RouteInventoryEntry` / `InventoryReport`
3. **Output writer**: JSON ファイル + Markdown ファイルの 2 形式同時出力 + secret mask layer
4. **Safety boundary**: mutation 禁止 / secret 漏洩防止 / `wrangler` 直接呼び出し禁止

Phase 3 のテスト計画と Phase 4 以降の type / contract test が一意に展開できる粒度の設計入力を作成する。本 Phase ではコードを書かない。型シグネチャ・出力フォーマット雛形・コマンド一覧の Markdown のみを成果物とする。

> **依存順序（重複明記 2/3）**: 親タスク UT-06-FU-A-PROD-ROUTE-SECRET-001 (#246) の preflight runbook 完了が本タスク前提条件であり、本タスクは parent runbook の手動経路を機械化する位置付けである。Phase 1 依存境界・Phase 3 NO-GO 条件と重複明記する。

## 設計範囲

| concern | 概要 | 担当章 | lane |
| --- | --- | --- | --- |
| Cloudflare API call layer | `bash scripts/cf.sh` ラッパー経由で read-only endpoint のみを叩く | §2 | 1 |
| Inventory data shape | `RouteInventoryEntry` / `InventoryReport` 型と JSON schema 仮設計 | §3 | 2 |
| Output writer | JSON (`outputs/route-inventory.json`) + Markdown (`outputs/route-inventory.md`) + secret mask layer | §4 | 3 |
| Safety boundary | mutation 禁止 / secret 漏洩防止 / `wrangler` 検出 / DI 境界 | §5 | 横断（全 lane で重複明記） |

> 本タスクは 3 lane（4 concern のうち Safety は横断）。各 lane の設計を独立に Phase 3 へ渡せる粒度で確定する。

## 1. target topology table

| layer | 物理的所在（仮） | 役割 | 入力 | 出力 |
| --- | --- | --- | --- | --- |
| Cloudflare API call layer | （別 PR で `scripts/cloudflare/route-inventory.ts` 等を想定。本タスクでは命名のみ） | `bash scripts/cf.sh` ラッパー経由で Workers list / Routes / Custom Domains の read-only endpoint を呼ぶ | account_id / zone_id（環境変数経由・op run で動的注入） | 生 API レスポンス（メモリ上のみ。ファイル化しない） |
| Inventory data shape | TypeScript 型定義（仮） | API レスポンスを正規化 | 生 API レスポンス | `InventoryReport` オブジェクト |
| Output writer | JSON / Markdown 出力レイヤ | 出力ファイル 2 形式同時生成 + secret mask | `InventoryReport` オブジェクト | `outputs/route-inventory.json` / `outputs/route-inventory.md` |
| Safety boundary | grep gate / endpoint allowlist チェック / `wrangler` 検出 | 出力・コードに mutation / secret / wrangler が混入していないことを保証 | 出力ファイル / script ソース | grep 検証ステータス（PASS/FAIL） |

## 2. Cloudflare API endpoint allowlist（read-only のみ）

> mutation endpoint は **完全禁止**。`POST` / `PUT` / `PATCH` / `DELETE` を含む API は本 script から一切呼ばない。allowlist に存在しない endpoint も呼ばない。

| # | HTTP method | endpoint | 用途 | 取得値 | source ラベル |
| --- | --- | --- | --- | --- | --- |
| 1 | `GET` | `/accounts/{account_id}/workers/scripts` | アカウント配下の Workers 一覧 | Worker 名のリスト（`expectedWorker = "ubm-hyogo-web-production"` の存在確認 + 旧 Worker 候補の検出） | `api` |
| 2 | `GET` | `/zones/{zone_id}/workers/routes` | zone 配下の route → script 紐付き | route pattern / script 名 | `api` |
| 3 | `GET` | `/accounts/{account_id}/workers/domains` | custom domain → service 紐付き | hostname / service 名 / zone | `api` |

### 2.1 mutation 禁止の表（明示的に除外する endpoint 例）

| 除外 method | 例 endpoint | 除外理由 |
| --- | --- | --- |
| `POST` | `/accounts/{account_id}/workers/scripts/{name}` | Worker のアップロード（mutation） |
| `PUT` | `/zones/{zone_id}/workers/routes/{id}` | route の更新（mutation） |
| `PATCH` | `/accounts/{account_id}/workers/domains/{id}` | custom domain の更新（mutation） |
| `DELETE` | `/zones/{zone_id}/workers/routes/{id}` | route の削除（mutation） |

> 上記の除外原則は **Phase 3 NO-GO 条件**として grep gate（`POST|PUT|PATCH|DELETE` がコード / 設計ドキュメントの API call 部分に出現したら NO-GO）で固定する。

### 2.2 呼び出し境界

- 本 script から `fetch` / HTTP client を呼ぶ場合も、認証情報（`CLOUDFLARE_API_TOKEN` 等）は **`bash scripts/cf.sh` 経由で `op run --env-file=.env` 注入された環境変数** からのみ取得する。
- `wrangler` バイナリの直接実行（`wrangler routes ...` 等）は **完全禁止**（CLAUDE.md C-1）。
- `~/Library/Preferences/.wrangler/config/default.toml` の OAuth トークンの読み取りも禁止。

## 3. Inventory data shape

### 3.1 型定義（仮）

```ts
// scripts/cloudflare/route-inventory.types.ts（別 PR で実装）
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
  /** 期待 Worker 名（apps/web/wrangler.toml の [env.production].name） */
  expectedWorker: 'ubm-hyogo-web-production';
  /** 全 route / custom domain entry */
  entries: RouteInventoryEntry[];
  /** expectedWorker と一致しない entry のみ抽出 */
  mismatches: RouteInventoryEntry[];
}
```

### 3.2 JSON schema（出力契約・仮）

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

### 3.3 mismatch 抽出ロジック（疑似コード）

```
mismatches = entries.filter(e => e.targetWorker !== "ubm-hyogo-web-production")
```

> AC-2: `mismatches` 配列が **0 件**であることが production deploy 承認の前提となる。本タスクでは契約として明記し、実行・gate 化は別 PR / 親タスク runbook 側の責務。

## 4. Output writer 設計

### 4.1 出力先

| 形式 | パス（仮） | 用途 |
| --- | --- | --- |
| JSON | `outputs/route-inventory.json`（script 実行時の作業ディレクトリ相対） | 機械可読・後続 gate 用 |
| Markdown | `outputs/route-inventory.md` | runbook 添付・人間レビュー用 |

> 出力ディレクトリは script 実行時の引数または環境変数で上書き可能とする（例: `--output-dir=./tmp/route-inventory`）。詳細は別 PR の実装で確定。

### 4.2 Markdown 雛形

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

### 4.3 secret mask layer

| 観点 | 方針 |
| --- | --- |
| 出力フィールド | `pattern` / `targetWorker` / `zone` / `source` のみ。値（secret / token）を含むフィールドは存在しない設計 |
| host 部分マスクオプション | `--mask-host` フラグで `pattern` の hostname を `***.example.com/*` のように部分マスク（既定は OFF） |
| ログ | API レスポンスを stdout / stderr にダンプしない。エラー時も HTTP status / endpoint 名のみ |
| grep gate | 出力ファイルに対し既知 token prefix（例: `eyJ`、Bearer prefix）/ 値パターンが含まれないことを Phase 3 で検証 |

## 5. Safety boundary（DI 境界・横断 concern）

### 5.1 DI 境界

| 部位 | 責務 | 実装上の分離（別 PR） |
| --- | --- | --- |
| http client | `fetch` ラッパー（read-only allowlist の enforce 込み） | `scripts/cloudflare/http-client.ts`（仮） |
| cf.sh wrapper | 認証情報注入のみ | `scripts/cf.sh`（既存） |
| output formatter | JSON / Markdown 生成 + mask | `scripts/cloudflare/output-formatter.ts`（仮） |

> 3 部位を分離することで、Phase 4 で http client に対する allowlist contract test を独立に実施できる。

### 5.2 secret 漏洩防止設計

- `console.log` / `process.stdout.write` で API レスポンス本体をダンプしない。
- 出力ファイル書き出し前に **既知 token パターンに対する自己 grep**（`eyJ` / `Bearer ` / `op://` など）を行い、検出時は exit code 2 で fail-fast する。
- script 内の関数 / 変数命名で `token` / `secret` を含む値を **戻り値や export 経路に乗せない**。

### 5.3 `wrangler` 直接呼び出し禁止の自己検査

- script ソース全体に対し、`grep -n "wrangler "` が一致しないことを実装側 lint で gate 化する（別 PR）。
- 設計ドキュメント側でも本 §に明記し、Phase 3 NO-GO 条件で重複明記する。

## 6. 既存 layout discovery

| 観点 | 確認方法 | 期待 |
| --- | --- | --- |
| `scripts/cf.sh` 既存ラッパー存在 | `rg --files scripts/` で `scripts/cf.sh` 確認 | 存在する（CLAUDE.md `Cloudflare 系 CLI 実行ルール`） |
| 既存 Cloudflare 系 script の有無 | `rg --files scripts/` で `cloudflare/` ディレクトリ確認 | 未整備の場合は別 PR で新設 |
| `apps/web/wrangler.toml` `[env.production].name` | `rg "ubm-hyogo-web-production" apps/web/wrangler.toml` | `[env.production].name = "ubm-hyogo-web-production"` |

> 本タスクは設計のみのため、上記確認は **Phase 5（実装）相当の別 PR 着手時** に最終確定する。本 Phase では「既存 ラッパー前提」「Cloudflare 系 script は新設想定」のみ記述する。

## 7. validation matrix（command 単位）

| # | コマンド | 用途 | 期待出力 | 出力貼付ルール |
| --- | --- | --- | --- | --- |
| 1 | `pnpm lint` | 別 PR の script 実装側で TypeScript / ESLint gate | エラー 0 | サマリのみ |
| 2 | `pnpm typecheck` | `RouteInventoryEntry` / `InventoryReport` 型整合 | エラー 0 | サマリのみ |
| 3 | `bash scripts/cf.sh whoami` | 認証確認（read-only） | アカウント名 | アカウント名のみ貼付 |
| 4 | （script dry-run）`bash scripts/cf.sh node scripts/cloudflare/route-inventory.ts --dry-run` | 出力 schema 確認（別 PR で実装後） | JSON / Markdown 雛形が schema に整合 | mismatches セクション配置を抜粋（値・token は貼らない） |

> #4 は別 PR の実装後に有効化する。本タスク Phase 11 では #1〜#3 のみで NON_VISUAL evidence を確保する。

## 8. 仕様語 ↔ 実装語対応表

| 仕様語 | 実装語 / 物理的な所在 |
| --- | --- |
| expectedWorker | `apps/web/wrangler.toml` の `[env.production].name = "ubm-hyogo-web-production"` |
| route pattern | Cloudflare API `GET /zones/{zone_id}/workers/routes` レスポンスの `pattern` |
| target worker name | 同 API レスポンスの `script` |
| custom domain | Cloudflare API `GET /accounts/{account_id}/workers/domains` レスポンスの `hostname` |
| zone | API レスポンスの `zone_name` または `zone_id` |
| source（api） | 上記 read-only API 経由で取得した entry |
| source（dashboard-fallback） | API で取得不能な場合に手動でダッシュボード参照値を JSON へ転記した entry（暫定経路） |
| ラッパー | `scripts/cf.sh`（`op run` + `mise exec` + `ESBUILD_BINARY_PATH`） |
| 親 runbook | `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md`（追記実行は本タスク対象外） |

## 9. 影響範囲・依存

| 影響範囲 | 内容 |
| --- | --- |
| `apps/web/wrangler.toml` | `[env.production].name` の正本（読み取りのみ。本タスクで変更しない） |
| `scripts/cf.sh` | 既存ラッパー（読み取りのみ。本タスクで変更しない） |
| 新設想定（別 PR）: `scripts/cloudflare/route-inventory.{ts,sh}` | 本タスクの設計対象。実装は別 PR |
| 親タスク #246 runbook | preflight 章への script 起動手順追記（本タスクでは実施しない） |
| Cloudflare 本番アカウント | read-only API call のみ。mutation 0 件 |

## 10. セキュリティ（重複明記 — aiworkflow-requirements 整合）

| 観点 | 方針 |
| --- | --- |
| `bash scripts/cf.sh` 強制 | 全 Cloudflare API call は ラッパー経由（CLAUDE.md C-1 / aiworkflow-requirements `deployment-cloudflare.md`）|
| read-only | mutation endpoint 0 件。allowlist は §2 表の 3 endpoint のみ |
| secret 漏洩防止 | 出力フィールドに値を含めない / API レスポンスを stdout に出さない / 自己 grep で fail-fast（§5.2） |
| `.env` 実値 Read 禁止 | op 参照のみ。script 側で `.env` を直接 fs.read しない |
| `wrangler login` 禁止 | OAuth トークン保持禁止（CLAUDE.md） |
| API Token / OAuth Token 転記禁止 | 出力 / 仕様書 / コミットメッセージに転記しない |

## テスト系縮退方針（Phase 4-7 への前提）

本タスクは docs-only / infrastructure-automation のため、Phase 4-7 は以下に縮退する:

| Phase | 通常タスクでの内容 | 本タスクでの内容 |
| --- | --- | --- |
| 4 (テスト作成) | 自動テスト実装 | 別 PR 実装側で残す type / contract test の観点設計（JSON schema 整合 / allowlist enforce / grep gate） |
| 5 (実装) | コード実装 | 仕様書 / 設計の最終整備のみ。コード生成は別 PR |
| 6 (テスト拡充) | 異常系自動テスト | 異常系シナリオ列挙（mutation endpoint 検出 / secret 値検出 / `wrangler` 検出 / dashboard-fallback 経路）と仕様書での扱い確認 |
| 7 (テストカバレッジ) | カバレッジ閾値 | AC-1〜AC-5 が設計章で完全カバーされる AC matrix |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 3 | 設計（§1〜§10）と縮退方針を base case として NO-GO 条件・テスト分類に渡す |
| Phase 4 | type / contract test 観点（JSON schema / allowlist / grep gate）の入力 |
| Phase 11 | NON_VISUAL evidence として `bash scripts/cf.sh whoami` 実行ログ + 出力例 mock JSON の placeholder |
| Phase 12 | unassigned-task として「実装 PR」「親 runbook 追記」「dashboard-fallback の自動化」を検出 |

## 多角的チェック観点

- CLAUDE.md ルール: 全コマンドが `bash scripts/cf.sh` 経由か。`wrangler` 直接実行が混入していないか。
- read-only 境界: §2 allowlist 表に mutation endpoint が含まれていないか。
- セキュリティ: secret 値・OAuth トークンを出力に含めない設計か。grep gate が §5.2 / Phase 3 で重複明記されているか。
- スコープ境界: 実装コード生成 / script 実行 / 親 runbook 追記実行 を **含まない** 旨が設計各所に明示されているか。
- aiworkflow-requirements 整合: `deployment-cloudflare.md` 規約と矛盾しないか。
- DI 境界: http client / cf.sh wrapper / output formatter が分離されているか。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計（主） | `outputs/phase-02/design.md` | §1 target topology / §3 data shape / §4 output writer / §5 safety boundary の集約 |
| 設計 | `outputs/phase-02/api-allowlist.md` | §2 read-only API endpoint allowlist + mutation 除外表 |
| 設計 | `outputs/phase-02/data-shape.md` | §3 TypeScript 型定義 + JSON schema + mismatch 抽出ロジック |
| メタ | artifacts.json | Phase 2 状態の更新 |

## 完了条件

- [ ] 4 concern（API call layer / data shape / output writer / safety boundary）すべてに章が割り当てられている
- [ ] §2 API endpoint allowlist 表が read-only 3 endpoint で確定し、mutation 除外表が併記されている
- [ ] §3 `RouteInventoryEntry` / `InventoryReport` 型定義と JSON schema 仮設計が記載されている
- [ ] §4 出力ファイル 2 形式（JSON + Markdown）の出力先と Markdown 雛形が記載されている
- [ ] §5 secret mask layer / grep gate / DI 境界 / `wrangler` 直接呼び出し禁止の自己検査が記載されている
- [ ] §7 validation matrix にコマンド単位で `pnpm lint` / `pnpm typecheck` / `bash scripts/cf.sh whoami` / dry-run の 4 件が列挙されている
- [ ] §8 仕様語 ↔ 実装語対応表が完成している
- [ ] §10 セキュリティ章で `bash scripts/cf.sh` 強制 / read-only / secret 漏洩防止が重複明記されている
- [ ] テスト系 Phase 4-7 の縮退方針が明示されている
- [ ] 上流ブロッカー（親タスク #246 preflight 完了）が依存順序に明記されている

## 次 Phase への引き渡し

- 次 Phase: 3 (テスト計画)
- 引き継ぎ事項:
  - §2 API endpoint allowlist を NO-GO 条件（mutation 検出）の入力にする
  - §3 JSON schema を Phase 4 contract test の入力にする
  - §5 grep gate を NO-GO 条件（secret 検出 / `wrangler` 検出）の入力にする
  - 親タスク #246 preflight 完了が前提条件であることを Phase 3 NO-GO 条件で重複明記
  - テスト縮退方針（Phase 4-7 を観点設計 + AC matrix に置換）を Phase 3 でテスト戦略として固定
- ブロック条件:
  - mutation endpoint が allowlist に混入
  - `wrangler` 直接実行が設計内に混入
  - secret 値貼付ルールが曖昧
  - 出力フィールドに値（token / secret）が含まれる設計
  - 親タスク #246 が未完了な状態で本タスクを着手
