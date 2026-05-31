# Phase 11: 手動テスト + Playwright visual capture

> workflow: `issue-981-admin-members-table-list-enrichment`
> task type: **VISUAL タスク**（NON_VISUAL ではない）
> workflow_state: `implemented_local_evidence_captured`（local component evidence captured。staging authenticated capture は user-gated）

## 1. VISUAL タスク宣言

本タスクは `/admin/members` の list UI に enrichment（occupation / zone chip / type chip / tag pill / 未タグ）を **可視描画** する UI 変更であり、**VISUAL** に分類する。Phase 11 の `screenshot-plan.json` は `mode: "VISUAL"` をデフォルトとする（[Feedback W1-02b-1]）。

```json
{
  "mode": "VISUAL",
  "component": "admin-members-table",
  "states": ["enriched", "untagged"]
}
```

## 2. 3層評価の観点

| 層 | 観点 | 確認内容 |
| --- | --- | --- |
| Semantic | DOM 契約・a11y | occupation small text / zone chip(`data-tone`/`data-dot`) / type chip / tag pill / 未タグ chip が DOM 上に存在。`await axe(container)` violations 0。table 構造（thead/tbody/role）不変 |
| Visual | 見た目・トークン整合 | chip 配色が `zoneTone` / `statusTone` の token に一致。HEX 直書きゼロ。プロトタイプ `pages-admin.jsx` L223-276 と列構成・chip 種別・`+N`・「未タグ」が一致 |
| AI UX | 体験妥当性 | drawer を開かず list 上で職業 / 区画 / タグが一目把握できる。tag overflow（`+N`）で横幅が破綻しない。「未タグ」が警告色で識別できる |

## 3. Playwright visual capture 方針

1. `apps/web/tests/playwright/admin-members-visual.spec.ts` の **存在を確認** する。存在すれば enrichment 反映後の baseline 差分を取得、無ければ本 spec に沿って新規追加する（VISUAL_ON_EXECUTION）。
2. 取得する状態は最低 2 つ。
   - enrichment 全部入り行（occupation + zone chip + type chip + tag pill `+N`）が描画された状態。
   - tags 空/undefined で「未タグ」warning chip が描画された状態。
3. screenshot canonical 名は `<component>-<state>.png` 形式とする。

| state | screenshot 名 | 内容 |
| --- | --- | --- |
| enriched | `admin-members-table-enriched.png` | occupation / zone chip / type chip / tag pill + `+N` が描画された行 |
| untagged | `admin-members-table-untagged.png` | tags 空で「未タグ」warning chip が描画された行 |

> screenshot 名は **phase spec（本ファイル）/ capture metadata（screenshot-plan.json）/ implementation-guide.md** の 3 か所で一致させる（[FB-LLM-MOD-05-001]）。

## 4. 証跡取得スクリプトのパターン

capture スクリプトは必ず `try { ... } finally { browser.close(); server.close(); }` パターンで browser / server を確実に解放する（[FB-MSO-003]）。

```ts
const server = await startServer();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // mock/fixture で enrichment を注入した /admin/members を描画
  await page.screenshot({ path: "admin-members-table-enriched.png" });
  // tags 空 fixture へ切替
  await page.screenshot({ path: "admin-members-table-untagged.png" });
} finally {
  await browser.close();
  await server.close();
}
```

## 5. HIGH 問題発見時の扱い

3層評価で HIGH 問題（描画崩れ・a11y 違反・token 逸脱・プロトタイプ乖離）を発見した場合は、その問題を `unassigned-task/` 配下へ task spec として **自動生成** する。MINOR（M-1 / M-2 等）は Phase 12 `unassigned-task-detection.md` 側で扱い、本層では HIGH のみを即時 unassigned 化する。

## 6. 実地操作 / staging capture の user-gate

- **local 描画確認**は `MembersTable.spec.tsx` の component render で実行済み（認証不要）。authenticated staging capture は user-gated。
- **実地操作・staging authenticated capture**（実 D1 / 実セッションでの `/admin/members` 撮影）は **user-gated**。ユーザーの明示承認後のみ実行する。
- baseline 画像の確定・差分承認も user-gated とする。

## 完了条件

- [ ] VISUAL タスク宣言（`mode: "VISUAL"` デフォルト）が明記された
- [ ] Semantic / Visual / AI UX の 3層評価観点が定義された
- [ ] enriched / untagged の screenshot canonical 名が `<component>-<state>.png` で定義され 3 か所一致要件が記された
- [ ] capture スクリプトが `try/finally` で browser/server を解放するパターンであることが明記された
- [ ] HIGH 問題発見時の `unassigned-task/` 自動生成方針が記された
- [ ] 実地操作・staging capture が user-gated である旨が明記された
