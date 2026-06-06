# task-C: テスト + visual baseline

issue: #1078 / 親 workflow `issue-1078-bulk-tag-picker-large-catalog-ux`
区分: 実装仕様書（CONST_005）
依存: **task-A**（`members.ts` contract）+ **task-B**（`BulkActionBar` UX）
不変条件: test は `*.spec.{ts,tsx}` のみ（#8。`*.test.*` 禁止）。Playwright 実取得（visual baseline 撮影）は user-gated。

---

## 1. 変更対象ファイル一覧 + 変更種別

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 編集 | fetch mock を `{ available }` → `{ total, items }` へ是正（AC-0 回帰防止の要）、TC-BAB-CAT-* 追加 |
| `apps/web/src/features/admin/api/__tests__/members.spec.ts` | 新規 | `fetchTagMaster` / `fetchAllTagMaster` の unit テスト |

---

## 2. mock 是正（AC-0 回帰防止の要）

現 `BulkActionBar.spec.tsx` L58-66 の fetch stub は:

```ts
new Response(JSON.stringify({ available: AVAILABLE }), { ... })
```

これが root-cause（API は `{ total, items }` を返すのに `{ available }` を返す mock）を隠蔽している。**この mock を実 API 形へ是正することが AC-0 の本質**:

```ts
vi.stubGlobal(
  "fetch",
  vi.fn(async () =>
    new Response(JSON.stringify({ total: AVAILABLE.length, items: AVAILABLE }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ),
);
```

> 是正前: 現コードでも mock が `{ available }` なので緑 → contract 修正の効果が検出できない。
> 是正後: mock が `{ total, items }` になり、未修正の `fetchTagMaster`（`r.available` 参照）では picker が空になり TC-BAB-TAG-01 が RED。task-A 修正で GREEN（RED→GREEN 順序の根拠）。

---

## 3. 新規テストケース（`BulkActionBar.spec.tsx`）

`*.spec.tsx`。large catalog 用の fixture（>24 件）を別途定義（例 `LARGE`: category 3種×各 20 tag = 60 tag）。

| ID | 対象 | 期待 |
| --- | --- | --- |
| TC-BAB-CAT-01 | contract（AC-0） | `{ total, items }` mock で `エンジニア`/`経営者` pill が描画される（小規模 fixture） |
| TC-BAB-CAT-02 | 検索フィルタ（AC-1） | LARGE fixture で `type=search` input に「eng」入力 → debounce 後、label/code/category に「eng」を含む pill のみ表示。aria-label「タグを検索」で input 取得 |
| TC-BAB-CAT-03 | category 折りたたみ（AC-1） | LARGE fixture で category 見出し button(`aria-expanded=true`)click → `aria-expanded=false`、その category の pill が非表示。再 click で復帰 |
| TC-BAB-CAT-04 | 選択中固定行 persistence（AC-4） | LARGE fixture で pill 選択 → 検索でその pill が結果外になっても `role="group" name="選択中のタグ"` 内に selected chip が残り、click で解除（toggleTag）できる |
| TC-BAB-CAT-05 | pageSize=100 送信 | `fetchAllTagMaster` 経由で `fetch` の URL に `pageSize=100`（`page=1`）が含まれる（spy で URL 検証） |
| TC-BAB-CAT-06 | truncated（AC-3） | fetch を 100件フルページ×N で cap 到達 → `serverSearchMode` 有効化を示す案内/検索 UI が表示される |
| TC-BAB-CAT-07 | keyboard regression（AC-2） | LARGE fixture でも TagPill が `button` + `aria-pressed` で、Enter/Space 相当（fireEvent.click）で toggle される |

- 小規模時の現行挙動維持確認（閾値以下では検索 input が出ない）も TC-BAB-CAT-02 系の補助 assert で担保。

---

## 4. 新規テストケース（`members.spec.ts`）

`*.spec.ts`。`vi.stubGlobal("fetch", ...)` で応答を制御。task-A の §5 と対応。

| ID | 対象 | 期待 |
| --- | --- | --- |
| TC-API-TM-01 | query 組み立て | `fetchTagMaster({ q: " eng ", page: 2, pageSize: 50 })` → URL に `q=eng&page=2&pageSize=50`（q trim 済み・空文字なら付与しない） |
| TC-API-TM-02 | 既定値 | `fetchTagMaster()` → `page=1&pageSize=100`、`q` なし |
| TC-API-TM-03 | 変換 | 応答 `{ total: 2, items: [a,b] }` → `{ available: [a,b], total: 2 }` |
| TC-API-TM-04 | total fallback | 応答 `{ items: [a] }` → `total = 1` |
| TC-API-TM-05 | items 欠落 | 応答 `{ total: 0 }` → `available = []` |
| TC-API-TM-06 | HTTP エラー | status 500 → `throw` |
| TC-API-TM-07 | ページ周回 | 1ページ目 100件フル → `available.length(100) === pageSize(100)` で次ページ取得、2ページ目 30件(<100) で停止。累積 130 件 |
| TC-API-TM-08 | cap | `fetchAllTagMaster(120)` で 100+100 取得しても 120 件に slice、`truncated=true` |
| TC-API-TM-09 | truncated false | total ≤ 取得件数で停止 → `truncated=false` |

---

## 5. Playwright visual sanity 計画（AC-5・実取得は user-gated）

- fixture: large catalog（例 60 tag）を返す admin/members ルートのモック or seed。
- project: `desktop-chromium` / `mobile-chromium`（既存 `playwright/tests/issue1036-bulk-member-tags.spec.ts` の project 構成に合わせる）。
- 検証観点:
  - sticky bar が `max-h-[40vh] overflow-y-auto` でビューポートを占有しすぎず、member table の操作面が露出している（bar 下端より上に table 行が見える）。
  - 検索 input・折りたたみ button が描画され、text overlap がない。
  - mobile で bar が画面下部に収まり、横スクロール overflow がない。
- baseline 撮影コマンド（**実行は user-gated**。スクリーンショットは `outputs/phase-11/screenshots/` に格納）:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web playwright test playwright/tests/issue1036-bulk-member-tags.spec.ts --project=desktop-chromium
mise exec -- pnpm --filter @ubm-hyogo/web playwright test playwright/tests/issue1036-bulk-member-tags.spec.ts --project=mobile-chromium
```

---

## 6. ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/api/__tests__/members.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7. DoD

- [ ] `BulkActionBar.spec.tsx` の fetch mock が `{ total, items }` へ是正されている（AC-0 要）。
- [ ] TC-BAB-CAT-01..07 全 GREEN。
- [ ] `members.spec.ts` TC-API-TM-01..09 全 GREEN。
- [ ] 既存 TC-BAB-01..04 / TC-BAB-TAG-01..05 / a11y 0 が維持。
- [ ] `*.spec.{ts,tsx}` のみ（`*.test.*` 0）。
- [ ] Playwright visual 計画が記述済み（実撮影は user-gated）。
- [ ] `pnpm typecheck` / `pnpm lint` 緑。
