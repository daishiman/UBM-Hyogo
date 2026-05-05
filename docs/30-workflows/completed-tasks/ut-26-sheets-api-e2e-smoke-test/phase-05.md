# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-29 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | spec_created |
| タスク分類 | specification-design（runbook） |

## 目的

Phase 4 で確定した 4 層スイートに対する実装側のファイル一覧（新規・修正）と段階的 runbook を確定し、smoke route 追加 → wrangler dev でのローカル疎通 → staging deploy → curl による実 API 疎通までを 1 本の runbook で追えるようにする。production 書き込みを発生させず、SA JSON 平文をログ・PR に残さない安全制御を runbook 内で恒常化する。

## 真の論点

- smoke route は dev / staging のみで有効であり、production には絶対に露出させない。`wrangler.toml` の env 分岐 + `SMOKE_ADMIN_TOKEN` の二重制御で担保する。
- ローカル → staging の段階的 sanity check 順序を破ると、Web Crypto 署名失敗と改行コード破損の一次原因の切り分けができなくなる。

## 実行タスク

1. 新規作成ファイル一覧を確定する（完了条件: パス・役割・依存関係を含む表が完成）。
2. 修正ファイル一覧を確定する（完了条件: 既存 export を破壊しない差分が示される）。
3. 順序付き runbook（Step 0〜5）を完成する（完了条件: 事前ビルド → 実装 → wrangler dev → staging deploy → curl の順序で漏れ無し）。
4. smoke route の擬似コード（JWT 生成 → token 取得 → values.get → 構造化ログ出力）を記述する（完了条件: 4 ステップが読み取れる）。
5. sanity check（local → staging の段階的確認手順）を整備する（完了条件: 各段階で「次に進む条件」が記述）。
6. canUseTool 適用範囲を明記する（完了条件: 本タスク内での該当ステップ判定がある）。
7. SA JSON / access token のマスキング規約（4 桁末尾のみ表示等）を runbook に固定する（完了条件: ログ・PR 出力例で平文が残らない）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-02.md | smoke route / cache 設計 |
| 必須 | docs/30-workflows/ut-26-sheets-api-e2e-smoke-test/phase-04.md | 検証ファイルパスと wire-in |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secret 注入手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | smoke route 認可基準 |
| 参考 | https://developers.cloudflare.com/workers/configuration/environments/ | wrangler env 分岐 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | Workers Web Crypto |

## 新規作成ファイル一覧

| パス | 役割 | 主な依存 |
| --- | --- | --- |
| `apps/api/src/routes/admin/smoke-sheets.ts` | `GET /admin/smoke/sheets` Hono handler。dev/staging のみ有効、`SMOKE_ADMIN_TOKEN` 検証、`sheets-auth` 経由で疎通実行 | `apps/api/src/jobs/sheets-fetcher`、`hono` |
| `apps/api/src/routes/admin/smoke/index.ts` | `/admin/smoke/*` グループルータの集約 export | hono |
| `apps/api/src/lib/smoke/format-result.ts` | レスポンスサマリー（sheetTitle / rowCount / sample のマスキング）の純粋関数 | なし |
| `apps/api/test/routes/admin/smoke/sheets.test.ts` | unit + authorization スイート（4 ケース） | vitest, miniflare |
| `apps/api/test/lib/smoke/format-result.test.ts` | format-result 純粋関数の unit | vitest |

> 既存 `apps/api/src/jobs/sheets-fetcher.ts` は UT-03 で実装済。本タスクで機能追加はしない（再利用のみ）。

## 修正ファイル一覧

| パス | 修正内容 |
| --- | --- |
| `apps/api/src/index.ts` | `/admin/smoke/*` ルート登録。`env.ENVIRONMENT === "production"` 時は登録自体をスキップ（既存ルート破壊しない） |
| `apps/api/wrangler.toml` | `[env.dev.vars]` / `[env.staging.vars]` に `SHEETS_SPREADSHEET_ID` 追加。`[env.production]` には smoke route 用の binding を追加しない |
| `apps/api/.dev.vars.example` | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN` のキー名のみ列挙（実値は op 参照） |

## runbook

### Step 0: 事前準備（Phase 4 引き継ぎ）

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter ./apps/api build  # esbuild darwin mismatch 防止
```

> 進む条件: build が成功し `apps/api/.open-next` 等の中間生成物が出力されること。

### Step 1: Secret / Variable の確認（新規登録ではなく UT-25 配置済の確認のみ）

