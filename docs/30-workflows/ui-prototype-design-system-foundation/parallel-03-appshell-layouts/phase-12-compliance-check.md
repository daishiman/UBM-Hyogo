---
phase: 12
title: Compliance check — 中学生レベル概念説明と canonical heading SSOT
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 12 — Compliance check

[実装区分: 実装仕様書]

## 1. このフェーズの目的（中学生にも分かる説明）

このフェーズでは「**ぼくらが書いた仕様書と実装が、チーム共通のルールを守っているか**」を確認する。

「ルール」とは、たとえば「色は決まったパレット（OKLch トークン）からしか使えない」「テストファイルの名前は `*.spec.tsx` でないといけない」「画面の枠（AppShell）には決まったラベル（`data-theme` / `data-shell` / `data-route`）を必ずつける」といったもの。

なぜルールを守る必要があるか？ それは、**みんなで同じ画面を作っているのに、それぞれが勝手に色を選んだり、勝手にラベルをつけたりすると、画面の見た目がバラバラになる**から。今回作る AppShell（公開・管理・会員の3種類の枠組み）は、19 個の画面すべての「土台」になるので、ここでルールを破ると 19 個全部が壊れる。

このフェーズでやることは:

1. **AppShell の枠組みに必ず `data-theme` などのラベルがついているか**を確認する
2. **コード内に直接「#ff0000」のような色コードを書いていないか**を確認する（必ず `var(--ubm-color-*)` を使う）
3. **テストファイルが `*.spec.tsx` になっているか**を確認する
4. **既存の `PublicHeader` などの部品を勝手に書き換えていないか**を確認する
5. **D1 データベースに layout から直接アクセスしていないか**を確認する

これらが全部 OK なら、次の Phase 13（PR 作成）に進める。1 つでもダメなら戻って直す。

## 2. Canonical heading SSOT

Phase 12 の canonical 9 headings は `.claude/skills/task-specification-creator/references/phase12-canonical-headings.md` を SSOT とする。本ファイルは以下の見出しを順守する:

1. このフェーズの目的（中学生にも分かる説明）
2. Canonical heading SSOT
3. Compliance チェックリスト
4. 不変条件チェック
5. 命名 / 構造規約チェック
6. dependency / scope チェック
7. evidence chain チェック
8. 是正アクション
9. compliance result

## 3. Compliance チェックリスト

| ID | 項目 | 期待 | 検証 |
|----|------|------|------|
| C-01 | YAML frontmatter に `phase` / `title` / `workflow_id` / `sub_workflow` / `status` がある | ◯ | grep |
| C-02 | `[実装区分: 実装仕様書]` が冒頭にある | ◯ | grep |
| C-03 | 13 ファイルが存在（phase-01..13） | ◯ | `ls` |
| C-04 | Phase 5 に絶対パス・関数シグネチャ・JSX スケルトン・既存 import パスが揃う | ◯ | 目視 |
| C-05 | Phase 11 evidence inventory が parser 仕様に整合 | ◯ | parser dry-run |
| C-06 | Phase 12 が canonical 9 headings を順守 | ◯ | `pnpm verify:phase12-compliance` |
| C-07 | Phase 13 に commit message draft と PR draft が記載 | ◯ | 目視 |

## 4. 不変条件チェック

| ID | 不変条件 | 本仕様書での順守 |
|----|---------|-----------------|
| INV-01 | 既存 API endpoint surface のみ接続 | layout から API 呼び出しなし。session 取得のみ |
| INV-02 | OKLch トークン正本化 | Phase 5 スケルトンは `var(--ubm-color-*)` のみ使用 |
| INV-03 | プロトタイプ正本順位 | 09e/f/g blueprint + 09h shell-and-fixtures を参照 |
| INV-04 | D1 binding 直接アクセス禁止 | layout 内に D1 import なし |
| INV-05 | 既存 layout は「編集」 | Phase 1 / Phase 5 で明示 |
| INV-06 | 既存 primitive の props 変更禁止 | NFR-04 / Phase 4 で固定 |
| INV-07 | 認証 / role gate は既存経路維持 | Phase 2 §4 で責務分離 |

## 5. 命名 / 構造規約チェック

| ID | 規約 | 順守 |
|----|------|------|
| N-01 | テスト suffix `*.spec.{ts,tsx}` のみ | Phase 6 で明示。`*.test.tsx` は使わない |
| N-02 | Client Component は `*.client.tsx` suffix | 本サブワークフローでは新規 client component なし |
| N-03 | layout は Server Component 既定 | Phase 2 §5 / Phase 4 §1 |
| N-04 | data-* 契約: `data-theme` / `data-route-group` / `data-shell` / `data-route` / `data-testid` | Phase 4 §4 で表化 |
| N-05 | Tailwind class は構造 utility のみ。配色は `var(--ubm-color-*)` 経由 | Phase 4 §6 |

## 6. dependency / scope チェック

| 依存元 | 依存先 | 順序 |
|--------|--------|------|
| parallel-03 | parallel-01 (globals.css rhythm) | parallel-03 編集時に未完でも build は通る。selector が hit しないだけ |
| parallel-03 | parallel-02 (prototype CSS rules port) | 同上 |
| parallel-03 | parallel-04 (root layout / error / not-found / loading) | 独立。並列実行可 |
| serial-05 | parallel-03 | parallel-03 完了後 |

スコープ外（本サブワークフローで触らない）:

- root `app/layout.tsx`
- `app/error.tsx` / `app/not-found.tsx` / `app/loading.tsx`
- 19 routes の page.tsx
- 既存 primitive の API
- 認証実装の新規追加

## 7. evidence chain チェック

| Phase | 出力 | 次 Phase での参照 |
|-------|------|------------------|
| Phase 1 要件 | FR/NFR table | Phase 4 contract |
| Phase 2 architecture | data-* 契約 / Server-Client 境界 | Phase 4 / 5 |
| Phase 3 task breakdown | S-01..S-03 step | Phase 5 / 8 |
| Phase 4 interface contract | layout signature / primitive signature | Phase 5 |
| Phase 5 implementation guide | スケルトン | 実装直後 / Phase 6 spec |
| Phase 6 test strategy | spec 検証項目 | Phase 7 G4 / Phase 11 |
| Phase 7 quality gates | G1-G7 | Phase 10 / 11 |
| Phase 8 DoD | 完了基準 | Phase 13 PR draft |
| Phase 9 risks | R-01..R-08 | Phase 13 PR risk section |
| Phase 10 local verification | コマンド集 | 実装中 / PR 前 |
| Phase 11 evidence | EV-01..16 | Phase 13 PR 本文 |
| Phase 12 compliance | C/INV/N/D/EV table | Phase 13 PR compliance section |
| Phase 13 commit / PR | 全 Phase 統合 | merge |

## 8. 是正アクション

| 検出パターン | 是正 |
|-------------|------|
| `bg-[#xxx]` 直書き検出 | `var(--ubm-color-*)` に置換 |
| `*.test.tsx` 検出 | `*.spec.tsx` にリネーム |
| `data-theme` 欠落 | wrapper に追加 |
| axe critical violation | layout 側で `aria-label` 補強 |
| primitive API 変更 | revert |
| D1 import in layout | 削除し API 経由に変更 |

## 9. compliance result

| 結果 | 条件 |
|------|------|
| PASS | C-01..07 / INV-01..07 / N-01..05 / EV-01..09+10 すべて green |
| CONDITIONAL PASS | EV-11..16 が serial-07 で取得予定の場合 |
| FAIL | 上記いずれかが red |

PASS / CONDITIONAL PASS 時のみ Phase 13 に進む。
