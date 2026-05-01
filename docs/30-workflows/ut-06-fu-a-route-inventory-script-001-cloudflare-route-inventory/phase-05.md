# Phase 5: 実装（テンプレート化 / handoff 設計）

> **本タスクは docs-only / infrastructure-automation である**。実コード（`.ts` / `.sh` / fixture / test 本体）は本 PR では生成しない。本 Phase の「実装」は **実装テンプレート（擬似コード設計） / `cf.sh` 経由 invocation 設計 / 受け側実装タスクへの handoff 仕様** の 3 文書を作成し、実装本体は **後続の unassigned-task として起票** する経路に固定する。
>
> 本 Phase の outputs は `template_created` 状態で確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production Worker route inventory script (UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-001) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装（テンプレート化 / handoff 設計） |
| 作成日 | 2026-05-01 |
| 前 Phase | 4 (テスト作成 / test plan 仕様化) |
| 次 Phase | 6 (コードレビュー観点定義) |
| 状態 | spec_created |
| タスク分類 | specification-design（implementation-template / handoff） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| 親タスク | UT-06-FU-A (`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/`) |
| 親 GitHub Issue | #246 |
| 本タスク GitHub Issue | #328 (CLOSED 状態のまま spec 作成) |

## 目的

route / custom domain inventory を取得する script の **実装テンプレート（擬似コード設計）** を確定し、`bash scripts/cf.sh` 経由の invocation 設計と output ファイルレイアウトを固定する。実装本体は受け側実装タスクが起票後に行う。本 Phase で確定させる範囲は以下:

- 配置 path 候補（`scripts/cloudflare/route-inventory.ts` または `.sh`）と擬似コード骨格
- `bash scripts/cf.sh` 経由の invocation 設計（read-only API / wrapper 統一）
- output ファイル `outputs/route-inventory.json` / `outputs/route-inventory.md` のレイアウト
- 親 UT-06 production deploy runbook へ inventory 実行ステップを差し込む箇所
- 受け側実装タスクへの handoff（タスク ID は未確定として記録 / unassigned-task として後続起票方針）

## 実行タスク

1. 配置 path / 言語選定（`.ts` vs `.sh`）の trade-off を整理し決定理由を記述する（完了条件: 採用案・代替案・選定理由が表で明示）。
2. 擬似コード骨格（main / API call / parse / mismatch detect / output write）を関数単位で記述する（完了条件: 5 関数すべてに input / output / 副作用が明記）。
3. `cf.sh` 経由 invocation 設計（呼び出し例 / 環境変数注入経路 / read-only scope の確認）を記述する（完了条件: 呼び出し例 3 件以上、`wrangler` 直叩きゼロ）。
4. output ファイル 2 種（JSON / Markdown）のレイアウト雛形を記述する（完了条件: JSON sample / Markdown sample の両方が記載され Phase 4 `RouteInventoryEntry` schema と整合）。
5. 親 UT-06 production deploy runbook（`docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md`）への差し込み箇所と追記文面を確定する（完了条件: 差し込み節番号と追記内容雛形が記述）。
6. 受け側実装タスクへの handoff 文書（タスク ID 未確定 / unassigned-task として後続起票 / 入力資料 / 完了条件 / 検証コマンド）を作成する（完了条件: handoff 文書 5 セクションが揃う）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-fu-a-route-inventory-script-001-cloudflare-route-inventory/phase-04.md | test plan / `RouteInventoryEntry` schema |
| 必須 | docs/30-workflows/unassigned-task/UT-06-FU-A-route-inventory-script-001.md | スコープ / 完了条件 / リスク |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/phase-05.md | 親タスク runbook / 配置先（差し込み箇所の出典） |
| 必須 | docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md | runbook 草稿（追記対象） |
| 必須 | scripts/cf.sh | wrapper の現行実装（invocation 設計の参照点） |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `scripts/cf.sh` 経由必須 |
| 参考 | https://developers.cloudflare.com/api/operations/worker-routes-list-routes | route list API（GET のみ使用） |
| 参考 | https://developers.cloudflare.com/api/operations/worker-domain-list-domains | custom domain list API（GET のみ使用） |

## 配置 path / 言語選定

