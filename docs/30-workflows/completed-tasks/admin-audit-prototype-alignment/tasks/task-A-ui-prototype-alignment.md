# Task A: /admin/audit UI prototype alignment

> workflow: admin-audit-prototype-alignment
> task_id: task-A
> taskType: implementation / VISUAL
> implementation_mode: existing-ui-alignment

## A.0 実装区分

`[実装区分: 実装仕様書]` — `apps/web/app/(admin)/admin/audit/page.tsx` および `apps/web/src/components/admin/AuditLogPanel.tsx` のコード変更を伴う。CONST_004 のデフォルトに従う。

## A.1 ゴール

`/admin/audit` を `pages-admin.jsx` の `AdminMembersPage` / `AdminTagsPage` / `SchemaDiffPage` 群と同じ design language（`AdminPageHeader` + Card + Filter grid + tokenized `tbl` + Button/Select primitives）に整える。API surface・PII masking・cursor / filter 仕様は一切変更しない。

## A.2 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/app/(admin)/admin/audit/page.tsx` | 編集 | `AdminPageHeader` 採用、`<Breadcrumb>` 単独を撤去、section ラッパを admin 共通形式に統一 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 編集 | header `<h1>` 撤去、filter form を Card + grid 化、Button / Select primitives 化、error 表示を `Banner` 化、`tbl` クラスへ移行 |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | 編集 | A.6 のテストケース追記。既存 PII masking ケースは保持 |
| `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | 編集 | `AdminPageHeader` 描画ケース追加 |
| `apps/web/playwright/tests/visual-staging/admin-audit.spec.ts` | 新規 | admin-staging-visual project 規約に従う 3 viewport spec |
| `apps/web/src/styles/*.css`（必要なら） | 編集 | `admin-audit-filter` / `admin-audit-table` の最小 styling が残る場合、tokenized utility に置換または撤去 |

## A.3 関数・型・モジュールのシグネチャ

### A.3.1 `AuditLogPanel.tsx`

既存 export を維持しつつ内部 markup を変更する。シグネチャ不変:

```ts
export interface AuditSearchValues { /* unchanged */ }
export function maskAuditJson(value: unknown, key?: string): unknown;
export function summarizeAuditJson(value: unknown): string;
export function formatJst(iso: string): string;
export function maskAuditText(value: string | null | undefined, key: string): string;
export function buildAuditHref(values: AuditSearchValues, cursor?: string | null): string;
export function AuditLogPanel(props: {
  readonly data: AdminAuditListResponse | null;
  readonly values: AuditSearchValues;
  readonly error?: string;
}): JSX.Element;
```

新しい内部 JSX 構造（疑似）:

```tsx
<section data-component="admin-audit" className="flex flex-col gap-4">
  <Card>
    <form
      action="/admin/audit"
      aria-label="監査ログフィルター"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
    >
      <FormField name="action" label="action">
        <Input name="action" defaultValue={values.action ?? ""} placeholder="attendance.add" />
      </FormField>
      <FormField name="actorEmail" label="actorEmail">
        <Input name="actorEmail" defaultValue={values.actorEmail ?? ""} inputMode="email" />
      </FormField>
      <FormField name="targetType" label="targetType">
        <Input name="targetType" defaultValue={values.targetType ?? ""} placeholder="meeting | admin_member_note" />
      </FormField>
      <FormField name="targetId" label="targetId">
        <Input name="targetId" defaultValue={values.targetId ?? ""} />
      </FormField>
      <FormField name="from" label="from (JST)">
        <Input name="from" type="datetime-local" defaultValue={values.fromLocal ?? ""} />
      </FormField>
      <FormField name="to" label="to (JST)">
        <Input name="to" type="datetime-local" defaultValue={values.toLocal ?? ""} />
      </FormField>
      <FormField name="limit" label="limit">
        <Select name="limit" defaultValue={values.limit ?? "50"}>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </Select>
      </FormField>
      <div className="col-span-full flex justify-end gap-2">
        <Button type="submit" variant="primary">検索</Button>
        <Link
          href="/admin/audit"
          data-role="reset"
          className={buttonVariants({ variant: "ghost", size: "md" })}
        >
          リセット
        </Link>
      </div>
    </form>
  </Card>

  {error ? (
    <Banner tone="warning">
      監査ログを読み込めませんでした: {error}
      {error.includes("404") ? (
        <p className="mt-1 text-sm text-[var(--ubm-color-text-secondary)]">
          API endpoint への疎通 / staging deploy 状態 / admin 認可を確認してください。
        </p>
      ) : null}
    </Banner>
  ) : null}

  {!error && items.length === 0 ? (
    <EmptyState title="該当する監査ログはありません。" />
  ) : null}

  {items.length > 0 ? (
    <Card>
      <div className="admin-audit-table-scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">日時 / ID</th>
              <th scope="col">action / actor</th>
              <th scope="col">target</th>
              <th scope="col">JSON</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => <AuditRow key={item.auditId} item={item} />)}
          </tbody>
        </table>
      </div>
      <Pagination
        current={1}
        hasPrev={false}
        hasNext={Boolean(data?.nextCursor)}
        nextHref={data?.nextCursor ? buildAuditHref(values, data.nextCursor) : undefined}
        nextLabel="次のページ"
      />
      {!data?.nextCursor ? <span className="small muted">次のページはありません</span> : null}
    </Card>
  ) : null}
