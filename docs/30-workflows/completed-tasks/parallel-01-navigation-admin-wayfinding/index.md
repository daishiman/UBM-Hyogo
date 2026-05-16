# parallel-01-navigation-admin-wayfinding - タスク仕様書 index

[実装区分: 実装仕様書]

> **実装区分判定根拠**: `apps/web` の admin layout (`AdminSidebar.tsx`) と admin members feature (`MemberDrawer.tsx`) に対し、Next.js `<Link>` を用いた動線追加（logo→`/`、drawer→`/admin/tags?memberId=...`）を実コードとして実装する。設計単独では完結せず、Vitest component test と Playwright admin smoke test の更新も伴う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | PARALLEL-01-NAV |
| タスク名 | admin ナビゲーション動線改善（sidebar logo→/ 戻り、members drawer→tags link） |
| ディレクトリ | docs/30-workflows/parallel-01-navigation-admin-wayfinding |
| 親 workflow | docs/30-workflows/ui-prototype-alignment-mvp-recovery |
| 原典仕様 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 状態 | implemented_local_runtime_pending |
| タスク種別 | implementation / VISUAL |
| 優先度 | MEDIUM |
| GitHub Issue | 未起票（commit / push / PR user-gated） |

## 目的

admin 画面における動線欠落を解決し、運用者が効率的にナビゲーションできる体験を整備する。
具体的には以下 2 つの改善を 1 サイクル内で投入する。

- **G1-1**: admin sidebar の logo をクリックして公開ホーム (`/`) に戻れる動線を追加する。
- **G1-2**: `/admin/members` 詳細 drawer 内に、当該会員の tag 管理画面 (`/admin/tags?memberId={id}`) への直接リンクを追加する。

backend（`/admin/tags` page の `focusMemberId` searchParam）は既に実装済みであり、本タスクは UI 動線追加のみで完結する。
新規 API endpoint・D1 schema 変更・Google Form schema 変更は一切行わない。

## スコープ

### 含む

- `apps/web/src/components/layout/AdminSidebar.tsx`（または同等パス）への logo Link 追加（`href="/"`, `aria-label="ホームに戻る"`）
- `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` への tag 管理 Link 追加（`/admin/tags?memberId=${encodeURIComponent(memberId)}`）
- Vitest + React Testing Library による component test 追加・更新（既存 `AdminSidebar.component.spec.tsx` / 新規 `MemberDrawer.spec.tsx`）
- 既存 admin smoke test（Playwright）の admin 9 routes 回帰確認・必要に応じた assertion 追加
- OKLch design token (`tokens.css` の `--ubm-color-accent` / `--ubm-color-border-default`) 経由の styling
- accessibility（`aria-label` / `focus-visible` / keyboard 操作）対応

### 含まない

- 新規 API endpoint 追加
- `apps/api` 配下の改変
- D1 schema 変更
- Google Form schema 変更
- `/admin/tags` page の `focusMemberId` searchParam handling 改修（既実装）
- design-tokens.md / tokens.css の新規 token 追加
- 新規 primitive コンポーネント生成（既存 primitives で構成）
- 管理画面以外（公開・会員）の動線変更

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-01-navigation/spec.md | 原典 spec（本タスクの正本） |
| 必須 | docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md | 親 workflow scope / 19 routes |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-1/phase-1.md | 親 workflow Phase 1 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-2/phase-2.md | 親 workflow Phase 2 |
| 必須 | docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md | 親 workflow Phase 3 |
| 必須 | apps/web/src/components/layout/AdminSidebar.tsx | 編集対象（存在確認は Phase 1） |
| 必須 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | 編集対象（存在確認は Phase 1） |
| 必須 | apps/web/app/(admin)/admin/tags/page.tsx | `focusMemberId` searchParam 受け側（既実装・改修不要） |
| 必須 | apps/web/src/styles/tokens.css | OKLch token 正本（HEX 直書き禁止） |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | design tokens 正本 |
| 必須 | docs/00-getting-started-manual/claude-design-prototype/ | プロトタイプ正本（primitive / tokens / rhythm） |
| 必須 | CLAUDE.md | 不変条件 / test suffix ルール / branch 戦略 |

## 受入条件 (AC)

