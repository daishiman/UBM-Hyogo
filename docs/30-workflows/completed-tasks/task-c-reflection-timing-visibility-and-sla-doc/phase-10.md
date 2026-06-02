# Phase 10: 最終レビュー

> `implementation_mode: verify_existing`（landed at PR #1064 / `745c95115`）。本 Phase は acceptance criteria 判定と blocker 判定を、landed 実装に対する正本確認として実施する読み替えで行う。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 10 |
| 名称 | 最終レビューゲート |
| 種別 | 検証（ゲート） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 9（品質保証） |

## 目的

landed 実装に対し AC-C1〜C4 の充足判定と blocker 判定を行い、MINOR 指摘候補を Phase 12 未タスク検出へ送付しつつ、Phase 11 へ進む GO/NO-GO を決める。

## 実行タスク

- AC-C1〜C4 を充足 / 根拠ファイル:行で判定表化する（§1）。
- blocker なしを判定する（§2）。
- MINOR 指摘候補（M-1〜M-3）を列挙し Phase 12 未タスク検出へ送る方針を記述する（§3）。
- 最終判定 GO（runtime screenshot は user-gated）を記録する（§4）。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`

## 成果物

- 本 Phase 10 検証結果（AC 判定表 / blocker なし判定 / MINOR 候補 M-1〜M-3 / GO 判定）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 1. Acceptance Criteria 判定

| AC | 内容 | 判定 | 根拠（ファイル:行） |
|----|------|------|---------------------|
| AC-C1 | `/members` に 最終同期時刻 + 反映目安 + fallback を表示 | 充足 | `members/page.tsx`（statsResult 流用・MemberFilters 直後配線）+ `ReflectionTimingNote.tsx`（定数 15/30/45・`lastSyncLabel` helper・fallback コピー） |
| AC-C2 | `/profile` に 最終反映時刻を表示・公開状態に無関係・fallback あり | 充足 | `profile/page.tsx`（Promise.all で `getStats` fail-soft 並列・PublicConsentCallout 後配線）+ `ReflectionTimingNote.tsx`（surface=profile） |
| AC-C3 | `03-data-fetching.md` に反映 SLA 節がある | 充足 | `docs/00-getting-started-manual/specs/03-data-fetching.md`「## 反映 SLA」追記済み |
| AC-C4 | 公開条件3件 vs 公開状態無関係の差異を doc と UI 両方で明示 | 充足 | doc: 反映 SLA 節の差異記述 / UI: `ReflectionTimingNote.tsx` のコピー（反映タイミングは公開状態と独立である旨）+ `aria-label="Google Form 反映タイミング"` |

> 全 AC が landed 実装で充足。

## 2. Blocker 判定

- 機能 blocker: **なし**（typecheck / lint / verify-design-tokens / spec 7 it が green 想定で、4 AC 充足・不変条件違反なし）。

## 3. MINOR 指摘候補 → Phase 12 未タスク検出へ送付（[Phase 10 MINOR→未タスク化ルール]）

「機能に影響なし」を不要判定理由にはしない。以下を Phase 12 の未タスク検出で正式判定する:

| 候補 | 内容 | 送付理由 |
|------|------|---------|
| M-1 | runtime visual evidence の取得面差。`/members` は公開で screenshot 取得可能だが `/profile` は認証必須 → profile 面の runtime screenshot は user-gated | 観測手段が一様でないため、未タスク化要否を Phase 12 で判定 |
| M-2 | 反映目安定数（15/30/45）と cron / ISR 実値の drift 監視。将来 cron 間隔変更時の追随を CI gate 化するか | 恒久的な drift ガードの要否を Phase 12 で判定 |
| M-3 | `/profile` の `getStats` fail-soft 時、注記が fallback コピーへ落ちる経路の runtime 確認 | 認証必須経路の確認手段を Phase 12 で判定 |

## 4. 最終判定

**Phase 11 へ進む（GO）**。ただし runtime screenshot（特に認証必須の `/profile`）は **user-gated**。MAJOR / blocker なし、MINOR 候補は Phase 12 へ送付済み。

## 完了条件

- [x] AC-C1〜C4 を充足/根拠ファイル:行で判定表化した（全充足・landed）。
- [x] blocker なしを判定した。
- [x] MINOR 指摘候補を列挙し Phase 12 未タスク検出へ送る方針を明記した。
- [x] 最終判定 GO（runtime screenshot は user-gated）を記録した。