```bash
# staging に既に配置済であることを確認（値は表示しない）
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep GOOGLE_SHEETS_SA_JSON
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging | grep SMOKE_ADMIN_TOKEN

# ローカル開発用 .dev.vars は op run 経由で揮発的に注入（実値はファイルに書かない）
# .dev.vars には `GOOGLE_SHEETS_SA_JSON=op://UBM-Hyogo/staging/sa_json` のような参照のみ記述
```

> 進む条件: `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` / `SMOKE_ADMIN_TOKEN` の 3 件が staging に存在。新規登録は本タスクのスコープ外（UT-25）。

### Step 2: 実装（モジュール順 / TDD Red→Green）

1. `apps/api/test/lib/smoke/format-result.test.ts` を Red で書く → `format-result.ts` 実装で Green
2. `apps/api/test/routes/admin/smoke/sheets.test.ts` を Red で書く（authorization 4 ケース + production 拒否）→ `sheets.ts` 実装で Green
3. `apps/api/src/routes/admin/smoke/index.ts` 集約 export
4. `apps/api/src/index.ts` で `if (env.ENVIRONMENT !== "production") app.route("/admin/smoke", smokeRouter)` の形でガード付き登録
5. `apps/api/wrangler.toml` の `[env.dev.vars]` / `[env.staging.vars]` を更新

### Step 3: ローカル sanity check（wrangler dev / remote mode）

```bash
# .dev.vars を op run 経由で揮発的に流し込みつつ wrangler dev を起動
bash scripts/cf.sh dev --config apps/api/wrangler.toml --env staging --remote

# 別タブで疎通
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  http://127.0.0.1:8787/admin/smoke/sheets | jq

# 期待: {"ok":true,"env":"staging","spreadsheetId":"...XXXX","sheetTitle":"...","rowCount":N,"latencyMs":...,"tokenFetchesDuringSmoke":false}
```

> 進む条件: HTTP 200 + `ok=true`。401/403 が返る場合は Phase 6 異常系の切り分け runbook へ。

### Step 4: token cache 確認

```bash
# 1 秒以内に 2 回連続呼び出し
for i in 1 2; do
  curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
    http://127.0.0.1:8787/admin/smoke/sheets | jq '.tokenFetchesDuringSmoke'
done
# 期待: 1 回目 false / 2 回目 true
```

### Step 5: staging deploy → 実 API 疎通

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# staging エンドポイントへ curl
curl -sS -H "Authorization: Bearer ${SMOKE_ADMIN_TOKEN}" \
  https://api-staging.example.com/admin/smoke/sheets | jq

# Workers ログを観測
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging
# 期待: structured log {event:"sheets_smoke_test", status:"success", latency_ms:<n>}
```

> 進む条件: staging で HTTP 200 + Workers Logs に success エントリ。Phase 11 manual-smoke-log.md へ転記。
> 禁止: `--env production` のオプションは本タスクで一切使用しない。

## 擬似コード（smoke route）

```ts
// apps/api/src/routes/admin/smoke-sheets.ts
import { Hono } from "hono";
import { getAccessToken, fetchValues } from "@ubm/integrations/sheets-auth";
import { formatResult } from "@/lib/smoke/format-result";

export const smokeSheets = new Hono<{ Bindings: Env }>();

smokeSheets.get("/sheets", async (c) => {
  // 1. production 露出ガード（多重防御）
  if (c.env.ENVIRONMENT === "production") return c.notFound();

  // 2. SMOKE_ADMIN_TOKEN 検証
  const auth = c.req.header("Authorization") ?? "";
  if (auth !== `Bearer ${c.env.SMOKE_ADMIN_TOKEN}`) {
    return c.json({ ok: false, code: "UNAUTHORIZED" }, 401);
  }

  const startedAt = Date.now();
  try {
    // 3. JWT 生成 → access token 取得（cache あり）
    const { accessToken, cacheHit } = await getAccessToken(c.env);

    // 4. spreadsheets.values.get（A1 range は固定 dev range）
    const range = "A1:Z10"; // schema をコードに固定しない（存在検証のみ）
    const valueRange = await fetchValues(c.env, {
      accessToken,
      spreadsheetId: c.env.SHEETS_SPREADSHEET_ID,
      range,
    });

    // 5. 構造化ログ出力（access_token / SA JSON は出さない）
    const result = formatResult({
      env: c.env.ENVIRONMENT,
      spreadsheetId: c.env.SHEETS_SPREADSHEET_ID,
      valueRange,
      latencyMs: Date.now() - startedAt,
      tokenFetchesDuringSmoke: cacheHit,
    });
    console.log(JSON.stringify({ event: "sheets_smoke_test", status: "success", ...result }));
    return c.json({ ok: true, ...result });
  } catch (e) {
    const code = classifySheetsError(e); // SHEETS_AUTH_FAILED / SHEETS_FORBIDDEN / SHEETS_NOT_FOUND / SHEETS_429 / SHEETS_5XX
    console.log(JSON.stringify({ event: "sheets_smoke_test", status: "error", code, latency_ms: Date.now() - startedAt }));
    return c.json({ ok: false, code }, mapStatus(code));
  }
});
```

## sanity check（local → staging の段階的確認）

