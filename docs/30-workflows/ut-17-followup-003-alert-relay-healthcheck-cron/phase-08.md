# Phase 8: ドキュメント反映（runbook / specs 整合）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17 Alert Relay 週次自動ヘルスチェック (Cron Triggers) |
| タスクID | ut-17-followup-003-alert-relay-automated-healthcheck-cron |
| Phase 番号 | 8 / 13 |
| Phase 名称 | ドキュメント反映（runbook / specs 整合） |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 前 Phase | 7 (セキュリティ・プライバシー) |
| 次 Phase | 9 (staging 動作確認 / 受入) |
| 状態 | pending |
| GitHub Issue | #635 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 月次 runbook の役割再定義（定常監視 = cron / 月次 runbook = deep-dive）を **本タスク完了の前提条件** として明文化する Phase。実 markdown ファイルへの diff を確定するため、ドキュメント反映そのものが成果物となる実装仕様書である。 |

---

## 目的

cron 週次自動ヘルスチェックの導入に伴って発生する「定常監視責務の移管」を、運用ドキュメント側に
**事故なく** 反映する。具体的には:

1. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` の **冒頭** に役割分担セクションを追記し、
   月次 runbook が「四半期 deep-dive + cron 連続失敗時の deep-dive」用途であることを明示する。
2. `docs/00-getting-started-manual/specs/` に alert 経路の言及があれば、cron 自動化への参照を追加する。
3. `CLAUDE.md` のシークレット管理 / 不変条件セクションに、本タスクで追加する optional secrets
   （`SLACK_WEBHOOK_URL_HEALTHCHECK` / `HEALTHCHECK_FALLBACK_EMAIL` / `RESEND_API_KEY`）の管理場所を補記する必要があるかを判定する。

> 既存 runbook を **上書き** しない。**追記**方式で「冒頭ブロックの差し込み」+「§3 異常検知時の対応テーブルに行追加」のみ実施する。

---

## 8-1. ドキュメント変更対象ファイル一覧

| # | ファイル | 変更種別 | 影響度 |
| --- | --- | --- | --- |
| 1 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 追記（冒頭 §0 追加 / §3 異常時テーブル拡張） | 高 |
| 2 | `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/outputs/phase-08/docs-updates.md` | 新規（本 Phase 成果物） | — |
| 3 | `docs/00-getting-started-manual/specs/00-overview.md` | 影響有無確認のみ（grep で `alert-relay` / `notification` 該当箇所を確認） | 中 |
| 4 | `docs/00-getting-started-manual/specs/` 配下その他 | 同上 grep 結果次第 | 中 |
| 5 | `CLAUDE.md` | 影響有無確認のみ（新規 optional secret 追加の必要性を判定） | 低 |
| 6 | local env sample | 追記（optional 3 件の op 参照を例示） | 低 |

> 1 / 2 / 6 は本 Phase で必ず確定。3 / 4 / 5 は grep 後に「変更不要」or「Phase 8 で diff 提示」の二択。

---

## 8-2. `ut-17-alert-relay-monthly-healthcheck.md` 差分（Markdown ブロック単位）

### 差分A: 冒頭に §0 追加（タイトルの直後・既存「§1. 実施タイミング」より前に挿入）

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

### 差分B: §3「異常検知時の対応」テーブルに 2 行追加

既存テーブル末尾に以下 2 行を追加する:

```markdown
| 週次 cron OK 通知が 2 週連続欠落 | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production` で scheduled handler ログを確認。`SLACK_WEBHOOK_URL_HEALTHCHECK` が未設定 / 失効していないか 1Password と Cloudflare Secrets を照合 |
| メールフォールバックが着信 | メール本文の `reason` を確認し、Slack 投稿失敗（`status !== 200` or `body !== "ok"`）か関数 throw かを切り分け。Slack 側 revoke が疑われる場合は §2 Step 5（1Password secret 鮮度確認）と同じ手順で再発行 |
```

### 差分C: §4「記録」末尾に追記

```markdown
四半期 deep-dive 実施時は `outputs/phase-09/healthcheck-quarterly-log.md`（task-635 完了後に新設）に
実施日 / 担当 / Step 結果 / cron OK 連続回数（直近 12 週）を追記する。
```

---

## 8-3. `docs/00-getting-started-manual/specs/` 影響有無の判定手順

### 手順

