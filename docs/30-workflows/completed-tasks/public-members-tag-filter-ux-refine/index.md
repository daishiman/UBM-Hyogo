# public-members-tag-filter-ux-refine — 公開メンバー一覧 タグ絞り込み UI/UX 整え

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 内容 |
|------|------|
| タスクID | public-members-tag-filter-ux-refine |
| 起点 | staging UI/UX 観察（ユーザー報告） |
| 対象 URL | `https://ubm-hyogo-web-staging.daishimanju.workers.dev/members` |
| GitHub Issue | なし（relatedIssue=null・Refs 運用なし） |
| ブランチ | `feat/public-members-tag-filter-ux`（dev 起点） |
| 優先度 | medium |
| 規模 | small〜medium（CSS + 最小 markup 改修） |
| 実装区分 | 実装 |
| implementation_mode | `existing-hardening` |
| screenshot mode | VISUAL（public members 一覧・desktop / mobile） |
| taskType | `implementation` |
| visualEvidence | `VISUAL` |
| workflow_state | `implemented_local_runtime_pending` |
| implementation_state | `implemented_local_runtime_pending` |
| ステータス | `implemented_local_runtime_pending / implementation / VISUAL / local implementation and static visual evidence captured / staging screenshot pending` |

## なぜ docs-only ではなく実装仕様書か（CONST_004 根拠）

ユーザー要望は「タグが縦に並んで見にくい / UI・UX を整えてほしい」。これは
`apps/web` の **CSS（`[data-role="tag-picker-options"]` の display 不在）と最小 markup の修正**
というコード変更でしか達成できない（調査・合意形成では解決不能）。よってラベル上は
UI 観察起点でも、CONST_004 に従い**実装仕様書**として作成する。CONST_005 必須項目
（変更対象ファイル / 関数・構造 / 入出力・副作用 / テスト方針 / 実行コマンド / DoD）を
各 Phase に展開する。

## 真の論点（RCA）

タグ絞り込みが縦並びになる原因は **CSS の欠落**。`TagPicker.client.tsx` の
`<ul data-role="tag-picker-options">` に `display` 系ルールが無く、HTML 既定の block flow で
`<li>` が縦積みになる。`globals.css` / `legacy-public.css` に当該 selector のルールが存在しない
（grep 確認済）。データ・API（`topTags` = `aggregateTopTags()`）は正常で**無罪**。
解決は `apps/web` の UI 表現層（CSS + 最小 markup）のみ。詳細は
[_shared-context.md](_shared-context.md) §1 を参照。

## スコープ

### 含む
- タグ絞り込み chip 群の**横並び flex-wrap 化**（縦積み解消）
- フィルタ領域（検索 / Zone / Status / タグ）の視覚グルーピング・余白・階層整理
- メンバーグリッド（member-grid）の余白・カード階層調整（過密解消・3 密度維持）

### 含まない（スコープ外）
- タグの category 別グルーピング表示（`topTags` フラット配列・API/schema 拡張が必要 = INV-4 違反）
- タグ検索ボックス（現件数では過剰・flex-wrap で発見性十分）
- メンバーカードのデザイン全面刷新（「整える」範囲を超える）
- 新 endpoint / D1 schema / Google Form 変更

> スコープ外項目は Phase 12 の未タスク baseline（YAGNI・非起票）として記録。先送りタスクなし（CONST_007）。

## 不変条件（全 Phase 順守）

詳細は [_shared-context.md](_shared-context.md) §3。要約: INV-1 既存 API のみ / INV-2 OKLch トークン /
INV-3 D1 直接禁止 / INV-4 apps/api・shared・D1・Form 非変更 / INV-5 `*.spec.*` のみ /
INV-6 新規 primitive 禁止 / INV-7 tag-pill の role/aria/挙動 不変。

## 受入条件（AC-1〜AC-11）

[_shared-context.md](_shared-context.md) §4 に正本。要約: AC-1 タグ横並び flex-wrap /
AC-2 フィルタ領域グルーピング / AC-3 選択タグ強調 / AC-4 グリッド余白整理 / AC-5 tag-pill 挙動不変 /
AC-6 OKLch・verify-design-tokens pass / AC-7 新規 primitive 0 / AC-8 apps/api・shared・D1・Form diff 0 /
AC-9 レスポンシブ / AC-10 a11y / AC-11 typecheck・lint・vitest・verify-pr-ready pass。

## 変更対象ファイル

[_shared-context.md](_shared-context.md) §5 に正本。CSS（legacy-public.css / globals.css）+
最小 markup（TagPicker / MemberFilters）+ 既存 spec 更新。合計 ~150 LOC + test 調整。1 サイクル完了。

## 1 サイクル完了スコープ（CONST_007 適合性）

CSS 主体の小規模改修であり、3 ファイル群（CSS / markup / test）は同一サイクル内で
完了できる。Lane（Phase 4-6 / 7-10 / 11-13）の分割は**並列作成のため**であり、
先送りではない。

## implemented_local_runtime_pending VISUAL の証跡境界

本サイクルで `apps/web` のローカル実装、focused test 証跡、local static screenshot PNG 5 件を生成した。
`outputs/phase-11/metadata.json` は `status: local_static_visual_present_staging_pending`、Phase 11 evidence
inventory は local static screenshot 5 件を `present` として扱う。user-gated: commit / push / PR /
staging deploy / staging runtime screenshot capture。詳細は [_shared-context.md](_shared-context.md) §7。

## Phase 一覧

| Phase | ファイル | 状態 |
|-------|---------|------|
| 1 | [phase-01-requirements.md](phase-01-requirements.md) | spec_created |
| 2 | [phase-02-design.md](phase-02-design.md) | spec_created |
| 3 | [phase-03-design-review.md](phase-03-design-review.md) | spec_created |
| 4 | [phase-04-test-design.md](phase-04-test-design.md) | spec_created |
| 5 | [phase-05-implementation.md](phase-05-implementation.md) | implemented_local |
| 6 | [phase-06-test-expansion.md](phase-06-test-expansion.md) | implemented_local |
| 7 | [phase-07-coverage.md](phase-07-coverage.md) | implemented_local |
| 8 | [phase-08-refactor.md](phase-08-refactor.md) | spec_created |
| 9 | [phase-09-qa.md](phase-09-qa.md) | implemented_local |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | implemented_local |
| 11 | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | local_evidence_present_runtime_visual_pending |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | spec_created |
| 13 | [phase-13-pr.md](phase-13-pr.md) | spec_created |

## 参照

- [_shared-context.md](_shared-context.md)（調査 / 方針 / AC / 不変条件 / 変更ファイルの正本）
- 形式テンプレ: `docs/30-workflows/completed-tasks/issue-958-h3-public-filter-ux/`
- CLAUDE.md 重要な不変条件 / UI prototype alignment 不変条件
- `docs/00-getting-started-manual/claude-design-prototype/`（デザイン言語正本）
- `apps/web/src/components/public/{TagPicker,MemberFilters,MemberCard,MemberGrid}`
- `apps/web/src/styles/{globals,legacy-public,tokens}.css`
