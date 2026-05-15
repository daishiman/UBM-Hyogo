# Phase 12: ドキュメント更新

> Phase: 12 / 13
> 名称: ドキュメント更新
> visual classification: VISUAL

---

## 必須 7 成果物

| Task | 出力先 | 必須 |
|------|--------|------|
| Task 12-1 | `outputs/phase-12/main.md`（Phase 12 root summary） | 必須 |
| Task 12-2 | `outputs/phase-12/implementation-guide.md`（Part 1 + Part 2） | 必須 |
| Task 12-3 | `outputs/phase-12/system-spec-update-summary.md` | 必須 |
| Task 12-4 | `outputs/phase-12/documentation-changelog.md` | 必須 |
| Task 12-5 | `outputs/phase-12/unassigned-task-detection.md`（0 件でも出力） | 必須 |
| Task 12-6 | `outputs/phase-12/skill-feedback-report.md`（改善点なしでも出力） | 必須 |
| Task 12-7 | `outputs/phase-12/phase12-task-spec-compliance-check.md`（root evidence） | 必須 |

---

## Task 12-1: main.md

Phase 12 root summary と strict 7 file inventory、Phase 11 視覚証跡 8 枚へのリンクを記録する。

---

## Task 12-2: 実装ガイド（Part 1 + Part 2）

### Part 1: 中学生レベル概念説明

**何を作るの？**

学校のホームページを想像してください。生徒がログインボタンを押した瞬間、画面はすぐには切り替わりません。インターネットが少し遅いと、何も表示されないまま 1〜2 秒待たされて「壊れたのかな？」と不安になりますよね。

このタスクでは「**ちょっと待ってね、今読み込んでます**」と分かる、**シルエットの絵**（スケルトン）を表示します。さらに、エラーが起きたときも「**エラーが起きました**」というメッセージを、**目の不自由な人にも音声で読み上げてくれる形**で出します。

**なぜ必要なの？**

- 待ち時間に何も表示されないと、ユーザーは「壊れた」と思って離脱してしまう
- 目の見えない人が画面読み上げソフトを使っている時、エラーが「沈黙」のままだと気付けない
- ボタンを押した後に「フォーカス（次の操作対象）」がどこに行ったか分からないと、キーボードだけで操作する人が迷子になる

**どう作るの？**

1. ログイン画面の **読み込み中の絵** を新しく作る（灰色のシルエットがポワッと点滅する）
2. ログイン画面のエラー表示を **カード型のデザイン** に統一する
3. エラーが出たら、自動的に **エラーメッセージの見出しに目印（フォーカス）** を移す（読み上げソフトが反応する）
4. 色は **すべて OKLch という新しい色の指定方法** で書き、ピンポイントで色を埋め込まない
5. **動きを減らしたい人の設定**（OS の「視差効果を減らす」など）を尊重し、点滅をやめる

**どんな良いことがある？**

- 待ち時間が短く感じる
- 目の不自由な人にもエラーが伝わる
- 色を一括で変えたい時、1 箇所直すだけで全画面に反映される
- アニメーションが苦手な人にも優しい

---

### Part 2: 技術者向け詳細

#### 成果物

- `apps/web/app/login/error.tsx`（編集: Card layout + focus 管理）
- `apps/web/app/login/loading.tsx`（新規: OKLch skeleton + role=status）
- `apps/web/app/error.tsx`（編集: focus 管理追加）
- `apps/web/app/profile/loading.tsx`（編集: skeleton 統一）
- `apps/web/app/loading.tsx`（検証）
- `apps/web/app/not-found.tsx`（検証）

#### 主要設計判断

| 判断 | 理由 |
|------|------|
| `Card` / `CardContent` 既存 primitive 利用 | 新 primitive 増殖を防ぐ |
| `tabIndex={-1}` + `useEffect` focus | screen reader 読み上げを促進、`aria-live` と併用 |
| `motion-safe:animate-pulse` | prefers-reduced-motion 尊重 |
| OKLch token クラスのみ | task-08/09/18 の正本と整合 |
| `role="status"` + `aria-busy="true"` + `aria-live="polite"` | WCAG 4.1.3 Status Messages 適合 |

#### a11y 観点

- error: `role="alert" aria-live="assertive"` で即時アナウンス
- loading: `role="status" aria-busy="true" aria-live="polite"` で控えめアナウンス
- sr-only テキストで visual hidden を確保

