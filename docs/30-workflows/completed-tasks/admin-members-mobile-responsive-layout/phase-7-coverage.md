# Phase 7: カバレッジ

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 7 / 13
- 前提: Phase 6（テスト追加）完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004） / visual_category: VISUAL

## 目的

本タスクの変更（F1 の属性追加部分 / F2 の CSS）に対するカバレッジ計測方針を確定する。BEFORE-QUIT-002 / Feedback 5 に従い、カバレッジ対象を**変更ファイル（F1 MembersTable.tsx の追加属性部分）に限定**し、全ファイル一律のカバレッジ指定にしない。カード化 CSS（F2）は jsdom 非適用のためカバレッジ計測対象外とし、Playwright 視覚検証でカバーする役割分担を明記する。

## 実行タスク

### Step 1: カバレッジ対象範囲の限定（BEFORE-QUIT-002 / Feedback 5 対応）

- カバレッジ計測の対象は **本タスクで変更したファイル（F1 `MembersTable.tsx`）の追加属性部分**に限定する。
- **全ファイル一律指定（`--coverage` をリポジトリ全体に適用）はしない**。本タスクは属性追加 + CSS という限定スコープであり、無関係ファイルのカバレッジ低下や全体閾値の誤判定を持ち込まない（BEFORE-QUIT-002）。
- 計測コマンド（対象ファイル限定）:
  ```bash
  mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
    src/features/admin/components/__tests__/MembersTable.spec.tsx \
    --coverage \
    --coverage.include='src/features/admin/components/_members/MembersTable.tsx'
  ```
  > `--coverage.include` で F1 のみに絞り、変更ファイル限定のカバレッジを得る（Feedback 5: 変更箇所限定）。include glob / オプション名は vitest のバージョンに合わせ実装時に確認する。

### Step 2: F1 追加属性部分のカバレッジ目標と網羅観点

- F1 の変更は JSX 属性の追加（`data-component` / `data-role` / 各 `<td>` の `data-label` / `data-cell`）であり、ロジック分岐の追加はない（I-3: ロジック・props・条件分岐は不変）。
- したがってカバレッジ目標は「追加属性が render される行（statement / line）が、追加 TC-MT-21〜24 の render により全て実行される（covered）」こと。新規の branch（if/三項）は追加していないため、branch カバレッジは既存と同等を維持する。

| 対象（F1 の追加属性） | 網羅する TC | 期待 |
| --------------------- | ----------- | ---- |
| ラッパー `data-component="admin-members-table"` | TC-MT-21 | render され covered |
| `<thead>` `data-role="table-head"` | TC-MT-23 | render され covered |
| `<td data-label="メール">` ほか 5 項目 | TC-MT-22 | 各 `data-label` が render され covered |
| ラベルなしセルの `data-cell="select/member/actions"` | TC-MT-21〜24 の render（行描画） | render され covered |
| 機械可読id（行 testid / aria-label） | TC-MT-24 | render され covered（回帰ガード） |

### Step 3: 追加 TC-MT-21〜24 が F1 の新規属性を網羅することの確認観点

- TC-MT-21〜24 を実行したとき、F1 で追加した全属性が描画パスを通過する（=該当 JSX 行が covered になる）ことを確認する。
- 確認方法:
  1. Step 1 のコマンドで `MembersTable.tsx` のカバレッジレポートを取得。
  2. 追加属性を含む JSX 行が uncovered（赤行）として残っていないことを確認する。
  3. uncovered 行が属性追加箇所に存在する場合、対応する TC が不足しているため Phase 6 へ差し戻し、TC を補う。
- 目標: F1 の追加属性箇所に uncovered 行ゼロ。

### Step 4: カード化 CSS（F2）のカバレッジ対象外宣言と役割分担

- F2（`globals.css` のカード化 `@media` ブロック）は **CSS であり、vitest / jsdom のカバレッジ計測対象ではない**。jsdom は `@media (max-width: 640px)` を適用せず、CSS の適用結果（display:block 化 / `::before` ラベル表示）を評価しない（SSOT §3.1 / phase-2 Step 5）。
- したがって F2 のカバレッジは unit test では測れない。F2 の動作検証は **Playwright（F4 `admin-members-mobile.spec.ts`）の視覚検証**が担う（役割分担）:

| 検証層 | 対象 | カバー内容 |
| ------ | ---- | ---------- |
| vitest（jsdom / unit） | F1 属性 | 属性の存在・機械可読id 不変・DOM 不変（line/branch カバレッジ計測対象） |
| Playwright（実ブラウザ） | F2 CSS 適用結果 | 375/414/640px カード表示・横はみ出しゼロ・公開トグル可視・1280px テーブル維持（カバレッジ計測対象外。視覚 / レイアウトで担保） |

