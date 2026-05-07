[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 7: AC マトリクス — 09c-A-production-deploy-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 7 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |

## 目的

index.md の AC 5 項目（AC-1〜AC-5）について、検証手段（コマンド / evidence path / 期待結果）と Phase 5 runbook step、Phase 6 異常系（AN-1〜AN-9）を 1:N で接続する AC マトリクスを `outputs/phase-07/main.md` に固定する。AC ごとに「PASS 条件」「PASS_WITH_BLOCKER 条件」の境界を明確にし、09a / 09b の依存 AC との取り扱い差を記述する。

## 実行タスク

1. positive AC matrix（AC-1〜AC-5 × verify suite × runbook step × 不変条件）を作成
2. negative AC matrix（AN-1〜AN-9 × 検出経路 × mitigation × 不変条件）を作成
3. 各 AC の PASS / PASS_WITH_BLOCKER 境界を定義
4. 09a / 09b 依存 AC の citation 形式を確定
5. 空白セル check（5 × 5 = 25 セル + 9 × 5 = 45 セル）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/index.md | AC-1〜AC-5 |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-04/main.md | verify suite 5 層 |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-05/main.md | runbook 8 Step + rollback |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-06/main.md | 異常系 9 件 |
| 参考 | docs/30-workflows/completed-tasks/09c-serial-*/phase-07.md | matrix 構造 |

## 実行手順

### ステップ 1: positive AC matrix 作成

各 AC × { 内容 / verify suite / runbook step / 不変条件 / PASS 条件 } の 5 列で記述。

### ステップ 2: negative AC matrix 作成

異常系 AN-1〜AN-9 を AC negative として記述（"異常系を検知可能" を AC として捉える）。

### ステップ 3: PASS / PASS_WITH_BLOCKER の境界

未実測 / PENDING_RUNTIME_EVIDENCE は PASS としない。skip 条件を満たす場合のみ PASS_WITH_BLOCKER を許容する境界を定義。

### ステップ 4: 09a / 09b 依存 AC

09a-A / 09b-A / 09b-B の AC は本タスクで再検証しない（前提として citation のみ）。citation 形式を `outputs/phase-11/upstream-green-evidence.md` 経由で確定。

### ステップ 5: 空白セル check

positive 5 × 5 = 25 セル、negative 9 × 5 = 45 セル、計 70 セルが埋まることを確認。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | verify suite 5 層を citation |
| Phase 5 | runbook step を citation |
| Phase 6 | 異常系 9 件を citation |
| Phase 10 | matrix を GO/NO-GO 判定の根拠 |
| Phase 11 | matrix を production smoke checklist に転用 |
| 上流 09a / 09b | 依存 AC の citation |

## 多角的チェック観点

- 不変条件 #5 / #6 / #14 が AC × evidence の少なくとも 1 セルで参照される
- AC-1（user approval）が全 mutation Step で確認されている
- silent skip / PENDING_RUNTIME_EVIDENCE を PASS と扱わない

## サブタスク管理

- [ ] positive AC matrix（5 件 × 5 列）
- [ ] negative AC matrix（9 件 × 5 列）
- [ ] PASS / PASS_WITH_BLOCKER 境界定義
- [ ] 09a / 09b 依存 AC の citation 形式
- [ ] 空白セル 0 件確認

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | AC matrix（positive 5 + negative 9）+ citation 形式 |

## 完了条件

- [ ] positive AC 5 件すべてが matrix に対応
- [ ] negative AC 9 件すべてが matrix に対応
- [ ] 70 セル空白 0 件
- [ ] 不変条件 #5 / #6 / #14 が matrix 内で参照される
- [ ] PASS_WITH_BLOCKER 境界が定義される

## タスク100%実行確認

- [ ] outputs/phase-07/main.md が完成
- [ ] AC × evidence path が一意に対応
- [ ] 09a / 09b 依存 AC の citation 形式が決まる

## 次 Phase への引き渡し

- AC matrix を Phase 10 GO/NO-GO 判定に
- AC × evidence path を Phase 11 実測 checklist に
- citation 形式を Phase 12 documentation に
