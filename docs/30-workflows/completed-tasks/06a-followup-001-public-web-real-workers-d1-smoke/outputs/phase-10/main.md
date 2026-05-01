# Phase 10 outputs — GO / NO-GO 判定書

## 判定基準

### GO 条件（すべて満たす）

| # | 条件 | 確認 |
| --- | --- | --- |
| G-1 | Phase 1〜9 の `phase-NN.md` + `outputs/phase-NN/main.md` 揃い | `ls` で存在確認 |
| G-2 | AC-1〜7 が ac-matrix.md で完全 trace | Read 確認 |
| G-3 | local + staging 両 green（`200 / 200 / 404 / 200` × 2） | 両 curl log 末尾 |
| G-4 | evidence 3 ファイル揃い | `ls outputs/phase-11/evidence/` |
| G-5 | secret hygiene rg ゲート 0 件 | 自動チェック |
| G-6 | 不変条件 #5 / AC-7 で 0 件確認 | `local-curl.log` 末尾 |
| G-7 | `wrangler` 直接呼び出し痕跡なし | shell history |
| G-8 | PR / commit に staging URL / token / D1 id なし | Phase 13 PR template |

### NO-GO 条件（いずれか 1 つで NO-GO）

| # | 条件 | 戻し先 |
| --- | --- | --- |
| N-1 | esbuild mismatch 再発（AC-1 不成立） | Phase 5 / 6 |
| N-2 | local `/members` 空 + seed なし（AC-3 不成立） | Phase 6 |
| N-3 | staging `PUBLIC_API_BASE_URL` が localhost | Phase 2 / 5 |
| N-4 | secret pattern hit ≥ 1 | Phase 9 / sanitize |
| N-5 | `apps/web` に D1 直接 import 検出（AC-7 違反） | scope out / 別 followup（一旦 NO-GO） |
| N-6 | evidence 3 ファイルいずれか欠損 | Phase 11 再実施 |
| N-7 | `wrangler` 直接実行痕跡 | CLAUDE.md 再徹底 |

## 判定タイミング

| 回 | タイミング | 主対象 |
| --- | --- | --- |
| 1 | Phase 11 着手 **直前** | G-1 / G-2 / N-3 / N-7（仕様完備 + 前提逸脱） |
| 2 | Phase 11 完了 **直後** | G-3〜G-8 / N-1 / N-2 / N-4 / N-5 / N-6 |

## エスカレーション

- N-5（D1 直接 import 検出）: 本タスクは smoke のみ。修正は別 followup へ切り出し。本 smoke の範囲では結果次第で GO 判定可だが、不変条件違反は別途記録
- N-3（vars 誤設定）: 09a deploy gate へ即時連携
- N-4（secret hit）: 未 push なら即時 fix、push 済みなら secret rotate 検討

## 判定書テンプレ（Phase 11 後に追記）

```
判定: GO / NO-GO
判定者: <ユーザー>
判定日時: YYYY-MM-DD HH:MM JST
G 条件: G-1 ✓ / G-2 ✓ / G-3 ✓ / G-4 ✓ / G-5 ✓ / G-6 ✓ / G-7 ✓ / G-8 ✓
N 条件: なし / N-X 該当（詳細）
追記事項: <特記>
```

## レビュー観点（横串）

1. 目的整合（mock では検出不能領域 smoke）
2. 不変条件 #5 の rg 結果による実証
3. secret hygiene 経路の逸脱なし
4. scope 維持（AC-7 違反時に実装修正へ越境しない）
5. evidence 3 ファイル固定遵守
6. AC-1 の 2 回連続 fresh 観測

## Phase 11 着手条件

- 本ファイルの第 1 回判定欄に **GO** が記録されること
- 第 1 回判定が NO-GO の場合は対応する戻し先 Phase に戻る
