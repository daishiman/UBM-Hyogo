---
phase: 12
title: Compliance check — 中学生レベル概念説明と canonical heading SSOT
workflow_id: parallel-03-followup-001-admin-topbar-primitive-extraction
status: spec_created
---

# Phase 12 — Compliance check

[実装区分: 実装仕様書]

> 本ファイルは人間向けの phase-12 説明。CI gate `verify-phase12-compliance` が読む canonical 9 heading 版は `outputs/phase-12/phase12-task-spec-compliance-check.md` に別途配置する（同 gate は変更された workflow root に対しそのファイルを必須とするため）。

## 1. このフェーズの目的（中学生にも分かる説明）

このフェーズでは「**ぼくらが書いた仕様書が、チーム共通のルールを守っているか**」を確認する。

今回やることは、admin（管理画面）の一番上にある「帯（topbar）」を、いままで `layout.tsx` というファイルに直接書いていたのを、`AdminTopbar` という独立した部品ファイルに引っ越しさせるだけ。見た目は何も変えない。

なぜ引っ越しが必要か？ となりにある「サイドバー（AdminSidebar）」はすでに独立した部品になっているのに、topbar だけ layout ファイルに直書きされていて不公平（非対称）だから。部品をそろえると、あとで「パンくず」や「ボタン」を足すときに layout ファイルがごちゃごちゃにならない。

ルール（守るべきこと）はこれ:
1. 色は決まったパレット（`var(--ubm-color-*)`）からしか使わない。`#ff0000` のような直書き禁止。
2. テストファイルの名前は `*.spec.tsx`。
3. 部品の枠（`data-shell="topbar"`）のラベルを必ず残す。引っ越し前と同じラベルが画面に出ること。
4. となりの部品（AdminSidebar など）を勝手に書き換えない。
5. 画面の枠（`data-route-group="admin"` など）は layout 側に残す。部品側に移さない。
6. 部品に「`"use client"`」を付けない（サーバー部品のまま）。

これが全部 OK なら Phase 13（PR 作成）に進める。

## 2. Canonical heading SSOT

Phase 12 の canonical heading / verdict vocabulary は `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md` を SSOT とする。CI gate が読む 9 見出し（英語）は `outputs/phase-12/phase12-task-spec-compliance-check.md` で逐語順守する。本ファイル（人間向け）は以下の構成を順守する:

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
| --- | --- | --- | --- |
| C-01 | 各 phase ファイルに YAML frontmatter（`phase` / `title` / `workflow_id` / `status`）がある | ◯ | grep |
| C-02 | `[実装区分: 実装仕様書]` が各 phase 冒頭にある | ◯ | grep |
| C-03 | 13 ファイル（phase-01..13）が存在 | ◯ | `ls` |
| C-04 | Phase 5 に編集対象 path・props シグネチャ・JSX スケルトン・import path が揃う | ◯ | 目視 |
| C-05 | Phase 11 evidence inventory が parser 仕様に整合 | ◯ | gate 版テーブルで担保 |
| C-06 | `outputs/phase-12/phase12-task-spec-compliance-check.md` が canonical 9 heading を順守 | ◯ | `pnpm verify:phase12-compliance` |
| C-07 | Phase 13 に commit message draft と PR draft が記載 | ◯ | 目視 |
| C-08 | NON_VISUAL タスクのため VISUAL 必須証跡 4 点は対象外 | ◯ | Phase 11 §1 |

## 4. 不変条件チェック

