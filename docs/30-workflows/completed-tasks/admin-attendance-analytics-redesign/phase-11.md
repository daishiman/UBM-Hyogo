[実装区分: 実装仕様書]

# Phase 11 — 手動テスト / VISUAL 3 層評価（Admin 出席分析）

- **タスク種別宣言**: VISUAL（screenshot canonical 命名・3 層評価・実機確認必須）
- **依存**: Phase 10（staging deploy 完了 / `/admin/dashboard/attendance` が 200 応答）が DoD 達成済みであること
- **SSOT**: `_shared-context.md`（§3 機能仕様 / §9 DoD）
- **出力ルート**: `docs/30-workflows/completed-tasks/admin-attendance-analytics-redesign/outputs/phase-11/`

## 0. 入力・前提

| 項目 | 値 |
| ---- | -- |
| taskId | `admin-attendance-analytics-redesign` |
| phase | `phase-11` |
| mode | `VISUAL` |
| staging URL | `<approved-staging-url>/admin/dashboard/attendance` |
| 認可 | admin JWT（`AUTH_SECRET` 署名） |
| ブラウザ | Chromium（Playwright 1.x、`--device="Desktop Chrome 1440x900"`）+ iPhone 14 emul |

## 1. 3 層評価フレーム

| 層 | 観点 | ツール | 合格基準 |
| -- | ---- | ------ | -------- |
| Semantic | DOM 構造 / aria-* / role / heading 階層 | Playwright `expect(locator).toHaveRole/Name`, `axe-core` | a11y violation `serious|critical` = 0 |
| Visual | レイアウト / 色 / 余白 / タイポ / focus ring | Playwright `toHaveScreenshot()` + canonical PNG | 差分 < 0.1%、新規 baseline 採用は PR で明示 |
| AI UX | 認知負荷 / 情報優先順位 / Apple HIG 整合 | GPT-4o vision review (`ui-sanity-visual-review.md`) | LLM 評価 5 段階で全カテゴリ ≥ 4 |

すべての層でログを `outputs/phase-11/manual-test-result.md` に追記する。

## 2. screenshot canonical 名一覧（FB-VISUAL-CAP-001 / FB-LLM-MOD-05-001）

すべて `outputs/phase-11/screenshots/` 配下、`<canonical>.png` で保存（リネーム禁止）。

| # | canonical file | 状態 | 入力操作 |
| - | -------------- | ---- | -------- |
| 1 | `attendance-analytics-default.png` | 初期表示 | URL 直接アクセス、フィルタ未指定 |
| 2 | `attendance-analytics-period-filter-3m.png` | 期間 3M | Segmented `3M` クリック |
| 3 | `attendance-analytics-zone-filter-1to10.png` | 区画 1→10 のみ | Checkbox `1→10` のみ on |
| 4 | `attendance-analytics-trend-chart-hover.png` | トレンドグラフ hover | 2026-03 データ点に hover、tooltip 表示 |
| 5 | `attendance-analytics-session-table-sorted.png` | session table sorted | 列 `held_on` 降順クリック後 |
| 6 | `attendance-analytics-member-table-sorted.png` | member table sorted | 列 `出席率` 降順クリック後 |
| 7 | `attendance-analytics-top10-ranking.png` | TOP10 表示 | スクロールで section 中央へ |
| 8 | `attendance-analytics-drilldown-modal-open.png` | Drilldown modal open | session 行クリック → modal 開状態 |
| 9 | `attendance-analytics-absentee-alert.png` | 欠席アラート | `lastN=3` の対象あり状態 |
| 10 | `attendance-analytics-csv-export-success.png` | CSV export 成功 | エクスポートボタン押下後の toast 表示 |
| 11 | `attendance-analytics-empty-state.png` | データ 0 件 | `periodFrom/To` を未来期間で指定 |
| 12 | `attendance-analytics-loading.png` | loading skeleton | network throttle `Slow 3G` 中の skeleton |
| 13 | `attendance-analytics-error-degrade.png` | partial failure degrade | trend API のみ 500 を fixture で注入 |

## 3. capture script 要件（FB-MSO-003）

`scripts/phase-11-capture.ts` を新規作成。**必ず `try/finally` で browser/server を close** する。

