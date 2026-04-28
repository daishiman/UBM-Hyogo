# Phase 6: 異常系検証（fail path / 回帰 guard）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 自動生成 skill ledger の gitignore 化 (skill-ledger-a1-gitignore) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（fail path / 回帰 guard） |
| 作成日 | 2026-04-28 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス / カバレッジ確認) |
| 状態 | pending（仕様化のみ完了 / 実走は別 PR） |
| タスク種別 | docs-only / NON_VISUAL / infrastructure_governance |

## 目的

Phase 4 の T1〜T5（happy path）に加えて、**fail path / 回帰 guard** を T6〜T10 として固定する。本 Phase は「壊れ方が予想範囲を超えないか」「ロールバックが期待通り動くか」「nested / submodule 構造で漏れがないか」を仕様レベルで網羅する。

## 依存タスク順序（A-2 完了必須）

A-2 完了は Phase 5 Step 0 ゲートで担保済み。本 Phase は Step 0 をパスした前提で fail path を扱う。

## 実行タスク

- タスク1: T6〜T10 の fail path を定義する。
- タスク2: rollback / nested / A-2 境界 / 正本配置の回帰 guard を固定する。
- タスク3: 実走を別 PR に委譲する範囲を明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-04.md | T1〜T5 happy path |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-05.md | 3 コミット粒度 / Step 4 hook guard |
| 必須 | docs/30-workflows/skill-ledger-a1-gitignore/phase-02.md | ロールバック設計 / state ownership |
| 必須 | docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/outputs/phase-5/gitignore-runbook.md | ロールバック手順 |

## 実行手順

1. Phase 4 の happy path と Phase 5 の実装ランブックを確認する。
2. T6〜T10 をシナリオ、検証コマンド、期待値、対応に分解する。
3. Phase 7 のカバレッジ入力として引き渡す。

## 統合テスト連携

T6〜T10 は実装 PR 側の regression gate として実走する。本 Phase は fail path 仕様の正本化のみを行う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 仕様 | outputs/phase-06/main.md | T6〜T10 のテスト一覧 / 期待値 / 観測手順 |
| メタ | artifacts.json `phases[5].outputs` | `outputs/phase-06/main.md` |

## 異常系テスト一覧

### T6: hook が tracked canonical を再追加してしまう regression

| 項目 | 内容 |
| --- | --- |
| ID | T6 |
| 観点 | state ownership 違反検出 |
| シナリオ | hook が `[[ -f <target> ]]` ガードを忘れて canonical を上書き → 次 commit で `.gitignore` 化したはずの派生物が tracked に再混入 |
| 検証コマンド | `pnpm indexes:rebuild && git ls-files .claude/skills \| rg "(indexes/.*\.json\|\.cache\.json\|LOGS\.rendered\.md)" \| wc -l` |
| 期待値 | `0`（hook 実行後も tracked 0 件） |
| Red 状態（仕掛け） | hook ガード行を一時的に削除して再走 → tracked が増えれば regression 検出 |
| 対応 | hook script の guard を必須化、CI で T6 を gate に追加 |

### T7: rollback シナリオ（`git add -f` で再追跡 → revert）

| 項目 | 内容 |
| --- | --- |
| ID | T7 |
| 観点 | ロールバック設計の有効性 |
| シナリオ | A-1 を一時的に取り消す必要が生じた場合のフロー検証 |
| 手順 | (1) `git add -f .claude/skills/<skill>/indexes/keywords.json` で再追跡 → (2) `git revert <A-1 untrack commit>` → (3) `git revert <A-1 gitignore commit>` |
| 期待値 | 2 回の revert で .gitignore / tracked 状態が A-1 適用前に戻る |
| 検証コマンド | `git diff <pre-A-1>..HEAD -- .gitignore` が空 / `git ls-files .claude/skills \| wc -l` が pre-A-1 と一致 |
| Red 状態 | rollback で 3 コミット以上要求される / tracked と .gitignore が不整合 |
| 対応 | コミット粒度を Phase 5 で 3 分割した設計を再確認 |

### T8: submodule / nested skill ledger の取り扱い

