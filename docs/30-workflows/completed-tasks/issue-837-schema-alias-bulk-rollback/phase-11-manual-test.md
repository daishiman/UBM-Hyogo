# Phase 11: Manual Test / Evidence 計画

## メタ情報

| Key | Value |
| --- | --- |
| workflow | `issue-837-schema-alias-bulk-rollback` |
| 入力 | `phase-09-quality-assurance.md`（AC PASS 表・NFR-5 計測方針）/ `phase-10-final-review.md`（ゲート PASS）/ `artifacts.json`（planned_visual_evidence_files） |
| タスク分類 | **UI task（VISUAL）**。3 層評価（Semantic / Visual / AI UX）+ screenshot 証跡を取得する計画 |
| 取得対象 | desktop 1280 / mobile 375 の screenshot 6 枚 + `perf-30rows.md` + `a11y-manual-check.md` |
| 環境 | PR 前: local dev（`wrangler dev` + `localhost`）または branch preview。staging 実機検証は PR 後の runtime gate で再取得 |

> **注記（automation-30 update）**: local implementation evidence は `outputs/phase-11/typecheck-local.txt` / `focused-vitest-local.txt` に配置済み。runtime screenshot / perf log / a11y log は authenticated runtime が必要なため user-gated evidence として残す。本ファイルはその取得手順・期待表示・ファイル名の canonical 定義を保持する。

---

## 前提

- PR 前: local dev server（`wrangler dev`）または branch preview が起動済
- PR 後 runtime gate: staging 環境にデプロイ済（`dev` branch merge 後）
- admin アカウント `manjumoto.daishi@senpai-lab.com` でログイン
- HistoryPane に resolve 済み alias（`resolved` 履歴）が複数件存在する状態（fixture を `bash scripts/cf.sh d1` で投入、または既存 staging 履歴を流用）
- partial failure シナリオ用に、1 件の alias を別経路で先に rollback / version 更新して `version_mismatch`（409）を誘発できる状態

---

## VISUAL タスクの 3 層評価計画

| 層 | 評価観点 | 確認手段 | 合否基準 |
| --- | --- | --- | --- |
| Semantic（意味） | bulk rollback mode の selection / confirm / 結果サマリが UI 上で意味的に正しく表現されるか。`role="dialog"` / `aria-modal` / `data-role="bulk-rollback-summary"` 等の semantic 属性が DOM に存在するか | spec test（MOD-01〜14 / PANEL-BR-01〜07）+ DOM 検査 | semantic 属性が全件存在 / spec green |
| Visual（見た目） | desktop 1280 / mobile 375 で checkbox・select-all・modal・summary バナー（全成功/部分成功/全失敗）が overflow なく OKLch token で正しく描画されるか | screenshot 6 枚（下記証跡計画テーブル）の目視確認 | レイアウト崩れ 0 / HEX 直書き 0（`verify-design-tokens` green） |
| AI UX（操作体験） | 50 件上限 alert・部分失敗時の「失敗分を再取消」導線・進捗表示が誤操作なく一括取消運用を完遂できるか | E2E-BR-01〜04（playwright）+ 手動シナリオ | 全シナリオで意図通りの状態遷移を確認 |

---

## screenshot 証跡計画テーブル

`artifacts.json` の `planned_visual_evidence_files` に対応する 6 枚の PNG。各ファイル名は phase spec / capture script / metadata / implementation-guide の **4 か所でセマンティック canonical 名一致**（FB-LLM-MOD-05-001）。

| ファイル名（canonical） | 画面状態 | viewport | 取得手順 | 期待表示 |
| --- | --- | --- | --- | --- |
| `outputs/phase-11/bulk-rollback-select-desktop-1280.png` | bulk rollback mode ON / 複数行 checkbox 選択済み | 1280×800 (desktop-chromium) | `/admin/schema` → HistoryPane の「Bulk Rollback」トグル ON → 3 行を checkbox 選択 → 選択件数バッジ表示 | 各履歴行に `aria-label` 付き checkbox / select-all checkbox / 「3 件選択中」バッジ / 「一括取消」ボタン（enabled） |
| `outputs/phase-11/bulk-rollback-modal-desktop-1280.png` | confirm modal 表示（submit 前 idle） | 1280×800 | 上記状態から「一括取消」ボタン押下 → modal mount | `role="dialog"` modal / 選択 alias 一覧（aliasLabel / stableKey / resolvedAt）/ aggregate 影響件数合計 / 再集計推奨警告（該当時）/ confirm・close ボタン |
| `outputs/phase-11/bulk-rollback-partial-failure-desktop-1280.png` | 部分失敗（成功分確定・失敗分残留） | 1280×800 | 3 件中 1 件を事前に version 更新し 409 を誘発 → confirm → 完了 | summary バナー `data-role="bulk-rollback-summary"` に「部分成功 / 2 件成功 / 1 件失敗」/ 失敗行に `version_mismatch` バッジ / 「失敗分を再取消」ボタン表示 |
| `outputs/phase-11/bulk-rollback-success-desktop-1280.png` | 全成功（modal close 直前 or summary バナー） | 1280×800 | 全件成功する状態で confirm → 完了 | summary バナーに「全成功」（OKLch `--color-success`）/ 成功後 HistoryPane から該当 alias が除去された状態（`router.refresh()` 後） |
| `outputs/phase-11/bulk-rollback-select-mobile-375.png` | bulk rollback mode ON / 複数行 checkbox 選択済み | 375×667 (iPhone SE) | desktop select と同手順を 375 幅で実行 | checkbox / select-all / 選択件数バッジ / 「一括取消」ボタンが overflow なく縦積み表示 |
| `outputs/phase-11/bulk-rollback-modal-mobile-375.png` | confirm modal 表示 | 375×667 | desktop modal と同手順を 375 幅で実行 | modal が画面幅に収まり、alias 一覧・aggregate・ボタンが overflow なく表示 |

