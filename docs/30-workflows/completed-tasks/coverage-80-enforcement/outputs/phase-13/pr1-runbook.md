# PR① Runbook — soft gate + tooling 投入

## 目的

鶏卵問題を回避するため、`coverage-gate` job を `continue-on-error: true`（**soft gate / 警告のみ**）で導入し、coverage-guard.sh / vitest config / package script / CI workflow を一括投入する。

## 前提条件

- Phase 12 必須 7 outputs PASS
- docs validator PASS
- 外部シークレット注入形式 / 計画系 wording / Secret 混入なし
- **user の明示承認**「PR① を作成してよい」
- base = `dev`

## スコープ（変更ファイル）

| 操作 | パス | 由来 |
| --- | --- | --- |
| 新規 | scripts/coverage-guard.sh | Phase 12 implementation-guide Part 2 関数シグネチャ |
| 編集 | vitest.config.ts | Part 2 vitest config セクション |
| 編集 | package.json (root) | `test:coverage` / `coverage:guard` script 追加 |
| 編集 | apps/web/package.json | per-package script 統一 |
| 編集 | apps/api/package.json | per-package script 統一 |
| 編集 | packages/shared/package.json | per-package script 統一 |
| 編集 | packages/integrations/package.json | per-package script 統一 |
| 編集 | packages/integrations/google/package.json | per-package script 統一 |
| 編集 | .github/workflows/ci.yml | coverage-gate job 追加（continue-on-error: true） |
| 編集 | docs/30-workflows/LOGS.md | spec_created 行追加（Step 1-A/1-B） |
| 編集 | CLAUDE.md | solo 運用ポリシー × CI hard gate 整合注記（追記のみ）|
| 同期 | UT-GOV-001 / UT-GOV-004 双方向リンク | Step 1-C |

## コマンド列（user 承認後のみ実行）

```bash
# 1. ブランチ作成（base=dev）
git switch dev
git pull origin dev
git switch -c feat/coverage-80-pr1-soft-gate

# 2. 上記ファイルを編集（実装は本タスク範囲外、別オペレーション）
#    - scripts/coverage-guard.sh 新規作成
#    - vitest.config.ts coverage セクション追加
#    - 各 package.json に test / test:coverage script 追加
#    - .github/workflows/ci.yml に coverage-gate job 追加（continue-on-error: true）
#    - docs/30-workflows/LOGS.md / CLAUDE.md 追記

# 3. 必要なファイルを明示 add
git add scripts/coverage-guard.sh \
        vitest.config.ts \
        package.json \
        apps/web/package.json \
        apps/api/package.json \
        packages/shared/package.json \
        packages/integrations/package.json \
        packages/integrations/google/package.json \
        .github/workflows/ci.yml \
        docs/30-workflows/LOGS.md \
        CLAUDE.md \
        docs/30-workflows/coverage-80-enforcement/

# 4. commit
git commit -m "$(cat <<'EOF'
feat(coverage): introduce 80% coverage tooling with soft gate (PR1/3)

- scripts/coverage-guard.sh: 新規。pnpm -r test:coverage を集計し、80% 未達時に top10 + 推奨テストパスを stderr 出力
- vitest.config.ts: coverage.provider=v8 / thresholds=80% (lines/branches/functions/statements) / include / exclude / perFile=false
- package.json (root + per-package): test / test:coverage / coverage:guard script 統一
- .github/workflows/ci.yml: coverage-gate job 追加 (continue-on-error: true / soft gate)
- docs / CLAUDE.md: 仕様書整備 + 整合注記 (追記のみ)

PR2/3 で package 別テスト追加 → PR3/3 で hard gate 化 + lefthook 統合 + 正本同期する 3 段階導入の第 1 段。

Refs #<issue>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"

# 5. push
git push -u origin feat/coverage-80-pr1-soft-gate

# 6. PR 作成
gh pr create \
  --base dev \
  --title "feat(coverage): introduce 80% coverage tooling (soft gate, PR1/3)" \
  --body "$(cat <<'EOF'
## 概要
全 package 80% カバレッジ強制の **第 1 段（PR1/3）**。鶏卵問題回避のため `coverage-gate` job は **continue-on-error: true（soft gate / 警告のみ）** で導入する。

## 変更内容
- scripts/coverage-guard.sh 新規（Phase 12 implementation-guide Part 2 仕様準拠）
- vitest.config.ts に coverage セクション追加（thresholds=80%）
- 各 package.json に test / test:coverage script 統一
- .github/workflows/ci.yml に coverage-gate job 追加（soft gate）
- docs/30-workflows/coverage-80-enforcement/ 仕様書一式
- CLAUDE.md 注記（追記のみ）

## CI 挙動
- `coverage-gate` は warning のみ。typecheck/lint/build が green なら merge 可
- 既存 PR への影響なし（hard gate は PR3/3 で切替）

## 後続
- PR2/3 (sub PRs): package 別 80% 達成テスト追加（packages/shared → integrations* → apps/api → apps/web）
- PR3/3: hard gate 化 + lefthook 統合 + aiworkflow-requirements 同期 + branch protection contexts 登録

## related work
- U-4 (soft → hard 切替リマインダ): 本 PR merge 時点で期限を Issue 登録（unassigned-task formalize 候補）
- U-5 (codecov.yml ↔ vitest.config 同期 lint): formalize 候補

## リスク
- coverage-guard.sh の jq 依存（macOS / Linux で挙動差確認済）
- soft gate なので破壊的変更なし

## 動作確認
- `pnpm install && pnpm test:coverage` ローカル実行で coverage/ 出力確認
- `bash scripts/coverage-guard.sh` exit 1 で top10 出力確認
- CI で `coverage-gate` job が warning として表示されることを確認

Refs #<issue>
EOF
)"
```

## 期待結果

| 項目 | 期待値 |
| --- | --- |
| `coverage-gate` job | warning（continue-on-error: true により FAIL でもマージ可） |
| 既存 typecheck / lint / build | 影響なし（green） |
| coverage artifact | upload-artifact で `coverage-report` が PR から DL 可能 |
| Codecov | CODECOV_TOKEN 設定時のみ upload（fail_ci_if_error: false） |

## 失敗時 rollback

| ケース | 対応 |
| --- | --- |
| coverage-guard.sh 実行エラー（exit 2 環境エラー） | jq バージョン確認 / mise install 再実行 / push 取り下げ → 修正再 push |
| vitest.config.ts の include / exclude 誤指定で全テスト fail | revert PR を即作成し PR① を巻き戻す |
| CI 全体が落ちる（typecheck / lint まで連鎖） | PR① を一旦 close → 再現 → 再 PR |
| package.json script 衝突 | 該当 package のみ revert commit を追加 push |

## branch protection 操作タイミング

**PR① では branch protection を操作しない**。`required_status_checks.contexts` への `coverage-gate` 追加は PR③ merge 後の別オペレーション。

## merge 後の必須アクション

- U-4「soft → hard 切替期限」を Issue として登録（リマインダ）
- baseline 計測（Phase 11）の結果を確認し、PR② sub PR の package 順序を決定
- 並行 open PR の作者へ「coverage-gate が warning で出る」旨を通知

## user 承認チェック

| 段階 | 承認内容 |
| --- | --- |
| PR① 作成承認 | 「PR① を作成してよい」 |
| PR① merge 承認 | 「PR① を merge してよい」 |

> 各承認は独立。作成承認だけで自動的に merge には進まない。
