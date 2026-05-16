# task-709-fu-branch-protection-required-check

## メタ情報

| 項目 | 値 |
| --- | --- |
| 種別 | implementation / NON_VISUAL / governance |
| 検出元 | `docs/30-workflows/task-709-visual-baseline-runtime-capture/outputs/phase-12/unassigned-task-detection.md` |
| Issue | #709 follow-up |
| 前提 | task-709 で 51 baseline PNG と visual-full 2-run stability evidence が揃っていること |
| user gate | `gh api -X PUT` branch protection mutation |

## 苦戦箇所

`playwright-visual-full` を dev / main の required status check に追加する操作は、GitHub branch protection の不可逆に近い governance mutation である。baseline PNG が揃う前に required check 化すると、baseline 不在 skip / fail のまま PR を不要にブロックする。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| required check 名の drift | `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` で current contexts を read-only 取得し、実 run 名を確認する |
| baseline 未取得のまま required 化 | task-709 Phase 11 evidence `baseline-list.md` と 2-run stability evidence を前提条件にする |
| dev/main の片側だけ更新 | dev / main を個別 GET、個別 PUT、個別 evidence に分離する |
| user 承認なし mutation | `user-approval-marker.md` がない限り `gh api -X PUT` を実行しない |

## 検証方法

1. Read-only GET で dev / main current protection JSON を取得する。
2. task-709 の `outputs/phase-11/evidence/visual-full-stability.md` を確認する。
3. user approval marker を記録する。
4. dev / main へ個別 `gh api -X PUT` を実行する。
5. GET after evidence で required contexts に `playwright-visual-full` の 3 viewport job が入ったことを確認する。

## スコープ

含む:

- dev / main branch protection required status checks への visual-full contexts 追加
- before / after evidence
- rollback command draft

含まない:

- baseline PNG の生成
- visual-full workflow の実装修正
- task-709 PR 作成
