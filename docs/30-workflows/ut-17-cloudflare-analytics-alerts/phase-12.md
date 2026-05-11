# Phase 12: 正本同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | Cloudflare Analytics アラート設定 + Slack 日本語化リレー (UT-17) |
| 作成日 | 2026-05-09 |
| 担当 | delivery |
| 状態 | pending |
| GitHub Issue | #20（CLOSED — Refs として参照） |
| タスク種別 | implementation / non_visual |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は実装済みコード + Cloudflare Notification Policy + runbook の正本を aiworkflow-requirements skill / task-specification-creator skill / 関連 spec へ反映する Phase。strict 7 outputs を出力し Phase 13 への引き継ぎを完了させる。 |

---

## 目的

Phase 9〜11 で完成した relay Worker 実装と Notification Policy 設定を、
システム仕様書群（aiworkflow-requirements skill）および将来の運用担当者へ正本として引き継ぐ。
本 Phase は **strict 7 outputs**（`phase-12-spec.md` 準拠）を全て出力する。

---

## なぜ正本同期が必要か（中学生レベル）

「家のセキュリティアラームを取り付けた」だけでは、来月の自分や別の家族が
「どこにスイッチがあったっけ？」「警報が鳴ったら誰に電話するの？」と毎回迷ってしまう。

Phase 12 では「**取扱説明書を家中の決まった場所に貼る作業**」を行う。

- 玄関の壁（aiworkflow-requirements skill の正本）に「2026-05 改修：Cloudflare アラート + Slack 日本語化」と追記
- 冷蔵庫のドア（task-specification-creator skill の LOGS）に「UT-17 完了 / 12.0 時間で完了」を追記
- 家族共有 LINE（lessons-learned）に「Slack Webhook URL を docs に貼ると即漏洩する。今回は 1Password 経由で防いだ」と記録

これをスキップすると、3 ヶ月後に「Cloudflare 通知が来てるけど、これ何のシステムだっけ？」となり、
最悪の場合「不要だと思って無効化 → 無料枠超過に気付けず課金」が起きる。

---

## strict 7 outputs（必須）

| # | output | 必須 | 出力先 |
| --- | --- | --- | --- |
| 1 | main.md | ✅ | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md（Part 1 / Part 2） | ✅ | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary.md | ✅ | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | skill-feedback-report.md | ✅ | `outputs/phase-12/skill-feedback-report.md` |
| 5 | phase12-task-spec-compliance-check.md | ✅ | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 6 | documentation-changelog.md | ✅ | `outputs/phase-12/documentation-changelog.md` |
| 7 | unassigned-task-detection.md | ✅ | `outputs/phase-12/unassigned-task-detection.md` |

---

## 12-1. implementation-guide.md（Part 1 / Part 2）

### Part 1 — 中学生レベル概念説明

| 概念 | 家のアラームの例え |
| --- | --- |
| Cloudflare 無料枠 | 月額 0 円で使える「家の電気使用量上限」 |
| Notification Policy | 「電気使用量が 80% 行ったら教えて」という事前設定 |
| relay Worker | Cloudflare からの英語通知を受け取り、家族みんなが分かる日本語に翻訳して LINE に送る「翻訳係」 |
| cf-webhook-auth 検証 | 「翻訳係」が、本当に Cloudflare から来た通知か（イタズラじゃないか）を印鑑で確認する仕組み |
| Slack Incoming Webhook | 家族 LINE グループの「メッセージ投稿用 URL」 |
| 1Password 管理 | 印鑑も LINE 用 URL も、家中に貼り出さず金庫にしまう |
| 月次ヘルスチェック | 月に一度「LINE が壊れてないか」を試しに送って確認する |

#### 必須セクション
1. なぜ Cloudflare 無料枠アラートが必要か（無料枠超過＝突然の課金リスク）
2. なぜ relay Worker が必要か（Cloudflare 標準通知は英語、運用者全員に通じない）
3. なぜ cf-webhook-auth 検証が必要か（public endpoint = 誰でも叩けてしまうため、署名で本物確認）
4. なぜ 1Password 経由なのか（GitHub に Webhook URL が漏れた瞬間、誰でも Slack に投稿できる）
5. アラートが来たら何をするか（runbook を読む = 取扱説明書を開く）
6. なぜplan gateで完結させるか（家計を圧迫しない設計）

