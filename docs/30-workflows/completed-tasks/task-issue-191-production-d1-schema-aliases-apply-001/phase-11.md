# Phase 11: NON_VISUAL evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |
| 縮約テンプレ | docs-only / NON_VISUAL ではないが、production-operation で UI を持たないため NON_VISUAL evidence セットを採用 |

## 目的

production apply 着手前に揃える evidence と、Phase 13 で取得する evidence のテンプレを整備する。Phase 11 時点では (A) 静的検査 / local 再検証 / 認証準備の evidence を確定する。production CLI 実測 evidence は Phase 13 で取得する。

## 実行タスク

- Phase 9 の static / local / typecheck 結果を NON_VISUAL evidence として保存する。
- Phase 13 で取得する runtime evidence の予約 path を定義する。
- 「Phase 11 完了」と「production 実測 PASS」を混同しない境界を明記する。

## evidence ファイル一覧

### Phase 11 で取得（apply 前 / read-only / 静的）

| ID | path | 内容 |
| --- | --- | --- |
| EV-11-1 | `outputs/phase-11/static-checks.md` | S-1〜S-5 の rg / ls 結果 |
| EV-11-2 | `outputs/phase-11/local-pragma-evidence.md` | local D1 の `PRAGMA table_info` / `PRAGMA index_list` 結果 |
| EV-11-3 | `outputs/phase-11/typecheck-lint.md` | `pnpm typecheck` / `pnpm lint` 結果 |
| EV-11-4 | `outputs/phase-11/cli-wrapper-grep.md` | `wrangler d1 migrations apply` 直叩き 0 件確認 |
| EV-11-5 | `outputs/phase-11/env-binding-evidence.md` | `apps/api/wrangler.toml` の `[env.production]` D1 binding 確認 |
| EV-11-6 | `outputs/phase-11/production-apply-readiness.md` | Phase 13 実行前チェックリストの最終確認結果 |

### Phase 13 で取得（apply 実測 / Runtime GO 後）

| ID | path | 内容 |
| --- | --- | --- |
| EV-13-1 | `outputs/phase-13/user-approval.md` | ユーザー承認テキストとタイムスタンプ |
| EV-13-2 | `outputs/phase-13/migrations-list-before.txt` | apply 前 migration list |
| EV-13-3 | `outputs/phase-13/tables-before.txt` | apply 前 sqlite_master 抜粋 |
| EV-13-4 | `outputs/phase-13/migrations-apply.log` | apply 実行ログ |
| EV-13-5 | `outputs/phase-13/pragma-table-info.txt` | apply 後 PRAGMA table_info |
| EV-13-6 | `outputs/phase-13/pragma-index-list.txt` | apply 後 PRAGMA index_list |
| EV-13-7 | `outputs/phase-13/migrations-list-after.txt` | apply 後 migration list |

## evidence 検証境界

- 「Phase 11 完了 = 仕様書 + 静的検査 + local 再検証が揃った状態」であり、production apply の **実測 PASS ではない**。
- production 実測 PASS は Phase 13 の Runtime GO 後に EV-13-* が揃って初めて成立する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 11 template | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | NON_VISUAL evidence set |
| quality result | `phase-09.md` | static / local / typecheck source |
| GO/NO-GO | `phase-10.md` | runtime gate |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| main evidence index | `outputs/phase-11/main.md` | NON_VISUAL evidence index |
| static checks | `outputs/phase-11/static-checks.md` | S-1〜S-5 結果 |
| local pragma evidence | `outputs/phase-11/local-pragma-evidence.md` | local D1 schema confirmation |
| typecheck / lint | `outputs/phase-11/typecheck-lint.md` | repo checks |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 12 | evidence 境界を implementation guide / compliance に反映 | `outputs/phase-12/*` |
| Phase 13 | runtime evidence を承認後に採取 | `outputs/phase-13/*` |

## 完了条件

- [ ] EV-11-1〜EV-11-6 の path とテンプレが定義されている
- [ ] EV-13-1〜EV-13-7 が Phase 13 で取得される設計になっている
- [ ] 「Phase 11 完了 ≠ production 実測 PASS」境界が明記されている
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 12: ドキュメント同期