| 段階 | コマンド | 期待 | 失敗時の Phase 6 参照 |
| --- | --- | --- | --- |
| 1. unit/authorization | `pnpm --filter ./apps/api vitest run apps/api/test/routes/admin/smoke/sheets.test.ts` | 全 Green | Phase 4 のテスト戦略再確認 |
| 2. wrangler dev (remote) success | `curl http://127.0.0.1:8787/admin/smoke/sheets` | 200 / ok:true | Case 6.1（401）/ 6.2（403） |
| 3. wrangler dev cache | 2 回連続 curl | 2 回目 cacheHit=true | Case 6.7（cache 不全） |
| 4. staging deploy | `bash scripts/cf.sh deploy --env staging` | exit 0 | Case 6.6（deploy 失敗） |
| 5. staging success | staging URL へ curl | 200 / ok:true | Case 6.1〜6.5 |
| 6. Workers Logs | `wrangler tail --env staging` | success エントリ | Case 6.7 |

## canUseTool 適用範囲

- 本 Phase 内で claude-code CLI からの自動編集が必要な場面: 新規ファイル 5 件の生成、`apps/api/src/index.ts` のルート登録差分、`wrangler.toml` 編集。
- canUseTool による事前承認: `bash scripts/cf.sh deploy` および `bash scripts/cf.sh secret put` は人手承認が必要なため Edit / Write のみ許可。
- N/A: production への deploy は本タスク全体で対象外。

## SA JSON / token マスキング規約

- ログ・PR 説明・コミットメッセージに `access_token` / `private_key` / SA JSON 全文を出力しない。
- `spreadsheetId` は末尾 4 桁のみ表示（例: `...3Xg`）。
- `sampleRowsRedacted` は値の存在確認のみで、メールアドレス・氏名等の PII は含めない。
- 違反検出: PR 上で `rg -n 'BEGIN PRIVATE KEY|access_token=' --hidden` を実行し、ヒット 0 件であることを確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | targeted vitest 2 件を runbook Step 2 に紐付け |
| Phase 6 | 擬似コードの例外パス（401/403/404/429/5xx）を failure case 入力 |
| Phase 9 | coverage 実測 + 無料枠見積もり |
| Phase 11 | Step 3〜5 の sanity check を staging で再実行・記録 |

## 多角的チェック観点

- 価値性: runbook 通りに進めれば AC-1/AC-2/AC-4/AC-6 が満たせるか。
- 実現性: Workers Edge Runtime 上で Web Crypto API による RSA-SHA256 署名が成立するか（Step 3 で初めて実機確定）。
- 整合性: 既存 `apps/api/src/index.ts` を破壊しない差分か。
- 運用性: production への誤露出が `if (env.ENVIRONMENT !== "production")` ガード + `SMOKE_ADMIN_TOKEN` の二重で守られているか。
- セキュリティ: SA JSON / access token がログ・PR・コミットに平文で残らないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | 新規ファイル 5 件確定 | spec_created |
| 2 | 修正ファイル 3 件確定 | spec_created |
| 3 | runbook Step 0〜5 確定 | spec_created |
| 4 | 擬似コード記述 | spec_created |
| 5 | sanity check（6 段階）整備 | spec_created |
| 6 | canUseTool 範囲判定 | spec_created |
| 7 | マスキング規約固定 | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/implementation-runbook.md | 新規/修正ファイル一覧・runbook・擬似コード・sanity check |
| メタ | artifacts.json | Phase 5 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 新規作成ファイル 5 件が一覧化
- [ ] 修正ファイル 3 件が一覧化
- [ ] runbook が Step 0〜5 で順序付き
- [ ] 擬似コードに JWT 生成 → token 取得 → values.get → 構造化ログの 4 ステップを含む
- [ ] sanity check が local → staging の 6 段階で「次に進む条件」付き
- [ ] canUseTool 適用範囲が明記（N/A 含む）
- [ ] SA JSON / access token のマスキング規約が固定
- [ ] production deploy が runbook に一切登場しない

## タスク100%実行確認【必須】

- 実行タスク 7 件が `spec_created`
- 成果物が `outputs/phase-05/implementation-runbook.md` に配置済み
- Phase 4 のテストファイルパスが runbook 内 Step 2 に紐付けされている
- Step 1（Secret 確認）・Step 5（staging deploy）の省略が無い
- production 環境は runbook 全体で禁止句として扱われている

## 次 Phase への引き渡し

- 次 Phase: 6 (異常系検証)
- 引き継ぎ事項:
  - 擬似コード上の例外パス（classifySheetsError）が Phase 6 failure case の入力
  - Step 3〜5 のローカル / staging 検証手順を Phase 11 が再利用
  - マスキング規約 → Phase 11 / Phase 13 PR 作成での違反検出
- ブロック条件:
  - production 露出ガードが二重化されていない
  - SA JSON が `.dev.vars` に平文で残っている
  - sanity check の段階的確認が破られている
