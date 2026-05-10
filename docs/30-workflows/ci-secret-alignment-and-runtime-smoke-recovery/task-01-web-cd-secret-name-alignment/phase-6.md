# Phase 6: 単体テスト / 静的検証（task-01）

| 項目 | 値 |
|------|----|
| 入力 | `phase-5.md` 完了（YAML 編集済み） |
| 出力 | L1 / L2 / L4 検証コマンドの実行結果 evidence |

---

## 1. 実行手順（順序固定）

```bash
# L1-1: YAML 構文検証
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/web-cd.yml'))"
# 期待: exit 0、標準出力なし

# L1-2: actionlint（任意・存在時のみ）
mise exec -- pnpm dlx actionlint .github/workflows/web-cd.yml || true
# 期待: violation 0、または skip

# L2-1 (AC-01): 旧 secret 名の完全除去
grep -n "CF_TOKEN_WORKERS" .github/workflows/web-cd.yml
# 期待: 標準出力なし、exit 1（grep は match 0 で 1 を返す）

# L2-2 (AC-02): 新 secret 名が 2 箇所
grep -c 'secrets.CLOUDFLARE_API_TOKEN' .github/workflows/web-cd.yml
# 期待: 2

# L2-3 (AC-03): Verify step が 2 箇所
grep -c 'Verify CF token is present' .github/workflows/web-cd.yml
# 期待: 2

# L4 (AC-06): JWT 形式 token の残留チェック
grep -rE 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' .github/workflows/web-cd.yml \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/ \
  || echo "OK: no JWT-like token in workflow / spec"
# 期待: "OK: no JWT-like token in workflow / spec"
```

---

## 2. 期待出力サマリ表

| コマンド | 期待 stdout | 期待 exit |
|---|---|---|
| L1-1 yaml.safe_load | 空 | 0 |
| L2-1 grep CF_TOKEN_WORKERS | 空 | 1（match 0） |
| L2-2 grep -c CLOUDFLARE_API_TOKEN | `2` | 0 |
| L2-3 grep -c Verify CF | `2` | 0 |
| L4 grep eyJ...pattern | `OK: ...` | 0 |

---

## 3. 失敗時の対応フロー

| 失敗ケース | 原因 | 対応 |
|---|---|---|
| L1-1 fail | YAML 構文エラー（インデント崩れ等） | `git diff` で差分を目視・再編集 |
| L2-1 が match 1 件以上 | `CF_TOKEN_WORKERS_*` の置換漏れ | 該当行を再置換 |
| L2-2 が `2` 以外 | 置換数が想定外 | line 22 / 56 のみが置換対象。他箇所の事故編集を疑う |
| L2-3 が `2` 以外 | step 追加漏れ / 重複 | 両 job に exactly 1 つずつ存在することを確認 |
| L4 fail | secret 実値の混入 | 即座に該当行を削除し commit 履歴も書き換える前に user に報告 |

---

## 4. evidence 保存先

`outputs/phase-11/evidence/` 配下に以下のログを保存する（Phase 11 で集約）。

- `yaml-syntax.log`（L1-1）
- `actionlint.log`（L1-2、任意）
- `grep-gate.log`（L2-1 / L2-2 / L2-3 を一括）
- `secret-residue.log`（L4）

---

## 5. exit criteria

| # | 条件 |
|---|------|
| EX-01 | §1 のコマンド列がすべて exit 期待値どおりで PASS |
| EX-02 | §4 の evidence 4 ファイルが Phase 11 で揃う準備が整っている |
| EX-03 | §3 の失敗時対応フローが明文化されている |
