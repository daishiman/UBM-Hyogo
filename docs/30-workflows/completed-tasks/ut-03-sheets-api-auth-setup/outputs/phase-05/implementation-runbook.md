# Phase 5: 実装ランブック（12 ステップ）

> **CLAUDE.md ルール厳守**: `wrangler` 直接実行禁止。Cloudflare 系 CLI は必ず `bash scripts/cf.sh` 経由。`.env` には実値を書かず `op://Vault/Item/Field` 参照のみ記述する。

## ステップ 0: 前提確認

```bash
# 01c-parallel-google-workspace-bootstrap が completed であること
ls docs/30-workflows/completed-tasks/01c-parallel-google-workspace-bootstrap/ 2>/dev/null

# Service Account が 1Password に登録済みであること（項目存在のみ確認）
op item list --vault "UBM-Hyogo" | grep -i "service.account"
```

検証: 該当 directory と vault item が存在すれば PASS。

## ステップ 1: Service Account 作成（Google Cloud Console）

1. https://console.cloud.google.com/iam-admin/serviceaccounts へ
2. プロジェクト `ubm-hyogo` を選択
3. 「サービスアカウントを作成」 → 名前: `ubm-sheets-sync`
4. ロール: 不要（Sheets スプレッドシート側で個別共有するため、IAM ロール付与は不要）
5. 完了後、Service Account メール（`ubm-sheets-sync@ubm-hyogo.iam.gserviceaccount.com`）を控える

検証: Service Accounts 一覧に該当 SA が表示される。

## ステップ 2: JSON key の発行とダウンロード

1. 作成した SA の「鍵」タブ → 「鍵を追加」 → JSON
2. ダウンロードした JSON を **直ちに 1Password へ移送**
3. ローカルに残った JSON ファイルを `shred -u` で削除

```bash
# 1Password CLI で登録（ファイル添付）
op item create --category="API Credential" --vault="UBM-Hyogo" \
  --title="Google Sheets Service Account (UT-03)" \
  "credential[concealed]=$(cat ~/Downloads/sa.json)"
shred -u ~/Downloads/sa.json
```

検証: `op item get "Google Sheets Service Account (UT-03)" --vault UBM-Hyogo` で取得可能。ローカルに JSON ファイルが残っていない。

## ステップ 3: 対象 Sheets への共有設定（**苦戦箇所 4 対策**）

1. UBM 兵庫支部会のフォーム回答先 Spreadsheet を開く
2. 共有 → SA メール（`ubm-sheets-sync@ubm-hyogo.iam.gserviceaccount.com`）を「閲覧者」として追加
3. 通知メール送信は OFF（SA はメール受信できない）

検証: Spreadsheet の共有ダイアログに SA メールが表示される。

## ステップ 4: `.env` に 1Password 参照を記述

```env
# .env（gitignore 済）
GOOGLE_SERVICE_ACCOUNT_JSON="op://UBM-Hyogo/Google Sheets Service Account (UT-03)/credential"
SHEETS_SPREADSHEET_ID="op://UBM-Hyogo/UBM Form Spreadsheet/id"
```

検証: `bash scripts/with-env.sh -- env | grep GOOGLE_SERVICE_ACCOUNT_JSON` で実値が解決される（出力は確認後 clear する）。

## ステップ 5: Cloudflare Secrets 配置（dev / staging / production）

```bash
# dev
echo -n "$GOOGLE_SERVICE_ACCOUNT_JSON" | bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env dev

# staging
bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env staging

# production
bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON --config apps/api/wrangler.toml --env production
```

検証: `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env>` で `GOOGLE_SERVICE_ACCOUNT_JSON` が表示される。

## ステップ 6: `.dev.vars` を local 用に作成

```bash
# apps/api/.dev.vars （NEVER commit）
echo "GOOGLE_SERVICE_ACCOUNT_JSON=$(op read 'op://UBM-Hyogo/Google Sheets Service Account (UT-03)/credential')" > apps/api/.dev.vars
```

検証: `cat apps/api/.dev.vars` で参照可能（直後にターミナル履歴を clear することを推奨）。

## ステップ 7: `.gitignore` ガード

```
# .gitignore
.dev.vars
**/.dev.vars
```

検証: `git check-ignore apps/api/.dev.vars` が exit 0。

## ステップ 8: `packages/integrations/google/src/sheets/auth.ts` 実装スケルトン

```ts
// packages/integrations/google/src/sheets/auth.ts
import { z } from "zod";

export const SheetsAuthEnvSchema = z.object({
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().min(1),
  SHEETS_SCOPES: z.string().default("https://www.googleapis.com/auth/spreadsheets.readonly"),
});
export type SheetsAuthEnv = z.infer<typeof SheetsAuthEnvSchema>;

const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

export async function getSheetsAccessToken(env: SheetsAuthEnv): Promise<{ accessToken: string; expiresAt: number }> {
  // 1. キャッシュヒット判定（TTL 1h、ただし期限 5 分前で再取得）
  // 2. parseServiceAccountJson(env)
  // 3. signJwt() — Web Crypto importKey + sign(RS256)
  // 4. exchangeJwtForAccessToken() — POST token_uri
  // 5. cache + return
  throw new Error("not implemented");
}
```

検証: `mise exec -- pnpm --filter @repo/integrations typecheck` が通る。

## ステップ 9: テスト実装（Phase 4 戦略に従う）

`packages/integrations/google/src/sheets/auth.test.ts` を作成し、Phase 4 の 16 ケースを実装。

検証: `mise exec -- pnpm --filter @repo/integrations test` が green。

## ステップ 10: build 確認

```bash
mise exec -- pnpm --filter @repo/integrations build
```

検証: Cloudflare Workers Edge Runtime 互換ビルドが成功（Node API 依存検出なし）。

## ステップ 11: 疎通確認（Phase 11 で正式実施）

```bash
# wrangler dev 起動（apps/api）
bash scripts/cf.sh dev --config apps/api/wrangler.toml

# 別ターミナルで token 取得確認エンドポイント（後段で /admin/sheets-auth-debug を実装する場合のみ）
curl -s http://localhost:8787/admin/sheets-auth-debug | jq '.tokenAcquired'
```

検証: `tokenAcquired: true` を確認。失敗時は Phase 6 異常系参照。

## ステップ 12: runbook 完了レビュー

- AC-3 / AC-4 / AC-5 / AC-10 を runbook で被覆できているか自己レビュー
- Phase 6 異常系へ引き渡す失敗パターンを洗い出す