```bash
# alert-relay / notification / cron に言及している箇所を一括検出
grep -rIn -e "alert-relay" -e "Notification" -e "notification" -e "cron" -e "healthcheck" \
  docs/00-getting-started-manual/specs/ \
  | tee outputs/phase-08/specs-grep.txt
```

### 判定マトリクス

| grep 結果 | 対応 |
| --- | --- |
| `alert-relay` / `Notification policy` への言及がある | 該当 spec に「定常死活確認は週次 cron が担当」を 1 行追記し、本 Phase の `docs-updates.md` に diff を記録 |
| 言及がない | spec 修正なし。`docs-updates.md` に「specs grep 結果: hit 0 件のため修正不要」を明記 |
| `cron` が他用途で hit する | 本タスクの cron `0 18 * * *` と用途が衝突しないか確認（既存 `0 18 * * *` 相乗りのため、別 cron 式の追加は不要） |

> grep hit 数が 0 でも `specs-grep.txt` は evidence として保管する。

---

## 8-4. `CLAUDE.md` 追記判定

### 判定基準

| 項目 | 判定 | 追記要否 |
| --- | --- | --- |
| `SLACK_WEBHOOK_URL_HEALTHCHECK` は既存 `SLACK_WEBHOOK_URL` の派生で運用責務同等 | 既存「シークレット管理」テーブルの粒度（種別単位）では追記不要 | 不要 |
| `HEALTHCHECK_FALLBACK_EMAIL` は新カテゴリ（メール宛先）だが Cloudflare Secrets 経由 | 既存「ランタイムシークレット = Cloudflare Secrets」で内包される | 不要 |
| `RESEND_API_KEY` も同上 | 同上 | 不要 |
| `apps/web` env アクセス不変条件 | 本タスクは `apps/api` 限定。`apps/web` には影響なし | 不要 |
| 「Cloudflare 系 CLI 実行ルール」 | 本タスクで `wrangler` を直接呼ばず `bash scripts/cf.sh` 経由で deploy / secret put / tail を実行 | 既存ルールで足りる |

> **結論**: `CLAUDE.md` への追記は **不要**。本 Phase の `docs-updates.md` に「CLAUDE.md 影響なし」根拠を明記する。

---

## 8-5. local env sample 差分

既存 `.dev.vars.example`（task-02 wrangler-env-injection で導入済み）に **optional 3 件** を `op://` 参照のみで追記:

```bash
# UT-17 followup-003: Cron 週次ヘルスチェック専用（optional, 未設定時は SLACK_WEBHOOK_URL にフォールバック）
SLACK_WEBHOOK_URL_HEALTHCHECK="op://Personal/cloudflare-alert-relay/SLACK_WEBHOOK_URL_HEALTHCHECK"

# UT-17 followup-003: メールフォールバック宛先（optional, 未設定時はメール送信スキップ）
HEALTHCHECK_FALLBACK_EMAIL="op://Personal/cloudflare-alert-relay/HEALTHCHECK_FALLBACK_EMAIL"

# UT-17 followup-003: Resend API key（メールフォールバック送信用, optional）
RESEND_API_KEY="op://Personal/cloudflare-alert-relay/RESEND_API_KEY"
```

> 既存 secrets の例示行は **触らない**。本セクションは末尾追記のみ。

---

## 8-6. 主要関数シグネチャ（ドキュメント側で参照される範囲）

本 Phase は markdown 編集のみだが、runbook §3 で参照する handler 関数名は以下に固定する
（Phase 9 staging 確認、Phase 10 refactor で同じ識別子を使う）:

```ts
// apps/api/src/scheduled/healthcheck.ts
export async function runAlertRelayHealthcheck(env: ApiEnv): Promise<HealthcheckMailFallbackResult>;

// 内部 helper（Phase 10 で抽出判定）
function verifySlackResponse(status: number, bodyText: string): boolean;
function sendFallbackMail(env: ApiEnv, reason: string): Promise<void>;

export interface HealthcheckMailFallbackResult {
  readonly ok: boolean;
  readonly slackStatus: number;
  readonly slackBodyOk: boolean;
  readonly fallbackSent: boolean;
  readonly reason?: string;
}
```

> runbook §3「メールフォールバックが着信」行で `reason` 値の切り分けを指示しているため、
> `reason` は実装で必ず human-readable な文字列（例: `"slack_status_502"` / `"slack_body_not_ok"` / `"slack_fetch_throw"`）を入れる。

---

