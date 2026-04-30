# Phase 4 成果物: テスト戦略

> 採用案 A（local web + local api）上で、scenario × viewport を verify suite として整理し AC-1〜8 を 1:1 でカバーする戦略。Phase 2 scenario-matrix と Phase 3 ADR を前提とする。

## 1. テスト戦略概要

| 項目 | 方針 |
| --- | --- |
| 実行環境 | `playwright test` を `apps/web` の workers dev server + `apps/api` の wrangler dev に対して起動 |
| ブラウザ | Chromium + WebKit を CI 常時実行（Firefox はオフライン手動） |
| viewport | desktop = 1280x800, mobile = 390x844（iPhone 12 相当） |
| spec ファイル | `public / login / profile / admin / search / density / attendance` の 7 種 |
| fixture | `auth.ts` で anonymous / member / admin の 3 ロール cookie を注入 |
| screenshot | `helpers/screenshot.ts` の `snap(page, name)` を経由して `outputs/phase-11/evidence/{viewport}/{name}.png` へ保存 |
| 実行時間目標 | full suite 10 分以内（CI 無料枠）。failure 系含む |
| retry | CI 上のみ 1 回 retry。ローカルは 0 |
| 並列度 | workers=4（chromium 2 + webkit 2） |

### 1 scenario あたり最低 assertion

- 正常系: 1 path 観測 + 1 invariant assertion + 1 screenshot snap = **3 assertion 以上**
- a11y suite: 各 5 path で `violations.length === 0` を 1 件 assert

## 2. a11y 戦略（@axe-core/playwright × WCAG 2.1 AA）

| 項目 | 詳細 |
| --- | --- |
| ライブラリ | `@axe-core/playwright` v4 系 |
| 起動 helper | `helpers/axe.ts` の `runAxe(page, opts?)` が `injectAxe → checkA11y` を wrap |
| 適用 rule set | `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` の 4 tag |
| 除外 rule | `color-contrast` は `/admin/**` のみ pending（feature-flag 化、Phase 6 F-13 で記録） |
| 違反集約 | `violations` を `{ url, viewport, violations: AxeResult[] }` 形に正規化し `outputs/phase-11/evidence/axe-report.json` へ append |
| 適用 spec | `public / login / profile / admin` の 4 spec（AC-8 対応） |
| 適用 path | `/`, `/members`, `/members/[id]`, `/register`, `/login`, `/profile`, `/admin`, `/admin/members` の 8 path × 2 viewport |
| 失敗時表示 | violation を `console.table` 出力 + screenshot を `axe-violation-{path}.png` で保存 |
| 不合格基準 | `violations.length > 0` で test fail（warning と区別なし） |

## 3. scenario × viewport 設計

```
公開導線        4 シナリオ × 2 viewport = 8 セル
login           5 状態   × 2 viewport = 10 セル + /no-access 不在 1 セル
profile         2 シナリオ × 2 viewport = 4 セル
admin           5 画面   × 2 viewport = 10 セル + 認可境界 3 × 5 = 15 セル
search          6 パラメータ × 代表 5 ケース = 5 セル
density         3 値 × 2 viewport = 6 セル
attendance      2 シナリオ × desktop = 2 セル
─────────────────────────────────────
verify suite 全行: 60 行（詳細は verify-matrix.md）
```

### viewport ポリシー

| viewport | 適用範囲 | 除外理由 |
| --- | --- | --- |
| desktop (1280x800) | 全 spec / 全 scenario | — |
| mobile (390x844) | public / login / profile / admin / search / density | attendance / 認可境界は desktop のみ（admin 操作は PC 前提、mobile overflow は F-9 で別途検証） |

## 4. screenshot 命名規約

```
outputs/phase-11/evidence/
├── {viewport}/
│   ├── {scenario-name}.png
│   └── {scenario-name}-{state}.png    # state がある場合
└── axe-report.json
```

- `viewport` ∈ `desktop | mobile`
- `scenario-name` は kebab-case（例: `members-list`, `login-rules-declined`, `attendance-dup-toast`）
- snap は必ず `await page.waitForLoadState('networkidle')` 後に取得
- 合計目標: **34 枚以上**（desktop 19 + mobile 15）→ AC-7 充足

## 5. spec × AC 対応サマリ

| spec ファイル | カバー AC | 不変条件 |
| --- | --- | --- |
| public.spec.ts | AC-1, AC-2, AC-7, AC-8 | — |
| login.spec.ts | AC-1, AC-3, AC-7, AC-8 | #9 |
| profile.spec.ts | AC-1, AC-4, AC-7, AC-8 | #4, #8 |
| admin.spec.ts | AC-1, AC-5, AC-7, AC-8 | #5 |
| search.spec.ts | AC-1, AC-6 | — |
| density.spec.ts | AC-1, AC-6, AC-7 | — |
| attendance.spec.ts | AC-7 | #15 |

## 6. Phase 連携

| 連携先 | 引き継ぎ |
| --- | --- |
| Phase 5 | 7 spec signature を実装ランブックに展開 |
| Phase 6 | 異常系 14 件を verify suite へ組み込み |
| Phase 7 | AC matrix の verify column |
| Phase 11 | evidence 配置（screenshot 34+ / axe-report.json） |

## 完了条件

- [x] テスト戦略概要記述
- [x] a11y 戦略（axe + WCAG 2.1 AA）確定
- [x] scenario × viewport 設計
- [x] screenshot 命名規約
- [x] verify-matrix.md は別ファイルで提出
