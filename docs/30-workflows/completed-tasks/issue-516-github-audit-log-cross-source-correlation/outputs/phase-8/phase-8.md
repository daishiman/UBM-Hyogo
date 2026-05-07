# Phase 8 出力: governance / NON_VISUAL secret hygiene

## Secret hygiene チェックリスト

| 項目 | 結果 |
| --- | --- |
| `.env` に PAT / salt 平文値 | なし（op:// 参照のみが原則。本タスクで `.env` 編集なし） |
| source / docs に PAT 値 | テスト用 dummy `ghp_DUMMY` のみ。実値なし |
| source / docs に AUDIT_CORRELATION_SALT 値 | なし（CLI 引数で渡す前提・runbook には op 参照のみ） |
| `run.sh` が salt を log にエコー | なし（CLI 引数→runner に直接渡す） |
| `github-fetch.ts` が PAT を error message に含める | なし（`AuditFetchAuthError` は status のみ。test で assert 済） |

### grep 検出時の説明
`grep -RE 'ghp_|github_pat_|AUDIT_CORRELATION_SALT='` でヒットする以下は **検出パターン定義 / dummy fixture / test assertion** のため、実 secret の流出には該当しない:
- `scripts/audit-correlation/grep-gate.sh` — 検出パターンの正規表現定義
- `apps/api/src/audit-correlation/__tests__/github-fetch.test.ts` — `pat: 'ghp_DUMMY'`（PAT が error message に含まれないことを assert するための合成入力）
- `scripts/audit-correlation/__tests__/grep-gate.bats` — `ghp_abcdEFGH...` の合成 fixture（gate が PAT を検知できることを test）

実値・運用 secret の流出は 0 件。

## CODEOWNERS 整合
```bash
gh api repos/daishiman/UBM-Hyogo/codeowners/errors
# → {"errors":[]}
```
errors 0 件確認。

## branch protection
- 本タスクで設定変更なし（solo 運用 / `required_pull_request_reviews=null` 維持）。
- 将来必須化したい status check 名: `audit-correlation-verify / verify`。Phase 12 implementation guide に TODO として記録。

## NON_VISUAL evidence ポリシー
- visualEvidence=NON_VISUAL。スクリーンショットを Phase 11 で収集しない（typecheck / lint / test / build / grep-gate ログのみ）。

## salt rotation 計画
記録のみ。実施は別タスク。手順は `docs/runbooks/audit-correlation.md` の「salt rotation 手順」セクション参照。
- 新 salt 生成 → staging 登録 → production 展開
- `FingerprintVersion` を `2` に上げて過去データを別 version で扱う
