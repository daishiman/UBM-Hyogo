# Reference — prototype alignment 系 task の visual snapshot baseline 更新ルール

prototype 適用 task（`*-prototype-alignment*` / UI prototype alignment / MVP recovery 配下 19 routes）の Phase 11 / Phase 13 では `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/` の baseline 差し替えを**確定タスクとして仕様書に含める**。コードのみ更新して push すると CI `playwright-visual-full` 3 viewport が必ず fail するため、ここでの仕様欠落 = CI 失敗確定 という直結関係になる。

## Phase 7 (Tests) — baseline 更新を必須 deliverable に列挙する

「該当ルートの visual baseline 3 viewport（desktop / tablet / mobile）を CI artifact 経由で差し替える」を deliverable として明示する。

- baseline path 命名規則: `apps/web/playwright/tests/visual-full/full-visual.spec.ts-snapshots/full-visual-<route>-{desktop,tablet,mobile}-visual-full-chromium-{desktop,tablet,mobile}-linux.png`
- `<route>` は `full-visual.spec.ts` の `routes` 定義の `slug` と一致

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
