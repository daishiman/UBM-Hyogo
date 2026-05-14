[実装区分: 実装仕様書]

# Phase 4: テスト戦略 — task-18 verify-tokens & playwright-smoke

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Task ID | `task-18-verify-tokens-and-playwright-smoke` |
| Phase | 4 / 13（テスト戦略） |
| 目的 | gate 自身を二重検証する self-test 群（verify-design-tokens C1〜C7 / Playwright smoke S1〜S5 / Visual diff V1〜V3）と a11y ルール、`maxDiffPixelRatio` 閾値を確定する |
| 依存 (前) | Phase 1（要件）/ Phase 2（API）/ Phase 3（アーキテクチャ） |
| 依存 (後) | Phase 5 以降（実装フェーズ） |
| 想定工数 | 0.15 人日 |

---

## 2. ゴール / 非ゴール

### 2.1 ゴール

- verify-design-tokens の Vitest self-test 7 ケース（C1〜C7）を確定
- Playwright smoke の self-test 5 ケース（S1〜S5）を確定
- Visual diff の self-test 3 ケース（V1〜V3）を確定
- a11y ルールセット（`wcag2a` / `wcag2aa`、`color-contrast` 除外、`serious` / `critical` blocking）を確定
- `maxDiffPixelRatio` 閾値（0.02）の根拠と運用を確定

### 2.2 非ゴール

- 個別テスト本体の実装
- functional E2E のテスト追加（task-17 までで完結済み）
- contrast ratio の semantic 検証（task-18 非ゴール）

---

## 3. 変更対象ファイル一覧

| パス | 種別 | 説明 |
|------|------|------|
| `scripts/verify-design-tokens.test.ts` | new | Vitest による C1〜C7 self-test |
| `apps/web/tests/e2e/full-smoke.spec.ts` | reference | S1〜S5 のターゲット |
| `apps/web/tests/e2e/visual/*.spec.ts` | reference | V1〜V3 のターゲット |
| `apps/web/tests/e2e/visual/__screenshots__/**` | new (gen) | baseline 4 png（commit 対象） |

---

## 4. テストシグネチャ / フィクスチャ

- Vitest runner: `mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts`
- Playwright runner: `mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke` / `e2e:visual`
- Visual baseline 更新: `mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:update`
- a11y: `AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['color-contrast']).analyze()`、`v.impact` が `serious` / `critical` のものだけを blocking として fail 判定

---

## 5. テスト方針 — verify-design-tokens self-test（C1〜C7）

| ケース | 入力 | 期待 |
|--------|------|------|
| C1: 完全一致 | 09b JSON と tokens.css が同値、globals bridge 欠落 0 | `ok: true` / `drifts.length === 0` / exit 0 |
| C2: 値ミスマッチ | tokens.css 側 `--ubm-color-accent` を `oklch(0.99 0 0)` に書換 | `ok: false` / `value-mismatch` 1 件 / exit 1 |
| C3: tokens.css 側欠落 | tokens.css から `--ubm-color-ok-soft` を削除 | `missing-in-tokens-css` 1 件 / exit 1 |
| C4: 09b 側欠落 | 09b fixture から `--ubm-color-info` を削除（temp file で検証） | `missing-in-09b` 1 件 / exit 1 |
| C5: 空白正規化 | `oklch(0.58  0.10  55)`（double space）と `oklch(0.58 0.10 55)` | drift 0（normalize 済み） |
| C6: ネスト無視 | `color-mix(in oklch, var(--accent) 12%, transparent)` を含む宣言 | OKLch literal として扱わない |
| C7: theme bridge 欠落 | globals.css の `@theme inline` から `--color-accent` を削除 | `missing-theme-bridge` 1 件 / exit 1 |

C1〜C7 は `verifyDesignTokens()` をテスト内で直接呼び、fixture は `tmpdir()` 上に置く。実 09b / 実 tokens.css は変更禁止のため、fixture はテスト用に複製する。

---

## 6. テスト方針 — Playwright smoke self-test（S1〜S5）

