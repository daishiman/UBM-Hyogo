# Phase 11: 手動テスト / VISUAL

`[実装区分: 実装]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION` / `workflow_state: implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | #1042（identity-conflicts dismiss optimistic update / FU-AIDC-006） |
| route | `/admin/identity-conflicts` |
| 対象 component | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| 本フェーズの目的 | VISUAL 区分の明示・screenshot 3 PNG 取得・3層評価観点・capture コマンドの確定 |
| capture 方針 | 実装済みローカル証跡として screenshot 3 PNG を取得済み。commit / push / PR は user-gated |

## 11.1 VISUAL 区分の明示

本タスクは **VISUAL タスク**である（`UI/UX 変更なし` ではない）。dismiss 実行直後に row が一覧から消える視覚変化、および server error 時の row 復元 + inline error 表示という UI 状態遷移を伴うため、screenshot による視覚 evidence の取得を計画する。

本ワークフローは同一サイクルで実装済み。実コード実装・focused vitest・Playwright focused・screenshot capture まで完了し、commit / push / PR のみ user-gated として残す。

## 11.2 ブラウザ smoke 手順（W1-02b-4・実装時に実施）

capture の前提として、実際に route を開く browser smoke を含める。

| 手順 | 内容 |
| --- | --- |
| 1 | local dev または staging で `/admin/identity-conflicts` を認証済みセッションで開く |
| 2 | identity conflict row が 1 件以上表示されること（conflict / source / target / email mask が読める） |
| 3 | 「別人マーク」ボタン → dismiss 理由 dialog へ遷移できること |
| 4 | 上記が成立した状態を capture 起点とする |

> route が開けない / row が存在しない場合は capture を行わず、データ準備（conflict seed）を先行する。

## 11.3 screenshot 計画（canonical 名固定・captured）

命名は `<component>-<state>.png` 形式。phase spec / capture metadata / screenshot-plan / implementation-guide で **同一の canonical 名**を用いる（FB-LLM-MOD-05-001）。配置先は `outputs/phase-11/screenshots/`。**status は全て `captured`**。

| # | canonical ファイル名 | 取得予定状態 | status | 対応 TC / AC |
| --- | --- | --- | --- | --- |
| 1 | `identity-conflict-row-dismiss-confirm.png` | 「別人マーク」理由 dialog 表示状態（dismiss 理由 textarea +「別人として確定」ボタン表示） | captured | TC-VIS-D1 / AC-1 |
| 2 | `identity-conflict-row-dismiss-optimistic-removed.png` | 「別人として確定」click 直後、server 応答前に該当 row が一覧から消えた状態 | captured | TC-VIS-D2 / AC-1 |
| 3 | `identity-conflict-row-dismiss-rollback-error.png` | server error で row が復元し、inline error（`role="alert"`）が表示された状態（`dismissReason` 保持） | captured | TC-VIS-D3 / AC-2 |

> 3 枚はいずれも `/admin/identity-conflicts` 上の同一 row を対象とし、UI 状態のみ異なる。error 状態は API mock / fault injection（staging では error を誘発する seed 等、local では mock）で再現する。

## 11.4 3層評価観点

| 層 | 評価観点 | screenshot との対応 |
| --- | --- | --- |
| **Semantic（意味）** | 「別人として確定」文言が正しく、optimistic 消失が「処理中」ではなく「確定的に消えた」と読めること。error 文言が rollback の意味（再操作可能）を伝えること | #1（confirm 文言・確定的消失の意味）/ #3（error 文言） |
| **Visual（視覚）** | OKLch トークン（`--ubm-color-danger` / `--ubm-color-danger-soft` 等）で confirm/error 配色が正本どおり。row 消失で list レイアウトが崩れない。inline error が `text-[var(--ubm-color-danger)]` で表示される | #1・#2・#3 全て |
| **AI UX（操作体感）** | click → 即時消失で round-trip 待ち感がない（AC-1 体感）。error 時に row が戻り、`dismissReason` が保持され原因が読め再操作できる（迷子にならない） | #2（即時性）/ #3（復帰可能性・理由保持） |

## 11.5 local automated evidence（captured）

| evidence | path | result（実装時） |
| --- | --- | --- |
| focused Vitest | `outputs/phase-11/evidence/focused-vitest.log` | PASS（対象 `IdentityConflictRow.spec.tsx` 15 tests PASS） |
| Playwright focused | `outputs/phase-11/evidence/focused-playwright.log` | PASS（2 tests） |
| canonical paths manifest | `outputs/phase-11/canonical-paths.json` | present |

AC-3（dismiss success 後も row 非表示維持）は screenshot ではなく focused Vitest evidence で検証済み。

## 11.6 capture コマンド（実装時用）

```bash
AUTH_SECRET=playwright-e2e-auth-secret-32-bytes \
PLAYWRIGHT_ADMIN_IDENTITY_CONFLICTS_FIXTURE=1 \
PLAYWRIGHT_ISSUE1042_SCREENSHOT_DIR="$PWD/docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-11/screenshots" \
pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-identity-conflicts.spec.ts \
  --project=desktop-chromium \
  --grep "dismiss|optimistic|rollback" \
  --reporter=list
```

実行結果: dismiss optimistic / rollback シナリオ 2 tests PASS。`identity-conflict-row-dismiss-confirm.png` / `identity-conflict-row-dismiss-optimistic-removed.png` / `identity-conflict-row-dismiss-rollback-error.png` を生成。

## 11.7 evidence 整合チェック観点（実装時に適用）

| チェック | 内容 |
| --- | --- |
| 枚数整合 | `outputs/phase-11/screenshots/` の `.png` が 3 枚（§11.3 と一致） |
| 命名整合 | phase-11.md / `phase11-capture-metadata.json` / `screenshot-plan.json` / `canonical-paths.json` / implementation-guide の screenshot 名が完全一致（FB-LLM-MOD-05-001） |
| 状態整合 | 各 png が §11.3 の取得予定状態どおり（confirm dialog / 消失 / 復元+error+理由保持） |

## 11.8 VISUAL 判定

**GATE: PASS — captured** — 本タスクは VISUAL_ON_EXECUTION タスクとして 3 枚の canonical screenshot を取得し、3層評価観点と対応づけた。実コード実装・focused Vitest・Playwright・screenshot capture は完了。commit / push / PR は user-gated。

## 完了条件

- [x] VISUAL 区分を明示し、screenshot 3 PNG を captured として記述している（§11.1）。
- [x] ブラウザ smoke 手順（/admin/identity-conflicts → conflict row → 別人マーク dialog）を記述している（§11.2）。
- [x] screenshot 計画（canonical 3 名・`<component>-<state>.png`・配置 `outputs/phase-11/screenshots/`・status captured）を table 化している（§11.3）。
- [x] 3層評価観点（Semantic / Visual / AI UX）を screenshot と対応づけている（§11.4）。
- [x] local automated evidence（focused vitest / Playwright / canonical-paths.json）を PASS として記述している（§11.5）。
- [x] capture コマンド（local webServer 起動 + `--grep "dismiss|optimistic|rollback"`）を記述している（§11.6）。
- [x] evidence 整合チェック観点（枚数3 / 命名整合 / 状態整合）を記述している（§11.7）。
- [x] 末尾に VISUAL 判定（§11.8・PASS）を置いている。
