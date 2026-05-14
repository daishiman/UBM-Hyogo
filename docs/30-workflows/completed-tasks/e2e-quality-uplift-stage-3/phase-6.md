# Phase 6: 実装

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `.github/branch-protection/dev.json` | 新規 | dev desired contexts + strict manifest |
| `.github/branch-protection/main.json` | 新規 | main desired contexts + strict manifest |
| `.github/branch-protection/apply.sh` | 新規 | fresh GET から contexts 差し替え + CLAUDE.md invariants 正規化を行う idempotent apply スクリプト |
| `.github/branch-protection/README.md` | 新規 | 使い方の最小説明（apply / verify 手順のみ） |
| `scripts/verify-branch-protection.sh` | 新規 | drift 検査スクリプト |
| `.github/workflows/lighthouse.yml` | 編集 | prod server 起動 step を `nohup` + `wait-on` 化 |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-dev-pre.json` | 新規 | 適用前 dev snapshot |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-main-pre.json` | 新規 | 適用前 main snapshot |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-dev-post.json` | 新規 | 適用後 dev snapshot |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-main-post.json` | 新規 | 適用後 main snapshot |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence/required-contexts-dev.txt` | 新規 | dev contexts evidence |
| `docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence/required-contexts-main.txt` | 新規 | main contexts evidence |

## 実装手順（実行順）

### Step 1: pre snapshot 取得（read-only）

```bash
mkdir -p docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq -S . \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-dev-pre.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq -S . \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-main-pre.json
```

### Step 2: desired contexts manifest 作成

#### `.github/branch-protection/dev.json`

```json
{
  "strict": false,
  "contexts": [
    "ci",
    "Validate Build",
    "coverage-gate",
    "lighthouse-ci",
    "e2e-tests-coverage-gate"
  ]
}
```

#### `.github/branch-protection/main.json`

```json
{
  "strict": false,
  "contexts": [
    "ci",
    "Validate Build",
    "coverage-gate",
    "lighthouse-ci",
    "e2e-tests-coverage-gate"
  ]
}
```

### Step 3: apply.sh 実装

`phase-2.md` D-3 の通り。実装では fresh GET から PUT payload を生成し、contexts を desired manifest に差し替え、CLAUDE.md invariants を正規化し、その他 optional fields を保持する。`chmod +x .github/branch-protection/apply.sh`。

### Step 4: verify-branch-protection.sh 実装

`phase-5.md` の通り。`chmod +x scripts/verify-branch-protection.sh`。

### Step 5: lighthouse.yml 編集

該当 step を差し替え:

```yaml
      - name: Build (Next.js production)
        run: pnpm --filter @ubm-hyogo/web build

      - name: Start server (background)
        run: |
          nohup pnpm --filter @ubm-hyogo/web start \
            > /tmp/web-server.log 2>&1 &
          echo $! > /tmp/web-server.pid

      - name: Wait for server (wait-on)
        run: pnpm dlx wait-on -t 120000 http-get://localhost:3000
```

`pull_request.branches` は `[dev, main]` にする。main の branch protection でも `lighthouse-ci` を required にするため、main 向け PR で check が生成されない状態を禁止する。旧 `for i in {1..60}` loop は削除。

### Step 6: branch protection apply（**ユーザー承認後のみ**）

```bash
bash .github/branch-protection/apply.sh all
```

### Step 7: post snapshot 取得

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection | jq -S . \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-dev-post.json
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq -S . \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/branch-protection-main-post.json
```

### Step 8: runtime evidence 取得

```bash
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | jq '.required_status_checks.contexts | sort' \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence/required-contexts-dev.txt
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '.required_status_checks.contexts | sort' \
  > docs/30-workflows/e2e-quality-uplift-stage-3/outputs/phase-11/runtime-evidence/required-contexts-main.txt
```

### Step 9: drift 検査で OK 確認

```bash
bash scripts/verify-branch-protection.sh
# 期待出力:
# OK(dev): no drift
# OK(main): no drift
```

## 入出力・副作用

| Step | 入力 | 出力 | 副作用 |
|------|------|------|--------|
| 1 | GitHub API | snapshot JSON | なし（read-only） |
| 2 | 設計値 | desired contexts manifest | repo に commit |
| 3-5 | 設計仕様 | bash/yml | repo に commit |
| 6 | desired contexts + fresh GET | branch protection contexts 更新 | **GitHub repo 設定変更（要承認）** |
| 7-8 | GitHub API | snapshot/evidence | repo に commit |
| 9 | desired contexts + 現状 | OK/NG | なし（read-only） |

## エラーハンドリング

- Step 1/7/8 が 404 → repo 権限を確認、`gh auth status` で再ログイン
- Step 6 が 422 → context 名の正確性を確認（`e2e-tests.yml` / `lighthouse.yml` の集約 job `name` と完全一致しているか）
- Step 9 が DRIFT → 原因特定後 Step 6 を再実行

## DoD（Definition of Done）

- [ ] 12 ファイルすべてが repo に存在し、git status clean
- [ ] `bash scripts/verify-branch-protection.sh` が exit 0 で `OK(dev) / OK(main)` を出力
- [ ] dev/main 双方の post snapshot が pre と context diff を持つ（`e2e-tests-coverage-gate` / `lighthouse-ci` 増加）
- [ ] lighthouse.yml の Wait for server step が `pnpm dlx wait-on` を使用
- [ ] CLAUDE.md 不変条件（4 項目）に drift なし
