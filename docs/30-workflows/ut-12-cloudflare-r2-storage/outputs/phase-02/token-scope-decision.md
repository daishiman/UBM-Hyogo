# Phase 2 成果物: API Token スコープ判断 (token-scope-decision.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 2 |
| 作成日 | 2026-04-27 |
| 採用案 | **案D: 専用 R2 Token を新規作成** |

## 1. 比較表

| 観点 | 案A: 既存 Token に R2:Edit 追加 | 案D: 専用 R2 Token 新規作成（採用） |
| --- | --- | --- |
| 設定コスト | 低（既存 Token 編集） | 中（GitHub Secrets 追加 + rotation 設計） |
| 最小権限 | 弱（Workers / D1 / R2 を 1 Token に集約） | 強（R2:Edit のみに限定） |
| 障害影響範囲 | 大（1 Token 失効で全停止） | 小（R2 のみ停止 / Workers / D1 は無影響） |
| Rotation | 全用途同時、停止リスク大 | 用途別に独立 rotation 可能 |
| 漏洩時の被害 | アカウント全リソースへ影響 | R2 のみへ被害局所化 |
| 監査可能性 | 利用元判別困難 | Token 単位でログ追跡可能 |
| Cloudflare 推奨 | - | リソース別 Token が推奨 |
| 採用判定 | 不採用 | **採用** |

## 2. 採用案D の詳細仕様

| 項目 | 値 |
| --- | --- |
| Token 名 | `ubm-hyogo-r2-token`（01b 命名規約 `ubm-hyogo-<resource>-token` に整合） |
| 権限 | Account > **Workers R2 Storage: Edit** のみ |
| Account Resources | 当該 Cloudflare アカウントのみ |
| Zone Resources | 不要（R2 は Zone 非依存） |
| Client IP Filtering | 適用しない（Cloudflare → R2 内部通信のため） |
| TTL | 90 日（rotation 周期） |
| GitHub Secrets キー名 | `CLOUDFLARE_R2_TOKEN`（04 タスクで登録） |
| Cloudflare Secrets | wrangler secret 登録は不要（バインディング経由でアクセスするため） |

## 3. Token の使い道

Workers バインディング `R2_BUCKET` 経由で R2 にアクセスする場合、API Token は**ランタイム不要**（バインディングで認証済み）。

Token が必要となる場面:

1. **CI/CD でのデプロイ時** （`wrangler deploy`）→ 既存 `CLOUDFLARE_API_TOKEN` で十分
2. **CLI からのバケット管理** （`wrangler r2 bucket create / cors put / object put`）→ R2:Edit Token が必要
3. **外部から R2 を管理する Workers / Cron** （UT-16 等）→ R2:Read 程度の限定 Token を別途検討

採用案D の `CLOUDFLARE_R2_TOKEN` は主に **2** の用途で使用する。

## 4. Token Rotation 手順

```
1. Cloudflare Dashboard > My Profile > API Tokens で新規 Token を発行（同名 + 日付サフィックス）
2. 新 Token を GitHub Secrets `CLOUDFLARE_R2_TOKEN` に上書き登録
3. CI を再実行し正常動作を確認
4. 旧 Token を Dashboard で削除
5. rotation 実施日を運用ログに記録
```

> Rotation 中は新旧両 Token が一時並立する期間がある。CI/CD ジョブが旧 Token を参照しないよう、新 Token 登録直後に GitHub Actions の起動中ジョブを確認する。

## 5. Token Rollback 手順

```
1. 何らかの理由で新 Token に問題があった場合、旧 Token を Dashboard で再発行
2. GitHub Secrets を旧 Token に戻す
3. 問題の Token は Dashboard で即時 Revoke
4. Phase 12 implementation-guide の「Token インシデント runbook」に従い影響調査
```

## 6. 機密情報の取扱い

- 実 Token 値は本書・全成果物・コミット履歴に**絶対に書かない**
- 1Password Environments / Cloudflare Secrets / GitHub Secrets のいずれかに保管
- `.env` 等の平文ファイルにコミットしない
- 漏洩疑いがある場合は即時 Revoke + rotation を実施

## 7. AC-3 充足見込み

- 最小権限原則に基づく判断が文書化されている: PASS
- 採用案の根拠（最小権限・rotation 容易性・障害影響範囲）が記載: PASS
- 専用 Token の名称規約・GitHub Secrets キー名が確定: PASS

## 8. 完了条件チェック

- [x] 案A vs 案D の比較表が作成済み
- [x] 採用案D が確定し根拠が記載
- [x] Token 名・スコープ・GitHub Secrets キー名が確定
- [x] Rotation / Rollback 手順が記載
- [x] 機密情報の直書きなし
