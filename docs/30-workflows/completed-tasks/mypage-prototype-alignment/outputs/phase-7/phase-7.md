# Phase 7: カバレッジ確認

> workflow: mypage-prototype-alignment
> 目的: 本タスクで **変更/新規追加したファイル・ブロックに限定**して coverage を可視化し、純粋関数は line/branch 100% を実測証跡として残す。

## 7.0 方針（[Feedback BEFORE-QUIT-002] / [Feedback 5]）

coverage の対象は **本タスクで変更・新規追加した範囲のみ**とし、`/profile` 配下や `apps/web` 全体の一律 X% 指定はしない。広域の総量目標ではなく、変更行の保護を実測値で残すことを目的とする。Phase 6 までで作成したテストが下記の主要分岐をすべて覆っているかを 1 ブロックずつ突合し、未到達分岐が出た場合は Phase 6 のテストへ追記してから Phase 7 を閉じる。

## 7.1 coverage 対象範囲（限定）

| カテゴリ | 対象ファイル | 目標 | 備考 |
|----------|--------------|------|------|
| 純粋関数 | `apps/web/app/profile/_lib/visibility-counts.ts`（new） | **line 100% / branch 100%** | 実測値を証跡に残す |
| 純粋関数 | `apps/web/app/profile/_lib/profile-summary.ts`（new） | **line 100% / branch 100%** | stableKey 欠損経路を含む |
| component | `apps/web/app/profile/_components/StatusSummary.tsx`（StatusBanner へ再構成） | 主要分岐覆い | publishState 3 値 |
| component | `apps/web/app/profile/_components/VisibilitySummary.tsx`（new） | 主要分岐覆い | counts 0/正/未知混在 |
| component | `apps/web/app/profile/_components/ProfilePreview.tsx`（new） | 主要分岐覆い | summary 欠損時空表示 |
| component | `apps/web/app/profile/_components/ProfileFields.tsx`（Card/KVList 再構成） | 主要分岐覆い | renderValue 各型 |
| component | `apps/web/app/profile/_components/EditCta.client.tsx`（client 化） | 主要分岐覆い | editResponseUrl null / Modal open |
| component | `apps/web/app/profile/_components/RevalidateModal.tsx`（new） | 主要分岐覆い | open true/false |
| component | `apps/web/app/profile/_components/RequestActionPanel.tsx`（danger-zone 再構成） | 既存テスト非破壊 + 追加分岐 | rulesConsent / publishState |
| layout | `apps/web/src/components/layout/MemberHeader.tsx`（動線強化） | 主要分岐覆い | nav リンク存在 |

### 対象外（coverage 評価から除外する範囲）

- `apps/web/app/profile/page.tsx`（Server Component の合流点）: line coverage の数値目標は課さず、後述の **dependency edge 確認**（7.4）で props 配線を検証する。
- `AttendanceList.tsx` / `VisibilityRequest.client.tsx` / `DeleteRequest.client.tsx` / `*Dialog.tsx` / `RequestPendingBanner.tsx` / `RequestErrorMessage.tsx`: 本タスクで挙動を変更しない（既存テストの GREEN 維持のみ確認）。
- `apps/api/**`: API surface 不変のため対象外。
- `apps/web/src/components/ui/**`（既存 primitives）: 本タスクで API 変更なし。

## 7.2 coverage 実行コマンド

```bash
# /profile 配下に限定して coverage を測定（純粋関数 + component）
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage apps/web/app/profile

# 純粋関数 2 本だけを単独で測り line/branch 100% を確定させる
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage apps/web/app/profile/_lib

# MemberHeader 単体
mise exec -- pnpm --filter @ubm-hyogo/web test -- --coverage apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx
```

> root config 経由（`apps/web/package.json` の `test` script は `--root=../..`）のため、`--filter @ubm-hyogo/web` で対象 workspace を固定する。targeted run のファイルリストは Phase 1 §1.6 の列挙に従う。

## 7.3 主要分岐の覆い可視化（変更ブロック保護の実測対象）

### 純粋関数（line/branch 100% を必達・実測値を証跡へ）

| 関数 | 入力分岐 | 期待 | 証跡欄（実測） |
|------|----------|------|----------------|
| `deriveVisibilityCounts(sections)` | `visibility === "public"` | public += 1 | line ___% / branch ___% |
| `deriveVisibilityCounts(sections)` | `visibility === "member"` | member += 1 | （同上で 100% 確認） |
| `deriveVisibilityCounts(sections)` | `visibility === "admin"` | admin += 1 | |
| `deriveVisibilityCounts(sections)` | 未知 visibility 値 | いずれも増えない（無視 / [WEEKGRD-02]） | 未知分岐を 1 ケース必須 |
| `deriveVisibilityCounts(sections)` | 空 sections / 空 fields | `{public:0, member:0, admin:0}` | 空ループ分岐 |
| `pickProfileSummary(sections)` | displayName 用 stableKey 存在 | `displayName` に値 | |
| `pickProfileSummary(sections)` | subtitle 用 stableKey 存在 | `subtitle` に値 | |
| `pickProfileSummary(sections)` | chips 用 stableKey（nickname / location / ubmMembershipType）存在 | `chips` に値（tone は neutral 固定） | |
| `pickProfileSummary(sections)` | 対象 stableKey 欠損 | 空表示（`displayName=""` 等・例外を投げない） | **欠損分岐を必須** |

