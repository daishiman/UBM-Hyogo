# Phase 10: 最終レビュー（Go / No-Go）

`<header data-shell="topbar">` を `AdminTopbar` primitive へ抽出する実装サイクルの Go / No-Go ゲート。

## 1. 受け入れ基準（AC）充足判定マトリクス

index.md / phase-1-requirements.md §5 の AC-1〜AC-7 に対する判定欄。本サイクルでコード実装と focused test まで完了したため各行を `PASS` で固定する。

| AC | 内容 | 判定欄 | 根拠 Phase |
|---|---|---|---|
| AC-1 | `apps/web/src/components/layout/AdminTopbar.tsx` 新規追加。AdminSidebar と対称な props 省略可能 API（`breadcrumb?` / `actions?`） | PASS | Phase 2 §3-4 / Phase 5 |
| AC-2 | `(admin)/layout.tsx` から inline `<header data-shell="topbar">` が消え `<AdminTopbar />` 呼び出しに置換 | PASS | Phase 2 §5 / Phase 5 |
| AC-3 | `(admin)/layout.spec.tsx` が**無修正で pass**（`data-shell="topbar"` / `data-shell="sidebar"` / `data-route="admin"` / `data-theme="cool"` / `data-route-group="admin"` 検証維持） | PASS | Phase 6 / Phase 9 |
| AC-4 | `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` 新規追加。props 省略時 / 注入時の slot 契約・OKLch トークン参照・axe critical 0 を検証 | PASS | Phase 4 / Phase 6 |
| AC-5 | focused Vitest / apps-web suite PASS | PASS | Phase 9 |
| AC-6 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を導入していない（OKLch 正本化） | PASS | Phase 9 / verify-design-tokens |
| AC-7 | 新規 visual 仕様を導入していない | PASS | Phase 3 §1 |

## 2. Go / No-Go 判定基準

**Go 条件（全て満たすこと）:**

- AC-1〜AC-7 が全て `PASS`
- Phase 9 QA チェックリストが全てチェック済み
- Phase 11 local evidence（VISUAL_ON_EXECUTION）が PASS（topbar DOM 契約 + axe critical 0 + regression なし）
- `(admin)/layout.spec.tsx` が無修正で pass（DOM 出現位置の変化なし）

**No-Go 条件（いずれか該当）:**

- `(admin)/layout.spec.tsx` が抽出後に fail する（data-* 契約の DOM 出現位置が変わった）
- `data-route-group="admin"` / `data-theme="cool"` を誤って primitive 側へ移動した（Phase 3 R-1）
- 空 actions placeholder が visible になり axe critical violation が出る（Phase 3 R-2）
- `next build --webpack`（OpenNext Workers bundle）に client bundle 増加など regression
- HEX 直書き / 任意値 class を導入し `verify-design-tokens` gate が fail

## 3. ロールバック手順

抽出は新規 2 ファイル追加 + layout.tsx 1 箇所の置換のみで構成されるため、原状復帰は単一 commit の revert で完結する。

1. `apps/web/app/(admin)/layout.tsx` の置換を revert する（`<AdminTopbar />` 呼び出しと import 1 行を削除し、Phase 2 §5 before の inline `<header data-shell="topbar">` JSX 11 行を復元）。
2. `apps/web/src/components/layout/AdminTopbar.tsx` を削除する。
3. `apps/web/src/components/layout/__tests__/AdminTopbar.spec.tsx` を削除する。
4. 上記 3 点を含む PR commit を `git revert <commit-sha>` で巻き戻し、再 push する。

ロールバック後も admin AppShell 自体は機能継続する（topbar は inline JSX に戻るだけで、DOM 出力・data-* 契約・OKLch トークン参照は完全に同一）。`(admin)/layout.spec.tsx` は revert 後も無修正で pass する。

## 4. MINOR 指摘の未タスク化判断（Phase 3 R-5）

| 指摘 | 内容 | 判定 | 理由 |
|---|---|---|---|
| Phase 3 R-5 | `breadcrumb` に `null` を渡すと既定テキスト「管理」へフォールバックする挙動（`?? "管理"`）が直感に反する可能性 | **起票不要** | 仕様として Phase 2 §4「設計上の決定事項」・Phase 4 spec・Phase 12 doc に文書化済み。本タスクでは layout から `breadcrumb` props を未指定で呼ぶため実害なし。挙動は意図された設計であり bug ではないため新規バックログ化しない |

R-5 以外に MAJOR / MINOR 指摘なし（Phase 3 §5「PASS — MAJOR 指摘なし」）。未タスク検出の最終確定は Phase 12 §6 で行う。
