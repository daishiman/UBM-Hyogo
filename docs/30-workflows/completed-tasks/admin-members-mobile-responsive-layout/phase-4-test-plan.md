# Phase 4: テスト計画

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 4 / 13
- 前提: [phase-3-design-review.md](phase-3-design-review.md) PASS
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- 関連ファイル: F3 `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx`（編集）/ F4 `apps/web/playwright/tests/admin-members-mobile.spec.ts`（新規）

## 目的

モバイルカード化（≤640px）実装に対するテスト設計を確定する。`MembersTable.tsx` の属性追加（`data-component` / `data-role` / `data-label` / `data-cell`）を unit test（jsdom）で属性存在検証し、CSS media query によるカード見た目の切替は jsdom で検証不能なため Playwright（実ブラウザ）で視覚検証する、という役割分担を固定する。既存 TC-MT-01〜20（axe a11y 含む）を1件も壊さない回帰方針を明記する。

## 実行タスク

### Step 1: TDD 役割分担の固定（jsdom vs 実ブラウザ）

| 検証対象 | 手段 | 理由 |
| -------- | ---- | ---- |
| `data-component` / `data-role` / `data-label` / `data-cell` 属性の存在 | unit test（jsdom / vitest）TC-MT-21〜24 | 属性は DOM に常時存在するため `@media` 非依存で検証可能 |
| カード化（`display:block` 化・thead 非表示・`::before` ラベル表示） | Playwright（実ブラウザ）F4 | jsdom は CSS `@media (max-width:640px)` を適用せず `getComputedStyle().display` を解決しないため検証不能 |
| 横はみ出しゼロ（`scrollWidth <= clientWidth + 許容誤差`） | Playwright F4 | レイアウト計算は実ブラウザのみ |
| desktop テーブル維持（1280px で thead 可視） | Playwright F4 | 同上 |

> **役割分担の1行宣言**: カード化は CSS media query のため jsdom では computed display を検証できない → unit は「属性存在検証」、Playwright は「実ブラウザ視覚検証」に責務を分割する。

### Step 2: VSCPKR-03 対応（props 駆動の明示）

- `MembersTable` は **props のみで駆動**し internal state を持たない（breakpoint も CSS 正本 I-5）。TC-MT-21〜24 のテスト操作対象は「レンダリング結果の DOM 属性」であり internal state ではない。

### Step 3: 追加 unit test 設計（TC-MT-21〜24 / F3 へ追加）

SSOT §6 のテーブルを正本に、各 TC の観点・操作・期待値・jsdom 検証可否を具体化する。`MembersTable.spec.tsx`（F3）の末尾 `describe("MembersTable", ...)` ブロック内に `it(...)` として追加する（既存と同形式）。

#### TC-MT-21: ラッパーに `data-component="admin-members-table"` が存在

| 項目 | 内容 |
| ---- | ---- |
| 観点 | カード化 CSS のスコープ起点となる属性がラッパー `<div>` に付与されているか |
| 操作 | `render(<MembersTable {...baseProps} items={3件のサンプル} />)` → `container.querySelector('[data-component="admin-members-table"]')` |
| 期待値 | 戻り値が truthy（`toBeTruthy()`）。かつ要素が `<div>`（`tagName === "DIV"`） |
| jsdom 検証可否 | **可**（属性は `@media` 非依存で DOM に存在） |

#### TC-MT-22: データ `<td>` に `data-label` が正しく付与（メール / 区画 ステータス / タグ / 最終更新 / 公開）

| 項目 | 内容 |
| ---- | ---- |
| 観点 | カード時に `::before { content: attr(data-label) }` でラベル表示する 5 セル（td3/td4/td5/td6/td7）に正しい `data-label` 値が付与されているか |
| 操作 | 1 件以上の行を描画し、各 `data-label` 値を `container.querySelector('td[data-label="..."]')` で取得 |
| 期待値 | 以下 5 値が DOM に存在（各 `toBeTruthy()`）:<br>・`td[data-label="メール"]`<br>・`td[data-label="区画 / ステータス"]`<br>・`td[data-label="タグ"]`<br>・`td[data-label="最終更新"]`<br>・`td[data-label="公開"]`<br>逆ガード: ラベルなしセル（select / member / actions）は `data-label` を持たず、代わりに `td[data-cell="select"]` / `td[data-cell="member"]` / `td[data-cell="actions"]` が truthy |
| jsdom 検証可否 | **可**（属性値の存在検証） |

