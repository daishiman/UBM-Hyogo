[実装区分: 実装仕様書]

# Phase 11: 手動テスト / 視覚証跡（VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動テスト・VISUAL screenshot |
| 実行種別 | serial |
| 作成日 | 2026-06-11 |
| 上流 | Phase 10（最終レビュー / Go 判定） |
| 下流 | Phase 12（ドキュメント更新） |
| 状態 | runtime_pending（capture user-gated） |
| visualScope | **VISUAL** |
| visualEvidence | `VISUAL`（local focused evidence present。6 canonical PNG は user-gated capture） |

## 目的

`/admin/audit`（監査ログ）の日本語化 + フィルタ段階開示 + カード整列について、**3 層評価（Semantic / Visual / AI UX）の観点・capture 対象 screenshot の canonical 命名・取得手順（Playwright・staging 認証済み admin）を固定**する。apps/web 実装と focused 機械検証は完了し、staging admin bearer を用いた実 screenshot 6 枚はユーザー明示承認後に行う。AC-1〜AC-12 のうち視覚で確認すべき項目（AC-1 ラベル / AC-2 段階開示 / AC-3 カード日本語 / AC-4 チップ日本語 / AC-5 datalist / AC-7 整列）を Phase 11 の評価観点に対応付ける。

## VISUAL 宣言

- 本タスクは監査ログ `/admin/audit` の表現層（フォームラベル日本語化・2 層段階開示・カード整列）を変更する **UI 変更**であるため **VISUAL** である。screenshot は必須。
- 本 Phase は「capture 対象・canonical 命名・取得手順・3 層評価観点」を固定し、未取得の 6 PNG を明示する。
- **[Feedback BEFORE-QUIT-001]** staging authenticated capture は deploy / bearer mint を伴うため user-gated。実画像・runtime artifact を擬似生成しない（FB-MSO-003）。
- staging 認証済み admin 画面（`/admin/audit`）での実 capture は、実装完了 + staging deploy + admin bearer mint を伴うため **user-gated** とする。

## 11.1 評価の 3 層構造

| 層 | 観点 | 確認内容 |
| --- | --- | --- |
| Semantic | 構造・機能 | `<input name>`（query param キー）が英語のまま維持される（API 契約）/ `<details>`/`<summary>` のキーボード操作 / `FormField` の label-input 関連付け / 適用フィルタ `aria-label="現在の絞り込み条件"` 維持 / cursor ページネーション・PII マスク・JSON 開示の温存 |
| Visual | 見た目・token | フォームラベル・カード・チップが日本語表示（英語キー名露出 0）/ `.chip-row` の `flex-wrap` 整列 / `.admin-audit-glossary` グリッド整列 / `.admin-audit-card__meta` の truncate 安全 / `.admin-audit-filter-advanced`（details）スタイル / OKLch トークンのみ（HEX 0 件）/ mobile 1 カラム成立 |
| AI UX | ユーザー体験 | 非エンジニアの管理者が「いつ・誰が・何を操作したか」を日本語で一目で把握できること、よく使う絞り込みが前面に出て初見負荷が下がること、詳細条件が引き出しに格納され必要時のみ展開されること |

## 11.2 capture 対象 screenshot（canonical 名）

実装サイクルで下記を staging 認証済み admin 画面の Playwright runtime で `outputs/phase-11/screenshots/` へ保存する。canonical 命名は `outputs/phase-11/screenshot-plan.json` の `name` フィールドと完全一致させる（TC 番号は `phase11-capture-metadata.json` の `tc` フィールドのみに記す）。

| # | canonical 名 | 検証 AC | viewport | state |
| --- | --- | --- | --- | --- |
| ① | `audit-page-full.png` | AC-1 / AC-4 / AC-7 | desktop | 画面全体（日本語化後・after 状態） |
| ② | `audit-filter-collapsed.png` | AC-1 / AC-2 | desktop | フィルタ常時表示のみ・詳細な絞り込みが閉じた初期状態 |
| ③ | `audit-filter-expanded.png` | AC-2 | desktop | 詳細な絞り込み（対象の種類 / 対象ID / 一括処理ID）を展開した状態 |
| ④ | `audit-timeline-cards-ja.png` | AC-3 / AC-5 / AC-7 | desktop | 監査ログカードの操作・対象種別が日本語ラベル表示 |
| ⑤ | `audit-applied-filters-chips.png` | AC-4 / AC-7 | desktop | 現在の絞り込みチップが日本語化 + flex-wrap で整列 |
| ⑥ | `audit-page-mobile.png` | AC-7 | mobile | モバイル幅・フィルタ2層とカードが 1 カラムで成立 |

