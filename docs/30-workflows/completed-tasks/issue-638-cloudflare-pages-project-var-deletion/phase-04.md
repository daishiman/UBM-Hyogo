# Phase 4: 削除手順設計（gh API シーケンス）

## 4.1 API シグネチャ

```
DELETE /repos/{owner}/{repo}/actions/variables/{name}
GET    /repos/{owner}/{repo}/actions/variables          # list 用
GET    /repos/{owner}/{repo}/actions/variables/{name}   # single fetch 用
GET    /repos/{owner}/{repo}/environments/{env}/variables  # environment scope 確認用
```

| 項目 | 値 |
| --- | --- |
| owner | `daishiman` |
| repo | `UBM-Hyogo` |
| name | `CLOUDFLARE_PAGES_PROJECT` |
| 必要 scope | classic PAT: `repo` / fine-grained: `Variables: Write` |

## 4.2 実行シーケンス

```
[Step 1] 認証確認
  gh auth status                         → 必須 scope を持つこと

[Step 2] environment scope 確認 (safety)
  gh api .../environments/staging/variables    → CLOUDFLARE_PAGES_PROJECT 不在を確認
  gh api .../environments/production/variables → CLOUDFLARE_PAGES_PROJECT 不在を確認

[Step 3] 削除前 evidence 取得
  gh api .../actions/variables > outputs/phase-11/before.json
  gh api .../actions/variables/CLOUDFLARE_PAGES_PROJECT > outputs/phase-11/before-single.json

[Step 4] grep gate 再確認
  rg CLOUDFLARE_PAGES_PROJECT .github/ > outputs/phase-11/grep-gate.txt
  → hit 0 でなければ中断

[Step 5] user approval marker 確認
  outputs/phase-11/evidence/user-approval-marker.md が存在し、承認者・日時・対象 command を含むこと

[Step 6] 削除実行
  gh api -X DELETE .../actions/variables/CLOUDFLARE_PAGES_PROJECT
  → exit 0 (HTTP 204) を期待

[Step 7] 削除後 evidence 取得
  gh api .../actions/variables > outputs/phase-11/after.json
  gh api .../actions/variables/CLOUDFLARE_PAGES_PROJECT 2>&1 | tee outputs/phase-11/after-single.txt
  → HTTP 404 を期待

[Step 7] 期待 diff verify
  jq '.variables | map(.name)' outputs/phase-11/before.json
  jq '.variables | map(.name)' outputs/phase-11/after.json
  → after が before から CLOUDFLARE_PAGES_PROJECT を 1 件減らした集合と一致
```

## 4.3 各 Step の I/O 定義

### Step 6 (削除実行)

- **入力**: variable name = `CLOUDFLARE_PAGES_PROJECT`
- **副作用**: GitHub Actions Variables API への mutation (1 件削除)
- **成功出力**: HTTP 204 No Content, body 空, `gh api` exit code 0
- **実行条件**: `outputs/phase-11/evidence/user-approval-marker.md` が存在し、削除 command と rollback command の承認範囲が明記されている
- **失敗パターン**:
  - HTTP 404: 既に削除済 → `already_deleted` evidence を保存して成功扱い（冪等）
  - HTTP 401/403: 認証 scope 不足 → 中断、`gh auth refresh -s repo` 実行
  - HTTP 5xx: GitHub 側障害 → 1 時間後リトライ

### Step 6 (削除後 verify)

- **入力**: なし
- **成功条件**:
  - list endpoint の JSON `.variables[].name` に `CLOUDFLARE_PAGES_PROJECT` が含まれない
  - single endpoint が HTTP 404 を返す
  - `.total_count` が削除前 - 1

## 4.4 ファイル構造（出力物）

```
docs/30-workflows/issue-638-cloudflare-pages-project-var-deletion/
├── index.md
├── phase-01.md ... phase-13.md
└── outputs/
    └── phase-11/
        ├── before.json              # 削除前 list
        ├── before-single.json       # 削除前 single GET
        ├── after.json               # 削除後 list
        ├── after-single.txt         # 削除後 single GET (404 expected)
        ├── grep-gate.txt            # rg 実行結果 (空ファイル expected)
        └── deletion-log.md          # 実行サマリ
```