</section>
```

> 注: 現行 `<Button>` は polymorphic link rendering props 非対応。リンク型ボタンは `buttonVariants({ variant: "ghost", size: "md" })` を使う。新規 primitive は作らない。

### A.3.2 `page.tsx`

```tsx
import { AdminPageHeader } from "@/features/admin/components/_layout/AdminPageHeader";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // ... (既存の searchParams 構造化 / safeServerFetch は維持)
  return (
    <section className="stack-lg">
      <AdminPageHeader
        title="監査ログ"
        description="action / actor / target / 期間で監査ログを絞り込み、PII を保護した形で参照できます。"
        breadcrumbs={[{ label: "管理", href: "/admin" }, { label: "監査ログ" }]}
      />
      <AuditLogPanel data={data} values={values} {...(error ? { error } : {})} />
    </section>
  );
}
```

## A.4 入力・出力・副作用

- 入力: `searchParams`（既存）
- 出力: rendered HTML（PII masked）
- 副作用: `safeServerFetch` 経由の API GET 1 回（既存）
- 不変条件: API response shape / cursor encode / PII masking 全て不変

## A.5 トークン・スタイル方針

- 色: `var(--ubm-color-*)` 経由のみ（OKLch token）
- HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止 → `verify-design-tokens` で grep
- spacing: Tailwind utility（`gap-3` / `mt-1` / `flex` / `grid` / `col-span-full` 等）
- 既存 `admin-audit-filter` / `admin-audit-table` CSS class は最終的に**不要になれば削除**、styling が必要なら token 経由の utility に置換

## A.6 テスト方針

### 追加ケース（`AuditLogPanel.component.spec.tsx`）

1. `does not render local <h1>監査ログ</h1> (delegated to AdminPageHeader)`
2. `filter form renders FormField for action / actorEmail / targetType / targetId / from / to / limit`
3. `submit and reset are rendered as Button primitives`
4. `error banner renders recovery hint when reason includes "404"`
5. 既存 PII masking ケースは保持

### 追加ケース（`page.page.spec.ts`）

1. `renders AdminPageHeader with title "監査ログ" and breadcrumbs ["管理", "監査ログ"]`
2. 既存 searchParams 反映ケースは保持

### Visual

- `apps/web/playwright/tests/visual-staging/admin-audit.spec.ts` を新設し、admin-staging-visual project（既存 `playwright.config.ts` 設定）の `snapshotPathTemplate` に従ってベースラインを取得する spec を配置。baseline 取得自体は user-gated（Linux CI run）。

## A.7 ローカル実行・検証コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter web test -- src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
mise exec -- pnpm --filter web test -- app/\(admin\)/admin/audit/page.page.spec.ts
# OKLch token gate
mise exec -- pnpm verify:tokens
mise exec -- pnpm --filter web verify-design-tokens
# 失敗時のヒント
mise exec -- grep -nE "bg-\[#|text-\[#|#[0-9a-fA-F]{3,8}" apps/web/src/components/admin/AuditLogPanel.tsx apps/web/app/\(admin\)/admin/audit/page.tsx || true
```

## A.8 DoD（Definition of Done）

- AC-A1〜A8（Phase 1）すべて満たす
- 上記 unit / page spec が green
- `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh` green
- `verify-design-tokens` の HEX / `bg-[#]` / `text-[#]` grep が audit 関連で 0 件
- staging で admin セッションを使い `/admin/audit` を開いて prototype design language で描画されることを user が目視確認（user-gated）
- Playwright admin-staging-visual の audit spec が CI 上で実行可能（Linux baseline 取得は user-gated）

## A.9 依存関係

- 既存 `apps/web/src/components/ui/{Card,Button,Input,Select,FormField,Banner,EmptyState,Pagination}.tsx`
- 既存 `apps/web/src/features/admin/components/_layout/AdminPageHeader.tsx`
- 既存 `apps/web/src/lib/admin/safe-server-fetch.ts`（変更しない）

Task B（API 404 修復）と並列実行可。ただし Task A のうち正常系 staging visual baseline は Task B 完了後に取得する。Task B 未解決中は error banner 経路と local fixture / unit test で描画確認する。
