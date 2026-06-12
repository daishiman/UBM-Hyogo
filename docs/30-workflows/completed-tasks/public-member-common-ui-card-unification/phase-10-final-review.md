---
spec_classification: implementation_spec
state: spec_created
phase: 10
phase_name: 最終レビュー
task_id: public-member-common-ui-card-unification
---

# Phase 10: 最終レビュー

## メタ情報

| キー | 値 |
|------|----|
| task_id | `public-member-common-ui-card-unification` |
| 対象 | AC-1..AC-12 の充足判定 / カード化マッピング全行 traced / blocker 判定 / Phase 11・13 引き継ぎ |
| 方針 | 各 AC に PASS 条件と検証方法を明示し、未達は blocker / MINOR で分類する |

---


## 目的

AC-1..12 の充足とカード化マッピング全行 traced を確認し、blocker を判定して Phase 11/13 への引き継ぎ条件を固める。

## AC-1..AC-12 充足チェックリスト

| AC | 条件（要約） | PASS 条件 | 検証方法 |
|----|------------|----------|---------|
| AC-1 | `components/ui/layout/` に5プリミティブ + index.ts 新設、`@/components/ui/layout` から import 可 | 6ファイル存在 + barrel re-export 整合 | `ls apps/web/src/components/ui/layout/` / typecheck（import 解決） |
| AC-2 | `ButtonLink.tsx` が Button と同一 variant/size 体系 | variant(primary/accent/ghost/soft/danger)・size(sm/md/lg) を持つ | ButtonLink.spec.tsx（全 variant/size の data 属性検証）GREEN |
| AC-3 | ボタン直書き 0（`<a data-variant>` / `.ui-button-*`） | Phase 9 grep ヒット 0 | `grep -rn 'data-variant='`（実装除外）/ `grep -rn 'ui-button-'`（TSX/TS）= 0 |
| AC-4 | カード化マッピング全行が新層へ移行、ベタ書き div の情報グループ 0 | 後述「マッピング全行 traced」が全行 ✅ | 本ファイル §マッピング全行 traced + `grep page-head` = 0 |
| AC-5 | 背景・最大幅・余白が PageShell に集約 | page/layout の背景/max-width 直接指定 0 | `grep -rnE 'bg-\[|max-w-\[|background:'` = 0 |
| AC-6 | privacy/terms 本文が Prose 経由 | privacy/terms が `Prose` 利用、LegalProse 縮退 | `grep -rn 'import.*LegalProse'` = 0（または stub）/ Prose 利用確認 |
| AC-7 | 既存 data-testid/aria-label/role 保持、既存 spec GREEN | apps/web vitest 既存 component spec 全 GREEN | `pnpm --filter @ubm/web test` |
| AC-8 | HEX 直書き 0 / inline style 0 | verify:tokens + verify:no-inline-style exit 0、CSS HEX grep 0 | Phase 9 AC-8 コマンド群 |
| AC-9 | apps/api 変更 0 | `git diff --name-only dev...HEAD \| grep '^apps/api/'` count = 0 | Phase 9 AC-9 コマンド |
| AC-10 | typecheck/lint/build/vitest 全 GREEN | 6コマンド全 exit 0 / 全 GREEN | Phase 9 §一括判定 |
| AC-11 | 新プリミティブ5種 + ButtonLink に spec 存在し GREEN | 6 spec ファイル存在・全 PASS | `ls .../layout/*.spec.tsx` + vitest GREEN |
| AC-12 | 8画面の視覚証跡取得計画が Phase 11 に定義（spec_created では pending） | Phase 11 に8画面分の screenshot 計画が記載 | `phase-11-manual-test.md` 確認（実 PNG は pending） |

> spec_created 段階では AC-3..AC-11 の実行結果は pending（実装後に埋める）。AC-1/AC-2/AC-11/AC-12 の「計画・設計の存在」は本仕様書群で充足済み。

---

## カード化マッピング表 全行 traced 確認（AC-4 の核心）

> Phase 1 §カード化マッピング表の**全行を1行ずつ**「情報のかたまり → 割当先プリミティブ」で traced する。1行でも未移行（ベタ書き div 残存）があれば AC-4 FAIL。

### `/`（Home）

