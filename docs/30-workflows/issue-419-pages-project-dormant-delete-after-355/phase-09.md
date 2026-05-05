# Phase 9: 品質保証

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task | issue-419-pages-project-dormant-delete-after-355 |
| phase | 09 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created |

## 目的

本タスクの spec_created / runtime それぞれの段階で通すべき品質 gate を集約する。
destructive 操作のため、自動 gate（typecheck / lint / sync:check / indexes drift）に加え、
手動 gate（redaction grep / `whoami` / user 承認文言）を必須化する。

## 入力（参照ドキュメント）

- Phase 5 [`phase-05.md`](phase-05.md) Step 7 redaction
- Phase 6 [`phase-06.md`](phase-06.md) 停止条件
- Phase 7 [`phase-07.md`](phase-07.md) AC マトリクス
- `CLAUDE.md` の lefthook / sync:check / indexes:rebuild 運用

## 変更対象ファイル一覧

| パス | 種別 | 差分方針 |
| --- | --- | --- |
| `outputs/phase-09/main.md` | 新規 | gate 実行結果テンプレ（spec_created PASS + runtime PENDING） |

## 品質ゲート

### 自動 gate（spec_created で通す）

| Gate | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| sync:check | `mise exec -- pnpm sync:check` | origin/main / origin/dev に対する drift 報告のみ。本タスクの spec PR が遅れていないこと |
| indexes drift | `mise exec -- pnpm indexes:rebuild` 実行後に `git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` | drift 0 件（CI `verify-indexes-up-to-date` と整合） |
| lefthook pre-commit | `pnpm install` 経由で `lefthook install` 済み。commit 時に自動実行 | hook PASS（merge commit 例外は CLAUDE.md 記載通り） |

### 自動 gate（runtime cycle で通す）

| Gate | コマンド | 期待 |
| --- | --- | --- |
| redaction grep | `rg -i '(CLOUDFLARE_API_TOKEN\|bearer\|token=\|sink\|secret\|account_id)' docs/30-workflows/issue-419-pages-project-dormant-delete-after-355/outputs/` | 0 件 |
| Workers production smoke | `curl -sS -o /dev/null -w '%{http_code}' https://<production-host>/` | 200 |

### 手動 gate（runtime cycle で通す）

| Gate | 確認内容 |
| --- | --- |
| `bash scripts/cf.sh whoami` | exit 0 / account 表示 |
| user 明示承認文言 | PR description または Issue comment に保存され、`outputs/phase-11/user-approval-record.md` に転記済み |
| Phase 6 停止条件 5 項目 | 全件 NO（停止トリガなし）であることを runbook の checklist で確認 |
| `aiworkflow-requirements` Pages 言及更新 | `rg "Cloudflare Pages\|pages\.dev\|pages project" .claude/skills/aiworkflow-requirements/references/` の差分が「削除済み（YYYY-MM-DD）」へ書き換わっている |

## shellcheck / shfmt

- 本タスクは `scripts/cf.sh` への破壊的変更なし、新規 shell script なし
- shellcheck / shfmt は対象外

## テスト追加方針

- 新規 shell script の追加は不要（passthrough 設計を流用）
- そのため `scripts/__tests__/` への bats / vitest テスト追加は本タスクでは行わない
- 将来 `pages` ops を helper 化する判断が出た場合のみ env guard / dry-run のテストを追加する

## カバレッジ方針

- destructive 1 回限りの操作のため line coverage 数値ではなく gate 通過 / evidence 完備を品質基準とする
- 本 PR の coverage 影響なし（`pnpm coverage` は対象外）

## redaction / secret 検証

- `rg -i '(CLOUDFLARE_API_TOKEN|bearer|token=|sink|secret|account_id)'` を全 `outputs/` に対して実行
- `git grep -nE "ya29\\.|sk_live_|AKIA[0-9A-Z]{16}"` 結果が空であること
- `op://` 参照は `.env` のみ

## 完了条件 (DoD)

- [ ] 自動 gate（typecheck / lint / sync:check / indexes drift）が全 PASS
- [ ] redaction grep が 0 件 PASS（runtime 後）
- [ ] user 承認文言が記録され、削除コマンド exit 0 が evidence に残っている（runtime 後）
- [ ] Workers production が 200 OK 維持（runtime 後）
- [ ] aiworkflow-requirements Pages 言及が「削除済み」状態へ更新済み（runtime 後）
- [ ] spec_created 時点では runtime gate を `PENDING_RUNTIME_EXECUTION` として明記している

## 実行タスク

- Phase 09 で gate 一覧と PASS / pending 境界を確定する。

## 参照資料

- [phase-05.md](phase-05.md)
- [phase-06.md](phase-06.md)
- [phase-07.md](phase-07.md)
- `CLAUDE.md`

## 成果物

- `outputs/phase-09/main.md`
