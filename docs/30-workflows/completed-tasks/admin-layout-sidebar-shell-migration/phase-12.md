# Phase 12: documentation

## メタ情報

- task_id: `admin-layout-sidebar-shell-migration`
- 前 Phase: 11（manual test） / 次 Phase: 13（PR）
- 実装区分: **実装仕様書**
- workflow_state: `implemented_local_runtime_pending`（2026-05-29 実装完了。Task A/B/D/E 一括実装・ローカル全 green。staging 視覚 capture と commit/push/PR のみ user-gated）

## 目的

実装完了後に必要な documentation（strict 7）を生成する。本タスクは admin layout の置換であり、
ドメイン仕様（API endpoint / D1 schema / IPC 契約 / auth）への影響はないため、
`system-spec-update-summary.md` の Step 2 は原則 **N/A**（判定根拠は下記）。

## 必須タスク（strict 7）

| # | 成果物 | Path | 最低限の内容 |
| --- | --- | --- | --- |
| 1 | main | `outputs/phase-12/main.md` | Phase 12 トップ index。strict 7 へのリンク |
| 2 | implementation-guide | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル説明）+ Part 2（型/シグネチャ/使用例/エラー処理/設定値） |
| 3 | system-spec-update-summary | `outputs/phase-12/system-spec-update-summary.md` | Step 1（完了記録）/ Step 2（N/A 判定根拠） |
| 4 | documentation-changelog | `outputs/phase-12/documentation-changelog.md` | 変更/削除ファイル一覧 + validator 結果 + current/baseline |
| 5 | unassigned-task-detection | `outputs/phase-12/unassigned-task-detection.md` | SF-03 4 パターン照合。0 件でも理由明記 |
| 6 | skill-feedback-report | `outputs/phase-12/skill-feedback-report.md` | 改善点 or 「なし」 |
| 7 | compliance check | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 1〜6 準拠チェック（canonical 9 headings 厳守） |

> 本 spec_created サイクルで strict 7 はすべて canonical filename で物理配置済み。
> 実コード evidence が必要な項目は `spec_created` / `runtime_pending` 境界を本文に明記し、ファイル欠落で表現しない。

## implementation-guide Part 1（中学生レベル説明の方針）

> アナロジー: 「教室の入口チェック係」。admin layout は教室（/admin 配下 9 部屋）の入口に立つ係。
> 入ってよい人か（ログイン済みか・管理者か）だけを確認して、合わない人は受付（/login）に戻す。
> 部屋の中の棚（ナビ）や名札（ユーザーメニュー）の配置は、新しく雇った内装担当（SidebarShell）に
> 全部まかせる。だから入口チェック係の仕事は「身分確認 → 内装担当を呼ぶ」だけにスリム化する。

この比喩で説明する不変条件:
- auth guard を layout に残す → 「入口チェックは入口の係がやる（中の人に任せない）」
- nav/badge/user menu を shell へ委譲 → 「内装は内装担当へ一本化」
- 旧 AdminSidebar 削除 → 「前の内装屋さんの道具は全部片付ける（grep 0 件）」

## implementation-guide Part 2（C12P2-1〜5 対応）

| # | 項目 | 本タスクでの記述 |
| --- | --- | --- |
| C12P2-1 | 型定義 | `AdminLayout({ children }: { readonly children: ReactNode })` / Task A `SidebarShellServer` props 型 |
| C12P2-2 | API シグネチャ | `getSession(): Promise<SessionUser \| null>` / `safeServerFetch<SchemaDiffListView>(path)` |
| C12P2-3 | 使用例 | phase-2.md の layout 新形コードブロック |
| C12P2-4 | エラー処理 | `safeServerFetch` 失敗時 count=0 / `getSession` null → redirect（fail-closed） |
| C12P2-5 | 設定値 | `export const dynamic = "force-dynamic"` / redirect target `/login?next=/admin` `/login?gate=forbidden` / `data-*` 属性 |