| 案 | 配置 path | 採用 | 理由 |
| --- | --- | --- | --- |
| A | `scripts/cloudflare/route-inventory.ts` | **採用候補** | 型定義（`RouteInventoryEntry`）を共有可 / vitest で unit test 可 / 外部入口は `bash scripts/cf.sh route-inventory` に集約可 |
| B | `scripts/cloudflare/route-inventory.sh` | 代替 | 軽量・依存少 / ただし schema 整合と test 容易性で劣る |
| C | `apps/api` 内コマンド | 不採用 | API runtime 配置は責務違反（read-only オペレーション script は repo `scripts/` 配下が妥当） |

> 最終決定は受け側実装タスクで行う。本 Phase は案 A を採用候補として擬似コードを記述し、案 B 採用時の差分（型廃止・jq による parse）を備考にまとめる。

## 擬似コード骨格（案 A: TypeScript）

> ファイル名はあくまで設計時点の候補で、実装時の調整を妨げない。

```
// scripts/cloudflare/route-inventory.ts （疑似コード・実装は受け側タスク）

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
// 4. buildInventoryReport(entries: RouteInventoryEntry[], expectedWorker: string): InventoryReport
//    expectedWorker = "ubm-hyogo-web-production"
//    mismatches = entries.filter(entry => entry.targetWorker !== expectedWorker)
//    entry ごとの competing mismatch field は作らない
//
// 5. writeOutput(report: InventoryReport, outputDir: string): void
//    JSON: outputs/route-inventory.json
//    Markdown: outputs/route-inventory.md
//    secret pattern grep を最終 output に対して実行し、検出時 throw（safety guard）
```

各関数の input / output / 副作用は test plan UT-01〜UT-08 と直接対応する（Phase 4 参照）。

### 案 B 採用時の差分（参考）

- `RouteInventoryEntry` schema は jq クエリで生成（型 SSOT は失われる）
- `cf.sh` 経由のレスポンスを `jq` で parse して JSON 出力 / `awk` で Markdown 表生成
- safety guard は `grep -nE` の正規表現で実装

## `cf.sh` 経由 invocation 設計

```bash
# 認証確認（cf.sh が op 経由で CLOUDFLARE_API_TOKEN を環境変数として揮発的に注入）
bash scripts/cf.sh whoami

# inventory 実行（案 A 採用時。入口は cf.sh サブコマンドに集約）
bash scripts/cf.sh route-inventory \
  --account-id <ACCOUNT_ID プレースホルダ・実値は op 参照経由> \
  --output-dir outputs/ \
  --expected-worker ubm-hyogo-web-production

# inventory 実行（案 B 採用時も外部入口は同じ）
bash scripts/cf.sh route-inventory \
  --account-id <ACCOUNT_ID プレースホルダ> \
  --output-dir outputs/ \
  --expected-worker ubm-hyogo-web-production
```

> いずれの案でも token 値・OAuth トークン値は CLI 引数に渡さず、`cf.sh` ラッパーが op 経由で環境変数として注入する経路に統一する。`wrangler` 直叩きはどの段階でも禁止。

### read-only scope の遵守

- 利用 API endpoint は **GET のみ**（route list / custom domain list）
- POST / PUT / PATCH / DELETE は呼ばない（safety test ST-02 で検出）
- `secret put` / `secret delete` / `deploy` 系の `cf.sh` サブコマンドは本 script から呼び出さない

## output ファイルレイアウト

### JSON: `outputs/route-inventory.json`

```json
{
  "generatedAt": "2026-05-01T00:00:00.000Z",
  "expectedWorker": "ubm-hyogo-web-production",
  "entries": [
    {
      "pattern": "<host>/*",
      "targetWorker": "ubm-hyogo-web-production",
      "zone": "<MASKED>",
      "source": "api",
      "notes": ""
    },
    {
      "pattern": "<legacy-host>/*",
      "targetWorker": "<旧 Worker 名>",
      "zone": "<MASKED>",
      "source": "api",
      "notes": "legacy worker still has route"
    }
  ],
  "mismatches": [
    {
      "pattern": "<legacy-host>/*",
      "targetWorker": "<旧 Worker 名>",
      "zone": "<MASKED>",
      "source": "api",
      "notes": "legacy worker still has route"
    }
  ]
}
```

> 上記は **schema 整合確認用の構造例** であり、`<host>` / `<旧 Worker 名>` は受け側実装タスクで実値に置き換える。本 Phase のテンプレートでは secret / Token / 個人情報を一切埋め込まない。

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

> 列順・列名は Phase 4 contract test CT-04 で固定された field 名に一致させる。

## 親 UT-06 production deploy runbook への差し込み

