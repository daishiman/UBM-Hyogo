<!-- workflow: members-list-ux-clarity / task: A / phase: 1 -->

# Phase 1 — 要件定義 (task-a-density-toggle-ux-clarity)

[実装区分: 実装仕様書]

> 親 workflow: `docs/30-workflows/completed-tasks/members-list-ux-clarity/`
> 親 Phase 1: `../../phase-1-requirements.md`
> Branch: `feat/members-list-ux-clarity`
> taskType: `implementation` / visualEvidence: `VISUAL` / implementation_mode: `new`

## 1. 背景

`/members` の `DensityToggle` は Segmented 3 択 (ゆったり / 密 / リスト) で並ぶが、
各モードが「カード情報量の差」を意味することはラベルのみでは伝わらない。
試行錯誤でクリックして差を理解する状態が観察課題として残っており、本タスクで
**主ラベルを変更せず**に「sublabel」「HelpHint popover」「aria-description」の
3 つの affordance 層を追加して解消する。

## 2. 受入条件 (AC)

親 phase-1-requirements.md の AC-1 / AC-2 / AC-7 を担当する。

| ID | 内容 | 検証方法 |
| -- | ---- | -------- |
| AC-A1 | 各 option ボタン内に `data-role="sublabel"` で sublabel テキスト (`カード詳細` / `カード簡易` / `1行リスト`) が描画されている | vitest: `container.querySelectorAll('[data-component="density-toggle"] [data-role="sublabel"]')` が 3 件 |
| AC-A2 | 各 button に `aria-describedby="density-{value}-desc"` が付与され、対応する visually-hidden `<span id="density-{value}-desc">` が `description` 本文を持つ | vitest: `getByRole("radio", { name: "ゆったり" }).getAttribute("aria-describedby")` が `"density-comfy-desc"` |
| AC-A3 | `DensityToggle` ルートの右隣に `data-component="help-hint"` の `<details>` が 1 つ存在し、`<summary>` は `?` icon + visually-hidden ラベル `"表示密度の説明を見る"` を持つ | vitest: `container.querySelector('[data-component="help-hint"] summary')` の `aria-label` 一致 |
| AC-A4 | HelpHint open 状態で 3 モード分の `<dt>{ラベル}</dt><dd>{description}</dd>` が描画される | vitest: `fireEvent.click(summary)` 後 `getAllByRole("term").length === 3` |
| AC-A5 | 既存 spec の 3 ケース (radiogroup 描画 / comfy 選択 → density param 削除 / dense 選択 → density=dense 付与) が引き続き PASS | vitest: 既存テスト無修正で GREEN |
| AC-A6 | 主ラベル "ゆったり / 密 / リスト" は変更されない (プロトタイプ正本順位 INV-5) | vitest: 既存 `getByRole("radio", { name: "ゆったり" })` が引き続き解決可能 |
| AC-A7 | HEX 直書き 0 件・新 primitive 追加 0 件・URL query 仕様変更 0 件 | `pnpm verify-design-tokens` GREEN / `git diff --stat` で primitives 配下 0 件 |
| AC-A8 | `@media (max-width: 480px)` 時 `[data-role="sublabel"]` が `visually-hidden` 相当に切り替わり、Segmented 高さが mobile で崩れない | Phase 11 手動: Playwright preview viewport 375 で目視 + DevTools |

## 3. ペルソナ・ユースケース

| ペルソナ | 期待 |
| -------- | ---- |
| P-1 初回訪問者 | sublabel で各モードのイメージを掴み、HelpHint で詳細を理解 |
| P-3 SR / キーボード利用者 | `aria-describedby` 経由で各モードの説明を SR が読み上げる |

## 4. Inventory (本タスクで変更するファイル)

