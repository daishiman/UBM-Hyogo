# Phase 6: テスト追加

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 6 / 13
- 前提: Phase 4（テスト計画）/ Phase 5（実装）完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004） / visual_category: VISUAL

## 目的

Phase 4 で計画した追加テスト（TC-MT-21〜24）を実装し、fail path / 回帰ガードを拡充する。具体的には (a) 機械可読id の回帰ガード、(b) `data-label` 全項目の網羅検証、(c) デスクトップ DOM 不変の回帰観点、(d) Playwright F4 の中間幅・空状態観点を追加する。既存 TC-MT-01〜20 を 1 件も壊さないことを保証する。

> 本フェーズはテスト**仕様**の確定であり、コード実装の実行は Phase 5 実装サイクル側で行う。本書は実装者が従う手順とテスト観点を定義する。

## 実行タスク

### Step 1: 機械可読id 回帰ガードの実装（観点 a）

`MembersTable.spec.tsx`（F3）に TC-MT-24 として、属性追加（F1）後も既存の機械可読id が逐語不変で解決することを検証するテストを追加する。検証対象（I-2 正本）:

| 機械可読id | 検証方法 | 期待 |
| ---------- | -------- | ---- |
| 行 testid `admin-members-row-{memberId}` | `container.querySelector('[data-testid="admin-members-row-{memberId}"]')` | 各行で truthy（追加属性後も解決） |
| 編集 aria-label `{fullName} を編集` | `getByLabelText('{fullName} を編集')` または `getByRole('button', { name: '{fullName} を編集' })` | 解決する |
| 全選択 aria-label `全選択` | `getByLabelText('全選択')` | 解決する |
| `data-testid="chip-dot"` | `querySelectorAll('[data-testid="chip-dot"]')` | 既存個数を維持 |
| `data-testid="member-state-chip-row"` | `querySelector` | 解決する |

> aria-label / testid は逐語一致で照合する。文言を変更してはならない（I-2）。SSOT §4 I-2 の文字列を正本とする。

### Step 2: `data-label` 全項目網羅検証の実装（観点 b）

TC-MT-22 として、データ `<td>` に付与された `data-label` が SSOT §3.2 のマップ通り全項目存在することを検証する。網羅対象（5 項目）:

| 項目 | 期待 `data-label` 値 |
| ---- | -------------------- |
| メール | `メール` |
| 区画 / ステータス | `区画 / ステータス` |
| タグ | `タグ` |
| 最終更新 | `最終更新` |
| 公開 | `公開` |

- 検証コード例（逐語一致 / data-driven で網羅漏れを防ぐ）:
  ```ts
  const expectedLabels = ['メール', '区画 / ステータス', 'タグ', '最終更新', '公開'];
  for (const label of expectedLabels) {
    expect(container.querySelector(`td[data-label="${label}"]`)).toBeTruthy();
  }
  ```
- 5 項目すべてが DOM に存在することを確認する。1 項目でも欠落すれば fail とする（網羅 fail path）。

### Step 3: `data-component` / `data-role` 存在検証（TC-MT-21 / TC-MT-23）

- TC-MT-21: ラッパー `<div>` に `data-component="admin-members-table"` が存在すること（`container.querySelector('[data-component="admin-members-table"]')` が truthy）。
- TC-MT-23: `<thead>` に `data-role="table-head"` が存在すること（`querySelector('[data-role="table-head"]')` が truthy）。

### Step 4: デスクトップ DOM 不変の回帰観点（観点 c）

- jsdom は CSS `@media` を適用しないため、unit test 上の DOM は常にデスクトップ相当（テーブル構造）である。これを利用し、属性追加後も以下が不変であることを回帰観点として検証する:
  - `<table>` 要素が 1 個のみ存在（DOM 二重描画なし＝カード用 DOM が増えていない / I-3）。
  - 行 `<tr data-testid="admin-members-row-*">` の個数が入力 props の会員数と一致（行の追加/欠落なし）。
  - 各行の `<td>` 個数が 8（チェック/メンバー/メール/区画ステータス/タグ/最終更新/公開/操作）で不変（セル順序・個数不変 / I-3）。
