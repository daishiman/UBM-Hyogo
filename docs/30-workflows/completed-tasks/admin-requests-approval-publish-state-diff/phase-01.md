# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| implementation_mode | `new`（diff 表示は未実装。本タスクで新規追加） |
| 上流 | _shared-context.md（調査・方針・AC 正本） |
| 下流 | Phase 2（設計） |
| 状態 | completed |

## 目的

`/admin/requests` の承認操作 UI に「変更前 → 変更後」公開状態 diff を新規表示するための要件を確定する。本 Phase では Issue #1188 の現行コード再検証、対象ファイル inventory、命名規則、受入条件（AC-1〜AC-10）、タスク分類（VISUAL）、使用してよいデータ 3 値の限定、スコープ外を固定し、後続 Phase の手戻りをゼロにする。**API / D1 / Google Form schema / projection は一切変更しない**ことを Phase 1 時点で不変条件として宣言する。

## 実行タスク

1. **P50 前提確認（Step 0）**: current branch / 現行コードを `git` / `grep` で確認し、「diff 表示は未実装・本タスクは新規追加」を裏取りする（Issue #1188 が別タスクで解決済みでないことの確認を含む）。
2. **Issue #1188 現行コード再検証の記録**: `_shared-context.md` §0.1 の再検証結果（未解決・有効・行番号一致）を Phase 1 main.md に転記する。
3. **inventory 確定**: 対象 3 コンポーネント + `globals.css` + 既存テスト 3 本を `outputs/phase-01/main.md` に列挙する。
4. **命名規則の分析と記録**: コンポーネント PascalCase / 関数 camelCase / CSS は `data-diff-side` 属性 + `.admin-*` 風という current 規則を確定。新規 helper（`formatPublishStateLabel` / `buildPublishStateDiff`）の命名一貫性を担保する。
5. **AC-1〜AC-10 の本文列挙**: `_shared-context.md` §6 の AC を Phase 1 main.md に番号付きで転記し、各 AC が test 検証可能であることをチェックする。
6. **VISUAL タスク宣言**: 本タスクが VISUAL（UI 変更あり）であることを宣言し、Phase 11 で screenshot（V01/V02/D01 の 3 ケース）を取得する旨を確定する。
7. **使用データ 3 値の限定宣言**: diff に使ってよいのは `publishState` / `isDeleted` / `desiredState` の 3 値のみ。projection 拡張は invariant 違反として禁止する。
8. **spec-extraction-map 作成**: system spec（design-tokens / primitives / screen-blueprints-admin）と current code anchor の 1:1 対応表を `outputs/phase-01/spec-extraction-map.md` に作成する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | 調査・方針・AC の集約正本 |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/index.md | タスク全体像 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本（token 名実在確認） |
| 必須 | apps/web/src/components/admin/RequestQueueDetail.tsx | 改修主役（現状確認） |
| 必須 | apps/api/src/routes/admin/requests.ts | projection / desiredState 値域（変更しない） |

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| API endpoint surface | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | admin requests endpoint（参照のみ・変更なし） |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止） |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値 JSON 正本・HEX 禁止ルール |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog |
| 必須 | docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md | admin 画面 contract |

## 実行手順

### ステップ 1: P50 前提確認（Step 0）

```bash
git status
git log --oneline -3
# diff 表示が未実装であることの裏取り（0 件であること）
grep -rnE "変更前|変更後|data-diff-side|→.*変更" apps/web/src/components/admin/Request*.tsx
# 現在値のみ表示の確認
grep -nE "publishState|desiredState|summarizePayload" apps/web/src/components/admin/RequestQueueDetail.tsx
```

期待: diff 系 grep が 0 件、`RequestQueueDetail.tsx` が現在値 / 申請内容を別々に表示している。

### ステップ 2: 使用データ 3 値の availability 確認

```bash
grep -nE "memberSummary|publishState|isDeleted|desiredState" apps/web/src/components/admin/RequestQueuePanel.tsx
grep -nE "PUBLISH_STATES|projectListItem|\.strict\(\)" apps/api/src/routes/admin/requests.ts
```

期待: `RequestQueueItem.memberSummary.{publishState,isDeleted}` と `requestedPayload`（`desiredState` を含む）がクライアント側 type に揃っている。projection は `.strict()`（拡張禁止）。

### ステップ 3: AC・inventory・命名規則を main.md へ転記

`outputs/phase-01/main.md` に inventory・AC-1〜AC-10・命名規則・スコープ外・VISUAL 宣言を記録する。

### ステップ 4: spec-extraction-map 作成

`outputs/phase-01/spec-extraction-map.md` に system spec と current code anchor の 1:1 対応を記録する（route owner = `app/(admin)/admin/requests/page.tsx`、表示 owner = `RequestQueueDetail.tsx`、状態 owner = `RequestQueuePanel.tsx` の `useConfirmDialog`、データ契約 = `requests.ts` projection）。

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-01/main.md | inventory / AC-1〜AC-10 / 命名規則 / VISUAL 宣言 / スコープ外 / 3 値限定 |
| outputs/phase-01/spec-extraction-map.md | system spec ↔ current code anchor の 1:1 対応表 |

## 統合テスト連携

- 本 Phase で確定する 3 fixture（`TEST-NOTE-V01` public→hidden / `V02` hidden→public / `D01` delete）が Phase 4 のテスト設計・Phase 11 の screenshot 計画の入力になる。
- AC-1〜AC-10 は Phase 7（AC マトリクス）でテストと 1:1 トレースされる。

## 完了条件

- [ ] P50 前提確認で diff 表示が未実装であることを grep で裏取りした。
- [ ] 使用データ 3 値（`publishState`/`isDeleted`/`desiredState`）の availability を確認し、projection 拡張禁止を宣言した。
- [ ] inventory（3 コンポーネント + globals.css + 3 テスト）を main.md に列挙した。
- [ ] AC-1〜AC-10 を番号付きで列挙し、各 AC が test 検証可能であることを確認した。
- [ ] VISUAL タスク宣言と Phase 11 screenshot（3 ケース）取得方針を記録した。
- [ ] spec-extraction-map を作成した。
