# Phase 11 — staging visual evidence

state: PENDING_IMPLEMENTATION_FOLLOW_UP
captured_at: -
result: -

## 状況

VISUAL_ON_EXECUTION。本サイクルでは fixture / runbook / scripts / tests を整備したのみ。
実 screenshot 取得は staging への seed 投入実行を伴うため、user 承認付き staging runtime cycle
（user 承認 + staging 接続環境）で `runbook.md` の手順に従って実施する。

## 取得時に作成すべきファイル

- `screenshots/01-pending-visibility-list.png` 〜 `07-409-toast.png`
- `phase11-capture-metadata.json`
- `manual-test-result.md`
- `redaction-check.md`
- `discovered-issues.md`

## 実取得サイクル開始時のチェックリスト

- [ ] `CLOUDFLARE_ENV=staging bash scripts/staging/seed-issue-399.sh` 成功
- [ ] 7 screenshot 取得
- [ ] redaction 全件 PASS
- [ ] `phase11-capture-metadata.json` 出力
- [ ] `CLOUDFLARE_ENV=staging bash scripts/staging/cleanup-issue-399.sh` 成功 (count=0)
- [ ] `06-empty-state.png` を cleanup 後に取得
- [ ] 本ファイル `state` を `PASS` に更新