- これにより「カード化のために DOM を二重化していない」「デスクトップ表示の DOM が壊れていない」を unit レベルで担保する（AC-4 / AC-5 の回帰ガード）。

### Step 5: Playwright F4 の追加観点（中間幅・空状態）

`apps/web/playwright/tests/admin-members-mobile.spec.ts`（F4）に、Phase 4 の基本観点（375px カード / 公開トグル可視 / 1280px テーブル維持）に加えて以下を追加する:

| 追加観点 | viewport / 状態 | 期待 |
| -------- | --------------- | ---- |
| 中間幅 414px でのカード表示 | 414px viewport | カードレイアウト（縦積み）が適用され、`scrollWidth <= clientWidth + 許容誤差`（横はみ出しゼロ）。AC-1 の 414px を実ブラウザで確認 |
| 境界値 640px でのカード適用 | 640px viewport | `@media (max-width: 640px)` の境界（640px は含む）でカード化が適用されること |
| 境界値 641px でのテーブル維持 | 641px viewport | カード CSS 非適用・`<thead>`（`data-role="table-head"`）が視覚的に可視（desktop 維持 / I-6） |
| 空状態 EmptyState 時の挙動 | 会員 0 件（モバイル 375px） | EmptyState が表示され、横はみ出しが発生しない。カード化 CSS が空テーブルでレイアウト崩れを起こさない |

- 空状態は `MembersTable` が会員 0 件を受け取ったときの描画（EmptyState / 既存の空表示）を対象とする。`tr` が存在しない場合でもカード化 CSS（`tbody`/`tr`/`td` への `display:block`）が副作用を起こさないことを確認する。
- 414px / 640px / 641px の境界値は AC-1（375/414/640px カード）と I-6（≥641px テーブル維持）の境界回帰を実ブラウザで押さえる目的。
- Playwright 起動不可環境（worktree / CI 制約）では本観点を実行できないため、Phase 11 で `CAPTURE_BLOCKED` を記録し、unit test PASS + 手動 375/414/640/1280px スクリーンショットを代替証跡とする（ダミーPNG禁止 / SSOT §2 F4 注記）。

### Step 6: 既存 TC-MT-01〜20 非破壊の確認手順

- 追加 TC は新規 `it()` ブロックとして append し、既存 TC-MT-01〜20 の記述・期待値・render 設定を一切変更しない。
- 既存 axe a11y テスト（TC-MT-18〜20）は jsdom が `@media` 非適用のため、属性追加後も computed display に影響されず緑を維持する（I-8）。再実行で緑を確認する。
- 確認手順:
  1. 追加前に既存 spec を一度実行し、ベースライン（TC-MT-01〜20 全緑 / 件数）を記録する。
  2. TC-MT-21〜24 を追加後に再実行し、既存件数が減らず（=削除/skip なし）、追加分を含めて全緑であることを確認する。

### Step 7: ローカル実行コマンド（SSOT §7・`mise exec --` 経由）