```ts
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const SHOTS = [/* 13 件の {name, setup} */]
const OUT_DIR = 'outputs/phase-11/screenshots'
const META = 'outputs/phase-11/phase11-capture-metadata.json'

async function main() {
  const browser = await chromium.launch()
  const captured: Array<{ name: string; sha256: string; bytes: number; capturedAt: string }> = []
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    for (const shot of SHOTS) {
      await shot.setup(page)
      const path = `${OUT_DIR}/${shot.name}`
      await page.screenshot({ path, fullPage: shot.fullPage ?? false })
      captured.push(await stat(shot.name, path))
    }
  } finally {
    await browser.close() // ← MUST: 例外でも close
    await writeFile(META, JSON.stringify({
      taskId: 'admin-attendance-analytics-redesign',
      phase: 'phase-11',
      mode: 'VISUAL',
      capturedAt: new Date().toISOString(),
      shots: captured,
    }, null, 2))
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
```

- dev server を spawn する場合も `finally` 内で `child.kill('SIGTERM')` → `await once(child, 'exit')`
- 失敗時も部分メタデータは必ず書き出す（再実行性確保）

## 4. `screenshot-plan.json`（FB W1-02b-1）

`outputs/phase-11/screenshot-plan.json` を先に作成し、capture script はこれを読む。

```json
{
  "taskId": "admin-attendance-analytics-redesign",
  "phase": "phase-11",
  "mode": "VISUAL",
  "viewport": { "width": 1440, "height": 900 },
  "shots": [
    { "name": "attendance-analytics-default.png", "url": "/admin/dashboard/attendance", "setup": [] },
    { "name": "attendance-analytics-period-filter-3m.png", "url": "/admin/dashboard/attendance", "setup": [{ "click": "[data-testid=period-3m]" }] },
    { "name": "attendance-analytics-zone-filter-1to10.png", "url": "/admin/dashboard/attendance", "setup": [{ "uncheck": "[data-testid=zone-0to1]" }, { "uncheck": "[data-testid=zone-10to100]" }] },
    { "name": "attendance-analytics-trend-chart-hover.png", "url": "/admin/dashboard/attendance", "setup": [{ "hover": "[data-testid=trend-point-2026-03]" }] },
    { "name": "attendance-analytics-session-table-sorted.png", "url": "/admin/dashboard/attendance", "setup": [{ "click": "[data-testid=session-col-heldOn]" }] },
    { "name": "attendance-analytics-member-table-sorted.png", "url": "/admin/dashboard/attendance", "setup": [{ "click": "[data-testid=member-col-rate]" }] },
    { "name": "attendance-analytics-top10-ranking.png", "url": "/admin/dashboard/attendance", "setup": [{ "scrollIntoView": "[data-testid=top10-ranking]" }] },
    { "name": "attendance-analytics-drilldown-modal-open.png", "url": "/admin/dashboard/attendance", "setup": [{ "click": "[data-testid=session-row-0]" }, { "waitFor": "[data-testid=drilldown-modal]" }] },
    { "name": "attendance-analytics-absentee-alert.png", "url": "/admin/dashboard/attendance", "setup": [{ "scrollIntoView": "[data-testid=absentee-alert]" }] },
    { "name": "attendance-analytics-csv-export-success.png", "url": "/admin/dashboard/attendance", "setup": [{ "click": "[data-testid=csv-export]" }, { "waitFor": "[data-testid=toast-success]" }] },
    { "name": "attendance-analytics-empty-state.png", "url": "/admin/dashboard/attendance?periodFrom=2099-01-01&periodTo=2099-02-01", "setup": [] },
    { "name": "attendance-analytics-loading.png", "url": "/admin/dashboard/attendance", "setup": [{ "throttle": "Slow 3G" }, { "waitFor": "[data-testid=kpi-skeleton]" }] },
    { "name": "attendance-analytics-error-degrade.png", "url": "/admin/dashboard/attendance", "setup": [{ "injectFixture": "trend-500" }, { "waitFor": "[data-testid=trend-degrade-card]" }] }
  ]
}
```

mode は **必ず `VISUAL`**（lint 対象、`SEMANTIC` 等を書くと CI が落ちる）。

## 5. metadata 整合性確認

```bash
# taskId 一致確認
jq -e '.taskId == "admin-attendance-analytics-redesign" and .phase == "phase-11" and .mode == "VISUAL"' \
  outputs/phase-11/phase11-capture-metadata.json

# 13 ショット揃っているか
jq '.shots | length == 13' outputs/phase-11/phase11-capture-metadata.json

# screenshot-plan.json と name 集合が一致
diff <(jq -r '.shots[].name' outputs/phase-11/screenshot-plan.json | sort) \
     <(jq -r '.shots[].name' outputs/phase-11/phase11-capture-metadata.json | sort)

# 実ファイルとメタの一致
jq -r '.shots[].name' outputs/phase-11/phase11-capture-metadata.json \
  | xargs -I{} test -f outputs/phase-11/screenshots/{}
```