| # | 情報のかたまり | 割当先 | traced |
|---|--------------|--------|:------:|
| 1 | ヒーロー | `SectionCard`(tone=accent) | ☐ |
| 2 | 統計4項目 | `SectionCard` + `ContentCard`×4 | ☐ |
| 3 | About UBM | `SectionCard` + `ContentCard`×2 | ☐ |
| 4 | 注目メンバー | `SectionCard` + `MemberCard`(ContentCard 基盤) | ☐ |
| 5 | タイムライン | `SectionCard` + `ContentCard` rows | ☐ |
| 6 | CTA | `SectionCard`(tone=accent dark) | ☐ |

### `/members`

| # | かたまり | 割当先 | traced |
|---|---------|--------|:------:|
| 7 | ページ見出し+density | `PageHeader`(actions=DensityToggle) | ☐ |
| 8 | 絞り込み | `SectionCard`(subtle) | ☐ |
| 9 | 一覧 | `MemberCard`(ContentCard 基盤・interactive) | ☐ |

### `/members/[id]`

| # | かたまり | 割当先 | traced |
|---|---------|--------|:------:|
| 10 | 戻る導線+見出し | `PageHeader`(lead=戻る導線) | ☐ |
| 11 | プロフィールヒーロー | `SectionCard`(hero) | ☐ |
| 12 | 事業概要/タグ/リンク | 各 `SectionCard`(grid-2) | ☐ |
| 13 | 自己紹介/メッセージ | 各 `ContentCard` | ☐ |
| 14 | 詳細項目(dl) | `SectionCard` + `KVList` | ☐ |
| 15 | 活動 | `SectionCard` | ☐ |

### `/register`

| # | かたまり | 割当先 | traced |
|---|---------|--------|:------:|
| 16 | 見出し | `PageHeader` | ☐ |
| 17 | 登録案内 | `SectionCard` | ☐ |
| 18 | フォームプレビュー | `SectionCard` 群 | ☐ |

### `/privacy`・`/terms`

| # | かたまり | 割当先 | traced |
|---|---------|--------|:------:|
| 19 | 見出し | `PageHeader` | ☐ |
| 20 | 本文 | `SectionCard` + `Prose` | ☐ |

### `/profile`

| # | かたまり | 割当先 | traced |
|---|---------|--------|:------:|
| 21 | 見出し+操作 | `PageHeader`(actions=EditCta) | ☐ |
| 22 | 写真アップロード | `SectionCard` | ☐ |
| 23 | ステータス | 既存 `Banner`(カード内 alert) | ☐ |
| 24 | 公開プレビュー | `SectionCard`(hero-split) | ☐ |
| 25 | 公開設定/可視性 | 各 `SectionCard` | ☐ |
| 26 | 反映タイミング注記 | `ContentCard`(subtle) | ☐ |
| 27 | プロフィール項目 | `SectionCard` + `KVList` | ☐ |
| 28 | 申請操作 | `SectionCard`(dialog 維持) | ☐ |
| 29 | 出席履歴 | `SectionCard` | ☐ |

### `/login`

| # | かたまり | 割当先 | traced |
|---|---------|--------|:------:|
| 30 | ページ枠 | `PageShell`(bare・max-width=narrow) | ☐ |
| 31 | ログインカード | `SectionCard`(auth)に LoginPanel 内包 | ☐ |

> 実装後、各行の traced を ✅ に更新する。**全31行 ✅ で AC-4 PASS**。未移行行が1つでも残れば AC-4 FAIL（blocker）。

---

## blocker 判定基準

| 分類 | 条件 | 扱い |
|------|------|------|
| **BLOCKER** | AC-3/4/5/7/8/9/10 のいずれか FAIL（ボタン直書き残存・カード化漏れ・背景未集約・既存 spec RED・HEX/inline style 残存・apps/api 変更・typecheck/lint/build/vitest FAIL） | PR 不可。Phase 5/8/9 へ差し戻して修正、本サイクル内で解消（CONST_007・I-10） |
| **BLOCKER** | カード化マッピング31行に未 traced（✅ 未達）行が1つ以上 | AC-4 FAIL として差し戻し |
| **MINOR** | 機能・AC は満たすが改善余地（非対象 feature クラス、admin 適用、追加 a11y 強化） | Phase 12 で current / out-of-scope / baseline non-issue に分類。current は今回サイクルで修正し、BLOCKER の格下げは禁止 |

> 本タスクは I-10（1サイクル完了 / CONST_007）に従い、BLOCKER は先送りせず本サイクルで解消する。MINOR もまず current かどうかを判定し、current は同サイクルで修正する。

---

