# Phase 3: 設計レビュー

## 3.1 既存実装との整合

| 観点 | 確認結果 |
|------|---------|
| `ci.yml` 先行実装パターン | `ci.yml:15-16` の `permissions: contents: read` と同一構造。整合。 |
| `runtime-smoke-staging.yml` 先行実装パターン | `runtime-smoke-staging.yml:15-16` と同一。整合。 |
| job-level 宣言保持 | グループ B の 3 workflow は既存 job-level 宣言を一切変更しない。 |
| required context 名 | job 名・job key 変更なし。branch protection 影響なし。 |

## 3.2 リスク

1. **過小権限による既存 job 破壊**: `backend-ci.yml` / `web-ce.yml` 系の deploy job が必要とする write 権限を見落とすと job-level が無い箇所で失敗する。→ 対策: 既存 job-level 宣言は変更せず、top のみ最小値を追加するだけにする。
2. **actionlint local 未導入**: 親タスク同様 local 検証困難時は CI gate（`ci.yml:52-56` の actionlint 1.7.7）を最終検証とする。push 前に grep-based 構造レビュー（Phase 9）を行う。
3. **transient 失敗との誤認**: 防御的 hardening のため、現時点で失敗を観測していなくても適用する。

## 3.3 Gate-A: 設計レビュー合格

- [x] 各 workflow の権限判定根拠が `phase-2-design.md` §2.2 に明記されている
- [x] required context 不変原則に違反しない
- [x] 既存 job-level 宣言を破壊しない方針が明示されている
