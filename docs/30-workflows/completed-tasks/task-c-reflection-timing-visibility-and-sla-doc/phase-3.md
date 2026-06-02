# Phase 3: 設計レビュー（ゲート）

> Phase 4 へ進めるかを判定する設計レビューゲート。要件レビュー思考法（システム系 / 戦略・価値系 / 問題解決系）の一次結論を先に示す。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase 番号 | 3 |
| 名称 | 設計レビューゲート |
| 種別 | 検証（ゲート） |
| implementation_mode | verify_existing（PR #1064 / `745c95115` landed） |
| 依存 | Phase 2（設計） |

## 目的

Phase 2 設計が AC-C1〜C4 と不変条件（#5 / #8 / OKLch / 既存 API のみ）を満たし、責務境界・状態所有権が閉じているかを判定し、Phase 4 へ進む GO/NO-GO を決める。

## 実行タスク

- 要件レビュー一次結論（4 条件 + 真の論点）を提示する（§1）。
- 因果ループ・責務境界・状態所有権を確認する（§2）。
- 価値とコストの均衡を評価する（§3）。
- 設計リスクと対策を列挙する（§4）。
- ゲート判定（GO）を記録する（§5）。

## 参照資料

- `apps/web/src/components/public/ReflectionTimingNote.tsx`
- `apps/web/app/(public)/members/page.tsx`
- `apps/web/app/(member)/profile/page.tsx`
- `docs/00-getting-started-manual/specs/03-data-fetching.md`
- 親 workflow: `docs/30-workflows/task-member-publish-recovery-form-ops-and-admin-link/`

## 成果物

- 本 Phase 3 設計レビュー結果（4 条件評価 / リスク表 / ゲート判定 GO）。

## 統合テスト連携

本タスクは公開 `GET /public/stats` の `lastSync.responseSyncFinishedAt` を流用する read-only 表示で、新規 API / D1 変更を伴わない。品質担保はコンポーネント単体 spec（`ReflectionTimingNote.spec.tsx` 7 ケース）と既存 `/members`・`/profile` page 統合テスト（fail-soft 経路）で行う。

## 1. 要件レビュー一次結論（4条件 + 真の論点）

| 観点 | 評価 |
|------|------|
| **真の論点** | 「反映には複数遅延段（cron 同期 + ISR）が積み重なり、ユーザーが反映タイミングと反映先を自力把握できない」を 1 文で固定。現象（「壊れている」と誤解）ではなく主問題（情報の不在）に対処する。 |
| **価値性** | 会員・来訪者・管理者のサポート問い合わせコストを下げる。UI コピー + doc で恒久化し、毎回の口頭説明を不要化。 |
| **実現性** | read-only 表示 1 コンポーネント + 既存 API 流用 + doc 追記の最小厚み。既に landed 済み（実現性は実証済み）。 |
| **整合性** | データソースを公開 `GET /public/stats` に閉じ、不変条件 #5（D1 直接アクセス禁止）・親 SCOPE（既存 API のみ接続）と矛盾しない。状態所有権: コンポーネントは表示のみ（state 非所有）。 |
| **運用性** | API 拡張ゼロ。cron 間隔変更時は `maxDelayMinutes` prop と定数で追随可能。doc が SLA の単一情報源になり verify / 監査が容易。 |

## 2. 因果・境界の確認

- **バランスループ**: 反映遅延の不可視 → 問い合わせ増 → サポート負荷増。本タスクは「可視化 + doc」でループを弱める。
- **責務境界**: 表示（UI コンポーネント）と データ取得（page の `getStats`）と 同期実行（cron / runResponseSync・本タスク対象外）を混在させない。コンポーネントは props を受けるだけで fetch しない。
- **状態所有権**: `ReflectionTimingNote` は state・effect を持たない純表示。fetch 結果の所有は page（Server Component）側。

## 3. 価値とコストの均衡

- **初回価値**: 最終同期時刻 + 反映目安 + 反映先差異の 3 情報を 2 面（一覧 / マイページ）に表示。
- **高コスト項目の回避**: API 新設・D1 変更・cron 変更を避け、既存 `lastSync.responseSyncFinishedAt` を流用してコストを最小化。
- **将来層の分離**: より詳細な同期履歴（`latestSyncRuns`）は admin 診断ページ側の責務として分離（本タスクは公開面に必要十分な 1 時刻のみ表示）。

## 4. 設計上のリスクと対策

| リスク | 対策 |
|------|------|
| stats 取得失敗で profile 全体が落ちる | `getStats` を `rethrowOn` 無しで fail-soft 化（`/me/profile` のみ `AuthRequiredError` rethrow） |
| HEX 直書きで `verify-design-tokens` fail | token css variable の arbitrary value（`bg-[var(--ubm-color-...)]`）のみ使用・inline style 禁止 |
| `*.test.tsx` 命名で CI reject | spec は `*.spec.tsx` のみ（不変条件 #8） |
| 反映目安の数値が cron / ISR と乖離 | 定数（15 / 30 / 45）をコンポーネント先頭に集約し、根拠（wrangler crons / revalidate=30 / hourly compat）をコメント化 |

## 5. ゲート判定

| 判定項目 | 結果 |
|---------|------|
| AC-C1〜C4 が設計でカバーされている | PASS |
| 不変条件（#5 / #8 / OKLch / 既存 API のみ）と矛盾しない | PASS |
| 責務境界・状態所有権が閉じている | PASS |
| 1 サイクル完了スコープ（CONST_005） | PASS（既に landed・先送りなし） |

> **判定: Phase 4 へ進む（GO）**。MAJOR 指摘なし。MINOR 指摘は Phase 10 / Phase 12 の未タスク検出で扱う。

## 完了条件

- [x] 要件レビュー一次結論（4条件 + 真の論点）を提示した。
- [x] 因果ループ・責務境界・状態所有権を確認した。
- [x] 設計リスクと対策を列挙した。
- [x] ゲート判定 GO を記録した。
