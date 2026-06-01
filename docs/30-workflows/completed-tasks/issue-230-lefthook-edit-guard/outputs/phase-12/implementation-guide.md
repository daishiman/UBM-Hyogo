# 実装ガイド — issue-230-lefthook-edit-guard

> 本 workflow は **implemented**（2026-05-31 実装サイクルで 8 ファイル全実装・focused vitest 12 ケース PASS・typecheck/lint green）。
> commit / push / PR は user-gated（未実施）。実装中に Phase 2 設計から 1 点補正（下記「実装中の補正」）。

## 実装結果サマリ

| 項目 | 結果 |
|------|------|
| 変更ファイル | 8（新規 5 + 編集 3） |
| focused vitest | `lefthook-edit-guard.spec.ts` 8 ケース + `verify-hook-integrity.spec.ts` 4 ケース = **12 PASS** |
| typecheck / lint | 6 pkg 全 PASS |
| shellcheck / YAML parse | guard / integrity / workflow / lefthook.yml すべて PASS |
| 実リポジトリ実行 | `verify-hook-integrity.sh` exit 0 / `lefthook-edit-guard.sh`（clean）exit 0 |

### 実装中の補正（Phase 2 設計 → 実装）

Phase 2 設計では手書き hook の除外を `*.sample` 限定としていたが、実リポジトリのメイン `.git/hooks/`
に `post-merge.old` / `pre-commit.old` / `post-fetch.old` という**過去 hook のバックアップ**が存在し、
guard が false positive を起こした。git が実行する hook 名は**拡張子を持たない**（`pre-commit` 等）ため、
除外条件を **ドットを含むファイル名（`*.*`）は git が無視する＝offender にしない** へ一般化補正した
（AC-4「false positive 最小化」の趣旨に整合）。回帰防止として LG-h ケースを追加。

## Part 1: 中学生にもわかる説明

### なぜ必要か

このタスクが必要なのは、コミット前に走る見張り役の設計図が複数に分かれると、同じコードでも人によって
違うチェックが走ってしまうからです。Git hook は失敗すると作業を止める力があるため、正本から外れた
手書き hook や、意図しない `lefthook.yml` 変更を早く見つける必要があります。

何をするかというと、`lefthook.yml` を唯一の設計図として扱い、そこから外れる変更を「コミット前」と
「CI」の 2 か所で見つけられるようにします。

### git の「hook」って何？

git には「コミット（commit）」という、変更を記録に残す操作があります。`hook`（フック）は、その
コミットの**直前や直後に自動で走る小さなプログラム**のことです。たとえば「コミットする前に、
変なファイルが混ざっていないか確認する」といった見張り役を仕掛けられます。

この hook の中身（プログラム）は、本当は `.git/hooks/` という隠しフォルダに置かれます。でも、
そこに**手で直接書く**と、人によって中身がバラバラになり、何が動いているのか誰も把握できなく
なります。

### なぜ `lefthook.yml` だけを「正本（しょうほん＝唯一の正しい設計図）」にするの？

このプロジェクトでは `lefthook.yml` という 1 枚の設計図に「どの hook で何を走らせるか」を全部
書いておき、`lefthook` という道具がその設計図を読んで `.git/hooks/` に自動で配置します。
こうすると、

- 設計図（`lefthook.yml`）を見れば、誰でも全部の見張り役が分かる
- 全員が同じ設計図を共有するので、人によって動きが変わらない

という良いことがあります。つまり「`.git/hooks/` には**手で書かない**」「設計図は `lefthook.yml`
**1 枚だけ**」というルールです。

### 勝手に書き換えると何が困る？

2 つの困りごとがあります。

1. **手書きの合鍵問題**: 誰かが `.git/hooks/` に手で見張り役を足すと、設計図に載っていない
   見張り役がこっそり動きます。これは「正規の鍵（lefthook が配った鍵）ではない合鍵」を勝手に
   作って玄関に挿しているのと同じで、他の人の環境では再現できず、トラブルの原因になります。
2. **設計図の無断書き換え問題**: `lefthook.yml`（設計図）を、別の作業をしている**ついで**に
   うっかり書き換えてしまうと、全員の見張り役が知らないうちに変わってしまいます。

