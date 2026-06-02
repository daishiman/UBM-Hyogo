# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | 6（異常系検証：誤判定シナリオ） |
| 次 Phase | 8（正本突合：DRY 化） |
| 主成果物 | outputs/phase-07/ac-matrix.md |

## 目的

index.md の AC-1〜AC-12 を正本として、各 AC が「どの検証方法で・どの Phase が担当し・どの成果物で満たされるか」を一意にトレースする。判定タスクであるため AC は「監査スコープ定義 + 確定判定 + 整合確認」の充足証跡として扱い、AC 全 12 件が PASS であることを表で示す。

## 実行タスク

1. **AC 逐語転記**: index.md の AC-1〜AC-12 を改変せず逐語で転記する。要約・言い換えをしない。
2. **検証方法の割当**: 各 AC に検証方法（棚卸し表確認 / ギャップ表確認 / 判定基準適用確認 / rg・grep 実測 / 整合突合 / docs-only 確認）を割り当てる。
3. **担当 Phase の割当**: 各 AC を生成・確定する担当 Phase（Phase 1〜13）を割り当てる。Phase 1 inventory の §6「AC への監査成果物の埋め込み」（AC-3/4/5/9 の生成 Phase）と矛盾させない。
4. **成果物パスの割当**: 各 AC を満たす outputs ファイルの相対パスを明記する。
5. **判定列の確定**: 各 AC を PASS で確定し、根拠を 1 行で添える。
6. **サマリ**: 末尾に「AC 全 12 件 PASS」を明記し、未トレース AC・partial AC が 0 件であることを宣言する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] AC-1〜AC-12 が index.md から逐語転記されている
- [ ] 各 AC に検証方法 / 担当 Phase / 成果物パス / 判定（PASS）が割り当てられている
- [ ] 各 AC の成果物パスが実在する outputs ファイルを指している
- [ ] Phase 1 §6 の生成 Phase 割当と矛盾しない
- [ ] 末尾に「AC 全 12 件 PASS」サマリがある（未トレース 0 / partial 0）

## 成果物/実行手順

- `outputs/phase-07/ac-matrix.md`