> capture script 方針: `PLAYWRIGHT_EVIDENCE_TASK=issue-837-schema-alias-bulk-rollback mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/issue837-schema-bulk-rollback.spec.ts --project=desktop-chromium`（artifacts.json `visual_evidence` コマンド）。mobile 375 は viewport 切替プロジェクトで取得。

---

## NFR-5 性能計測計画（`outputs/phase-11/perf-30rows.md`）

| 項目 | 内容 |
| --- | --- |
| 計測対象 | `rollbackSchemaAliasBulk` に 30 件の row を渡し、confirm 押下から最後の row の `status` が `success` / `error` に確定するまでの wall clock |
| 合否基準 | NFR-5: **30 件が 30 秒（30,000 ms）以内**で完了 |
| concurrency | 8（既定値。`SchemaAliasRollbackBulkOptions.concurrency` 未指定時のデフォルト） |
| 計測環境 | local dev（`wrangler dev` + `localhost`）または branch preview。staging 計測は PR 後 runtime gate で再取得 |
| 計測手順 | (1) HistoryPane に 30 件の resolve 済み alias がある状態で bulk rollback mode ON → 全件選択 → (2) confirm 押下 → (3) browser DevTools Network タイムラインで全件完了までの elapsed を計測 → (4) elapsed ms / 各 row HTTP latency / 結果（全成功/部分）を記録 |
| 超過時の対応 | 30 秒超過時は Phase 8 の concurrency パラメータ調整を検討し再計測 |

記録項目: 30 行 submit の総 elapsed ms / 各 row の HTTP latency / 成功・失敗件数 / 計測環境（local dev or branch preview）/ 合否判定。

> spec test 内の mock HTTP による時間計測は実環境と乖離するため、NFR-5 の証跡は本 manual evidence のみを正とする（phase-09 注記と整合）。

---

## a11y 手動確認計画（`outputs/phase-11/a11y-manual-check.md`）

| 確認項目 | 期待結果 |
| --- | --- |
| checkbox `aria-label` | 各履歴行 checkbox に `alias <label> を一括取消対象に含める` 相当の `aria-label` が付与され、スクリーンリーダーで識別できる |
| modal `role="dialog"` | confirm modal root に `role="dialog"` が付与される |
| modal `aria-modal="true"` | modal root に `aria-modal="true"` が付与され、背景が不活性として扱われる |
| modal `aria-labelledby` | `aria-labelledby` が見出し要素の id と一致する |
| focus trap | modal open 中に Tab を複数回押してもフォーカスが modal 外へ抜けない |
| Escape close | Escape キーで `onClose` が発火し modal が閉じる（`phase === "submitting"` 中は無視） |
| キーボード操作 | checkbox / select-all / 「一括取消」/ 「失敗分を再取消」ボタンがキーボードのみで操作完結できる |
| 進捗・結果の読み上げ | submit 進捗 / summary バナー（全成功・部分成功・全失敗）がスクリーンリーダーで読み上げられる（`aria-live` 推奨） |

確認ツール: VoiceOver（macOS）/ NVDA（Windows）での手動読み上げ + jest-axe（spec MOD-14 で violations 0 を自動確認）。

---

## 取得スクリプト方針（ポート解放保証 / FB-MSO-003）

screenshot 取得スクリプトは、playwright browser と dev server のポートを確実に解放するため、以下の `try { ... } finally { ... }` パターンを必須とする。

```
try {
  // server 起動 → browser launch → 各 viewport で page 操作 → screenshot 取得
} finally {
  browser.close();   // browser を必ず閉じる
  server.close();    // dev server ポートを必ず解放する
}
```

