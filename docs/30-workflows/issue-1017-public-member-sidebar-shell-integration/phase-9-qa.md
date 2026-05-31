---
Phase: 9
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

`[実装区分: 実装仕様書]`

# Phase 9: QA（issue-1017, verify_existing）

## QA チェック項目

| # | チェック | 基準 | 結果 |
|---|---------|------|------|
| Q1 | typecheck | 全 packages exit 0 | PASS（6 packages green） |
| Q2 | lint | exit 0（design-token / lint-boundaries 含む） | PASS（exit 0） |
| Q3 | focused 回帰 spec | layout×2 + page×2 全 PASS | PASS |
| Q4 | line budget | 変更 layout が肥大化していない（薄い配線層） | PASS（layout は props 配線のみ） |
| Q5 | link | 公開/会員 nav リンク先が有効 route | PASS（routeKey で 7 route へ解決） |
| Q6 | 旧 component 削除確認 | 下記 PASS 基準を満たす | PASS |

## Q6 旧 component 削除確認（PASS 基準）

**PASS 基準**: 旧 component が「git delete されている **OR** stub 化されており、かつ production への live import が 0 件」。

### 証跡

```bash
git grep -n "PublicHeader\|SessionAwarePublicHeader\|PublicHeaderWithPath\|MemberHeader" \
  -- apps/web/app apps/web/src
```

結果（`outputs/phase-11/regression-test.log` L22-24）:

- **production import = 0 件**
- ヒットは `SidebarShell.tsx` 内の **コメント参照 1 件のみ**（live import ではない）

### 削除済みファイル

| ファイル | 状態 |
|---------|------|
| `apps/web/src/components/public/PublicHeader.tsx` | git delete |
| `apps/web/src/components/public/__tests__/PublicHeader.spec.tsx` | git delete |
| `apps/web/src/components/layout/MemberHeader.tsx` | git delete |
| `apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx` | git delete |

→ git delete + live import 0 件の双方を満たし、Q6 は **PASS**。

## 不変条件チェック

| 不変条件 | 確認 |
|---------|------|
| 既存 API のみ（layout は API call せず session は SidebarShellServer に閉じる） | OK |
| D1 直接アクセス禁止 | OK（apps/web は D1 binding に触れない） |
| OKLch トークン正本化（`--shell-*` 経由・HEX 直書きなし） | OK（lint design-token gate PASS） |
| role 判定は SidebarShellServer に閉じる（layout は props のみ） | OK |

## 判定

全 QA 項目 **PASS**。blocker なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 9 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 9 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 9 記録を正本として維持する。
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

- [x] Phase 9 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。