| ケース | 仕掛け | 期待 |
|--------|--------|------|
| S1: 全 route 200 | 開発サーバ立ち上げ後 `pnpm --filter @ubm-hyogo/web e2e:smoke` | 19 route 全 PASS |
| S2: 1 route だけ 500 を返す | テスト用 route handler で `/admin/audit` を一時的に throw | smoke が 1 件 fail し、CI exit 1 |
| S3: a11y violation 注入 | `/login` の `<input>` から `<label>` を一時削除 | a11y check が `serious` で fail |
| S4: landmark 欠落 | `/profile` の `<main>` を一時削除 | landmark `waitFor` が timeout で fail |
| S5: redirect 期待 | 未認証で `/profile` 訪問 | `expectRedirectTo: /login` が満たされる（`auth: 'member'` フィクスチャ未注入時） |

- S1 は CI / ローカル両方で常時実行
- S2〜S4 は PR レビュー時に「壊して通るか」を 1 回手動検証
- S5 は `SmokeRoute.expectRedirectTo` を持つ route 用の振る舞い確認

a11y ルール:
- 検査タグ: `wcag2a` / `wcag2aa`
- 除外ルール: `color-contrast`（token 検証側で担保するため smoke では除外）
- blocking: `impact ∈ { 'serious', 'critical' }` のみ。`minor` / `moderate` は warning 扱いで fail させない

---

## 7. テスト方針 — Visual diff self-test（V1〜V3）

| ケース | 仕掛け | 期待 |
|--------|--------|------|
| V1: baseline 確立 | 初回実行 `pnpm --filter @ubm-hyogo/web e2e:visual:update` | 4 png が `apps/web/tests/e2e/visual/__screenshots__/<spec>/<name>.png` に生成、commit 対象 |
| V2: 微小差分 | 文言の typo 修正レベル（< 2% pixel） | PASS（`maxDiffPixelRatio: 0.02`） |
| V3: 大規模 layout 変更 | `/admin` のレイアウト改変 | FAIL し `visual-diff` artifact が `apps/web/test-results` から upload される |

`maxDiffPixelRatio: 0.02` の根拠:
- ubuntu-latest 上での font hinting / sub-pixel rendering ゆらぎの実測値より上限を 2% に設定
- これを超える差分は意図的な UI 変更とみなし、`e2e:visual:update` で baseline 更新を強制
- 採取環境: ubuntu-latest / Desktop Chrome / viewport 1280x800 を固定し flaky を抑制

各 visual spec の共通手順:
1. `page.goto(target)`
2. landmark `waitFor({ state: 'visible' })`
3. animation / transition / caret を停止する `addStyleTag`
4. `expect(page).toHaveScreenshot(name, { fullPage: true, maxDiffPixelRatio: 0.02 })`

---

## 8. ローカル実行・検証コマンド

```bash
# 依存準備
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium

# verify-design-tokens self-test
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts

# Smoke self-test
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke

# Visual baseline 確認 / 更新
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:update

# レポート参照
open apps/web/playwright-report/index.html
```

---

## 9. DoD（Phase 4 完了条件）

- [ ] C1〜C7 の 7 ケースが入力 / 期待まで一意に定義されている
- [ ] S1〜S5 の 5 ケースが入力 / 期待まで一意に定義されている
- [ ] V1〜V3 の 3 ケースが入力 / 期待まで一意に定義されている
- [ ] a11y のタグ（`wcag2a` / `wcag2aa`）、除外（`color-contrast`）、blocking impact（`serious` / `critical`）が確定
- [ ] `maxDiffPixelRatio: 0.02` の根拠（OS / viewport / 採取環境）が文書化
- [ ] Visual baseline 4 png のパス規約（`apps/web/tests/e2e/visual/__screenshots__/<spec>/<name>.png`）が確定
- [ ] S2〜S4 の手動検証手順が PR レビュー時に再現可能
- [ ] Phase 5 以降の実装で C1〜C7 / S1〜S5 / V1〜V3 をそのまま実装ターゲットとして利用可能
