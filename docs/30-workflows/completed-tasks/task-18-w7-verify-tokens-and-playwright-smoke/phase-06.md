# Phase 6: 本実装（GREEN）

## 目的

Phase 5 で RED となっているテストをすべて GREEN にする。verify script 実装、auth fixture 実装、visual baseline 確立まで進める。

## 6.1 実装着手順序

1. **`scripts/verify-design-tokens.ts` 実装**
   - 09b JSON parser: fenced `json` block 抽出 → leaf walk → `{ css, value }` pair 収集
   - tokens.css parser: regex `^\s*(--[\w-]+):\s*(.+);` で抽出（scope は `selector { ... }` ブロックから推定）
   - globals.css `@theme inline` parser: 中括弧マッチで block 切り出し、bridge token 一覧を抽出
   - 値 normalize: `value.replace(/\s+/g, ' ').trim()`
   - diff 出力: 09b 宣言順 / Phase 3 §3.2 のフォーマット
   - exit code: drifts.length === 0 → 0、else 1
2. **`scripts/verify-design-tokens.test.ts` GREEN 化**
   - C5 / C6 / C7 を満たす parser 実装にする
   - `verifyDesignTokens` を inline fixture 4 種でテスト
3. **`apps/web/playwright/fixtures/auth.ts` 実装**
   - `adminLogin` / `memberLogin` を Phase 3 §3.5 シグネチャで実装
   - URL hostname 解決失敗時は `localhost` を fallback
4. **`apps/web/playwright/tests/full-smoke.spec.ts` GREEN 化**
   - `Promise.any` で landmark のいずれか visible を待つ
   - axe-core は `withTags(['wcag2a','wcag2aa']).disableRules(['color-contrast'])`
   - `expectRedirectTo` が指定された route は `page.url()` が regex match することを確認
5. **Visual baseline 採取**
   - mac ローカルの `e2e:visual:update` は暫定確認のみ
   - **本タスクでは CI（ubuntu-latest）で採取した baseline を正本とする**ため、Phase 8 / 9 で workflow artifact を取得し `apps/web/playwright/tests/visual/__screenshots__/` に配置して再実行する
6. **`package.json` / `apps/web/package.json` scripts 追加**（Phase 3 §3.8）
7. **`.github/workflows/verify-design-tokens.yml` 配置**
8. **`.github/workflows/playwright-smoke.yml` 配置**

## 6.2 GREEN 確認コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/verify-design-tokens.test.ts  # C1〜C7 全 PASS
mise exec -- pnpm verify:tokens                                    # ✓ design tokens in sync
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
mise exec -- pnpm --filter @ubm-hyogo/web e2e:smoke                # 17 PASS / skip 0
# visual baseline は CI 採取版を取り込む（§6.1 step 5）
```

## 6.3 注意

- `tokens.css` / `globals.css` の**設計値を変更しない**（不変条件 2-3）。drift が parser バグなら parser を修正し、SSOT 転記漏れなら同一 PR で bridge / CSS 側を同期する。意図的な token 値変更は別 workflow に分離する
- E2E session token は本 Phase ではローカル固定値 `'e2e-{admin|member}-fixture'` で代用（CI では `secrets.*` 注入）
- `playwright-report/` / `test-results/` を `.gitignore` に含める（Phase 7 で確認）

## 完了条件

- [ ] verify-design-tokens.ts / .test.ts が GREEN
- [ ] full-smoke.spec.ts が 17 PASS / skip 0
- [ ] auth fixture が動作
- [ ] visual specs が baseline 採取後に PASS（baseline 採取は §6.1 step 5）
- [ ] 2 workflows 配置済み
- [ ] root / apps/web package.json scripts 追加

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- RED tests を GREEN 化し、scripts / Playwright / workflow 実装を接続する。

| Task | 内容 |
| --- | --- |
| 6-A | RED tests を GREEN 化する |
| 6-B | Playwright projects / scripts / workflows を追加する |
| 6-C | CI artifact 由来の visual baseline を取り込む手順へ接続する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| Phase 3 | `phase-03.md` | 実装シグネチャ |
| Phase 4 | `phase-04.md` | テスト期待値 |
| tokens SSOT | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | token value 正本 |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 6 仕様 | `phase-06.md` | GREEN 実装手順 |

## 統合テスト連携

Phase 6 で GREEN 化したコマンドを Phase 8 で連続実行し、Phase 11 の tracked `.txt` evidence に保存する。
