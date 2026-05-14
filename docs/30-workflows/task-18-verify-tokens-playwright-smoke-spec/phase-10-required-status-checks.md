[実装区分: 実装仕様書]

# Phase 10: Required status checks 設定（user-gated mutation）

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 10 / 13 |
| 名称 | GitHub branch protection `required_status_checks.contexts` への 3 本追加 |
| 依存 (前) | Phase 9（ローカル検証完了） |
| 依存 (後) | Phase 11（evidence 収集） |
| 想定工数 | 0.1 人日 |
| Mutation 種別 | **不可逆 / user-gated**（Claude Code から unilateral 実行禁止） |

## 2. ゴール / 非ゴール

### ゴール
1. `main` / `dev` 両ブランチの `required_status_checks.contexts` に以下 3 本を追加する:
   - `verify-design-tokens / verify-design-tokens`
   - `playwright-smoke / smoke (chromium)`
   - `playwright-smoke / visual (chromium, 4 screens)`
2. `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN` を GitHub Secrets に登録（1Password 参照経路）
3. before / after JSON を evidence として取得し、drift がないことを確認

### 非ゴール
- `required_pull_request_reviews` の変更（solo dev ポリシー継続のため null 維持）
- `lock_branch` / `enforce_admins` 等の他フィールド変更（drift 検知のみ）
- CODEOWNERS 変更

## 3. 変更対象ファイル

| パス | 種別 | 説明 |
|------|------|------|
| GitHub branch protection (`main`) | API mutation | `required_status_checks.contexts` に 3 本追加 |
| GitHub branch protection (`dev`) | API mutation | 同上 |
| GitHub Secrets | secret create | `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN` |
| `/tmp/task-18-evidence/branch-protection-main-before.json` | local artifact | mutation 前の状態 |
| `/tmp/task-18-evidence/branch-protection-main-after.json` | local artifact | mutation 後の状態 |
| `/tmp/task-18-evidence/branch-protection-dev-before.json` | local artifact | mutation 前の状態（dev） |
| `/tmp/task-18-evidence/branch-protection-dev-after.json` | local artifact | mutation 後の状態（dev） |

> evidence file は Phase 11 で `outputs/phase-11/evidence/` に確定パスで配置する。

## 4. 手順 / コマンド

### 4.1 before evidence 取得（read-only / Claude Code 実行可）

```bash
mkdir -p /tmp/task-18-evidence
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | tee /tmp/task-18-evidence/branch-protection-main-before.json \
  | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | tee /tmp/task-18-evidence/branch-protection-dev-before.json \
  | jq '.required_status_checks.contexts'
```

期待: 現行 contexts 一覧が表示され、3 本が **まだ含まれていない** こと。

### 4.2 mutation コマンド（user 承認後のみ実行）

> 以下は **user の明示承認後** に実行する。Claude Code は draft のみ生成し、unilateral には叩かない。

`main` ブランチ用ペイロードを既存 contexts に 3 本を追加した形で構築する:

```bash
# 例: 既存 contexts を取り出し、3 本を append し、PUT body を生成
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | jq '{
      required_status_checks: (.required_status_checks
        | .contexts = (.contexts + [
            "verify-design-tokens / verify-design-tokens",
            "playwright-smoke / smoke (chromium)",
            "playwright-smoke / visual (chromium, 4 screens)"
          ] | unique)
        | {strict: .strict, contexts: .contexts}),
      enforce_admins: .enforce_admins.enabled,
      required_pull_request_reviews: null,
      restrictions: null,
      required_linear_history: .required_linear_history.enabled,
      allow_force_pushes: .allow_force_pushes.enabled,
      allow_deletions: .allow_deletions.enabled,
      required_conversation_resolution: .required_conversation_resolution.enabled,
      lock_branch: .lock_branch.enabled,
      block_creations: false,
      allow_fork_syncing: false
    }' > /tmp/task-18-evidence/branch-protection-main-payload.json

# PUT（user 承認後のみ）
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input /tmp/task-18-evidence/branch-protection-main-payload.json
```

`dev` も同形（`branches/dev/protection` に置換）で生成・PUT する。

### 4.3 after evidence 取得（mutation 後）

```bash
gh api repos/daishiman/UBM-Hyogo/branches/main/protection \
  | tee /tmp/task-18-evidence/branch-protection-main-after.json \
  | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection \
  | tee /tmp/task-18-evidence/branch-protection-dev-after.json \
  | jq '.required_status_checks.contexts'
```

期待: 3 本が新たに含まれること。`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` が変化していないこと。

### 4.4 GitHub Secrets 登録（user 承認後のみ）

```bash
# 1Password から動的取得しつつ登録（実値はファイルに残さない）
op read 'op://UBM-Hyogo/E2E_ADMIN_SESSION_TOKEN/value' \
  | gh secret set E2E_ADMIN_SESSION_TOKEN --repo daishiman/UBM-Hyogo
op read 'op://UBM-Hyogo/E2E_MEMBER_SESSION_TOKEN/value' \
  | gh secret set E2E_MEMBER_SESSION_TOKEN --repo daishiman/UBM-Hyogo
```

登録確認:

```bash
gh secret list --repo daishiman/UBM-Hyogo | grep -E 'E2E_(ADMIN|MEMBER)_SESSION_TOKEN'
```

## 5. テスト・検証方針

| 検証項目 | 方法 |
|---------|------|
| 3 本が contexts に存在 | after JSON に対し `jq '.required_status_checks.contexts | contains([...])'` で true |
| 他フィールド drift なし | before / after JSON を `diff` し、`required_status_checks.contexts` 以外の差分が 0 |
| Secrets 登録済み | `gh secret list` の出力に 2 件が含まれる |
| solo dev ポリシー維持 | after JSON の `required_pull_request_reviews` が `null` |

## 6. ローカル実行コマンド

```bash
# read-only（Claude Code 実行可）
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | jq '.required_status_checks.contexts'
gh api repos/daishiman/UBM-Hyogo/branches/dev/protection  | jq '.required_status_checks.contexts'

# 差分確認
diff /tmp/task-18-evidence/branch-protection-main-before.json \
     /tmp/task-18-evidence/branch-protection-main-after.json

# mutation（user 明示承認後のみ）
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/main/protection \
  --input /tmp/task-18-evidence/branch-protection-main-payload.json
gh api -X PUT repos/daishiman/UBM-Hyogo/branches/dev/protection \
  --input /tmp/task-18-evidence/branch-protection-dev-payload.json
```

## 7. DoD チェックリスト

- [ ] before JSON 2 本（main / dev）を取得し evidence へ配置（read-only）
- [ ] payload JSON 2 本を生成し、user に内容提示・承認取得
- [ ] user 承認後に `gh api -X PUT` を main / dev へ実行
- [ ] after JSON 2 本を取得し、3 本の context が追加され、他フィールド drift 0 を確認
- [ ] `E2E_ADMIN_SESSION_TOKEN` / `E2E_MEMBER_SESSION_TOKEN` を GitHub Secrets に登録（実値は 1Password から動的注入、ファイル / ログに残さない）
- [ ] `required_pull_request_reviews=null` が維持されている
