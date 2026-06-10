# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-08 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| implementation_mode | `new`（既存 8 セクション縦積みは実装済だが、本タスクは表現層の再構成 = 新規実装サイクル） |
| 上流 | _shared-context.md（調査・方針・AC 正本） |
| 下流 | Phase 2（設計） |
| 状態 | spec_created |

## 目的

管理画面 `/admin/dashboard/attendance` を **「パッと見て何を判断すべきか一目で分かる」3 層情報階層（PRIMARY / TREND / DETAIL）** へ再設計するための要件を確定する。現状は 8 セクションがフラットに縦積みされ視覚的階層・優先順位・焦点が欠如している（情報過多）。本 Phase では、対象コンポーネント inventory・命名規則・受入条件（AC-1〜AC-10）・タスク分類（VISUAL）・スコープ外を固定し、後続 Phase の手戻りをゼロにする。**API / D1 / Google Form schema / shared 型は一切変更しない**ことを Phase 1 時点で不変条件として宣言する。

## 実行タスク

1. **P50 前提確認（Step 0）**: current branch / worktree の実装状態を `git` / `grep` で確認し、「現状 = 8 セクション縦積みが既に実装済み・本タスクは表現層再構成」を記録する。
2. **inventory 確定**: 対象 11 コンポーネント + `globals.css` の `.attendance-*` 系 + 既存テストを `outputs/phase-01/main.md` に列挙する。
3. **命名規則の分析と記録**: コンポーネント PascalCase / 関数 camelCase / 既存 CSS は `.attendance-*` BEM 風という current 規則を確定する。新規タブホスト名の命名規則一貫性を担保する（[FB-SDK-07-4]）。
4. **AC-1〜AC-10 の本文列挙**: `_shared-context.md` §6 の AC を Phase 1 main.md に番号付きで転記し、各 AC が test 検証可能であることをチェックする。
5. **VISUAL タスク宣言**: 本タスクが VISUAL（UI/UX 変更あり）であることを宣言し、Phase 11 で screenshot を取得する旨を Phase 1 で確定する（[Feedback W1-02b-1] / [Feedback 3] 対策）。
6. **スコープ外の明示**: 新 endpoint を要する集計（会員ごとの直近 N 回出席フラグ一覧 / 月別「出席率」のサーバ集計）はスコープ外として明記する。
7. **spec-extraction-map 作成**: system spec（design-tokens / primitives / screen-blueprints-admin）と current code anchor の 1:1 対応表を `outputs/phase-01/spec-extraction-map.md` に作成する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/_shared-context.md | 調査・方針・AC の集約正本 |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/index.md | タスク全体像 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本（token 名実在確認） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 階層・余白・焦点の設計指針 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | admin ダッシュボードの情報設計 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | primitive catalog / 再利用方針 |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止） |
| API endpoint surface | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 出席 analytics endpoint（参照のみ・変更なし） |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値 JSON 正本・HEX 禁止ルール |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog |
| 必須 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | admin 画面 contract |

## 実行手順

### ステップ 1: P50 前提確認（Step 0）

- `git status` / `git log --oneline -5` で current branch の実装状態を確認する。
- 以下のコマンドで現状実装が「8 セクション縦積み」であることを `grep` で裏取りする:

```bash
grep -nE "<h2>|attendance-charts-grid|KpiPanel|SessionAttendanceTable|MemberAttendanceTable|AttendanceTop10Ranking|AttendanceAbsenteeAlert" \
  apps/web/src/features/admin/attendance/components/AttendanceAnalyticsPage.tsx
```

- 記録内容: **「現状は `AttendanceAnalyticsPage.tsx` が KPI(5枚) → 2カラム(trend/zone) → セッション別表 → 会員別表 → TOP10 → 要フォローの順に縦積み（h2 がフラットに並列）で実装済み。本タスクはデータ層・型を変えず、この表現層を PRIMARY/TREND/DETAIL の 3 層に再構成する。」**

### ステップ 2: inventory と命名規則の確定

- `outputs/phase-01/main.md` に下記を書く:
  - 「対象 inventory 表」: 11 コンポーネント + `globals.css` `.attendance-*` 系 + 既存テスト
  - 「命名規則表」: PascalCase / camelCase / kebab-case / `.attendance-*` BEM 風
  - 「AC-1〜AC-10 番号付き列挙」と test 検証可能性
  - 「VISUAL タスク宣言」
  - 「スコープ外」

### ステップ 3: spec-extraction-map の作成