### Part 2 — 技術者レベル詳細

#### 必須セクション
1. **アーキテクチャ**: Cloudflare Notifications → relay Worker (`/internal/alert-relay`) → Slack Incoming Webhook
2. **cf-webhook-auth 仕様**: Cloudflare Webhook destination secret を `cf-webhook-auth: <configured secret>` として受け取り、`CF_WEBHOOK_AUTH_SECRET` と timing-safe 比較する。body HMAC / `sha256=` / `X-CF-Alert-Signature` は採用しない
3. **payload → Slack Block 変換ロジック**: Phase 5 formatter の概念図 + `cloudflare-alert-formatter.ts` 引用
4. **Notification Policy 4 種**: Workers / D1 / Pages / R2 の閾値・destination
5. **Secret 管理**: 1Password Vault `cloudflare-alert-relay/*` → `bash scripts/cf.sh secret put`
6. **rotation 手順**: Phase 7 rotation runbook を引用形式で参照
7. **月次ヘルスチェック**: Phase 10 monthly runbook 参照
8. **UT-08-IMPL との責務境界**: Cloudflare native usage alerts (本タスク) vs WAE custom alerts (UT-08)
9. **Phase 11 evidence 一覧**: AC-1〜AC-9 evidence パス
10. **将来拡張ポイント**: 95% アラート追加、CPU time（UT-18）統合、WAF レート制限（UT-14）

#### スニペット引用ルール
- 関数シグネチャは Phase 5 から引用
- 設定値は Phase 9 `notification-policy-config.md` から引用
- 手書きスニペットは書かない（identifier drift 防止）

---

## 12-2. system-spec-update-summary.md

### Step 1-A：完了タスク記録

| 更新対象 | 更新内容 |
| --- | --- |
| `docs/30-workflows/ut-17-cloudflare-analytics-alerts/index.md` | 実装前は `spec_created` を維持。実装完了時のみ completed へ更新 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` または changelog fragment | UT-17 仕様化行を追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` または changelog fragment | Cloudflare アラート + Slack 日本語化リレー仕様化を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 「Cloudflare Notifications」「Slack 日本語化」「alert relay」「cf-webhook-auth verify」キーワード追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | monitoring / alert セクションに UT-17 を追加 |
| `.claude/skills/task-specification-creator/references/resource-map.md` | 同上 |

### Step 1-B：実装状況テーブル更新

実装前は UT-17 を **`spec_created / implementation / NON_VISUAL`** として task-workflow / unassigned-task index に記録する。実装完了後にのみ completed-tasks へ移動する。

### Step 1-C：関連タスクテーブル更新

| 関連タスク | 更新内容 |
| --- | --- |
| UT-08-IMPL | 「UT-17 で Cloudflare native usage alert と Slack JP relay は完了。WAE custom alert は引き続き UT-08 スコープ」を備考に追記 |
| UT-14（WAF / Rate Limiting） | 「UT-17 relay Worker `/internal/alert-relay` への WAF レート制限を要検討」を備考に追記 |
| UT-18（Workers CPU time） | 「無料枠 CPU time アラートは UT-17 のメトリクスに含めなかった。UT-18 で別途調査手順整備」を備考に追記 |

### Step 2：システム仕様更新

| 判定 | 結論 |
| --- | --- |
| 新規インターフェース追加 | **あり**（`POST /internal/alert-relay`） |
| 既存インターフェース変更 | なし |
| 新規定数 / 設定値 | あり（cf-webhook-auth header / Notification Policy 閾値 / Slack channel）。本タスク内 SSOT に閉じる |
| 結論 | **Step 2 実施**（global skill spec の `references/api-surface.md`（存在する場合）に internal route を追記、または aiworkflow-requirements の `references/deployment-cloudflare.md` に Notification Policy 設定値を反映） |
| 再判定条件 | UT-08-IMPL や UT-14 の実装時に route surface を再評価 |

