---
phase: 9
title: リスク管理 — 既存 layout 上書き / OpenNext build / route group migration
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-03-appshell-layouts
status: spec_created
---

# Phase 9 — リスク管理

[実装区分: 実装仕様書]

## 1. リスクサマリ

| ID | 内容 | 影響 | 確率 | 緩和策 |
|----|------|------|------|--------|
| R-01 | 既存 layout 上書きで auth gate が消える | 高 | 低 | Phase 5 スケルトンが `getSession()` + `redirect()` を保持。Admin layout spec で 3 分岐を検証 |
| R-02 | route group 配置の暗黙前提が崩れる（`/profile` が `(member)` group 外、`/privacy` が `(public)` group 外） | 中 | 中 | 本サブワークフローは現状配置を前提に DoD を成立させる。group 再編は serial-05 の責務 |
| R-03 | OpenNext Workers build が webpack boundary 違反で fail | 中 | 低 | Server Component 既定を Phase 4 で固定。`next build --webpack` smoke を Phase 5 後半で実行 |
| R-04 | `member-shell` / `member-main` の独自 CSS class を削除して visual regression | 中 | 中 | parallel-01 で同 class の責務移行を同期。serial-07 で visual diff を確認 |
| R-05 | Admin layout の `getSession()` を `async` で 2 重呼び出しすると D1 不要だが cookie decode の overhead | 低 | 低 | layout 内 1 回限定。page で session を要求する場合は別途 `getSession()` を呼んでも JWT decode のみで I/O なし |
| R-06 | `data-theme="cool"` が wrapper に付くのみで `<html>` の cascade に届かない場合がある | 中 | 中 | parallel-01 で `[data-theme]` selector を `<html>` ではなく **任意の祖先**に hit するセレクタ設計にする責務委譲 |
| R-07 | `<header data-shell="topbar">` を既存 `PublicHeader`（既に `<header>` を出力）と二重 `<header>` ネストする | 低 | 中 | Phase 4 で「外側 `<header data-shell>` + 内側 `<header data-component>`」の二重 landmark を仕様化。axe で `region` violation を確認 |
| R-08 | Admin sidebar 内 `SignOutButton` と新規 topbar の actions slot 重複 | 低 | 中 | 並存案を採用。重複表示は UI/UX 改善 PR で吸収 |

## 2. R-07 の詳細（landmark 二重 nesting）

ARIA 仕様上、`<header>` の入れ子は **outer が `<body>` 直下なら banner / inner が `<section>` 配下なら non-banner** のため violation にはならない。ただし axe-core が `region` 重複を warning として吐く場合は次の対応を取る:

- 外側を `<header>` から `<div>` に変更し、`data-shell="topbar"` のみ維持（landmark は内側 `PublicHeader` 内 `<header>` に委ねる）
- もしくは内側 `PublicHeader` を `<nav>` に書き換えるリファクタは **行わない**（NFR-04 違反）

→ 外側を `<div data-shell="topbar">` にする方が安全。Phase 5 スケルトン §1.3 / §2.3 / §3.3 で `<header>` を採用しているが、Phase 6 spec で axe violation が出た場合は `<div>` への置換を許容する（fix-forward 範囲）。

## 3. R-02 の詳細（route group migration）

| route | 現状 group | 期待 group | 本サブワークフローでの扱い |
|-------|-----------|----------|--------------------------|
| `/privacy` | root 直下（`app/privacy/page.tsx`） | `(public)` 配下が望ましい | 現状維持。serial-05 で再配置検討 |
| `/terms` | root 直下（`app/terms/page.tsx`） | `(public)` 配下が望ましい | 現状維持。serial-05 で再配置検討 |
| `/profile` | root 直下（`app/profile/page.tsx`） | root 直下（**確定**） | 現状維持。serial-05 でも `apps/web/app/profile/**` を編集対象とし、route group 移送は行わない |
| `/login` | root 直下（`app/login/page.tsx`） | root 直下（**確定**） | 未認証 entry point として root に残す。`MemberHeader`（認証済み UI）で wrap すると LSP 違反のため `(member)/` に含めない |

route 移動は git rename と middleware / 内部リンク / テスト更新を伴うため、この workflow では行わない。必要になった場合は別途 migration workflow として扱う。

## 4. R-03 の詳細（OpenNext webpack build）

`apps/web` の production build は CLAUDE.md「`apps/web` env アクセス不変条件」§5 に従い `next build --webpack` を正本とする。Turbopack は dev 限定。layout に追加した data-* 属性は SSR 出力のみのため webpack boundary に影響しないが、念のため build smoke を Phase 5 後半で実行する。

## 5. リスク受容

| ID | 受容するか | 理由 |
|----|-----------|------|
| R-01 | しない | Admin spec で 3 分岐検証必須 |
| R-02 | する | スコープ外。serial-05 で対応 |
| R-03 | しない | build smoke を必須化 |
| R-04 | 部分受容 | parallel-01 と同 PR でなければ visual regression は許容（serial-07 で baseline 更新） |
| R-05 | する | overhead 無視できる |
| R-06 | しない | parallel-01 と連携必須 |
| R-07 | しない | axe で必ず確認 |
| R-08 | する | UX 改善 PR で対応 |

## 6. ロールバック戦略

- layout 編集は単一 PR にまとめ、revert で 3 layout を一括ロールバック可能とする
- spec 追加も同 PR に含めることで、revert で spec も同時に消える
- 既存 primitive を触らないため、revert で primitive 側の依存が壊れない
