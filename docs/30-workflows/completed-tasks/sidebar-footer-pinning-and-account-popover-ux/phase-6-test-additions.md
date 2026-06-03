# Phase 6: テスト追加（fail-path / 回帰 guard）

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 6 / 13 |
| 名称 | テスト追加（エッジ / fail-path / 回帰 guard）|
| 前提 | Phase 4（テスト計画）/ Phase 5（実装 GREEN）完了 |

## 目的

Phase 4 が AC-1〜AC-4 の正経路を保護したのに対し、本 Phase は **エッジケース・fail-path・回帰 guard** を追加する。特に C3（外側クリック listener の登録要否境界）の取りこぼし、C2 の expanded 側の非退行、C1/C4 の既存構造数の固定を機械化する。

## 実行タスク

### vitest 実行（リポジトリルートから）

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/public/__tests__/PublicFooter.spec.tsx \
  apps/web/app/(public)/layout.spec.tsx
```

### C3 追加エッジ（SidebarUserMenu.spec.tsx）

| ID | 操作 | 期待値 | 対応 AC / 不変条件 |
|----|------|--------|-------------------|
| TC-C3-07 | menu を render（`details.open=false` のまま open にしない）→ `fireEvent.pointerDown(document.body)` | エラーなく no-op（`details.open` は false のまま）。listener 未登録のため何も起きない | AC-3 / I-2（open 中のみ listener）|
| TC-C3-08 | menu を render（閉じたまま）→ `fireEvent.keyDown(document, { key: "Escape" })` | no-op（`details.open` は false のまま）| AC-3 |
| TC-C3-09 | open → 閉じる（`details.open=false` + `onToggle` 発火）→ 再度 `fireEvent.pointerDown(document.body)` | no-op（cleanup により listener 解除済み・誤発火しない）| AC-3 / I-2 |
| TC-C3-10 | open → `fireEvent.keyDown(document, { key: "Escape" })` | フォーカスが `summary` に戻る（TC-C3-03 の重複確認をエッジとして固定。focus 呼び出しの spy / `document.activeElement` で確認）| AC-3 |
| TC-C3-11 | open → summary 自身を `fireEvent.pointerDown` | `details.open === true`（誤閉じしない）。TC-C3-05 の回帰 guard を本 Phase で恒久化 | AC-3 / I-8 |

> 実装観点: TC-C3-07/08/09 は「`details.open===false` のとき `useEffect` 早期 return で listener を張らない」設計（phase-5 T3）を保護する。jsdom では `details.open=true` を直接設定し `onToggle` を `fireEvent` で発火させて `details.open` guardを true にする手順（phase-4 jsdom 代替方針）を踏襲。

### C2 回帰 guard（SidebarNavItem.spec.tsx）

| ID | 操作 | 期待値 | 対応 AC |
|----|------|--------|---------|
| TC-C2-07 | `collapsed={false}` で badge 付き item を render | `Chip`（数値）が描画され `justify-center` を**含まない**・`nav-badge-dot` が**存在しない**（expanded 退行なし）| AC-2 |
| TC-C2-08 | `collapsed` で badge 付き item を render | `nav-badge-dot` が 1 個・行 className に `relative` を含む（absolute ドットの位置基準）| AC-2 |
| TC-C2-09 | `collapsed` で badge **無し** item を render | `nav-badge-dot` が存在しない（badge 無し時にドットを出さない）| AC-2 |
| TC-C2-10 | `collapsed` の item で `item.badge.count` が `sr-only` テキストとして保持される（TECH-M-01 a11y）| `nav-badge-dot` 配下 or 行内に件数の `sr-only` 要素が存在 | AC-2 |

### C1 / C4 回帰 guard（SidebarShell.spec.tsx）

| ID | 操作 | 期待値 | 対応 AC |
|----|------|--------|---------|
| TC-C1-07 | viewer 3 / member 4 / admin 14 の nav item 数（既存）を footer 2 段化後に再確認 | nav item 数が不変（3 / 4 / 14）| AC-6 |
| TC-C1-08 | member shell を render | `sidebar-footer` ブロックは `aside` 末尾子であり、`SidebarNav` の scroll 領域より後段に位置（DOM 順）| AC-1 |
| TC-C4-03 | member shell（PublicFooter を children に含めた擬似 render）で `<main>` 配下に footer が来る構造を確認、または `<main>` の flex-col 維持を再確認 | `main` className に `flex flex-col flex-1 min-w-0` を含む（C4 退行なし）| AC-4, AC-6 |

### PublicFooter / layout 回帰 guard（既存 spec・契約維持）

| ID | 対象 spec | 期待値 | 対応 |
|----|-----------|--------|------|
| RG-P5 | `(public)/layout.spec.tsx` | PublicFooter が shell（`<main>` 配下）に存在する P-5 契約が GREEN のまま | I-7 / AC-6 |
| RG-PF | `PublicFooter.spec.tsx` | `[data-component="public-footer"]` / `[data-role="copyright"]` / privacy / terms リンクの既存契約が GREEN のまま | I-7 / AC-6 |

> `margin-top:auto`（C4）は CSS 変更のみで DOM 構造を変えないため、既存 PublicFooter / layout の DOM アサーションは無変更で GREEN を維持する想定。GREEN でなければ実装が DOM へ波及しているサインとして Phase 5 を見直す。

### 補助コマンド

```bash
# C3 fail-path のみ集中実行
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx -t "Escape|外側|listener|閉じ"