> 正常・異常いずれの経路でも `finally` で `browser.close()` / `server.close()` を実行し、ポートが解放されないまま残らないことを保証する（FB-MSO-003）。

---

## screenshot ファイル名 canonical 4 か所一致（FB-LLM-MOD-05-001）

下記 6 枚 + 2 md のファイル名は、以下 4 か所で同一のセマンティック canonical 名を使用する。命名の drift を禁止する。

| 出現箇所 | 役割 |
| --- | --- |
| 本 phase-11 spec（証跡計画テーブル / NFR-5 / a11y） | canonical 名の定義 |
| capture script（playwright test / screenshot 出力パス） | 実際の出力ファイル名 |
| metadata（`artifacts.json` の `planned_visual_evidence_files`） | 計画ファイル一覧 |
| `outputs/phase-12/implementation-guide.md`（Phase 11 evidence 表） | PR 本文へ引き継ぐ参照名 |

canonical ファイル名一覧（`outputs/phase-11/` 配下）:

- `bulk-rollback-select-desktop-1280.png`
- `bulk-rollback-modal-desktop-1280.png`
- `bulk-rollback-partial-failure-desktop-1280.png`
- `bulk-rollback-success-desktop-1280.png`
- `bulk-rollback-select-mobile-375.png`
- `bulk-rollback-modal-mobile-375.png`
- `perf-30rows.md`
- `a11y-manual-check.md`

---

## 手動シナリオ（E2E-BR と対応）

### MT-1: 正常系 3 件一括 rollback（E2E-BR-01 / AC-1）

1. `/admin/schema` へアクセス → HistoryPane の「Bulk Rollback」トグル ON
2. resolve 履歴の 3 行を checkbox 選択 → 「3 件選択中」バッジを確認
3. 「一括取消」ボタン押下 → confirm modal 表示（`bulk-rollback-modal-desktop-1280.png`）
4. confirm 押下 → 3 行すべて success バッジ → 全成功 summary（`bulk-rollback-success-desktop-1280.png`）→ modal close → `router.refresh()`
5. 該当 3 行が HistoryPane から消えていることを確認

### MT-2: 部分失敗（E2E-BR-02 / AC-2）

1. 3 件中 1 件の alias を事前に version 更新し 409 を誘発できる状態にする
2. 3 行選択 → confirm → 完了
3. summary バナーに「部分成功 / 2 件成功 / 1 件失敗」、失敗行に `version_mismatch` バッジ、「失敗分を再取消」ボタンが残ることを確認（`bulk-rollback-partial-failure-desktop-1280.png`）
4. 失敗行の最新 version を再取得して再 submit → 全件成功を確認

### MT-3: 50 件上限抑止（E2E-BR-03 / AC-5）

1. bulk rollback mode ON → 51 件を select-all で選択
2. 50 件超 alert が表示され「一括取消」ボタンが disabled であることを確認

### MT-4: 全失敗（E2E-BR-04 / AC-4）

1. 全件 409 を mock / fixture で誘発 → confirm → 完了
2. summary バナーに「全失敗」相当、「失敗分を再取消」ボタンが表示されることを確認

### MT-5: NFR-5 性能計測（AC 補強 / NFR-5）

上記「NFR-5 性能計測計画」の手順に従い 30 件を計測し `perf-30rows.md` に記録。

### MT-6: mobile 375 幅

1. iPhone SE viewport（375×667）で MT-1 を実行
2. checkbox / select-all / modal が overflow なく表示されることを確認（`bulk-rollback-select-mobile-375.png` / `bulk-rollback-modal-mobile-375.png`）

---

## フィードバックループ

手動テスト / evidence 取得中に **HIGH 重大度の問題**（AC 違反・a11y violation・性能 NFR 未達など）を発見した場合は、`docs/30-workflows/unassigned-task/` 配下へ自動 formalize（unassigned-task spec 化）する。本タスク内で即時修正可能なものは実装サイクル内で対応し、別関心・別スコープのものは unassigned-task として分離する。

---

## 完了条件

- [ ] MT-1〜MT-6 全件 PASS
- [ ] 上記 6 PNG + `perf-30rows.md` + `a11y-manual-check.md` が `outputs/phase-11/` に配置（**実装フェーズで生成**）
- [ ] NFR-5（30 件 / 30 秒以内）達成を `perf-30rows.md` で確認
- [ ] a11y 手動確認項目（checkbox aria-label / role=dialog / aria-modal / focus trap / Escape / キーボード操作）が全件 PASS
- [ ] screenshot ファイル名が phase spec / capture script / metadata / implementation-guide の 4 か所で canonical 一致
- [ ] 取得スクリプトが `try/finally` でポート解放を保証
- [ ] HIGH 問題発見時は `docs/30-workflows/unassigned-task/` へ formalize 済み
