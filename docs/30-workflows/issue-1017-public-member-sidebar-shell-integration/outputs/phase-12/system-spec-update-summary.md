---
Phase: 12
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
---

# システム仕様更新サマリ（issue-1017）

## Step 1-A. 完了タスク記録

| 項目 | 値 |
|------|-----|
| タスク | issue-1017 Task C: 公開/会員 layout を SidebarShell へ統合（verify_existing） |
| issue | #1017（CLOSED） |
| 正本コミット | `278001606`（PR #1028, 2026-05-31 dev マージ） |
| 親 workflow | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/` |
| 完了内容 | `(public)` / `(member)` layout の SidebarShell 統合、旧 `PublicHeader*` / `MemberHeader` 撤去、`/`,`/privacy`,`/terms`,`/login` の `(public)` route group 移行（URL 不変） |

## Step 1-B. 実装状況

`implemented_local_evidence_captured / visual_runtime_pending`。実装は commit `278001606`（PR #1028）として dev へ landed 済みであり、
local deterministic evidence は captured。staging visual baseline と本 docs の Phase 13 は user-gated のため
`completed` terminal state は claim しない。

| 検証 | 結果 |
|------|------|
| typecheck | 6 packages green |
| lint | exit 0 |
| apps/web tests | 1385 passed | 1 skipped |
| 旧 header production import grep | 0 件 |

受け入れ条件 4 件（同一 shell / role 別 nav / PublicFooter 維持 / 旧 header import 0）はすべて PASS。

## Step 1-C. 関連タスクのステータス

| 関連タスク | issue | 状態 | 関係 |
|-----------|-------|------|------|
| Task D: admin layout を SidebarShell へ統合 | #1018 | CLOSED | 本タスクのスコープ外（admin layout migration、完了済み） |
| Task F: visual baseline CI 化 | #1019 | CLOSED | 本タスクの staging visual screenshot を取得する後続（完了済み） |
| Task A/B/E: shell primitive | （#1028 同梱） | 完了 | 依存 primitive は本実装コミットに同梱済み |

## Step 2. 新規システム仕様 interface 追加

**新規 interface 追加は N/A。ただし既存仕様書の陳腐化記述を本サイクルで是正（refactoring 反映）。**

新規 interface を追加しない理由:

1. 実装は PR #1028 として既に landed 済みであり、本仕様書は landed 実装の確認（`verify_existing`）に過ぎない。
2. route group 移行（`/`,`/privacy`,`/terms`,`/login` → `(public)`）は **URL 不変**であり、外部公開される navigation contract に変更がない。
3. `SidebarShellServer` は親 workflow（Task A/B/E）で確定済みの primitive であり、本タスクは新規 component / API / D1 schema / Google Form 仕様を追加しない（CLAUDE.md UI prototype alignment 不変条件 #1 既存 API のみ接続）。
4. aiworkflow-requirements の active ledgers / artifact inventory には `task-c-public-member-sidebar-shell-integration`
   として同一実装が既に正本同期済み。本 issue root を追加登録すると二重正本になるため、参照関係の明示に留める。

### Step 2-A. 既存仕様書の陳腐化是正（本サイクルで反映済み）

旧 `PublicHeader` / `MemberHeader` は #1028 で撤去されたが、既存システム仕様書に旧コンポーネント前提の記述が残存していた（矛盾）。新規 interface ではないため Step 2 本体は N/A だが、矛盾解消のため以下を本サイクルで更新した:

| ファイル | 更新内容 |
|----------|----------|
| `docs/00-getting-started-manual/specs/02-auth.md` | 「PublicHeader auth-view contract」「AuthView と MemberHeader admin CTA」セクションの実装正本を `SidebarShell` / `SidebarShellServer` へ更新。`AuthView` 境界・`data-auth-state` 観測契約・PII 非出力は不変、出力箇所が shell root へ継承された旨を明記 |
| `docs/00-getting-started-manual/specs/05-pages.md` | `/profile` の「ページ先頭に MemberHeader」記述を「共通 SidebarShell が chrome を提供、ログアウトは shell user menu に集約」へ更新 |
| `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` | §1 を旧 3 layer 独立 shell（PublicShell/MemberShell/AdminShell）分割案から統一 `SidebarShell` 設計へ**全面書き換え**（実装 `apps/web/src/components/shell/` 準拠: SidebarShellServer 所有権 / buildNavForRole role→nav / 実 route 反映 / data 属性観測契約 / useSidebarState collapse 永続化 / shell トークン）。§4 用語集の旧 prototype route（`/my`→`/profile` 等）と brand-mark（「兵」→「U」）も実装へ更新。§2-3 fixture/API mapping は不変 |

> 当初は supersession バナー留めを提案したが、ユーザー判断により 09h §1 を統一 SidebarShell 設計へ全面書き換え済み（本サイクル内で完了）。prototype 由来の旧 3-shell JSX 例は削除し、prototype 出典は §1.7 の対応表に圧縮した。