- **AC-1**: `AdminSidebar.tsx` 内に `<Link href="/" aria-label="ホームに戻る">` が sidebar 上部に配置されており、視覚的に既存 nav item と区別される styling（OKLch token 経由）が `outputs/phase-02/admin-sidebar-logo-design.md` に決定されている。
- **AC-2**: `MemberDrawer.tsx` 内に `<Link href={`/admin/tags?memberId=${encodeURIComponent(memberId)}`}>` が drawer content 最下部（または `border-t` 区切り直下）に配置される設計が `outputs/phase-02/member-drawer-tag-link-design.md` に決定されている。
- **AC-3**: `memberId` の URL encoding（`encodeURIComponent`）が徹底され、特殊文字（`@`, `/`, スペース）入りでも安全に遷移できることを test で verify する方針が `outputs/phase-02/test-strategy.md` に記載されている。
- **AC-4**: OKLch design token（`--ubm-color-accent`, `--ubm-color-border-default`）のみで色を表現し、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を一切含まないことが `outputs/phase-02/` 全文書で一貫している。
- **AC-5**: a11y 要件（`aria-label="ホームに戻る"`, `focus-visible` outline, keyboard `Tab → Enter` 操作）が Phase 02 で明文化されている。
- **AC-6**: 設計レビュー結果（GO / NO-GO 判定）が `outputs/phase-03/design-review.md` に記録されている（AC-1〜AC-5 を 7 軸で評価）。
- **AC-7**: Phase 04 task-breakdown.md に G1-1 / G1-2 / component test / smoke test 更新が SRP 分解で T1〜T5 程度に整理され、クリティカルパスが `outputs/phase-04/critical-path.md` に図示されている。

## Phase 一覧（本仕様書の対象範囲）

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | phase-01.md |
| 2 | 設計 | phase-02.md | completed | phase-02.md |
| 3 | 設計レビュー | phase-03.md | completed | phase-03.md |
| 4 | タスク分解 | phase-04.md | completed | phase-04.md |
| 5 | 実装計画 | phase-05.md | completed | phase-05.md |
| 6 | 実装手順 | phase-06.md | completed | phase-06.md |
| 7 | テスト計画 | phase-07.md | completed | phase-07.md |
| 8 | ドキュメント更新 | phase-08.md | completed | phase-08.md |
| 9 | 受入確認 | phase-09.md | completed | outputs/phase-09/acceptance.md |
| 10 | リファクタ | phase-10.md | completed | phase-10.md |
| 11 | VISUAL evidence | phase-11.md | runtime_pending | outputs/phase-11/canonical-paths.json / evidence/test.log |
| 12 | 正本同期 | phase-12.md | completed | outputs/phase-12 strict 7 |
| 13 | PR・振り返り | phase-13.md | pending | outputs/phase-13/pr-summary.md |

> 2026-05-15 改善サイクルで実コード 2 箇所と component test を実装済み。VISUAL screenshot / staging smoke / commit / push / PR は user-gated のため `runtime_pending` として分離する。

## 主要成果物（Phase 1〜4 範囲）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/requirements.md | 要件定義主成果物（真の論点 3 件・4条件評価・既存資産インベントリ） |
| ドキュメント | outputs/phase-02/admin-sidebar-logo-design.md | G1-1 設計（AC-1, AC-4, AC-5） |
| ドキュメント | outputs/phase-02/member-drawer-tag-link-design.md | G1-2 設計（AC-2, AC-3, AC-4, AC-5） |
| ドキュメント | outputs/phase-02/test-strategy.md | Vitest + RTL + Playwright 戦略（AC-3） |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー（AC-6） |
| ドキュメント | outputs/phase-04/task-breakdown.md | SRP 分解されたサブタスク表（AC-7） |
| ドキュメント | outputs/phase-04/critical-path.md | 並列可能性とクリティカルパス図（AC-7） |
| 管理 | artifacts.json | workflow_state / Phase 1-13 status |
| 実装 | apps/web/src/components/layout/AdminSidebar.tsx | sidebar home link 追加 |
| 実装 | apps/web/src/features/admin/components/_members/MemberDrawer.tsx | drawer tags link 追加 |
| テスト | apps/web/src/components/layout/__tests__/AdminSidebar.component.spec.tsx | home link assertion 追加 |
| テスト | apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx | tags link / encode assertion 追加 |

## 不変条件

