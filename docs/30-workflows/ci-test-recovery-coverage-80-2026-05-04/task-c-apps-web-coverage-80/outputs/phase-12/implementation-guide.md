# Task C 実装ガイド (implementation-guide.md)

## Part 1: 中学生レベルの説明

テストの回復とカバレッジ 80% 達成は、学校の提出箱を整える作業に似ている。提出物が箱に入っていても、名前が違ったり、置き場所がメモと違ったりすると先生は確認できない。このタスクでは、どの箱を先に直すか、どの記録を見ればよいかをそろえて、次の人が迷わず作業できるようにする。

なぜ必要か。CI の失敗を直す前に、Task C の目的、依存、証跡の置き場所がずれていると、実装者が違うファイルを直したり、まだ取っていない証跡を PASS と誤認したりするため。

| 専門用語 | 日常語の言い換え |
| --- | --- |
| CI | 自動で答案を採点する仕組み |
| coverage | 調べた範囲の割合 |
| artifact | 作業の証拠ファイル |
| Phase | 作業の順番 |
| gate | 次へ進んでよいかを見る関門 |

## Part 2: 技術者レベルの実行仕様

### Canonical identity

| 項目 | 値 |
| --- | --- |
| task_id | `ci-recover-task-c-web-coverage-80` |
| canonical_dir | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-c-apps-web-coverage-80/` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |
| dependencies | `ci-recover-task-a-vitest-jsx-dev-runtime` |

### 実行 API / コマンド契約

`artifacts.json.metadata.verify_commands[]` を正本とし、後続実装時は次を実行して Phase 11 にログを保存する。

- `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage`
- `bash scripts/coverage-guard.sh --package apps/web`

### エラーハンドリングと境界

- コマンドが失敗した場合は Phase 11 を PASS にせず、該当 log と失敗理由を `outputs/phase-11/` に残す。
- 80% に届かないファイルは後送りにせず、同一タスク内でテスト追加、fixture 補強、または根拠付き exclude として閉じる。
- Phase 13 の commit / push / PR はユーザー明示承認まで blocked のままにする。

### 設定値

| 定数 | 値 |
| --- | --- |
| coverage threshold | Statements / Branches / Functions / Lines all >= 80 |
| Phase 12 strict outputs | main.md + 6 補助ファイル = 7 files |
| runtime evidence | NON_VISUAL logs, no screenshots |
