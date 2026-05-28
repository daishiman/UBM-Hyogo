# Phase 2: 要件分解 / タスク分解 / DoD 定義

Phase 1 の FR / NFR / AC を SRP（単一責務原則）で分解し、A 系統（UI 整合）と B 系統（404 復旧）の実行可能タスク群に落とす。各タスクに DoD（Definition of Done）を付ける。

## 0. 全体構造

```
admin-identity-conflicts-prototype-alignment-and-404-fix
├─ Stream A: UI 整合（apps/web 単独完結）
│   ├─ A-1 AdminPageHeader 配線（page.tsx）
│   ├─ A-2 list wrapper を card primitives に置換（page.tsx）
│   ├─ A-3 IdentityConflictRow を tokens + primitives に置換（row component）
│   ├─ A-4 二段階 merge modal / dismiss modal の surface 整合
│   ├─ A-5 focused vitest spec 更新
│   └─ A-6 既存 Playwright e2e の selector 微更新
└─ Stream B: 404 root-cause 究明＆復旧（ops 主体 + 必要時 code 微修正）
    ├─ B-1 read-only 観測（5 仮説 H1〜H5 並列切り分け）
    ├─ B-2 root-cause 確定とトリアージレポート作成
    ├─ B-3 復旧手段の選択（ops / code / 両方）
    ├─ B-4 復旧実行（Gate-C user-gated）
    └─ B-5 回帰防止（H5 hit 時のみ vitest 追加 / その他は runbook 追記）
```

---

## Stream A: UI 整合

### A-1 AdminPageHeader 配線

| 項目 | 内容 |
|---|---|
| 対象 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` |
| 単一責務 | page Server Component の header 表現を `AdminPageHeader` primitive に切り替える |
| 入力 | 現行 `<header className="mb-6"><h1>Identity 重複候補</h1><p>...</p></header>` + `<Breadcrumb items={[{label: "Identity 重複候補"}]} />` |
| 出力 | `<AdminPageHeader title="Identity 重複候補" description="name + 所属が完全一致する identity 候補を表示します。merge は二段階確認が必要です。別人の場合は「別人マーク」で再検出を抑止できます。" breadcrumbs={[{label: "Identity 重複候補"}]} />` |
| 副作用 | `<main className="mx-auto max-w-5xl px-6 py-8">` を削除し、(admin)/layout.tsx 提供の main wrapper に統合（members / tags と同じ pattern） |
| 影響 | Breadcrumb 直 import を削除（AdminPageHeader 内部で利用）、`features/admin/components` から `AdminPageHeader` を import |
| DoD | (1) `grep -nE '<header className' apps/web/app/\(admin\)/admin/identity-conflicts/page.tsx` が 0 件 / (2) `grep -nE 'AdminPageHeader' apps/web/app/\(admin\)/admin/identity-conflicts/page.tsx` が 1 件 hit / (3) `pnpm --filter web vitest run -- identity-conflicts.page` の snapshot が新構造で更新 / (4) ローカル `pnpm --filter web dev` で `/admin/identity-conflicts` が描画される |

### A-2 list wrapper を card primitives に置換

| 項目 | 内容 |
|---|---|
| 対象 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` |
| 単一責務 | `<ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200">` を admin card primitive 構造に置換 |
| 入力 | 現行: 上記 ul + `<li className="px-4 py-3">` |
| 出力 | `<section className="card card-pad-lg"><ul className="stack" data-rhythm="md">...<li className="card-row">...</li></ul></section>`（クラス名 / data 属性は members alignment と同形） |
| 影響 | `divide-zinc-200` 等 Tailwind 色 utility を全廃。border は token 経由 |
| DoD | (1) `grep -nE 'divide-zinc|text-zinc|text-blue-' apps/web/app/\(admin\)/admin/identity-conflicts/page.tsx` が 0 件 / (2) `verify-design-tokens` 違反 0 件 / (3) snapshot 更新 |

### A-3 IdentityConflictRow を tokens + primitives に置換