1. **既存 API のみ接続**: 新規 endpoint 追加禁止。`/admin/tags` 側の `focusMemberId` searchParam handling は既実装のため改修不要。
2. **D1 直接アクセス禁止**: `apps/web` から D1 binding 経由のアクセスは禁止（既存条件継続）。本タスクでは D1 アクセスは発生しない。
3. **OKLch token 正本**: 色は `apps/web/src/styles/tokens.css` と `docs/00-getting-started-manual/specs/09b-design-tokens.md` が正本。HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 禁止。CI gate `verify-design-tokens` で fail 判定。
4. **プロトタイプ正本順位**: `docs/00-getting-started-manual/claude-design-prototype/` の primitives + tokens + rhythm をデザイン言語の正本とする。新規 primitive を生やさない（既存 `<Link>` / nav 構造を再利用）。
5. **test suffix ルール**: 新規 test は `*.spec.{ts,tsx}` のみ（`*.test.{ts,tsx}` は禁止。lefthook `block-test-suffix` と GitHub Actions `verify-test-suffix` が reject）。
6. **encodeURIComponent 徹底**: `memberId` を URL に埋め込む際は必ず `encodeURIComponent()` を通す。
7. **a11y 不変条件**: link には `aria-label` / `focus-visible` を必ず設定し、keyboard 操作で同等遷移が可能であること。
8. **CONST_007 遵守**: 本サイクル内で Phase 1〜13 と local implementation を完了させる。Phase 13 の commit / push / PR は user-gated。

## リスクと緩和策

| リスク | 緩和策 |
| --- | --- |
| 既存 `AdminSidebar.tsx` / `MemberDrawer.tsx` のパスが想定と異なる | Phase 1 真の論点 3 で「既存ファイルパス実在確認」を実行タスクに含め、必要に応じ Grep で再探索する |
| logo link が sidebar 上部 nav item と視覚衝突 | プロトタイプの logo block sizing / padding に整合させ、`outputs/phase-02/admin-sidebar-logo-design.md` で配置・spacing を確定 |
| drawer 内 tag link クリック時に drawer が閉じない | Next.js `<Link>` の page transition で drawer unmount が自動発火する仕様を Phase 2 で確認・明文化。明示的 `onClose()` 呼び出しは不要 |
| `memberId` 特殊文字（`@`, `/`, スペース）で URL 破損 | `encodeURIComponent` を徹底し、Vitest テストケースで特殊文字 case を verify |
| HEX 直書き混入で `verify-design-tokens` CI fail | Phase 2 設計時点で OKLch CSS var のみ使用を Class 命名に固定。Phase 7 test 計画で grep 検証を含める |
| 既存 admin smoke test が link 追加で破壊 | Phase 7 で test を更新し、新 link assertion を追加。CI green を Phase 9 で確認 |
| visualEvidence VISUAL 要件で Phase 11 スクリーンショット未取得 | Phase 1 完了条件で `visualEvidence=VISUAL` を artifacts.json metadata に固定。Phase 11 で `outputs/phase-11/*.png` 2 枚（sidebar logo / drawer tag link）取得を必須化 |

## Phase マップ

```
phase-01 (要件定義 / 真の論点 3件・既存ファイル実在確認)
  └─ outputs/phase-01/requirements.md
       │
       ▼
phase-02 (設計 / G1-1, G1-2, テスト戦略)
  ├─ outputs/phase-02/admin-sidebar-logo-design.md
  ├─ outputs/phase-02/member-drawer-tag-link-design.md
  └─ outputs/phase-02/test-strategy.md
       │
       ▼
phase-03 (設計レビュー / 7軸 GO/NO-GO)
  └─ outputs/phase-03/design-review.md
       │
       ▼
phase-04 (タスク分解 / SRP T1〜T5 + critical path)
  ├─ outputs/phase-04/task-breakdown.md
  └─ outputs/phase-04/critical-path.md
       │
       ▼
phase-05〜12 (実装〜正本同期 / 本サイクル内)
       │
       ▼
phase-13 (PR・振り返り / user-gated commit/push/PR)
```

## 注意点

- 本タスクは親 workflow `ui-prototype-alignment-mvp-recovery` の improvement パッケージ `parallel-01-navigation` を Phase 1-13 仕様書に展開したもの。spec.md の内容を漏れなく反映する。
- 既存ファイルパス（`AdminSidebar.tsx` / `MemberDrawer.tsx`）は spec.md の記述をそのまま採用するが、Phase 1 実行時に Grep / Read による実在確認を必須化する。実在しない場合は近接パスを探索し、Phase 1 requirements.md に確定パスを記録する。
- Phase 11 は VISUAL evidence を必須とし、スクリーンショット 2 枚（sidebar logo クリック前後 / drawer tag link 表示）を `outputs/phase-11/` に配置する。
- 本仕様書は Claude Code が `task-specification-creator` skill に従って生成した。Phase 5 以降の追補は本サイクル内で順次行う。

---

**作成日**: 2026-05-15
