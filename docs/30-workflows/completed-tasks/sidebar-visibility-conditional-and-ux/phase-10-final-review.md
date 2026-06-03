# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 1 要件定義（AC-1〜9 / T1〜T3）/ Phase 2 設計 / Phase 3 設計レビュー（MINOR-1〜3）|
| workflow_state | `implemented_local_evidence_captured`（実装・direct focused tests・typecheck・lint・local screenshot 4 PNG 完了。admin/staging screenshot・commit・PR は user-gated） |
| visual_category | VISUAL（サイドバー表示/非表示・viewer identity・active 表示が視覚的成果物） |
| 判定 | AC を local deterministic evidence で確認し、Phase 11/12 へ trace する |

## 目的

Phase 1-3 の要件・設計・設計レビューが AC-1〜9 を矛盾なく満たし、実コード・direct focused tests・typecheck・lint で
local deterministic evidence を取得済みかを判定し、Phase 11（手動テスト）/ Phase 12（ドキュメント同期）へのゲートを通す。
pixel screenshot / staging visual baseline / commit / push / PR は user-gated として分離する。

## Acceptance Criteria 充足判定

> 本サイクルは `implemented_local_evidence_captured`。各 AC は source-level tests / grep gate / typecheck / lint で判定し、
> local screenshot 4 PNG は取得済み。staging/admin screenshot は staging 認証下で user-gated 取得する。

| AC | 条件要旨 | 設計上の所在 | 本サイクル判定 | 検証手段 |
|----|----------|--------------|------------------------|------------------------|
| AC-1 | `/login` の DOM に `data-testid="public-shell"` / `aside` が無い | Phase 2 §1.3（`(auth)/layout.tsx` は shell 非 import）| **PASS** | login page render test（jsdom） |
| AC-2 | `/login` が `app/(auth)/login/page.tsx` に存在し `(auth)/layout.tsx` が `SidebarShellServer` を import しない | Phase 2 §1.1 トポロジ / §1.3 | **PASS** | ファイル存在 + invariant test |
| AC-3 | `/login` の URL は `/login` のまま（route group はパスに出ない）| Phase 2 §1.2（URL 維持判断）| **PASS** | 既存 login query / redirect tests |
| AC-4 | middleware が全 request に `x-pathname` request header を設定する | Phase 2 §2.2（`nextWithRequestHeaders` 経路への注入）| **PASS** | middleware spec |
| AC-5 | `(admin)/layout.tsx` が `activePath` を `x-pathname` から解決（`/admin` ハードコード撤廃）| Phase 2 §2.2 修正設計 | **PASS** | admin layout test / grep |
| AC-6 | viewer 時、`SidebarUserMenu` が「ゲスト」表記 + ログイン CTA を描画し member/admin と視覚区別 | Phase 2 §3.1 viewer identity | **PASS** | `SidebarUserMenu.spec.tsx`（role="viewer"） |
| AC-7 | member/admin 時、active nav item が `aria-current="page"` と視認可能スタイルを持つ | Phase 2 §3.2 active/badge 視認性 | **PASS** | `SidebarNavItem.spec.tsx` |
| AC-8 | 表示条件マトリクス（route × role × shell）が 09h §1.6 に反映され login=shell外 invariant test が存在 | Phase 2 §1.4 マトリクス + Phase 12 system-spec-update-summary | **PASS** | static invariant spec + 09h diff |
| AC-9 | `pnpm typecheck` / `pnpm lint` / 対象 vitest が green、HEX 直書き 0 | Phase 1 NFR-2 / targeted test リスト | **PASS** | focused test / typecheck / lint / grep |

> 判定: AC-1〜9 は local deterministic evidence で PASS。local screenshot 4 PNG は取得済みで、staging/admin screenshot は staging 認証下で user-gated 取得する（Phase 11 参照）。

## MINOR 指摘と未タスク判定

Phase 3 で検出した MINOR-1〜3 は、いずれも本タスクの AC-1〜9 を満たすために必須ではない改善余地であり、
**コード実装の blocker ではない**。unassigned-task-guidelines に従い、Phase 12 `unassigned-task-detection.md` で
current（本サイクル由来）/ baseline（既存違反）を分離して再評価する。

| ID | Phase 3 指摘 | 本サイクルでの扱い | 未タスク化要否（→ Phase 12 で確定）|
|----|--------------|--------------------|------------------------------------|
| MINOR-1 | route group 移動後の相対 import 破壊リスク | Phase 2 §1.2 で「同一階層深度ゆえ import 不変の見込み・移動後 grep 機械確認を実装サイクル Step に必須化」と設計に織り込み済み | **未タスク化しない**（実装サイクル内の手順で完結。先送りではない） |
| MINOR-2 | `x-pathname` を全 request に付ける static 化抑止懸念 | Phase 2 §2.2 で「該当 route は既に dynamic（session 依存 layout）・redirect レスポンスには付与しない」と設計済み | **未タスク化しない**（実害なし。設計で境界を確定済み） |
| MINOR-3 | viewer CTA の collapsed 表示 a11y | Phase 2 §3.1 で「collapsed 時は icon + sr-only ラベル」と設計に反映済み | **未タスク化しない**（設計で a11y を担保済み） |

> MINOR-1〜3 は全て Phase 2 設計 / 実装サイクル手順に織り込み済みであり、本タスク内で完結する（CONST_007: 先送りではない）。
> Phase 12 `unassigned-task-detection.md` で current=0 件を再確認し、既存 sidebar 系タスク（Task A/B/C/E・issue-1024）との重複が無いことを差分確認する。

## blocker 判定

| 項目 | blocker か | 根拠 |
|------|------------|------|
| 依存 Task A/B/C/E（`apps/web/src/components/shell/`）| **blocker ではない** | dev マージ済み。本件はその上の差分修正（route topology + middleware + shell 分岐強化） |
| route 物理移動（`(public)/login` → `(auth)/login`）の相対 import リスク | **blocker ではない** | 同一階層深度（`app/<group>/login/`）で import 不変の見込み。実装サイクルで grep 機械確認（MINOR-1） |
| `x-pathname` middleware 注入 | **blocker ではない** | 既存 `nextWithRequestHeaders` 経路への header 追加 1 行。auth guard ロジック・redirect は不変（不変条件 #11 を壊さない） |
| viewer / active / badge UX | **blocker ではない** | 既存 primitive（`SidebarUserMenu` / `SidebarUserAvatar` / `SidebarNavItem`）の分岐強化のみ。新規 primitive ゼロ（NFR-3） |

**最終判定: BLOCKER なし。** Phase 11（手動テスト）/ Phase 12（ドキュメント同期）へ進む。
実コード GREEN は完了済み。pixel screenshot・commit/push/PR は user-gated に残す。

## 参照資料

- Phase 1（要件定義）/ Phase 2（設計）/ Phase 3（設計レビュー MINOR-1〜3）
- 正本仕様: `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.2 / §1.6
- 不変条件: `CLAUDE.md`（#5 D1 直アクセス禁止 / #11 fail-closed 二段防御 / UI alignment #1〜3）
- 未タスク判定: Phase 12 `outputs/phase-12/unassigned-task-detection.md`

## 完了条件

- [x] unassigned-task ルール確認の旨を本ファイルに明記した
- [x] AC-1〜9 を local deterministic evidence で判定し、検証手段へ trace した
- [x] Phase 3 の MINOR-1〜3 の未タスク化要否を判定した（いずれも未タスク化しない）
- [x] blocker 判定を実施した（BLOCKER なし）
- [x] implemented_local_evidence_captured 境界（pixel screenshot / commit / PR は user-gated）を明記した
