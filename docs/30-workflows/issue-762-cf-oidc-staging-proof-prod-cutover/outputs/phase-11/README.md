# outputs/phase-11/

> Source issue: [#762](https://github.com/daishiman/UBM-Hyogo/issues/762)
> Phase: 11（手動テスト / NON_VISUAL）
> implementation_mode: `conditional_implementation_with_peripheral_hardening`

---

## 用途

Phase 11 手動テストの evidence 保管。UI 変更ゼロのため screenshot は作成せず、テキスト evidence（primary-source URL + 取得時状態 / dry-run log / diff / dispatch 境界記録）で代替する。

## 格納ファイル一覧（Phase 5 実装後に生成）

| ファイル | 内容 | 生成タイミング |
|---|---|---|
| `cloudflare-oidc-support-revalidation-2026-05-17.md` | Cloudflare Workers GitHub Actions docs / `wrangler-action#402` の 2026-05-17 時点一次情報再検証サマリ（URL + 取得タイムスタンプ + unsupported / OPEN 判定） | Phase 11 §4 実行時 |
| `verify-claim-pin-dry-run.log` | `scripts/oidc/verify-claim-pin.sh` の 9 ケース（C1-C8）exit path ログ | Phase 11 §3.1 実行時 |
| `redaction-check-extension.log` | `scripts/redaction-check.sh` 拡張の 5 パターン（R1-R5）適用ログ | Phase 11 §3.2 実行時 |
| `local-verification-summary.md` | ignored `.log` に依存しない tracked canonical evidence。shell spec / shellcheck / actionlint / grep / artifacts parity / indexes rebuild の結果を集約 | Phase 11 close-out |
| `observation-window-dispatch.md` | `.github/workflows/oidc-observation-window.yml` の user-gated dispatch 境界 + local static verification 記録。remote run URL / run ID は commit / push 後のユーザー承認がある場合だけ追記 | Phase 11 §3.3 実行時 |
| `web-cd-comment-diff.md` | `.github/workflows/web-cd.yml` のコメント追加が deploy 挙動を変えていないことの `git diff` 抜粋 + `grep -c "NOTE(issue-762)" = 2` 確認 | Phase 11 §3.4 実行時 |

## 不変条件

- OIDC token 値・JWT 実値・`cloudflare-aud` 実値・Cloudflare Account ID を **記録しない**。
- 一次情報は URL + 取得日時 + 判定文言のみ記録（HTML / レスポンス body の生取得は保存しない）。
- 実 staging proof / 実 production cutover の log は本 phase で生成しない（CONST_007 例外）。
