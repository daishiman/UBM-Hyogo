# Phase 5: 実装（verify_existing: diff 確認）

> `implementation_mode: verify_existing`。実装は PR #1064 / commit 745c95115 で dev に landed 済み。
> 本 Phase は新規コーディングではなく **landed 差分の read-only 確認**に読み替える（副作用なし）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 5 |
| 名称 | 実装 |
| 種別 | 検証（verify_existing: landed 差分確認） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 4（テスト作成） |

## 目的

landed 済み実装差分（新規 2 / 修正 3 ファイル）を read-only で確認し、`git diff dev...HEAD` が空であること・実装要点を current facts として記述する。

## 実行タスク

- 変更ファイル一覧（新規 2 / 修正 3）を表で記載する。
- `git diff dev...HEAD -- apps/ docs/00-getting-started-manual/` が空である確認手順を記述する。
- 実装要点（生 aside + token / data-testid / fail-soft Promise.all / statsResult 流用 / `formatJstDateTime` 再利用）を current facts で記述する。
- 本 Phase が read-only（副作用なし）である旨を明記する。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`

## 成果物

- 本 Phase 5 検証結果（変更ファイル表 / landed 差分空の確認手順 / 実装要点記述）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 変更ファイル一覧（[Feedback RT-03] 必須）

| 区分 | パス | 要点 |
|------|------|------|
| 新規 | `apps/web/src/components/public/ReflectionTimingNote.tsx`（52行） | 表示専用コンポーネント本体 |
| 新規 | `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`（74行・7 it） | targeted spec |
| 修正 | `apps/web/app/(public)/members/page.tsx` | `MemberFilters` 直後に `surface="members"` で配線 |
| 修正 | `apps/web/app/(member)/profile/page.tsx` | `PublicConsentCallout` 後に `surface="profile"` で配線 |
| 修正 | `docs/00-getting-started-manual/specs/03-data-fetching.md`（:234） | 「## 反映 SLA」セクション追記 |

## landed 確認手順（read-only）

```bash
# landed 済みなので差分は空であること
git diff dev...HEAD -- apps/ docs/00-getting-started-manual/
```

上記が空出力であれば、実装は dev に取り込み済みで本 worktree に未コミット差分がない（verify_existing の前提充足）。

## 実装の要点（current facts）

- root は **生 `<aside>`** + token className（`var(--ubm-color-*)` / `var(--ubm-radius-md)`）で構成。Banner primitive は不使用。HEX 直書きなし（`verify-design-tokens` GREEN）。
- `data-testid={`reflection-timing-${surface}`}` と `aria-label="Google Form 反映タイミング"` を付与。
- page 側は **fail-soft Promise.all**（`safeServerFetch` で `PUBLIC_STATS` を握り、失敗時 `statsResult.ok=false` → `statsUnavailable`）。
- **既存 `statsResult` を流用**し新規 fetch を増やさない（members）。profile は `getStats({revalidate:60})` を `me/profile` と並列取得。
- 最終同期時刻は `formatJstDateTime` を再利用して JST 表示。

## 完了条件

- [x] 変更ファイル一覧（新規 2 / 修正 3）を表で記載済み。
- [x] `git diff dev...HEAD` が空である確認手順を記載済み。
- [x] 生 aside + token / data-testid / fail-soft Promise.all / statsResult 流用 / formatJstDateTime 再利用を current facts として記述済み。
- [x] 本 Phase が read-only（副作用なし）である旨を明記済み。
