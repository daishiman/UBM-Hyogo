# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| implementation_mode | `new`（文言は実装済みだが、本タスクは表現層の文言置換 = 新規実装サイクル） |
| 上流 | _shared-context.md（調査・方針・用語リネーム正本表・AC 正本） |
| 下流 | Phase 2（設計） |
| 状態 | spec_created |

## 目的

管理画面 `/(admin)/admin/dashboard/attendance` の**英語表記とエンジニア専門語を、非エンジニアの会員・管理者が直感的に読める平易な日本語へ統一**するための要件を確定する。本 Phase では、対象コンポーネント inventory・命名規則・用語リネーム正本表（R/S/J/U）・受入条件（AC-1〜AC-10）・タスク分類（VISUAL）・スコープ外を固定し、後続 Phase の手戻りをゼロにする。**API / D1 / Google Form schema / `packages/shared` 型は一切変更しない**ことを Phase 1 時点で不変条件として宣言する。

## 実行タスク

1. **P50 前提確認（Step 0）**: current branch / worktree の実装状態を `git` / `grep` で確認し、「現状 = 3 ゾーン（PRIMARY/TREND/DETAIL）構造は実装済み・本タスクは文言の日本語化と平易化」を記録する。
2. **inventory 確定**: 対象 12 コンポーネント/ヘルパ + `globals.css` + 既存テスト/Playwright を `outputs/phase-01/main.md` に列挙する。
3. **命名規則の分析と記録**: コンポーネント PascalCase / 関数 camelCase / CSS `.attendance-*` BEM 風という current 規則を確定する。新規 component/primitive は作らない（[FB-SDK-07-4] = 命名ドリフト発生源を持たない）。
4. **用語リネーム正本表の確定**: `_shared-context.md` §2（R-01〜R-10 / S-01〜S-10 / J-01〜J-12 / U-01〜U-03）を Phase 1 で正として固定し、各リネームが「画面表示テキスト / aria-label / テスト」のどこに影響するかを表にする。
5. **AC-1〜AC-10 の本文列挙**: `_shared-context.md` §5 の AC を Phase 1 main.md に番号付きで転記し、各 AC が test/grep で検証可能であることをチェックする。
6. **VISUAL タスク宣言**: 本タスクが VISUAL（UI 表示文言・軽微レイアウト変更あり）であることを宣言し、Phase 11 で screenshot を取得する旨を確定する（[Feedback W1-02b-1] / [Feedback 3] 対策）。
7. **既存テスト追従の事前列挙**: 変更する Before 文字列に依存する既存テスト（T-01〜T-06）を Phase 1 で列挙し、同一 wave 追従が必須であることを記録する（[FB-TASK-01/02] 対策）。
8. **スコープ外の明示**: 3 ゾーン構造の作り替え・新 endpoint を要する集計・既に平易な文言は扱わないことを明記する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/_shared-context.md | 調査・方針・用語リネーム正本表・AC の集約正本 |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/index.md | タスク全体像 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本（token 名実在確認） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 文言・ラベルの分かりやすさ指針 |
| UI/UX admin dashboard | `.claude/skills/aiworkflow-requirements/references/ui-ux-admin-dashboard.md` | admin ダッシュボードの情報設計 |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止） |
| API endpoint surface | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 出席 analytics endpoint（参照のみ・変更なし） |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値正本・HEX 禁止ルール |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | デザイン言語（rhythm）正本 |

## 実行手順

### ステップ 1: P50 前提確認（Step 0）

- `git status` / `git log --oneline -5` で current branch の実装状態を確認する。
- 以下で現状が「3 ゾーン構造 + 英語見出し/専門語混在」であることを `grep` で裏取りする:

```bash
grep -nE "PRIMARY|TREND|DETAIL|ADMIN / DASHBOARD|TOP10|セッション|ユニーク|トレンド|区画|CSVエクスポート" \
  apps/web/app/\(admin\)/admin/dashboard/attendance/page.tsx \
  apps/web/src/features/admin/attendance/components/*.tsx \
  apps/web/src/features/admin/attendance/lib/format-attendance.ts
```

- 記録内容: **「現状は AttendanceAnalyticsPage が PRIMARY/TREND/DETAIL の 3 ゾーン（英語 h2）で実装済み。eyebrow は `ADMIN / DASHBOARD`、タブは `TOP10` / `セッション別`、期間プリセットは `3M/6M/1Y`、書き出しは `CSVエクスポート`。本タスクはデータ層・型・DOM 構造を変えず、これらの文言を平易な日本語へ置換する。」**

### ステップ 2: inventory と命名規則の確定

- `outputs/phase-01/main.md` に下記を書く:
  - 「対象 inventory 表」: 12 コンポーネント/ヘルパ（§4.2）+ `globals.css` + 既存テスト/Playwright
  - 「命名規則表」: PascalCase / camelCase / `.attendance-*` BEM 風
  - 「AC-1〜AC-10 番号付き列挙」と test/grep 検証可能性
  - 「VISUAL タスク宣言」
  - 「既存テスト追従リスト（T-01〜T-06）」
  - 「スコープ外」

### ステップ 3: 用語リネーム正本表の写経（rename-map.md）

