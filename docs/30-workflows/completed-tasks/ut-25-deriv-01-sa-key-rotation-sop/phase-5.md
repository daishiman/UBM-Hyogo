[実装区分: 実装仕様書]

# Phase 5: 実装 (TDD GREEN)

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | UT-25-DERIV-01 |
| 前提 Phase | Phase 4（RED 確認済み） |
| 次 Phase | Phase 6（テスト拡充） |
| 期待状態 | GREEN（TC-01〜TC-12 全 PASS） |

## 目的

Phase 4 のテスト RED を全件 GREEN に転じる最小実装を行う。helper / SOP / 完了記録テンプレ / skill 逆参照の 4 ファイルを作成する。

## 変更対象ファイル

| パス | 種別 | 目的 | 上限行数 |
| --- | --- | --- | --- |
| `scripts/cf-rotate-sa-key.sh` | 新規 | ローテーション helper | 約 200 行 |
| `docs/30-workflows/runbooks/sa-key-rotation-sop.md` | 新規 | SOP markdown 本体 | 約 350 行 |
| `docs/30-workflows/runbooks/sa-key-rotation-records/TEMPLATE.md` | 新規 | 完了記録テンプレ | 約 80 行 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | 編集 | SOP 逆参照を「## 関連 SOP」セクションに 1 行追記 | +3 行 |

## 関数シグネチャ（`cf-rotate-sa-key.sh`）

| 関数 / subcommand | 入力 | 出力 | exit code |
| --- | --- | --- | --- |
| `enforce_history_off()` | なし | `HISTFILE=/dev/null` を export / `set +o history` | 1=失敗 |
| `assert_stdin_piped()` | fd 0 | なし | 2=TTY 検出 |
| `compute_fingerprint()` | stdin JSON | stdout=16 桁 hex | 0 |
| `put_secret <env>` | stdin JSON / env | cf.sh stdin pipe | 4=cf.sh fail |
| `verify_name <env>` | env | name 存在判定 | 0 / 5 |
| `tail_window <env> [sec]` | env / 秒（既定 60） | tail ログ | 6=timeout |
| `dispatch <subcommand> ...` | サブコマンド | 各処理ディスパッチ | 各種 |

## 実装スケッチ（仕様書内記述のみ・実コードは Phase 5 実装時に作成）

```bash
#!/usr/bin/env bash
# scripts/cf-rotate-sa-key.sh
# SA Service Account JSON key rotation helper.
# - stdin パイプ強制（TTY 入力禁止）
# - HISTFILE=/dev/null / set +o history 強制
# - dry-run サポート
# - 値そのものはログに出さない（fingerprint のみ）

set -euo pipefail

enforce_history_off() {
  export HISTFILE=/dev/null
  set +o history
}

assert_stdin_piped() {
  if [[ -t 0 ]]; then
    echo "ERROR: stdin must be piped (TTY detected)" >&2
    exit 2
  fi
}

compute_fingerprint() {
  # SHA-256 の先頭 16 hex のみ出力。元値は変数に束縛しない
  sha256sum | awk '{print substr($1,1,16)}'
}

put_secret() {
  local env="$1"
  # cf.sh は stdin パイプを受け取って wrangler secret put に橋渡しする
  bash scripts/cf.sh secret put GOOGLE_SERVICE_ACCOUNT_JSON \
    --config apps/api/wrangler.toml --env "$env"
}

verify_name() {
  local env="$1"
  bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env "$env" \
    | grep -q '^GOOGLE_SERVICE_ACCOUNT_JSON' || return 5
}

# dispatch...（put-staging / put-production / verify / tail / fingerprint）
```

実装時の注意:

- 値（JSON）を bash 変数に束縛しない（パイプを直接 cf.sh へ転送）
- `set -x` / debug trace を残さない
- error message に値の断片を含めない
- `--dry-run` のときは `bash scripts/cf.sh ...` 行を `echo "[DRY-RUN] bash scripts/cf.sh ..."` に置換

## SOP markdown 実装ポイント（`runbooks/sa-key-rotation-sop.md`）

- Phase 2 §2.3 の章立てに沿って執筆
- 90 日採用根拠は NIST SP 800-57 §5.6.2 / Google Cloud IAM 推奨 90 日 / 漏洩 blast radius 抑制の 3 点
- §5.3 / 5.5 のコマンドは `op read "op://..." \| bash scripts/cf-rotate-sa-key.sh put-staging --op-ref "op://..." --fingerprint "<16-hex>" --env staging` の形で固定
- §6 で MINOR-01（60 秒固定の暫定根拠）を注記
- §7 rollback は `docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md` への相対リンクで逆参照
- §8 で `HISTFILE=/dev/null` / `set +o history` / tmux `Ctrl-b :clear-history` / screen `C-a [ ESC` を明記
- §9 で完了記録テンプレを逆参照
- §10 で UT-25-DERIV-02 への新 key fingerprint 連携手順（連携先 issue / file を明示）

### 値の取り扱い禁止事項（SOP 文中に明記）

- 実 JSON 値 / `private_key` 内容 / OAuth トークン値を SOP に書かない
- `op://` 参照と fingerprint（16 桁 hex）のみ記載可

## 完了記録テンプレ（`runbooks/sa-key-rotation-records/TEMPLATE.md`）

Phase 2 §2.4 のテーブルをそのまま採用。ファイル冒頭に「複製手順: `cp TEMPLATE.md YYYY-MM-DD.md`」を 1 行明記。

## skill 逆参照追記

`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の末尾に以下を追加:

```md
## 関連 SOP

- SA Service Account JSON key 定期ローテーション: [docs/30-workflows/runbooks/sa-key-rotation-sop.md](../../../../docs/30-workflows/runbooks/sa-key-rotation-sop.md)
```

## 実行コマンド

```bash
# Phase 5 GREEN 確認
chmod +x scripts/cf-rotate-sa-key.sh
mise exec -- bats scripts/__tests__/cf-rotate-sa-key.bats   # 全 PASS
mise exec -- shellcheck scripts/cf-rotate-sa-key.sh         # exit 0
mise exec -- pnpm exec markdownlint docs/30-workflows/runbooks/sa-key-rotation-sop.md
```

## DoD

- [ ] `scripts/cf-rotate-sa-key.sh` が作成され、Phase 4 の TC-01〜TC-12 が全 PASS
- [ ] SOP markdown が `runbooks/sa-key-rotation-sop.md` に作成され、章立て 11 セクションを満たす
- [ ] 完了記録テンプレが 8 必須フィールドを含む
- [ ] skill 逆参照が 1 行追記されている
- [ ] shellcheck PASS
- [ ] markdownlint PASS
- [ ] SOP 内に実 secret 値 / JSON 値 / OAuth トークンが含まれていない（grep で空）

## 次 Phase

Phase 6（テスト拡充）
