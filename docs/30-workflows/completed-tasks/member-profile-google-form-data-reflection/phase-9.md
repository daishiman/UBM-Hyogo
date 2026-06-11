# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 9 / 13 |
| TASK_ID | `TASK-MEMBER-FORM-DATA-REFLECTION-001` |
| 前提 | Phase 8（リファクタリング）完了 = 振る舞い不変で GREEN |
| 主担当 | 全 Lane |
| 成果物 | `outputs/phase-9/qa.md` |

## 目的

phase-2 §5 の validation matrix を **command 単位で一括実行・一括判定** し、本タスクの全品質ゲート（型 / lint / test / 表現層非接触 / migration 非変更）を pass させる。
各コマンドの期待値を明示し、実測結果と pass/fail を 1:1 で記録する。曖昧な「概ね OK」判定は禁止する。

## 実行タスク

本 Phase の実行ステップ:

1. validation matrix（Q-1〜Q-7）を実行する
2. 実測値 + pass/fail を記録する
3. 横断確認（表現層非接触・migration 非変更・`*.test.*` 禁止・cf.sh 経由）を gate する

### 1. Validation matrix（phase-2 §5 を実行・全項目 pass 必須）

| # | 検証 | コマンド | 期待 | 不変条件 / AC |
|---|------|---------|------|--------------|
| Q-1 | 型 | `mise exec -- pnpm typecheck` | エラー 0 | CONST_005 |
| Q-2 | lint | `mise exec -- pnpm lint` | エラー 0 | CONST_005 |
| Q-3 | Lane A unit | `mise exec -- pnpm --filter @ubm-hyogo/integrations-google test mapper client` | GREEN（全 spec pass） | AC-A1〜A4 |
| Q-4 | Lane A index fallback | `mise exec -- pnpm --filter <api-package> test index` | GREEN | AC-A2 |
| Q-5 | Lane B test | `mise exec -- pnpm --filter <api-package> test sync-forms-responses` | GREEN | AC-B1〜B3 |
| Q-6 | 表現層非接触 | `git diff dev...HEAD --name-only -- apps/web/src` | **出力が空** | 不変条件 #1 |
| Q-7 | migration 非変更 | `git diff dev...HEAD --name-only -- apps/api/migrations` | **出力が空** | AC-G2 |

> `<api-package>` は Phase 1 inventory で確定した `apps/api` の package 名に置換する。

### 2. 一括判定の記録方式

`outputs/phase-9/qa.md` に以下の表で **実測値 + pass/fail** を記録する。

| # | コマンド | 実測結果 | 期待 | 判定 |
|---|---------|---------|------|------|
| Q-1 | typecheck | （実測） | error 0 | PASS / FAIL |
| Q-2 | lint | （実測） | error 0 | PASS / FAIL |
| Q-3 | integrations-google test | （pass 件数 / total） | 全 GREEN | PASS / FAIL |
| Q-4 | api index test | （pass 件数 / total） | 全 GREEN | PASS / FAIL |
| Q-5 | api sync test | （pass 件数 / total） | 全 GREEN | PASS / FAIL |
| Q-6 | apps/web/src diff | （出力行数） | 0 行 | PASS / FAIL |
| Q-7 | migrations diff | （出力行数） | 0 行 | PASS / FAIL |

1 件でも FAIL があれば該当 Lane（実装 Phase 5 / refactor Phase 8）へ差し戻す。全 PASS で Phase 10 へ進む。

### 3. 横断確認（不変条件の補助 gate）

| 確認 | 方法 | 期待 |
|------|------|------|
| spec 命名規則 | `git diff dev...HEAD --name-only | grep -E '\.test\.(ts|tsx)$'` | 出力空（`*.test.*` 禁止 / 不変条件 #8。新規 spec は `*.spec.ts`） |
| cf.sh 経由（runbook） | runbook 内に `wrangler` 直呼びが無い（`grep -n "wrangler " <runbook>`） | 出力空（不変条件 #3 / AC-C4） |
| D1 直接アクセス境界 | 変更が `apps/api` / `packages/integrations` に閉じ、`apps/web` から D1 binding 参照を増やしていない | diff で確認（不変条件 #5） |

## 参照資料

| 参照 | パス |
|------|------|
| validation matrix（正本） | `phase-2.md` §5 |
| AC 一覧 | `index.md` §4 |
| 不変条件 | `index.md` §8 |
| Lane C runbook | `outputs/phase-5/` 配下 runbook（cf.sh 経由検証用） |

## 実行手順

1. Q-1〜Q-7 を上から順に実行し、各実測結果を §2 の表に転記する。
2. Q-6 / Q-7 は **出力が空であること**（変更が漏れて表現層・migration に及んでいないこと）を厳格に確認する。1 行でも出力があれば FAIL。
3. §3 の横断確認（spec 命名 / cf.sh / D1 境界）を実行する。
4. FAIL 項目があれば原因 Phase へ差し戻し、修正後に全項目を再実行する（部分再実行で済ませない）。
5. 全 PASS を `outputs/phase-9/qa.md` に確定記録する。

## 統合テスト連携

- Q-3〜Q-5 は Phase 4 / 6 で作成した RED→GREEN test と Phase 7 で covered になった分岐を含む全 spec を実行する。
- Q-6 / Q-7 は「変更が設計スコープ（4 ファイル + spec + runbook）に収まっている」ことの最終 gate であり、Phase 10 の AC-G2 / 不変条件 #1 判定の根拠になる。

## 多角的チェック観点（AIが判断）

- **スコープ閉包の検証**: Q-6 / Q-7 が空であることは「やってはいけない変更をしていない」negative gate。pass している test より重要な場合がある（誤って表現層を触ると本タスクの前提が崩れる）。
- **fail-silent の再発防止検証**: Q-5 が「異常系（qidMap 空 / 全 unmapped）の alert 発火」を含むことを確認する。正常系のみ GREEN では Lane B の価値が検証できていない。
- **回帰非導入**: Q-3 / Q-4 の schema rows 有（従来経路）test が GREEN であることで、fallback 追加が既存挙動を壊していないことを担保する。

## サブタスク管理

| ID | 内容 | Lane |
|----|------|------|
| P9-1 | validation matrix Q-1〜Q-7 実行・記録 | 全 |
| P9-2 | 横断確認（spec 命名 / cf.sh / D1 境界） | 全 |
| P9-3 | FAIL 差し戻し判定と全 PASS 確定 | 全 |

## 成果物

- `outputs/phase-9/qa.md`

## 完了条件

- [x] Q-1〜Q-7 が実測値付きで全 PASS
- [x] Q-6（`apps/web/src` diff）が空（不変条件 #1）
- [x] Q-7（`migrations` diff）が空（AC-G2）
- [x] `*.test.*` の新規追加が無い（不変条件 #8）
- [x] runbook に `wrangler` 直呼びが無い（AC-C4）
- [x] FAIL があった場合は原因 Phase へ差し戻し、再実行で全 PASS に到達している

## タスク100%実行確認【必須】

- [x] §1〜§3 を完遂した
- [x] `outputs/phase-9/qa.md` に Q-1〜Q-7 の判定が記録されている
- [x] 全項目 PASS

## 次Phase

Phase 10（最終レビュー）— AC を 1 件ずつ判定し、MINOR 解決確認と blocker 判定を行う。
