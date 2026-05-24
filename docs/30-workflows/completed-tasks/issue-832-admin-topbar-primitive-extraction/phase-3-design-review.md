# Phase 3: 設計レビュー

Phase 4 へ進めるかを判定する review gate。

## 1. 設計妥当性チェック

| 観点 | 判定 | 根拠 |
|---|---|---|
| 責務境界 | ✅ | AdminTopbar = topbar slot 描画 / layout = AppShell wrapper・auth gate・grid。所有権が分離 |
| 既存 primitive API 整合 | ✅ | `AdminSidebar`/`PublicHeader`/`MemberHeader` の「props 省略可 default-rendering」「名前付き export」「Server Component」に対称 |
| data-* 契約維持 | ✅ | `data-shell="topbar"` を primitive root に保持、`data-route-group`/`data-theme` は wrapper に残す（Phase 2 §2 表） |
| OKLch トークン正本化 | ✅ | `var(--ubm-color-*)` をそのまま移植。HEX 直書きなし |
| 新規 visual 不導入 | ✅ | class / token / 文言「管理」を inline JSX から無改変で移植 |
| Server/Client 境界 | ✅ | client API 不使用。layout の async Server Component 境界を保つ |
| 配置規約 | ✅ | `components/layout/`（兄弟 sidebar と同居）、spec は `__tests__/` |

## 2. リスクと対策

| リスク | 影響度 | 対策 |
|---|---|---|
| R-1: `data-route-group` を誤って primitive へ移す | 高（layout.spec 破壊） | Phase 2 §2 で「wrapper 残置」を明示。Phase 5 実装時に diff レビュー |
| R-2: `actions` の `aria-hidden` 扱いを誤り、空 placeholder が visible になり axe 警告 | 中 | `actions === undefined` でのみ `aria-hidden="true"`。Phase 4 で省略時/注入時の両ケースを spec 化 |
| R-3: default param `= {}` 漏れで `<AdminTopbar />` が型エラー | 中 | Phase 2 §4 で `= {}` を明示。Phase 5 §typecheck で検出 |
| R-4: relative import 階層ミス | 低 | `AdminSidebar` と同一階層 `../../src/components/layout/AdminTopbar`。grep で既存 import を参照 |
| R-5: breadcrumb に `null` を渡すと既定「管理」に戻る挙動が直感に反する | 低 | `?? "管理"` の仕様を Phase 4 spec と Phase 12 doc に明記。本タスクでは layout から props 未指定のため実害なし |

## 3. props vs internal state 確認（VSCPKR-03 対応）

- AdminTopbar は **internal state を持たない**（純粋な props → DOM の Server Component）。`breadcrumb` / `actions` は外部 props。
- Phase 4 のテスト操作対象は「外部 props 注入」と「props 省略（default）」の 2 系統。internal state テストは不要。

## 4. 命名衝突検査（FB-04 対応）

- `apps/web/src/components/layout/` 内に `AdminTopbar` という既存シンボルは無い（`AdminSidebar` / `MemberHeader` のみ）。衝突なし。
- 公開 surface と内部エンジンの名前近接（FB-SDK-07-2/SC-13-2）は該当なし（IPC なし・UI primitive のみ）。

## 5. 判定

**PASS — Phase 4 へ進む。** 設計は単一責務・既存 primitive 対称・data-* 契約保全を満たす。MAJOR 指摘なし。MINOR は R-5（null 挙動の文書化）のみで、Phase 4/12 で対応する。
