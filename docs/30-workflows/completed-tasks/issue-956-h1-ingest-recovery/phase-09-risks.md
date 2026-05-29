# Phase 09 — リスクと対策

| ID | リスク | 影響度 | 発生確率 | 対策 |
|----|--------|--------|----------|------|
| R-1 | secrets 投入時に履歴 / ログに実値が残る | 高 | 低 | `cf.sh secret put` の stdin 経由 + 1Password 参照のみ。`set +o history` 系シェル機能には依存しない設計 |
| R-2 | cron 起動直後に 401 連発で error run が大量積み上がり | 中 | 中 | `sheets-auth-classifier` の reason 分布を 1 cycle 観測。`invalid_grant` 多発時は private key の改行破損を疑い再投入 |
| R-3 | sync-lock 手動 reset で進行中 run を誤って中断 | 中 | 低 | `started_at < now-1h` の row のみ対象。1h 未満は触らない |
| R-4 | production cron を一時停止する誘惑 | 中 | 低 | 停止しない。sync-lock TTL で次サイクルから自動回収される設計 |
| R-5 | H1 修復後に H2/H3/H4 が連鎖顕在化 | 中 | 中 | 既存 followup-002/003/004 spec へ即移譲。本タスクで巻取らない |
| R-6 | `wrangler` 直叩きで投入してしまう (op 注入バイパス) | 高 | 低 | CLAUDE.md「Cloudflare CLI ルール」をオペレーション前に再確認。`cf.sh` 経由でないと再現性なし |
| R-7 | Issue #265 (Forms API quota / SA governance) と作業範囲が重なる | 低 | 低 | quota / governance は別 issue。本タスクは投入と観測のみ |
| R-8 | snapshot fetch 時の admin auth が切れる | 低 | 中 | curl 前に `/admin` ログインを確認。401 時は再ログイン |

## 9.1 ロールバック方針

- secrets 投入後の即時 rollback は **行わない** (停止しても何も解決しない)。
- 万一誤った値を投入した場合: `cf.sh secret put` で正しい値を再投入する (rotate)。`secret delete` は worker 起動時 fail-closed (`require_admin` 等) を誘発し 5xx の暴発を招くため、必ず put-overwrite で対応する。

## 9.2 ロールバック不要条件

- 本タスクはコード変更を含まないため、git revert / deploy rollback の対象外。
- D1 `sync_jobs` の status update は 1 row 単位で対象 row 限定。誤更新時は再 SELECT → 元 status へ UPDATE で復元可。
