# [#245] [UT-06-FU-H-DERIV-01] HEALTH_DB_TOKEN rotation SOP 正式化

## メタ情報

```yaml
issue_number: 245
title: [UT-06-FU-H-DERIV-01] HEALTH_DB_TOKEN rotation SOP 正式化
state: OPEN
priority: 中
scale: 小規模
category: セキュリティ
status: 未実施
created_date: 2026-04-29
updated_date: 2026-04-29
url: https://github.com/daishiman/UBM-Hyogo/issues/245
dependencies: []
```

| 項目 | 内容 |
|------|------|
| 優先度 | 中 |
| 規模 | 小規模 |
| ステータス | 未実施 |

---

## 概要

`apps/api` `/health/db` の `X-Health-Token` 認証で使用する `HEALTH_DB_TOKEN` secret について、生成・保管・投入・**90 日 rotation**・漏洩時即応を独立した SOP として正式化する。UT-06-FU-H operator-runbook §6 / §7.2 を起点に、rotation 期日トラッキング・実施記録テンプレ・2 値受理拡張の future work 判断を加えた governance / operation task として確立する。

## 検出元

- 親タスク: UT-06-FU-H (#121) `apps/api` `/health/db` D1 疎通 endpoint
- 検出 Phase: UT-06-FU-H Phase 12 unassigned-task-detection（FU-H-TOKEN-ROTATION）
- Phase 12 unassigned-task-detection.md の "Formalized Follow-Up" で「**大きな運用課題のため後続 governance / operation task として formalize 必須**」と明記された 1 件

## 仕様書

- `docs/30-workflows/unassigned-task/task-ut-06-fu-h-health-db-token-rotation-sop-001.md`

## 親タスクの実装ガイド / runbook

- `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/ut-06-followup-H-health-db-endpoint/outputs/phase-12/operator-runbook.md` §1 / §2 / §6 / §7.2

## 想定 AC（仕様書 §2.2 から要約）

1. rotation SOP が独立 markdown として存在し、operator-runbook §6 から正本リンク参照される
2. rotation 期日トラッキング方式（GitHub Issue reminder bot / 1Password アラート 等）が決定・記述
3. 漏洩時即応プレイブック（rotation + Workers tail grep + WAF IP block + 関係者通知）が独立 section
4. rotation 実施記録テンプレ（実施日時 / 実施者 / 旧 token 失効確認 / 監視 401 ノイズ確認）
5. 2 値受理拡張（`HEALTH_DB_TOKEN` + `HEALTH_DB_TOKEN_NEXT`）の future work 判断（採用 / 見送り）記述
6. operator-runbook §6 / §7.2 と本タスク成果物の双方向リンク
7. CLAUDE.md「シークレット管理」section との整合確認

## 苦戦箇所（UT-06-FU-H から継承）

1. **token 比較の timing-safe 制約**: Workers では Node の `crypto.timingSafeEqual` 不可。`TextEncoder` + 期待 token 長基準の全 byte XOR + 長さ差分も mismatch に畳み込み実装。2 値受理拡張時も同性質を維持する必要あり
2. **fail-closed 設計**: secret 未設定時は 503 + `Retry-After: 30`（バイパス 200 ではない）。rotation 中 secret 削除→再投入の順は一時的に 503 になることを SOP で明示
3. **error 文字列最小化**: `err.name` のみ返す（`err.message` 不返却）
4. **rotation 中の短時間 mismatch**: 外部監視 SaaS が旧 token で叩く期間（最大数十秒）の 401 を許容するか、2 値受理で完全排除するかの判断が AC-5 で必要
5. **`scripts/cf.sh secret put` 経由**: `wrangler` 直叩き禁止。標準入力規約を SOP に固定
6. **不変条件 #5**: D1 アクセスは `apps/api` に閉じる。`apps/web` 側 secret に触れない

## 着手前提

- UT-06-FU-H 本体 PR のマージ完了（`/health/db` endpoint と operator-runbook が main に存在）
- `HEALTH_DB_TOKEN` の初回投入完了 + production smoke PASS
- 1Password Vault `UBM-Hyogo/cloudflare-api` に item 存在

## 関連タスク

- UT-25 (#40) Cloudflare Secrets 本番配置
- UT-25-DERIV-01 (#242) SA key rotation SOP（同種パターン参考）
- UT-GOV-002-OBS secrets inventory automation
- UT-34 KV secret leak precommit guard

## 優先度

MEDIUM（UT-06-FU-H 本体 deploy 後の運用整備。継続運用を支える基盤だが本番投入そのものは完了済）。
