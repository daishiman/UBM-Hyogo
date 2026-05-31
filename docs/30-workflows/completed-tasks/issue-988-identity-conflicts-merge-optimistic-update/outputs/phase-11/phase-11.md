# Phase 11: 手動テスト / VISUAL

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 11.1 VISUAL 区分の明示

本タスクは **VISUAL タスク**である（`UI/UX 変更なし` ではない）。merge 実行直後に row が一覧から消える視覚変化、および server error 時の row 復元 + inline error 表示という UI 状態遷移を伴うため、screenshot による視覚 evidence を取得する。

> 本フェーズでは local focused Vitest evidence と Playwright screenshot 3 枚を取得済み。PNG は `outputs/phase-11/screenshots/` に保存済みである。

## 11.2 ブラウザ smoke（W1-02b-4）

capture の前提として、実際に route を開く browser smoke を含める。

| 手順 | 内容 |
| --- | --- |
| 1 | local dev または staging で `/admin/identity-conflicts` を認証済みセッションで開く |
| 2 | identity conflict row が 1 件以上表示されること（conflict / source / target / email mask が読める） |
| 3 | merge 二段階 confirm（確認1/2 → 2/2）まで遷移できること |
| 4 | 上記が成立した状態を capture 起点とする |

> route が開けない / row が存在しない場合は capture を行わず、データ準備（conflict seed）を先行する。

## 11.3 screenshot 計画（canonical 名固定）

命名は `<component>-<state>.png` 形式。phase spec / capture metadata / implementation-guide で **同一の canonical 名**を用いる（FB-LLM-MOD-05-001）。配置先は `outputs/phase-11/screenshots/`。

| # | canonical ファイル名 | 取得状態 | 対応 TC / AC |
| --- | --- | --- | --- |
| 1 | `identity-conflict-row-merge-final.png` | 確認 2/2 ダイアログ表示状態（merge 理由 textarea + 「merge 実行」ボタン表示） | TC-VIS-01 / AC-1 |
| 2 | `identity-conflict-row-optimistic-removed.png` | 「merge 実行」click 直後、server 応答前に該当 row が一覧から消えた状態 | TC-VIS-02 / AC-2 |
| 3 | `identity-conflict-row-rollback-error.png` | server error で row が復元し、inline error（`role="alert"`）が表示された状態 | TC-VIS-03 / AC-5・AC-6 |

> 3 枚はいずれも `/admin/identity-conflicts` 上の同一 row を対象とし、UI 状態のみ異なる。error 状態は API mock / fault injection（staging では error を誘発する seed 等、local では mock）で再現する。

## 11.4 3層評価観点

| 層 | 評価観点 | screenshot との対応 |
| --- | --- | --- |
| **Semantic（意味）** | merge confirm の文言（「確認 2/2」「merge 理由」）が正しく、optimistic 消失が「処理中」ではなく「確定的に消えた」と読めること。error 文言が rollback の意味（再操作可能）を伝えること | #1（confirm 文言）/ #3（error 文言） |
| **Visual（視覚）** | OKLch トークン（`--ubm-color-danger` / `--ubm-color-danger-soft` 等）で confirm/error 配色が正本どおり。row 消失で list レイアウトが崩れない。inline error が `text-[var(--ubm-color-danger)]` で表示される | #1・#2・#3 全て |
| **AI UX（操作体感）** | click → 即時消失で round-trip 待ち感がない（AC-2 体感）。error 時に row が戻り原因が読め再操作できる（迷子にならない） | #2（即時性）/ #3（復帰可能性） |

## 11.5 local automated evidence

| evidence | path | result |
| --- | --- | --- |
| focused Vitest | `outputs/phase-11/evidence/focused-vitest.log` | PASS（1 file / 10 tests） |
| canonical paths manifest | `outputs/phase-11/canonical-paths.json` | present |

AC-3（success 後も row 非表示維持）は screenshot ではなく focused Vitest evidence で検証する。

## 11.6 capture 実績

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_ISSUE988_SCREENSHOT_DIR="$PWD/docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-11/screenshots" \
pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-identity-conflicts.spec.ts \
  --project=desktop-chromium \
  --grep "optimistic|rollback" \
  --reporter=list
```

実行結果: 2 tests PASS。`identity-conflict-row-merge-final.png` / `identity-conflict-row-optimistic-removed.png` / `identity-conflict-row-rollback-error.png` を生成。

## 11.7 evidence 整合チェック

| チェック | 内容 |
| --- | --- |
| 枚数整合 | `outputs/phase-11/screenshots/` の `.png` が 3 枚（§11.3 と一致） |
| 命名整合 | phase-11.md / `phase11-capture-metadata.json` / implementation-guide の screenshot 名が完全一致（FB-LLM-MOD-05-001） |
| 状態整合 | 各 png が §11.3 の取得状態どおり（確認2/2 / 消失 / 復元+error） |

## 11.8 VISUAL 判定

**GATE: local automated evidence PASS / visual capture PASS** — focused Vitest は PASS。VISUAL_ON_EXECUTION タスクとして 3 枚の canonical screenshot を取得し、3層評価観点と対応済み。