```bash
# 対象 unit test（targeted）— TC-MT-01〜20 + 追加 TC-MT-21〜24
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/features/admin/components/__tests__/MembersTable.spec.tsx

# Playwright mobile（環境が許せば）— F4 基本観点 + 中間幅 / 空状態
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test admin-members-mobile

# 型・lint（テスト追加に伴う回帰確認）
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

> filter 名 `@ubm-hyogo/web` は `apps/web/package.json` の `name` を実装時に確認（異なれば実値に合わせる）。

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| SSOT | `outputs/shared-context.md` | TC-MT-21〜24 観点（§6）・機械可読id 一覧（§4 I-2）・data-label マップ（§3.2）・検証コマンド（§7） |
| 要件定義 | `phase-1-requirements.md` | AC-7 / I-8（既存test不破壊） |
| 設計 | `phase-2-design.md` | Props vs internal state（VSCPKR-03）/ 役割分担（unit vs Playwright） |
| 既存テスト | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | TC-MT-01〜20 ベースライン |

## 実行手順

1. Step 1（機械可読id 回帰ガード TC-MT-24）を実装。
2. Step 2（`data-label` 全項目網羅 TC-MT-22）を実装。
3. Step 3（`data-component` / `data-role` 存在 TC-MT-21 / TC-MT-23）を実装。
4. Step 4（デスクトップ DOM 不変の回帰観点）を実装テストへ織り込む。
5. Step 5（Playwright F4 の中間幅 414px / 境界 640/641px / 空状態）を追加。
6. Step 6（既存 TC-MT-01〜20 非破壊）の手順で再実行確認。
7. Step 7 のコマンドで targeted vitest / Playwright / typecheck / lint を実行。
8. 結果を `outputs/phase-6/coverage-report.md` に記録。

## 統合テスト連携

- 追加 TC-MT-21〜24 は Phase 9（QA / CI gate）の AC-7 検証（targeted vitest）で再実行され、合否確定する。
- Playwright F4 の中間幅・空状態観点は Phase 11（VISUAL Evidence）で screenshot 証跡へ連携する。
- local implementation 段階では各コマンドは未実行（pending）であり、実装済み。追加 runtime 確認時に結果を coverage-report に確定する。

## 多角的チェック観点（AIが判断）

- 品質系: fail path（data-label 欠落 / testid 解決失敗）を明示的に網羅し、属性追加の取りこぼしを検出可能にする。
- リスク系: 最大リスクは「カード化のための DOM 二重描画で testid 重複」。Step 4 の `<table>` 1 個 / 行個数 / td 個数の不変検証で機械的に抑止する。
- 整合性系: unit（jsdom）は属性存在 + DOM 不変、Playwright（実ブラウザ）はレイアウト（カード/テーブル切替・はみ出し）を担当し、`@media` 非適用の jsdom 限界を補完する役割分担を明確化。

## サブタスク管理

| ID | 内容 | 対応TC / AC | status（spec段階） |
| -- | ---- | ----------- | ------------------ |
| T6-1 | 機械可読id 回帰ガード | TC-MT-24 / AC-5 | pending |
| T6-2 | data-label 全項目網羅 | TC-MT-22 / AC-2 | pending |
| T6-3 | data-component / data-role 存在 | TC-MT-21 / TC-MT-23 | pending |
| T6-4 | desktop DOM 不変回帰観点 | AC-4 / AC-5 | pending |
| T6-5 | Playwright 中間幅 / 境界 / 空状態 | AC-1 / I-6 | pending |
| T6-6 | 既存 TC-MT-01〜20 非破壊確認 | AC-7 / I-8 | pending |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| カバレッジ / テスト観点レポート | `outputs/phase-6/coverage-report.md` |

## 完了条件

- [ ] TC-MT-21（`data-component` 存在）を追加。
- [ ] TC-MT-22（`data-label` 5 項目網羅）を追加。
- [ ] TC-MT-23（`data-role="table-head"` 存在）を追加。
- [ ] TC-MT-24（機械可読id 回帰ガード: row testid / 編集 aria-label / 全選択 aria-label / chip-dot / member-state-chip-row）を追加。
- [ ] デスクトップ DOM 不変（`<table>` 1 個 / 行個数 / td 8 個）の回帰観点を実装テストに織り込む。
- [ ] Playwright F4 に 414px / 640px / 641px 境界・空状態 EmptyState 観点を追加。
- [ ] 既存 TC-MT-01〜20 が件数不変で全緑（追加分のみ増加）を再実行で確認。
- [ ] SSOT §7 の `mise exec --` 経由コマンドで targeted vitest / Playwright / typecheck / lint を記録。

## タスク100%実行確認【必須】

- [x] 機械可読id 回帰ガード観点を定義
- [x] data-label 全項目網羅観点を定義
- [x] desktop DOM 不変回帰観点を定義
- [x] Playwright 中間幅 / 空状態観点を定義
- [x] 既存 TC-MT-01〜20 非破壊確認手順を定義
- [x] ローカル実行コマンドを SSOT §7 準拠で記載

## 次Phase

[phase-7-coverage.md](phase-7-coverage.md) — 変更ファイル限定のカバレッジ計測方針。
