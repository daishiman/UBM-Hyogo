# Implementation guide — UT-GOV-003 CODEOWNERS governance paths

## Part 1: 中学生レベル概念説明（4 概念）

なぜ必要かを先に説明します。誰がどの場所を見守るのかを決めておかないと、後で人が増えたときに「どこを誰に相談すればいいか」が分かりにくくなります。何をするかというと、フォルダごとに担当者の名札を貼る手順を決めます。

### 今回作ったもの

今回作ったものは、CODEOWNERS を安全に置くための「手順書一式」と、実際の `.github/CODEOWNERS` 差分です。具体的には、どの棚にどの名札を貼るか、貼る前にどの名前の揺れを確認するか、貼った後にどう検査するかを Phase 1〜13 と Phase 11/12 の証跡にまとめました。

### 1.1 CODEOWNERS は「この棚は誰の担当」を貼った名札

学校の図書館をイメージしてください。棚に「歴史コーナー: 山田先生」「理科コーナー: 鈴木先生」と名札が貼ってあると、誰でも本を借りられるけれど「困ったらこの先生に聞けばいい」が分かりやすくなります。

GitHub の `.github/CODEOWNERS` というファイルは、これと同じく「このフォルダの担当はこの人」を**書いた名札集**です。`docs/30-workflows/**` というフォルダに `@daishiman` という名札を付けておくと、誰かがそのフォルダのファイルを変更したときに「この PR は daishiman さんに見てもらうといいよ」と GitHub が自動で知らせてくれます。

### 1.2 なぜ「最後にマッチした行が勝つ」のか

CODEOWNERS の名札は、上から順番にめくっていって、**最後に当てはまった名札だけが有効**になる、という独特なルールです。

例えば:

```
docs/30-workflows/** @yamada
* @library-master
```

この順だと、`docs/30-workflows/foo.md` を変更したときも「最後の名札 `* @library-master`」が**全部に当てはまる**ので、結局 `@library-master` が担当になってしまい、`@yamada` の名札が**消されて**しまいます。

正しくはこう書きます:

```
* @library-master
docs/30-workflows/** @yamada
```

「全部の棚: 図書館長」を**先に**書いて、その後に「歴史コーナーだけ別: 山田先生」と書く。こうすると `docs/30-workflows/foo.md` は最後に当てはまる `@yamada` の名札が勝つので、ちゃんと山田先生の担当になります。

**覚え方**: 「**広い名札を上、せまい名札を下**」。逆に書くと、広い名札が下からせまい名札を上書きしてしまいます。

### 1.3 なぜ `doc/` と `docs/` の表記揺れが問題か

このリポジトリの古い記録には `docs/00-getting-started-manual/` と書かれていて、現在の正規ディレクトリは `docs/00-getting-started-manual/` と `docs/30-workflows/` です。**末尾に s が付くか付かないか**だけの違いですが、コンピュータから見るとまったく**別のフォルダ**です。

CODEOWNERS の名札に「`doc/30-workflows/** @daishiman`」と書いてしまうと、実際のフォルダは `docs/`（s 付き）なので、この名札は**どこにも貼られません**（空振り）。逆に「`docs/30-workflows/**`」と書けば正しく貼られます。

だから CODEOWNERS を整備する**前に**、リポジトリの中で `doc/` と `docs/` のどちらに統一されているかを棚卸しして、揃えておく必要があります。本リポジトリでは `docs/`（s 付き）に統一する方針です。

### 1.4 なぜ solo 運用なのに整備するか

このリポジトリは今のところ daishiman さん 1 人で運用しています（solo 運用）。「1 人しかいないのに名札を貼る意味あるの？」と思うかもしれません。

理由は 3 つあります:

1. **将来の手伝い役のため**: いつか他の人が手伝いに来たときに「この棚は誰の責任か」が紙に書いてあると、説明が要らなくて楽。
2. **監査のため**: 外部の人が「このプロジェクトの責任者は誰？」を確認するときに、CODEOWNERS が answer 代わりになる。
3. **GitHub UI の suggested reviewer 表示**: PR を作ると GitHub が「この PR は誰に見てもらうといいよ」と自動で提案してくれる。1 人運用でも将来の習慣作りとして有効。

