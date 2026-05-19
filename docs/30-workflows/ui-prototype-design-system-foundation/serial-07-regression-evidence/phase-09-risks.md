---
phase: 9
title: リスクと代替案 — baseline drift / OS 依存 / 既存 spec 衝突 / serial-06 不全 fallback
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 9 — リスクと代替案

[実装区分: 実装仕様書]

> **前提再掲**: 本 SW は `serial-06-form-response-binding` の完了を必須前提とする。serial-06 までに regression がある場合は §3 fallback を適用する。

## 1. 主要リスク

| # | リスク | 影響 | 発生条件 |
|---|------|-----|---------|
| R-01 | snapshot baseline drift（CI runner の font / chromium バージョン更新による） | visual gate が継続的 fail | chromium / runner OS 更新時 |
| R-02 | macOS local と CI ubuntu の rendering 差 | local で pass / CI で fail | font hinting / antialias 差 |
| R-03 | 既存 `apps/web/playwright/tests/visual/public-top.spec.ts` 等との衝突 | snapshot name / 配置衝突 | 既存 spec と新規 spec を同名で作る |
| R-04 | serial-06 までの実装に regression がある | 本 SW gate が真の regression を検出できない / 誤って baseline 更新 | serial-06 の DoD 未達 |
| R-05 | mockApi fixture の endpoint 不足（member-detail の response_fields shape） | spec が flake / fail | serial-06 で `/public/members/:id` 接続が未完成 |
| R-06 | `playwright-smoke.yml` の path trigger が新規 spec をカバーしない | CI で gate が起動しない | workflow path 設定漏れ |
| R-07 | baseline PNG が大量にコミットされ git repo size 増加 | clone / fetch 時間増 | 4 spec × 多 viewport で展開した場合 |

## 2. 代替案（不採用含む）

| 案 | 採否 | 理由 |
|----|-----|------|
| baseline を git LFS で管理 | 不採用 | 既存 visual baseline が plain PNG で運用中。LFS 導入は別 SW |
| viewport を `desktop/tablet/mobile` に展開 | 不採用 | スコープ「最小 4 screens」。`playwright-visual-full.yml` が既存で展開済 |
| visual diff を percy / chromatic 等の外部サービスに移譲 | 不採用 | コスト・依存追加。Playwright 標準で十分 |
| 4 spec を 1 ファイルにまとめる | 不採用 | flake 隔離 / parallel 実行 / artifact 分離の観点で 1 spec 1 ファイル維持 |
| baseline を CI artifact のみで管理 | 不採用 | regression を git diff で検出する設計を維持 |

## 3. serial-06 までに regression がある場合の fallback

### 3.1 検出方法

本 SW 着手前に次を実行し、いずれかが fail すれば serial-06 までを先に修復する:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web build
mise exec -- pnpm verify:tokens
```

### 3.2 fallback フロー

1. fail する SW（serial-00..06 のいずれか）を特定
2. 該当 SW の `outputs/phase-11/` evidence を確認
3. 該当 SW で修正 PR を発行（本 SW のスコープ外）
4. 修正完了後、本 SW を着手

### 3.3 本 SW で**禁止**する fallback

- serial-00..06 のコードを本 SW PR で修正すること（責務違反）
- visual baseline を「regression が混ざった状態」で confirm すること
- gate を skip する条件分岐を CI workflow に追加すること

## 4. リスク軽減策（実装時に適用）

| リスク | 軽減策 |
|-------|------|
| R-01 | chromium バージョンを `package.json` の `@playwright/test` に固定し、bump 時は同一更新サイクルで baseline 更新 |
| R-02 | baseline は CI 生成 `-chromium-linux.png` を正本。macOS 生成 `-darwin.png` はコミットしない（ローカル `.gitignore` 不要・運用ルールで遵守） |
| R-03 | 新規 spec 名は既存と重複しない: `top.spec.ts`（既存 `public-top.spec.ts` と別ファイル）/ `members-list.spec.ts` / `member-detail.spec.ts` / `admin-dashboard.spec.ts`（既存活用） |
| R-04 | §3 fallback を着手前 checklist として実行 |
| R-05 | spec 内で `mockApi` の既定 seed が response_fields を返すことを serial-06 完了時点で確認済とする |
| R-06 | Phase 5 §5.1 で playwright-smoke.yml の path 追加を明示 |
| R-07 | 4 spec × chromium-linux 1 viewport = baseline 4 枚に抑制 |

## 5. 残留リスクの受容

| 残留リスク | 受容理由 |
|----------|---------|
| chromium minor version bump による font diff | bump 頻度は低く、同一更新サイクルで baseline 更新する運用で吸収 |
| ubuntu-latest の OS image 更新 | GitHub Actions の SLA で運用、影響発生時に再 baseline |
