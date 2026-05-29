# Phase 3: 設計（UI 構成図 / API 復旧手順）

Phase 2 で分解した A / B 両 stream を、UI 構成図と runtime 復旧手順の 2 軸で設計確定する。

## 1. A 系統 — UI 構成図（DOM 木）

### 1.1 page.tsx（Server Component）

```
<AdminPageHeader title="Identity 重複候補"
                 description="name + 所属が完全一致する identity 候補を表示します。merge は二段階確認が必要です。別人の場合は「別人マーク」で再検出を抑止できます。"
                 breadcrumbs={[{ label: "Identity 重複候補" }]} />

{ !result.ok ? (
   <AdminSectionErrorClient sectionLabel="Identity 重複候補"
                            code={result.error.code}
                            message={result.error.message} />
) : result.data.items.length === 0 ? (
   <EmptyState title="現在、merge 候補はありません。" />
) : (
   <section class="card card-pad-lg" data-route="admin" data-section-rhythm="compact">
     <ul class="stack" data-rhythm="md" role="list">
       { items.map(item => <li class="card-row"><IdentityConflictRow item={item} /></li>) }
     </ul>
     { nextCursor && (
       <nav class="card-footer" aria-label="pagination">
         <a class="link-accent" href={`?cursor=${encodeURIComponent(nextCursor)}`}>次のページ →</a>
       </nav>
     ) }
   </section>
) }
```

- `<main>` wrapper は廃止し `(admin)/layout.tsx` の main に統合（members / tags と同形）。
- `<header>` 直書きを廃止し `AdminPageHeader` に集約。
- `divide-y` 直書きを廃止し card primitive + stack rhythm に置換。

### 1.2 IdentityConflictRow.tsx（Client Component）構造

```
<article class="card card-pad-md" data-conflict-id={item.conflictId}>
  <header class="card-row__header">
    <h3 class="text-strong">{item.name}</h3>
    <Chip tone="warn">{item.affiliation}</Chip>
  </header>
  <ul class="stack" data-rhythm="sm" role="list">
    {item.candidates.map(c => (
      <li class="candidate-row" data-candidate-id={c.identityId}>
        <span class="candidate-row__email">{c.maskedEmail}</span>
        <span class="candidate-row__meta">{c.lastSeenAt}</span>
        <Chip tone="neutral">{c.source}</Chip>
      </li>
    ))}
  </ul>
  <footer class="card-row__actions">
    <Button variant="primary" size="sm" onClick={openMergeStep1}>マージ</Button>
    <Button variant="ghost"   size="sm" onClick={openDismiss}>別人マーク</Button>
  </footer>

  {/* Merge Step1 modal */}
  <Modal open={mergeStep === 1} onClose={closeMerge} role="dialog" aria-labelledby="merge-step1-title">
    <section class="card card-pad-lg">
      <h2 id="merge-step1-title">マージ確認 (1/2)</h2>
      <p>{summary text}</p>
      <footer class="card-row__actions">
        <Button variant="ghost" onClick={closeMerge}>キャンセル</Button>
        <Button variant="primary" onClick={() => setMergeStep(2)}>次へ</Button>
      </footer>
    </section>
  </Modal>

  {/* Merge Step2 modal */}
  <Modal open={mergeStep === 2} onClose={closeMerge}>
    <section class="card card-pad-lg">
      <h2>マージ理由を入力 (2/2)</h2>
      <Field label="理由" required>
        <Input value={reason} onChange={setReason} maxLength={500} />
      </Field>
      <footer class="card-row__actions">
        <Button variant="ghost" onClick={() => setMergeStep(1)}>戻る</Button>
        <Button variant="primary" disabled={!reason.trim() || pending} loading={pending} onClick={submitMerge}>確定</Button>
      </footer>
    </section>
  </Modal>

  {/* Dismiss modal: 同構造の単一 step */}
</article>
```

> 色は全て `var(--ubm-color-*)` 経由。Tailwind 色 utility は 0 件。

### 1.3 primitive 利用一覧