| 差し込み先 runbook | 節 | 追記内容 |
| --- | --- | --- |
| `docs/30-workflows/completed-tasks/ut-06-fu-a-prod-route-secret-001-worker-migration-verification/outputs/phase-05/runbook.md` | route / custom domain 突合手順の前段 | 「dashboard 操作の前に本 inventory script を実行し `outputs/route-inventory.json` / `.md` を evidence として添付する」旨を 1 段落追記 |
| 同上 | 節 2（Worker inventory）末尾 | 旧 Worker 名 / 新 Worker 名の inventory ソースを「dashboard 手動 + 本 script API 出力」の二重化にする旨を追記 |
| 同上 | 節 0（前提と禁止事項） | 本 script が read-only であり mutation を行わない旨、`bash scripts/cf.sh` 経由でのみ実行する旨を追記 |

> 親 runbook の編集は受け側実装タスクで実施する。本 Phase では追記文面の **雛形** を確定する。

## 受け側実装タスクへの handoff

| 項目 | 内容 |
| --- | --- |
| 受け側タスク ID | **未確定**。本 Phase 完了後に **unassigned-task として後続起票**（命名候補: `UT-06-FU-A-ROUTE-INVENTORY-SCRIPT-IMPL-001`） |
| 起票場所 | `docs/30-workflows/unassigned-task/<受け側タスク slug>.md` |
| 入力資料 | 本タスクの phase-04.md / phase-05.md / phase-06.md（特に test plan / `RouteInventoryEntry` schema / 擬似コード骨格 / safety guard） |
| 実装範囲 | (1) script 本体（案 A or 案 B から選択）/ (2) test 本体（unit / contract / safety）/ (3) fixture / (4) 親 runbook 追記 |
| 完了条件（受け側） | unit / contract / safety すべて PASS / inventory 実 production 出力で旧 Worker route 件数 = 0 が確認できる / 親 runbook に追記済み |
| 検証コマンド（受け側） | `pnpm typecheck` / `pnpm lint` / `pnpm test` / `bash scripts/cf.sh whoami` / inventory script 実行による read-only 動作確認 |
| 引き継ぎ警告 | `wrangler` 直叩き禁止 / secret 値・Token 値を fixture・出力・log に残さない / mutation method 呼び出し禁止 / `wrangler login` 禁止 |

## セキュリティガード（実装テンプレ冒頭で固定）

- secret 値 / OAuth トークン値 / API Token 値の出力・log・fixture・コミット・PR への転記禁止
- `.env` の `cat` / `Read` / `grep` 禁止（値は op 参照のみだが慣性事故防止）
- `wrangler login` 禁止（ローカル OAuth トークン保持禁止）
- `wrangler` 直叩き禁止（`bash scripts/cf.sh` ラッパーのみ）
- mutation HTTP method (POST/PUT/PATCH/DELETE) を script から発行しない
- 出力ファイルをコミット前にレビューし、上記値が混入していないことを確認

## canUseTool 適用範囲

- 自動編集を許可: 仕様文書（`Write` / `Edit`）、擬似コード文書、handoff 文書
- 人手承認必須:
  - 受け側実装タスク起票（unassigned-task 追加）
  - 親 UT-06 runbook への追記反映（受け側タスクで実施）
- 該当なし: 本 Phase で実 script コード / 実 test コードを書く行為（**禁止**）

## 実行手順

1. 本ドキュメントの「擬似コード骨格」と「`cf.sh` 経由 invocation 設計」と「output レイアウト」を `outputs/phase-05/implementation-template.md` に転記する。
2. `cf.sh` invocation 設計と read-only scope 遵守ルールを `outputs/phase-05/cf-script-invocation-design.md` に切り出して保存する。
3. 受け側実装タスクへの handoff 仕様を `outputs/phase-05/handoff-to-implementation-task.md` に保存する（受け側タスク ID は未確定として記録）。
4. 親 UT-06 runbook 差し込み箇所の追記文面雛形が記述されていることを確認。
5. JSON / Markdown 雛形が Phase 4 `RouteInventoryEntry` schema と整合していることを確認。
6. `wrangler` 直叩きが本ドキュメント内にゼロ件であることを `grep` で確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | test plan の UT/CT/ST を擬似コード骨格と output レイアウトに対応付け |
| Phase 6 | review checklist で擬似コード骨格 / invocation 設計 / output 形式の review 観点を確定 |
| Phase 7 | AC × 実装テンプレ × handoff のトレース表 |
| Phase 11 | 受け側実装タスクで実 evidence（inventory 実行ログ）を生成 |
| Phase 12 | 受け側実装タスク起票を unassigned-task-detection に登録 |

