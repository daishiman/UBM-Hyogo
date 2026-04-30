# 実装ガイド — pull_request_target safety gate

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 12 |
| 対象読者 | Part 1 = 開発初心者・中学生レベル / Part 2 = エンジニア |

---

# Part 1: 中学生レベル — なぜこの仕掛けが要るのか

## 例え話: 学校の入口の名札チェック係

学校には毎日、生徒だけでなく外から人が訪ねてきます。配達の人、保護者、知らない誰か。
入口に立っている **名札チェック係**は、学校の名札（信頼）を渡して中を案内する係です。

GitHub の `pull_request_target` という仕掛けは、この **名札チェック係** に当たります。
「外から提案（PR）してきた人が安全かどうか」を確認するためにあります。

## 何が危ないのか

ところが、この名札チェック係に「校舎の鍵（＝リポジトリの秘密の鍵 = secrets）」を渡したまま、
**外から来た人の荷物（＝ PR で送られてきたコード）を中身も見ずに開封して動かしてしまう**と、
荷物の中に書かれている「鍵を全部 SNS に投稿せよ」という命令を、係の人が **善意で実行**してしまいます。

これが GitHub Actions の **「pwn request」**（ポンリクエスト）と呼ばれる事故です。

- **PR head を checkout する** = 名札チェック係に校舎の鍵を渡す行為
- そのまま `pnpm install` / `pnpm build` してしまうと、PR に書かれた `postinstall` スクリプトが鍵を持ち出せる

## どう防ぐか — 受付と教室を別棟に分ける

防ぎ方はシンプルです。

1. **受付（triage）と教室（build/test）を別の建物にする**
   - 受付（`pull_request_target` workflow）= ラベルを貼ったり、コメントを返したりするだけ。鍵は持っているが、外の人の荷物は開けない。
   - 教室（`pull_request` workflow）= 荷物を開けて中身を動かす（ビルド・テストする）。鍵は持っていない（`contents: read` だけ）。

2. **受付では絶対に荷物（PR head）を開封しない**
   - 受付は名前と用件（label / コメント）の操作だけを担当。
   - もし開封が必要になったら、それは教室の仕事。

3. **trigger（イベント）の種類で完全に分岐する**
   - `pull_request_target` = 受付係を呼ぶイベント（鍵あり）
   - `pull_request` = 教室の先生を呼ぶイベント（鍵なし）
   - GitHub が自動的に「どちらの係を呼ぶか」を切り分けてくれるので、人間は混ぜないように workflow を分けるだけ

これで、**外から来たコードに鍵が漏れる経路が物理的に存在しなくなる**わけです。

## 比喩のまとめ

| 仕組み | 比喩 |
| --- | --- |
| `pull_request_target` | 名札チェック係（外から来た人の入口） |
| secrets / token | 校舎の鍵 |
| PR head の checkout | 名札チェック係に鍵ごと荷物を渡す |
| triage / build/test の分離 | 受付（鍵あり）と教室（鍵なし）を別棟にする |
| trigger 種別で分岐 | どの建物のどの係を呼ぶかを呼び鈴のボタンで決める |
| `persist-credentials: false` | チェックの後で鍵を即座に金庫に戻す |

---

# Part 2: 技術者レベル — 実コマンド + dry-run 実走 + VISUAL evidence 取得

## Step 1: 静的検査（actionlint / yq / grep）

### Step 1-1: actionlint

```bash
# Node 24 / pnpm 10 環境で実行
mise exec -- npx -y actionlint .github/workflows/pr-target-safety-gate.yml
mise exec -- npx -y actionlint .github/workflows/pr-build-test.yml
# 期待: 終了コード 0、エラー出力なし
```

### Step 1-2: yq による permissions / trigger 確認

```bash
# pull_request_target safety gate: triage 用 trigger のみ・default permissions: {}
yq '.on, .permissions, .jobs.*.permissions' .github/workflows/pr-target-safety-gate.yml

# pull_request build-test: contents: read のみ
yq '.on, .permissions, .jobs.*.permissions' .github/workflows/pr-build-test.yml
```

### Step 1-3: grep 検査（PR head checkout / persist-credentials / pull_request_target）

```bash
# pull_request_target workflow に PR head checkout が含まれていないこと
grep -E "ref:\s*\\$\\{\\{\\s*github\\.event\\.pull_request\\.head" \
  .github/workflows/pr-target-safety-gate.yml \
  && echo "FAIL: PR head checkout found" \
  || echo "OK: no PR head checkout in pull_request_target"

# 全 actions/checkout に persist-credentials: false が指定されていること
grep -nE "persist-credentials:\s*false" .github/workflows/pr-*.yml

# pull_request_target / pull_request の use 状況
grep -nE "pull_request_target|pull_request" .github/workflows/pr-*.yml
```

## Step 2: branch protection の required status checks 同期確認

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  -q '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  -q '.required_status_checks.contexts'
# 期待: 実 Actions context（workflow 名 + job 名。現時点の job 名は triage / build-test）が含まれる
```

## Step 3: T-1〜T-5 dry-run 実走手順

### T-1: same-repo PR

```bash
# 1. feature branch 作成
git switch -c feat/smoke-t1-same-repo
echo "// smoke" >> apps/web/README.md
git add . && git commit -m "test: T-1 smoke"
git push -u origin feat/smoke-t1-same-repo

