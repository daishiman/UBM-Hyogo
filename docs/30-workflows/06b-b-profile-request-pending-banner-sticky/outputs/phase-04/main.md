# Phase 4: テスト戦略 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 4 / 13 |
| wave | 06b-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

unit / integration / E2E の 3 層で reload 永続性を含むテストを採番し、TDD Red→Green の順序で実装可能なレベルまで具体化する。

## テストレベルと採番

### Unit Tests

| TC ID | 対象 | ケース | 期待 |
| --- | --- | --- | --- |
| TC-U-01 | `getPendingRequestsForMember` | pending なし | `{}` |
| TC-U-02 | `getPendingRequestsForMember` | visibility のみ pending | `{ visibility: {...} }` |
| TC-U-03 | `getPendingRequestsForMember` | delete のみ pending | `{ delete: {...} }` |
| TC-U-04 | `getPendingRequestsForMember` | 同種複数 pending（理論上 unique 制約だが防御） | 最新 1 件 |
| TC-U-05 | `getPendingRequestsForMember` | resolved/rejected は除外 | `{}` |
| TC-U-06 | `PendingRequestsZ` zod | 正常 parse | success |
| TC-U-07 | `PendingRequestsZ` zod | desiredState invalid | failure |
| TC-U-08 | `RequestActionPanel` | server pending visibility あり | 公開停止ボタン disabled、banner 表示 |
| TC-U-09 | `RequestActionPanel` | server pending delete あり | 退会ボタン disabled、banner 表示 |
| TC-U-10 | `RequestActionPanel` | server pending なし → submit-in-flight | 楽観的 disabled |
| TC-U-11 | `RequestActionPanel` | server pending あり + submit-in-flight | server 優先（S1） |

### Integration Tests

| TC ID | 対象 | ケース |
| --- | --- | --- |
| TC-I-01 | `GET /me/profile` | pending なしで response に `pendingRequests: {}` |
| TC-I-02 | `GET /me/profile` | visibility pending を作成後、response に visibility が含まれる |
| TC-I-03 | `GET /me/profile` | delete pending を作成後、response に delete が含まれる |
| TC-I-04 | `GET /me/profile` | resolved 後の response から該当 pending が消える |
| TC-I-05 | `POST /me/visibility-request` 再 submit | 409 + `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')`（S5 の既存挙動を再確認） |
| TC-I-06 | BFF passthrough | `/api/me/profile` → `apps/api` への透過、URL に `:memberId` 不在（S3） |

### E2E Tests（Playwright・reload 永続性）

| TC ID | シナリオ |
| --- | --- |
| TC-E-01 | visibility 申請 submit → reload → banner 表示・公開停止ボタン disabled（AC-1, AC-2） |
| TC-E-02 | delete 申請 submit → reload → banner 表示・退会ボタン disabled |
| TC-E-03 | 別タブで pending 作成 → 本タブ reload → 反映 |
| TC-E-04 | admin による approve シミュレーション後 reload → banner 消滅 |
| TC-E-05 | stale UI（pending 作成後にネットワーク切断 → 復帰）→ 再 submit → 409 user-visible（AC-3, S5） |
| TC-E-06 | BFF passthrough URL の確認（network panel で `/api/me/profile` のみ・`:memberId` 不在） |

## TDD 順序

1. TC-U-06 / TC-U-07（schema 拡張）→ Red→Green
2. TC-U-01..05（services 関数）→ Red→Green
3. TC-I-01..04（API ハンドラ拡張）→ Red→Green
4. TC-U-08..11（RequestActionPanel disabled 判定）→ Red→Green
5. TC-I-05 / TC-I-06（既存挙動再確認）→ 既存 PASS のはず・regression 防止
6. TC-E-01..06（Playwright reload）→ Red→Green

## カバレッジ目標（CONST_005）

| メトリクス | 目標 |
| --- | --- |
| Line coverage（追加分） | 80% |
| Branch coverage（追加分） | 60% |
| Function coverage（追加分） | 80% |

## ローカル実行コマンド（CONST_005）

```bash
mise exec -- pnpm --filter @ubm/api test --run -- services.pending
mise exec -- pnpm --filter @ubm/api test --run -- index.profile
mise exec -- pnpm --filter @ubm/web test --run -- RequestActionPanel
mise exec -- pnpm --filter @ubm/web exec playwright test profile-pending-sticky
mise exec -- pnpm --filter @ubm/web test --run --coverage
```

## 追加テストファイル一覧（CONST_005）

| 種別 | パス |
| --- | --- |
| 新規 | `apps/api/src/routes/me/__tests__/services.pending.test.ts` |
| 拡張 | `apps/api/src/routes/me/__tests__/schemas.test.ts`（または同等の既存ファイル） |
| 拡張 | `apps/api/src/routes/me/__tests__/index.profile.test.ts`（既存ならば） |
| 拡張 | `apps/web/app/profile/_components/__tests__/RequestActionPanel.test.tsx` |
| 新規 | `apps/web/playwright/tests/profile-pending-sticky.spec.ts` |

## E2E モック / fixture 戦略

- 認証 fixture は 06b-A の `apps/web/playwright/fixtures/auth.ts` を再利用
- `GET /me/profile` を route mock し、`pendingRequests` 入りの response を返す（reload 後にも同 mock が応答することで sticky 性を検証）
- POST submit は 06b-B 既存 mock を再利用

## DoD（Phase 4）

- [ ] TC-U-01..11 / TC-I-01..06 / TC-E-01..06 が採番されている
- [ ] TDD 順序が示されている
- [ ] カバレッジ目標が記載されている
- [ ] reload 永続性 E2E TC が含まれている

## 多角的チェック観点

- reload 永続性が E2E で必ず確認されているか
- S5（重複 409）の既存挙動が regression として捕捉されているか
- mock が server 正本を疑似できているか（S1）

## サブタスク管理

- [ ] TC ID 採番完了
- [ ] TDD 順序確定
- [ ] テストファイル一覧確定
- [ ] `outputs/phase-04/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| テスト戦略 | `outputs/phase-04/main.md` |

## 完了条件

- [ ] 3 レベルのテスト TC が AC と紐付く
- [ ] reload 永続性ケースが E2E に含まれる
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] テストコードを実装していない（採番のみ）
- [ ] commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 5 へ、TC ID リスト、TDD 順序、追加テストファイル一覧を渡す。