#### TC-MT-23: `<thead>` に `data-role="table-head"` が存在

| 項目 | 内容 |
| ---- | ---- |
| 観点 | カード時に CSS で視覚的に隠す対象 `<thead>` に `data-role="table-head"` が付与され、かつ DOM から削除されていない（a11y role 保持）か |
| 操作 | `container.querySelector('[data-role="table-head"]')` および `container.querySelector("thead")` |
| 期待値 | `[data-role="table-head"]` が truthy かつ `tagName === "THEAD"`。`thead` 要素が DOM に残存（`toBeTruthy()`） |
| jsdom 検証可否 | **可**（属性 + DOM 残存。視覚的非表示は CSS なので unit では検証しない＝Playwright 側） |

#### TC-MT-24: 機械可読id 不変リグレッションガード（row testid / 編集 aria-label / 全選択 aria-label）

| 項目 | 内容 |
| ---- | ---- |
| 観点 | 属性追加によって既存の機械可読id（I-2）が破壊されていないことを保証する回帰ガード |
| 操作 | サンプル行 `memberId` を用い、以下 selector を解決:<br>・`screen.getByTestId(`admin-members-row-${memberId}`)`<br>・`screen.getByRole("button", { name: `${fullName} を編集` })`<br>・`screen.getByRole("checkbox", { name: "全選択" })`<br>・`screen.getByRole("checkbox", { name: `${fullName} を選択` })` |
| 期待値 | 全 selector が引き続き解決し要素を返す（各 `toBeInTheDocument()`）。`chip-dot` / `member-state-chip-row` testid も既存 TC-MT-08/09 で担保済のため、本 TC では `container.querySelector('[data-testid="member-state-chip-row"]')` が truthy を追加確認 |
| jsdom 検証可否 | **可**（DOM 属性 / role / testid の解決） |

### Step 4: 既存 TC-MT-01〜20 回帰方針（I-8 / AC-7）

- 既存 20 件（empty 表示・行描画・checkbox toggle・氏名 click・pagination・occupation・chip群・tags・**axe a11y TC-MT-13/18〜20 含む**）は**1件も改変しない**。
- 追加属性（`data-component` / `data-role` / `data-label` / `data-cell`）は DOM 構造・行/セル順序・既存 testid を変えないため、既存 selector はすべて引き続き解決する。
- axe テスト（TC-MT-13/18/20 等の `a11y violations 0`）は jsdom が `@media (max-width:640px)` を適用しないため、computed display に影響されず緑を維持する。`<thead>` を DOM 残置することで table role が保持され axe 違反は増えない。
- 回帰判定: `vitest run MembersTable.spec.tsx` で **既存20 + 追加4 = 24 件すべて PASS** であること。

### Step 5: Playwright F4 設計（`admin-members-mobile.spec.ts`、新規）

`apps/web/playwright/tests/admin-members-mobile.spec.ts` を新規作成する。実ブラウザでカード/テーブル切替・横はみ出しゼロを視覚検証する mobile visual smoke。

| ケースID | viewport | 観点 | 操作 | 期待値 |
| -------- | -------- | ---- | ---- | ------ |
| PW-MM-01 | 375×667 | カード表示（縦積み） | `/admin/members` へ遷移し最初の `[data-testid^="admin-members-row-"]` を取得 | 各行が縦積み（行の `boundingBox().width` がコンテナ幅とほぼ一致＝横並び td が block 化）。`[data-role="table-head"]` が視覚非表示（`isVisible()` が false、または `display:none`/clip 相当で boundingBox が極小） |
| PW-MM-02 | 375×667 | 横はみ出しゼロ | `[data-component="admin-members-table"]` の `scrollWidth` と `clientWidth` を `evaluate` で取得 | `scrollWidth <= clientWidth + 1`（許容誤差 1px）。さらに `document.documentElement.scrollWidth <= window.innerWidth + 1` でページ全体の横スクロール非発生を確認 |
| PW-MM-03 | 375×667 | 公開トグル可視・操作可能 | 最初の行内の `MemberPublishSwitch`（公開トグル）要素を取得 | トグルが viewport 内（`boundingBox()` の `x + width <= 375`）かつ `isVisible()` が true。編集ボタン（`aria-label$="を編集"`）も viewport 内可視 |
| PW-MM-04 | 1280×800 | desktop テーブル維持 | 同ページで `[data-role="table-head"]` を取得 | `[data-role="table-head"]` が `isVisible()` true（thead 可視＝カード CSS 非適用）。行が横並び（メール td とメンバー td の `boundingBox().y` がほぼ同一＝同一行レイアウト） |

