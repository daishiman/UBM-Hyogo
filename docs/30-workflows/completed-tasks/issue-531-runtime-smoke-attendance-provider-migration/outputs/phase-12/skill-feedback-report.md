# Skill Feedback Report

## テンプレ改善

NON_VISUAL runtime smoke templates should distinguish provider-bound read paths from inventory-only routes. A route can be in inventory without being a runtime mutation target.

## ワークフロー改善

`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` should only transition to `PASS_RUNTIME_VERIFIED` after fresh runtime evidence exists. Spec creation must not update parent state early.

## ドキュメント改善

Secret / PII hygiene guidance should prefer summary-only persistent evidence. Raw response bodies may exist only in `mktemp` paths guarded by `trap`, and evidence logs should store status, contract, and aggregate counts rather than JSON bodies.
