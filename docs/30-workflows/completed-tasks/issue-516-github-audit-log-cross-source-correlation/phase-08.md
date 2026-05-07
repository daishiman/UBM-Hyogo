# Phase 8: governance / NON_VISUAL secret hygiene

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| Source | `outputs/phase-8/phase-8.md` |
| 区分 | governance / 確認 |
| 想定所要 | 0.25 人日 |

## 目的

CLAUDE.md の secret 管理 / branch protection / CODEOWNERS / NON_VISUAL evidence ポリシーと整合し、PII / secret 流出経路を遮断する。

## 実行タスク

1. **Secret hygiene チェックリスト**
   - [ ] PAT / salt 値が `.env` / docs / log / source のいずれにも平文で出ない（`grep -RE 'ghp_|github_pat_|AUDIT_CORRELATION_SALT=' .` で検出 0）。
   - [ ] `.env` には `op://` 参照のみ（実値禁止）。
   - [ ] `scripts/audit-correlation/run.sh` は salt を CLI 引数で受け取り、log / error にエコーしない。
   - [ ] `apps/api/src/audit-correlation/github-fetch.ts` は PAT を error message に含めない。

2. **CODEOWNERS 整合**
   - Phase 7 で更新した CODEOWNERS に対し `gh api repos/daishiman/UBM-Hyogo/codeowners/errors` で `{"errors":[]}` を確認。

3. **branch protection 整合**
   - 本タスクで branch protection 値を変更しない（solo 運用 / `required_pull_request_reviews=null` 維持）。
   - 将来必須化するべき status check 名 `audit-correlation-verify / verify` を Phase 12 implementation guide で TODO として記録。

4. **NON_VISUAL evidence ポリシー確認**
   - スクリーンショット不要。Phase 11 で typecheck / lint / test / build / grep-gate のログのみ収集。

5. **fingerprint salt rotation 計画**
   - 本 phase で rotation 手順は **記録のみ**（salt 変更時は `fingerprintVersion` を `2` に上げ、過去データは別 version として扱う）。実施は別タスク。

## ローカル実行コマンド

```bash
# secret 流出検査
grep -RE 'ghp_|github_pat_|AUDIT_CORRELATION_SALT=' apps/api/src/audit-correlation scripts/audit-correlation docs/runbooks 2>/dev/null && exit 1 || echo "no leaks"

# CODEOWNERS 検証
gh api repos/daishiman/UBM-Hyogo/codeowners/errors

# branch protection 確認（read-only）
gh api repos/daishiman/UBM-Hyogo/branches/main/protection | grep -E 'required_pull_request_reviews|enforce_admins' || true
```

## 統合テスト連携

Phase 11 で上記 grep の結果を `outputs/phase-11/grep-gate.log` に保存。

## 参照資料

- CLAUDE.md「シークレット管理」「Governance / CODEOWNERS」「ブランチ戦略」

## 成果物

- `outputs/phase-8/phase-8.md`
  - Secret hygiene チェックリスト結果
  - CODEOWNERS errors 0 件の確認
  - branch protection drift なしの確認

## 完了条件（DoD）

- [ ] `grep -RE 'ghp_|github_pat_|AUDIT_CORRELATION_SALT='` が 0 件。
- [ ] CODEOWNERS errors 0 件。
- [ ] branch protection 設定変更なし（solo 運用維持）を記録。
- [ ] salt rotation 手順が文書として残っている。
