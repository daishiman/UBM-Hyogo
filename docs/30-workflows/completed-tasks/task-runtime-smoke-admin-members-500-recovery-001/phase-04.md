# Phase 4: 実装方針（変更ファイル・関数シグネチャ）

[実装区分: 実装仕様書]

## 1. 変更 1: `GET /admin/members` の 500 path に context 付き log と safe error body を追加

**ファイル**: `apps/api/src/routes/admin/members.ts`

### 変更点
- `app.get("/members", ...)` のハンドラを try/catch で wrap
- catch path で `logError("UBM-ADMIN-MEMBERS-500", { phase, message })` を呼び、500 body に `{ ok:false, error:"internal", code:"UBM-ADMIN-MEMBERS-500" }` を返す
- zod 失敗 path も同じ shape に揃える

### 想定シグネチャ
```ts
const handleAdminMembers = async (c: Context<...>): Promise<Response> => {
  try {
    // 既存ロジック
    const view = { total, members, page, pageSize };
    const parsedView = AdminMemberListViewZ.safeParse(view);
    if (!parsedView.success) {
      logError("UBM-ADMIN-MEMBERS-500", { phase: "zod", issues: parsedView.error.flatten() });
      return c.json({ ok: false, error: "internal", code: "UBM-ADMIN-MEMBERS-500" }, 500);
    }
    return c.json(parsedView.data, 200);
  } catch (err) {
    logError("UBM-ADMIN-MEMBERS-500", {
      phase: "exception",
      name: (err as Error)?.name,
      message: (err as Error)?.message,
    });
    return c.json({ ok: false, error: "internal", code: "UBM-ADMIN-MEMBERS-500" }, 500);
  }
};
```

> `logError` は既存 `apps/api/src/lib/logger.ts` の `logError(payload)` を再利用する。`apps/api/src/lib/log.ts` は新設しない。secret は出力しない。

## 2. 変更 2: 仮説の根因に対する fix
Phase 2 step A/B/C 結果に応じて以下のいずれか 1 件以上を実施する：

### 2a. zod safeParse 失敗だった場合
- 不正値（`publishState` null/未知値、`lastSubmittedAt` 不正 ISO）の正規化を view 構築で完結させる
- legacy `published` は `public`、legacy `private` は `hidden` として意味を保ち、`filter=published|hidden` の SQL 条件でも同じ legacy 値を含める
- `publishState: row.publish_state ?? "member_only"` の現状実装が `?? "member_only"` のため null は通るが、想定外文字列を `as "public" | "member_only" | "hidden"` でキャストするのが zod fail の温床。enum 外は `"member_only"` に縮退させる

```ts
const normalizePublishState = (v: string | null): "public" | "member_only" | "hidden" =>
  v === "public" || v === "published" ? "public" :
  v === "hidden" || v === "private" ? "hidden" :
  "member_only";
```

同様に `publicConsent` / `rulesConsent` を `"consented" | "declined" | "unknown"` enum 縮退関数で確定。

### 2b. SQL: 列・テーブル不在だった場合
- 該当 migration を `apps/api/migrations/` で確認、staging に未適用なら apply（`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`）
- migration 自体が存在しない場合は新規追加（連番 `NNNN_<slug>.sql`）

### 2c. middleware throw だった場合
- `middleware/repository-providers.ts` の bind path で `c.env.DB` 不在を 503 で返す guard を追加

```ts
if (!c.env?.DB) {
  return c.json({ ok: false, error: "DB binding missing" }, 503);
}
```

### 2d. binding config 不一致だった場合
- `apps/api/wrangler.toml` の `[[env.staging.d1_databases]]` の `database_name` / `database_id` を staging 実 D1 と一致させる

## 3. 変更 3: smoke runner の body 取得改善
Phase 2 §3 の diff を `scripts/smoke/runtime-attendance-provider.sh:150-156` に適用。CI artifact に残るため、保存前に `scripts/smoke/redact.sh` を通して token / cookie / session body を redaction する。

## 4. 変更 4: regression test
`apps/api/src/routes/admin/members.contract.spec.ts` に以下シナリオを追加：
- `publish_state` が DB 上で `"draft"` などの enum 外値の場合でも 200 で `publishState: "member_only"` に縮退すること
- `publish_state` が DB 上で legacy `"published"` / `"private"` の場合でも 200 で `public` / `hidden` に正規化され、filter から漏れないこと
- `c.env.DB` 不在時に 500 ではなく 503 を返すこと（2c を採用した場合）

## 5. Phase 4 DoD
- 変更対象 4 ファイルと関数シグネチャ確定
- 仮説別 fix 分岐が記述され、Phase 2 結果次第で実装可能
- local contract evidence で必要性が確認できた defensive handler fix と smoke runner body visibility は同 cycle で実装し、staging RCA / deploy / backend-ci rerun は user-gated evidence として分離する