| ID | 不変条件 | 本仕様書での順守 |
| --- | --- | --- |
| INV-01 | 既存 API endpoint surface のみ接続 | layout から API 呼び出しなし。`getSession()` のみ（既存） |
| INV-02 | OKLch トークン正本化 | Phase 5 スケルトンは `var(--ubm-color-*)` のみ。HEX なし |
| INV-03 | プロトタイプ正本順位（新規 primitive 禁止） | inline 実装済みのものを抽出するだけ。新規 visual 仕様なし |
| INV-04 | D1 binding 直接アクセス禁止 | AdminTopbar / layout に D1 import なし |
| INV-05 | 既存 layout は「編集」 | Phase 3 S-02 で明示 |
| INV-06 | 既存 primitive の props 変更禁止 | AdminSidebar 等は変更しない（NFR-04） |
| INV-07 | 認証 / role gate は既存経路維持 | `getSession()` / redirect は変更しない |
| INV-08 | Server Component 維持 | `"use client"` を付けない（NFR-01 / AC-10） |

## 5. 命名 / 構造規約チェック

| ID | 規約 | 順守 |
| --- | --- | --- |
| N-01 | テスト suffix `*.spec.tsx` のみ | `__tests__/AdminTopbar.spec.tsx`。`*.test.tsx` 不使用 |
| N-02 | primitive 配置 | `src/components/layout/`（AdminSidebar と同一。issue 本文の `src/components/admin/` は誤り） |
| N-03 | layout / primitive は Server Component 既定 | Phase 2 §2 |
| N-04 | data-* 契約（`data-shell` / `data-component` は primitive、`data-route-group` / `data-theme` は wrapper） | Phase 2 §3 |
| N-05 | Tailwind class は構造 utility + `var(--ubm-color-*)` 配色 | Phase 4 §2 |

## 6. dependency / scope チェック

| 依存元 | 依存先 | 順序 |
| --- | --- | --- |
| 本タスク | parallel-03-appshell-layouts（親） | 親完了済み。本タスクは deferred 項目の後続 |

スコープ外（触らない）:
- 他 layout（public / member）の primitive 抽出
- breadcrumb 実データ統合 / actions 具体ボタン
- design token 改変
- 既存 primitive API

## 7. evidence chain チェック

| Phase | 出力 | 次 Phase での参照 |
| --- | --- | --- |
| Phase 1 要件 | FR/NFR | Phase 4 contract |
| Phase 2 architecture | data-* 配置 / Server 境界 | Phase 4 / 5 |
| Phase 3 task breakdown | S-01..S-05 | Phase 5 / 8 |
| Phase 4 interface contract | props / DOM 契約 | Phase 5 / 6 |
| Phase 5 implementation guide | スケルトン | 実装 / Phase 6 |
| Phase 6 test strategy | spec ケース | Phase 7 G3/G4 |
| Phase 7 quality gates | G1-G7 | Phase 8 / 10 |
| Phase 8 DoD | AC-1..11 | Phase 13 PR |
| Phase 9 risks | R-01..R-08 | Phase 13 risk section |
| Phase 10 local verification | コマンド | 実装中 / PR 前 |
| Phase 11 evidence | EV-01..08 | Phase 13 PR 本文 |
| Phase 12 compliance | C/INV/N table | Phase 13 compliance section |
| Phase 13 commit / PR | 統合 | merge |

## 8. 是正アクション

| 検出 | 是正 |
| --- | --- |
| `bg-[#xxx]` 直書き | `var(--ubm-color-*)` に置換 |
| `*.test.tsx` 検出 | `*.spec.tsx` にリネーム |
| `data-shell="topbar"` 欠落 | primitive root に付与 |
| `data-route-group` を primitive に移動 | wrapper に戻す |
| axe critical | actions の `aria-hidden` 出し分けを確認 |
| primitive API 変更 | revert |
| `"use client"` 混入 | 削除 |
| layout spec の diff | spec を元に戻す（無修正 pass 契約） |

## 9. compliance result

| 結果 | 条件 |
| --- | --- |
| SPEC_READY | C-01..08 / INV-01..08 / N-01..05 がすべて green（spec 作成時点） |
| FAIL | 上記いずれかが red |

spec 作成時点の判定: **SPEC_READY**（実装は 03.実装.md サイクルで実施）。
