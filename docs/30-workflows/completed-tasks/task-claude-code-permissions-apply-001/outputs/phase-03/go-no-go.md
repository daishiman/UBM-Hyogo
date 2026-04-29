# Phase 3 go-no-go: 最終判定マトリクス

## 1. 判定マトリクス

| 軸 | 状態 | 通常判定 | 本タスク判定 |
| --- | --- | --- | --- |
| 必須前提タスク #1（deny-bypass-verification-001）完了 | **N（未実施）** | No-Go | **FORCED**（ユーザー承認） |
| 必須前提タスク #2（project-local-first-comparison-001）完了 | **N（未実施）** | No-Go | **FORCED**（ユーザー承認） |
| R-1（波及範囲） PASS/FAIL | **PASS**（条件付き） | Go | Go |
| R-2（deny 実効性） PASS/FAIL | **BLOCKED** | No-Go | **FORCED-PASS** |
| R-3（project-local-first） PASS/FAIL | **BLOCKED** | No-Go | **FORCED-PASS** |
| R-4（whitelist 衝突） PASS/FAIL | **PASS** | Go | Go |
| R-5（不変条件） PASS/FAIL | **PASS** | Go | Go |
| user 承認 取得 | **Y（取得済・選択肢 C）** | - | Y |

## 2. 最終判定

### 判定: **FORCED-GO**

### 根拠

1. **ユーザー強行承認**: ユーザーが選択肢 C（前提タスク 2 件をスキップして強行）を明示承認した（本エージェント起動指示時のプロンプト）
2. **R-1 / R-4 / R-5 は通常 PASS**: 設計上の不変条件・whitelist・波及範囲は問題なし
3. **R-2 / R-3 は BLOCKED**: 通常なら No-Go だが、ユーザー承認で **FORCED-PASS** として扱う
4. **本タスクの Phase 3 までは調査・設計のみ**: 実機書き換えは Phase 5 で別エージェントが実施。本 Phase 3 の Go 判定は「Phase 4 着手の許可」を意味し、実機破壊を直接許可するものではない

### 制約条件

- **TC-05 / AC-5 は BLOCKED として記録**（PASS/FAIL 判定不能）
- Phase 4 で TC-05 を skip-or-block する取り扱いを test-scenarios.md に明記すること
- Phase 5 runbook には deny 実効性 UNKNOWN を前提とした rollback 手順を含めること
- Phase 12 documentation-changelog に「FORCED-GO による特例実施」と明示記録

## 3. ループバック先（No-Go の場合の参考）

仮にユーザー承認が撤回された場合のループバック方針:

| 失敗観点 | ループバック先 |
| --- | --- |
| 必須前提タスク未完 | 当該タスク（deny-bypass-verification-001 / project-local-first-comparison-001）の実施完了まで本タスク pending |
| R-1 FAIL | Phase 1（inventory.md 再取得） |
| R-2 FAIL | Phase 2（topology.md / alias 設計から `--dangerously-skip-permissions` を除外する案 B にフォールバック） |
| R-3 FAIL | Phase 2（採用案を A → B（project-local-first）に切替） |
| R-4 FAIL | Phase 2（whitelist 衝突解消方針の再設計） |
| R-5 FAIL | Phase 2（設計修正） |

## 4. ユーザー承認記録

```
承認形式: 選択肢 C（前提タスクスキップして強行）
承認日時: 2026-04-28（本エージェント起動指示時）
承認内容:
  - 必須前提タスク 2 件（deny-bypass-verification-001 / project-local-first-comparison-001）の未実施を許容
  - TC-05 / AC-5 を BLOCKED として処理
  - Phase 3 を FORCED-GO として判定
承認の有効範囲:
  - 本 Phase 3 の Go/No-Go 判定のみ
  - Phase 4 / Phase 5（実機書き換え）の着手判定は別途要承認
artifacts.json `phases[2].user_approval_required: true` に対応 = 取得済
```

## 5. Phase 4 着手判定

- **Phase 4 着手**: **可能**（FORCED-GO による）
- ただし実機書き換えを伴う Phase 5 への移行は本タスク index.md `block_reason` に従い別途 user 承認が必要
- 本エージェント（Phase 1-3 設計担当）の責務はここで終了
