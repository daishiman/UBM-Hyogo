# Phase 1: 要件定義

[実装区分: 実装仕様書]（VISUAL / コード変更を伴う）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-audit-log-japanese-clarity-and-filter-collapse |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| implementation_mode | `enhance`（先行 #1202 でカード型タイムライン実装済。本タスクは言葉の平易化 + 段階開示 + 整列の追従改善） |
| 上流 | _shared-context.md（真因・方針・AC 正本） |
| 下流 | Phase 2（設計） |
| 状態 | completed |

## 目的

`/admin/audit`（監査ログ）画面を **非エンジニアの管理者でも直感的に操作できる**よう、英語表記・技術キー名の露出を日本語へ平易化し、フィルタフォームを段階開示（よく使う項目 + 詳細な絞り込み）へ再構成し、カードブロックを整列するための **要件を確定する**。本 Phase では、スコープ・受入条件（AC-1〜AC-12）・対象資産 inventory・既存コードの命名規則・タスク分類（VISUAL / UI task）・スコープ外を固定し、後続 Phase の手戻りをゼロにする。**API / D1 / Google Form schema / shared 型は一切変更しない**ことを Phase 1 時点で不変条件として宣言する。

## 実行タスク

1. **P50 前提確認（Step 0）**: current branch / worktree の実装状態を `git` / `grep` で確認し、「現状 = #1202 でカード型タイムライン化済・英語表記が UI 露出・フィルタ 8 項目フラット」を記録する。
2. **inventory 確定**: 変更対象 6 実装ファイル（`auditGlossary.ts` / `AuditLogPanel.tsx` / `AuditLogCard.tsx` / `auditAppliedFilters.ts` / `AuditPurposeGuide.tsx` / `globals.css`）+ テストファイル 4 本を `outputs/phase-01/main.md` に列挙する。
3. **命名規則の分析と記録**: React コンポーネントは PascalCase（ファイル名 = export 名）、ヘルパは camelCase、helper / 定数モジュールは camelCase ファイル名（`auditGlossary.ts` / `auditAppliedFilters.ts`）、CSS は `.admin-audit-*` BEM 風という current 規則を確定する。新規 helper / map 名の命名一貫性を担保する（[FB-SDK-07-4]）。
4. **AC-1〜AC-12 の本文列挙**: `_shared-context.md` §5 の AC を番号付きで転記し、各 AC が test 検証可能であることをチェックする。
5. **VISUAL タスク宣言**: 本タスクが VISUAL（UI/UX 変更あり）であることを宣言し、Phase 11 で screenshot を取得する旨を Phase 1 で確定する（[Feedback 3] 対策）。
6. **スコープ外の明示**: CSV エクスポート / total 件数 / query param キー名の日本語化 / 他 admin 画面の同種改善 / 未登録 action コードの SSOT 網羅を OOS として明記する。
7. **spec-extraction-map 作成**: ユーザー要望 → 真因 R-1〜R-5 → AC → 変更ファイルのトレース表を `outputs/phase-01/spec-extraction-map.md` に作成する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse/_shared-context.md | 真因・方針・AC・ファイル一覧の集約正本 |
| 必須 | docs/30-workflows/completed-tasks/admin-audit-log-japanese-clarity-and-filter-collapse/index.md | タスク全体像 |
| 必須 | apps/web/src/components/admin/auditGlossary.ts | 用語集 SSOT（拡張対象・既存 map 確認） |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本（token 名実在確認） |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX 設計原則 | `.claude/skills/aiworkflow-requirements/references/ui-ux-design-principles-core.md` | 階層・余白・段階開示の設計指針 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | primitive catalog / 再利用方針 |
| アーキテクチャ境界 | `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | apps/web → apps/api 境界（D1 直接禁止） |
| API endpoint surface | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | audit endpoint query param キー（参照のみ・変更なし） |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値 JSON 正本・HEX 禁止ルール |
| 必須 | docs/00-getting-started-manual/specs/09c-primitives.md | primitive catalog |

## 実行手順

### ステップ 1: P50 前提確認（Step 0）

- `git status` / `git log --oneline -5` で current branch の実装状態を確認する。
- 以下のコマンドで現状の英語表記露出を `grep` で裏取りする:

```bash
grep -nE "label=\"action\"|label=\"actorEmail\"|label=\"targetType\"|auditId|batch-id \(uuid\)" \
  apps/web/src/components/admin/AuditLogPanel.tsx apps/web/src/components/admin/AuditLogCard.tsx
grep -nE "label: \"action\"|label: \"actor\"|label: \"target" \
  apps/web/src/components/admin/auditAppliedFilters.ts
