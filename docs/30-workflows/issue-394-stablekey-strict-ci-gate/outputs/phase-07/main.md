# Phase 7: 統合検証 — outputs/main

## 判定

`PASS_WITH_BLOCKER`。

## AC トレース

| AC | 結論 | 根拠 |
| --- | --- | --- |
| AC-1 | DESIGN_FIXED | Phase 2 で blocking step（continue-on-error なし）を確定。適用は cleanup 後 |
| AC-2 | EVIDENCE_OK | `phase-11/evidence/branch-protection-{main,dev}.json` に `ci` context を確認可能 |
| AC-3 | EVIDENCE_PARTIAL | blocker evidence (`strict-current-blocker.txt` exit 1 / 148 violations) 取得済。`strict-pass.txt` は cleanup 後 |
| AC-4 | DESIGN_FIXED | Phase 6 fixture spec 確定。実行は cleanup 後 |
| AC-5 | EVIDENCE_OK | `package.json` に `lint:stablekey:strict` 単一 entry 存在。CI step 計画値も同 entry を呼ぶ。`ci-command-trace.md` 参照 |
| AC-6 | DOC_PLAN_FIXED | Phase 12 で 03a 親 implementation-guide / index の AC-7 昇格 diff plan を保持。aiworkflow-requirements との drift なし |
| AC-7 | TRACED | unassigned-task spec 完了条件 3 項を Phase 11/12 で参照済 |

## local / CI command 一致性

```text
package.json: "lint:stablekey:strict": "node scripts/lint-stablekey-literal.mjs --strict"
ci.yml plan : run: pnpm lint:stablekey:strict   （同 entry を pnpm 経由で呼ぶ）
```

完全一致と判定。詳細は `outputs/phase-07/integration-check.md`。

## 完了条件チェック

- [x] AC-1〜7 が DESIGN_FIXED または EVIDENCE_OK にトレース済。
- [x] cleanup 後に実体化する PASS evidence の取得手順が明示。
