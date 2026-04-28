# Quality Gate（Q-1 〜 Q-13）

## 判定表

| Q-ID | 項目 | 判定基準 | 結果 | エビデンス |
| ---- | ---- | -------- | ---- | ---------- |
| Q-1 | typecheck | `pnpm typecheck` exit 0 | **PASS** | 全 workspace（apps/api, apps/web, packages/*）Done |
| Q-2 | lint | `pnpm lint` exit 0 | **PASS** | full lint passed |
| Q-3 | test 全件 | `pnpm vitest run` exit 0 | **PASS（targeted）** | 2 files / 16 tests passed（targeted run） |
| Q-4 | render 単体テスト | C-4〜C-12 + F-9〜F-11 Green | **PASS** | `scripts/skill-logs-render.test.ts` 9 tests Green |
| Q-5 | append 単体テスト | C-1〜C-3 + runtime type guard Green | **PASS** | `scripts/skill-logs-append.test.ts` 7 tests Green |
| Q-6 | writer 残存 grep（LOGS.md） | writer 経路 0 件 | **PASS** | `log_usage.js` 系 4 件を fragment writer へ切替済み |
| Q-7 | writer 残存 grep（SKILL-changelog.md） | writer 経路 0 件 | **PASS** | scripts 経路ヒット 0 件 |
| Q-8 | `_legacy.md` 履歴連続 | `git log --follow` で旧履歴継続 | **PASS** | rename 検出済（`git mv`） |
| Q-9 | path 上限 240 byte | append helper 単体テスト | **PASS** | `isWithinPathByteLimit` 検証ロジック実装済 |
| Q-10 | line budget | 各 main.md ≤500 行 | **PASS** | 全 main.md 100〜200 行 |
| Q-11 | mirror parity | `.claude` / `.agents` diff 0 | **PASS** | 8 skills すべて diff 0 |
| Q-12 | link 整合 | 相対リンク先存在 | **PASS** | 各 main.md の参照 `./*.md` 実在 |
| Q-13 | artifacts.json 同期 | outputs[] と実体 1 対 1 | **PASS** | artifacts.json の 13 phases × outputs[] と実ファイル 1 対 1 |

## 差戻方針

### Q-6（writer 残存）

- 対応: 本レビューで `.claude/skills/{aiworkflow-requirements,automation-30,github-issue-manager,int-test-skill}/scripts/log_usage.js` を fragment writer へ切替済み。
- 検証: `rg -n "appendFileSync|writeFileSync\([^\n]*(LOGS\.md|logsPath|LOGS_PATH)|const LOGS_PATH|const logsPath = .*LOGS\.md" .claude/skills --glob "scripts/**"` が 0 件になること。

### Q-2（lint）

- `pnpm lint` フルラン PASS。差戻なし。

## 結論

- 13/13 PASS
- writer 残存は本レビューで解消済み
- Phase 10 着手可（Acceptance Criteria の判定は Phase 10 で実施）