```

- 記録内容: **「現状は #1202 でカード型タイムライン + 用語ガイド + appliedFilters 可視化済。しかし `AuditLogPanel.tsx` の `FormField` label に技術キー名（`action` / `actorEmail` / `targetType` / `targetId` / `from (JST)` / `to (JST)` / `batchId` / `limit`）が直接渡され、`auditAppliedFilters.ts` のチップ label が英語固定、`AuditLogCard.tsx` が `item.action` / `item.targetType` を生表示。フィルタ 8 項目はフラットに並ぶ。本タスクは API / 型を変えず表現層で日本語化 + 段階開示 + 整列する。」**

### ステップ 2: inventory と命名規則の確定

- `outputs/phase-01/main.md` に下記を書く:
  - 「対象 inventory 表」: 6 実装ファイル + テスト 4 本（既存追従 / 新規の区別を Phase 4 で確定）
  - 「命名規則表」: PascalCase / camelCase / `.admin-audit-*` BEM 風
  - 「AC-1〜AC-12 番号付き列挙」と test 検証可能性
  - 「VISUAL タスク宣言」
  - 「スコープ外」

### ステップ 3: spec-extraction-map の作成

- `outputs/phase-01/spec-extraction-map.md` に「ユーザー要望 → 真因 R-1〜R-5 → AC → 変更ファイル」のトレース表と、system spec ↔ current code anchor の対応表を書く。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | inventory・命名規則・AC を concern（C1/C2/C3）の module map に変換 |
| Phase 4 | AC-1〜AC-12 を verify suite（vitest）に変換。テスト 4 本の対象を確定 |
| Phase 7 | AC マトリクスのトレース起点 |
| Phase 10 | gate 判定（GO/NO-GO）の根拠 |
| Phase 11 | VISUAL 宣言を screenshot-plan.json（mode: VISUAL）に反映 |
| Phase 12 | implementation-guide.md の入力 |

## 多角的チェック観点（AIが判断）

| 観点 | 不変条件 / AC | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | `apps/web` から D1 binding に触れない（`safeServerFetch` 経由のまま）。inventory に D1 直接アクセスを含めない |
| 既存 API のみ接続 | ui-prototype #1 / AC-9 | audit endpoint query param キー（`action`/`actorEmail`/`targetType`/`targetId`/`from`/`to`/`batchId`/`cursor`/`limit`）を変更しない。`<input name>` は英語維持 |
| OKLch トークン正本 | ui-prototype #2 / AC-8 | token 名は `tokens.css` 実在値のみ。HEX を inventory に書かない |
| FormField 経由 | #9 / AC-10 | 直接 `<input>` を増やさず既存 `FormField` を維持する |
| 新規 primitive 禁止 | ui-prototype #3 / AC-10 | 既存 `Card` / `FormField` / `Input` / `Select` / `Button` / `Chip` / native `<details>` のみを列挙する |
| VISUAL 分類固定 | [Feedback 3] | Phase 1 でタスク分類を VISUAL に固定し、Phase 11 で再判定時に参照させる |
| 命名一貫性 | [FB-SDK-07-4] | 新規 helper（`describeAuditAction` 等）・map（`AUDIT_ACTION_LABELS` 等）が既存 camelCase / UPPER_SNAKE 規則と整合する |
| 挙動不変 | AC-12 | 検索 / リセット / ページネーション / PII マスク / JSON 開示 / エラー親切メッセージは inventory 上「挙動不変で温存」と明記する |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | P50 Step 0（実装状態 git/grep 確認） | 1 | completed | #1202 実装済・英語露出を記録 |
| 2 | inventory 確定（6 実装 + テスト 4） | 1 | completed | main.md |
| 3 | 命名規則の分析・記録 | 1 | completed | PascalCase / camelCase / `.admin-audit-*` |
| 4 | AC-1〜AC-12 番号付き列挙 + test 可能性 | 1 | completed | main.md |
| 5 | VISUAL タスク宣言 | 1 | completed | Phase 11 screenshot 前提 |
| 6 | スコープ外明示 | 1 | completed | CSV / query param 日本語化 / 他画面を除外 |
| 7 | spec-extraction-map 作成 | 1 | completed | 要望 → 真因 → AC → ファイル |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義の実体（Step 0 / inventory / 命名規則 / AC-1〜12 / VISUAL 宣言 / スコープ外） |
| ドキュメント | outputs/phase-01/spec-extraction-map.md | 要望 → 真因 R-1〜R-5 → AC → 変更ファイルのトレース表 |
| メタ | artifacts.json | Phase 1 を completed に維持 |

## 完了条件

- [ ] `outputs/phase-01/main.md` に Step 0（#1202 実装済 + 英語露出の記録）が書かれている
- [ ] 変更対象 6 実装ファイル + テスト 4 本が inventory 表で列挙されている
- [ ] 命名規則（PascalCase / camelCase / `.admin-audit-*` BEM 風）が表で記録されている
- [ ] AC-1〜AC-12 が番号付きで本文に列挙され、各 AC の test 検証手段が併記されている
- [ ] VISUAL タスク宣言（Phase 11 screenshot 前提）が明記されている
- [ ] スコープ外（CSV / query param 日本語化 / 他画面 / 未登録 SSOT 網羅）が明記されている
- [ ] `outputs/phase-01/spec-extraction-map.md` に要望 → 真因 → AC → ファイルのトレース表が完成している

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜7 が完了している
- [ ] `outputs/phase-01/{main,spec-extraction-map}.md` が指定パスに配置されている
- [ ] AC-9（API / D1 / Form / shared 型 変更ゼロ）が要件本文で不変条件として宣言されている
- [ ] token 名が `tokens.css` 実在値のみで構成され、HEX 直書きが要件本文に存在しない
- [ ] 新規 primitive 追加ゼロ方針（AC-10）が記録されている
- [ ] artifacts.json の Phase 1 ステータスが completed に整合している

## 次Phase

- 次: Phase 2（設計）
- 引き継ぎ事項: inventory 表 / 命名規則表 / AC-1〜AC-12 / VISUAL 宣言 / spec-extraction-map
- ブロック条件: `outputs/phase-01/main.md` の inventory が未完成、または AC が test 検証手段にマップされていない場合は Phase 2 に進めない
