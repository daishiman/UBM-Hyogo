# Phase 4: テスト設計（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-3.md` 完了 |
| 出力 | 3 層検証戦略（YAML lint / grep gate / dev push integration） |

---

## 1. テスト戦略の概要

YAML 編集のみのため、ユニットテスト追加は行わない。代わりに以下 3 層で AC-01..AC-06 を網羅する。

| 層 | 目的 | コマンド | カバー AC |
|---|---|---|---|
| L1 YAML 構文 | YAML として parse 可能か | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/web-cd.yml'))"`、可能なら `mise exec -- pnpm dlx actionlint .github/workflows/web-cd.yml` | （前提） |
| L2 grep gate | secret 名置換の機械検証 | `grep -n "CF_TOKEN_WORKERS" .github/workflows/web-cd.yml`（0 件）、`grep -c 'secrets.CLOUDFLARE_API_TOKEN'`（==2）、`grep -c 'Verify CF token is present'`（==2） | AC-01 / AC-02 / AC-03 |
| L3 dev push 統合 | 実 CI で deploy 成功確認 | `git push origin fix/web-cd-secret-name-alignment` → PR `dev` → merge 後 `gh run watch <run-id>` | AC-04 / AC-05 |
| L4 evidence | secret 値残留チェック | `git log -p`、PR diff、`grep -rE 'eyJ[A-Za-z0-9_-]+\.' docs/`（0 件） | AC-06 |

---

## 2. L1 YAML 構文検証

```bash
# 必須
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/web-cd.yml'))"

# 任意（actionlint 未インストール環境では skip 可）
mise exec -- pnpm dlx actionlint .github/workflows/web-cd.yml || true
```

期待: 標準出力空 / exit 0。

---

## 3. L2 grep gate（機械検証可能な PASS 条件）

```bash
# AC-01: 旧 secret 名が完全除去されている
! grep -q "CF_TOKEN_WORKERS" .github/workflows/web-cd.yml

# AC-02: 新 secret 名が 2 箇所参照されている
[ "$(grep -c 'secrets.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml)" = "2" ]

# AC-03: Verify step が 2 箇所存在する
[ "$(grep -c 'Verify CF token is present' .github/workflows/web-cd.yml)" = "2" ]
```

すべて exit 0 であることを Phase 6 で確認。

---

## 4. L3 dev push integration

```bash
# 1. PR 作成 (Phase 13)
git push -u origin fix/web-cd-secret-name-alignment
gh pr create --base dev --head fix/web-cd-secret-name-alignment ...

# 2. PR merge 後 dev で起動した web-cd run を観測
gh run list --workflow=web-cd.yml --branch=dev --limit=1
gh run watch <run-id>

# 3. ログから op 不在エラーが消えていることを確認
gh run view <run-id> --log | grep -F "1Password CLI (op)" || echo "OK: op error gone"
```

期待:
- `Verify CF token is present` step が PASS（exit 0、エラー出力なし）
- `Deploy to Cloudflare Workers (staging)` step が exit 0
- `[cf.sh] 1Password CLI (op) が見つかりません` 文字列が log に出ない

---

## 5. L4 secret 値残留 gate

```bash
# JWT 形式トークンの残留チェック
! grep -rE 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' .github/workflows/web-cd.yml \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/

# Cloudflare API token らしき pattern（40 桁前後の英数字）の残留チェック
! grep -rE '\b[A-Za-z0-9_-]{30,}\b' \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/ \
  | grep -vE '(quality-gates|coverage-summary|github\.sha|secrets\.|vars\.)'
```

PASS 条件: 0 件。

---

## 6. exit criteria

| # | 条件 |
|---|------|
| EX-01 | L1〜L4 の検証コマンドがすべて確定している |
| EX-02 | 各層がカバーする AC のマッピングが明示されている |
| EX-03 | 期待出力（exit code / 標準出力）が逐語で記述されている |
