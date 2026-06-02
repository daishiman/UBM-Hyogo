# Phase 4: テスト作成（verify_existing: targeted test 確認）

> `implementation_mode: verify_existing`（PR #1064 / commit 745c95115 で dev に landed 済み）。
> 本 Phase は TDD RED ではなく、**既実装テストが AC をどうカバーするかの確認**に読み替える。
> landed のため `ReflectionTimingNote.spec.tsx` は既に GREEN（RED フェーズは不要）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 4 |
| 名称 | テスト作成 |
| 種別 | 検証（verify_existing: 既存テスト確認） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 3（設計レビューゲート） |

## 目的

landed 済みの `ReflectionTimingNote.spec.tsx`（7 ケース）が AC-C1〜C4 をどうカバーするかを確認し、RED 不要・GREEN 済みである旨を正本記述する。

## 実行タスク

- 対象テスト（`ReflectionTimingNote.spec.tsx` 7 it）を特定する。
- テスト構成（testing-library + vitest + jsdom、`formatJstDateTime` 実 helper 利用・TZ 非依存）を記述する。
- 7 it → AC-C1〜C4 の写像表を作成する。
- external prop 駆動で internal state を検証しない設計を明記する。

## 参照資料

- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`

## 成果物

- 本 Phase 4 検証結果（it → AC マッピング表 / テスト構成記述 / GREEN 済み宣言）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 対象テスト

- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`（7 it・新規 landed）

## テスト構成

- testing-library/react + vitest + jsdom、`afterEach(cleanup)` でレンダ間を隔離。
- `formatJstDateTime` は**実 helper を使用しモックしない**。helper 内で TZ を `Asia/Tokyo` 固定するため、テスト実行環境の TZ に非依存で安定。
- `ReflectionTimingNote` は **internal state / effect を持たない純表示コンポーネント**。テスト操作対象は external prop（`surface` / `lastSyncAt` / `maxDelayMinutes` / `statsUnavailable`）のみで、内部状態の検証は不要（props vs internal state の区別）。

## it → AC マッピング

| # | it（要旨） | カバー AC | 主な期待値 |
|---|-----------|----------|-----------|
| 1 | members は最終同期と公開条件を表示 | AC-C1 | `/最終同期:/`（JST 含む）, `/キャッシュ待ち/`, `/公開同意 \+ 公開設定 \+ 未削除/` |
| 2 | profile は公開状態に関係なく反映 | AC-C2 | lastSyncAt=null → 「最終同期: まだ同期されていません」, `/公開状態に関係なく/` |
| 3 | statsUnavailable の fallback | AC-C3 | members + null + statsUnavailable → 「最終同期時刻を取得できませんでした」 |
| 4 | members の反映目安に 15分/30秒/45分 | AC-C4 | `aria-label="Google Form 反映タイミング"` の textContent に「最大約 15 分」「最大 30 秒」「最大約 45 分」 |
| 5 | profile はキャッシュ無し文言・30秒非表示 | AC-C2 | 「キャッシュを使わない」含む / 「30 秒」含まない |
| 6 | maxDelayMinutes 上書き | AC-C4 | maxDelayMinutes=20 → `/最大約 20 分/` |
| 7 | surface 別 data-testid | AC-C1/C2 | `reflection-timing-members` / rerender で `reflection-timing-profile` |

## 完了条件

- [x] 7 it が AC-C1〜C4 へ漏れなく写像されている（上表）。
- [x] テストは external prop 駆動で internal state を検証しない旨を明記済み。
- [x] `formatJstDateTime` 実 helper 利用・TZ 環境非依存である旨を明記済み。
- [x] landed のため RED 不要・GREEN 済みである旨を明記済み。
