# Phase 9: 品質ゲート（task-02 — actionlint / secret 残留 / runbook 章立て）

| 項目 | 値 |
|------|----|
| 入力 | `phase-7.md` 結合テスト通過 / `phase-8.md` リファクタ不要判定 |
| 出力 | 品質ゲート結果 + GO/NO-GO 判断材料 |

---

## 1. 品質ゲート一覧

| Gate | 検査 | 期待 | NO-GO 条件 |
|------|------|------|-----------|
| QG-1 | actionlint | violation 0 | 1 件以上で NO-GO |
| QG-2 | YAML 構文 | parse OK | parse error で NO-GO |
| QG-3 | pre-check step 件数 | grep `-c` = 1 | 0 / 2+ で NO-GO |
| QG-4 | secret 実値 grep gate | 0 件 | 1 件以上で NO-GO |
| QG-5 | runbook 章立て | 7 章 (`目的` / `必要 secret 一覧` / `投入手順` / `投入確認` / `動作確認` / `ローテーション運用` / `禁止事項`) 存在 | 欠落で NO-GO |
| QG-6 | runbook 禁止事項に AI 言及 | `AI エージェント` 文字列 1 件以上 | 0 件で NO-GO |
| QG-7 | smoke スクリプト不変 | `git diff -- scripts/smoke/` 空 | 差分ありで NO-GO |
| QG-8 | runtime 失敗系（Pass 1） | pre-check で exit 1 + 4 件列挙 | 列挙 < 4 で NO-GO |
| QG-9 | runtime 成功系（Pass 2、ユーザー secret 投入後） | pre-check 突破 + `missing secrets` 不在 | 突破せず or warning 残存で NO-GO |
| QG-10 | typecheck / lint（リポジトリ全体への副作用なし） | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` exit 0 | failure で NO-GO |

---

## 2. ゲート実行コマンド（一括）

```bash
# QG-1
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash -o "$tmpdir/download-actionlint.bash"
(cd "$tmpdir" && bash download-actionlint.bash >/dev/null)
"$tmpdir/actionlint" -color .github/workflows/runtime-smoke-staging.yml

# QG-2
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/runtime-smoke-staging.yml'))"

# QG-3
test "$(grep -c 'verify required staging secrets' .github/workflows/runtime-smoke-staging.yml)" -eq 1

# QG-4
! grep -rE 'eyJ[A-Za-z0-9_-]{20,}|sk_[A-Za-z0-9]{20,}|hooks\.slack\.com/services/[A-Z0-9]{8,}' \
  docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/

# QG-5
RUNBOOK=docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md
for h in "目的" "必要 secret 一覧" "投入手順" "投入確認" "動作確認" "ローテーション運用" "禁止事項"; do
  grep -qE "^## .*${h}" "$RUNBOOK" || { echo "missing heading: $h"; exit 1; }
done

# QG-6
grep -F 'AI エージェント' "$RUNBOOK"

# QG-7
git diff origin/dev... -- scripts/smoke/runtime-attendance-provider.sh | wc -l   # → 0 期待

# QG-10
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 3. GO/NO-GO 判定基準

- QG-1..QG-7 / QG-10 は **commit 前に必須通過**。
- QG-8 は **PR push 後の自動 trigger** で観測（secret 未投入時）。
- QG-9 は **ユーザー secret 投入後**に観測。

PR merge 条件:

- QG-1..QG-8, QG-10 が PASS。
- QG-9 はユーザー操作後の事後観測でよい（PR diff 単体ではセキュリティ的に検証不能なため）。

---

## 4. evidence 保存

phase-11 §evidence で `outputs/phase-11/evidence/` に下記を保存:

- `yaml-syntax.log`（QG-2）
- `actionlint.log`（QG-1）
- `grep-gate.log`（QG-4）
- `pre-check-fail-run.log`（QG-8）
- `pre-check-success-run.log`（QG-9）
- `secret-name-list-after.log`（QG-9 補助）

---

## 5. ロールバック起動条件

| 条件 | 対応 |
|------|------|
| QG-1..QG-7 / QG-10 が修正困難 | feature branch を破棄し再起票 |
| QG-8 が観測できない（pre-check が動かない） | step 挿入位置を再確認、phase-5 §1 に従って再編集 |
| QG-9 が secret 投入後も突破できない | runbook の secret 名と workflow `env:` キー名の typo を確認 |