---

## 12-3. skill-feedback-report.md

| カテゴリ | 学び |
| --- | --- |
| 実装 | Cloudflare Notification webhook の payload schema は metric によって `data` フィールドの構造が微妙に異なるため、formatter は **strict typing よりも generic fallback を優先** すべき |
| セキュリティ | Slack Webhook URL は GitHub secret scan で検知される。docs / PR / commit message に **絶対に貼らない** ことを Phase 7 grep gate でも担保 |
| 運用 | Slack Webhook の silent failure（URL revoke）は月次テストでしか検出できない。月次 runbook の優先度は HIGH |
| 設計 | UT-08-IMPL（WAE custom alerts）と UT-17（Cloudflare native usage alerts）の責務分離は早期に明示しておくと実装重複を防げる |
| ツール | `bash scripts/cf.sh` ラッパで `wrangler` 直接実行を禁止する運用は Secret 漏洩防止に有効 |

---

## 12-4. phase12-task-spec-compliance-check.md

| チェック項目 | 結果 |
| --- | --- |
| Phase 1〜11 の artifacts.json 全 phase が `completed` | [ ] |
| 7 strict outputs が全て出力されている | [ ] |
| Step 1-A の LOGS.md（2 ファイル）と topic-map.md / keywords.json（aiworkflow-requirements）と resource-map.md（task-specification-creator）が更新されている | [ ] |
| Step 1-B で `completed` にステータス更新済み | [ ] |
| Step 1-C で UT-08-IMPL / UT-14 / UT-18 の備考が更新されている | [ ] |
| Step 2 で internal route の正本反映が判定されている | [ ] |
| same-wave sync（UT-08-IMPL / UT-07 / UT-14 / 05a）に矛盾がない | [ ] |
| mirror parity（.claude ↔ .agents）が同期されている | [ ] |
| Phase 11 の AC-1〜AC-9 が全 PASS（evidence-bundle で確認） | [ ] |
| 不変条件（D1 直アクセス禁止 / `wrangler` 直接禁止 / 1Password 経由 / UT-08 と責務重複なし）に違反していない | [ ] |

---

## 12-5. documentation-changelog.md

```markdown
# UT-17 changelog（YYYY-MM-DD）

## workflow-local 同期（docs/30-workflows/ut-17-cloudflare-analytics-alerts/）
### 新規
- index.md / artifacts.json / phase-01〜13.md
- outputs/phase-01〜12 配下成果物

### 更新
- なし（新規ワークフロー）

## global skill sync（.claude/skills/）
- task-specification-creator/LOGS.md（UT-17 完了行）
- aiworkflow-requirements/LOGS.md（実装完了記録）
- aiworkflow-requirements/indexes/keywords.json（4 キーワード追加）
- aiworkflow-requirements/indexes/topic-map.md（monitoring セクション）
- task-specification-creator/references/resource-map.md（同上）

## コード変更（apps/api/）
### 新規
- src/routes/internal/alert-relay.ts
- src/middleware/verify-cf-webhook-auth.ts
- src/lib/cf-webhook-auth.ts
- src/lib/cloudflare-alert-formatter.ts
- src/lib/slack-sender.ts
- src/types/cloudflare-notification.ts
- src/routes/internal/__tests__/alert-relay.test.ts
- src/lib/__tests__/cloudflare-alert-formatter.test.ts
- src/lib/__tests__/cf-webhook-auth.test.ts
- src/lib/__tests__/slack-sender.test.ts

### 編集
- src/index.ts（route 登録）
- wrangler.toml（Secret 関連コメント整備）
- .dev.vars.example（op:// 参照追加）

## runbook（docs/30-workflows/runbooks/）
### 新規
- ut-17-cloudflare-usage-alert-response.md
- ut-17-alert-relay-monthly-healthcheck.md

## mirror parity
- .claude/skills と .agents/skills の差分を Phase 9 / 12 で確認、必要に応じ rsync で同期
```