- `outputs/phase-01/rename-map.md` に `_shared-context.md` §2 の R/S/J/U 表を転記し、各行に「影響先（画面テキスト / aria-label / テスト T-NN）」列を追加する。これを Phase 5 実装の唯一の正とする。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | inventory・命名規則・リネーム表を「ファイル別変更マップ」に変換 |
| Phase 4 | AC-1〜AC-10 と T-01〜T-06 を verify suite（vitest/grep）に変換 |
| Phase 7 | AC マトリクスのトレース起点 |
| Phase 10 | gate 判定（GO/NO-GO）の根拠 |
| Phase 11 | VISUAL 宣言を screenshot-plan.json（mode: VISUAL）に反映 |
| Phase 12 | implementation-guide.md の入力 |

## 多角的チェック観点（AIが判断）

| 観点 | 不変条件 / AC | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | `apps/web` から D1 binding に触れない（`safeServerFetch` 経由のまま） |
| 既存 API のみ接続 | ui-prototype #1 / AC-7 | `fetchAttendanceAnalyticsBundle` と 6 endpoint surface を変更しない。`apps/api` / `packages/shared` を inventory 対象に含めない |
| OKLch トークン正本 | ui-prototype #2 / AC-5 | 軽微 CSS 調整は `var(--ubm-color-*)` のみ。HEX を inventory に書かない |
| 新規 primitive/component 禁止 | ui-prototype #3 / AC-6 | 文言と軽微 CSS のみ。新規 component を作らない |
| VISUAL 分類固定 | [Feedback 3] | Phase 1 でタスク分類を VISUAL に固定し、Phase 11 で再判定時に参照させる |
| テスト追従の同一 wave | [FB-TASK-01/02] | Before 文字列依存テスト（T-01〜T-06）を Phase 1 で列挙し放置を防ぐ |
| 挙動不変 | AC-10 | フィルタ / 書き出し / modal / SafeResult degrade は inventory 上「挙動不変で温存」と明記 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | P50 Step 0（実装状態 git/grep 確認） | 1 | spec_created | 3 ゾーン構造 + 英語/専門語混在を記録 |
| 2 | inventory 確定（12 component/helper + globals.css + test） | 1 | spec_created | main.md |
| 3 | 命名規則の分析・記録 | 1 | spec_created | PascalCase / camelCase / `.attendance-*` |
| 4 | 用語リネーム正本表の写経（R/S/J/U） | 1 | spec_created | rename-map.md |
| 5 | AC-1〜AC-10 番号付き列挙 + 検証可能性 | 1 | spec_created | main.md |
| 6 | VISUAL タスク宣言 | 1 | spec_created | Phase 11 screenshot 前提 |
| 7 | 既存テスト追従リスト（T-01〜T-06）列挙 | 1 | spec_created | 同一 wave 必須 |
| 8 | スコープ外明示 | 1 | spec_created | 構造作り替え・新 endpoint を除外 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義の実体（Step 0 / inventory / 命名規則 / AC-1〜10 / VISUAL 宣言 / テスト追従 / スコープ外） |
| ドキュメント | outputs/phase-01/rename-map.md | 用語リネーム正本表（R/S/J/U）+ 影響先列 |
| メタ | artifacts.json | Phase 1 を spec_created に維持 |

## 完了条件

- [ ] `outputs/phase-01/main.md` に Step 0（3 ゾーン構造 + 英語/専門語混在の記録）が書かれている
- [ ] 対象 12 コンポーネント/ヘルパ + `globals.css` + 既存テスト/Playwright が inventory 表で列挙されている
- [ ] 命名規則（PascalCase / camelCase / `.attendance-*` BEM 風）が表で記録されている
- [ ] 用語リネーム正本表（R/S/J/U）が `outputs/phase-01/rename-map.md` に影響先列付きで写経されている
- [ ] AC-1〜AC-10 が番号付きで本文に列挙され、各 AC の test/grep 検証手段が併記されている
- [ ] VISUAL タスク宣言（Phase 11 screenshot 前提）が明記されている
- [ ] 既存テスト追従リスト（T-01〜T-06）が列挙され同一 wave 必須と明記されている
- [ ] スコープ外（構造作り替え・新 endpoint・既に平易な文言）が明記されている

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜8 が完了している
- [ ] `outputs/phase-01/{main,rename-map}.md` が指定パスに配置されている
- [ ] AC-7（API / D1 / Form / shared 型 変更ゼロ）が要件本文で不変条件として宣言されている
- [ ] 軽微 CSS の token 名が `tokens.css` の実在値のみで構成され、HEX 直書きが要件本文に存在しない
- [ ] 新規 primitive/component 追加ゼロ方針（AC-6）が記録されている
- [ ] artifacts.json の Phase 1 ステータスが spec_created に整合している

## 次Phase

- 次: Phase 2（設計）
- 引き継ぎ事項: inventory 表 / 命名規則表 / 用語リネーム正本表（R/S/J/U）/ AC-1〜AC-10 / VISUAL 宣言 / テスト追従リスト
- ブロック条件: `outputs/phase-01/main.md` の inventory または rename-map が未完成、または AC が検証手段にマップされていない場合は Phase 2 に進めない
