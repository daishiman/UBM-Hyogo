# Skill Feedback Report — UT-07C-FU-001

## 利用 skill / agent

| skill | 用途 | 結果 |
| --- | --- | --- |
| 標準実装フロー (Phase 1-12) | 仕様駆動の TDD 実装 | 問題なし |
| `aiworkflow-requirements` indexes | task spec 検索 / 命名突合 | 問題なし |

## 学び / 共通化候補

| 項目 | 内容 |
| --- | --- |
| vitest config 二系統 | `apps/api` の `*.contract.spec.ts` は `vitest.d1.config.ts` でしか実行されない。Phase 7 のカバレッジ確認時に「No test files found」になる罠があるため、skill `task-implementation-runner` の checklist に "contract.spec は d1 config 経由" を明記すべき |
| `exactOptionalPropertyTypes: true` 配慮 | `?:` フィールドを別パッケージ間で渡す際は `string | undefined` を明示する必要がある。新規 interface 設計時の TS hint |
| `JSX.Element` 名前空間 | React 19 系では `React.JSX.Element` を使用（global namespace 解決を回避） |

## skill 更新提案

- `task-implementation-runner`: contract spec の実行系統と coverage 取得手順を 1 行追記
- `task-specification-creator`: API endpoint 追加時の正本 spec 更新（`specs/01-api-schema.md`）を必須化

## 改善されると効率化される作業

- Phase 11 screenshot の `playwright auth storage` を bootstrap 化（既存 `lhci-auth-storage` の admin 版が望ましい）
