# Phase 3: 設計レビュー — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 3 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

Phase 2 設計を、不変条件・苦戦箇所 S1-S5・既存 contract（06b-A / 06b-B）と突合してレビューし、欠落・矛盾を Phase 4 以降に持ち越さない。

## 実行タスク

1. 不変条件 #4 / #5 / #11 が「構造的に違反不可能」になっているか確認する。
2. 苦戦箇所 S1-S5 が Phase 2 で全て吸収されているか確認する。
3. 既存 `MeProfileResponseZ` 利用箇所への波及（後方互換性）を確認する。
4. レビュー指摘を Phase 2 に差し戻すべきものと、Phase 4-5 で吸収すべきものに振り分ける。

## 参照資料

| 資料名 | パス |
| --- | --- |
| Phase 1 | `outputs/phase-01/main.md` |
| Phase 2 | `outputs/phase-02/main.md` |
| 既存 MeProfileResponseZ 利用箇所 | `apps/web/`, `apps/api/` 全体 |

## レビュー観点表

### 不変条件チェック

| 不変条件 | チェック | 期待 |
| --- | --- | --- |
| #4 profile body 編集禁止 | `RequestActionPanel` props に body 系 field が増えていないか | OK（pendingRequests のみ追加） |
| #5 D1 直接アクセス禁止（apps/web） | `apps/web` 内に `cloudflare:d1` import がないか・新規 SQL なし | OK（D1 は services 経由） |
| #11 `:memberId` を web API path に出さない | BFF passthrough の URL が `/me/profile` のみか | OK（S3: 相乗り） |

### 苦戦箇所反映チェック（S1-S5）

| ID | チェック | 結果根拠 |
| --- | --- | --- |
| S1 | `RequestActionPanel` の disabled 判定で server pending が最優先されているか | Phase 2 props 仕様で `pendingRequests` を初期値として固定 |
| S2 | `authGateState` enum を新規宣言していないか | Phase 2 で type 拡張は `PendingRequestsZ` のみ。enum 再宣言なし |
| S3 | BFF `route.ts` を passthrough のまま使い `:memberId` を path に出していないか | Phase 2 「変更なし」明記 |
| S4 | Phase 11 を `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` / `blocked_runtime_evidence` で受けられるか | Phase 11 status を runtime 側委譲設計 |
| S5 | 409 で新 error code を増やさず `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` を再利用しているか | Phase 1 / 2 で再利用明記 |

### 後方互換性チェック

| 項目 | 影響 | 対応 |
| --- | --- | --- |
| `MeProfileResponseZ` に必須 field 追加 | 既存 client が old schema を期待 | `pendingRequests` を **必須**にして API/web を同一 commit で更新（S1 server 正本維持）。staging で先に deploy → web を後追いの順序を Phase 13 で明示 |
| `getPendingRequestsForMember` 追加 | 既存 services への影響 | 純粋追加・既存関数の signature 変更なし |
| `RequestActionPanel` props 追加 | page.tsx 以外からの使用 | grep で他利用なしを確認。Phase 5 で再 grep |

### コード境界レビュー

| 境界 | レビュー結果 |
| --- | --- |
| Server Component / Client Component | `page.tsx` は server のまま、`RequestActionPanel` は client のまま。境界変更なし |
| BFF passthrough | 変更なし（S3） |
| /me/* API | `GET /me/profile` のみ拡張、新規 endpoint 追加なし |

## 指摘の振り分け

| 種別 | 内容 | 振り分け先 |
| --- | --- | --- |
| Phase 2 差戻し | （該当なしの場合は「なし」と記録） | - |
| Phase 4 で吸収 | E2E reload 永続性 TC を必ず採番 | Phase 4 |
| Phase 5 で吸収 | grep gate（`cloudflare:d1` 0 件 / `:memberId` web path 0 件） | Phase 5 |
| Phase 9 で吸収 | coverage 目標（line 80%、branch 60%） | Phase 9 |

## サブタスク管理

- [ ] 不変条件 3 件チェック完了
- [ ] 苦戦箇所 S1-S5 反映確認
- [ ] 後方互換性チェック完了
- [ ] 指摘振り分け表完成
- [ ] `outputs/phase-03/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 設計レビュー | `outputs/phase-03/main.md` |

## 完了条件

- [ ] 不変条件・S1-S5・後方互換性・コード境界の 4 観点で OK が確認されている
- [ ] 指摘がある場合は振り分け先が明示されている
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] レビュー結果が「無検証 PASS」になっていない（根拠が表で示されている）

## 次 Phase への引き渡し

Phase 4 へ、レビュー結果と Phase 4 で吸収すべき指摘（E2E reload 永続性 TC 採番）を渡す。
