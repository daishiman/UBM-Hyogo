# Phase 12: ドキュメント — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

Phase 12 strict 7 outputs を `outputs/phase-12/` 配下に実体配置する。本ファイルはその発注書と実体化済み成果物の索引として機能する。

## 1. 中学生レベルの説明（implementation-guide.md 用要旨）

### このタスクは何？

エラーが起きた時にWebサイトに表示される「エラー画面」で、画面が出た瞬間に **見出し（タイトル）に自動でカーソル（フォーカス）を移す** 機能を追加します。

### なぜ必要？

目が見えにくい人が使う「読み上げソフト」（スクリーンリーダー）は、画面上のどこにカーソルがあるかを基準に文字を読み上げます。カーソルが前のページの場所に残ったままだと、新しく出てきたエラーメッセージに気付くのが遅れてしまいます。

### 何をする？

エラー画面の `<h1>画面を表示できませんでした</h1>` という見出しに、画面が出た瞬間カーソルが自動的に移るようにします。これでスクリーンリーダーが「画面を表示できませんでした」とすぐ読み上げてくれます。

### スクロール抑制

`preventScroll: true` という設定を入れることで、カーソルが移っても **画面が勝手にトップにスクロールしない** ようにします。スマホで使っている人が画面位置を見失わないための工夫です。

### 用語

| 用語 | 中学生向け説明 |
|---|---|
| focus / フォーカス | 画面上の「今ここを使っています」というカーソル位置 |
| h1 | ページの大見出し |
| useRef | React が用意した「特定の要素に印を付ける」仕組み |
| useEffect | 画面が表示された後に何かをやる仕組み |
| tabIndex={-1} | キーボードの Tab キーでは飛ばないけど、プログラムからは focus できる印 |
| preventScroll | focus が移ったとき画面を勝手にスクロールしないお願い |
| screen reader | 画面の内容を音声で読み上げてくれるソフト |
| aria-live="assertive" | 「ここの内容が変わったらすぐ読み上げて」の印 |

## 2. 技術者向け要約（implementation-guide.md Part 2 用）

- `apps/web/app/error.tsx` に `useRef<HTMLHeadingElement>(null)` を追加し、h1 を bind
- 既存 `useEffect([error])` 末尾に `headingRef.current?.focus({ preventScroll: true })` を追加
- h1 に `ref={headingRef}` + `tabIndex={-1}` を付与
- `apps/web/app/__tests__/error.component.spec.tsx` に TC-U-09a/b/c（focus 移譲 / tabIndex / preventScroll 引数）を追記
- 差分は 4 行 + テスト 1 ブロック
- parallel-07 spec section 4.3「Root error.tsx focus 管理」DoD 達成

## 3. system-spec-update-summary.md 用要旨

- `docs/00-getting-started-manual/specs/` 配下への正本仕様更新は **なし**（spec はすでに parallel-07 で記載済、実装が追いついていなかった）
- `.claude/skills/aiworkflow-requirements/references/workflow-issue-769-root-error-focus-artifact-inventory.md` を追加し、workflow root / 実装 / テスト / evidence の検索導線を同期

## 4. documentation-changelog.md 用要旨

- `docs/30-workflows/issue-769-root-error-focus/` 新規作成（Phase 1-13 + outputs）
- `docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` のステータスを `pending → consumed_by_issue_769_local_implementation` へ更新
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md` の i06 行を `implemented_local_evidence_captured` へ更新

## 5. skill-feedback-report.md 用要旨

- task-specification-creator skill: 既存テストファイル `__tests__/error.component.spec.tsx` の存在を Phase 2 設計時に発見できたのは Read 検索のおかげ。skill フォーマット内に「対象ファイルの周辺 spec を 1 度 grep 検索する」ステップを明示すると初期設計時の手戻りを減らせる
- aiworkflow-requirements skill: workflow root を current canonical set に登録するため、`resource-map.md` / `quick-reference.md` / `task-workflow-active.md` / artifact inventory / changelog を同一 wave で更新

## 6. unassigned-task-detection.md 用要旨

本タスクから派生する followup（CONST_007 例外条件: 横展開は本タスク単体完了後に分離してよい範囲）:

| 候補 | 判断 |
|---|---|
| `useAutoFocusOnMount(ref)` 共通 hook 抽出 | i05 + i06 merge 完了後に必要性を再評価（並列実行中の衝突回避。現時点では未タスク化しない） |
| `/profile/error.tsx` への同パターン適用 | 親 spec で要求されておらず、別 PR で実施 |
| `/admin/error.tsx` への同パターン適用 | 同上 |

上記は **本実装の先送りではなく横展開候補**。i05 merge 完了前に共通 hook 化すると並列実装の責務境界を壊すため、`outputs/phase-12/unassigned-task-detection.md` に「未タスク化しない」判断を記録する。今回サイクル内の root `error.tsx` 実装・テスト・証跡は完了させる。

## 7. phase12-task-spec-compliance-check.md 用要旨

CONST_005 必須項目チェック:

| 項目 | 状態 |
|---|---|
| 変更対象ファイル一覧 | ✅ index.md / phase-2 §2 |
| 関数シグネチャ | ✅ phase-2 §3（不変） |
| 入力・出力・副作用 | ✅ phase-2 §5 |
| テスト方針 | ✅ phase-4 全体 / phase-6 §2 |
| ローカル実行・検証コマンド | ✅ phase-5 §4 / phase-9 §1 |
| DoD | ✅ index.md / phase-10 §1 |

CONST_007 単一サイクルチェック:

- ✅ 全 Phase 仕様が 1 サイクル内で完了可能
- ✅ root `error.tsx` の本実装先送りなし
- ✅ 横展開（共通 hook 抽出）は外部依存 (i05 merge) のため本実装と分離理由を §6 で明記
