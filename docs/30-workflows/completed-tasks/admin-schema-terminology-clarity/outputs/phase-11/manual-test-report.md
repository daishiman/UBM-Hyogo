# Manual Test Report — admin-schema-terminology-clarity

## 状態

- Local implementation evidence: captured.
- Authenticated staging visual evidence: `staging_visual_pending_user_gate`.

## Staging 手順（user-gated）

1. authenticated staging（管理者ロール）で `/admin/schema` を開く。
2. viewport 1440x900 で `screenshot-plan.json` の 4 観点を確認する。
3. 生 revisionId / hash が表示されていないこと、旧英語ラベルが残っていないことを確認する。
4. `/admin/schema/history` と `/admin` dashboard の波及文言を確認する。

## ローカル代替証跡

- focused Vitest 10 files / 84 tests PASS。
- web typecheck / lint / verify:tokens PASS。
- apps/api diff empty。

## 境界

staging deploy / screenshot 取得 / commit / push / PR は user-gated。