## 8-7. 入出力・副作用

| 入力 | 出力 | 副作用 |
| --- | --- | --- |
| `ut-17-alert-relay-monthly-healthcheck.md` の現状 | 差分A / B / C を適用した新版 | git 差分のみ。コード変更なし |
| `docs/00-getting-started-manual/specs/` の grep 結果 | `outputs/phase-08/specs-grep.txt` | evidence ファイル 1 件 |
| `.dev.vars.example` の現状 | optional 3 件を末尾追記した新版 | git 差分のみ。実値の混入は禁止（`op://` 参照のみ） |

---

## 8-8. テスト方針 / 検証コマンド

```bash
# 1. runbook 差分が冒頭挿入 + テーブル末尾追加で構造を壊していないか確認
mise exec -- pnpm exec markdownlint-cli2 \
  "docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md"

# 2. specs grep を実行し、評価結果を docs-updates.md に転記
grep -rIn -e "alert-relay" -e "Notification" -e "notification" -e "cron" -e "healthcheck" \
  docs/00-getting-started-manual/specs/

# 3. .dev.vars.example に op:// 参照以外の実値が紛れていないか確認
grep -nE "^[A-Z_]+=\"(?!op://)" local env sample || echo "OK: 実値なし"

# 4. CLAUDE.md に optional secret 名が誤って入っていないか確認
grep -nE "SLACK_WEBHOOK_URL_HEALTHCHECK|HEALTHCHECK_FALLBACK_EMAIL|RESEND_API_KEY" CLAUDE.md \
  || echo "OK: CLAUDE.md に新規 secret 直書きなし"
```

---

## 8-9. DoD（Definition of Done）

- [ ] `ut-17-alert-relay-monthly-healthcheck.md` に §0 が冒頭挿入されている（既存 §1〜§4 の順序維持）
- [ ] §3 異常時対応テーブルに 2 行追加されている（cron 欠落 / メールフォールバック着信）
- [ ] §4 末尾に四半期 deep-dive 記録の追記場所が明記されている
- [ ] `outputs/phase-08/docs-updates.md` に Markdown ブロック単位の diff が記録されている
- [ ] `outputs/phase-08/specs-grep.txt` に grep 結果（hit 0 件でも）が保存されている
- [ ] local env sample に optional 3 件が `op://` 参照のみで追記されている
- [ ] CLAUDE.md / specs に追記不要であった場合、その根拠が `docs-updates.md` に明記されている
- [ ] markdownlint で runbook が PASS する

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | runbook §0 の「Cron 連続失敗閾値」を staging で実演（webhook 不正値差し替え）し、メールフォールバック着信 → runbook 即時実施トリガー成立を確認 | Phase 9 受入 AC-4 で再利用 |
| Phase 10 | `verifySlackResponse` / `sendFallbackMail` の責務分離方針を runbook で参照（reason 文字列） | Phase 10 refactor 判定で根拠化 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | 追記対象本体 |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-003-alert-relay-automated-healthcheck-cron.md | 親タスク指示書（責務分担方針の根拠） |
| 必須 | local env sample | optional secrets の op 参照追加 |
| 参考 | CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」 | 追記不要判定の根拠 |
| 参考 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-10.md | 既存月次 runbook の責務分担前提 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/docs-updates.md | 差分A / B / C 全文 + specs grep 結果評価 + CLAUDE.md 影響なし根拠 |
| evidence | outputs/phase-08/specs-grep.txt | specs grep 生出力 |
| メタ | artifacts.json | phase-08 を completed に更新 |

---

## 完了条件チェックリスト

- [ ] 8-2 差分A / B / C が `outputs/phase-08/docs-updates.md` に Markdown ブロック単位で記載
- [ ] 8-3 specs grep が実行され `specs-grep.txt` に保存
- [ ] 8-4 CLAUDE.md 追記不要の根拠が明記
- [ ] 8-5 `.dev.vars.example` 差分が記載
- [ ] 8-9 DoD 全項目が PASS

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-08 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 9（staging 動作確認 / 受入）
- 引き継ぎ事項:
  - runbook §0「Cron 連続失敗の閾値」が Phase 9 AC-4（メールフォールバック検知）の判定根拠
  - 差分C で予約した `healthcheck-quarterly-log.md` のフォーマットは Phase 9 で確定する
- ブロック条件: runbook 既存記述を上書きしてしまった場合は git revert で復旧してから追記方式に修正
