# Phase 11: Manual Test Evidence (Issue #55)

## Scope
ローカル動作確認は unit/contract test スイートと保存済み UI evidence で担保する。
本書は Phase 11 DoD のための evidence summary。

## 自動テスト結果サマリ

| Suite | Config | 結果 |
| --- | --- | --- |
| API unit (`pnpm -F @ubm-hyogo/api test`) | `vitest.config.ts` | 55 files / 354 tests passed |
| API D1 (新規 3 files in isolation) | `vitest.d1.config.ts --maxWorkers=1` | `notificationOutbox.repository.spec.ts` 13, `memberNotificationPreference.repository.spec.ts` 2, `member-notification-pref.contract.spec.ts` 4 → 全 pass |
| API D1 (full suite) | `vitest.d1.config.ts --maxWorkers=1` | 109 failures は全件 `EADDRNOTAVAIL`（miniflare ephemeral port 枯渇）で、failing file を個別 run すると pass。本 issue 由来の regression ではない |
| Workflow unit | `vitest.config.ts` | `notificationDispatchTick.spec.ts` (registry path 2 件含む) pass |
| Web component | `vitest.config.ts` | `MemberDrawer.spec.tsx` に opt-out PATCH 操作テストを追加 |

## 検証シナリオ (test 経由で担保)

1. opt-out=true の member に対する enqueue → outbox 行が作られず ledger `skipped_opt_out` のみ (`notificationOutbox.repository.spec.ts`)
2. PATCH /admin/members/:id/notification-pref で `notification_opt_out` 列が 1/0 に反映 (`member-notification-pref.contract.spec.ts`)
3. 非 admin token は 401/403 で reject (`member-notification-pref.contract.spec.ts`)
4. dispatcher tick が registry resolve で mail channel を呼ぶ／未登録 channel は dlq + ledger `unknown_channel` (`notificationDispatchTick.spec.ts`)
5. admin detail viewmodel に `status.notificationOptOut` が含まれる (`viewmodel.spec.ts` strict zod)
6. admin `MemberDrawer` の checkbox 操作で `/api/admin/members/:id/notification-pref` に PATCH され、表示 state が更新される (`MemberDrawer.spec.tsx`)

## 物理 evidence

| ファイル | 状態 | 内容 |
| --- | --- | --- |
| `outputs/phase-11/admin-member-drawer-opt-out-toggle.png` | present | desktop 1280px の drawer toggle UI screenshot |
| `outputs/phase-11/d1-ledger-skipped-opt-out.txt` | present | opt-out skip ledger 検証メモ |
| `outputs/phase-11/phase-11-manual-test.md` | present | 本サマリ |

## 既知の制約

- Staging visual smoke は user-gated。local UI evidence は `admin-member-drawer-opt-out-toggle.png` と `MemberDrawer.spec.tsx` でカバー
- LINE / Slack adapter は intentionally out of scope（registry の 2 件目 channel が無いため未登録 → dlq 経路を unit test で検証）

## 次フェーズへの引き継ぎ

- Phase 12: `implementation-guide.md` は既存、本書を evidence として参照
- SSOT 更新: `docs/00-getting-started-manual/specs/10-notification-auth.md` に「通知 Channel 抽象 & opt-out」節を追記済み