> 4 条件の評価: 純粋関数は副作用なし・防御的返却（[WEEKGRD-02]）のため、入力分岐の全列挙で line/branch 100% に到達できる。到達しない分岐が出た場合は Phase 6 のテストへ戻して追記する。

### component（主要分岐の覆い確認 — 数値より分岐網羅を優先）

| component | 覆うべき主要分岐 | テストケース起点 |
|-----------|------------------|------------------|
| StatusBanner（StatusSummary） | publishState `public` → tone=success | TC で 3 値分岐 |
| StatusBanner | publishState `member_only` → tone=info | |
| StatusBanner | publishState `hidden` → tone=warning | |
| VisibilitySummary | counts すべて 0（空 sections） | Stat × 3 が 0 表示 |
| VisibilitySummary | counts 混在（public/member/admin 各 >0） | |
| VisibilitySummary | 未知 visibility が混じっても 3 種以外を出さない | deriveVisibilityCounts 経由 |
| ProfilePreview | summary に値あり（displayName/subtitle/chips） | |
| ProfilePreview | summary 欠損（displayName 空 / chips 空） | 空表示分岐必須 |
| ProfileFields | renderValue: null/undefined → 「（未回答）」 | |
| ProfileFields | renderValue: 配列 / date オブジェクト / boolean / 文字列 | 各型分岐 |
| EditCta.client | editResponseUrl 非 null → 有効リンク | |
| EditCta.client | editResponseUrl null → `editResponseUrl ?? fallbackResponderUrl` で fallback リンク | null 分岐必須 |
| EditCta.client | Modal open / close トグル | open true/false |
| RevalidateModal | open=true で内容描画 / open=false で非描画 | |
| RequestActionPanel | rulesConsent !== "consented" → disabled panel | 既存分岐維持 |
| RequestActionPanel | publishState public → 公開停止ボタン / hidden・member_only → 再公開ボタン | |
| MemberHeader | マイページ / 公開ページ / ログアウト の 3 動線が存在 | data-testid 維持 |

## 7.4 dependency edge 確認（page.tsx → 子 component の props 配線）

page.tsx は coverage 数値目標の対象外だが、Server Component の **props 配線の正しさ**を edge 単位で確認する（合流点のため drift が起きやすい）。

| edge（page.tsx → 子） | 渡す props | 確認方法 |
|------------------------|-----------|----------|
| `ProfileHeader`（or page-head）→ | `memberId`, `publishState`, `editResponseUrl`, `fallbackResponderUrl` | typecheck + Playwright smoke（page-head 表示） |
| `StatusBanner` ← `StatusSummary` | `statusSummary`, `authGateState` | typecheck |
| `VisibilitySummary` ← | `sections`（= `profile.sections`） | typecheck（`deriveVisibilityCounts` の入力型一致） |
| `ProfilePreview` ← | `memberId`, `displayName`, `subtitle`, `chips`（= `pickProfileSummary(sections)`） | typecheck |
| `ProfileFields` ← | `sections` | typecheck |
| `EditCta.client` ← | `editResponseUrl`, `fallbackResponderUrl`, `variant` | typecheck（client 境界） |
| `RequestActionPanel` ← | `publishState`, `rulesConsent`, `pendingRequests` | 既存配線維持（diff なし） |
| `MemberHeader` ← | （props なし） | 既存維持 |

> dependency edge の検証は `mise exec -- pnpm typecheck`（props 型整合）と Playwright smoke（4 領域 + RevalidateModal open）を主証跡とする。page.tsx の line coverage 値は記録しない。

## 7.5 完了条件

1. 純粋関数 2 本（`visibility-counts.ts` / `profile-summary.ts`）の line/branch が **実測 100%**で、§7.3 の表に実測値を記録した。
2. §7.3 の component 主要分岐（publishState 3 値 / editResponseUrl null / visibility 3 種 + 未知 / summary 欠損）がすべてテストで覆われている。
3. 未到達分岐が見つかった場合は Phase 6 へ戻してテストを追記し、再測定で覆ったことを確認した。
4. §7.4 の page.tsx → 子 component の props 配線が typecheck + Playwright smoke で確認できた。
5. 対象外範囲（既存 Dialog / AttendanceList / API / primitives）の既存テストが GREEN を維持している。