### このタスクがやること（番犬の比喩）

玄関（＝コミット）に**番犬（guard）**を 1 匹置きます。番犬は、コミットしようとするたびに
次の 2 つを嗅ぎ分けます。

- **合鍵**: `.git/hooks/` に、lefthook が配ったのではない手書きファイルが落ちていないか
- **設計図の無断書き換え**: `lefthook.yml` を変更しようとしているのに、「これは意図した変更です」
  という**正式な合図**（後述の `LEFTHOOK_EDIT_ACK=1`）が無いのではないか

どちらかを見つけたら、番犬はワンと吠えて玄関を通しません（コミットを止めます）。そして
「正式に設計図を直したいときはこうしてね」「ルールはここに書いてあるよ」という案内も一緒に
出します。

ただし、番犬は賢いので、**lefthook が自分で配った正規の鍵**（lefthook 署名つきファイル）や、
git が最初から置く**見本ファイル（`.sample`）**には吠えません。また、ブランチの取り込み作業
（merge / rebase / cherry-pick）の最中は事情があるので吠えません。これが「誤検知を減らす」
工夫です。

| 技術用語 | やさしい言い換え |
| --- | --- |
| hook | コミット時に自動で走る見張り役 |
| `lefthook.yml` | 見張り役を全部書いた 1 枚の設計図（正本） |
| guard | 玄関に置く番犬（チェック役） |
| pre-commit | コミットの直前に走るタイミング |
| CI gate | GitHub 側の自動の門番 |
| ack（acknowledge） | 「これは意図した操作です」という正式な合図 |

### 今回作ったもの

このサイクルで作ったものは、実際に動く guard / CI gate / テスト / 運用ドキュメントです。

| 作ったもの | 内容 |
| --- | --- |
| Phase 1-13 仕様書 | Issue #230 の AC を最新コードで実行できる形に整理 |
| Phase 12 strict 7 | 実装ガイド、正本更新サマリ、変更履歴、未タスク検出、skill feedback、compliance check |
| aiworkflow-requirements 同期 | quick-reference / resource-map / active ledger / artifact inventory / devops 正本に登録 |
| task-specification-creator 同期 | 観測不能 AC を観測可能 enforcement 面へ写像するルールを汎化 |

## Part 2: 技術者向け要約

### 変更対象 8 ファイル（Phase 2 / 5）

| # | パス | 種別 | 役割 |
|---|------|------|------|
| 1 | `scripts/hooks/lefthook-edit-guard.sh` | 新規 | pre-commit guard 本体（R-1 local / R-2 / R-3 / R-4） |
| 2 | `scripts/verify-hook-integrity.sh` | 新規 | lefthook.yml ↔ scripts/hooks 参照整合 + tracked stray hook 検知（local/CI 共用） |
| 3 | `.github/workflows/verify-hook-integrity.yml` | 新規 | CI gate（push/PR → main, dev、`permissions: contents: read`） |
| 4 | `lefthook.yml` | 編集 | `pre-commit.commands.lefthook-edit-guard` 追加（fail_text 含む） |
| 5 | `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts` | 新規 | guard の fixture テスト |
| 6 | `scripts/__tests__/verify-hook-integrity.spec.ts` | 新規 | integrity script の fixture テスト |
| 7 | `docs/00-getting-started-manual/lefthook-operations.md` | 編集 | 新 guard 運用節（AC-3 リンク先） |
| 8 | `CLAUDE.md` | 編集 | 「Git hook の方針」節に guard / CI gate の存在を追記（AC-3 アンカー） |

### guard の疑似コード要約（`lefthook-edit-guard.sh`）

read-only（stage / file を変更しない）。`set -euo pipefail`。論理は 3 段。

1. **sync-merge skip（R-4）**: `MERGE_HEAD` / `REBASE_HEAD` / `CHERRY_PICK_HEAD` / `REVERT_HEAD`
   が存在すれば `exit 0`。
2. **lefthook.yml ack ゲート（R-2 / R-3）**: `git diff --cached --name-only --diff-filter=ACMR`
   に `^lefthook\.yml$` が含まれ、かつ `LEFTHOOK_EDIT_ACK != 1` なら確認メッセージを出して `exit 1`。
