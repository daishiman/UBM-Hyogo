# Phase 10: 最終レビュー（GO / NO-GO 判定）

## 目的

Phase 1〜9 の成果を統合し、Phase 11 手動 smoke を実行に移して良いか（GO）または前段に戻るか（NO-GO）の最終判定基準を確定する。判定は Phase 11 実施 **直前** と **直後** の 2 回適用する。

## 判定マトリクス

### GO 条件（すべて満たすこと）

| # | 条件 | 確認手段 |
| --- | --- | --- |
| G-1 | Phase 1〜9 のすべての `phase-NN.md` が存在し、`outputs/phase-NN/main.md` も揃っている | `ls outputs/phase-{01..09}/main.md` |
| G-2 | AC-1〜7 が Phase 7 マトリクスで verify / evidence / 不変条件 / 戻し先 まで埋まっている | `outputs/phase-07/ac-matrix.md` を Read で確認 |
| G-3 | local + staging 両方が green（AC-2 / AC-4 が `200 / 200 / 404 / 200`） | `local-curl.log` / `staging-curl.log` 末尾 |
| G-4 | evidence 3 ファイル（`local-curl.log` / `staging-curl.log` / `staging-screenshot.png`）が揃っている | `ls outputs/phase-11/evidence/` |
| G-5 | secret hygiene 自動チェック（Phase 9）が 0 件 | `rg -i "(api[_-]?token\|database_id)"` |
| G-6 | 不変条件 #5 が AC-7 で 0 件確認済み | `local-curl.log` 末尾の rg 結果 |
| G-7 | `wrangler` 直接呼び出しが Phase 11 実施履歴に存在しない | shell history / runbook trace |
| G-8 | staging URL / API token / D1 id が PR description / commit message に含まれていない | Phase 13 PR template 確認時 |

### NO-GO 条件（いずれか 1 つでも該当したら NO-GO）

| # | 条件 | 戻し先 |
| --- | --- | --- |
| N-1 | AC-1 が再現せず esbuild mismatch が発生 | Phase 5 runbook → Phase 6 異常系 |
| N-2 | local smoke で `/members` が空配列 + seed なし（AC-3 不成立） | Phase 6 異常系（D1 migration 確認） |
| N-3 | staging `PUBLIC_API_BASE_URL` が localhost を指している | Phase 2 設計 / Phase 5 runbook |
| N-4 | secret pattern hit が 1 件以上 | Phase 9 / Phase 11 evidence の sanitize |
| N-5 | `apps/web` 配下に D1 直接 import が存在（AC-7 違反） | **本タスク scope out**（別 followup として切り出し）／一旦 NO-GO |
| N-6 | evidence 3 ファイルのいずれかが欠損 | Phase 11 再実施 |
| N-7 | `wrangler` 直接実行の痕跡が残っている | CLAUDE.md ルール再徹底 → Phase 5 |

## 判定タイミング

| 判定回 | タイミング | 主な確認対象 |
| --- | --- | --- |
| 第 1 回 | Phase 11 着手 **直前** | G-1 / G-2（仕様の完備）、N-3 / N-7（前提逸脱） |
| 第 2 回 | Phase 11 完了 **直後** | G-3〜G-8（実 evidence の検証）、N-1 / N-2 / N-4 / N-5 / N-6 |

## レビュー観点（横串）

1. **目的整合**: 「mock では検出不能領域の smoke」という purpose に対して local + staging 両 green 以外で GO はあり得ない
2. **不変条件**: #5 が単なる文書宣言ではなく AC-7 の rg 結果として 0 件確認できているか
3. **secret hygiene**: 1Password 注入経路を逸脱していないか（`wrangler login` の OAuth トークン残存禁止）
4. **scope 維持**: AC-7 が違反した場合に「本タスクで実装修正を始めない」境界を死守（別 followup へ切り出す）
5. **evidence 形式**: 3 ファイル固定（Phase 8 DRY 化）が守られているか
6. **再現性**: AC-1 の 2 回連続 fresh 起動が観測されているか

## エスカレーション基準

- N-5（D1 直接 import 検出）: 本タスクは smoke のみのため修正範囲外。別 followup 起票して GO 判定は「本 smoke の範囲では GO だが、不変条件 #5 違反検出という追加成果あり」として記録
- N-3（PUBLIC_API_BASE_URL 誤設定）: staging deploy 設定の根本問題。09a deploy gate へ即時連携
- N-4（secret hit）: evidence の即時 sanitize + git 履歴に未 push 段階で fix（push 済みの場合は別途 secret rotate 検討）

## GO 判定書式（Phase 11 完了後に記録）

判定結果は `outputs/phase-10/main.md` の末尾に以下フォーマットで記録する:

```
判定: GO / NO-GO
判定者: <ユーザー>
判定日時: YYYY-MM-DD HH:MM JST
G 条件達成状況: G-1 ✓ / G-2 ✓ / ... / G-8 ✓
N 条件触れ: なし / N-X 該当（詳細）
追記事項: <特記>
```

## 横断確認: Phase 1〜9 との整合

| Phase | 整合確認 |
| --- | --- |
| Phase 1 要件 | AC-1〜7 が確定し、本判定 G-2 で参照可能 |
| Phase 2 設計 | local + staging 二段網羅が GO 条件 G-3 と直結 |
| Phase 3 設計レビュー | 案 B 採用が GO 条件の前提（local 省略不可） |
| Phase 4 テスト戦略 | curl matrix が ac-matrix.md と整合 |
| Phase 5 runbook | N-1 / N-2 / N-7 の戻し先 |
| Phase 6 異常系 | esbuild mismatch / migration 未 apply 時のリカバリ手順を保持 |
| Phase 7 AC マトリクス | G-2 の正本 |
| Phase 8 DRY 化 | evidence 3 ファイル固定が G-4 / N-6 の前提 |
| Phase 9 QA | secret hygiene が G-5 / N-4 / G-8 の前提 |

## 判定運用上の注意

- 第 1 回判定で GO が出ない限り Phase 11 に進まない
- 第 2 回判定後に NO-GO となった場合、戻し先 Phase の成果物を更新してから再度 Phase 11 を実施する
- N-5（scope 越境）検出時は本タスクで修正せず、別 followup として記録した上で本 smoke の範囲では GO を許容する運用とする

## 完了条件

- [ ] 既存の完了条件を満たす

- 上記 GO / NO-GO 条件と判定タイミングが `outputs/phase-10/main.md` に反映
- Phase 11 着手前の第 1 回判定で GO が記録されない限り、Phase 11 を開始しない運用が明文化
- N-5 のような scope 越境ケースで「本タスクで修正しない」境界が明示
- Phase 1〜9 との整合確認が表で残されている

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 10
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- GO / NO-GO 判定をまとめる
- Phase 11 へ進む前の残リスクを明示する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-10/main.md`

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。

