# Phase 12: 実装ガイド

## Part 1: 中学生レベル

### 例え話でわかる「CSP モード切替」

Web サイトでは、ブラウザへ「このページで許可されていること・されていないことのルール」を伝える仕組みがある。これを **CSP（コンテンツセキュリティポリシー）** と呼ぶ。

CSP には 2 つのモードがある。

| モード | 日常の例え | 動き |
|--------|-----------|------|
| `report-only`（レポートのみ） | 「違反を記録はするが、実際には止めない（お試し監視期間）」 | ルール違反を見つけてもブラウザはブロックせず、ログに記録するだけ |
| `enforce`（強制）| 「違反したら本当にブロックする（本番施行）」 | ルール違反を見つけたらブラウザが実際にブロックする |

今まではコードの中に `"report-only"` と固定で書き込まれていた（**ハードコード**）。これを環境変数 `CSP_MODE` というスイッチで切り替えられるようにする。

- **staging（検証環境）**: `CSP_MODE=enforce`（実際のユーザーがいないので、即 enforce で検証）
- **production（本番環境）**: `CSP_MODE=report-only`（まず違反を 1〜2 週間観察してから enforce に切り替える）

この切り替えはコードを変えずに設定ファイルの値を変えるだけでできる。安全に段階的に導入できる仕組みだ。

### 専門用語の説明

- **環境変数（env var）**: サーバーに渡す「設定値」。コードを変えずに動きを変えられる
- **zod**: 型の正しさをチェックする道具。間違った値（例: `CSP_MODE=banana`）が入ったらエラーを出す
- **middleware**: すべてのページレスポンスに自動的に処理を追加する仕組み

---

## Part 2: 技術者レベル

### 実装対象ファイルと責務

| ファイル | 変更内容 | 責務 |
|---------|---------|------|
| `apps/web/src/lib/env.ts` | `CSP_MODE` env var 追加 + `getSecurityHeaderEnv()` アクセサ新設 | env 検証・型提供の SSOT |
| `apps/web/middleware.ts` | `getSecurityHeaderEnv()` 経由へ配線変更 | CSP モードの取得元を env.ts に委譲 |
| `apps/web/wrangler.toml` | 各環境の `[vars]` に `CSP_MODE` 追加 | Cloudflare Workers binding での env 注入 |
| `apps/web/src/lib/env.spec.ts` | `getSecurityHeaderEnv` の TC-01〜04 追加 | env 層の単体テスト |
| `apps/web/playwright/tests/security-headers.spec.ts` | `process.env.CSP_MODE` 追従 + 反対ヘッダ absent assert 追加 | E2E HTTP レスポンス検証 |

変更禁止（実装済み SSOT）:

| ファイル | 理由 |
|---------|------|
| `apps/web/src/lib/security-headers.ts` | `SecurityHeaderMode` 型 + `buildSecurityHeaders` header 名切替 + `applySecurityHeaders` 実装済み |
| `apps/web/src/lib/security-headers.spec.ts` | enforce 単体テスト済み（回帰ガード） |

---

### 型・関数シグネチャ

#### `CSP_MODE` zod enum（`apps/web/src/lib/env.ts`）

```ts
// EnvSchema への追加
CSP_MODE: z.enum(["report-only", "enforce"]).default("report-only"),
```

#### `getSecurityHeaderEnv()` アクセサ

```ts
export function getSecurityHeaderEnv(
  rawEnv = readRawEnv()
): { cspMode: "report-only" | "enforce"; apiBaseUrl: string } {
  const parsed = EnvSchema.pick({
    NEXT_PUBLIC_API_BASE_URL: true,
    CSP_MODE: true,
  }).parse(rawEnv);
  return {
    cspMode: parsed.CSP_MODE,
    apiBaseUrl: parsed.NEXT_PUBLIC_API_BASE_URL,
  };
}
```

- `readRawEnv()` は既存のプロセス環境変数読み取り関数
- parse 失敗時（不正値・必須 env 欠損）は zod が throw → `apps/web/src/app/error.tsx` error boundary で捕捉。try/catch で握り潰さない

#### `SecurityHeaderMode` 型（`apps/web/src/lib/security-headers.ts`、変更禁止）

