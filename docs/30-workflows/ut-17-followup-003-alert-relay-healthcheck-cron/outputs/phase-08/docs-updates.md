# Phase 8 成果物: ドキュメント更新差分

[実装区分: 実装仕様書]

UT-17 followup-003 cron 自動ヘルスチェック導入に伴う、runbook / specs / CLAUDE.md / `.dev.vars.example`
への変更差分を Markdown ブロック単位で記録する。本ファイルは Phase 8 完了の唯一の根拠 evidence。

---

## 1. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

### 1.1 差分A — 冒頭 §0 追加

**挿入位置**: 行 1 のタイトル `# UT-17 Alert Relay 月次ヘルスチェック runbook` の **次の段落** と
既存 §1 の **間**。既存 §1〜§4 の順序は変更しない。

**追加するブロック**:

```markdown
## 0. 本 runbook の位置付け（UT-17 followup-003 以降）

UT-17 followup-003（Cloudflare Workers Cron Triggers による週次自動ヘルスチェック）の本番投入後、
本 runbook の運用ポジションは以下の通り再定義される。

| 監視レイヤ | 担当 | 周期 | 検知ラグ |
| --- | --- | --- | --- |
| 定常的な経路死活確認 | `apps/api` Cron Trigger (`0 18 * * *`) ＋ Monday gate | 週次（毎週月曜 18:00 UTC = 火曜 03:00 JST） | 最大 1 週間 |
| 四半期 deep-dive | 本 runbook（手動 5 ステップ） | 3 ヶ月に 1 回 | — |
| Cron 連続失敗時の deep-dive | 本 runbook（cron が 2 回連続失敗時に即時実施） | 異常時 | — |

> **方針**: 月次手動 runbook は **定常監視責務を担わない**。週次 cron が `OK` を返し続ける限り、本 runbook は
> 四半期に 1 回の deep-dive と、cron 失敗の根本原因調査時に実施する。

### Cron 連続失敗の閾値（即時 runbook 実施トリガー）

- Slack `#ubm-alerts-healthcheck` への OK 投稿が **2 週連続で欠落** したら本 runbook を即時実施する。
- メールフォールバック（`HEALTHCHECK_FALLBACK_EMAIL`）が **1 回でも** 着信したら本 runbook を即時実施する。
- 上記いずれかが発生した時点で、本 runbook §1 の「インシデント対応後」と同等の優先度で扱う。

### 本 runbook を実施しないケース

- 週次 cron が OK 投稿を継続している間は、月次定常実施を **行わない**（運用ノイズ削減）。
- ただし四半期に 1 回（1, 4, 7, 10 月の第 1 営業日）は必ず実施する。
```

### 1.2 差分B — §3「異常検知時の対応」テーブル末尾に 2 行追加

**挿入位置**: 既存テーブル `| Step 4 で Policy が消失 | ... |` 行の **直後**。

**追加するブロック**:

```markdown
| 週次 cron OK 通知が 2 週連続欠落 | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production` で scheduled handler ログを確認。`SLACK_WEBHOOK_URL_HEALTHCHECK` が未設定 / 失効していないか 1Password と Cloudflare Secrets を照合 |
| メールフォールバックが着信 | メール本文の `reason` を確認し、Slack 投稿失敗（`status !== 200` or `body !== "ok"`）か関数 throw かを切り分け。Slack 側 revoke が疑われる場合は §2 Step 5（1Password secret 鮮度確認）と同じ手順で再発行 |
```

### 1.3 差分C — §4「記録」末尾に追記

**挿入位置**: 既存 §4 の文末（`...初回は本ファイルから派生作成）。` の **次の行**）。

**追加するブロック**:

```markdown

四半期 deep-dive 実施時は `outputs/phase-09/healthcheck-quarterly-log.md`（task-635 完了後に新設）に
実施日 / 担当 / Step 結果 / cron OK 連続回数（直近 12 週）を追記する。
```

---

## 2. `docs/00-getting-started-manual/specs/` への影響評価

### 2.1 grep 実行

```bash
grep -rIn -e "alert-relay" -e "Notification" -e "notification" -e "cron" -e "healthcheck" \
  docs/00-getting-started-manual/specs/ | tee outputs/phase-08/specs-grep.txt
```

### 2.2 評価ルール（grep 結果は別ファイル `specs-grep.txt` 参照）