| 項目 | 内容 |
| --- | --- |
| ID | T8 |
| 観点 | glob の網羅性 |
| シナリオ | `.claude/skills/<skill>/sub-ledger/<nested>/indexes/keywords.json` のような nested 構造、または submodule 配下の skill ledger に対して glob が hit するか |
| 検証コマンド | `find .claude/skills -path '*/indexes/*.json' -o -path '*/LOGS.rendered.md' \| xargs -I{} git check-ignore -v {}` |
| 期待値 | 全パスが `.gitignore` 行で hit |
| Red 状態 | nested / submodule 配下が hit せず tracked に残る |
| 対応 | glob を `**/indexes/*.json` 等の再帰形式に変更するか、submodule 側で個別 .gitignore を配置（B-1 の領域へ申し送り） |

### T9: `LOGS.md` 本体の誤巻き込み regression

| 項目 | 内容 |
| --- | --- |
| ID | T9 |
| 観点 | A-2 境界 / 履歴保護 |
| シナリオ | glob が `LOGS.rendered.md` ではなく `LOGS*.md` のように broaden され、`LOGS.md` 本体まで ignore してしまう |
| 検証コマンド | `git check-ignore -v .claude/skills/<skill>/LOGS.md` |
| 期待値 | **hit しない**（exit 1） |
| Red 状態 | `LOGS.md` 本体が hit する → A-2 で fragment 化した正本が untrack される事故 |
| 対応 | glob は必ず `LOGS.rendered.md`（完全一致）。ワイルドカードを broaden しない |

### T10: `.git/info/exclude` 誤配置の検出

| 項目 | 内容 |
| --- | --- |
| ID | T10 |
| 観点 | 正本の配置 |
| シナリオ | 4 系列 glob が誤って `.git/info/exclude` に書かれ、リポジトリ間で共有されない |
| 検証コマンド | `! grep -q "indexes/keywords.json" .git/info/exclude && grep -q "indexes/keywords.json" .gitignore` |
| 期待値 | `.git/info/exclude` には無く、`.gitignore` には有る |
| Red 状態 | `.git/info/exclude` のみに記述されている |
| 対応 | Phase 5 Step 1 で正本のみを編集する旨を再確認 |

## fail path × 対応 lane / Phase 早見表

| ID | 検出 lane | 対応 Phase |
| --- | --- | --- |
| T6 | lane 3 | Phase 5 Step 4 / CI gate |
| T7 | lane 2 + lane 1 | Phase 5 ロールバック / Phase 11 |
| T8 | lane 1 | Phase 5 Step 1 glob 設計 / B-1 申し送り |
| T9 | lane 1 | Phase 5 Step 1 / A-2 境界 |
| T10 | lane 1 | Phase 5 Step 1 |

## 完了条件

- [ ] T6〜T10 が `outputs/phase-06/main.md` に表化されている
- [ ] 各テストにシナリオ / 検証コマンド / 期待値 / Red 状態 / 対応が記述されている
- [ ] regression（T6）/ rollback（T7）/ nested（T8）/ A-2 境界（T9）/ 正本配置（T10）の 5 観点がカバーされている
- [ ] 実テスト走行は別 PR に委ねる旨が明示されている

## 検証コマンド（仕様確認用）

```bash
test -f docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-06/main.md
rg -c "^### T(6|7|8|9|10):" docs/30-workflows/skill-ledger-a1-gitignore/outputs/phase-06/main.md
# => 5
```

## 苦戦防止メモ

1. **T6 は CI gate 化が必須**: 手動 review では検出漏れが起きる。lefthook の post-commit に T6 系チェックを組み込む案を Phase 12 unassigned-task-detection.md に登録。
2. **T9 の broaden 事故**: `LOGS*.md` のように一見便利な glob は禁止。完全一致 `LOGS.rendered.md` のみ。
3. **T8 の nested 構造**: 現時点で nested ledger は無いが、A-3（Progressive Disclosure）後に増える可能性。glob を `**/indexes/*.json` に格上げするかは B-1 で再評価。
4. **T7 の rollback 検証**: 実環境を汚さないよう一時 worktree で実走すること。
5. **本 Phase は実走しない**: 仕様化のみ。実走は実装担当者が別 PR で行う。

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス / カバレッジ確認)
- 引き継ぎ事項:
  - T1〜T5（happy path）+ T6〜T10（fail path）の合計 10 件が Phase 7 カバレッジ計画の入力
  - T6 / T9 を CI gate 候補として Phase 12 に申し送り
- ブロック条件:
  - regression / rollback / nested のいずれかが未カバー
  - `LOGS.md` 本体保護（T9）が欠落
