# Reference — prototype alignment 系 task の visual snapshot baseline 更新ルール

prototype 適用 task（`*-prototype-alignment*` / UI prototype alignment / MVP recovery 配下 19 routes）の Phase 11 / Phase 13 では `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` の baseline 差し替えを**確定タスクとして仕様書に含める**。コードのみ更新して push すると CI `playwright-visual-full` 3 viewport が必ず fail するため、ここでの仕様欠落 = CI 失敗確定 という直結関係になる。

## Phase 7 (Tests) — baseline 更新を必須 deliverable に列挙する

「該当ルートの visual baseline を CI artifact 経由で差し替える」を deliverable として明示する。**baseline は 2 系統あるため両方を列挙する**:

1. `playwright-visual-full / visual-full` 系（3 viewport）
   - path: `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/full-visual-<route>-{desktop,tablet,mobile}-visual-full-chromium-{desktop,tablet,mobile}-linux.png`
   - `<route>` は `full-visual.spec.ts` の `routes` 定義の `slug` と一致
2. `playwright-smoke / visual (chromium, 4 screens)` 系（chromium 単一・`maxDiffPixelRatio: 0.02`）
   - path: `apps/web/playwright/tests/visual/<name>.spec.ts-snapshots/<name>-visual-chromium-linux.png`
   - 取りこぼし注意: `git grep -l "toHaveScreenshot" apps/web/playwright/tests/` で全 visual spec を列挙し、該当ルートを撮る spec を漏れなく洗い出す。**片方だけ更新すると残留 fail する**（実事故あり / [[lessons-learned-visual-snapshot-baseline-refresh-on-prototype-alignment-2026-05]] L-VISBASE-001b）。

### a11y コントラスト連動の注意（Phase 7 で必ず併走させる）
prototype 適用で muted / secondary 系トークンを薄い surface 上の小サイズ文字（< 18pt / < 14pt bold）に当てると `e2e / a11y.spec.ts` の axe `color-contrast` (WCAG 2 AA 4.5:1) で fail しやすい。実例: warm theme `--ubm-color-text-muted #9a8a6e` on `#fffcf6` = 3.28:1 で `.en` / OR divider が fail → `#7d6a4d`（~5.13:1）に darken して解消。
- トークン値を変えたら `docs/00-getting-started-manual/specs/09b-design-tokens.md`（§3.4.x table + JSON SSOT 両方）も同値に同期しないと `verify-design-tokens` gate が `value-mismatch` で fail する。
- ローカル検証: `pnpm verify:tokens`（spec ↔ tokens.css の同期確認）。コントラスト比は `(L_bg+0.05)/(L_fg+0.05)` で事前計算する。

## Phase 11 (Manual Test Evidence) — baseline 更新エビデンスのチェックリスト

Phase 11 manual-test-result の冒頭に以下チェックリストを置く:

- [ ] 該当ルートの baseline 3 ファイルが PR diff に含まれているか（`git diff dev...HEAD --name-only | grep full-visual-<route>-`）
- [ ] baseline は CI artifact `visual-full-<viewport>-diff` の `*-actual.png` から取得したか
- [ ] **`*-retry1/` ディレクトリ由来の actual.png を採用していないか**（flakiness を baseline に焼き付け禁止）
- [ ] ローカル mac の `playwright test --update-snapshots` 出力を採用していないか（OS / フォントレンダリング差で確定的に再 fail する）

## 標準復旧手順（push 後 CI fail 検出時）

[[lessons-learned-visual-snapshot-baseline-refresh-on-prototype-alignment-2026-05]] の L-VISBASE-002 を参照。要約:

```bash
gh pr checks <PR番号> --watch=false | awk -F'\t' '$2=="fail" {print $1, $4}'
TMP=$(mktemp -d) && for v in desktop tablet mobile; do
  (cd "$TMP" && gh run download <RUN_ID> -R daishiman/UBM-Hyogo -n "visual-full-$v-diff" -D "$v")
done
DEST=apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots
# 非retry版の actual.png を baseline に昇格
```

## Phase 13 (PR 本文) — baseline 更新を明示する

PR 本文の Phase 11 evidence セクションに以下を含める:

- visual baseline 更新: `<route>` × {desktop, tablet, mobile} 計 3 ファイル
- 取得元: CI run #<RUN_ID> の `visual-full-<viewport>-diff` artifact（非 retry 版）

## なぜ pre-flight で検出できないか

`scripts/verify-pr-ready.sh` は phase12-compliance / gate-metadata / indexes drift のみを検証し、`playwright-visual-full` 相当の binary 比較は走らせない。これは:

1. linux baseline を mac で生成すると確定的に flaky になるため、visual 比較は CI に集約する設計
2. pre-push に visual 比較を組み込むと開発速度が著しく劣化する

の 2 点から **意図された設計**。よって prototype 適用系 task は「push 後に visual fail が出たら L-VISBASE-002 で復旧」を**通常フロー**として task spec に組み込む。

## 適用範囲

- `docs/30-workflows/*-prototype-alignment*/`
- `docs/30-workflows/ui-prototype-design-system-foundation/` 配下の primitives / page.tsx 差し替えタスク
- CLAUDE.md `UI prototype alignment / MVP recovery` セクションで列挙された 19 routes 全て

## 関連

- [[lessons-learned-visual-snapshot-baseline-refresh-on-prototype-alignment-2026-05]]（aiworkflow-requirements 配下の lesson 正本）
- [[phase-11-non-visual-alternative-evidence]]（visual evidence が不可能な場合のフォールバック規程）
- CI workflow: `.github/workflows/playwright-visual-full.yml`