| 種別 | パス | 推定差分 | 改修概要 |
| ---- | ---- | -------- | -------- |
| 修正 | `apps/web/src/components/public/DensityToggle.client.tsx` | +60 / -5 | OPTIONS 拡張 (`sublabel` / `description`) + HelpHint 配置 + `aria-describedby` 配線 + visually-hidden description nodes |
| 修正 | `apps/web/src/components/ui/Segmented.tsx` | +10 / -2 | `SegmentedOption` 型に `sublabel?: string` / `description?: string` / `ariaDescribedBy?: string` 加法追加、`<button>` 内 sublabel 描画 |
| 新規 | `apps/web/src/components/public/DensityToggle.client.tsx` | +60 | `<details>` ベース軽量 popover (`HelpHintProps { triggerLabel, items: { label, description }[] }`) |
| 修正 | `apps/web/src/styles/legacy-public.css` | +60 / -0 | `[data-role="sublabel"]` / `[data-component="help-hint"]` styles (OKLch token のみ) + mobile media query |
| 修正 | `apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx` | +50 | AC-A1〜A6 検証 ケース追加 (既存 3 ケースは不変) |

## 5. Out-of-scope

- `MemberFilters` 系の変更 (Task B 担当)
- `/members/page.tsx` 統合・visual baseline 撮影 (Task C 担当)
- `Segmented` の disabled / icon / size 等の primitive 拡張 (option shape 加法追加のみ)
- HelpHint の `<dialog>` 化や focus trap 実装 (`<details>` native 挙動で十分)
- icon library 追加 (`?` は inline SVG or 既存 character で表現)

## 6. carry-over 確認

- 既存 `DensityToggle.client.spec.tsx` 3 ケース (radiogroup / comfy / dense) の互換維持を必須化
- `density="comfy"` のとき URL から `density` を削除するロジックは不変
- Segmented の `role="radiogroup"` / `aria-label="表示密度"` は不変
- プロトタイプ正本 (`pages-public.jsx` `MemberDensityToggle`) の主ラベル文字列を変更しない

## 7. リスク

| ID | リスク | 対策 |
| -- | ------ | ---- |
| RA-1 | sublabel 追加で Segmented の button 高さが変わり既存 visual baseline が drift | Task C で `members-prototype-alignment.spec.ts` baseline 再撮影 (user-gated) |
| RA-2 | `<details>` ベース HelpHint が古い Safari で挙動差 | MVP 対応 evergreen ブラウザ前提を本 phase 明記。fallback は提供しない |
| RA-3 | `aria-describedby` の id 重複 (複数 DensityToggle が同一ページに存在する場合) | 本ページでは 1 個しか描画されないため許容。将来複数化が必要になった場合は `useId()` 移行を未タスク化 |
| RA-4 | mobile で sublabel を visually-hidden 化すると意味伝達が後退 | HelpHint icon は常時表示し、tablet 以上で sublabel + HelpHint の併用、mobile は HelpHint 単独で意味伝達を担保 |

## 8. P50 チェック

| 確認項目 | 結果 |
| -------- | ---- |
| current branch に実装が存在する | No → 通常の TDD RED → GREEN 順序 |
| upstream マージ済み | No |
| 前提タスク完了 | 親 workflow Phase 1-3 完了済 (Gate-A pending) |

implementation_mode: `new` (新規 sublabel + HelpHint 実装)

## 9. テスト命名規則

- 新規テストファイルは作らない (既存 `DensityToggle.client.spec.tsx` を拡張)
- 既存 `*.spec.tsx` 拡張子のみ使用 (`*.test.tsx` 禁止 — CLAUDE.md 不変条件 #8)

## DoD

- [x] AC-A1〜A8 が列挙されている
- [x] inventory が「種別 / パス / 推定差分 / 改修概要」を持つ
- [x] Out-of-scope / リスク / carry-over がそれぞれ独立節として存在する
- [x] CLAUDE.md UI alignment 不変条件 #1〜#4 への準拠を明文化
- [x] taskType=implementation / visualEvidence=VISUAL を Phase 1 メタで宣言
- [x] 既存 spec 互換維持を AC-A5/A6 で固定