- この役割分担を明記することで「F2 のカバレッジが 0% に見える」ことを欠陥ではなく設計通りと判定できる（false negative 排除）。

### Step 5: カバレッジ閾値の扱い（誤判定回避）

- 本タスクでリポジトリ全体のカバレッジ閾値を新規に課さない / 引き上げない。属性追加 + CSS のスコープに見合った変更ファイル限定の確認に留める。
- coverage-guard（pre-push）は sync-merge の merge commit でスキップされる運用（CLAUDE.md）であり、本タスクの feature commit では通常通り効く。変更ファイル限定の計測で uncovered を出さないことを目標とし、全体閾値での誤検知を持ち込まない。

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| SSOT | `outputs/shared-context.md` | F1/F2/F4 役割（§2）・CSS 設計（§3.1〜3.3）・テスト方針（§6） |
| テスト追加 | `phase-6-test-additions.md` | TC-MT-21〜24 の実装観点 |
| 設計 | `phase-2-design.md` | jsdom が `@media` 非適用（Step 5）/ unit vs Playwright 役割分担 |

## 実行手順

1. Step 1（カバレッジ対象を F1 に限定 / 全ファイル一律指定しない）の方針を確定。
2. Step 2（F1 追加属性のカバレッジ目標）を定義。
3. Step 3（TC-MT-21〜24 が F1 新規属性を網羅）の確認観点を実行。
4. Step 4（F2 CSS は計測対象外・Playwright が役割分担）を明記。
5. Step 5（全体閾値の誤判定回避）を確認。
6. 結果を `outputs/phase-7/coverage-report.md` に記録。

## 統合テスト連携

- 本フェーズのカバレッジ計測は Phase 6 で追加した TC-MT-21〜24 + 既存 TC-MT-01〜20 を入力とする。
- F2 CSS の Playwright 視覚検証は Phase 11（VISUAL Evidence）の screenshot 証跡へ連携する。
- local implementation 段階ではカバレッジコマンドは未実行（pending）であり、実装済み。追加 runtime 確認時に結果を coverage-report に確定する。

## 多角的チェック観点（AIが判断）

- 品質系: 変更ファイル限定の計測で「実際に触った行が covered か」を精密に評価し、全体閾値の希釈を排除する（BEFORE-QUIT-002）。
- リスク系: F2 CSS をカバレッジ対象に含めると「測れないものを 0% と誤判定」するリスク → 対象外宣言 + Playwright 役割分担で回避。
- 整合性系: F1（unit でカバー）/ F2（Playwright でカバー）の二層を明示し、抜け・二重評価をなくす。

## サブタスク管理

| ID | 内容 | status（spec段階） |
| -- | ---- | ------------------ |
| C7-1 | カバレッジ対象を F1 に限定（全ファイル一律指定しない） | pending |
| C7-2 | F1 追加属性のカバレッジ目標定義 | pending |
| C7-3 | TC-MT-21〜24 が F1 新規属性を網羅する確認 | pending |
| C7-4 | F2 CSS 計測対象外 + Playwright 役割分担を明記 | done（方針確定） |
| C7-5 | 全体閾値の誤判定回避を確認 | pending |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| カバレッジレポート（変更行限定） | `outputs/phase-7/coverage-report.md` |

## 完了条件

- [ ] カバレッジ対象を F1（`MembersTable.tsx`）に限定し、全ファイル一律指定をしていない（BEFORE-QUIT-002 / Feedback 5）。
- [ ] F1 追加属性箇所に uncovered 行ゼロ（TC-MT-21〜24 で網羅）。
- [ ] F2 カード化 CSS をカバレッジ計測対象外と明記し、Playwright 視覚検証で担保する役割分担を記録。
- [ ] リポジトリ全体のカバレッジ閾値を新規に課さず、誤判定を持ち込まない。

## タスク100%実行確認【必須】

- [x] 変更ファイル限定のカバレッジ方針を定義
- [x] F1 追加属性のカバレッジ目標を定義
- [x] TC-MT-21〜24 の F1 網羅確認観点を定義
- [x] F2 CSS の対象外宣言と Playwright 役割分担を明記
- [x] 全体閾値の誤判定回避を明記

## 次Phase

[phase-8-refactor.md](phase-8-refactor.md) — リファクタリングと重複 / drift 確認。