いずれか失敗時は Phase 11 を fail とし、capture script を修正して再実行する。

## 6. テストケース表

入力 → 期待 → 結果 を `manual-test-result.md` に転記して埋める。

| TC-ID | 観点 | 入力操作 | 期待結果 | 結果(OK/NG) | 備考 |
| ----- | ---- | -------- | -------- | ----------- | ---- |
| TC-AA-101 | 初期表示 | `/admin/dashboard/attendance` にアクセス | 200、KPI 4 枚 + 全 8 セクション描画、エラーバナーなし |  |  |
| TC-AA-102 | 期間フィルタ 3M | Segmented `3M` クリック | URL に `periodFrom/To` 反映、各セクション再フェッチ、loading→成功 |  |  |
| TC-AA-103 | 期間フィルタ All | Segmented `All` クリック | period クエリ消失、overview の全件集計表示 |  |  |
| TC-AA-104 | 区画フィルタ単一 | `1→10` のみ on | `zone=1→10`、TOP10/Table が対象 zone のみ |  |  |
| TC-AA-105 | 区画フィルタ複数 | `0→1` + `1→10` on | `zone=0→1,1→10`、unknown 除外 |  |  |
| TC-AA-106 | トレンド hover | 月別 data point hover | tooltip に `期間 / 出席者 / セッション数 / unique` 表示 |  |  |
| TC-AA-107 | session table ソート | `held_on` 列クリック | 降順 → 昇順 → 解除（既定: `held_on DESC, session_id DESC`）|  |  |
| TC-AA-108 | member table ソート | 出席率列クリック | 出席率降順、同率時は連続参加で安定ソート |  |  |
| TC-AA-109 | TOP10 表示 | 既定状態 | 10 件以下、Chip + bar、0 件時は空状態カード |  |  |
| TC-AA-110 | Drilldown modal | session 行クリック | modal 開、出席/欠席メンバー一覧、ESC で閉、focus 復帰 |  |  |
| TC-AA-111 | 欠席アラート | `lastN=3` 該当あり | アラートカード表示、対象メンバー一覧、CTA リンク |  |  |
| TC-AA-112 | CSV エクスポート | エクスポートボタン押下 | `.csv` ダウンロード、ヘッダ列名 = Zod field、toast 成功 |  |  |
| TC-AA-113 | 空状態 | 未来期間指定 | 各セクションが空状態 illust + メッセージ（error 化しない）|  |  |
| TC-AA-114 | loading skeleton | Slow 3G | KPI/Chart/Table すべてに skeleton、CLS < 0.1 |  |  |
| TC-AA-115 | partial failure | trend のみ 500 | trend カードのみ degrade 表示、他は正常、page error.tsx 起動なし |  |  |
| TC-AA-116 | 認可拒否 | 非 admin JWT で直接アクセス | middleware で `/login` redirect、ページ HTML 不送出 |  |  |
| TC-AA-117 | キーボード操作 | Tab のみで全操作 | 期間/区画/ソート/modal すべて操作可、focus visible |  |  |
| TC-AA-118 | レスポンシブ | iPhone 14 emul | KPI 2x2、Chart 縦積、Table は横スクロール |  |  |
| TC-AA-119 | i18n | ja のみ（既定） | 日付 `YYYY/MM/DD`、数値 `1,234`、% 桁丸め一貫 |  |  |
| TC-AA-120 | Design Token | DevTools 全要素 | computed color が `--ubm-*` 由来、HEX 直書きなし |  |  |

## 7. Apple HIG 観点チェック

| 観点 | 基準 | 確認方法 |
| ---- | ---- | -------- |
| タイポグラフィ | 本文 14–16px / 行間 1.5 / 見出し階層が DOM heading と一致 | DevTools computed + axe heading-order |
| 余白 | 8pt grid、section 間 24/32px、card padding 16/24px | スクリーンショット定規計測 |
| コントラスト | 通常文 4.5:1、大文字 3:1、disabled も 3:1 以上 | axe `color-contrast` |
| focus visible | キーボード focus 時に 2px ring + offset、色 `--ubm-focus` | TC-AA-117 で確認 |
| motion | hover/transition 150–200ms、`prefers-reduced-motion` で無効化 | DevTools Rendering panel |
| タップ領域 | mobile で 44x44pt 以上（フィルタ chip / sort header / CTA） | TC-AA-118 で確認 |

