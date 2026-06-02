# Phase 6: テスト拡充

> `implementation_mode: verify_existing`。landed 済みの 7 ケースに対し、
> **fail path / 回帰 guard の網羅性を確認**し、追加要否を判定する読み替え。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 6 |
| 名称 | テスト拡充 |
| 種別 | 検証（verify_existing: 網羅性確認） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 5（実装） |

## 目的

landed 済み 7 ケースに対し fail path / 分岐（fallback 2 経路 × surface 2 値 + `maxDelayMinutes` 上書き）の網羅性を確認し、追加回帰ガードの要否を判定する。

## 実行タスク

- fail path / 分岐の網羅状況を表で示す（§1）。
- 追加回帰ガードの要否を判定する（不要 = 現行 7 ケースで網羅済み）（§2）。
- 定数追随候補のみ Phase 12 へ送付する旨を記述する。
- `*.spec.tsx` 限定（不変条件 #8）を明記する（§3）。

## 参照資料

- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/src/components/public/ReflectionTimingNote.tsx`

## 成果物

- 本 Phase 6 検証結果（fail path 網羅表 / 追加不要判定 / 定数追随候補の送付方針）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## fail path / 分岐の網羅状況

| 分岐軸 | 値 | カバー it |
|--------|----|----------|
| `surface` | members | #1, #3, #4 |
| `surface` | profile | #2, #5 |
| `lastSyncAt` | 正常値（JST 整形経路） | #1 |
| `lastSyncAt` | null（「まだ同期されていません」） | #2 |
| `statsUnavailable` | true（「取得できませんでした」fallback） | #3 |
| `maxDelayMinutes` | 上書き（20分） | #6 |
| `data-testid` | surface 別の出し分け | #7 |

`lastSyncLabel` の 3 経路（statsUnavailable / null / 整形）と surface 2 値の組合せ、`maxDelayMinutes` 上書きが既存 7 ケースで網羅済み。

## 追加回帰ガード判定

- 現行 7 ケースで **fail path（fallback 2 経路 × surface 2 値 + 上書き）を網羅済み**と判定。新規追加は不要。
- 将来 cron 間隔（15分 / 30秒 / 45分 定数）が変わった場合の回帰は、#4 / #6 の数値アサーションが検知する。定数変更時にテスト更新が必要になる旨のみ Phase 12 の未タスク候補メモへ送る（必須未タスクではない）。

## 制約

- 新規 test ファイルは `*.spec.tsx` のみ（不変条件 #8。`*.test.tsx` 禁止）。既存 spec も準拠済み。

## 完了条件

- [x] fallback 2 経路（null / statsUnavailable）と surface 2 値の組合せが網羅済みである旨を表で示した。
- [x] `maxDelayMinutes` 上書きのカバーを確認した。
- [x] 追加回帰ガードの要否を判定（不要 = 現行 7 ケースで網羅済み）し、定数追随候補のみ Phase 12 へ送付する旨を記載した。
- [x] `*.spec.tsx` 限定（不変条件 #8）を明記した。
