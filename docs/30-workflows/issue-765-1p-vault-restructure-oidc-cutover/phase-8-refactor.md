# Phase 8: リファクタ

## メタ情報

- phase: 8 / refactor
- prev: phase-7-coverage
- next: phase-9-qa

## 目的

Phase 5 実装と Phase 6 test 追加を見直し、可読性・保守性・redaction 健全性・canonical 参照集約状態を担保する。

## 実行タスク

1. canonical / WAF / historical path の責務分離を再点検する
2. redaction check で secret 値・URI 値の混入を確認する
3. duplicate wording と stale current contract の混同を整理する

## 入力

- Phase 5 で編集された 3 ファイル + 新規 1 script
- Phase 6 で実行した grep gate / redaction-check 結果

## 出力

- `outputs/phase-8/refactor-checklist.md`
- `outputs/phase-8/redaction-check-result.md`

## 要件

### チェック観点

#### 1. Redaction 健全性

本 task の差分・evidence に token 値・OAuth トークン値・account_id 実値・vault URI 値が混入していないことを保証する。

```bash
bash scripts/redaction-check.sh docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/
bash scripts/redaction-check.sh .env.example
bash scripts/redaction-check.sh docs/runbooks/cloudflare-waf-operations.md
bash scripts/redaction-check.sh .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
```

期待: 全 exit 0、検出 0 件。検出がある場合は該当箇所を path 識別子のみに置換しコミット。

#### 2. canonical 参照集約状態のレビュー

`op://` Cloudflare 参照が canonical 2 path のみへ集約されていることを横断確認する。

```bash
# 全リポジトリ走査（除外: completed-tasks / outputs / node_modules / .git）
git grep -nE 'op://[^"'"'"' ]*[Cc]loudflare[^"'"'"' ]*' \
  -- ':!node_modules/**' ':!.git/**' \
     ':!docs/30-workflows/completed-tasks/**' \
     ':!docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/outputs/**' \
  | sort -u
```

期待: canonical 2 path のみ。それ以外が出力された場合は Phase 5 に差し戻す。

#### 3. コード可読性

- `.env.example` の staging / production 切替コメントが他環境変数のコメント様式と整合
- `docs/runbooks/cloudflare-waf-operations.md` の 1Password 参照節が runbook 全体のリスト書式と整合
- `deployment-secrets-management.md` inventory 表の column 数が既存行と一致
- `scripts/verify-onepassword-op-uri-canonical.sh` の shebang / `set -euo pipefail` / shellcheck 互換性

```bash
mise exec -- pnpm exec shellcheck scripts/verify-onepassword-op-uri-canonical.sh || true
```

#### 4. 不要差分の除去

- `.env.example` の差分が op:// 参照行のみ（末尾空白・改行・順序の不要変更なし）
- `docs/runbooks/cloudflare-waf-operations.md` の差分が 1Password 参照節のみ
- `deployment-secrets-management.md` の差分が inventory 表追加行 + changelog 追加行のみ

```bash
git diff -w origin/dev...HEAD -- .env.example
git diff -w origin/dev...HEAD -- docs/runbooks/cloudflare-waf-operations.md
git diff -w origin/dev...HEAD -- .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md
git diff -w origin/dev...HEAD -- scripts/verify-onepassword-op-uri-canonical.sh
```

#### 5. ドキュメント整合

- 各 phase 文書間のクロスリンク（`prev` / `next`）が切れていない
- `index.md` の Phase 表とファイル名が一致
- `artifacts.json` の `outputs` entry に Phase 4〜8 の成果物が登録済

## ローカル実行・検証コマンド

```bash
bash scripts/verify-onepassword-op-uri-canonical.sh
bash scripts/redaction-check.sh docs/30-workflows/issue-765-1p-vault-restructure-oidc-cutover/
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 受入基準

- [ ] redaction-check exit 0（4 ターゲットすべて）
- [ ] canonical 集約レビューで legacy path hit 0 件
- [ ] shellcheck 警告 0 件（または許容理由を記録）
- [ ] 不要差分なし（4 ファイル `git diff -w` が semantic-only）
- [ ] phase クロスリンク・index.md・artifacts.json 整合

## 依存タスク

- Phase 7 完了

## 参照資料

- `phase-5-implementation.md`
- `phase-6-test-additions.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md`

## 統合テスト連携

- refactor 後も grep gate の対象ファイルと deny regex が変わらないことを確認する
- redaction check を Phase 11/12 evidence に接続する

## 成果物

- `outputs/phase-8/refactor-checklist.md`
- `outputs/phase-8/redaction-check-result.md`（各ターゲットの exit code と検出件数）

## 完了条件

- [ ] 受入基準 5 項目すべて green
- [ ] Phase 9 QA へ進む準備が整っている

## タスク100%実行確認【必須】

- [ ] 成果物 2 ファイル作成
- [ ] 実値・token 値・vault URI 値が一切記載されていない

## 次Phase

phase-9-qa.md
