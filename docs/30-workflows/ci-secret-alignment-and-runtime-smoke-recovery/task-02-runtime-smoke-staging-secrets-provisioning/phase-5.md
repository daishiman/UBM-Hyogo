# Phase 5: 実装手順（task-02 — workflow への step 挿入と runbook 章立て）

| 項目 | 値 |
|------|----|
| 入力 | `phase-3.md` 実装計画 / `phase-4.md` テスト設計 |
| 出力 | 逐語実装手順（YAML / runbook） |

---

## 1. `.github/workflows/runtime-smoke-staging.yml` への step 挿入

### 1.1 編集前後の step 並び（概念図）

```
before:                              after:
  - actions/checkout                   - actions/checkout
  - actions/setup-node                 - actions/setup-node
  - pnpm/action-setup                  - pnpm/action-setup
  - mise install                       - mise install
  - mask staging credentials   ←       - verify required staging secrets   ★ 新規
  - run runtime smoke                  - mask staging credentials
  - upload evidence                    - run runtime smoke
  - notify slack on failure            - upload evidence
                                       - notify slack on failure
```

### 1.2 挿入する step（逐語コピー対象）

```yaml
      - name: verify required staging secrets
        env:
          STAGING_API_BASE: ${{ env.STAGING_API_BASE }}
          STAGING_ADMIN_BEARER: ${{ env.STAGING_ADMIN_BEARER }}
          STAGING_MEMBER_ID: ${{ env.STAGING_MEMBER_ID }}
          STAGING_ME_BEARER: ${{ env.STAGING_ME_BEARER }}
        run: |
          missing=()
          [ -z "${STAGING_API_BASE:-}" ] && missing+=("STAGING_API_BASE")
          [ -z "${STAGING_ADMIN_BEARER:-}" ] && missing+=("STAGING_ADMIN_BEARER")
          [ -z "${STAGING_MEMBER_ID:-}" ] && missing+=("STAGING_MEMBER_ID")
          [ -z "${STAGING_ME_BEARER:-}" ] && missing+=("STAGING_ME_BEARER")
          if [ "${#missing[@]}" -gt 0 ]; then
            echo "::error::missing secrets in environment 'staging-runtime-smoke': ${missing[*]}"
            echo "::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md)"
            exit 1
          fi
```

### 1.3 編集手順

1. `.github/workflows/runtime-smoke-staging.yml` を開く。
2. `mask staging credentials` step の `- name:` 行を起点に **直前** へ §1.2 の YAML をインデント維持で挿入する（job 配下の step インデントは 6 スペース、`run:` 内のヒアドキュメントは 10 スペース）。
3. 保存。
4. `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/runtime-smoke-staging.yml'))"` で YAML 構文確認。
5. `pnpm dlx actionlint -color .github/workflows/runtime-smoke-staging.yml` で構文 / expression 検証。

---

## 2. `runbooks/secret-provisioning.md` の章立て

### 2.1 ファイル path

`docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`

### 2.2 章構成（生成済 runbook 本文に対応）

| § | タイトル | 内容 |
|---|---------|------|
| 1 | 目的 | 5 secret 投入の責務 + 「実値はこの doc に書かない」の明示 |
| 2 | 必要 secret 一覧 | 表形式: secret 名 / 取得元 / 例形式（placeholder） |
| 3 | 投入手順（ユーザー操作） | `gh secret set <NAME> --env staging-runtime-smoke` × 5。HISTCONTROL 注意 |
| 4 | 投入確認 | `gh api .../environments/staging-runtime-smoke/secrets --jq '.secrets[].name' \| sort` |
| 5 | 動作確認（再実行） | `gh workflow run runtime-smoke-staging.yml --ref dev` + `gh run watch` |
| 6 | ローテーション運用 | bearer 失効時の上書き手順 |
| 7 | 禁止事項 | doc / commit / PR / Slack / Issue / AI agent 経由の実値露出禁止 |

### 2.3 placeholder 規約（実値ゼロを担保）

| 形式 | 例 | 意味 |
|------|---|------|
| URL | `https://...workers.dev` | host portion を伏字 |
| JWT | `eyJ...` | header prefix のみ。続きを書かない（grep gate の `eyJ[A-Za-z0-9_-]{20,}` を発火させない長さ） |
| webhook | `https://hooks.slack.com/services/...` | path portion を伏字（grep gate の `[A-Z0-9]{8,}` を発火させない） |
| UUID | `UUID` | placeholder 文字列のまま |

### 2.4 編集手順

1. `mkdir -p docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/`（既存なら no-op）。
2. `secret-provisioning.md` を新規作成し、`task-02/main.md §11` の「runbook 本文（`runbooks/secret-provisioning.md` に保存する内容）」セクション内のコードブロックの中身（`# staging-runtime-smoke ...` から `... AI エージェントに ... 実値投入を依頼しない` まで）を逐語転記する。
3. 三重バックティックの escape に注意（main.md 内では 4 連バックティック で囲まれているが、保存先は通常の markdown として 3 連バックティックでよい）。
4. §3 grep gate を実行して 0 件を確認。

---

## 3. 実装の不変保証チェック

| # | チェック | 方法 |
|---|---------|------|
| I-1 | smoke スクリプト本体が変更されていない | `git diff <base>... -- scripts/smoke/runtime-attendance-provider.sh` が空 |
| I-2 | mask credentials step より前に pre-check が来る | YAML 上の order 目視 + `grep -n` で行番号比較 |
| I-3 | docs に実値が混入していない | phase-4 §2.3 の grep gate |
| I-4 | runbook に「禁止事項: AI に実値投入を依頼しない」が含まれる | `grep -F 'AI エージェントに' runbooks/secret-provisioning.md` |
| I-5 | YAML が parse 可能 | phase-4 §2.1 |

---

## 4. commit 単位

| commit | 範囲 | message 案 |
|--------|------|------------|
| 1 | `.github/workflows/runtime-smoke-staging.yml` | `fix(ci): add readiness pre-check step for staging-runtime-smoke env` |
| 2 | `runbooks/secret-provisioning.md` | `docs(runbook): add staging-runtime-smoke secret provisioning runbook` |
| 3 | `docs/30-workflows/.../task-02-.../**` | `docs(spec): add Phase 1-13 spec for task-02 runtime-smoke readiness gate` |

3 commit に分けるのは review 容易性のため。1 commit に集約しても DoD 上は同等。
