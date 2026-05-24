# Phase 12: ドキュメント

## 1. Implementation Guide (Part 1: 中学生レベル概念説明)

### 1.1 何をしたの？

「メンバー一覧」ページの見た目を、デザインの設計図（プロトタイプ）と同じになるように整える仕様です。
このページは、UBM 兵庫支部会に参加している人の一覧を見るための画面です。

### 1.2 なぜ必要だったの？

これまでのページは、文字や入力欄が「ただ縦に並んでいるだけ」で、デザイナーが作った設計図の見た目とぜんぜん違いました。
たとえば:

- 上のメニュー（ロゴ・ホーム・メンバー・登録・ログイン）が、ボタンっぽくなく、ただの文字リンクが縦に並んでいた
- 「ゆったり / 密 / リスト」の切替が、丸い選択ボタン（ラジオボタン）になっていて、デザインで使っている「タブ形のスイッチ」じゃなかった
- 絞り込みボックスが灰色の四角の中に入っていない

これを同じ実装サイクルで直して、設計図どおりに見える状態へ寄せます。

### 1.3 どうやって直したの？

ページの構造（HTML）はあまり変えず、見た目の指示書（CSS）を新しく書き足します。
色は前から使っていた「色の決まり（design token）」だけを使い、勝手に新しい色は作っていません。

## 2. Implementation Guide (Part 2: 技術者レベル)

### 2.1 アーキテクチャ図

```
apps/web/app/(public)/members/page.tsx (Server Component)
  ├─ apps/web/src/components/public/MemberFilters.client.tsx
  │   └─ FormField + Search + Select (UI primitives)
  ├─ apps/web/src/components/public/DensityToggle.client.tsx (NEW: Segmented baseline)
  │   └─ apps/web/src/components/ui/Segmented.tsx (radiogroup)
  ├─ apps/web/src/components/public/MemberGrid.tsx (density=comfy|dense)
  │   └─ apps/web/src/components/public/MemberCard.tsx (data-density)
  └─ apps/web/src/components/public/MemberTable.tsx (density=list)

Styles: apps/web/src/styles/legacy-public.css (NEW selectors @layer components)
Tokens: apps/web/src/styles/tokens.css (unchanged, OKLch)
```

### 2.2 主要変更点

- `DensityToggle` を `RadioGroup + FormField + <input type=radio>` から `Segmented` primitive 直接利用に置換
- `MemberFilters` の最外を `<form role="search">` に統一し、grid layout を CSS 側で付与
- `legacy-public.css` に 10 種類超の `[data-component]` selector を `@layer components` 末尾追記
- visual-only 変更で、API / D1 / URL contract には触れない

### 2.3 不変条件

- token 経由のみで HEX 直書きなし
- `apps/api` 側の endpoint surface 不変
- D1 直接アクセス禁止

### 2.4 既知の落とし穴

- `Segmented` primitive が `ariaLabel` / `data-component` を root に渡せない実装の場合、phase 5 の Segmented 側拡張を先に行う
- `legacy-public.css` を編集する際は **既存 `@layer components { ... }` ブロックの末尾追記** または **新たに `@layer components { ... }` を追加**して既存ルールを壊さない

## 3. System Spec Update Summary

| 仕様書 | 更新内容 | path |
|---|---|---|
| `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md` | members 画面の data-component / DOM 構造を実装側と同期 | L284-L553 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 本 workflow を active implementation spec として登録 | 同一 wave |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow root / strict outputs / target files / evidence boundary を登録 | 同一 wave |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 台帳へ status / scope / target / user-gate を登録 | 同一 wave |
| `.claude/skills/aiworkflow-requirements/references/workflow-members-page-prototype-alignment-artifact-inventory.md` | 成果物 inventory を新規作成 | 同一 wave |
| `.claude/skills/aiworkflow-requirements/changelog/20260523-members-page-prototype-alignment.md` | 同期履歴を新規作成 | 同一 wave |
| `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-members-page-prototype-alignment-2026-05.md` | Phase 12 strict 7 / prototype alignment 境界の知見を記録 | 同一 wave |

> 実装サイクルで spec に追記が必要な箇所が出た場合のみ更新。仕様書を歪ませない。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
|---|---|---|
| screenshot | `outputs/phase-11/screenshots/EV-1-comfy-desktop.png` | present |
| screenshot | `outputs/phase-11/screenshots/EV-2-dense-desktop.png` | present |
| screenshot | `outputs/phase-11/screenshots/EV-3-list-desktop.png` | present |
| screenshot | `outputs/phase-11/screenshots/EV-4-comfy-mobile.png` | present |
| screenshot | `outputs/phase-11/screenshots/EV-5-empty-desktop.png` | present |
| screenshot | `outputs/phase-11/screenshots/EV-6-header-focus.png` | present |
| manual notes | `outputs/phase-11/runtime-notes.md` | present |

`present` 行は workflow root 相対 path の物理ファイル実在を確認済み。

## 5. Skill Feedback Report

| 観点 | 内容 |
|---|---|
| テンプレ改善 | 特になし |
| ワークフロー改善 | UI alignment 系タスクは Phase 2 で「プロトタイプ DOM ツリー」「現状 DOM ツリー」「差分」の 3 表を必ず置く形が有効。本ワークフロー index.md / phase-2 で既に実践 |
| ドキュメント改善 | 本サイクルでは新規 template rule は不要。既存 `patterns-prototype-driven-css.md` と aiworkflow 台帳に本 workflow を同期し、CSS / component 対応は workflow artifact inventory に閉じ込める |

## 6. Documentation Changelog

| Date | File | Change |
|---|---|---|
| 2026-05-23 | `docs/30-workflows/members-page-prototype-alignment/` | 新規 workflow 一式作成（index + phase 1-13） |
| 2026-05-23 | `outputs/phase-12/` + `.claude/skills/aiworkflow-requirements/` | Phase 12 strict 7 と aiworkflow 正本同期を追加 |
| 2026-05-23 | `outputs/phase-11/` + `apps/web/playwright/tests/members-prototype-alignment.spec.ts` | Phase 11 screenshot 6 件と Playwright report を取得し、evidence status を `present` へ昇格 |

## 7. Unassigned Task Detection

該当なし（CONST_007 に従い本サイクル内完結。先送り 0 件）。

## 8. Task Spec Compliance Check

| 項目 | 状態 |
|---|---|
| canonical 9 headings | `outputs/phase-12/phase12-task-spec-compliance-check.md` に正本見出し 1..9 を網羅 |
| Phase 12 strict 7 | `outputs/phase-12/` に物理配置 |
| output artifacts mirror | `outputs/artifacts.json` に root metadata を mirror |
| visualEvidence | VISUAL（phase-11 で screenshot） |
| taskType | implementation |
| state vocabulary | `implemented_local_evidence_captured` |

## 9. 完了条件

- 本文 9 セクション全埋め
- Phase 12 strict 7 / aiworkflow 同期 / outputs artifacts mirror が存在
- 実装後に Phase 11 evidence の status を `present` に更新