> canonical 名は `outputs/phase-11/screenshot-plan.json` と `outputs/phase-11/phase11-capture-metadata.json` で完全一致させる（命名一貫性の厳守）。

## 11.3 capture 手順（Playwright・staging 認証済み admin）

### 環境

| 項目 | 値 |
| --- | --- |
| 対象 route | `/admin/audit`（admin gate 通過必須） |
| staging | `https://ubm-hyogo-web-staging...workers.dev/`（user-gated deploy 後） |
| 認証 | admin role bearer（staging mint。`scripts/smoke` 系の認証手順に準拠） |
| viewport | desktop（1280×800 目安）/ mobile（390×844 目安） |

### capture script パターン（FB-MSO-003 準拠 / 厳守）

capture script には必ず `try { ... } finally { browser.close(); server.close(); }` を入れる。finally ブロックを省略しない（前サイクル教訓 [FB-MSO-003] / L-MSO-003）。

```js
// 擬似コード（実装サイクルで apps/web/playwright/tests/ 配下に実体化）
const browser = await chromium.launch();
const server = /* 必要時のみ起動。staging 直接 capture では未使用 */ null;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  // 1) admin 認証 cookie / bearer を注入
  // 2) /admin/audit へ遷移
  // 3) details は閉じた初期状態（②）→ <summary> クリックで展開（③）
  // 4) 適用フィルタチップが出る query 条件で遷移して capture（⑤）
  await page.screenshot({ path: "outputs/phase-11/screenshots/audit-page-full.png", fullPage: true });
  // ... 各 canonical 名で capture
} finally {
  await browser.close();        // 必ず finally で close
  if (server) await server.close();
}
```

### フィルタ開閉 / チップ状態の作り方

- 閉じた初期状態（②）: 詳細フィルタ（targetType / targetId / batchId）に値が無い URL で capture。
- 展開状態（③）: `<summary>詳細な絞り込み（対象・一括処理ID）</summary>` をクリック、または詳細フィルタに値がある URL（`?targetType=meeting` 等）で `open` 既定が効いた状態を capture。
- チップ整列（⑤）: 複数条件（action / actorEmail / from / to / targetType）を付けた URL で遷移し、`.chip-row` が `flex-wrap` で折り返す状態を capture。

## 11.4 staging / 環境ブロッカー（user-gated）

| 操作 | 区分 |
| --- | --- |
| コード実装（auditGlossary / AuditLogPanel / AuditLogCard / auditAppliedFilters / globals.css） | user-gated（後続サイクル） |
| focused vitest / typecheck / lint / `verify:tokens` | user-gated（後続サイクル） |
| staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`） | user-gated |
| admin role bearer mint（staging） | user-gated |
| 実 staging admin 画面の screenshot capture（6 枚） | user-gated |

> local implementation and focused Vitest are complete. staging admin bearer / user 承認が揃い次第、6 canonical PNG を capture する。

## 11.5 手動テストチェックリスト連携

- Apple HIG 観点（視覚的階層・焦点・余白リズム・タイポスケール・コントラスト・タップ/クリック領域・一目での理解しやすさ）は `outputs/phase-11/manual-test-checklist.md` に固定する。
- VISUAL 証跡の記録テンプレートは `outputs/phase-11/manual-test-result.md`（作成済）、スコープ外発見は `outputs/phase-11/discovered-issues.md`（0 件でも記録）。

## 実行タスク

1. capture 対象 6 screenshot の canonical 名を `screenshot-plan.json`（`mode: "VISUAL"`・作成済）と `phase11-capture-metadata.json`（作成済）で一致させる。
2. 3 層評価（Semantic / Visual / AI UX）観点を固定する。
3. Apple HIG チェックリストを `manual-test-checklist.md` に固定する。
4. VISUAL 証跡記録テンプレートと discovered-issues を作成する（実 capture は後続サイクル）。

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/main.md`（component-map / layout-blueprint） | screenshot 対象の 2 層フォーム・カード構造・canonical state を導出 |
| Phase 5 | `outputs/phase-05/main.md`（runbook） | 実装計画 UI の capture 手順へ接続 |
| Phase 6 | `outputs/phase-06/main.md`（failure-cases） | 未登録コード fallback / 詳細フィルタ値あり open の手動確認に接続 |
| Phase 7 | `outputs/phase-07/ac-matrix.md` | AC↔screenshot の網羅性確認 |
| Phase 9 | `outputs/phase-09/main.md`（token-audit） | token gate 観点後の VISUAL 証跡として capture |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-10/go-no-go.md | Go 判定 / Phase 11 進行条件 |
| 必須 | outputs/phase-10/main.md | AC↔screenshot マッピング |
| 必須 | _shared-context.md（§3 確定方針 / §5 AC） | AC / 段階開示（常時 5 項目 / details 3 項目） |
| 参考 | `docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/phase-11.md` | FB-MSO-003 capture パターン先例 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 12 | screenshot canonical 名を implementation-guide.md の視覚証跡に参照 |
| Phase 13 | PR 本文に screenshot 参照（実 capture 取得後） |