| 項目 | 内容 |
|---|---|
| 対象 | `apps/web/src/components/admin/IdentityConflictRow.tsx`（236 行） |
| 単一責務 | row 内 surface（group header / 候補 sublist / action buttons）を tokens + admin primitives に置換。merge / dismiss の二段階ロジックは無改変 |
| 入力 | 現行: Tailwind 直書きの button / span / div |
| 出力 | (1) action 用 `<Button variant="primary"\|"ghost" size="sm">` / (2) 状態表示用 `<Chip tone="warn"\|"neutral">` / (3) surface 色は `var(--ubm-color-*)` 経由 / (4) `data-conflict-id` 等は維持 |
| 影響 | 既存 Playwright e2e の `getByRole('button', { name: 'merge' })` 等 role-based selector は維持される |
| DoD | (1) `grep -nE 'text-(zinc\|blue\|red\|amber)-|bg-(zinc\|blue\|red\|amber)-' apps/web/src/components/admin/IdentityConflictRow.tsx` が 0 件 / (2) `Button` / `Chip` primitive が import される / (3) `pnpm --filter web vitest run -- IdentityConflictRow` PASS / (4) merge / dismiss 関数の呼び出しシグネチャ無改変 |

### A-4 二段階 merge modal / dismiss modal の surface 整合

| 項目 | 内容 |
|---|---|
| 対象 | `IdentityConflictRow.tsx` 内 modal JSX |
| 単一責務 | modal の surface（背景 / panel / footer）を tokens + 既存 admin modal primitive（無ければ最小 inline surface）で再構成 |
| 入力 | 現行: Tailwind 手書きの fixed overlay + panel |
| 出力 | overlay 色は `var(--ubm-color-overlay)` 経由、panel は `card card-pad-lg`、footer の Cancel/Confirm は `Button variant="ghost"\|"primary"` |
| 不変 | (a) Step1 で「マージ実行」→ Step2 で reason 入力 → 「確定」の 2 ステップ / (b) ESC / overlay click で close / (c) focus trap 維持 |
| DoD | (1) `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` の merge / dismiss flow が PASS / (2) focus trap が崩れていないことを spec で確認 |

### A-5 focused vitest spec 更新

| 項目 | 内容 |
|---|---|
| 対象 | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`（存在しなければ新規）+ `apps/web/app/(admin)/admin/identity-conflicts/__tests__/page.component.spec.tsx`（存在しなければ新規） |
| 単一責務 | (a) page が `AdminPageHeader` を render すること / (b) row が `Button` / `Chip` primitive を render すること / (c) Tailwind 色 utility 0 件のクラス組成であること |
| DoD | (1) 新規 / 更新 spec が PASS / (2) `pnpm --filter web vitest run -- IdentityConflictRow` で 1 file 以上 hit / (3) spec ファイル名は `*.spec.tsx`（`*.test.*` 禁止: invariant #8） |

### A-6 既存 Playwright e2e の selector 微更新

| 項目 | 内容 |
|---|---|
| 対象 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`（208 行） |
| 単一責務 | class 依存 selector を role / data-* 依存に書き換える（class 置換で fail しないように） |
| DoD | (1) `pnpm exec playwright test admin-identity-conflicts` PASS / (2) `data-conflict-id` 経由 selector が維持される |

---

## Stream B: 404 root-cause 究明＆復旧

### B-1 read-only 観測（5 仮説並列切り分け）

| 仮説 | 観測手順 | 期待観測 | 判定基準 |
|---|---|---|---|
| H1: staging API に identity-conflicts route を持つ build 未配置 | `bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging` で最新 deploy id 取得。`git log <deploy id 周辺>` で apps/api/src/routes/admin/identity-conflicts.ts の存在を確認 | 最新 staging build が当該 route を含む | 含まない場合 H1 hit |
| H2: `INTERNAL_API_BASE_URL` が staging で別 origin | `apps/web/wrangler.toml` の `[env.staging.vars]` の `INTERNAL_API_BASE_URL` を git で確認 / `bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging` で key 一覧（値は出さない） | staging API origin と一致 | 一致しない場合 H2 hit |
| H3: D1 migration 未適用 → 500 が 404 に化け | `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging` | `member_identities` / `identity_aliases` / `identity_conflict_dismissals` の migration が `applied` | 未適用がある場合 H3 hit |
| H4: admin session 失効で proxy が 403→404 にすり替え | Chrome devtools で `/api/admin/identity-conflicts` の Response status を観測。`set-cookie` 期限 / `authjs.session-token` 存在を観測 | 401 / 403 が観測される | 401/403 を観測した場合 H4 hit |
| H5: proxy path strip 誤り | local で `pnpm --filter web dev` + `pnpm --filter api dev` を上げ、`curl -v http://localhost:3000/api/admin/identity-conflicts -H "Cookie: <session>"` を実行、api 側 tail で受信 path を確認 | api が `/admin/identity-conflicts` を受信し 200 を返す | path が `/admin/admin/...` / `/identity-conflicts`（prefix 欠落）等になっている場合 H5 hit |

