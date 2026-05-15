# Phase 1: 要件定義

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog}.tsx` の `onSubmit` ロジックに `router.refresh()` 呼び出しを追加し、対応する `*.component.spec.tsx` に検証ケースを追加するコード変更タスク。仕様策定単体では完結しない。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | profile mutation 成功後の RequestPendingBanner 即時反映（router.refresh 局所化） |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | completed |

## 目的

profile mutation 成功後に `RequestPendingBanner` を page reload なしで即時反映する改修の必要性・スコープ・受入条件を確定し、Phase 2 設計に渡す入力を Phase 1 で固定する。特に以下 4 つの真の論点を本 Phase で明文化する:

1. mutation 後の **revalidation 戦略**: `router.refresh()` vs SWR `mutate()` vs optimistic update
2. `router.refresh()` の **呼び出し位置**: dialog ローカル vs `RequestActionPanel.onSubmitted` callback
3. dialog 内での **呼び出し順序**: `router.refresh()` と `onSubmitted` / `onClose` の順序
4. mutation **failure case の取り扱い**（409 / 422 / network error）での refresh 挙動

## 真の論点

### 論点 1: revalidation 戦略

選択肢:
- **(A) `router.refresh()`**: Next.js App Router の Server Component を再 fetch。`apps/web/app/profile/page.tsx` が `dynamic = "force-dynamic"` + `revalidate = 0` で SSR 常時実行されるため、`/me/profile` の最新 `pendingRequests` を取得可能。**第一推奨**。
- **(B) SWR `mutate()`**: 本リポジトリ profile route は SWR を採用せず、Server Component 経由で props を流している。SWR 導入は overscope。**不採用**。
- **(C) optimistic update**: client 側で `pendingRequests` を仮構築すると、server state との二重管理になり 409 衝突時の rollback コストが上昇。spec.md 4.1 章で「server state を正本にする（S1）」と明記。**不採用**。

→ Phase 1 では **(A) `router.refresh()`** を採用として確定する。

### 論点 2: 呼び出し位置

選択肢:
- **(A) dialog ローカル（`useRouter()` を dialog 内で呼ぶ）**: dialog の成功要件として banner 反映を内包。spec.md line 91 で採用判定。**第一推奨**。
- **(B) `RequestActionPanel.onSubmitted` callback**: 既に `RequestActionPanel.tsx:59` に実装済（既存）。dialog 側は callback 経由でしか refresh を発火できないが、callback の実行タイミングが `onClose()` 直前で unmount の race を内包する。
- **(C) 両方併用**: 冗長。実害は無いが意図不明確。

→ Phase 1 では **(A) dialog ローカル** を採用。`RequestActionPanel.tsx` の既存 `router.refresh()` は Phase 10 で削除し、accepted response bridge state に再構成する。

### 論点 3: 呼び出し順序

選択肢:
- **(A) `router.refresh() → onSubmitted() → onClose()`**: refresh を先に schedule してから dialog を閉じる。unmount 後の navigation API 警告を回避。spec.md line 96-115 で採用済。**第一推奨**。
- **(B) `onSubmitted() → onClose() → router.refresh()`**: `onClose()` で dialog component が unmount された後に refresh を呼ぶと、unmounted component から navigation API 呼び出し warning が発生する可能性。**不採用**。
- **(C) `onSubmitted() → router.refresh() → onClose()`**: 機能上は問題ないが、(A) と比べて refresh schedule が 1 tick 遅れる。差分は実用上無視可能だが (A) のほうが意図明示的。

→ Phase 1 では **(A) `router.refresh() → onSubmitted() → onClose()`** を採用として確定する。

### 論点 4: failure case の取り扱い

選択肢:
- **(A) success branch のみで refresh、failure では呼ばない**: 409 (DUPLICATE_PENDING_REQUEST) は既存 pending があるという情報、422 は validation error、network error は server に到達していない可能性。server state は変化していないため refresh は不要。spec.md line 51-54 で採用済。**第一推奨**。
- **(B) 全 case で refresh**: 不要な server 往復が発生し、429 risk も高める。**不採用**。
- **(C) 409 のみ refresh**: 409 時は既存 pending を表示するため refresh で server state を再取得する価値はある。ただし spec.md line 81-88 で client 側に既に「existing-pending」injection が実装済みのため refresh は重複。**不採用**。

→ Phase 1 では **(A) success branch のみで refresh** を採用として確定する。

## 依存境界と責務

| 種別 | 対象 | 境界 |
| --- | --- | --- |
| 上流 | `apps/api/src/routes/internal/me-requests.ts`（仮称・既存 endpoint） | 改変禁止。response schema 不変 |
| 上流 | `apps/web/app/profile/page.tsx` | `dynamic = "force-dynamic"` + `revalidate = 0` を確認のみ（変更なし） |
| 上流 | `apps/web/app/profile/_components/RequestActionPanel.tsx` | `onSubmitted` callback を `QueueAccepted` bridge state 更新へ再構成 |
| 連携 | `apps/web/src/lib/api/me-requests.ts`（client helper） | 既存 `requestVisibilityChange` / `requestDelete` をそのまま利用 |
| 対象外 | `apps/api` 全般 | 不要 |
| 対象外 | D1 schema | 不要 |
| 対象外 | Google Form 仕様 | 不要 |
| 対象外 | OKLch tokens | 不要 |

## 価値とコスト評価

- **初回提供価値**: mutation 成功直後に `RequestPendingBanner` が即時表示される。page reload を促す UX 矛盾を解消。screen reader (`aria-live="polite"`) でも即時読み上げ
- **初回に払わないコスト**: SWR 導入、optimistic update infra、新規 API endpoint
- **設計コスト**: Phase 2 成果物 1 件 + Phase 3 レビュー 1 件
- **実装コスト見積（Phase 4 以降）**:
  - `VisibilityRequestDialog.tsx`: `useRouter` import + router 宣言 + success branch に 1 行追加（約 4 行差分）
  - `DeleteRequestDialog.tsx`: 同上（約 4 行差分）
  - `VisibilityRequestDialog.component.spec.tsx`: `useRouter` mock + 検証ケース 1 件追加（約 30 行）
  - `DeleteRequestDialog.component.spec.tsx`: 同上（約 30 行）
- **運用コスト**: なし（既存 endpoint / 既存 binding のみ利用）

## 4 条件評価

| 条件 | 問い | 判定 | 解消条件 |
| --- | --- | --- | --- |
| 価値性 | mutation 成功後に reload なしで banner が出るか | PASS | — |
| 実現性 | 既存 API endpoint / page directive で実現可能か | PASS | `page.tsx` に `dynamic = "force-dynamic"` + `revalidate = 0` を Phase 2 で再確認 |
| 整合性 | UI prototype alignment 不変条件（既存 API 不変・OKLch 無関係・D1 不変）と整合するか | PASS | — |
| 運用性 | failure case で不要 refresh が発生せず、429 risk を増やさないか | CONDITIONAL | 論点 4 の (A) を Phase 2 設計で固定 |

## 既存資産インベントリ

| 資産 | 確認結果 | 参照 |
| --- | --- | --- |
| `VisibilityRequestDialog.tsx` | `onSubmit` 内 line 73-90 で `requestVisibilityChange` 呼び出し → success branch (line 77-79) で `onSubmitted(res.accepted)` → `onClose()`。`useRouter` import なし | apps/web/app/profile/_components/VisibilityRequestDialog.tsx:66-96 |
| `DeleteRequestDialog.tsx` | `onSubmit` 内 line 59-87 で `requestDelete` 呼び出し → success branch (line 68-70) で `onSubmitted(res.accepted)` → `onClose()`。`useRouter` import なし | apps/web/app/profile/_components/DeleteRequestDialog.tsx:59-87 |
| `RequestActionPanel.tsx` | 修正前は `onSubmitted` callback 内に `router.refresh()` 実装。修正後は `QueueAccepted` bridge state 更新を担当 | apps/web/app/profile/_components/RequestActionPanel.tsx |
| `VisibilityRequestDialog.component.spec.tsx` | TC-U-05/06/07/08, TC-A-02, 409, network error の 6 ケース実装済。`useRouter` mock なし | apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx |
| `DeleteRequestDialog.component.spec.tsx` | 既存テストあり（詳細は Phase 7 で再確認） | apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx |
| `profile/page.tsx` | `dynamic = "force-dynamic"`, `revalidate = 0`（spec.md line 25 引用） | apps/web/app/profile/page.tsx |

## スコープ確定

### 含む

- `VisibilityRequestDialog.tsx` と `DeleteRequestDialog.tsx` の `onSubmit` success branch への `router.refresh()` 追加
- 2 dialog の spec.tsx に router.refresh 検証ケース追加
- Playwright e2e で VISUAL evidence 取得

### 含まない

- `apps/api` 配下の変更
- 新規 endpoint / D1 schema / Google Form
- OKLch token / 色変更

## 受入条件 (AC) 確認

index.md の AC-1〜AC-8 を Phase 1 で正式承認する。AC-1〜AC-3 は Phase 2 設計、AC-4〜AC-6 は Phase 7 テスト計画、AC-7 は Phase 11 evidence、AC-8 は Phase 9 受入確認で達成する。

## 用語集

| 用語 | 意味 |
| --- | --- |
| `router.refresh()` | Next.js App Router の `useRouter` hook が返す API。現在の route の Server Component を再 fetch し、client component の state は保持する |
| pendingRequests | `/me/profile` endpoint が返す server state object。`{ visibility?: { createdAt }, delete?: { createdAt } }` 形式 |
| RequestPendingBanner | `pendingRequests` を受け取って表示する presentational component。`aria-live="polite"` で screen reader 対応 |
| QueueAccepted | mutation success 時のレスポンス型。`{ queueId, type, status: "pending", createdAt }` |
| server state 正本 | client 側で楽観的に state を作らず、server の `/me/profile` の値を表示する設計方針（spec.md S1） |
| Monday gate 不要 | 本タスクは cron 系ではないため UTC Monday 判定などは無関係 |

## 実行タスク

- [ ] 原典 spec.md 全体を読み込み、4.1〜10 章を本 spec に反映する
- [ ] `VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx` / `RequestActionPanel.tsx` の現状行番号を本 spec に転記する
- [ ] 真の論点 4 点を Phase 1 で明文化する
- [ ] 4 条件評価を実施し、CONDITIONAL の解消条件を Phase 2 へ申し送る
- [ ] 既存資産インベントリを行番号付きで記録する
- [ ] `outputs/phase-01/requirements.md` を作成する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md | 原典仕様書 |
| 必須 | apps/web/app/profile/_components/VisibilityRequestDialog.tsx | 変更対象 |
| 必須 | apps/web/app/profile/_components/DeleteRequestDialog.tsx | 変更対象 |
| 必須 | apps/web/app/profile/_components/RequestActionPanel.tsx | 確認対象 |
| 必須 | CLAUDE.md | UI prototype alignment 不変条件 |
| 参考 | https://nextjs.org/docs/app/api-reference/functions/use-router#routerrefresh | Next.js router.refresh 仕様 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（4 論点・4 条件評価・既存資産インベントリ・用語集） |

## 完了条件

- [ ] 4 つの真の論点が文書化されている
- [ ] 4 条件評価が PASS / CONDITIONAL で記録されている
- [ ] AC-1〜AC-8 が Phase 1 で正式承認されている
- [ ] 既存資産インベントリが行番号付きで記録されている
- [ ] downstream handoff（Phase 2 への引き継ぎ事項）が明記されている
- [ ] `outputs/phase-01/requirements.md` が作成されている

## タスク 100% 実行確認【必須】

- 全実行タスク completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（409 DUPLICATE_PENDING_REQUEST / 422 INVALID_REQUEST / network error / AuthRequiredError）の取り扱いを Phase 2 へ申し送る

## 次 Phase

- 次: 2 (設計)
- 引き継ぎ事項:
  - 論点 1〜4 の採用案（A / A / A / A）を Phase 2 設計の前提として固定
  - CONDITIONAL（運用性）の解消は Phase 2 で failure path を refresh しない設計として明記
  - 既存資産インベントリの行番号を Phase 2 設計内のコード参照に転記
  - `RequestActionPanel.tsx` の既存 `router.refresh()` は Phase 10 で削除し、bridge state 化する
- ブロック条件: `outputs/phase-01/requirements.md` 未作成 / CONDITIONAL 解消条件未記録 の場合は Phase 2 に進まない
