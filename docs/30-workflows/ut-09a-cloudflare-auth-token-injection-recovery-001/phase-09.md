# Phase 9: 品質保証 — ut-09a-cloudflare-auth-token-injection-recovery-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-09a-cloudflare-auth-token-injection-recovery-001 |
| task_id | UT-09A-CLOUDFLARE-AUTH-TOKEN-INJECTION-RECOVERY-001 |
| phase | 9 / 13 |
| wave | Wave 9 |
| mode | serial |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #414 (treated as CLOSED for spec) |

## 目的

Phase 11 の実 `whoami` 復旧実行を行う前提として、ローカル品質ゲート（typecheck / lint / shell script の構文チェック / artifacts validator）が全て通ることを確認する。`scripts/cf.sh` / `scripts/with-env.sh` に最小修正を加えた場合は shellcheck 相当の構文確認も行う。

## 実行タスク

1. `mise exec -- pnpm typecheck` を実行（本タスクは shell スクリプトが中心だが、リポジトリ全体の typecheck は通る状態を維持）
2. `mise exec -- pnpm lint` を実行
3. `scripts/cf.sh` / `scripts/with-env.sh` を変更した場合は `bash -n scripts/cf.sh` / `bash -n scripts/with-env.sh` で構文確認
4. （shellcheck がローカルにある場合）`shellcheck scripts/cf.sh scripts/with-env.sh` で静的解析
5. `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001` を実行して artifacts parity を確認
6. coverage-guard / staged-task-dir-guard hook が main 取り込み済み worktree 上で PASS することを確認（spec_created 段階では merge skip 規則が効くこと）

## 参照資料

- CLAUDE.md「よく使うコマンド」セクション
- scripts/cf.sh / scripts/with-env.sh
- .claude/skills/task-specification-creator/scripts/validate-phase-output.js

## 統合テスト連携

- validator は Phase 11 runtime evidence の実測 PASS ではなく、仕様書構造の gate として扱う
- 実 `whoami` 実行 / token 再発行 / `wrangler login` 残置除去は Phase 11 で explicit user instruction 後に実行する

## 実行手順

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash -n scripts/cf.sh
bash -n scripts/with-env.sh
# shellcheck がある場合のみ
shellcheck scripts/cf.sh scripts/with-env.sh || true
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  docs/30-workflows/ut-09a-cloudflare-auth-token-injection-recovery-001
```

## 多角的チェック観点

- runtime close-out 段階では `whoami-exit-code.log` 等の evidence 実体、artifacts parity、Phase 12 compliance が同じ `runtime_evidence_captured` 状態であること
- typecheck / lint failure は本タスクの shell 系修正と無関係でも全体が通る状態を維持
- shell 構文エラーは即時是正

## サブタスク管理

- [ ] typecheck 結果を outputs/phase-09/typecheck.log に保存
- [ ] lint 結果を outputs/phase-09/lint.log に保存
- [ ] shell 構文確認結果を outputs/phase-09/shell-syntax.log に保存
- [ ] validator 出力を outputs/phase-09/validator.log に保存
- [ ] outputs/phase-09/main.md を作成する

## 成果物

- `outputs/phase-09/main.md`
- `outputs/phase-09/typecheck.log`
- `outputs/phase-09/lint.log`
- `outputs/phase-09/shell-syntax.log`
- `outputs/phase-09/validator.log`

## 完了条件

- typecheck / lint / shell 構文確認が exit 0
- artifacts parity が PASS
- spec_created 状態を逸脱した「Phase 11 PASS 化」が起きていない
- coverage-guard / staged-task-dir-guard hook が誤検知していない

## タスク100%実行確認

- [ ] ローカル gate が通っている
- [ ] artifacts parity が PASS
- [ ] shell 構文エラーがない

## 次 Phase への引き渡し

Phase 10 へ、ローカル QA 結果（log 一式）と shell 構文確認結果を渡す。