```ts
export type SecurityHeaderMode = "report-only" | "enforce";
```

---

### middleware 配線変更（`apps/web/middleware.ts`）

変更前（61 行目付近、ハードコード）:

```ts
buildSecurityHeaderConfig({ cspMode: "report-only" })
```

変更後（`getSecurityHeaderEnv()` 経由）:

```ts
import { getSecurityHeaderEnv } from "@/lib/env";

const { cspMode } = getSecurityHeaderEnv();
buildSecurityHeaderConfig({ cspMode })
```

---

### wrangler.toml vars 設定

```toml
# [vars] — ローカル開発・デフォルト
[vars]
CSP_MODE = "report-only"

# [env.staging.vars] — staging は enforce で即時検証
[env.staging.vars]
CSP_MODE = "enforce"

# [env.production.vars] — production は report-only で観察期間
[env.production.vars]
CSP_MODE = "report-only"
```

設定可能パラメータ:

| パラメータ | 型 | デフォルト | 値域 |
|----------|-----|---------|------|
| `CSP_MODE` | `"report-only" \| "enforce"` | `"report-only"` | `"report-only"` または `"enforce"` のみ許容 |

---

### Playwright smoke 追従ロジック

`apps/web/playwright/tests/security-headers.spec.ts` に以下のロジックを追加:

```ts
const cspMode = process.env.CSP_MODE ?? "report-only";
const expectedHeader =
  cspMode === "enforce"
    ? "content-security-policy"
    : "content-security-policy-report-only";
const absentHeader =
  cspMode === "enforce"
    ? "content-security-policy-report-only"
    : "content-security-policy";

// TC-07: mode 追従 + 反対ヘッダ absent
expect(response.headers()[expectedHeader]).toBeDefined();
expect(response.headers()[absentHeader]).toBeUndefined();

// TC-08: connect-src ディレクティブ存在確認
expect(response.headers()[expectedHeader]).toContain("connect-src");
```

---

### エラーハンドリング

| ケース | 動作 |
|-------|------|
| `CSP_MODE` に不正値（例: `"strict"`） | zod parse が throw → error boundary 捕捉 |
| `CSP_MODE` 未設定 | default `"report-only"` が適用される（throw しない） |
| `NEXT_PUBLIC_API_BASE_URL` 欠損 | EnvSchema が throw → error boundary 捕捉 |

---

### Production Cutover Ops Runbook

> **重要**: production の `enforce` 切替は **コード変更ではなく ops 設定変更のみ**。PR は不要。

#### 前提条件

- staging で `CSP_MODE=enforce` が 1 週間以上 green を維持していること
- Sentry CSP レポート（または `report-uri`）で production の違反件数が許容水準であること
- 切替作業前にバックアップ（rollback 手順確認）を完了していること

#### 切替手順

**Step 1**: `apps/web/wrangler.toml` を編集する

```toml
# [env.production.vars] を変更
[env.production.vars]
CSP_MODE = "enforce"    # "report-only" → "enforce" に変更
```

**Step 2**: 再デプロイ

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

**Step 3**: 動作確認

```bash
curl -I https://<production-url>/ | grep -i "content-security-policy"
# 期待: "content-security-policy:" ヘッダが出力される（report-only ではない）
```

#### Rollback 手順

```toml
# [env.production.vars] を元に戻す
[env.production.vars]
CSP_MODE = "report-only"    # "enforce" → "report-only" に戻す
```

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

---

## 視覚証跡 section

**UI/UX 変更なしのため Phase 11 スクリーンショット不要。**

本タスクはレスポンスヘッダの切替のみであり、ブラウザの画面描画に変化が生じない（NON_VISUAL）。

代替証跡は以下を参照:

| 証跡種別 | 参照先 |
|---------|-------|
| Phase 11 自動テスト結果（Vitest TC-01〜08 + 回帰） | `outputs/phase-11/manual-test-result.md` |
| Phase 10 最終レビュー | `outputs/phase-10/final-review.md` |
| security-headers.ts enforce 回帰テスト | `apps/web/src/lib/security-headers.spec.ts`（変更禁止・実装済み） |
