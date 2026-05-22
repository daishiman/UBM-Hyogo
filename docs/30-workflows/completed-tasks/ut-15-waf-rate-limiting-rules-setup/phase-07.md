[実装区分: 実装仕様書]

# Phase 7: ドキュメント / runbook

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 機能名 | ut-15-waf-rate-limiting-rules-setup |
| 作成日 | 2026-05-09 |
| タスク種別 | implementation（docs を含む） |
| visualEvidence | NON_VISUAL |
| scope | cloudflare_edge_security |
| 依存 | phase-04.md / phase-05.md / phase-06.md |

## 目的

`docs/runbooks/cloudflare-waf-operations.md` を新規作成し、UT-15 の運用フェーズで必要な (a) 誤検知時のホワイトリスト追加手順、(b) WAF / Rate Limiting ログ確認方法、(c) Simulate→Enforce 移行 SOP、(d) インシデント時の rollback、(e) 平常運用の観測手順 を一元化する。あわせて aiworkflow-requirements への反映が必要な箇所を指示する。

## 1. `docs/runbooks/cloudflare-waf-operations.md` の構造定義

> Phase 7 ではこの構造定義（目次・各セクション必須項目）を確定する。実ファイル作成は Phase 5 Step 3 と並行して着手し、Phase 7 で章構成・必須項目を満たすか検証する。

### 章構成（必須）

```markdown
# Cloudflare WAF / Rate Limiting Operations Runbook

## 0. 適用範囲と前提
## 1. 構成概要
## 2. 平常運用
   2.1 観測手順（Cloudflare Analytics / Security Events）
   2.2 GraphQL Analytics API でのログ取得
## 3. 誤検知対応
   3.1 ホワイトリスト追加手順
   3.2 個別ルール無効化手順
## 4. Simulate → Enforce 移行 SOP
## 5. インシデント対応
   5.1 即時 rollback
   5.2 完全停止（緊急）
   5.3 事後分析
## 6. 既知の制約と TODO（Pro 移行時）
## 7. 連絡先・エスカレーション
## 8. 変更履歴
```

### 各章の必須項目

#### §0 適用範囲と前提

- 対象 zone 一覧（apps/api / apps/web）
- 対象 ruleset（Free Managed Ruleset / Custom Rules / Rate Limiting Rules）
- 関連 task spec（`docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/`）
- 関連設定ファイル（`scripts/cf-waf-apply/config.json`）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守の明記（`wrangler` 直叩き禁止）

#### §1 構成概要

- Phase 1 §「想定アーキテクチャ」の図を転載（edge → Workers の処理順）
- Phase 2 Concern A/B/C のマトリクス短縮版（path × threshold × action）
- 既存 app-layer rate limit との責務分離図

#### §2 平常運用

- §2.1: Cloudflare dashboard の Security Events で `action=log` / `action=block` の閲覧手順（手順は文章化、screenshot は NON_VISUAL のため不要）
- §2.2: GraphQL Analytics API で `firewallEventsAdaptiveGroups` / `rateLimitsAdaptiveGroups` を取得する curl サンプル

```bash
# サンプル: 過去 1h のレートリミット発火集計
curl -s -X POST "https://api.cloudflare.com/client/v4/graphql" \
  -H "authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{
    "query": "query($zone:String!, $since:Time!){ viewer { zones(filter:{zoneTag:$zone}){ rateLimitsAdaptiveGroups(filter:{datetime_geq:$since}, limit:100){ count dimensions { ruleId action } } } } }",
    "variables": { "zone": "<ZONE_ID>", "since": "2026-05-09T00:00:00Z" }
  }'
```

> 上記 curl は `op run --env-file=.env --` 経由で実行し、token を直接展開しない（CLAUDE.md ルール）。

#### §3 誤検知対応

- §3.1: ホワイトリスト追加手順
  - 1. Cloudflare Security Events で誤検知 IP / UA を特定
  - 2. `scripts/cf-waf-apply/config.json` の `customRules` に「`(ip.src in {<<IP>>})` → `skip` (action: skip)」rule を 1 件追加（無料枠 5 件以内に収まることを `wc -l` で確認）
  - 3. `bash scripts/cf-waf-apply.sh --dry-run --env production --mode <現状>` で diff 確認
  - 4. `bash scripts/cf-waf-apply.sh --env production --mode <現状>` で apply
  - 5. 再 dry-run で diff 0 を確認
  - 6. `outputs/phase-7/whitelist-<date>.log` に記録
- §3.2: 個別ルール無効化手順
  - `config.json` の対象 rule の `mode` を `simulate`（log のみ）に戻す → 再 apply

#### §4 Simulate → Enforce 移行 SOP

Phase 5 §2.3 を runbook 側で正本化（task spec が close 済みでも参照可能にする）。

