# Phase 7: カバレッジ確認

> `implementation_mode: verify_existing`。広域 coverage 指定ではなく、
> **`ReflectionTimingNote.tsx` への局所カバレッジ確認**に読み替える。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 7 |
| 名称 | テストカバレッジ確認 |
| 種別 | 検証（verify_existing: 局所カバレッジ確認） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 6（テスト拡充） |

## 目的

coverage 対象を `ReflectionTimingNote.tsx` に限定し、`lastSyncLabel` 3 分岐 / surface 2 分岐 / `maxDelayMinutes` 既定・上書きが 7 ケースで line / branch ともに網羅されることを確認する。

## 実行タスク

- coverage 対象を `ReflectionTimingNote.tsx` に限定し page 配線を対象外とする（§1）。
- 関数 / ブロックの網羅状況を表で示す（§2）。
- 検証コマンド（vitest run / typecheck / lint / verify-design-tokens）を記述する（§3）。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`

## 成果物

- 本 Phase 7 検証結果（局所カバレッジ範囲限定 / 関数・ブロック網羅表 / 検証コマンド）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## [Feedback BEFORE-QUIT-002 / Feedback 5] coverage 対象範囲の限定

- coverage 対象は `apps/web/src/components/public/ReflectionTimingNote.tsx` に**限定**する。
- page 配線（`members/page.tsx` / `profile/page.tsx`）は targeted spec の対象外。page 自体の line/branch は各 page の既存テストに委ねる（本タスクで page 用 coverage を広げない）。

## 関数 / ブロックの網羅状況

| 関数 / ブロック | 種別 | 網羅する it |
|----------------|------|------------|
| `lastSyncLabel` — statsUnavailable 経路 | branch | #3 |
| `lastSyncLabel` — null 経路 | branch | #2 |
| `lastSyncLabel` — 整形（`formatJstDateTime`）経路 | branch / line | #1 |
| `ReflectionTimingNote` root（aside / data-testid / aria-label） | line | #1, #4, #7 |
| `surface === "members"` 分岐（反映目安 + 反映先差異の2文） | branch | #1, #4 |
| `surface === "profile"` 分岐（キャッシュ無し文言） | branch | #2, #5 |
| `maxDelayMinutes` 既定値 vs 上書き | branch | #4（既定）/ #6（上書き） |

`lastSyncLabel` の 3 分岐、surface 2 分岐、`maxDelayMinutes` の既定/上書き分岐がいずれも 1 つ以上の it で実行され、line / branch とも網羅される。

## 検証コマンド（リポジトリルートから）

```bash
mise exec -- pnpm exec vitest run apps/web/src/components/public/__tests__/ReflectionTimingNote.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web verify-design-tokens
```

## 完了条件

- [x] coverage 対象を `ReflectionTimingNote.tsx` に限定し、page 配線は対象外（既存 page テストに委ねる）である旨を明記した。
- [x] `lastSyncLabel` / surface 分岐 / fallback 分岐 / `maxDelayMinutes` 既定・上書きの line / branch を 7 ケースが網羅する表を示した。
- [x] 広域 coverage 指定ではなく局所検証である旨を明記した。
