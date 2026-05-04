# Phase 11: 手動 smoke / 実測 evidence — ut-web-cov-04-admin-lib-ui-primitives-coverage

[実装区分: 実装仕様書] — Phase 5 で追加した 13 件のテストに対し、`pnpm test:coverage` を実行して `coverage-summary.json` を採取し AC 達成を実測する evidence 採取フェーズ。実測値が AC 未達の場合は Phase 5 へ回帰する実装サイクルを伴うため。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-web-cov-04-admin-lib-ui-primitives-coverage |
| phase | 11 / 13 |
| wave | ut-coverage |
| mode | parallel |
| 作成日 | 2026-05-01 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 判定根拠 | テスト追加実装後に実測 coverage を採取し AC 達成を確認する。NON_VISUAL のため UI smoke ではなく lint/typecheck/test/build の手動確認ログで代替する。 |

## 目的

Phase 5/8 で追加・拡張した 13 件のテストを実行し、`apps/web/coverage/coverage-summary.json` を baseline (2026-05-01) と対照させて AC（Stmts/Lines/Funcs ≥85% / Branches ≥80%）達成を実測する。NON_VISUAL タスクのため UI smoke は行わず、lint/typecheck/test/build の手動確認ログを残す。AC 未達の場合の Phase 5 回帰ループ手順を定義する。

## 実測 evidence 収集手順

### 1. baseline 取得（実装着手前 / 既採取済の確認）

- baseline 起票時点 (2026-05-01) の `apps/web/coverage/coverage-summary.json` 抜粋を `outputs/phase-11/coverage-before.json` として固定する。
- Phase 1 baseline 表（13 行）と一致していることを確認する。

### 2. after 取得（実装後）

```bash
# 必ず mise exec 経由で Node 24 / pnpm 10 を保証
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage
```

- 完走後、`apps/web/coverage/coverage-summary.json` の対象 13 ファイル分を抜粋し `outputs/phase-11/coverage-after.json` として保存する。
- `apps/web/coverage/lcov-report/index.html` は配置不要（容量が大きいため）。

### 3. 対照表作成

`outputs/phase-11/coverage-diff.md` に下表形式で記録:

| ファイル | Stmts (before → after) | Branches (before → after) | Funcs (before → after) | Lines (before → after) | AC 判定 |
| --- | --- | --- | --- | --- | --- |
| `apps/web/src/lib/admin/server-fetch.ts` | 12.5 → ? | n/a → ? | 0 → ? | 12.5 → ? | ✅/❌ |
| `apps/web/src/lib/admin/api.ts` | 17.24 → ? | n/a → ? | 0 → ? | 17.24 → ? | ✅/❌ |
| `apps/web/src/lib/admin/types.ts` | 0 → ? | 0 → ? | 0 → ? | 0 → ? | ✅/❌ |
| `apps/web/src/components/ui/Toast.tsx` | 61.53 → ? | n/a → ? | 50 → ? | 61.53 → ? | ✅/❌ |
| `apps/web/src/components/ui/Modal.tsx` | n/a → ? | 46.15 → ? | n/a → ? | n/a → ? | ✅/❌ |
| `apps/web/src/components/ui/Drawer.tsx` | n/a → ? | 64.7 → ? | n/a → ? | n/a → ? | ✅/❌ |
| `apps/web/src/components/ui/Field.tsx` | n/a → ? | 50 → ? | n/a → ? | n/a → ? | ✅/❌ |
| `apps/web/src/components/ui/Segmented.tsx` | n/a → ? | n/a → ? | 50 → ? | n/a → ? | ✅/❌ |
| `apps/web/src/components/ui/Switch.tsx` | n/a → ? | n/a → ? | 50 → ? | n/a → ? | ✅/❌ |
| `apps/web/src/components/ui/Search.tsx` | n/a → ? | n/a → ? | 66.66 → ? | n/a → ? | ✅/❌ |
| `apps/web/src/components/ui/icons.ts` | 0 → ? | 0 → ? | 0 → ? | 0 → ? | ✅/❌ |
| `apps/web/src/components/ui/index.ts` | 0 → ? | 0 → ? | 0 → ? | 0 → ? | ✅/❌ |
| `apps/web/src/lib/url/login-state.ts` | n/a → ? | 33.33 → ? | n/a → ? | n/a → ? | ✅/❌ |

判定基準:

- ✅: Stmts/Lines/Funcs ≥85% かつ Branches ≥80%
- ❌: いずれかの metric が閾値未達

apps/web 全体の lines 値（baseline=39.39%）の after 値も併記する。

## 手動 smoke（NON_VISUAL 代替）

UI 操作 smoke は不要。代替として下記コマンド出力ログを `outputs/phase-11/manual-smoke-log.md` に記録する。

| # | コマンド | 期待結果 |
| --- | --- | --- |
| 1 | `mise exec -- pnpm install` | 0 errors |
| 2 | `mise exec -- pnpm typecheck` | 0 errors |
| 3 | `mise exec -- pnpm lint` | 0 errors / 0 warnings |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web test` | 全 PASS。既存テスト regression 0 |
| 5 | `mise exec -- pnpm --filter @ubm-hyogo/web test:coverage` | 全 PASS + coverage 出力 |
| 6 | `mise exec -- pnpm --filter @ubm-hyogo/web build` | 0 errors |

ログ形式:

```
## Step 1: pnpm install
$ mise exec -- pnpm install
<exit code / 末尾 5 行>