3. **手書き `.git/hooks` 検知（R-1 local / R-4）**: hooks ディレクトリ配下の各ファイルについて
   **ドットを含むファイル名（`*.*` = `.sample` / `.old` / `.bak` 等の拡張子付き。git が実行しない）**
   を除外、`grep -qiE 'LEFTHOOK|lefthook'` にマッチする managed hook を除外し、
   残った offender があればメッセージを出して `exit 1`。

### TypeScript の型定義

実装テストでは shell script の結果を次の最小型で扱う。production code に TypeScript API を増やす
タスクではないため、型は fixture helper の境界に限定する。

```ts
type GuardRunResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type HookIntegrityFixture = {
  lefthookYaml: string;
  trackedFiles: string[];
  expectedExitCode: 0 | 1;
};
```

### CLIシグネチャ

```bash
bash scripts/hooks/lefthook-edit-guard.sh
LEFTHOOK_EDIT_ACK=1 bash scripts/hooks/lefthook-edit-guard.sh
bash scripts/verify-hook-integrity.sh
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
```

> **Phase 3 補正（必読）**: hooks ディレクトリの解決は `git rev-parse --git-dir` ではなく
> **`git rev-parse --git-common-dir`** を使う。worktree では `.git/worktrees/<name>` が返るため、
> 共有 hooks ディレクトリ（`commondir/hooks`）を正しく指すには `--git-common-dir` が必須。
> `process substitution`（`done < <(find ...)`）で `offenders` を親シェルに保持し、`set -e` 下で
> `grep` の非ゼロ終了が落とさないよう `|| true` / `continue` を徹底する。

### integrity の疑似コード要約（`verify-hook-integrity.sh`）

read-only。`set -euo pipefail`。3 チェック。

- **A. 参照整合**: `lefthook.yml` の `run: bash|node <script>` から**スクリプトパスのトークン**を
  抽出し（`--changed` 等の引数を誤検出しないよう Phase 4/5 で正規表現を精緻化）、各パスの実在を確認。
  欠落があれば `::error::` を出し fail。
- **B. tracked stray hook 検知**: `git ls-files` に commit された hook shadow
  （`(^|/)hooks/(pre-commit|pre-push|commit-msg|post-merge)(\.|$)`）が無いことを確認。
- **C. 構造健全性**: `lefthook.yml` に `^min_version:` 行が存在することを確認。

### 使用例

```bash
# 通常の確認: repository 上で観測できる hook integrity を検証する
bash scripts/verify-hook-integrity.sh

# lefthook.yml を意図的に編集して commit する場合
LEFTHOOK_EDIT_ACK=1 git commit

# 実装後の focused test
mise exec -- pnpm vitest run scripts/hooks/__tests__/lefthook-edit-guard.spec.ts scripts/__tests__/verify-hook-integrity.spec.ts
```

### エラーハンドリング

| エラー | 扱い |
| --- | --- |
| staged `lefthook.yml` かつ ack 無し | `LEFTHOOK_EDIT_ACK=1` の案内、`CLAUDE.md`、`lefthook-operations.md` を出して exit 1 |
| 手書き `.git/hooks/*` | offender path を列挙し、正本は `lefthook.yml` であることを出して exit 1 |
| `lefthook.yml` 参照先 script 欠落 | GitHub Actions annotation `::error::` 形式で欠落 path を出して exit 1 |
| merge/rebase/cherry-pick/revert 中 | false positive 回避のため guard は exit 0 |

### エッジケース

| ケース | 方針 |
| --- | --- |
| worktree | hooks は common dir 共有のため `git rev-parse --git-common-dir` を使う |
| `.sample` hook | Git が置く見本なので offender にしない |
| lefthook 署名入り hook | managed hook とみなし offender にしない |
| `run: bash scripts/hooks/foo.sh --flag` | integrity は第 2 トークンの script path を抽出し、`--flag` を path と誤検出しない |
| CI の `.git/hooks` | checkout に現れないため CI では見ない。CI は repository 上の SSOT integrity のみ検証する |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| ack env | `LEFTHOOK_EDIT_ACK=1` |
| policy docs | `CLAUDE.md`, `docs/00-getting-started-manual/lefthook-operations.md` |
| guard script | `scripts/hooks/lefthook-edit-guard.sh` |
| integrity script | `scripts/verify-hook-integrity.sh` |
| CI workflow | `.github/workflows/verify-hook-integrity.yml` |
| skipped git states | `MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD` |
| managed hook signature | `LEFTHOOK` / `lefthook` |