- pre-condition: 観測 7 日 / 誤検知 0 件 / Phase 2 閾値妥当性検証済み
- 手順:
  1. `bash scripts/cf-waf-apply.sh --dry-run --env production --mode enforce`
  2. 差分内容（rule ごとの mode 遷移）を runbook に貼付（テキスト diff・実値の zone_id は redact）
  3. `UT15_ENFORCE_ACK=1 bash scripts/cf-waf-apply.sh --env production --mode enforce`（誤操作防止 ack 環境変数・TC-U-17）
  4. 30 分以内に Cloudflare Security Events で `action=block` / `managed_challenge` を確認
  5. 24 時間 Sentry / 監視で 429 苦情 / エラー急増がないことを観測
- post-condition: §8 変更履歴に「`<date>` Enforce 移行」を記録

#### §5 インシデント対応

- §5.1: 即時 rollback
  - `bash scripts/cf-waf-apply.sh --env production --mode simulate`（即時 log のみに戻る）
- §5.2: 完全停止（緊急）
  - Cloudflare dashboard で該当 ruleset を `Disabled` にする緊急手順
  - 注意: dashboard 操作後は `bash scripts/cf-waf-apply.sh --dry-run` で local config と remote が drift する。事後に config.json を修正し再 apply
- §5.3: 事後分析
  - インシデント発生時刻 / 発火 rule / 影響ユーザ数 / 解消時刻を `outputs/phase-7/incident-<date>.md` に記録
  - 必要に応じて Phase 2 閾値マトリクスを更新（task spec 改版 issue を起票）

#### §6 既知の制約と TODO（Pro 移行時）

- Cloudflare Free 制約: Custom Rules 5 件まで / Managed Ruleset は Free 限定 / Bot Fight Mode 別枠
- TODO: MINOR-01（Terraform 化検討）、Pro 移行時に OWASP CRS フル適用
- TODO: 地域ブロック検討（VPN / CDN 副作用に注意）

#### §7 連絡先・エスカレーション

- Cloudflare 障害時: status.cloudflare.com を確認
- 内部エスカレーション: `daishimanju@gmail.com`（solo 運用）
- 1Password Vault: `Cloudflare`（`API Token` / `Account` / `Zone`）

#### §8 変更履歴

- 日付 / 変更内容 / 実行者 / 関連 PR の表

## 2. NON_VISUAL 代替証跡（runbook と Phase 11 の関係）

| 証跡 | 取得元 | 配置先 |
| --- | --- | --- |
| `cf-waf-apply.sh --dry-run` stdout | Phase 5 Step 4 | `outputs/phase-5/dry-run-staging.log` |
| `cf-waf-apply.sh --env production --mode simulate` 実行ログ（token redact 済）| Phase 5 §2.2 | `outputs/phase-5/apply-prod-simulate.log` |
| Cloudflare Security Events の log 集計 JSON | Phase 5 §2.2 観測期間 | `outputs/phase-7/security-events-<date>.json` |
| curl `-i` で 429 + retry-after が返る応答ログ | Phase 6 §5 E2E | `outputs/phase-6/smoke-auth.log` |
| GraphQL Analytics API レスポンス | runbook §2.2 | `outputs/phase-7/graphql-<date>.json` |

> Phase 11 の NON_VISUAL 代替証跡は本 runbook §2.1 / §2.2 / §4 の手順に従って取得し、`outputs/phase-11/` 配下に redact 済みファイルとして保存する。

## 3. aiworkflow-requirements への反映指示

`.claude/skills/aiworkflow-requirements/` 配下の正本仕様への反映が必要な箇所を以下に列挙する。実反映は Phase 12（仕様同期）で行うが、Phase 7 で「何をどこへ反映するか」を確定する。

| 反映先（候補） | 内容 |
| --- | --- |
| `references/security/edge-security.md`（新規 or 既存に節追加）| WAF Managed Ruleset / Rate Limiting Rules の正本方針・閾値マトリクス概要・Simulate→Enforce 移行 gate |
| `references/security/rate-limiting-responsibility.md`（新規）| edge / optional `[[ratelimits]]` binding / app-layer の責務分離マトリクス（Phase 2 Concern C を正本化）|
| `indexes/keywords.json` | `WAF`, `Rate Limiting`, `Simulate`, `Enforce`, `cf-waf-apply`, `cloudflare_edge_security` を追加 |
| `indexes/topic-map.md` | `cloudflare_edge_security` topic を追加し、本 runbook と Phase 2 マトリクスへリンク |
| `indexes/quick-reference.md` | 「Cloudflare edge security」節に runbook パスと task spec パスを記載 |

> 実反映は Phase 12 の `spec-update-workflow.md` に従って行う。Phase 7 ではこの反映指示マトリクスのみ確定する。

## 4. CLAUDE.md / その他正本との整合

| 整合先 | 整合内容 |
| --- | --- |
| CLAUDE.md § シークレット管理 | `op run` 経由必須・`wrangler` 直叩き禁止を runbook §0 / §3.1 / §4 で再掲 |
| CLAUDE.md § 重要な不変条件 | 既存 app-layer rate limit の API signature 不変・`apps/web` から D1 直接アクセス禁止の遵守を runbook §1 で言及 |
| `docs/00-getting-started-manual/specs/` | 既存仕様への影響なし（API endpoint 不変・schema 不変）。本 runbook を `specs/` 配下ではなく `runbooks/` 配下に置く理由（運用 SOP のため）を §0 に明記 |