違反は `manual-test-result.md` の Apple HIG セクションに `[HIG-violations]` として記録。

## 8. ユーザー実機確認チェックリスト（staging deploy 後）

ユーザーへ依頼する Slack DM テンプレ:

```
@user staging へ deploy しました。下記 URL で 5 分ほど確認いただけますか。
URL: <approved-staging-url>/admin/dashboard/attendance

確認お願いリスト:
[ ] ページが 404 なしで開く
[ ] KPI 4 枚（出席率/出席者数/平均/トレンド）の数字が直感と合っている
[ ] 期間フィルタ（今月/3M/6M/1Y/All）を切替→ 数字が更新される
[ ] 区画フィルタ（0→1 / 1→10 / 10→100）チェック切替で TOP10 が連動する
[ ] トレンドグラフを hover すると tooltip が出る
[ ] セッション表の行をクリック → ドリルダウンモーダルが開く / ESC で閉じる
[ ] CSV エクスポート押下 → ファイルが DL でき、Excel で文字化けしない
[ ] スマホ（iPhone Safari）でも崩れず読める
[ ] 体感速度が遅すぎないか（初回 3 秒以内目標）
[ ] 違和感のある日本語 / 数字フォーマットがないか

NG があればスクショ + 操作手順を返信ください。
所要: 5 分目安、フィードバック締切: 翌営業日 12:00
```

返信は `outputs/phase-11/manual-test-result.md` の §User Feedback に転記し、blocker は Phase 12 改善 issue 化する。

## 9. AI UX レビュー（`ui-sanity-visual-review.md`）

13 枚の screenshot を GPT-4o vision に渡し、下記を 5 段階評価で出力させる。

- 情報優先順位（KPI が最上部・視線移動が自然か）
- 認知負荷（一画面の要素密度、視覚ノイズ）
- 一貫性（色 / 余白 / コンポーネントの語彙統一）
- Apple HIG 準拠（§7 観点）
- アクセシビリティ示唆（色弱・低視力配慮）

出力フォーマット:

```md
## attendance-analytics-default.png
- 情報優先順位: 4/5 — KPI 配置良好。ただし期間フィルタが右寄りで発見性弱
- 認知負荷: 4/5
- 一貫性: 5/5
- HIG: 4/5 — focus ring 仕様要確認
- a11y 示唆: 区画 chip のテキストコントラスト要 4.5:1 確認
- 改善提案: ...
```

全カテゴリ平均 ≥ 4.0 を合格。下回る項目は Phase 12 へキャリー。

## 10. 出力一覧（DoD）

Phase 11 完了時に下記がすべて存在し整合していること。

```
outputs/phase-11/
├── manual-test-result.md            # TC-AA-101〜120 結果 / Apple HIG / User Feedback 記録
├── screenshot-plan.json             # mode: VISUAL、13 shots 定義
├── phase11-capture-metadata.json    # taskId/phase/mode/capturedAt/shots[] (sha256, bytes)
├── ui-sanity-visual-review.md       # 13 枚 × 5 観点 LLM 評価
└── screenshots/
    ├── attendance-analytics-default.png
    ├── attendance-analytics-period-filter-3m.png
    ├── attendance-analytics-zone-filter-1to10.png
    ├── attendance-analytics-trend-chart-hover.png
    ├── attendance-analytics-session-table-sorted.png
    ├── attendance-analytics-member-table-sorted.png
    ├── attendance-analytics-top10-ranking.png
    ├── attendance-analytics-drilldown-modal-open.png
    ├── attendance-analytics-absentee-alert.png
    ├── attendance-analytics-csv-export-success.png
    ├── attendance-analytics-empty-state.png
    ├── attendance-analytics-loading.png
    └── attendance-analytics-error-degrade.png
```

### 完了判定

- [ ] 全 TC-AA-101〜120 が OK（NG は issue 化済）
- [ ] 13 canonical screenshot が `screenshots/` に存在
- [ ] `jq` 整合チェック（§5）全パス
- [ ] Apple HIG 観点に critical 違反なし
- [ ] AI UX レビュー平均 ≥ 4.0
- [ ] ユーザー実機確認チェックリスト返信受領
- [ ] `manual-test-result.md` 署名（実施者 / 日時）記入済

→ 上記すべて満たした時点で Phase 12（PR 作成・ドキュメント反映）へ遷移する。
