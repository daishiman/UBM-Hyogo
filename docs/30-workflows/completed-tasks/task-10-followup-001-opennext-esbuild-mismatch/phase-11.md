# Phase 11: 手動 smoke / build evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 11 |
| 状態 | spec_created |
| visualEvidence | NON_VISUAL |

## 目的

build toolchain 修正の effectiveness をログとして固定し、再現可能な evidence を `outputs/phase-11/evidence/` に保管する。

## エビデンス取得項目

`outputs/phase-11/evidence/` 配下に次のログを取得:

| ファイル | 取得コマンド | 目的 |
| --- | --- | --- |
| `before-pnpm-why-esbuild.log` | `mise exec -- pnpm why esbuild`（修正前） | mismatch ベースライン |
| `before-build-cloudflare.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`（修正前、fail 想定） | エラー再現確認 |
| `after-pnpm-why-esbuild.log` | `mise exec -- pnpm why esbuild`（修正後） | 依存解決確認（AC-2） |
| `after-build-cloudflare.log` | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare`（修正後） | exit 0 確認（AC-1） |
| `esbuild-versions.log` | `find node_modules -path "*/@esbuild/*/package.json" -exec sh -c 'echo "{}:"; grep version {}' \;` | 全 binary が 0.25.4 |
| `typecheck.log` | `mise exec -- pnpm typecheck` | AC-3 |
| `lint.log` | `mise exec -- pnpm lint` | AC-3 |
| `test.log` | `mise exec -- pnpm test` | 既存 PASS 集合維持 |
| `tsx-smoke.log` | `mise exec -- pnpm skill:logs:render` | tsx 互換性確認 |
| `cf-sh-syntax.log` | `bash -n scripts/cf.sh` | AC-4 |
| `wrangler-version.log` | `bash scripts/cf.sh --version` | AC-4 |
| `lockfile-diff.txt` | `git diff --stat pnpm-lock.yaml && git diff pnpm-lock.yaml \| head -200` | AC-5 |
| `package-diff.txt` | `git diff package.json` | overrides 追加内容 |
| `runner-version.txt` | `node -v && pnpm -v && mise -v` | 実行環境スナップショット |

## 実行手順

```bash
set -o pipefail
TASK_DIR="docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch"
mkdir -p "$TASK_DIR/outputs/phase-11/evidence"

# 修正前（既存 fail 状態の記録）
mise exec -- pnpm why esbuild > "$TASK_DIR/outputs/phase-11/evidence/before-pnpm-why-esbuild.log" 2>&1
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare \
  > "$TASK_DIR/outputs/phase-11/evidence/before-build-cloudflare.log" 2>&1 || true

# === Phase 5 実装を適用 ===

# 修正後
mise exec -- pnpm why esbuild > "$TASK_DIR/outputs/phase-11/evidence/after-pnpm-why-esbuild.log" 2>&1
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare \
  > "$TASK_DIR/outputs/phase-11/evidence/after-build-cloudflare.log" 2>&1
echo "exit=$?" >> "$TASK_DIR/outputs/phase-11/evidence/after-build-cloudflare.log"

find node_modules -path "*/@esbuild/*/package.json" \
  -exec sh -c 'echo "{}:"; grep "\"version\"" {}' \; \
  > "$TASK_DIR/outputs/phase-11/evidence/esbuild-versions.log" 2>&1

mise exec -- pnpm typecheck > "$TASK_DIR/outputs/phase-11/evidence/typecheck.log" 2>&1
mise exec -- pnpm lint > "$TASK_DIR/outputs/phase-11/evidence/lint.log" 2>&1
mise exec -- pnpm test > "$TASK_DIR/outputs/phase-11/evidence/test.log" 2>&1
mise exec -- pnpm skill:logs:render > "$TASK_DIR/outputs/phase-11/evidence/tsx-smoke.log" 2>&1
bash -n scripts/cf.sh > "$TASK_DIR/outputs/phase-11/evidence/cf-sh-syntax.log" 2>&1
bash scripts/cf.sh --version > "$TASK_DIR/outputs/phase-11/evidence/wrangler-version.log" 2>&1

git diff --stat pnpm-lock.yaml > "$TASK_DIR/outputs/phase-11/evidence/lockfile-diff.txt"
git diff pnpm-lock.yaml | head -200 >> "$TASK_DIR/outputs/phase-11/evidence/lockfile-diff.txt"
git diff package.json > "$TASK_DIR/outputs/phase-11/evidence/package-diff.txt"
{ node -v; pnpm -v; mise -v; } > "$TASK_DIR/outputs/phase-11/evidence/runner-version.txt"
```

## 判定基準（main.md に記録する内容）

`outputs/phase-11/main.md` に次の表を埋める:

| エビデンス | 期待 | 実測 | 判定 |
| --- | --- | --- | --- |
| after-build-cloudflare.log の exit | 0 | _TBD_ | _PASS/FAIL_ |
| after-pnpm-why-esbuild.log + esbuild-versions.log の mismatch pair | 0 | _TBD_ | _PASS/FAIL_ |
| esbuild-versions.log の全 version | 0.25.4 | _TBD_ | _PASS/FAIL_ |
| typecheck / lint / test | green | _TBD_ | _PASS/FAIL_ |
| tsx-smoke.log | エラーなし | _TBD_ | _PASS/FAIL_ |
| wrangler-version.log | 4.85.0 | _TBD_ | _PASS/FAIL_ |
| lockfile-diff.txt | esbuild 関連のみ | _TBD_ | _PASS/FAIL_ |

## 失敗時の追加エビデンス

Phase 6 異常系のいずれかが発生した場合、`outputs/phase-11/evidence/anomalies/` 配下に次を追加保管:

- `<scenario>-stderr.log`
- 該当 fix の `git diff`
- `pnpm why <衝突パッケージ>.log`

## 完了条件

- [ ] 13 ファイルのエビデンスが揃っている（または failure 時の追加エビデンスを含む）
- [ ] `main.md` の判定表が全行 PASS
- [ ] AC-1〜AC-5 のエビデンスが取得済み

## 成果物

- `outputs/phase-11/main.md`
- `outputs/phase-11/evidence/*` 一式

## 実行タスク

- workflow-local evidence directory を作成する
- baseline fail と修正後 PASS のログを取得する
- typecheck / lint / test / tsx / cf.sh wrapper / lockfile diff / runner version を記録する
- failure 時は anomalies evidence を追加する

## 統合テスト連携

Phase 11 は本タスクの主要統合検証であり、AC-1〜AC-5 と Phase 9 品質ゲートの実測根拠になる。

## 参照資料

- Phase 4 エビデンス取得項目
- Phase 5 実装ランブック
- Phase 7 AC マトリクス