## 多角的チェック観点（AIが判断）

| 観点 | AC | 確認内容 |
| --- | --- | --- |
| ラベル日本語化 | AC-1 | ①② でフォームラベルが日本語で表示され `<input name>` は英語維持 |
| 段階開示 | AC-2 | ②（閉）と③（開）で詳細フィルタが折りたたまれ、値ありで `open` する |
| カード日本語 | AC-3 / AC-5 | ④ で action / targetType / auditId が日本語表示 |
| チップ整列 | AC-4 / AC-7 | ⑤ で適用チップが日本語化 + `flex-wrap` で整列 |
| レスポンシブ | AC-7 | ⑥（mobile 1 カラム）でフォーム2層とカードが成立 |
| token 正本 | AC-8 | 全 screenshot 中の色が OKLch トークン由来（HEX 0 件） |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | screenshot-plan.json（VISUAL・6 枚） | 11 | completed | canonical 名固定（作成済） |
| 2 | phase11-capture-metadata.json | 11 | completed | tc / route / viewport / state（作成済） |
| 3 | 3 層評価観点 | 11 | runtime_pending | main.md |
| 4 | Apple HIG チェックリスト | 11 | runtime_pending | manual-test-checklist.md |
| 5 | VISUAL 証跡記録テンプレート | 11 | completed | manual-test-result.md（作成済） |
| 6 | discovered-issues（0 件記録） | 11 | runtime_pending | discovered-issues.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | VISUAL 総括 |
| メタ | outputs/phase-11/screenshot-plan.json | `mode: "VISUAL"` / 6 canonical 名（作成済） |
| メタ | outputs/phase-11/phase11-capture-metadata.json | taskId / 各 screenshot の name/tc/route/viewport/state（作成済） |
| ドキュメント | outputs/phase-11/manual-test-checklist.md | Apple HIG 観点チェックリスト |
| ドキュメント | outputs/phase-11/manual-test-result.md | VISUAL 証跡記録テンプレート（作成済） |
| ドキュメント | outputs/phase-11/discovered-issues.md | スコープ外発見（0 件でも記録） |

## 統合テスト連携

> 本 Phase の VISUAL screenshot は実装後の手動確認・回帰チェックの起点となる。Phase 12 implementation-guide / Phase 13 PR 本文の screenshot 参照と canonical 名を完全一致させ、`outputs/phase-11/screenshots/` の実 capture 数と PR 画像参照数を一致させる（CLAUDE.md フロー準拠）。

## 完了条件

- [ ] `screenshot-plan.json` が `mode: "VISUAL"` で 6 canonical 名を固定している（作成済）
- [ ] `phase11-capture-metadata.json` が `taskId` と各 screenshot の `{name, tc, route, viewport, state}` を持ち、canonical 名が screenshot-plan.json と一致している（作成済）
- [ ] 3 層評価（Semantic / Visual / AI UX）が main.md に固定されている
- [ ] capture script の `try/finally { browser.close(); server.close(); }` パターンが明記されている（FB-MSO-003）
- [ ] Apple HIG チェックリストが manual-test-checklist.md に固定されている
- [x] 実 capture が user-gated であり、6 PNG 未取得であることが明記されている
- [ ] discovered-issues.md が実体ファイルとして存在する（0 件でも「0 件」と記録）

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜6 が完了している
- [ ] outputs/phase-11/* の 6 成果物が実体ファイルとして配置済み
- [ ] screenshot canonical 名が screenshot-plan.json と phase11-capture-metadata.json で完全一致している（不一致 0 件）
- [ ] VISUAL 宣言と user-gated capture 境界が記録されている
- [x] artifacts.json の Phase 11 ステータスが runtime_pending に整合している

## 次Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ事項: screenshot canonical 名 6 件 / 3 層評価結果 / discovered-issues
- ブロック条件: capture 対象または canonical 命名が未確定の場合は本 Phase に留まる