## Step 2 = N/A 判定（system-spec-update-summary）

| 判定 | 根拠 |
| --- | --- |
| **N/A** | 本タスクは UI レイヤーの component 置換のみ。API endpoint / D1 schema / IPC 契約 / UI route / auth 方式 / Cloudflare Secret のいずれにも touch しない（不変条件 #1〜#7 非影響）。`/admin/schema/diff` の呼び出しは既存挙動の移設であり契約変更なし |

> ロール語彙（管理者 / 会員 / 公開閲覧者）や nav 構成の正本は親 workflow `unified-sidebar-shell-public-and-admin` および
> `docs/00-getting-started-manual/specs/02-auth.md` が保持する。本タスク単独では aiworkflow-requirements 正本更新は発生しない。

## 未タスク検出（SF-03 4 パターン照合）

| パターン | 本タスクの該当 |
| --- | --- |
| 型定義→実装 | なし（layout は既存型のみ使用） |
| 契約→テスト | なし（layout.spec.tsx で cover） |
| UI仕様→コンポーネント | **依存**: Task A/B/E の実装（別タスク・親 workflow 管理）。本タスクの未タスクではなく実行順序依存 |
| 仕様書間差異→設計決定 | TECH-M-01（schemaDiffCount SSOT）は Phase 5/8 で解決済み想定。未解決なら helper 抽出を unassigned 化 |

→ 本タスク固有の未タスクは原則 **0 件**（Task A/B/E は親 workflow のタスクであり先送りではない）。
実装時に TECH-M-01 がコード解決できなければ `apps/web/src/lib/admin/schema-diff-count.ts` 抽出を
`docs/30-workflows/unassigned-task/` へ formalize する。

## Phase 10 MINOR 追跡結果

| MINOR ID | 内容 | 解決 |
| --- | --- | --- |
| TECH-M-01 | schemaDiffCount SSOT | Phase 5/8 でコード解決（Task A 内 or helper 抽出）。`documentation-changelog.md` に結果記録 |
| TECH-M-02 | activePath 固定 + client active 表示 | Phase 11 目視で確認（screenshot evidence） |

## 実行タスク

1. strict 7 を canonical filename で生成（本 spec_created wave で完了）。
2. compliance-check は canonical 9 headings 逐語（`outputs/phase-12/phase12-task-spec-compliance-check.md`）。
3. planned wording（「実行予定」「保留として記録」）を残さない。

## 参照資料

- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`（canonical 9 headings SSOT）
- `index.md` Phase 12 strict 7 表

## 統合テスト連携

- compliance-check の `Phase 11 evidence file inventory` は VISUAL タスクのため screenshot を `present`
  （capture 後）/ `pending`（Gate-B 前）で記録する。

## 多角的チェック観点（AIが判断）

- canonical 9 headings を逐語で守る（独自命名は CI `verify-phase12-compliance` が必ず fail）。
- spec_created なのに implementation complete と書かない（drift 防止）。

## サブタスク管理

- strict 7 の生成は本 wave で完了。実コード evidence の追記は Gate-B 後。

## 成果物

- 本 Phase: strict 7 生成 / Step 2 N/A 判定 / SF-03 照合 / MINOR 追跡（本ファイル）。
- 配置済み: `outputs/phase-12/main.md` / `implementation-guide.md` / `system-spec-update-summary.md` /
  `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` /
  `phase12-task-spec-compliance-check.md`。

## 完了条件

- [x] strict 7 の canonical filename と内容方針を定義した
- [x] Step 2 = N/A の根拠を記録した
- [x] SF-03 4 パターンを照合した（本タスク固有 0 件）
- [x] MINOR 2 件の追跡結果を記録した
- [x] compliance-check が canonical 9 headings 逐語である

## タスク100%実行確認【必須】

- [x] strict 7 の path が `index.md` と一致
- [x] planned wording を残していない

## 次Phase

Phase 13（PR）。
