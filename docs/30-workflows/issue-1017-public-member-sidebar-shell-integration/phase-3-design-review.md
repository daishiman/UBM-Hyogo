`[実装区分: 実装仕様書]`

# Phase 3: 設計レビュー（issue-1017 / verify_existing）

Phase 2 の設計（landed 実装 commit `278001606` を正本化）が Phase 4 へ進める品質を満たすかを判定する。

## 判定: **GO**（Phase 4 へ進む）

verify_existing のため、レビューは「landed 実装が設計どおりの責務境界・状態所有権を満たしているか」の確認に重点を置く。

## チェック項目

| 観点 | 内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| 責務境界 | layout は `activePath` / slot のみ受け渡し、role 判定を複製しない | **PASS** | `(public)/layout.tsx` / `(member)/layout.tsx` は `headers()` と `SidebarShellServer` の配線のみ。role 解決は wrapper 内 |
| 依存関係 | layout → `SidebarShellServer` → `SidebarShell`（client）の一方向。逆依存なし | **PASS** | server wrapper が client primitive へ plain object を渡す single direction |
| 状態所有権 | collapse=client（`useSidebarState`）/ session=server（`getSession`）に分離 | **PASS** | client state と server data が混線していない |
| role 隔離 | `getSession` / `resolveRole` / `buildNavForRole` が `SidebarShellServer` に閉じる | **PASS** | layout から session が漏れない。fail-open（viewer fallback）も wrapper 内 |
| route 移行 | `/`,`/privacy`,`/terms`,`/login` を `(public)` group へ移しても URL 不変 | **PASS** | route group `(...)` は URL に寄与しない |
| 旧 header 撤去 | `PublicHeader` / `MemberHeader` の production import が増えない設計 | **PASS** | shell へ責務移管し本体 + spec を削除 |

## 4 条件レビュー（価値性・実現性・整合性・運用性）

| 条件 | 評価 | 判定 |
| --- | --- | --- |
| 価値性 | 単一 shell 化で page 遷移時のチラつき排除 + role 別 nav 集約。UX とコード重複の双方を改善 | **PASS** |
| 実現性 | 依存 primitive（A/B/E）が #1028 同梱で揃っており、layout は薄い配線。実現済み（landed） | **PASS** |
| 整合性 | 既存 API のみ・D1 直接アクセスなし・OKLch トークン経由・CONST_007 単一サイクル準拠 | **PASS** |
| 運用性 | role 判定が 1 箇所（`SidebarShellServer`）に集約され、nav 追加は `shell-config.ts` のみで完結 | **PASS** |

## リスクと緩和

| リスク | 緩和策 |
| --- | --- |
| `x-pathname` 未注入時に active item が server で誤判定 | route group 代表 path を fallback にし、client `usePathname` で最終確定 |
| route group 移動で相対 import / colocated test が破損 | Phase 4 で focused spec を実行し import 健全性を確認（landed 検証で 1385 passed） |
| 意図的 UI 変更による visual baseline drift | Task F（#1019）で baseline 更新を user-gated 実施（本サイクル外） |

## 次 Phase への引き継ぎ

- Phase 4 で targeted 4 spec + typecheck + lint + grep を回帰スイートとして定義する。
- role → nav group の期待マトリクスを Phase 4 で固定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 3 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 3 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 3 記録を正本として維持する。
- #1028 の landed 実装と本 Phase の境界を確認する。

## 参照資料

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- `docs/30-workflows/task-c-public-member-sidebar-shell-integration/`
- commit `278001606` / PR #1028

## 成果物

- 本ファイル
- `artifacts.json` / `outputs/artifacts.json` parity
- Phase 11/12 outputs

## 完了条件

- [x] Phase 3 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
