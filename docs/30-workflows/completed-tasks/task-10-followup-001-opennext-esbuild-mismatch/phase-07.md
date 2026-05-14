# Phase 7: AC マトリクス

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| Phase | 7 |
| 状態 | spec_created |

## 目的

index.md の AC-1〜AC-10 を Phase 別の検証ステップにマップし、各 AC が確実に確認される配線を担保する。

## AC × Phase マトリクス

| AC | 説明 | 確認 Phase | 確認方法 |
| --- | --- | --- | --- |
| AC-1 | `build:cloudflare` exit 0 | Phase 5 Step 5 / Phase 11 | `after-build-cloudflare.log` の終端 exit code |
| AC-2 | OpenNext host/binary mismatch pair 0 件 | Phase 5 Step 4 / Phase 11 | `after-pnpm-why-esbuild.log` + `esbuild-versions.log` grep |
| AC-3 | typecheck / lint green | Phase 5 Step 8 | `typecheck.log` / `lint.log` |
| AC-4 | wrangler 経路回帰なし | Phase 5 Step 8 / Phase 11 | `wrangler-version.log` 等 |
| AC-5 | lockfile 差分が overrides 由来のみ | Phase 5 Step 9 | `git diff --stat pnpm-lock.yaml` 目視 |
| AC-6 | 再現手順ノート追加 | Phase 12 | `docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md` または `scripts/cf.sh` ヘッダ |
| AC-7 | aiworkflow fragment/index/task-workflow 同期 | Phase 12 | `.claude/skills/aiworkflow-requirements/lessons-learned/`、`changelog/`、`LOGS/_legacy.md`、`indexes/`、`references/task-workflow-active.md` の diff |
| AC-8 | 不変条件違反なし | Phase 3 / Phase 10 | レビュー記述 |
| AC-9 | Phase 12 close-out strict 7 canonical files | Phase 12 | 正規 7 ファイル名を `test -f` で逐語確認 |
| AC-10 | skill 検証 4 条件 | Phase 10 | `outputs/phase-10/main.md` の評価 |

## 検証エビデンス対応

| AC | エビデンス ファイル |
| --- | --- |
| AC-1 | `outputs/phase-11/evidence/after-build-cloudflare.log` |
| AC-2 | `outputs/phase-11/evidence/after-pnpm-why-esbuild.log`, `esbuild-versions.log` |
| AC-3 | `outputs/phase-11/evidence/typecheck.log`, `lint.log` |
| AC-4 | `outputs/phase-11/evidence/wrangler-version.log`, `tsx-smoke.log` |
| AC-5 | `outputs/phase-11/evidence/lockfile-diff.txt`（手動取得） |
| AC-6 | `docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md` の diff |
| AC-7 | aiworkflow-requirements lesson/changelog/log/index/task-workflow の diff |
| AC-8 | Phase 3 / Phase 10 のレビュー記述 |
| AC-9 | `outputs/phase-12/{main,implementation-guide,documentation-changelog,phase12-task-spec-compliance-check,skill-feedback-report,system-spec-update-summary,unassigned-task-detection}.md` の存在確認 |
| AC-10 | `outputs/phase-10/main.md` |

## 完了条件

- [ ] 全 AC が確認 Phase / 方法 / エビデンスに対応している
- [ ] エビデンス取得漏れがないことが整合している

## 成果物

- `outputs/phase-07/main.md`

## 実行タスク

- AC-1〜AC-10 を Phase と evidence file に対応付ける
- AC-9 の strict 7 canonical filenames を逐語確認対象として固定する
- AC-7 の aiworkflow same-wave sync 対象を漏れなく列挙する

## 統合テスト連携

AC-1〜AC-5 は Phase 11 evidence、AC-6〜AC-10 は Phase 12 / Phase 10 の compliance evidence で確認する。

## 参照資料

- `index.md` の AC 一覧
- Phase 4 エビデンス取得項目
