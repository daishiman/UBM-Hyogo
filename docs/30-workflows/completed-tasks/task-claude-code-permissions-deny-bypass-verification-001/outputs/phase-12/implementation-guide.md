# Implementation Guide

## Part 1: 中学生レベルの説明

### なぜ必要か

危ない操作を止める約束が、本当に働くか分からないまま使うと、間違って大事なものを壊すかもしれない。だから、まず安全な場所で確かめる手順を作る必要がある。

### たとえば

たとえば、学校の理科室で「触らない」と書いた箱があるとする。先生が「今日は確認なしで作業していい」と言ったとき、その張り紙がまだ効くのかを、本物の道具ではなく練習用の箱で確かめるイメージ。

### 何をするか

本物の作業場所ではなく、すぐ捨てられる一時フォルダを作る。そこで「止める約束」が効くかを調べるための説明書を用意する。

### 今回作ったもの

- 公式説明を読む観点
- 安全な検証手順
- 結果を書き込む表
- 判断できないときに危険な設定を外す方針

### 画面の確認について

今回は画面を変えていない。だから写真のような画面記録は作らず、代わりに手順書、確認表、リンク確認で「安全な説明書がそろっているか」を確かめる。

## Part 2: 技術詳細

### 型定義

```ts
type DenyBypassDecision =
  | "docs_explicit_yes"
  | "docs_explicit_no"
  | "docs_inconclusive_requires_execution";

interface VerificationObservation {
  tc: string;
  command: string;
  result: "blocked" | "executed" | "prompt";
  claudeVersion: string;
  note?: string;
}
```

### CLIシグネチャ

```bash
claude --permission-mode bypassPermissions --dangerously-skip-permissions
git push --dry-run --force origin main
```

### 使用例

```bash
base=/tmp/cc-deny-verify-$(date +%s)
mkdir -p "$base"
cd "$base"
git init --bare bare.git
mkdir work && cd work
git init
git remote add origin ../bare.git
claude --version
git remote -v
```

### エラーハンドリング

- `git remote -v` が local bare repo 以外を指す場合は中止する。
- `pwd` が `/tmp/cc-deny-verify-*` 配下でない場合は中止する。
- 公式 docs に明示記述がない場合は `docs_inconclusive_requires_execution` とする。

### エッジケース

- Claude Code バージョン差で結果が変わる。
- deny pattern のコロン表記とスペース表記で結果が変わる。
- `--dangerously-skip-permissions` 単独と `--permission-mode bypassPermissions` 併用で結果が変わる。

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| base directory | `/tmp/cc-deny-verify-*` |
| deny P-01 | `Bash(git push --force:*)` |
| deny P-02 | `Bash(rm -rf /:*)` |
| deny P-03 | `Write(/etc/**)` |
| deny P-04 | `Bash(git push --force-with-lease:*)` |

### テスト構成

| 種別 | 内容 |
| --- | --- |
| TC-DOC | 公式 docs 調査 |
| TC-VERIFY | isolated repo 実検証 |
| TC-LOG | 検証ログ品質 |
| TC-FOLLOWUP | 上流 / 下流反映 |

### 視覚証跡

`metadata.visualEvidence` は `NON_VISUAL`。UI / UX 変更を含まない docs-only task のため、Phase 11 では screenshot を作成しない。証跡は `outputs/phase-11/manual-smoke-log.md`、`outputs/phase-11/verification-log.md`、`outputs/phase-11/link-checklist.md` を使う。
