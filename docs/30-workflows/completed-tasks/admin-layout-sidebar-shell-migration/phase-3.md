# Phase 3: 設計レビュー

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 実装区分: **実装仕様書**
- 前 Phase: 2（設計） / 次 Phase: 4（テスト計画）
- 判定: **PASS（条件付き）** — MINOR 2 件を追跡。MAJOR / NO-GO は下記条件で発火。

## 目的

Phase 2 の設計を PASS / MINOR / MAJOR で判定し、Phase 4 開始条件と Phase 13 blocked 条件、
simpler alternative の検討結果を記録する。

## レビュー観点と判定

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R-1 | AC との整合 | PASS | layout 新形が AC-1/3/4/5/6/7 を満たす設計 |
| R-2 | 実在 API/関数のみ使用 | PASS | x-pathname / getSchemaDiffCount を排除し、`safeServerFetch("/admin/schema/diff")` / `usePathname()` の実在経路へ補正済み |
| R-3 | 削除スコープの網羅 | PASS | grep で consumer 0 を確認した 6 ファイル。orphan（AdminBrandBlock）も含む |
| R-4 | 二段防御の維持 | PASS | layout guard（redirect）+ root proxy.ts を保持 |
| R-5 | schemaDiffCount SSOT | MINOR（TECH-M-01） | Task A 委譲が第一案。A 未対応時の helper 抽出フォールバックを追跡 |
| R-6 | activePath の解決 | MINOR（TECH-M-02） | server で実 pathname を解決しない設計の妥当性を Phase 11 で目視確認 |

## MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 備考 |
| --- | --- | --- | --- | --- |
| TECH-M-01 | schemaDiffCount 算出責務の所在（Task A 内 / 共有 helper） | Phase 5 | Phase 9/10 | A 完了時点で shell に算出が無ければ `apps/web/src/lib/admin/schema-diff-count.ts` を新設しフォールバック |
| TECH-M-02 | `activePath="/admin"` 固定で全 9 admin route の active 表示が client `usePathname()` に委ねられる点 | Phase 5 | Phase 11 | 各 admin route で active item が正しくハイライトされることを Phase 11 で目視（現行 AdminSidebarNavItem と同方式のため低リスク） |

## simpler alternative の検討

| 案 | 内容 | 採否 | 理由 |
| --- | --- | --- | --- |
| A | middleware に `x-pathname` を注入し server で activePath を厳密解決 | 不採用 | 新規 middleware 依存を生む。現行は client `usePathname()` で十分に active state を解決できており over-engineering |
| B | layout に schemaDiffCount 算出を残し props で SidebarShellServer に渡す | 不採用 | Task A の `SidebarShellServer` props は `{ activePath, children, mobileTriggerSlot }` のみ（count は内部算出が契約）。layout に残すと責務分散・二重 fetch リスク |
| C（採用） | guard のみ layout に残し、nav/badge/user chip を shell へ全委譲 | **採用** | 責務最小化。source task の意図（layout = guard + shell 呼び出しのみ）に一致 |

## NO-GO 条件（gate 重複明記 3/3）

以下のいずれかが成立する間は **Phase 5（実装）に進まない**:

1. **Task A 未完成**: `apps/web/src/components/shell/SidebarShell.server.tsx` の `SidebarShellServer` が未実装、
   または props 契約（`activePath` / `children` / `mobileTriggerSlot`）が phase-2 設計と乖離。
2. **Task B 未完成**: admin role の `SidebarUserMenu`（4 action）が未実装。
3. **schemaDiffCount SSOT 未確定**: Task A 内算出も helper 抽出も合意できていない。
4. **Task E 未確定**: `SidebarMobileTrigger`（mobileTriggerSlot に注入する component）が未提供（暫定で空 slot を許容するが Phase 11 で要確認）。

> 本仕様（spec_created）の作成は NO-GO 条件の影響を受けない。NO-GO は**実装着手**のゲートである。

## Phase 4 開始条件

- Phase 1-3 の成果物（AC / 設計 / レビュー判定）が確定済み。
- テスト計画は実装前に作成可能（NO-GO 条件と独立）。

## Phase 13 blocked 条件

- user の明示承認がない限り commit / push / PR は blocked（CONST_002）。
- Task A/B/E 未完成のまま実装 evidence を主張しない。

## 上流文書の複数図整合チェック

- source task / 親 index / Task A・B 仕様の nav item 数（公開3 + 会員1 + 管理9 = 13）が一致することを確認（PASS）。

## 成果物

- 本 Phase: レビュー判定 / MINOR 追跡 / simpler alternative / NO-GO・blocked 条件（本ファイル）。

## 完了条件

- [ ] PASS / MINOR / MAJOR を全観点で判定した
- [ ] MINOR 2 件の解決予定・確認 Phase を記録した
- [ ] simpler alternative 3 案を検討記録した
- [ ] NO-GO 条件と Phase 13 blocked 条件を明記した

## タスク100%実行確認【必須】

- [ ] Gate-A（spec foundation）として Phase 1-3 が自己完結している
- [ ] 実装着手の依存ゲートを 3 箇所（phase-1 / phase-2 / phase-3）で重複明記した

## 次Phase

Phase 4（テスト計画）。