## MINOR 指摘 → Phase 12 分類ルール [unassigned-task-guidelines]

- スコープ内 AC を満たす前提で、改善余地（MINOR）は Phase 12 で `current` / `out-of-scope inventory` / `baseline non-issue` に分類する。`current` は未タスク化せず今回サイクルで修正する。
- 分類候補（現時点で想定される MINOR）:
  - **admin 画面への共通レイアウト層適用**: out-of-scope inventory。一般ユーザー対象外・別 IA のため今回要件外。新規 Issue は作らず、非起票理由を記録する。
  - **globals.css の非対象 feature クラスのさらなる削減**: baseline non-issue。本タスク対象8画面に無関係なクラスは触らない。
  - **ダークモード対応**: MVP 非対象。今回のカード化・背景・ボタン共通化 AC に含めず、非起票理由を記録する。
- 未タスク化が必要な場合は CONST_005 の例外条件（外部依存待ち、合意未済の仕様分岐、本実装と独立した大規模スコープ）を満たす理由・実施時期・管理場所を明記し、ユーザーへエスカレーションする。BLOCKER を MINOR に格下げして未タスク化することは禁止。

---

## Phase 11（視覚証跡）/ Phase 13（PR）引き継ぎ条件

### Phase 11（視覚証跡）への引き継ぎ条件

- AC-10（typecheck/lint/build/vitest 全 GREEN）が PASS していること。
- カード化マッピング31行が全て ✅（AC-4 PASS）であること。
- 8画面（`/`, `/members`, `/members/[id]`, `/register`, `/privacy`, `/terms`, `/profile`, `/login`）の screenshot を Phase 11 計画に従い取得する（VISUAL カテゴリ・AC-12）。spec_created 段階では screenshot は pending。
- 視覚証跡は「カード枠・背景・ボタンが新層で統一されたこと」を before/after で確認できる粒度で取得する。

### Phase 13（PR）への引き継ぎ条件

- AC-1..AC-11 が全て PASS（実行結果が埋まっている）。
- AC-12 の screenshot が Phase 11 で取得済み（VISUAL のため PR 本文に参照を含める）。
- BLOCKER 0 件。MINOR は Phase 12 で current / out-of-scope / baseline non-issue に分類済み。
- PR は base=`dev`。実装・commit・PR はユーザー明示承認後（workflow_state: spec_created の間は実行しない）。

---

## 実行タスク

1. AC-1..AC-12 充足チェックリストを実装後の実行結果で埋める。
2. カード化マッピング31行を1行ずつ traced（✅）にし、未移行 0 を確認する。
3. blocker 判定基準で未達 AC を BLOCKER / MINOR に分類し、BLOCKER は差し戻して本サイクルで解消する。
4. MINOR を Phase 12 分類ルールに従い記録する（current は同サイクル修正、BLOCKER の格下げ禁止）。
5. Phase 11・13 への引き継ぎ条件を満たすことを確認する。

---

## 参照資料

| 種別 | Path | 用途 |
|------|------|------|
| 要件 | `phase-1-requirements.md` | AC-1..AC-12・カード化マッピング表 |
| QA | `phase-9-qa.md` | AC 機械検証コマンドの結果 |
| カバレッジ | `phase-7-coverage.md` | 新プリミティブ spec カバレッジ |
| 視覚証跡 | `phase-11-manual-test.md` | screenshot 取得計画（AC-12） |
| ドキュメント | `phase-12-documentation.md` | MINOR 分類 / strict 7 evidence |

---


## 成果物

- `phase-10-final-review.md`（AC 充足チェックリスト / マッピング traced 表 / MINOR 分類ルール）

## 統合テスト連携

本タスクは apps/web 表現層の UI 共通化であり、統合観点の検証は apps/web vitest（component spec）と Phase 11 の Playwright screenshot 回帰で行う。apps/api との統合 contract は変更しない（I-1: 既存 endpoint surface のみ・D1 / Form 不変）。各 Phase の成果物は次 Phase の入力へ連結する（AC trace: Phase 1 → 4 → 5 → 9/10 → 11）。

## 完了条件

- [ ] AC-1..AC-12 の充足チェックリストが全 PASS（実装後）。
- [ ] カード化マッピング31行が全行 traced（✅）= AC-4 PASS。
- [ ] BLOCKER 0 件。MINOR は Phase 12 で current / out-of-scope / baseline non-issue に分類済み。
- [ ] Phase 11・13 への引き継ぎ条件を満たす。
