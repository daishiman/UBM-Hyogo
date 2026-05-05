# Phase 11: 手動 smoke / 実測 evidence — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 11 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| capture mode | SCREENSHOT + Playwright trace |
| status policy | `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` または `blocked_runtime_evidence` を許容（S4） |

## 目的

実装完了後、reload 永続性を実機 / staging 環境で確認し、AC-1..AC-7 を実 UI 上で検証する。仕様書段階では実 screenshot / E2E artifact を取得しない。

## status policy（S4）

| 状況 | 採用 status |
| --- | --- |
| logged-in capture が staging で取得可能 | `completed`（screenshot + trace 揃い） |
| 認証 fixture / staging 不調などで実機キャプチャ不可 | `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` |
| インフラ blocker（API 5xx / D1 unavailable） | `blocked_runtime_evidence` |

logged-in capture は別 wave（06b-C）に委譲可能（S4）。

## Pre-conditions

| GATE | 条件 |
| --- | --- |
| PRE-1 | Phase 10 が PASS / MINOR |
| PRE-2 | 06b-A session resolver が staging で機能 |
| PRE-3 | 06b-B 実装本体（client local 版 banner / submit）が動作 |
| PRE-4 | API Worker staging で `GET /me/profile` が `pendingRequests` を含む response を返す |
| PRE-5 | テスト用会員（rulesConsent=consented, publishState=public）が staging D1 に存在 |

## 環境

| 項目 | 値 |
| --- | --- |
| ブラウザ | Chromium (Playwright bundled) |
| viewport | 1280x800（desktop） |
| テーマ | light（dark UI 提供なし） |
| 動作環境 | staging Cloudflare Workers + staging API、または local dev + staging API |

## 取得対象 screenshot

保存先: `outputs/phase-11/screenshots/`

| TC | 状態 | ファイル名 | 紐付く AC |
| --- | --- | --- | --- |
| TC-01 | submit → reload 後の pending banner 表示 | `TC-01-pending-banner-after-reload-light.png` | AC-1 |
| TC-02 | server pending state でボタン disabled | `TC-02-button-disabled-light.png` | AC-2 |
| TC-03 | stale UI で 409 表示 | `TC-03-stale-409-light.png` | AC-3 |
| TC-04 | admin approve 後 reload で banner 消滅 | `TC-04-after-approval-light.png` | AC-1 |
| TC-05 | 別タブ pending 作成後の本タブ reload | `TC-05-cross-tab-sync-light.png` | AC-1 |

## 手動 smoke runbook

```bash
git status                                # clean
mise exec -- pnpm install
mise exec -- pnpm typecheck && mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web build
mise exec -- pnpm --filter @ubm/web dev   # localhost:3000
```

1. テストアカウントで `/profile` ログイン
2. 「公開を停止する」を押下 → submit 成功 → banner 表示
3. **F5 / Cmd+R で reload** → banner が残り、ボタンが disabled であることを確認 → TC-01 / TC-02 撮影
4. admin で resolve 操作（D1 の request_status を 'resolved' に更新するシードスクリプト）→ reload → banner 消滅 → TC-04 撮影
5. 別タブで delete 申請 → 本タブ reload → 反映 → TC-05 撮影
6. 旧タブを残したまま再 submit → 409 表示 → TC-03 撮影

## Playwright trace

```bash
mise exec -- pnpm --filter @ubm/web exec playwright test profile-pending-sticky --trace on
```

trace は `outputs/phase-11/playwright-report/` に保存。

## evidence 不揃い時の取り扱い（S4）

- 実機キャプチャ不可の場合、`outputs/phase-11/main.md` に「BLOCKED」セクションを設け、blocker / 委譲先（06b-C）/ 再開条件を記録する
- artifacts.json の phase-11 status を `IMPLEMENTED_AWAITING_VISUAL_CAPTURE` または `blocked_runtime_evidence` に更新

## BLOCKED — runtime visual evidence

| Item | Value |
| --- | --- |
| Status | `blocked_runtime_evidence` |
| Blocker | Authenticated `/profile` browser session and seeded `admin_member_notes` pending rows are required to capture reliable reload-sticky screenshots |
| Not claimed | TC-01..TC-05 screenshots, Playwright trace, staging/local browser visual PASS |
| Static substitute | API/web focused tests and type contracts verify local behavior before runtime capture |
| Reopen condition | User authorizes local/staging authenticated smoke with test account + pending queue seed |
| Handoff | 06b-C logged-in visual evidence, 08b Playwright E2E, or 09a staging smoke can consume the same TC-01..TC-05 screenshot contract |

No screenshot files are stored under `outputs/phase-11/screenshots/` in this cycle. The absence is intentional and represented by the artifact ledger phase-11 status, not by a PASS claim.

## 多角的チェック観点

- reload を物理的に行ったかどうか（楽観的 banner と区別）
- ボタン disabled が server state 由来であること（DOM の `disabled attribute` を確認）
- console error / network panel に `:memberId` を含む URL がないこと（不変条件 #11）

## サブタスク管理

- [ ] PRE-1..5 を確認
- [ ] runbook 実行
- [ ] screenshot 5 枚取得（または BLOCKED 記録）
- [ ] Playwright trace 取得
- [ ] `outputs/phase-11/main.md` 作成

## 成果物

| 成果物 | パス | 必須 |
| --- | --- | --- |
| smoke レポート | `outputs/phase-11/main.md` | ✅ |
| screenshot | `outputs/phase-11/screenshots/*.png` | 取得時 |
| Playwright trace | `outputs/phase-11/playwright-report/` | 取得時 |
| screenshot coverage 説明 | `outputs/phase-11/screenshot-coverage.md` | dark mode N/A 等の理由記録 |

## 完了条件

- [ ] PRE 全成立または BLOCKED 記録
- [ ] screenshot / trace を取得（または S4 例外を文書化）
- [ ] AC-1..AC-7 と evidence の対応が `main.md` に記載
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 仕様書段階では実 screenshot を取得していない（runbook の整備のみ）
- [ ] 実装、deploy、commit、push、PR を実行していない
- [ ] FB-UT-UIUX-001（screenshot ハードゲート）方針が記載されている

## 次 Phase への引き渡し

Phase 12 へ、screenshot / trace path、status 判定、AC-evidence 対応を渡す。