#### 視覚証跡

`outputs/phase-11/` に 4 画面 × light/dark = 8 PNG を保存。`manual-test-result.md` に取得条件と a11y 手動検証結果を記録。

#### 入出力契約

| 入力 | 出典 |
|------|------|
| 元仕様 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-07-auth-and-shared/spec.md` |
| OKLch token | `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md` |
| 既存 primitive | `apps/web/src/components/ui/Card.tsx` |

| 出力 | 説明 |
|------|------|
| 6 ファイル | section 5.1 参照 |
| 4 unit spec + 1 e2e spec | Phase 4 参照 |
| 8 PNG | Phase 11 参照 |

---

## Task 12-3: システム仕様更新

### Step 1-A: 完了タスク記録

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/index.md` の「実行済みタスク同期」に `task-parallel-07-auth-and-shared` を追加
- 本タスク root `LOGS.md`（存在すれば）と上位 workflow の `LOGS.md` を同 wave で更新

### Step 1-B: 実装状況テーブル

本実行サイクルでは実コード差分を含むため root `workflow_state` は `implemented_local_runtime_pending` へ再分類する。`artifacts.json` / `index.md` / `phase12-task-spec-compliance-check.md` を同一 wave で同期し、staging smoke / commit / push / PR は Phase 13 user gate に残す。

### Step 1-C: 関連タスクテーブル

task-08 / task-09 / task-18（design-tokens 系）と本タスクの依存関係を index に明記。

### Step 2: システム仕様更新（条件付き）

- 新規 API endpoint: なし
- 新規型 / 定数: なし（`Card` / `CardContent` の既存 API を利用）
- 新規環境変数: なし
- UI / auth route contract: `/login` の状態機械自体は task-13 login rebuild の正本を維持し、本タスクは loading / error / focus / skeleton の UX hardening のみ
- design token contract: 既存 `bg-accent` / `text-panel` / `bg-surface-2` / `text-danger` utility を利用し、token 正本の追加・改名なし
- `admin/loading`: 元仕様の segment-level 例に含まれるが本タスク範囲外。Admin loading は admin workflow owner の責務であり、本 Phase 12 では out-of-scope として記録する

→ Step 2 は **N/A**

---

## Task 12-4: documentation-changelog

各 Step（1-A / 1-B / 1-C / Step 2）の結果を個別に記録。workflow-local 同期と global skill sync を別ブロックで記述。

---

## Task 12-5: 未タスク検出（0 件でも出力必須）

ソース別チェック:

- 元タスク仕様書「スコープ外」項目: 認証ロジック / 新 endpoint / D1 変更
- Phase 3 MINOR 指摘: M1 / M2（Phase 5 で解消済みなら 0）
- Phase 8 候補: C1 / C3 / C4 は今回サイクルで却下または同サイクル採用に閉じる。未タスク化しない
- Phase 10 MINOR / MAJOR: 0 件
- Phase 11 スコープ外発見事項: 取得時メモ
- TODO / FIXME / HACK / XXX: 実装後 grep
- `describe.skip` の旧参照: なし

0 件でも `unassigned-task-detection.md` を出力。本タスクは C1/C3/C4 が候補となる見込み。

---

## Task 12-6: skill-feedback-report

| 観点 | 記録 |
|------|------|
| テンプレート改善 | VISUAL implementation タスクで「Phase 11 で N 画面 × light/dark = 2N 枚」のテンプレ分岐が便利 |
| ワークフロー改善 | Card layout の既存 primitive 確認を Phase 5 で実 file 確認に依存させているが、Phase 2 段階で primitive 表面の snapshot を要求するルールがあると良い |
| ドキュメント改善 | OKLch クラスの対応表（HEX → token クラス）を skill references に追記する案 |

改善点なしでも出力必須。

---

## Task 12-7: phase12-task-spec-compliance-check

Phase 12 Task 12-1〜12-6 / Step 1-A〜1-C / Step 2 判定を root evidence として `phase12-task-spec-compliance-check.md` に集約する。

---

## Phase 12 完了条件

- 必須 7 成果物すべて存在
- `artifacts.json` と `outputs/artifacts.json` の parity 確認（存在する場合）
- LOGS.md / SKILL.md 関連の global sync を `documentation-changelog.md` に記録
- `index.md` の phase 表ステータスを同一 wave で更新
- `outputs/phase-11/*.png` × 8 が参照可能