> 注: H1〜H5 は排他ではない。複数 hit がありうる。観測順序は H1 → H3 → H2 → H4 → H5（コストの低い順）を推奨。

### B-2 root-cause 確定とトリアージレポート作成

| 項目 | 内容 |
|---|---|
| 対象 | `outputs/phase-11/evidence/root-cause-triage.md`（後続 Phase 11 で生成） |
| DoD | (1) H1〜H5 の各観測コマンドと出力（pii/secret マスク済）が記録される / (2) hit した仮説と判定根拠が明示される / (3) 採用復旧手段（ops only / code only / both）が明記される |

### B-3 復旧手段の選択

| hit | 復旧手段 | 担当 |
|---|---|---|
| H1 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` を `origin/dev` HEAD で実行（Gate-C） | ops |
| H2 | `apps/web/wrangler.toml` の `[env.staging.vars]` の `INTERNAL_API_BASE_URL` を正しい origin に修正 + web 再 deploy | code + ops |
| H3 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`（Gate-C） | ops |
| H4 | admin として再 sign-in。session cookie 期限が短すぎる場合は Auth.js 設定の別 issue 起票（本 workflow scope 外） | user 操作 + 別 issue |
| H5 | `apps/web/app/api/admin/[...path]/route.ts` の `proxy()` 関数の path 連結を最小 patch + vitest 回帰追加 | code |

### B-4 復旧実行（Gate-C user-gated）

| 項目 | 内容 |
|---|---|
| DoD | (1) staging で admin session を持つ user が `/admin/identity-conflicts` を開き 200 OK / list or empty / error 以外が描画される / (2) `curl https://<staging-web-origin>/api/admin/identity-conflicts -H "Cookie: <session>"` が 200 を返す / (3) 復旧確認 evidence が `phase-11/evidence/staging-recovery.txt` に記録される |

### B-5 回帰防止

| hit | 追加するテスト / runbook |
|---|---|
| H1 | `bash scripts/verify-pr-ready.sh` 範囲内に「主要 admin route 存在 grep gate」が既存か確認。なければ別 issue 起票 |
| H2 | `apps/web/wrangler.toml` の `[env.staging.vars]` を vitest snapshot 化（必要時のみ。スコープ外なら lessons-learned 化） |
| H3 | `bash scripts/cf.sh d1 migrations list` を staging deploy 後の runbook step として明示（別 issue 起票も可） |
| H4 | runbook 追記のみ |
| H5 | `apps/web/src/lib/admin/__tests__/proxy-path.spec.ts` 新規。`/api/admin/identity-conflicts` → upstream `/admin/identity-conflicts` の連結を unit テストで固定 |

---

## 全タスク完了条件（Phase 2 全体 DoD）

- [ ] Stream A: A-1〜A-6 の全 DoD 達成
- [ ] Stream B: B-1〜B-5 の全 DoD 達成（H4 のみ別 issue 起票で可）
- [ ] `pnpm typecheck` / `pnpm --filter web lint` / `pnpm --filter web vitest run` / `pnpm exec playwright test admin-identity-conflicts` が全て PASS
- [ ] `verify-design-tokens` が 0 件 fail で PASS
- [ ] Phase 11 で local screenshot 3 枚（list / empty / merge-modal Step1）+ staging 復旧 evidence 1 件取得