| primitive | 利用箇所 | import 元 |
|---|---|---|
| `AdminPageHeader` | page.tsx | `@/features/admin/components` |
| `Button` | row footer / modal footer | `@/components/ui/Button` |
| `Chip` | affiliation tag / candidate source tag | `@/components/ui/Chip`（既存確認、無ければ Phase 4 で配置確認） |
| `Modal` | merge Step1 / Step2 / dismiss | `@/components/ui/Modal`（既存確認、無ければ既存 admin modal 流用） |
| `Field` / `Input` | merge Step2 reason input | `@/components/ui/Field` / `@/components/ui/Input` |
| `EmptyState` | empty list | `@/components/ui/EmptyState` |

## 2. B 系統 — API 復旧手順設計

### 2.1 切り分けフロー（決定木）

```
[Start] /admin/identity-conflicts が 404 を表示
   │
   ├─ Step 1: H1 (build 配置) 確認
   │    `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging`
   │    + 最新 deploy 時点の git revision に identity-conflicts.ts が含まれるか
   │      → 含まない → H1 hit → `bash scripts/cf.sh deploy ... --env staging`（Gate-C）→ end
   │      → 含む    → Step 2 へ
   │
   ├─ Step 2: H3 (D1 migration) 確認
   │    `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging`
   │      → 未適用あり → H3 hit → `bash scripts/cf.sh d1 migrations apply ...`（Gate-C）→ end
   │      → 全適用    → Step 3 へ
   │
   ├─ Step 3: H2 (env) 確認
   │    apps/web/wrangler.toml の [env.staging.vars] の INTERNAL_API_BASE_URL を確認
   │      → 別 origin → H2 hit → wrangler.toml patch + web 再 deploy（Gate-C）→ end
   │      → 正しい   → Step 4 へ
   │
   ├─ Step 4: H4 (session) 確認
   │    Chrome devtools network で response status = 401 / 403 か
   │      → yes → H4 hit → 再 sign-in で復旧 / 構造的問題なら別 issue → end
   │      → no  → Step 5 へ
   │
   └─ Step 5: H5 (proxy path) 確認
        local で curl + api tail で upstream に届く path を確認
          → /admin/admin/... or 欠落 → H5 hit → proxy patch + vitest 追加 → end
          → /admin/identity-conflicts そのまま → 未知の原因 → 別 issue 起票
```

### 2.2 復旧コマンドカタログ

| 手段 | コマンド | 備考 |
|---|---|---|
| api staging 再 deploy | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | `origin/dev` HEAD で実行。Gate-C で user 承認後 |
| web staging 再 deploy | `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | 同上 |
| D1 migration apply | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | Gate-C で user 承認後 |
| migration 状態確認 | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | read-only |
| deploy 履歴確認 | `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` | read-only |
| staging tail | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env staging` | read-only。secret 表示禁止 |
| local 再現 | `pnpm --filter web dev` + `pnpm --filter api dev` + `curl -v http://localhost:3000/api/admin/identity-conflicts` | local 環境 |

## 3. 失敗時の rollback

| 失敗ケース | rollback |
|---|---|
| api 再 deploy 後に他 endpoint が壊れた | `bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env staging` |
| D1 migration apply 失敗 | migration は forward-only 設計。失敗時は backup から restore（`bash scripts/cf.sh d1 export` 取得済を前提に user 操作で復旧） |
| web wrangler.toml 修正で他環境破壊 | git revert + 再 deploy |

## 4. 不変条件チェックリスト（Phase 4 実装着手前に再確認）

- [ ] `apps/api/src/routes/admin/identity-conflicts.ts` は touch しない
- [ ] D1 schema 変更 / 新規 migration を加えない
- [ ] `requireAdmin` middleware の振る舞いを変えない
- [ ] D1 直接アクセスを `apps/web` に持ち込まない（invariant #5）
- [ ] `Form` schema を変えない（identity-conflicts は Form 仕様外）
- [ ] HEX 直書きを増やさない（NFR-1）
- [ ] 新規 endpoint を追加しない（NFR-3）