## Step 2: pnpm typecheck
...
```

実値・実 secret は記録しない。`INTERNAL_AUTH_SECRET` 等が出力に出る場合はマスクする。

## link-checklist

`outputs/phase-11/link-checklist.md` に 13 phase 仕様書相互リンクと参照リンクの健全性を記録:

| リンク種別 | 確認項目 |
| --- | --- |
| index.md → phase-01 〜 phase-13 | 全 13 リンクが存在しファイルが存在する |
| phase 内 refs | `docs/00-getting-started-manual/specs/02-auth.md` 等の絶対パスが解決する |
| Phase 13 refs | `.claude/commands/ai/diff-to-pr.md` が存在する |
| outputs 配置先 | `outputs/phase-{01..13}/main.md` 親ディレクトリが存在する |

検証コマンド例:

```bash
# 仕様書相互リンクの存在確認
ls docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/phase-{01..13}.md

# 参照ドキュメントの存在確認
test -f docs/00-getting-started-manual/specs/02-auth.md
test -f .claude/commands/ai/diff-to-pr.md
```

## AC 未達時の rollback / 追加実装ループ

実測値が AC を満たさない場合は以下の手順で Phase 5 へ回帰する（CONST_007 単サイクル完了原則のもと、本サイクル内で完了させる）:

1. `outputs/phase-11/coverage-diff.md` で ❌ となったファイル・metric を特定する。
2. `apps/web/coverage/lcov-report/<file>.html` を一時的に開き、未網羅行 / 未網羅 branch を特定する。
3. Phase 2 ケース表に追補ケースを 1 案追加し、対応するテストファイルへ minimal 追記する。production code 改変・`vitest.config.ts` 改変・coverage exclude 追加は禁止（user approval が必要）。
4. 再度 `pnpm --filter @ubm-hyogo/web test:coverage` を実行して `coverage-after.json` / `coverage-diff.md` を更新する。
5. 最大 3 サイクルで AC 達成しない場合は user に状況報告し、scope 縮小 / 別タスク切り出しの判断を仰ぐ（要 user approval）。
6. rollback が必要な場合（regression を導入した場合）は追加 commit せず、当該テスト追記を `git restore` で破棄してから再設計する。

## 参照資料

- 起票根拠: 2026-05-01 実測 `apps/web/coverage/coverage-summary.json`
- Phase 1 baseline 表
- Phase 7 AC マトリクス
- Phase 9 品質ゲート結果
- `vitest.config.ts`

## 実行手順

- 対象 directory: `docs/30-workflows/ut-web-cov-04-admin-lib-ui-primitives-coverage/`
- 本仕様書作成フェーズではコマンド実行・evidence 採取・commit・push・PR を行わない。実装サイクル時に本 runbook を参照して実行する。
- 実 secret 値・OAuth トークン値はログ・evidence に書かない。`.env` を `cat` / `Read` しない。

## 統合テスト連携

- 上流: `06c-A-admin-dashboard`
- 下流: `09b-A-observability-sentry-slack-runtime-smoke`

## 多角的チェック観点

- 不変条件 #5 / #6 / #11 / #13 適合
- 未実装 / 未実測を PASS と扱わない（after 値 `?` を残したまま完了としない）
- baseline と after を分離して記録する（混ぜない）
- secret 値混入なし（INTERNAL_AUTH_SECRET 等のマスク）

## サブタスク管理

- [ ] coverage-before.json を確定する
- [ ] coverage-after.json を採取する
- [ ] coverage-diff.md の対照表を埋め切る
- [ ] manual-smoke-log.md に 6 ステップ全てを記録する
- [ ] link-checklist.md で 13 phase 相互リンクを確認する
- [ ] AC 未達時のループ手順を試行回数とセットで記録する
- [ ] outputs/phase-11/main.md を作成する

## 成果物

- `outputs/phase-11/main.md`: 実測サマリ
- `outputs/phase-11/coverage-before.json`: baseline 抜粋
- `outputs/phase-11/coverage-after.json`: after 抜粋
- `outputs/phase-11/coverage-diff.md`: 13 行対照表 + 全体 lines 値
- `outputs/phase-11/manual-smoke-log.md`: 6 ステップログ
- `outputs/phase-11/link-checklist.md`: 13 phase / refs / outputs 親ディレクトリ健全性

## 完了条件

- 13 ファイル全てで AC 達成（Stmts/Lines/Funcs ≥85% / Branches ≥80%）が `coverage-diff.md` で確認できる
- 6 ステップ手動 smoke が全て成功し `manual-smoke-log.md` に記録されている
- 既存 web test に regression 0
- link-checklist.md の全行が ✅ である
- secret 実値が evidence に含まれていない

## タスク100%実行確認

- [ ] 実装区分が冒頭に明記されている
- [ ] coverage-before / coverage-after / coverage-diff の 3 点 evidence が分離されている
- [ ] AC 未達時の rollback 手順が明文化されている
- [ ] 実装、deploy、commit、push、PR を実行していない（本仕様書作成フェーズの責務として）

## 次 Phase への引き渡し

Phase 12 へ次を渡す: 実測 coverage-diff（Phase 12 implementation-guide.md の coverage 結果セクションに転記）、manual-smoke-log（Phase 12 documentation-changelog.md の検証ログ参照）、link-checklist 結果、AC 未達時の追補ケース（あれば）と本サイクル内残存スコープ。
