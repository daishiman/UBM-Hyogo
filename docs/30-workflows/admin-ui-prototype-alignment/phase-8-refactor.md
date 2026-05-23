---
実装区分: 実装仕様書
状態: completed
Phase: 8
作成日: 2026-05-23
task_id: admin-ui-prototype-alignment
親: [index.md](./index.md)
前: [phase-7-coverage.md](./phase-7-coverage.md)
次: [phase-9-qa.md](./phase-9-qa.md)
---

# Phase 8: リファクタ

## 1. 目的

Phase 5-7 完了直後に、以下を実施する。

1. 各 admin component に散在していた Card ラップ / KPI / Empty / Error パターンを `_shared/` に集約しきれているか再確認
2. Lane B-E 並列実装の差で生まれた表記揺れ (`AdminSectionCard` の `tone` 指定揺れ等) を統一
3. navigation drift (sidebar / breadcrumb / link href) のチェック
4. 不要 import / dead code 削除

挙動変更は **行わない**。test と coverage を Phase 7 終了時点から **悪化させない** ことが本 Phase の必須条件。

## 2. 重複削除候補

| 対象 path | Before | After | 理由 |
| ---- | ---- | ---- | ---- |
| `apps/web/src/features/admin/components/_dashboard/*.tsx` | Card primitive 直接 + 独自 header div | `<AdminSectionCard title=...>` | Phase 5 で導入した共通 component への置換漏れ確認 |
| `apps/web/src/components/admin/MeetingPanel.tsx` | Card + section + 個別 padding | `AdminSectionCard` 1 個 | spacing 重複 |
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 独自 header h2 + actions div | `AdminSectionCard` actions slot | header 構造重複 |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 独自 table + 独自 empty | `AdminTable` + `AdminEmptyState` | table 構造重複 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 独自 2-col layout | `AdminQueuePanel` | queue 2-col 重複 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | 同上 | `AdminQueuePanel` | 同上 |
| `apps/web/app/(admin)/admin/page.tsx` | KPI 配列 map で個別 KPI render | `AdminStat` で統一 | KPI 重複 |
| `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 行 render 個別 div grid | `AdminTable` + `IdentityConflictRow` を cell に | table 重複 |

> Before/After は **挙動を変えない range** に限定。プロパティ名 / DOM role が変わる場合は Phase 6 の regression test も更新する (本 Phase 内で完結)。

## 3. 表記揺れ統一

| 観点 | 統一後 |
| ---- | ---- |
| `AdminSectionCard` の `tone` | 正常時は **省略** (`default` を明示しない)。`danger`/`success`/`muted` のみ明示 |
| `AdminSectionError` の `title` | 省略 (default "セクションを表示できませんでした") |
| empty 文言 | "データがありません" を default、業務上 "未解決リクエストはありません" 等の文脈ある文言は override |
| key prefix | `getRowKey` は entity の primary id を返す。`row-${i}` フォールバック禁止 |
| import 経路 | `_shared/` からの import は **必ず barrel** (`@/features/admin/components/_shared`) 経由。深い path 禁止 |

統一後の grep:

```bash
# barrel 経由でない直 import を検出 (0 件期待)
grep -rEn "from ['\"]@/features/admin/components/_shared/[A-Z]" apps/web
```

## 4. Navigation drift チェック

### 4.1 Sidebar (layout.tsx) と実 route の一致

```bash
# 1. sidebar に書かれた href 一覧抽出
grep -oE "href=\"/admin[^\"]*\"" apps/web/app/\(admin\)/layout.tsx | sort -u

# 2. 実在 page.tsx
find apps/web/app/\(admin\)/admin -name 'page.tsx' | \
  sed -E 's|apps/web/app/\(admin\)||; s|/page.tsx||' | sort -u
```

両者の差集合が空であること。差がある場合は sidebar 側を実 route に合わせる (新規 route 追加はスコープ外)。

### 4.2 Breadcrumb

`apps/web/src/components/admin/Breadcrumb.tsx` が生成する trail が、各 page の `AdminPageHeader title` と一致すること。

### 4.3 Internal link

```bash
# admin 配下の <Link href="..."> / <a href="..."> 一覧
grep -rEn "(href=\"/admin[^\"]*\")" apps/web/app/\(admin\) apps/web/src/features/admin apps/web/src/components/admin
```

存在しない href が無いことを目視確認 (404 trap 防止)。

## 5. 不要 import / dead code

```bash
# unused export 検出 (knip があれば優先)
mise exec -- pnpm --filter @ubm-hyogo/web exec eslint \
  --rule 'no-unused-vars: error' \
  --rule 'unused-imports/no-unused-imports: error' \
  apps/web/src/features/admin apps/web/src/components/admin apps/web/app/\(admin\)
```

検出された unused は削除。挙動変更を伴わないため git diff は import 行のみであるべき。

## 6. リファクタ後の検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
# Phase 4 §10 の vitest コマンドを再実行 (全 PASS)
# Phase 7 §3 の coverage を再実測 (目標値 ≧ 維持)
```

## 7. DoD (Phase 8)

## メタ情報

- task_id: `admin-ui-prototype-alignment`
- Phase: 8
- workflow_state: `implemented_local_runtime_pending`

## 目的

実装後の重複、navigation drift、dead code を削り、最小複雑性へ整える。

## 実行タスク

- `_shared` barrel 経由の import へ統一する
- sidebar / breadcrumb / internal link の route drift を検査する
- 不要 import と dead code を削除する

## 参照資料

- `phase-5-implementation.md`
- `phase-7-coverage.md`

## 成果物/実行手順

- refactor 後に Phase 4 targeted tests と Phase 7 coverage を再実行する

## 統合テスト連携

- refactor による regression を targeted vitest と Playwright smoke で検出する

## 完了条件

- 重複削除後も coverage と route navigation の整合が維持されている

- [ ] §2 重複削除候補が全件適用 or "適用不要" の判定で文書化されている
- [ ] §3 統一の grep が 0 件
- [ ] §4.1 sidebar vs route の差集合が空
- [ ] §5 unused 検出 0 件
- [ ] typecheck / lint / vitest / coverage が Phase 7 終了時点と同等以上
- [ ] DOM role / accessibility name が Phase 6 test と整合 (regression なし)
