---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 3
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 3 — 設計（配分表 / 判断フロー / runbook ToC）

本 phase は doc deliverables の **骨格** を設計する。実体の文章は Phase 5（執筆手順）で生成し、最終出力は Phase 11 evidence inventory に集約する。

## 1. 配分表テンプレ（AC-1）

`outputs/phase-11/quota-allocation-table.md`（Phase 11 で実体配置）に下記スキーマで作成する。

| 列 | 例 | 注釈 |
| --- | --- | --- |
| API 名 | Google Forms API | 単一 API でも将来同居に備え列を残す |
| Quota 種別 | per-project / per-user / per-method | 律速判定に必須 |
| 上限値 | 500 / 100s / project | Google 公開値 |
| 同期側設計上限 | cron `*/5 * * * *` × batch 100 / 100s ≒ N req | 算出根拠を併記 |
| 余裕率 | 設計上限 ÷ 上限値 ≤ 70% | AC-1 数値ゲート |
| 想定他用途消費量 | 現状 0（Forms API 単独） | 将来同居時に追記 |

### 余裕率算出（暫定例 — 実値は Phase 11 で確定）

- 5 分 cron は 1 hour に 12 回。1 回あたり Forms API `responses.list` を最大 N ページ取得。
- batch 100 で `responses.list` を 1 回呼ぶ前提で **per-100s** 上限 500 に対し設計上限を ≪ 70% に保つ。
- 15 分 cron / 18:00 日次は補助で、`*/5` cron 上限に対しオーバーラップしない時間帯設計。
- 詳細計算は `outputs/phase-11/manual-smoke-log.md` に walkthrough を残す。

## 2. SA JSON 分離判断フローチャート（AC-2）

`outputs/phase-11/sa-separation-policy.md` に下記判断軸を表＋フローで残す。

| 判断軸 | 「分離する（同期専用 SA）」を選ぶ条件 | 「scope 追加で済ます」を選ぶ条件 |
| --- | --- | --- |
| rotation 単位 | 漏洩時に他用途を巻き込みたくない | 他用途と rotation 周期が同じ |
| 監査単位 | 操作主体を明確に分離したい | 監査ログで識別が要らない |
| 最小権限 | 別 scope を厳格に絞りたい | 既存 scope に readonly 1 個追加で足りる |

現状（Forms API 単独 / 1 SA）の判定:

- 漏洩時の影響範囲は同期ジョブのみ → rotation 影響範囲は限定的。
- 監査単位は Cloudflare Workers 単一 caller → SA 分離による識別性 gain は限定的。
- ただし将来 Drive API watch / Calendar API 同居発生時は「同居の検知をもって SA 分離」を **trigger 化**する（Phase 8 リスク欄に記載）。

## 3. 別 project 切替 trigger 表（AC-3）

`outputs/phase-11/project-switch-trigger.md` に固定する条件:

| trigger | 計測手段 | 判定基準 |
| --- | --- | --- |
| quota 使用率 70% を 2 週連続超過 | Cloudflare logs + `QUOTA` metric カウント | 週次集計で 14 日連続 ≥ 70% |
| 監査境界分離の要件化 | governance / 法務要件 | 要件が明文化された時点で即時 |
| billing 分離の要件化 | 経理要件 | 要件が明文化された時点で即時 |

切替時の必須手順:

1. 新 GCP project 作成 → Forms API 有効化 → SA 再発行。
2. 新 SA を対象 Form の **共有先（閲覧者）** に追加（Google Form は Sheet と異なり SA-as-viewer の概念なし、代わりに Form 所有者の OAuth 同意 + Workspace 設定が必要 — 切替時 runbook で再検証）。
3. Cloudflare Secret `GOOGLE_SERVICE_ACCOUNT_JSON` を `bash scripts/cf.sh secret put` で再投入。
4. dry-run 後、cron を新 project SA に切替。

## 4. ops runbook ToC（AC-4）

`outputs/phase-11/ops-runbook.md` の目次:

1. 対象 API / Form ID / scope
2. SA メール記載欄（op 参照のみ）
3. Cloudflare Secrets キー名一覧（実値禁止）
4. Cron 構成（現状）
5. 配分余裕率の運用閾値（70%）
6. 別 project 切替 trigger（Phase 3-§3 参照）
7. 漏洩時の rotation 手順（`bash scripts/cf.sh secret put`）
8. 障害時の調査クエリ（Cloudflare logs / `QUOTA` 分類）

## 5. 実値非混入 grep gate 設計（AC-5）

`outputs/phase-11/secret-grep-log.md` に下記コマンド結果（0 件）を記録する。

```bash
grep -rE '(AIza|ya29\.|sk-[A-Za-z0-9]|-----BEGIN PRIVATE KEY-----)' docs/30-workflows/issue-265-forms-api-quota-sa-governance/
grep -rE '"private_key"|"client_email"\s*:\s*"[^o]' docs/30-workflows/issue-265-forms-api-quota-sa-governance/
```

期待: 両コマンド 0 件 / op 参照と Secrets キー名のみ。
