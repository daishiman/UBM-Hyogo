**[実装区分: 実装仕様書]**

# Phase 11: 手動テスト (VISUAL) / staging visual evidence 取得

## 0. メタ情報

| key | value |
|---|---|
| 状態 | `spec ready / staging evidence pending` |
| Phase 11 mode | **VISUAL** |
| 入力 | Phase 5 / Phase 9 |

## 1. Phase 11 mode 判定

本 task は `/login` の staging 環境における visual evidence 取得が主目的のため `VISUAL`。`NON_VISUAL` ではない（screenshot 取得が AC-2 / AC-3 の必須要件）。

## 2. 実行前準備

| # | 項目 | コマンド | 期待 |
|---|---|---|---|
| 1 | branch / Node | `git branch --show-current` / `mise exec -- node -v` | feature branch / v24.15.0 |
| 2 | spec 改修済 | `git diff origin/dev -- apps/web/playwright/tests/login-smoke.spec.ts` | `EVIDENCE_DIR` env-override 差分が含まれる |
| 3 | shell helper 配置済 | `test -x scripts/run-login-staging-smoke.sh && shellcheck scripts/run-login-staging-smoke.sh` | exit 0 |
| 4 | local 互換確認済 | Phase 9 #4 ログを参照 | staging-target grep で exit 0 / 7 passed |
| 5 | staging URL 提供 | user が `PLAYWRIGHT_STAGING_BASE_URL` 値を提示 | 非空、`https://` で開始 |

## 3. user-gated 実行ステップ

### 3-1. staging deploy

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging \
  2>&1 | tee docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/evidence/staging-deploy.log
```

期待: exit 0 / "Deployed" 行 / version id を log に記録。

### 3-2. warm-up

```bash
STAGING_URL="<user 提示値>"
curl -sI "$STAGING_URL/login" | head -1 \
  | tee docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/evidence/warmup.log
```

期待: `HTTP/2 200`。5xx の場合 30 秒 wait 後再試行（最大 3 回）。

### 3-3. smoke 実行

```bash
bash scripts/run-login-staging-smoke.sh "$STAGING_URL" 2>&1 \
  | tee docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-smoke.log
```

期待: exit 0 / `7 passed`。helper は `--grep 'renders LoginCard|captures mobile input'` で staging evidence 対象の 7 screenshot test のみに限定する。

### 3-4. evidence 検証

```bash
EVIDENCE="docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"

test "$(find "$EVIDENCE" -name 'login-*.png' -type f | wc -l)" -eq 7
test -z "$(find "$EVIDENCE" -name '*.png' -size +500k)"
for f in "$EVIDENCE"/*.png; do test -s "$f"; done

ls -lS "$EVIDENCE" \
  > docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/evidence/png-inventory.txt
```

期待: 全 test 文 exit 0、inventory ファイル生成。

### 3-5. 目視 diff

local baseline と staging evidence を画像ビューワで pair 比較し、`outputs/phase-11/evidence/visual-diff-note.md` に以下を記録:

```markdown
| state | local | staging | verdict | 備考 |
| --- | --- | --- | --- | --- |
| input | <local png> | <staging png> | OK |  |
| sent | ... | ... | OK |  |
| unregistered | ... | ... | OK |  |
| rules-declined | ... | ... | OK |  |
| deleted | ... | ... | OK |  |
| error | ... | ... | OK |  |
| input-mobile | ... | ... | OK |  |
```

期待: 全 verdict `OK`（構造的回帰なし）。

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| staging deploy log | outputs/phase-11/evidence/staging-deploy.log | pending |
| warmup log | outputs/phase-11/evidence/warmup.log | pending |
| local compat log | outputs/phase-11/evidence/local-compat.log | pending |
| shellcheck log | outputs/phase-11/evidence/shellcheck.log | pending |
| staging smoke log | outputs/phase-11/staging-smoke.log | pending |
| PNG inventory | outputs/phase-11/evidence/png-inventory.txt | pending |
| visual diff note | outputs/phase-11/evidence/visual-diff-note.md | pending |
| staging png (input) | outputs/phase-11/staging-screenshots/login-input.png | pending |
| staging png (sent) | outputs/phase-11/staging-screenshots/login-sent.png | pending |
| staging png (unregistered) | outputs/phase-11/staging-screenshots/login-unregistered.png | pending |
| staging png (rules-declined) | outputs/phase-11/staging-screenshots/login-rules-declined.png | pending |
| staging png (deleted) | outputs/phase-11/staging-screenshots/login-deleted.png | pending |
| staging png (error) | outputs/phase-11/staging-screenshots/login-error.png | pending |
| staging png (input-mobile) | outputs/phase-11/staging-screenshots/login-input-mobile.png | pending |

本仕様書時点では全 `pending`。staging 実行後に `present` に更新する。

## 5. 完了基準

- 7 PNG が `outputs/phase-11/staging-screenshots/` に保存
- staging-smoke.log に `7 passed`
- visual-diff-note.md の全 verdict が `OK`
- AC-1〜AC-3 / AC-6 が満たされる

## 6. fail 時のフロー

| 症状 | 対応 |
|---|---|
| smoke fail (timeout) | warm-up 再実行 → 30 秒 wait → smoke 再実行（最大 3 回） |
| smoke fail (state 再現失敗) | spec の mock route / cookie 設定を確認、staging 環境の env / wrangler vars を `bash scripts/cf.sh` で照合 |
| PNG > 500KB | viewport / clip の見直し、不要 content の crop |
| 目視 diff で構造差 | 原因を切り分け、design token / typography drift があれば本 task の scope 外として別 followup 化 |

## 7. Phase 11 完了条件

- [x] Phase 11 mode = VISUAL 判定
- [x] 実行前準備 5 項目を確定
- [x] user-gated 実行 5 ステップを確定
- [x] evidence file inventory を確定（pending 状態で記載）
- [x] 完了基準を明示
- [x] fail 時のフローを記述

## 8. 次 Phase への引き継ぎ

Phase 11 完了後、本ファイル §4 inventory の status を `pending` → `present` に更新し、`outputs/phase-12/phase12-task-spec-compliance-check.md` §4 と同 wave で同期する。完了報告は Phase 12 implementation-guide.md / main 集約 entry に反映する。
