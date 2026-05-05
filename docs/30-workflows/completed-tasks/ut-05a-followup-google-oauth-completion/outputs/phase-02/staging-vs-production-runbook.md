# Staging → Production 段階適用 Runbook（設計版）

> Phase 2 設計成果物 4 / Owner: UT-05A-FOLLOWUP-OAUTH
> 実行版は `outputs/phase-05/implementation-runbook.md` を参照。

## 段階適用フロー

```
[Stage A] staging smoke
  A-1: Console redirect URI 登録（既登録なら skip）
  A-2: Cloudflare Secrets staging 投入（scripts/cf.sh secret put）
  A-3: staging deploy
  A-4: 05a smoke-checklist の M-01〜M-11 / F-09 / F-15 / F-16 / B-01 を実行
  A-5: evidence を outputs/phase-11/staging/ に保存
[Stage B] production verification 申請
  B-1: privacy / terms / home が 200 を確認
  B-2: consent screen を Production publishing で submit
  B-3: submission screenshot 保存
  B-4: 審査ステータスを verification-submission.md に記録
[Stage C] production smoke
  C-1: Cloudflare Secrets production 投入確認
  C-2: production deploy
  C-3: 外部 Gmail で /login → /admin 到達確認
  C-4: B-03 解除状態を 13-mvp-auth.md に反映（Phase 12）
```

## 段階間ゲート

| ゲート | 通過条件 | 失敗時 |
| --- | --- | --- |
| A → B | M-01〜M-11 / F-15 / F-16 / B-01 すべて PASS | Phase 5 / Phase 6 failure case で原因切り分け |
| B → C | verification submitted（または verified）/ consent screen が "In production" | 修正後再 submit（Case #8 経路）。長期化なら B-03 解除条件 b 採用 |
| C → 完了 | 外部 Gmail login smoke PASS | redirect URI / authorized domain / verification status を再点検 |

## B-03 解除条件 優先順位

| 順位 | 条件 | 採用判断 |
| --- | --- | --- |
| a (理想) | verification verified | Stage C で外部 Gmail login が成功 |
| b (暫定) | verification submitted（審査中） | testing user に owner 追加 + 暫定運用宣言を `13-mvp-auth.md` に明記 |
| c (退避) | testing user 拡大運用 | 申請却下が続く場合のみ採用。運用負債化のため最終手段 |

## Phase 5 / 11 への引き渡し

- Stage A〜C の各 Step を Phase 5 implementation-runbook.md でコマンドベースに展開
- Stage A-4 / A-5 の evidence 9 枚以上を Phase 11 で実機生成
- Stage B-2 で submission screenshot 必須
- Stage C-3 で 外部 Gmail login screenshot 必須
