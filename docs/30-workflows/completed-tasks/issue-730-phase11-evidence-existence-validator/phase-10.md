# Phase 10 — 検収準備

## 1. 検収項目

| 項目 | 確認方法 |
| --- | --- |
| 機能 1: parser | `pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts` の `parsePhase11EvidenceClaims` suite green |
| 機能 2: existence checker | 同 spec の `verifyPhase11EvidenceExistence` suite green |
| 機能 3: integrated check | `verifyComplianceFile` の `fail-missing-evidence` ケース red |
| 非機能 1: 後方互換 | 既存 fixture 3 種が依然として期待通り |
| 非機能 2: typecheck / lint | `pnpm typecheck && pnpm lint` exit 0 |
| 非機能 3: 本タスク自己検証 | `pnpm verify:phase12-compliance` を `docs/30-workflows/issue-730-phase11-evidence-existence-validator/` に対して実行し exit 0 |
| docs | `references/phase-11-non-visual-alternative-evidence.md` に validator 仕様セクション追加済 |
| Issue | #730 CLOSED 維持 / PR description が `Refs #730` |

## 2. 検収用コマンド一括

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test scripts/__tests__/verify-phase12-compliance.spec.ts
mise exec -- pnpm test:phase12-compliance

# 本タスク自身の workflow root に対する自己検証
COMPLIANCE_BASE_REF=origin/dev \
  COMPLIANCE_HEAD_REF=HEAD \
  mise exec -- pnpm verify:phase12-compliance
```

## 3. 検収ゲート (Gate-B / Gate-C)

- Gate-B: 上記コマンド全 exit 0 + 本タスク outputs/phase-11 evidence 揃いで `passed_at` 記録
- Gate-C: `.github/workflows/verify-phase12-compliance.yml` の `workflow_dispatch` 実行 / push 経路での green を確認（実 PR 作成時）