## 多角的チェック観点

- 価値性: 親タスクの「dashboard 手順寄り」課題が本 script で機械化されるか。
- 実現性: 案 A / 案 B どちらも `cf.sh` 経由で完結するか / 既存 `scripts/` 慣習に沿うか。
- 整合性: 擬似コード関数群が Phase 4 test ID と 1:1 対応するか / output 形式が Phase 4 schema と整合するか。
- 運用性: 受け側実装タスクが本 Phase 仕様だけで実装着手できる粒度か。
- セキュリティ: read-only scope / secret leak guard / mutation 禁止が擬似コードと invocation 設計の両方に組み込まれているか。
- 認可境界: 親 runbook 追記反映が受け側実装タスクの責務として明記されているか。
- 境界明確化: docs-only / 実コード非生成が冒頭で宣言され、受け側タスクへの handoff が明示されているか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 配置 path / 言語選定（案 A / 案 B / 案 C） | spec_created |
| 2 | 擬似コード骨格（5 関数） | spec_created |
| 3 | `cf.sh` 経由 invocation 設計 | spec_created |
| 4 | output JSON / Markdown レイアウト | spec_created |
| 5 | 親 UT-06 runbook 差し込み雛形 | spec_created |
| 6 | 受け側実装タスクへの handoff 文書 | spec_created |

## 成果物

| 種別 | パス | 説明 | 状態 |
| --- | --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-template.md | 配置 path / 擬似コード骨格 / output レイアウト | template_created |
| ドキュメント | outputs/phase-05/cf-script-invocation-design.md | `cf.sh` 経由 invocation / read-only scope 遵守 | template_created |
| ドキュメント | outputs/phase-05/handoff-to-implementation-task.md | 受け側実装タスク（タスク ID 未確定 / unassigned-task として後続起票） | template_created |
| メタ | artifacts.json | Phase 5 状態更新（spec_created） | spec_created |

> 本 Phase は **実 script コード / 実 test コードを生成しない**。受け側実装タスクが本仕様を入力として実装する。

## 完了条件

- [ ] 配置 path / 言語選定が案 A / 案 B / 案 C の 3 案で trade-off 表が完成
- [ ] 擬似コード骨格が 5 関数（main / fetchRoutes / fetchCustomDomains / detectMismatch / writeOutput）で input / output / 副作用が明記
- [ ] `cf.sh` 経由 invocation 例が 3 件以上記述され `wrangler` 直叩きゼロ
- [ ] output JSON / Markdown 雛形が Phase 4 `RouteInventoryEntry` schema と整合
- [ ] 親 UT-06 runbook 差し込み箇所（節 0 / 節 2 / 節 3）に追記文面雛形が記述
- [ ] 受け側実装タスクへの handoff 文書（タスク ID 未確定 / 起票場所 / 入力資料 / 実装範囲 / 完了条件 / 検証コマンド / 引き継ぎ警告）が完成
- [ ] セキュリティガード 6 項目が実装テンプレ冒頭で固定
- [ ] 本 Phase outputs 3 件が `template_created` 状態で確定

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物 3 件（implementation-template.md / cf-script-invocation-design.md / handoff-to-implementation-task.md）が `outputs/phase-05/` に配置済み
- 受け側実装タスクが unassigned-task として後続起票される方針が記述
- secret 値・Token 値を fixture・output・log に残さないルールが冒頭で明示
- 本 Phase は **コードを書かない** docs-only タスクであることが冒頭で再宣言

## 次 Phase への引き渡し

- 次 Phase: 6 (コードレビュー観点定義)
- 引き継ぎ事項:
  - 擬似コード骨格 → review checklist の「実装観点」セクションで read-only 制約・secret leakage 防止・wrangler 直叩き検出を定義
  - safety guard 3 種（Phase 4） → review checklist の「security」セクションに昇格
  - handoff 文書 → Phase 6 でレビュー指摘の受け側タスクへの引き継ぎ仕様に反映
- ブロック条件:
  - 擬似コード骨格が 5 関数未満で Phase 6 に進む
  - `wrangler` 直叩きが implementation template / invocation 設計に残存
  - 受け側実装タスクへの handoff 文書が未完成
  - output レイアウトが Phase 4 schema と不整合
