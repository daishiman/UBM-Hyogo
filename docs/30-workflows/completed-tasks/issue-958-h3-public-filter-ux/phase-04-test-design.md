# Phase 4 — テスト設計（TDD Red 前提）

## 0. 命名規則整合確認

- 全 spec: `*.spec.tsx` / `*.spec.ts`（INV-5）
- describe/it: 日本語可（既存 admin spec と整合）
- import alias: `@/` 経由（既存 tsconfig paths）

## 1. Track A — `PublicConsentCallout`

### 1.1 ファイル

`apps/web/app/(member)/profile/_components/__tests__/PublicConsentCallout.spec.tsx`

### 1.2 ケース一覧

| # | 入力 | 期待 |
|---|------|------|
| A1 | `publicConsent="consented"` | tone=success、見出し「公開メンバー一覧に掲載されています」、CTA href = `editResponseUrl` |
| A2 | `publicConsent="declined"` | tone=warning、見出し「公開メンバー一覧に表示されていません」、CTA href = `editResponseUrl` |
| A3 | `publicConsent="unknown"` | tone=warning、見出し「公開設定が未確認です」、CTA href = `editResponseUrl` |
| A4 | `editResponseUrl=null` | CTA href が `responderUrl` にフォールバック |
| A5 | 全 case | CTA に `target="_blank"` / `rel="noreferrer noopener"` |
| A6 | A1 | `role="region"` + `aria-labelledby` が解決可能 |

### 1.3 RED 期待

`PublicConsentCallout` ファイル未作成のため import error → vitest fail。

### 1.4 MINOR-1 検証 spec（schema 確認）

`apps/web/src/lib/api/__tests__/me-types-public-consent.spec.ts`（新規）:
- `MeProfileResponseZ.shape` に `editResponseUrl` が含まれるか確認
- 含まれなければ Phase 5 で `profile?.editResponseUrl ?? null` 経路に変更

## 2. Track B — `useBulkRepublish` + `BulkRepublishDrawer`

### 2.1 hook spec

`apps/web/src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts`

| # | シナリオ | 期待 |
|---|---------|------|
| B-H1 | `start([])` | `state="done"`, `progress.total=0` |
| B-H2 | targets 3件全成功（fetch mock 200） | `succeeded=3`, `failed=0`, state=done |
| B-H3 | 3件中 2件目だけ 500 | `succeeded=2`, `failed=1`, `failures[0].memberId === targets[1].memberId` |
| B-H4 | 順次実行検証 | mock fetch 呼び出し順 = targets 順（並列禁止） |
| B-H5 | `reset()` | `state="idle"`, `progress` 初期化 |
| B-H6 | running 中の `start()` 再呼出 | 無視 or noop（仕様: 二重起動禁止） |

mock: `useAdminMutation` を `vi.mock` で差し替え、各 mutation 結果を Promise で制御。

### 2.2 Drawer spec

`apps/web/src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx`

| # | シナリオ | 期待 |
|---|---------|------|
| B-D1 | `open=false` | render なし |
| B-D2 | `open=true`, candidates 3件 | checkbox 3個（`FormField` 経由） |
| B-D3 | 「全選択」操作 | 全 checkbox checked |
| B-D4 | 選択 0件で submit | submit ボタン disabled |
| B-D5 | submit 実行 → 全成功 | `onCompleted` が呼ばれ、Drawer 自動 close |
| B-D6 | submit 実行 → 一部失敗 | 失敗 list 表示（displayName + code）、close せず |
| B-D7 | progress 表示 | running 中に `total / succeeded / failed` の数値が表示 |

### 2.3 INV-7 guard

直接 `fetch(` の使用が無いことを `grep` で Phase 9 確認。spec ファイル内では mock のため OK。

## 3. Track C — `AllHiddenFallback` + page 分岐

### 3.1 component spec

`apps/web/src/components/public/__tests__/AllHiddenFallback.spec.tsx`

| # | 入力 | 期待 |
|---|------|------|
| C-F1 | `memberCount=42` | 「会員 42 名が在籍」文言を含む |
| C-F2 | `memberCount=0` | （仕様外だが安全に render；空文言にせず数字表示維持） |
| C-F3 | CTA 「マイページにログイン」 → href=`/login` |
| C-F4 | CTA 「管理者の方はこちら」 → href=`/admin` |
| C-F5 | tone=info（warning ではない） |

### 3.2 page spec（既存 page.spec.tsx に追記）

`apps/web/app/(public)/members/__tests__/page.spec.tsx`（新規もしくは既存に追記）

mock: `listMembers` / `getPublicStats` を `vi.mock`。

| # | listResult | statsResult | search | 期待 render |
|---|-----------|-------------|--------|-----------|
| C-P1 | items=0 | memberCount=10, publicMemberCount=0 | filter 無 | `AllHiddenFallback` |
| C-P2 | items=0 | memberCount=10, publicMemberCount=0 | `q="abc"` | 既存 `EmptyState`（filter empty） |
| C-P3 | items=0 | memberCount=0, publicMemberCount=0 | filter 無 | 既存 `EmptyState`（true zero） |
| C-P4 | items=3 | any | any | `MemberGrid` |
| C-P5 | listResult.ok=false | any | any | `SectionError` |
| C-P6 | items=0 | statsResult.ok=false | filter 無 | 既存 `EmptyState`（safe fallback） |

### 3.3 `hasSearchFilters` 判定 spec（MINOR-3）

| query | hasSearchFilters |
|-------|-----------------|
| `{ q:"", tag:"", zone:"", status:"" }` | false |
| `{ q:"abc", ... }` | true |
| `{ density:"compact" }` のみ | false（view setting） |
| `{ sort:"name" }` のみ | false |

## 4. Targeted run コマンド

```bash
mise exec -- pnpm --filter @repo/web exec vitest run --no-coverage \
  app/\(member\)/profile/_components/__tests__/PublicConsentCallout.spec.tsx \
  src/components/admin/__tests__/BulkRepublishDrawer.spec.tsx \
  src/features/admin/hooks/__tests__/useBulkRepublish.spec.ts \
  src/components/public/__tests__/AllHiddenFallback.spec.tsx \
  app/\(public\)/members/__tests__/page.spec.tsx \
  src/lib/api/__tests__/me-types-public-consent.spec.ts
```

## 5. RED 確認手順

1. spec ファイル先行作成（実装は次 Phase）
2. 上記コマンド実行 → 全 fail（import error / element not found）を artifacts として記録
3. Phase 5 GREEN へ

## 6. 完了条件

- [x] 3 Track の case 一覧確定
- [x] mock 戦略確定（fetch / useAdminMutation / listMembers / getPublicStats）
- [x] targeted run 単一コマンド化
- [x] MINOR-1/2/3 を spec で取り込み