ただし、**今すぐ「先生のサインがないと本を貸さない」ルール（必須レビュアー化）にはしません**。GitHub の `require_code_owner_reviews=true` というフラグは ON にしないので、CODEOWNERS は「ある種のメモ」として機能します。将来人が増えたら、その時に ON に切り替えれば良い。

---

## Part 2: 開発者向け技術詳細

### 2.1 CODEOWNERS 文法サマリー

- ファイルパス: `.github/CODEOWNERS`（または `docs/CODEOWNERS` / `CODEOWNERS` だが `.github/` 配下が推奨）
- 書式: 1 行 1 ルール、`<path-pattern> <owner1> <owner2> ...`
- コメント: `#` で始まる行
- glob: gitignore 風だが完全互換ではない（`**` の挙動 / 末尾 `/` で差異）
- **最終マッチ勝ち**: 上から順に評価し、最後にマッチした行のみ有効

### 2.2 TypeScript 型定義

```ts
type CodeownersOwner = `@${string}`;

interface CodeownersRule {
  pattern: string;
  owner: CodeownersOwner;
  rationale: string;
  order: number;
}

interface CodeownersValidationResult {
  errors: Array<{
    line: number;
    kind: "Invalid pattern" | "Unknown owner" | "Permission";
    message: string;
  }>;
}

interface GovernancePathSpec {
  taskType: "docs-only / spec_created";
  visualEvidence: "NON_VISUAL";
  requireCodeOwnerReviews: false;
  rules: CodeownersRule[];
}
```

### 2.3 5 governance path の glob

```
# .github/CODEOWNERS

# (1) global fallback を先頭に置く
*  @daishiman

# (2) governance path を後段に置く（最終マッチ勝ち仕様で前段を上書き）
docs/30-workflows/**             @daishiman
.claude/skills/**/references/**  @daishiman
.github/workflows/**             @daishiman
apps/api/**                      @daishiman
apps/web/**                      @daishiman
```

> **重要**: 後段に汎用 glob (`*.md @someone` 等) を**追加しない**。最終マッチ勝ち仕様で governance path が上書きされる事故を防ぐため、本ファイルは「先頭 1 行 fallback + 5 governance path」の固定形を維持する。

### APIシグネチャ

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!.worktrees'
git ls-files .github/CODEOWNERS
```

### 使用例

```bash
# 1. CODEOWNERS の存在確認
git ls-files .github/CODEOWNERS

# 2. `doc/` / `docs/` 表記の棚卸し
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!.worktrees'

# 3. GitHub の CODEOWNERS validator
gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'
```

### 2.4 `doc/` → `docs/` 棚卸し手順

```bash
# (a) `doc/` 表記の全文棚卸し
rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!.worktrees'

# (b) 残置候補をレビューし、外部リンク等の不可避ケースのみ残置
#    残置箇所は documentation-changelog.md に「外部リンク等の不可避ケース」として明示記録