| 観点 | 判定基準 | 本タスクでの対応 |
| --- | --- | --- |
| `alert-relay` が hit | spec 文中で「定常監視 = 月次 runbook」と書かれている場合のみ修正 | 該当行に「定常死活確認は週次 cron が担当」を 1 行追記 |
| `Notification` policy が hit | UT-17 Notification Policy への言及のみで、定常監視責務に踏み込んでいないなら不要 | 修正なし |
| `cron` が hit | 本タスクの cron `0 18 * * *` と用途が衝突しないか確認 | 既存 `0 18 * * *` 相乗りのため衝突なし |
| `healthcheck` が hit | UT-17 月次 runbook への参照のみなら不要 | 修正なし |

### 2.3 評価結果（実 grep 実行後に確定）

`specs-grep.txt` を Phase 8 実装時に確認し、以下の表に確定値を埋める:

| spec ファイル | hit 行 | 修正要否 | 修正内容 |
| --- | --- | --- | --- |
| _Phase 8 実装時に specs-grep.txt 結果を転記_ | _N_ | 不要 / 要 | _不要時は理由 / 要時は diff_ |

> hit 0 件のときは本表に「specs 配下に該当言及なし、修正不要」を 1 行で記録する。

---

## 3. `CLAUDE.md` 影響評価

### 3.1 判定マトリクス

| 観点 | 結論 | 根拠 |
| --- | --- | --- |
| シークレット管理テーブル更新 | **不要** | 既存「ランタイムシークレット = Cloudflare Secrets」分類で `SLACK_WEBHOOK_URL_HEALTHCHECK` / `HEALTHCHECK_FALLBACK_EMAIL` / `RESEND_API_KEY` の 3 件は全て内包される |
| `apps/web` env アクセス不変条件 | **不要** | 本タスクは `apps/api` 限定。`apps/web` env shape に影響なし |
| Cloudflare 系 CLI 実行ルール | **不要** | 本タスクは `bash scripts/cf.sh deploy` / `secret put` / `tail` 経由のみ。新ラッパー追加なし |
| 不変条件「D1 への直接アクセスは apps/api に閉じる」 | **不要** | D1 schema 変更なし |
| 「solo dev 運用ポリシー」 | **不要** | branch protection / required check 変更なし |

### 3.2 結論

CLAUDE.md への追記は **行わない**。本評価結果のみを本ファイル §3 に記録して evidence とする。

---

## 4. local env sample 追記差分

### 4.1 挿入位置

既存 `.dev.vars.example` の末尾（最終行の次）に以下を追加する。既存例示行は変更しない。

### 4.2 追加するブロック

```bash
# UT-17 followup-003: Cron 週次ヘルスチェック専用（optional, 未設定時は SLACK_WEBHOOK_URL にフォールバック）
SLACK_WEBHOOK_URL_HEALTHCHECK="op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL_HEALTHCHECK"

# UT-17 followup-003: メールフォールバック宛先（optional, 未設定時はメール送信スキップ）
HEALTHCHECK_FALLBACK_EMAIL="op://Personal/cloudflare-alert-relay/HEALTHCHECK_FALLBACK_EMAIL"

# UT-17 followup-003: Resend API key（メールフォールバック送信用, optional）
RESEND_API_KEY="op://Personal/cloudflare-alert-relay/RESEND_API_KEY"
```

### 4.3 不変条件確認

- [x] 全行が `op://` 参照のみ。実値の混入なし。
- [x] 既存 secrets の上書きなし（末尾追記のみ）。
- [x] CLAUDE.md「ローカル `.env` の運用ルール」と整合。

---

## 5. evidence ファイル一覧

| ファイル | 目的 |
| --- | --- |
| `outputs/phase-08/docs-updates.md`（本ファイル） | runbook / specs / CLAUDE.md / .dev.vars.example の差分 SSOT |
| `outputs/phase-08/specs-grep.txt` | specs 配下の影響評価生 grep 出力 |

---

## 6. DoD（Phase 8 確定）

- [ ] 差分A / B / C が runbook ファイルに適用済み
- [ ] specs-grep.txt が保存され、§2.3 表に評価結果が転記済み
- [ ] CLAUDE.md は修正なし（§3 マトリクス全 [x]）
- [ ] `.dev.vars.example` に optional 3 件が op 参照のみで追記済み
- [ ] markdownlint PASS