---

## 12-6. unassigned-task-detection.md

```markdown
# UT-17 完了サマリー

## タスク
Cloudflare Analytics アラート設定 + Slack 日本語化リレー

## 期間
YYYY-MM-DD 〜 YYYY-MM-DD（実工数 12.0h）

## 成果
- Cloudflare Notification Policy 4 種を 80% 閾値で稼働開始
- relay Worker（`/internal/alert-relay`）を staging / production にデプロイ
- cf-webhook-auth 固定シークレット 署名検証 + 日本語 Slack Block Kit 整形 + リトライを実装
- 月次ヘルスチェック runbook を整備
- AC-1〜AC-9 全 PASS

## 影響範囲
- apps/api（新規モジュール 7 + テスト 3 + fixtures 5）
- docs/30-workflows/ut-17-cloudflare-analytics-alerts/（新規ワークフロー）
- docs/30-workflows/runbooks/（追記 1 + 新規 2）
- .claude/skills/（LOGS / index 更新）

## Wave 2 / 後続タスクへの引き継ぎ
- UT-14 で `/internal/alert-relay` への WAF レート制限を実装
- UT-18 で Workers CPU time 確認手順を整備
- UT-08-IMPL は WAE custom alerts のみ担当（UT-17 と独立）
```

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-08-IMPL | 通知 channel 共有 + 責務境界 | system-spec-update-summary.md Step 1-C で備考更新 |
| UT-07 | 通知基盤確定 | LOGS.md に「UT-07 input でアラート通知設計が完結」と記録 |
| UT-14 / UT-18 | 後続タスクへのバトン | system-spec-update-summary.md Step 1-C で備考更新 |
| 05a parallel observability | runbook 追記方針 | changelog で追記方式を明示 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | strict 7 outputs ルール |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Phase 12 手順正本 |
| 必須 | docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-12/ | 同期成果物の参考 |
| 必須 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-11/ | AC evidence 入力 |

---

## 成果物（artifacts.json phase-12 と完全一致）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/implementation-guide.md | 実装ガイド（Part 1 / Part 2） |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜Step 2 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 5 カテゴリの学び |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 10 チェック項目 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | workflow-local + global sync + コード + runbook |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | サマリー |
| 更新 | .claude/skills/task-specification-creator/LOGS.md | UT-17 完了行 |
| 更新 | .claude/skills/aiworkflow-requirements/LOGS.md | 実装完了記録 |
| 更新 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 4 キーワード追加 |
| 更新 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | monitoring セクション |
| 更新 | .claude/skills/task-specification-creator/references/resource-map.md | 同上 |
| メタ | artifacts.json | phase-12 を completed に更新 |

---

## 完了条件

- [ ] strict 7 outputs が全て `outputs/phase-12/` に配置されている
- [ ] implementation-guide.md が Part 1（中学生レベル）と Part 2（技術者レベル）の 2 部構成
- [ ] system-spec-update-summary.md に Step 1-A / 1-B / 1-C / Step 2 の判定が明記されている
- [ ] LOGS.md（2 ファイル）と keywords.json + topic-map.md + resource-map.md が更新されている
- [ ] phase12-task-spec-compliance-check.md の 10 チェック項目が全 [x]
- [ ] documentation-changelog.md に workflow-local / global sync / コード / runbook の 4 ブロックが分離されている
- [ ] mirror parity（.claude ↔ .agents）が確認されている
- [ ] artifacts.json と outputs ディレクトリ実体が 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] strict 7 outputs + 5 ファイル更新が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-12 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 13（PR・振り返り）
- 引き継ぎ:
  - documentation-changelog.md の変更ファイル一覧 = Phase 13 PR 本文の change-summary
  - unassigned-task-detection.md = Phase 13 PR 本文の Summary セクションの元データ
  - implementation-guide.md = PR レビュア向け参照
- ブロック条件: strict 7 outputs に欠落 / mirror parity 未解消 / same-wave sync で重大矛盾検出