## 5. runbook 品質チェック（Phase 7 完了条件）

- [ ] 章構成 §0〜§8 がすべて埋まっている
- [ ] §2.2 GraphQL Analytics API の curl サンプルが実行可能（token は op 注入想定）
- [ ] §3.1 ホワイトリスト追加手順が `config.json` 編集 + `cf-waf-apply.sh` 経由で完結する
- [ ] §4 Simulate→Enforce 移行 SOP が Phase 5 §2.3 と一致する
- [ ] §5.1 即時 rollback が 1 コマンド（`bash scripts/cf-waf-apply.sh --env production --mode simulate`）で完結する
- [ ] §6 で Pro 移行時の TODO（MINOR-01）が記録されている
- [ ] §7 連絡先・1Password Vault 名称が記載されている
- [ ] §8 変更履歴の表が用意されている（初回エントリは「`2026-05-09` 初版作成」）
- [ ] secret 実値が runbook 本文に含まれない（`grep -E "(eyJ|sk_|cf_)" docs/runbooks/cloudflare-waf-operations.md` で 0 ヒット）
- [ ] `wrangler` 直叩きコマンドが runbook 本文に含まれない（`grep -n "^wrangler " docs/runbooks/cloudflare-waf-operations.md` で 0 ヒット）

## 6. 上流ブロッカー（gate 重複明記）

| ブロッカー | 解除条件 |
| --- | --- |
| Cloudflare Security Events の閲覧権限 | 1Password の Cloudflare アカウントで dashboard アクセス可能 |
| GraphQL Analytics API の token 権限 | `Analytics:Read` を含む token を 1Password 側に追加・runbook §2.2 に追記 |
| Phase 12 での aiworkflow-requirements 反映 | 本 Phase 7 の §3 マトリクスに従って Phase 12 で実反映 |

## 7. 参照資料

| 資料 | パス |
| --- | --- |
| `phase-04.md` | 実装計画 |
| `phase-05.md` | Deployment checkpoint（runbook §4 の根拠）|
| `phase-06.md` | テスト戦略（runbook §2.1 観測手順の検証根拠）|
| Cloudflare CLI ルール | `CLAUDE.md` § シークレット管理 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/` |
| spec-update workflow | `.claude/skills/task-specification-creator/references/spec-update-workflow.md` |

## 8. 成果物

| 成果物 | パス |
| --- | --- |
| ドキュメント / runbook 仕様書（本ファイル）| `docs/30-workflows/ut-15-waf-rate-limiting-rules-setup/phase-07.md` |
| Cloudflare WAF Operations Runbook | `docs/runbooks/cloudflare-waf-operations.md`（Phase 7 構造定義に従い実作成）|
| aiworkflow-requirements 反映指示 | §3 マトリクス（Phase 12 で実反映）|
| NON_VISUAL 代替証跡マッピング | §2 表 |

## 9. 統合テスト連携【必須】

| 判定項目 | 基準 | 結果 |
| --- | --- | --- |
| ドキュメント章構成 | §0〜§8 100% | TBD（Phase 7 実施時）|
| secret redact 検証 | 0 ヒット | `grep` ベースで自動検証可能 |
| `wrangler` 直叩き redact | 0 ヒット | 同上 |
| aiworkflow-requirements 反映指示 | 5 反映先確定 | §3 表 |

## 10. 完了条件（DoD）

- [ ] §1 で章構成と各章必須項目が確定している
- [ ] §1 §3.1 ホワイトリスト追加手順が `config.json` 編集 + `cf-waf-apply.sh` 経由で完結する設計になっている
- [ ] §1 §4 Simulate→Enforce 移行 SOP が Phase 5 §2.3 と一致する
- [ ] §1 §5.1 即時 rollback が 1 コマンドで完結する
- [ ] §2 NON_VISUAL 代替証跡の取得元 / 配置先が表で示されている
- [ ] §3 aiworkflow-requirements への反映指示が 5 反映先で確定している
- [ ] §4 CLAUDE.md / 既存正本との整合が記述されている
- [ ] §5 runbook 品質チェックの 10 項目が完了条件として明記されている
- [ ] secret 実値・`wrangler` 直叩きが runbook 本文に混入しないことを `grep` で gate 化している

## 11. 次の Phase

Phase 8: リファクタリング（重複検出 / naming / navigation 短縮）。本 task では helper 経由化が主な変更で副作用範囲が小さいため、Phase 8 は軽量レビューに留まる見込み。

## 実行タスク

1. Cloudflare WAF operations runbook と関連正本仕様への反映方針を固定する。
2. edge / app-layer responsibility と monitoring handoff を文書化する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `phase-02.md` | responsibility matrix |
| `phase-05.md` | deployment checkpoint |

## 成果物

| 成果物 | パス |
| --- | --- |
| Phase 7 ドキュメント反映仕様 | `phase-07.md` |

## 完了条件

- [ ] runbook / 正本仕様 / lessons handoff が記述されている。

## 統合テスト連携

Phase 11 smoke evidence と Phase 12 implementation guide に接続する。