- 横はみ出し判定の正本式: `scrollWidth <= clientWidth + 許容誤差(1px)`。
- 認証 / fixture: 既存 Playwright admin smoke と同じ admin セッション準備手順を踏襲する（実装時に既存 `playwright/tests/` の admin spec を確認して同方式を流用。新規認証フローは作らない）。
- **CAPTURE_BLOCKED 方針（TECH-M-02）**: worktree / CI で Playwright が起動不可の場合、F4 は実行スキップとし Phase 11 で `CAPTURE_BLOCKED` を記録。unit test PASS + 手動 375 / 640 / 1280px スクリーンショットを代替証跡とする（ダミーPNG禁止）。

### Step 6: ローカル実行コマンド（SSOT §7 から該当分・`mise exec --` 経由）

```bash
# 追加・既存 unit test（targeted）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx

# Playwright mobile（環境が許せば）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-mobile
```

> filter 名 `@ubm-hyogo/web` は実装時に `apps/web/package.json` の `name` で実値確認する（異なれば実値に合わせる）。

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| SSOT | `outputs/shared-context.md` | §3.2 td→data-label マップ / §6 テスト方針 / §7 コマンド |
| 要件定義 | `phase-1-requirements.md` | AC-7 / I-8 |
| 設計 | `phase-2-design.md` | VSCPKR-03（props 駆動）/ jsdom 限界 |
| 既存テスト | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | TC-MT-01〜20 |

## 実行手順

1. TDD 役割分担（jsdom 属性検証 vs Playwright 視覚検証）を固定。
2. TC-MT-21〜24 の観点・操作・期待値・jsdom 検証可否を確定（Step 3）。
3. 既存 TC-MT-01〜20 回帰方針（不改変・全緑）を確定（Step 4）。
4. Playwright F4 の 4 ケース（PW-MM-01〜04）と横はみ出し判定式を確定（Step 5）。
5. ローカル実行コマンドを SSOT §7 と整合（Step 6）。

## 統合テスト連携

- Phase 6: TC-MT-21〜24 と Playwright F4 を実装（fail path / 回帰ガード拡充）。
- Phase 9: `vitest run MembersTable.spec.tsx` で 24 件全緑 + `verify-design-tokens` 相当を確認。
- Phase 11: Playwright F4 実行 or CAPTURE_BLOCKED 記録（375/640/1280 手動 screenshot 代替）。

## 多角的チェック観点（AIが判断）

- システム系: テスト対象は表現層の DOM 属性のみ。API / state を触らないため fixture も既存流用で完結。
- 問題解決系: jsdom の `@media` 非適用という限界を「属性存在検証（unit）＋視覚検証（Playwright）」の二層で正しく分担。検証不能を Playwright へ逃がすことで偽陰性・偽陽性を回避。
- 品質系: 既存 axe テストを再掲・不改変で回帰ガード化。属性追加が a11y 違反を増やさないことを保証。

## サブタスク管理

| ID | 内容 | Phase |
| -- | ---- | ----- |
| TS-1 | TC-MT-21〜24 設計確定 | 4 |
| TS-2 | Playwright F4 ケース設計確定 | 4 |
| TS-3 | 既存 TC 回帰方針確定 | 4 |
| TS-4 | 実装（緑化） | 6 |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| テスト仕様 | `outputs/phase-4/test-specification.md` |

## 完了条件

- [ ] TC-MT-21〜24 の観点・操作・期待値・jsdom 検証可否が各 TC で具体化されている。
- [ ] Playwright F4 の 4 ケースが viewport / 観点 / 期待値（横はみ出し判定式含む）付きで定義されている。
- [ ] jsdom vs 実ブラウザの役割分担が1行で明記されている。
- [ ] VSCPKR-03（props 駆動・テスト対象は DOM 属性）が1行で明記されている。
- [ ] 既存 TC-MT-01〜20 を壊さない回帰方針（不改変・24件全緑）が記載されている。
- [ ] ローカル実行コマンドが `mise exec --` 経由で SSOT §7 と整合している。

## タスク100%実行確認【必須】

- [x] TDD 役割分担固定
- [x] TC-MT-21〜24 具体化
- [x] Playwright F4 設計
- [x] 既存回帰方針
- [x] 実行コマンド整合

## 次Phase

[phase-5-implementation.md](phase-5-implementation.md) — 実装手順。
