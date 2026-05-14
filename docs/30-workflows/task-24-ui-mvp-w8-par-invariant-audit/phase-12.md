# Phase 12: ドキュメント更新

## Task 12-1: 実装ガイド（2 パート構成）

### Part 1: 中学生レベルの概念説明

#### この監査タスクが何をするのか

「家のルール」を例にすると分かりやすい。家には「靴は玄関で脱ぐ」「ご飯の前に手を洗う」みたいな**6 つのルール**がある。家族 22 人がいて、それぞれが新しいことをやるたびに、本当にルールを守れているかをチェックするのがこの仕事。

このプロジェクトでは:

- ルール 1: 「新しい API は作らず、もうある API だけを使うこと」
- ルール 2: 「色は決められたパレットから選び、HEX (`#ff0000` みたいな書き方) を直接書かないこと」
- ルール 3: 「画面パーツ（ボタン・カードなど）は決められた種類だけ使い、勝手に新しい種類を増やさないこと」
- ルール 4: 「データベース (D1) には Web 側から直接触らず、必ず API 側を経由すること」
- ルール 5: 「同意のチェック項目には決まった名前 (`publicConsent` / `rulesConsent`) を使うこと」
- ルール 6: 「お試しで作った古いプロトタイプを本番に持ち込まないこと」

これを 22 件のタスク全部に対して **横並びの表 (22 行 × 6 列)** にまとめて、「守れている / 守れていない / 関係ない」を一目で見られるようにする。それが今回の成果物。

#### なぜ必要か

ルールを守れているかは個別タスクの中では見えにくい。22 人が独立に動くと、こっそりルール違反が混ざることがある。だから全員を横並びにして「俯瞰の地図」を作る。次の人（task-27）はこの地図を見て、どこを直すべきか判断する。

#### 何をするか

1. 6 つのルールごとに「探す言葉のリスト」を作る（例: `bg-[#` という文字列を探す）
2. 22 タスクの仕様書とソースコードを順番に検索する
3. 結果を表にまとめ、見つかった違反は「ファイル名 : 何行目」まで書き残す
4. 元のコードは絶対にいじらない（壊さないため）

### Part 2: 技術的詳細（開発者向け）

#### インターフェース

```ts
type Invariant = "INV-1" | "INV-2" | "INV-3" | "INV-4" | "INV-5" | "INV-6";
type TaskId =
  | "task-01" | "task-02" | "task-03" | "task-04" | "task-05"
  | "task-06" | "task-07" | "task-08" | "task-09" | "task-10"
  | "task-11" | "task-12" | "task-13" | "task-14" | "task-15"
  | "task-16" | "task-17" | "task-18" | "task-19" | "task-20"
  | "task-21" | "task-22";
type Cell = "COMPLIANT" | "VIOLATION" | "N/A";
type Matrix = Record<TaskId, Record<Invariant, Cell>>;

interface Violation {
  task: TaskId;
  invariant: Invariant;
  file: string;       // absolute path
  line: number;
  excerpt: string;    // 該当行の引用
  reason: string;
}
```

#### 監査スクリプト API

`audit-runner.sh <output-dir>`:
- 入力: なし（リポジトリルートから実行）
- 出力: `<output-dir>/grep-evidence.txt`, `<output-dir>/matrix.tsv`, `<output-dir>/violations.md`
- 終了コード: 0 (常に成功、判定は出力ファイルで行う)

#### grep パターン定数

| INV | パターン | 対象 |
|-----|---------|------|
| INV-2a | `bg-\[#\|text-\[#\|border-\[#` | apps/web/src |
| INV-2b | `#[0-9a-fA-F]{6}` | apps/web/src/**/*.{ts,tsx,css}（tokens.css 除外） |
| INV-4a | `D1Database\|env\.DB` | apps/web/src |
| INV-4b | `\[\[d1_databases\]\]` | apps/web/wrangler.toml |
| INV-5 | `(publicConsent\|rulesConsent\|consent[A-Z][a-zA-Z]+)` | apps/web/src + apps/api/src |
| INV-6 | `gas-prototype` | apps/ + packages/ |

#### エラーハンドリング

- ファイル不在: `find` が空を返した場合は当該セルを `N/A` とする
- grep 0-hit: `|| echo "NO_MATCH"` でラップし `COMPLIANT` 判定
- 1-hit 以上: ファイル + 行番号を violations.md に記録

#### エッジケース

- tokens.css 自体は HEX/OKLch 定義を持つため INV-2 では除外する
- task spec ファイル内の例示コードブロックの HEX は false positive 候補 → 人手レビューで除外
- camelCase 以外の consent キー (`public_consent` 等) は本監査スコープ外（INV-5 は camelCase 限定）

#### 視覚証跡

**UI/UX 変更なしのため Phase 11 スクリーンショット不要**

代替証跡:
- `phase-10/final-review-result.md`（受入条件再確認）
- `phase-11/manual-test-result.md`（grep 実行記録）

## Task 12-2: システム仕様書更新

### Step 1-A: タスク完了記録

- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` の関連タスク表に task-24 を `spec_created` で追加
- `docs/30-workflows/ui-prototype-alignment-mvp-recovery/EXECUTION-ORDER.md` の W8 par に task-24 を追加
- LOGS.md（workflow root）に Phase 12 close-out を追記

### Step 1-B: 実装状況テーブル

実装は監査スクリプト + matrix 生成のため、実装完了時に `completed` へ更新する想定（本仕様書時点は `spec_created`）。

### Step 1-C: 関連タスク

- upstream: task-01 〜 task-22 (全 `completed`)
- downstream: task-27 (本監査の matrix を消費)

### Step 2: 新規インターフェース追加

なし（監査スクリプトと markdown 生成のみ）→ **Step 2 N/A**

## Task 12-3: documentation-changelog.md

`outputs/phase-12/documentation-changelog.md` に Step 1-A / 1-B / 1-C / Step 2 の判定を全件記録。

## Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md`:
- 監査結果で `VIOLATION` が出た場合は、各違反を `unassigned-task/` に格下げ起票候補とする
- 0 件でも本ファイルは必ず出力

## Task 12-5: skill-feedback-report.md

`outputs/phase-12/skill-feedback-report.md`:
- 改善点なしの場合でも「改善なし」と明記して出力
- 監査タスクテンプレート（`phase-template-audit-task.md`）の適用所感を記録

## Task 12-6: phase12-task-spec-compliance-check.md

`outputs/phase-12/phase12-task-spec-compliance-check.md` に Phase 12 の 6 成果物揃いを root evidence として残す。