# (c) CLAUDE.md 内の旧 `doc/` 誤記を `docs/` へ置換
#    現在の実フォルダ名は `docs/00-getting-started-manual/`。
#    過去 workflow / changelog / archive 内の `doc/` 文字列は履歴引用として残る可能性があるため、
#    allow-list と修正対象を分ける。
```

> **注**: 現在の正規ディレクトリは `docs/00-getting-started-manual/`（設計仕様正本）と `docs/30-workflows/`（ワークフロータスク仕様）である。過去文書に残る `doc/` 文字列は単純一括置換せず、履歴引用 / 外部リンク / 実リンク切れ修正を分類して扱う。

### 2.5 `gh api .../codeowners/errors` 検証

```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
```

期待値:

```json
{
  "errors": []
}
```

L4 fixture（赤シナリオ）:

```bash
# 一時的に存在しない user を 1 行追加
echo "/tmp/dummy-path @nonexistent-bot-handle-xyz" >> .github/CODEOWNERS
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
# 期待: errors[].kind = "Unknown owner"
git checkout .github/CODEOWNERS  # 即 revert
```

### エラーハンドリング

| エラー | 検出方法 | 対応 |
| --- | --- | --- |
| `Invalid pattern` | `gh api .../codeowners/errors` | glob を `**` 形式へ戻し、末尾 `/` 単独表記を避ける |
| `Unknown owner` | `gh api .../codeowners/errors` | owner を `@daishiman` に戻す。team handle は権限付与後の別タスクで扱う |
| suggested reviewer 不表示 | test PR smoke | team 権限不足、last-match-wins 順序、対象 path の空振りを Phase 6 T6/T9/T8 の順で切り分ける |
| `doc/` 誤置換 | `rg` 棚卸しと link checklist | 実リンクは `docs/` に直し、履歴引用は allow-list 化する |

### エッジケース

| ケース | 方針 |
| --- | --- |
| `docs/00-getting-started-manual/` と `docs/30-workflows/` の正規共存 | 役割を明示して維持する |
| `* @daishiman` を末尾に置いた場合 | governance path が fallback に上書きされるため禁止 |
| owner が全行 `@daishiman` のため UI 上の差が見えない場合 | 仕様上の順序不変条件として `head` / `awk` で fallback 冒頭を検査する |
| GitHub UI の suggested reviewer 反映遅延 | manual-smoke-log に観察時刻と再読込結果を記録する |

### 設定項目と定数一覧

| 定数 | 値 |
| --- | --- |
| `CODEOWNERS_PATH` | `.github/CODEOWNERS` |
| `OWNER` | `@daishiman` |
| `REQUIRE_CODE_OWNER_REVIEWS` | `false` |
| `TASK_TYPE` | `docs-only / spec_created` |
| `VISUAL_EVIDENCE` | `NON_VISUAL` |
| `GOVERNANCE_PATHS` | `docs/30-workflows/**`, `.claude/skills/**/references/**`, `.github/workflows/**`, `apps/api/**`, `apps/web/**` |

### テスト構成

| 階層 | 検証 |
| --- | --- |
| L1 構文 | `.github/CODEOWNERS` の path / owner token を目視と `gh api` で検証 |
| L2 boundary | `* @daishiman` が冒頭 1 行、governance path が後段であることを確認 |
| L3 API | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'` が `[]` |
| L4 red fixture | 存在しない owner を一時指定し、`Unknown owner` が検出されることを確認して即 revert |

### 2.6 test PR による suggested reviewer 観察

`outputs/phase-11/manual-smoke-log.md` のコマンド系列を再掲（5 path × 1 ファイル touch → draft PR → `gh pr view --json reviewRequests` → close --delete-branch）。

### 2.7 CI 連携可能性（unassigned-task として記録）

将来 [`mszostok/codeowners-validator`](https://github.com/mszostok/codeowners-validator) action を `.github/workflows/verify-codeowners.yml` に追加し、CODEOWNERS 構文 / owner 解決を CI で gate する案。本タスク段階では C-1 として未割当タスク化するに留め、UT-GOV-004（required status checks context sync）と context 名整合させて実装する。

### 2.8 将来 `require_code_owner_reviews` 有効化への移行手順

solo 運用が解消され contributor 体制になった際の移行手順:

1. **CODEOWNERS 完全性確認**: `gh api .../codeowners/errors` で `errors: []` を再確認
2. **team handle 採用判断**: 個人 handle から team handle へ移行する場合、GitHub 組織側で対象 team が当該リポジトリに **write 以上**の権限を持つことを事前確認（権限不足だと silently skip）
3. **branch protection 更新**: UT-GOV-001 で適用済みの branch protection を更新し、`required_pull_request_reviews.require_code_owner_reviews=true` を ON にする
4. **過渡期 smoke**: 1 PR で test 走させ、CODEOWNERS 不備で全 PR が block されないことを確認
5. **ロールバック手順**: フラグを OFF に戻すコマンドを 1 行で実行可能な状態にしておく（`gh api -X PATCH repos/.../branches/main/protection` の patch 1 件）

### 2.9 ロールバック手順（本タスク）

```bash
# .github/CODEOWNERS を直前 commit に戻す
git checkout HEAD~1 -- .github/CODEOWNERS
git commit -m "revert: rollback codeowners governance paths"
```

CODEOWNERS は 1 ファイルのみのため衝突リスクは低い。`doc/` → `docs/` 棚卸し差分のロールバックは別 commit に分離する。

### 2.10 本タスクで扱わない事項

- 1Password シークレット URI / Cloudflare API token / OAuth: 本タスクは GitHub governance のみ
- `scripts/cf.sh` ラッパー: Cloudflare 操作は無し
- branch protection の本適用: UT-GOV-001 スコープ
- workflow の status check 名整合: UT-GOV-004 スコープ