# 2. PR 作成
gh pr create --base dev --title "[smoke] T-1 same-repo" --body "T-1 dry-run"

# 3. run 確認
RUN_ID=$(gh run list --branch feat/smoke-t1-same-repo --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$RUN_ID" --json url -q .url
gh run view "$RUN_ID" --log | grep -E '(ghp_|github_pat_|CLOUDFLARE_API_TOKEN|AUTH_SECRET)' || echo "secrets:NONE"
```

### T-2: fork PR

```bash
# 1. 別アカウントで fork → branch 作成 → push
# 2. fork から base=dev に PR 作成
# 3. run 確認（pull_request_target は trusted context、pull_request は untrusted context で 2 run 起動）
gh pr list --state open --search "is:pr fork" --json number,headRepositoryOwner
RUN_ID=<run-id>
gh run view "$RUN_ID" --json jobs -q '.jobs[].name'
gh run view "$RUN_ID" --log | grep -E '(ghp_|github_pat_|CLOUDFLARE_API_TOKEN|AUTH_SECRET)' || echo "secrets:NONE"
```

### T-3: labeled trigger

```bash
# 既存 PR に label を付与
gh pr edit <PR_NUMBER> --add-label "needs-review"

# pull_request_target.types: [labeled] のみが再実行されることを確認
gh run list --workflow pr-target-safety-gate.yml --limit 3
gh run list --workflow pr-build-test.yml --limit 3  # 増えていないこと
```

### T-4: workflow_dispatch audit

```bash
# trusted context の手動 audit run を起動
gh workflow run pr-target-safety-gate.yml --ref <branch>
gh run list --workflow pr-target-safety-gate.yml --event workflow_dispatch --limit 1 --json databaseId,url
# log で PR head checkout が無いことを確認
RUN_ID=<run-id>
gh run view "$RUN_ID" --log | grep -E "actions/checkout|ref:" | head -20
```

### T-5: manual re-run

```bash
# 直近 run を再実行
RUN_ID=<run-id>
gh run rerun "$RUN_ID"
# job 名 / permissions が変化しないことを確認
gh run view "$RUN_ID" --json jobs -q '.jobs[].name'
```

### 各 T で共通の secrets 露出確認

```bash
gh run view "$RUN_ID" --log \
  | grep -E '(ghp_|github_pat_|CLOUDFLARE_API_TOKEN|AUTH_SECRET)' \
  || echo "secrets:NONE"
# *** マスクされた行のみが該当した場合は NONE 扱い（標準マスクが機能している証跡）
```

## Step 4: VISUAL evidence（スクリーンショット）取得手順

### 4-1: GitHub Actions UI

1. ブラウザで `https://github.com/daishiman/UBM-Hyogo/actions` を開く。
2. 対象 run（T-1〜T-5）をクリックし、Jobs / Workflow 全体図を表示。
3. 撮影位置: **job 名 / status 緑色 / required status checks 名 / permissions 表示**が画面内に収まる位置。
4. macOS: `Cmd + Shift + 4` → スペース → ウィンドウ選択。
5. 機微情報（メールアドレス・fork 元アカウント名）はマスク。
6. 命名規約 `<scenario>-actions-ui-<YYYY-MM-DD>.png` で `outputs/phase-11/screenshots/` に保存。

### 4-2: branch protection 画面

1. `https://github.com/daishiman/UBM-Hyogo/settings/branches` を開く。
2. main / dev の Edit ボタンを押し、`Require status checks to pass before merging` セクションをスクロール表示。
3. context 名一覧が画面内に収まる位置で撮影。
4. 命名規約 `branch-protection-{main,dev}-required-checks-<YYYY-MM-DD>.png` で保存。

### 4-3: 同期確認の証跡セット

```bash
# 画像と並置するコマンド出力
gh api repos/daishiman/UBM-Hyogo/branches/main/protection -q '.required_status_checks.contexts' > /tmp/main-checks.txt
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  -q '.required_status_checks.contexts' > /tmp/dev-checks.txt
diff <(gh run view "$RUN_ID" --json jobs -q '.jobs[].name' | sort) <(cat /tmp/main-checks.txt | sort)
# 期待: 差分なし
```

## Step 5: ロールバック手順（git revert）

```bash
# 適用 commit を特定
git log --oneline .github/workflows/pr-target-safety-gate.yml .github/workflows/pr-build-test.yml | head -5

# 単一 commit の revert
git revert <commit-sha>
git push origin <branch>
gh pr create --title "revert: pr-target-safety-gate" --body "rollback per phase-5 runbook"
```

## Step 6: 完了基準

- actionlint / yq / grep が全 PASS
- T-1〜T-5 が全て PASS（secrets 露出 NONE）
- スクリーンショット 7 枚が `outputs/phase-11/screenshots/` に保存
- branch protection の required status checks が Actions UI の job 名と完全一致

---

## セルフチェック

### Part 1（中学生レベル）
- [x] 比喩が中心で、専門用語の生語のみで説明していない
- [x] 「なぜ secrets が漏れるか」「なぜ trigger 種別で防げるか」を比喩で説明
- [x] `permissions` / `OIDC` / `SHA pin` 等の用語を生のまま放置していない

### Part 2（技術者レベル）
- [x] actionlint / yq / grep / gh / git revert を Step 単位で記述
- [x] T-1〜T-5 dry-run 実走手順をコピペ可能な形で記述
- [x] VISUAL evidence 取得手順（Actions UI / branch protection）を記述