# 観測契約属性の存在確認（grep ベースの補助・テストではないが Phase 6 補助）
grep -rn 'data-shell-block="sidebar-footer"\|data-shell-block="nav-badge-dot"' apps/web/src/components/shell
grep -rn 'data-role="public-return"\|data-component="admin-sidebar-public-return"\|data-shell-block="user-menu"' apps/web/src/components/shell
```

## 参照資料

- phase-4-test-plan.md（TC-C1〜C4 正経路 / jsdom 代替方針）
- phase-5-implementation.md（T3 listener 登録要否境界 / badge ドット relative）
- phase-3-design-review.md（TECH-M-01 a11y / I-2 / I-8）
- 既存 spec: `SidebarUserMenu.spec` / `SidebarNavItem.spec` / `SidebarShell.spec` / `PublicFooter.spec` / `(public)/layout.spec`

## 実行手順

1. C3 エッジ（TC-C3-07〜11）を SidebarUserMenu.spec へ追加し GREEN を確認。
2. C2 回帰 guard（TC-C2-07〜10）を SidebarNavItem.spec へ追加。
3. C1/C4 回帰 guard（TC-C1-07/08・TC-C4-03）を SidebarShell.spec へ追加。
4. PublicFooter.spec / (public)/layout.spec（RG-P5 / RG-PF）が無変更で GREEN を確認。
5. targeted vitest 全 GREEN を確認し Phase 7（カバレッジ）へ。

## 統合テスト連携

- RG-P5（footer shell 配下）/ RG-PF（footer 構造）を回帰対象として固定。C4 が CSS のみで完結し DOM へ波及しないことの証跡。
- C3 fail-path は listener leak（閉じても listener 残留）を検知する回帰網。

## 多角的チェック観点（AIが判断）

- **fail-path 充足**: 「閉じている時に外側クリック / Escape しても何も起きない」「閉じた後 listener が残らない」を明示テスト化（リーク防止）。
- **expanded 非退行**: collapsed 専用変更が expanded の Chip / レイアウトを壊さないことを TC-C2-07 で固定。
- **構造数固定**: nav item 3/4/14 を footer 再編後も保証（C1 の最大リスク=item 数ズレ）。

## サブタスク管理

| concern | 追加ケース | 対象 spec |
|---------|-----------|-----------|
| C3 | TC-C3-07〜11 | SidebarUserMenu.spec |
| C2 | TC-C2-07〜10 | SidebarNavItem.spec |
| C1 | TC-C1-07/08 | SidebarShell.spec |
| C4 | TC-C4-03 + RG-P5 / RG-PF | SidebarShell.spec / (public)/layout.spec / PublicFooter.spec |

## 成果物

- `outputs/phase-6/test-additions.md`（本 Phase を正本とする追加テストサマリ）
- C3 fail-path / C2 expanded 非退行 / C1·C4 構造 guard のケース表

## 完了条件

- [ ] C3 fail-path（閉時 no-op / listener 解除 / summary 誤閉じ防止）を追加し GREEN
- [ ] C2 expanded 非退行 + badge 無し時ドット非描画 + a11y sr-only 件数を追加し GREEN
- [ ] C1 nav item 数（3/4/14）+ footer DOM 順を再固定し GREEN
- [ ] C4 main flex-col 維持 + RG-P5 / RG-PF 既存 GREEN を確認
- [ ] targeted vitest 全 GREEN

## タスク100%実行確認【必須】

- [ ] 全実行タスク（C3/C2/C1/C4 追加 + 既存回帰確認）を完了
- [ ] 必須成果物（追加テスト計画）を本ファイルに記載
- [ ] Phase 7 開始条件（追加テスト GREEN）を満たす

## 次Phase

[Phase 7: カバレッジ](phase-7-coverage.md)