- `outputs/phase-01/spec-extraction-map.md` に system spec と current code anchor の 1:1 対応表を書く（route owner / 状態 owner / 対象 view / token 正本）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | inventory・命名規則・AC を module map / 3 層 topology に変換 |
| Phase 4 | AC-1〜AC-10 を verify suite（vitest）に変換 |
| Phase 7 | AC マトリクスのトレース起点 |
| Phase 10 | gate 判定（GO/NO-GO）の根拠 |
| Phase 11 | VISUAL 宣言を screenshot-plan.json（mode: VISUAL）に反映 |
| Phase 12 | implementation-guide.md の入力 |

## 多角的チェック観点（AIが判断）

| 観点 | 不変条件 / AC | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | `apps/web` から D1 binding に触れない（`safeServerFetch` 経由のまま）。Phase 1 inventory に D1 直接アクセスを含めない |
| 既存 API のみ接続 | ui-prototype #1 / AC-7 | `fetchAttendanceAnalyticsBundle` と 6 endpoint surface を変更しない。`apps/api` / `packages/shared` を inventory 対象に含めない |
| OKLch トークン正本 | ui-prototype #2 / AC-5 | token 名は `tokens.css` の実在値（`--ubm-color-ok` / `--ubm-color-warn` / `--ubm-space-*` / `--ubm-text-3xl` 等）のみ参照。HEX を inventory に書かない |
| 新規 primitive 禁止 | ui-prototype #3 / AC-6 | 既存 primitive（`Card` / `Badge` / `Stat` / `Segmented` / `EmptyState` / `AdminSectionCard`）のみを再利用候補として列挙する |
| VISUAL 分類固定 | [Feedback 3] | Phase 1 でタスク分類を VISUAL に固定し、Phase 11 で再判定時に参照させる |
| 命名一貫性 | [FB-SDK-07-4] | 新規タブホストコンポーネント名（`AttendanceDetailTabs`）が既存 PascalCase 規則と整合する |
| 挙動不変 | AC-10 | フィルタ / CSV / ドリルダウン modal / SafeResult degrade は inventory 上「挙動不変で温存」と明記する |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | P50 Step 0（実装状態 git/grep 確認） | 1 | spec_created | 8 セクション縦積み実装済を記録 |
| 2 | inventory 確定（11 component + globals.css + test） | 1 | spec_created | main.md |
| 3 | 命名規則の分析・記録 | 1 | spec_created | PascalCase / camelCase / `.attendance-*` |
| 4 | AC-1〜AC-10 番号付き列挙 + test 可能性 | 1 | spec_created | main.md |
| 5 | VISUAL タスク宣言 | 1 | spec_created | Phase 11 screenshot 前提 |
| 6 | スコープ外明示 | 1 | spec_created | 新 endpoint 要件を除外 |
| 7 | spec-extraction-map 作成 | 1 | spec_created | spec ↔ code anchor 1:1 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義の実体（Step 0 / inventory / 命名規則 / AC-1〜10 / VISUAL 宣言 / スコープ外） |
| ドキュメント | outputs/phase-01/spec-extraction-map.md | system spec ↔ current code anchor の 1:1 対応表 |
| メタ | artifacts.json | Phase 1 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-01/main.md` に Step 0（8 セクション縦積み実装済の記録）が書かれている
- [ ] 対象 11 コンポーネント + `globals.css` `.attendance-*` 系 + 既存テストが inventory 表で列挙されている
- [ ] 命名規則（PascalCase / camelCase / `.attendance-*` BEM 風）が表で記録されている
- [ ] AC-1〜AC-10 が番号付きで本文に列挙され、各 AC の test 検証手段が併記されている
- [ ] VISUAL タスク宣言（Phase 11 screenshot 前提）が明記されている
- [ ] スコープ外（新 endpoint を要する集計）が明記されている
- [ ] `outputs/phase-01/spec-extraction-map.md` に spec ↔ code anchor の 1:1 対応表が完成している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-01/{main,spec-extraction-map}.md` が指定パスに配置されている
- [ ] AC-7（API / D1 / Form / shared 型 変更ゼロ）が要件本文で不変条件として宣言されている
- [ ] token 名が `tokens.css` の実在値のみで構成され、HEX 直書きが要件本文に存在しない
- [ ] 新規 primitive 追加ゼロ方針（AC-6）が記録されている
- [ ] artifacts.json の Phase 1 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 2（設計）
- 引き継ぎ事項: inventory 表 / 命名規則表 / AC-1〜AC-10 / VISUAL 宣言 / spec-extraction-map
- ブロック条件: `outputs/phase-01/main.md` の inventory が未完成、または AC が test 検証手段にマップされていない場合は Phase 2 に進めない
