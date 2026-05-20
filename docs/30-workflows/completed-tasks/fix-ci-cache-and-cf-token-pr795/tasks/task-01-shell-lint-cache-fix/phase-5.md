# Phase 5 — 実装手順 (task-01)

## 手順サマリ

1. `.github/actions/setup-project/action.yml` の inputs に `cache` を追加
2. 同ファイルの `actions/setup-node@v4` step の `cache:` を `${{ inputs.cache }}` に変更
3. `.github/workflows/ci.yml` の `workflow-shell-lint` job の `setup-project` 呼出に `cache: ''` を追加
4. `actionlint` で構文検証
5. コミット → push → CI 実行 → green 確認

## 編集差分

### Step 1 + 2: `.github/actions/setup-project/action.yml`

**変更箇所 (1): inputs ブロック末尾 (L24 直後)**

```diff
   working-directory:
     description: 'Working directory used when invoking pnpm install.'
     required: false
     default: '.'
+  cache:
+    description: 'Cache strategy passed to actions/setup-node (node-setup path). Use empty string to disable.'
+    required: false
+    default: 'pnpm'
```

**変更箇所 (2): Setup Node.js step (L62)**

```diff
     - name: Setup Node.js (node-setup)
       if: inputs.setup-strategy == 'node-setup'
       uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
       with:
         node-version: ${{ inputs.node-version }}
-        cache: pnpm
+        cache: ${{ inputs.cache }}
```

### Step 3: `.github/workflows/ci.yml`

**変更箇所: `workflow-shell-lint` job の Setup project (L25-29)**

```diff
       - name: Setup project
         uses: ./.github/actions/setup-project
         with:
           node-version: '24'
           install: 'false'
+          cache: ''
```

## 検証コマンド

```bash
# T1: actionlint
cd <repo-root>
bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
./actionlint -color .github/workflows/ci.yml .github/actions/setup-project/action.yml

# T2: composite 構造検証 (ci.yml L52- 同等)
node -e "
const fs=require('fs');
const s=fs.readFileSync('.github/actions/setup-project/action.yml','utf8');
['runs:',\"using: 'composite'\",'uses: pnpm/action-setup@b906affcce14559ad1aafd4ab0e942779e9f58b1','uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020'].forEach(t=>{if(!s.includes(t)){console.error('missing',t);process.exit(1)}});console.log('ok')
"

# T3: 実 CI 実行
gh workflow run ci.yml --ref <branch>
gh run watch
```

## コミット順序

1. **commit-1**: `.github/actions/setup-project/action.yml` + `.github/workflows/ci.yml` を同一コミットにまとめる
   - 理由: composite action input 追加と caller 修正は単一の変更単位。分割すると中間状態で `cache: ''` が default 解決される (`'pnpm'`) ためテストで再現性が落ちる
   - メッセージ例:
     ```
     fix(ci): allow setup-project to disable cache for install: false callers (Refs PR #795)

     - add `cache` input to .github/actions/setup-project/action.yml (default 'pnpm')
     - pass empty string from workflow-shell-lint job to skip post-cleanup path validation
     ```

## ロールバック手順

```bash
git revert <commit-sha>
```

`cache` input default が `'pnpm'` のため revert で完全な以前状態に復元される。

## 想定 fail パターンと対処

| 症状 | 原因候補 | 対処 |
| ---- | -------- | ---- |
| actionlint で `unknown input cache` | input 定義漏れ | Step 1 の inputs ブロック追加忘れを確認 |
| 他 caller の cache が無効化された | default 値の typo | `default: 'pnpm'` を再確認 |
| `Path Validation Error` 再発 | `cache: ''` 渡し忘れ | ci.yml L29 直後の `cache: ''` 行を確認 |
| Validate composite step が fail | 必須 token grep に新行が干渉 | Phase 4 T2 を手元で再現し差分を特定 |