### テスト構成

| spec | 主なケース |
| --- | --- |
| `scripts/hooks/__tests__/lefthook-edit-guard.spec.ts` | clean pass、ack 無し fail、ack 有り pass、手書き hook fail、`.sample` pass、managed hook pass、merge state skip、worktree common-dir |
| `scripts/__tests__/verify-hook-integrity.spec.ts` | 正常 pass、参照先欠落 fail、`min_version` 欠落 fail、tracked stray hook fail、引数付き `run:` の path 抽出 |

### AC → R マッピング（観測可能 enforcement 面への最適化）

| 元 AC | 最適化後の要件 | enforcement 面 |
|-------|---------------|----------------|
| AC-1 `.git/hooks` 手書きで fail | R-1 | **pre-commit guard**（`.git/hooks` を observe できる唯一の地点）＋ CI 側は「`lefthook.yml` 参照スクリプト実在 + tracked stray hook 不在」という観測可能 SSOT 整合へ再定義 |
| AC-2 `lefthook.yml` 変更時の確認 | R-2 | pre-commit guard が staged `lefthook.yml` を検知し、`LEFTHOOK_EDIT_ACK=1` 無しなら block + 確認メッセージ（solo 運用で required review=0 のため ack ゲートで代替） |
| AC-3 拒否メッセージから方針へ辿れる | R-3 | fail_text / echo に `CLAUDE.md`「Git hook の方針」+ `docs/00-getting-started-manual/lefthook-operations.md` を必ず含む |
| AC-4 false positive 最小化 | R-4 | `.sample` 除外 + lefthook 署名（`LEFTHOOK`）managed hook 除外 + merge/rebase/cherry-pick skip |

> AC-1 の「CI で local hook を観測する」literal は `.git/` が repo 管理外で CI checkout に現れない
> ため**構造的に実行不可能**。これは先送りではなく、AC を観測可能面へ写像して 1 サイクルで完了
> させる最適化（CONST_007 準拠）。

### worktree の git-common-dir 解決（最重要エッジケース）

このリポジトリは `.worktrees/` で並列開発する。worktree では `.git` がファイル（gitdir ポインタ）
で、hooks は**メイン作業ツリーと共有**される。したがって guard は必ず `git rev-parse
--git-common-dir` で共有 hooks を解決すること。`--git-dir` を使うと worktree で誤った
`.git/worktrees/<name>` を見てしまい検知漏れ・誤検知の両方を起こす。

### 実装順序とエッジケース

1. Phase 11 用の before evidence（現状 `scripts/hooks/` 一覧 / `lefthook.yml` 行数）を取得。
2. guard / integrity を実装（`--git-common-dir`・`set -euo pipefail`・read-only を厳守）。
3. fixture spec（`*.spec.ts` のみ。invariant #8）で fake hook 追加→fail / `.sample`・managed・
   MERGE_HEAD→pass / `lefthook.yml` stage（ack 無→fail / ack 有→pass）を検証。
4. `lefthook.yml` に `lefthook-edit-guard` コマンドを追加（既存 `pre-commit.parallel: true` と整合）。
5. CI workflow を追加（`verify-test-suffix.yml` を踏襲）。
6. `CLAUDE.md` / `lefthook-operations.md` を追記（Task C は A/B のインターフェース確定後）。
7. focused vitest / exit code / CI run の Gate-C evidence を取得してから state を昇格。

- guard / integrity は read-only。stage や `.git/hooks` を**書き換えない**。
- 秘密値は一切 echo しない（CLAUDE.md シークレット管理）。
- 証跡が landed する前に Phase 11 / 12 を runtime PASS と記載しない。
