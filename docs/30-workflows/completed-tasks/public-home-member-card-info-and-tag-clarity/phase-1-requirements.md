# Phase 1: 要件定義

- Phase 目的: スコープ・受入条件・タスク分類・命名規則・既存コード inventory を固定する。
- 入力: ユーザー報告（staging ホーム画面メンバーカード）、4 並列 Explore 調査結果、AskUser 2 問の回答。
- 出力: 本ファイル（AC-1..AC-9 正本）。

## 1.1 実装区分の判定（CONST_004）

**[実装区分: 実装仕様書]**（デフォルト）。

判定根拠: 目的達成には apps/web のコンポーネント / util / CSS 変更、apps/api の list field projection 変更、packages/shared の zod 型追加が必須であり、「動作させる」「整える」がコード変更なしでは達成不可能。docs-only の例外条件（純粋にドキュメント・調査・合意形成で完結）には該当しない。

## 1.2 タスク分類

- taskType: `implementation`
- visualEvidence: **VISUAL**（公開ホーム画面のカード見た目を変更する）→ Phase 11 は screenshot 計画を持つ（実 capture は後続実装プロンプト / staging deploy 後・user-gated）。
- implementation_mode: `edit`（既存ファイル改修が主。新規は `tag-display.ts` と各 spec のみ）。

## 1.3 P50 前提確認

| 確認項目 | 結果 |
| --- | --- |
| current branch に実装が存在するか | No（本プロンプトは spec 作成のみ。実装は後続） |
| upstream マージ済みか | N/A（新規 workflow・relatedIssue=null） |
| 前提タスク完了済みか | Yes。`expand=tags`（issue-224）と公開メンバー詳細 businessOverview（既存）は実装済み。本タスクはそれらを home カードへ「接続・表現」する |

## 1.4 根本原因（確定）

index.md「根本原因」表を正本とする。要約:
1. **表記**: interest タグ label が seed で `0to1`（矢印なし）。web に表示正規化が無く raw を直出し（`TagPicker.client.tsx`）。
2. **カード情報不足**: `MemberCard.tsx` がタグを描画せず、home `listMembers` が `expand=tags` 未使用。
3. **category 混在**: タグ表示に優先度/フィルタが無く region(阪神) が混ざる。
4. **事業概要不在**: list の `SUMMARY_KEYS` に businessOverview 無し。

### 無罪確認（API/D1/Form を変更しない根拠）
- `GET /public/members?expand=tags` は **API 実装済み**（`list-public-members.ts` L86-102）。web が使っていないだけ。
- `businessOverview` は既存 `response_fields` カラム。詳細 endpoint が既に公開。list の projection（SUMMARY_KEYS）に足すだけ＝**新 endpoint / D1 schema / Form 変更なし**。
- **ubmZone chip は本タスク対象外**: ユーザー報告の「0 to 1」は member_tags の interest label（`0to1`）であり、「阪神」と同列＝tag 系。ubmZone（form field）は別系で現行挙動を維持。

## 1.5 命名規則 inventory（FB-01 / FB-SDK-07-4）

| 種別 | 規則 | 例 |
| --- | --- | --- |
| util 関数 | camelCase | `normalizeTagLabel` / `selectCardTags` |
| 新規ファイル | kebab-case | `tag-display.ts` |
| tag display markup | 既存に倣い `data-role` 属性 span | `data-role="tag-chip"` / `data-role="biz-summary"` |
| tone | 既存 `ChipTone` union のみ（新 tone 禁止） | `cool` / `warm` / `amber` / `info` |
| test ファイル | `*.spec.{ts,tsx}` のみ（不変条件 #8） | `tag-display.spec.ts` |

## 1.6 Acceptance Criteria（正本）

| AC | 内容 | 検証 |
| --- | --- | --- |
| **AC-1** | interest タグ label を web で矢印正規化表示（`int_0to1→0→1`/`int_1to10→1→10`/`int_10to100→10→100`、code 駆動・label fallback）。API/D1/seed 非変更 | `tag-display.spec.ts` / `git diff apps/api` 空 |
| **AC-2** | タグ表示に category 優先（interest>business>skill）+ 除外（region/role/status 非表示）を導入 | `tag-display.spec.ts` |
| **AC-3** | home `/` と `/members` の listMembers で `expand=tags` 有効化 | API query に `expand=tags` / カードに tags 到達 |
| **AC-4** | MemberCard に curated タグ chip 行（comfy: フェーズ+最大3 / dense: 最大2 / list: フェーズのみ）。既存 primitive 流用・新規禁止 | `MemberCard.spec.tsx` |
| **AC-5** | list endpoint に `businessSummary`（businessOverview 先頭1行・cap120字）追加。zod optional。カードに line-clamp 2 表示 | `list-public-members.spec.ts` / `MemberCard.spec.tsx` |
| **AC-6** | occupation 視認性向上 + region タグ排除で情報過多回避 | Phase 11 視覚 + `MemberCard.spec.tsx` |
| **AC-7** | TagPicker topTags chip にも同正規化 util 適用 | `TagPicker` 表示確認 / spec |
| **AC-8** | OKLch トークン正本・HEX 直書き禁止 | `verify:tokens` green |
| **AC-9** | 既存 endpoint surface のみ・新 endpoint/schema/Form 変更なし。1 サイクル完結 | `git diff apps/api`（projection のみ）/ migration 追加0 |

## 1.7 スコープ外（先送りではなく本質的範囲外・CONST_007）

- タグ master / category 再設計（admin tag catalog）— 既存 category で足りる。
- seed label の正本修正 — Q1 で web 変換を選択。
- ubmZone chip 表記 — 別系・現行維持。
- メンバー詳細ページのリッチ化 — 別 workflow（`public-member-detail-survey-fields-richness`）で対応済み。

→ いずれも本サイクルで実装する必要がなく、未タスク（バックログ）化も不要（既存で充足 or 別 workflow 済み）。

## 1.8 carry-over 確認

`git log --oneline -5` の直近コミットは tag 物理削除 / member_tags 孤児ガード / tag code 編集 UI 等で、本タスク（公開カード表現）と独立。衝突なし。

## Canonical Compliance Addendum

## メタ情報

- task_id: `public-home-member-card-info-and-tag-clarity`
- taskType: `implementation`
- visualEvidence: `VISUAL`
- workflow_state: `implemented_local_evidence_captured`

## 目的

本 Phase の上部本文を正本とし、AC-1..AC-9 を実コード・テスト・証跡へ接続する。

## 実行タスク

- [x] Phase 本文の該当タスクを完了
- [x] 実装対象・検証対象を AC trace に接続
- [x] Phase 12 / artifacts の状態語彙と整合

## 参照資料

- `index.md`
- `artifacts.json`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`
- `docs/00-getting-started-manual/specs/01-api-schema.md`

## 成果物/実行手順

本ファイル本文の手順と `artifacts.json.metadata.verify_commands` を正本とする。実装済み成果物は `apps/web` / `apps/api` / `packages/shared` と Phase 11 / 12 outputs に反映済み。

## 完了条件

- [x] AC trace が維持されている
- [x] focused tests が PASS している
- [x] Phase 11 local visual evidence が存在する
- [x] Phase 12 strict 7 が存在する

## 統合テスト連携

focused Vitest 6 files / 50 tests PASS を主証跡とし、typecheck / lint / verify:tokens / verify:phase12-compliance / gate-metadata を全体 gate とする。

