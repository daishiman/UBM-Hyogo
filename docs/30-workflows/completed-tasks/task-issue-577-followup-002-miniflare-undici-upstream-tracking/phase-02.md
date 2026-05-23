# Phase 2: 設計（追跡フロー）

## 追跡対象 repo

| # | repo | 役割 | release 取得コマンド |
| --- | --- | --- | --- |
| 1 | `cloudflare/workers-sdk` | Miniflare 本体 / wrangler | `gh api repos/cloudflare/workers-sdk/releases --paginate -q '.[].tag_name'` |
| 2 | `nodejs/undici` | HTTP client / socket pool / Agent | `gh api repos/nodejs/undici/releases --paginate -q '.[].tag_name'` |
| 3 | `cloudflare/workerd` | Workers runtime | `gh api repos/cloudflare/workerd/releases --paginate -q '.[].tag_name'` |

## triage キーワード（6 件）

release notes / changelog / merged PR 本文に対する大文字小文字を区別しない検索キーワード:

1. `socket` — socket pool 全般
2. `EADDRNOTAVAIL` — 直接的な症状名
3. `keep-alive` / `keepalive` — 接続再利用
4. `agent pool` / `Agent` / `Pool` — undici Agent / Pool 関連
5. `port` — ephemeral port 関連（`port reuse` 含む）
6. `TIME_WAIT` — TCP TIME_WAIT 蓄積

### 判定基準

- **改善あり**: 上記キーワードを含む commit/PR が release に含まれ、かつ description が「socket reuse 改善」「port 枯渇緩和」「Agent pool sizing 改善」等を明示
- **改善なし**: キーワード hit が無い / hit があっても internal refactor のみで挙動変化なし
- **保留**: キーワード hit があるが影響範囲が不明 → triage 表に「保留」記録、次サイクルで再評価（ただし今回サイクルでは AC-3 の「維持」結論を選択）

## チェック頻度（trigger）

| trigger | 頻度 | 担当 |
| --- | --- | --- |
| 月次定期 | 毎月 1 日 | qa-tests |
| Miniflare メジャー更新 | major version 検知時 | infra-runbook |
| Issue #577 関連 incident 再発 | 即時 | qa-tests |

## 運用フロー

```
1. gh api で 3 repo の since-last-check release を取得
2. 各 release の body を triage キーワードで grep
3. hit があれば PR/commit URL を triage 表に記録
4. 「改善あり」と判定したら Phase 4-5 の A/B runbook を実行
5. 「改善なし」「保留」なら現状 maxWorkers=1 維持を Phase 11 で明示
```

## triage 表 schema（Phase 8 でテンプレ化）

| repo | 確認 release tag | hit キーワード | 該当 PR/commit | 改善判定 | 影響範囲メモ |
| --- | --- | --- | --- | --- | --- |
| workers-sdk | `miniflare@X.Y.Z` | `socket`, `keep-alive` | #NNNN | あり/なし/保留 | (description 要約) |

## 設計上の不変条件

- 追跡対象 repo は **拡張可能だが削減不可**（一度載せた repo は次サイクルでも継続）
- キーワードは **追加可能だが削除不可**（false negative 防止）
- 月次定期 trigger は固定（休止しない）

## 次フェーズへの引き継ぎ事項

Phase 3 で代替案（手動 vs cron / Renovate / Dependabot）と採用根拠を整理する。
