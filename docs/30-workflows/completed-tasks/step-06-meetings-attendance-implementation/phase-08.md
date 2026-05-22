# Phase 8: Governance / Branch Protection

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| 区分 | 設計 + 確認 |
| 想定所要 | 0.05 人日 |

## 目的

本タスクが branch protection / CODEOWNERS / governance YAML に変更を要するか判定する。

## 8.1 判定

| 観点 | 該当 | 備考 |
| --- | --- | --- |
| branch protection 変更 | ✘ | required check 追加なし (Phase 7) |
| CODEOWNERS 変更 | ✘ | `apps/web/**` は既存 owner で被覆 |
| 不可逆 mutation (`gh api -X PUT` / `wrangler deploy` / `d1 migrations apply` / `gh secret set`) | ✘ | 本タスクは frontend 限定 |
| `governance_mutation_user_gate` 必須 | ✘ | 上記が該当しない |
| Cloudflare Secrets 投入 | ✘ | なし |
| Cloudflare D1 schema 変更 | ✘ | なし |

## 8.2 solo dev policy 準拠

CLAUDE.md 「Governance / CODEOWNERS」セクションに従い:
- `required_pull_request_reviews=null` (solo 運用)
- review なしで CI gate のみで PR を merge する運用

本タスクは特例なく上記方針に準拠。

## 8.3 PR base ブランチ

- 既定: `dev` (CLAUDE.md PR autonomous flow §「絶対原則」)
- `main` への直接 PR は production cut 時のみ

## 完了条件

- [ ] governance 変更不要の判定根拠が記録されている
- [ ] PR base = `dev` であることが明記されている

## リスク

なし
