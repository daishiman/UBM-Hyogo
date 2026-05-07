# Phase 10: 最終レビュー — issue-520-slack-incidents-channel-webhook-provisioning

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 10 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 11（実 channel 作成 / 実 webhook 発行 / 実 secret 投入 / 実 smoke 発火）着手前の **Go/No-Go 最終判定** を行う。本タスクは Slack workspace への不可逆 SaaS 副作用と、3 系統の secret 配置先（1Password / Cloudflare / GitHub）への redaction-safe 投入を伴うため、システム系 / 戦略・価値系 / 問題解決系の 3 系統レビューと、G1〜G4 multi-stage approval gate の linearity、aiworkflow-requirements skill 反映、issue-495 spec との責務境界を最終確認する。

## 入力

- Phase 1 確定 AC-1〜AC-8 / G1〜G4 / 自走禁止 / 用語集
- Phase 2 設計 / Phase 3 設計レビュー（GO 判定）
- Phase 4 テスト戦略 / Phase 5 実装ランブック / Phase 6 異常系 / Phase 7 AC マトリクス
- Phase 8 DRY 検査結果（PASS / FORWARD のみ）
- Phase 9 品質保証結果（5 点 PASS evidence path / CI gate 影響評価）

## レビュー観点（3 系統）

### システム系（SYS）

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| SYS-01 | secret hygiene（webhook URL 実値の非露出） | webhook URL B-id/token fragment、Slack workspace token、workspace id pattern が、本タスク全成果物（仕様書 phase-01〜13.md / outputs/phase-NN/* / runbook / `.env.example` / test fixture / evidence log / PR body）にいかなる形でも残らない |
| SYS-02 | redaction gate 三重化 | (a) `smoke-observability.test.ts` の redaction-safe assertion / (b) `scripts/redaction-grep.sh`（または同等 rg 一式）/ (c) PR body 確認 の 3 経路すべてが Phase 11 G4 / Phase 13 で実行される |
| SYS-03 | `.env` 平文混入なし | `.env.example` は op:// 参照のみ、実 `.env` には実値を一切書かない運用が runbook に明記され、本タスク中で `.env` 実体を編集するフローが存在しない |
| SYS-04 | 不変条件カバレッジ | INV #14（Cloudflare 無料枠維持）/ INV #16（secret values never documented）/ INV #17（incident response readiness）/ webhook 実値非露出 INV / env-isolation INV が phase-01〜09 を通じて維持 |
| SYS-05 | issue-495 spec との責務境界 | 本タスクは `apps/api/src/routes/admin/smoke-observability.ts` の route 本体実装を編集せず、test の redaction 追記のみに留めている。issue-495 の production 分岐実装範囲を侵食していない |

### 戦略・価値系（STR）

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| STR-01 | webhook 共有方針（案 A）の妥当性最終確認 | staging / production 同一 webhook URL 共有 + prefix 識別の trade-off（管理コスト最小 vs 漏洩時影響範囲）が Phase 2 / 3 で記録され、漏洩時の rotate runbook が用意されている |
| STR-02 | channel 命名 `ubm-hyogo-incidents` の名空間 | 将来の incident 通知拡張（Sentry alert / PagerDuty / 運用 alert）と衝突しない命名で、SSOT が `observability-monitoring.md` に集約 |
| STR-03 | aiworkflow-requirements skill 反映 | `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` / `deployment-secrets-management.md` への channel 名 / secret 命名 / op:// 規約反映が Phase 12 で確定し、必要時 `indexes/keywords.json` / topic-map / resource-map / quick-reference の indexes 更新も予約済み |
| STR-04 | 1 サイクル完遂性（CONST_007） | Phase 11 G1〜G4 が後続実装プロンプト 1 サイクル内で完了可能。将来 PR / バックログ送りが発生しない |
| STR-05 | issue-495 unblock 効果 | 本タスク完了で issue-495-09b-A-sentry-slack-runtime-smoke-prod-extension Phase 11 runtime smoke が即発火可能になり、09c production deploy readiness の observability gate が解消される |

### 問題解決系（PRB）

| R-ID | 観点 | 判定基準 |
| --- | --- | --- |
| PRB-01 | webhook URL 漏洩事故対応 | runbook に rotate 手順（Slack admin で webhook 再発行 → 1Password 更新 → `cf.sh secret put` 上書き → `gh secret set` 上書き → 旧 webhook 無効化確認）が完備 |
| PRB-02 | channel archive / delete 事故対応 | runbook に「`#ubm-hyogo-incidents` の archive / delete 禁止」明示と、idempotent 再作成手順、admin 操作前の G1 通過記録要求 |
| PRB-03 | env 識別ミス | `[STAGING SMOKE]` / `[PRODUCTION SMOKE]` prefix が Phase 11 G3 / G4 で必ず確認され、prefix mismatch 時に production への進行を阻止 |
| PRB-04 | secret 同期ずれ | 1Password ↔ Cloudflare staging / production ↔ GitHub の同期チェックリストが runbook に存在し、`cf.sh secret list` / `gh secret list` の name-only 確認が AC-3 / AC-4 evidence として配置 |
| PRB-05 | 不可逆 SaaS 自走防止 | 自走禁止 8 項目（実 channel 作成 / 実 webhook 発行 / 1Password 投入 / `cf.sh secret put` 発火 / `gh secret set` 発火 / 実 smoke POST / commit / push / PR / `wrangler` 直接実行）が phase-01 で明文化、Phase 11 で G1〜G4 の user approval を経て発火 |

## G1〜G4 ゲートの最終再確認

| gate | 不可逆操作 | 前提（前段 gate 通過） | 通過記録 path |
| --- | --- | --- | --- |
| G1 | Slack channel 作成 + incoming webhook 発行 | Phase 10 GO 判定 | `outputs/phase-11/channel-provisioning-log.md` G1 セクション |
| G2 | 1Password item 投入 + Cloudflare staging secret 配置 | G1 通過 | `outputs/phase-11/channel-provisioning-log.md` G2 セクション |
| G3 | Cloudflare production secret 配置 + production smoke 着手 | G2 通過 + staging smoke PASS | `outputs/phase-11/webhook-smoke-log.md` G3 セクション |
| G4 | production smoke PASS + redaction grep gate PASS + evidence 確定保存 | G3 通過 + production prefix 着弾確認 | `outputs/phase-11/webhook-smoke-log.md` G4 セクション |

linearity（G1 → G2 → G3 → G4）が崩れた場合は即 Phase 10 へ戻し、user approval を再取得する。

## セキュリティチェック（実値非露出の最終確認）

| 対象 | 確認方法 | 期待 |
| --- | --- | --- |
| 仕様書 phase-01〜13.md | `rg` 3 pattern | 0 hit |
| outputs/phase-NN/main.md / 各サブ output | `rg` 3 pattern | 0 hit |
| runbook（`docs/30-workflows/runbooks/slack-incidents-channel-provisioning.md`） | `rg` 3 pattern | 0 hit |
| `.env.example` | 内容目視 | op:// プレースホルダーのみ |
| `apps/api/src/routes/admin/smoke-observability.test.ts` fixture | 内容目視 + `rg` | canonical host は分割結合のみ。連続 webhook URL literal なし |
| evidence log（typecheck / lint / test / build / grep-gate） | 内容目視 | 結果サマリのみ。実値出力なし |
| PR body（Phase 13） | 作成前に `rg` | 0 hit |
| workspace id fragment（`w[0-9]{10}-ek[0-9]{10}` pattern） | `rg "w[0-9]{10}-ek[0-9]{10}"` | 0 hit |

## aiworkflow-requirements skill 反映確認

| reference | 反映内容 | 確認 |
| --- | --- | --- |
| `references/observability-monitoring.md` | channel 名 `ubm-hyogo-incidents` / env-aware Slack prefix 規約の追記 | Phase 12 で diff 反映 |
| `references/deployment-secrets-management.md` | `SLACK_WEBHOOK_INCIDENT` 命名 / `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` 規約の追記 | Phase 12 で diff 反映 |
| `indexes/keywords.json` | 必要時のみ trigger キーワード追加（`incident channel` / `slack incoming webhook` 等） | Phase 12 で必要性判断 |
| `indexes/topic-map.json` / `resource-map.json` / `quick-reference.json` | references 編集時は `pnpm indexes:rebuild` で再生成 | Phase 12 で実行 |
| CI gate `verify-indexes-up-to-date` | indexes drift なし | Phase 9 Q-15 で確認 |

## issue-495 spec との境界 最終確認

| 観点 | issue-495 spec | issue-520 spec（本タスク） |
| --- | --- | --- |
| route 本体実装 | 担当 | **触れない** |
| Slack channel / webhook 入手 | 前提（scope out） | 担当 |
| 1Password item 投入 | path 規約は共有 | 実 webhook URL 投入を担当 |
| Cloudflare secret 配置 | DSN / token / webhook 全体の runbook | 本タスクでは `SLACK_WEBHOOK_INCIDENT` の staging+production 投入を担当 |
| GitHub Actions secret | scope out | 担当 |
| smoke 着弾 | route 単体 AC | webhook 経路 AC-5 / AC-6 |

責務境界に重複・空白なし。route コードに本タスクの責務（channel 名 literal / webhook URL 等）を持ち込んでいない。

## Go/No-Go 判定

| 結論 | 条件 |
| --- | --- |
| **GO** | SYS-01〜SYS-05 / STR-01〜STR-05 / PRB-01〜PRB-05 全 PASS、Phase 9 の Q-01〜Q-06 / Q-11〜Q-15 全 PASS、Phase 8 DRY が PASS / FORWARD のみ、G1 着手条件（user approval 取得 path 確定 / runbook 完備）整備済 |
| **NO-GO** | SYS-01 / SYS-02 / SYS-05 / PRB-01 / PRB-03 / PRB-05 のいずれかが FIX-NEEDED |
| **DEFER** | STR-03（aiworkflow-requirements 反映）が Phase 12 で吸収予定の場合のみ |

## DoD（最終）

- [ ] AC-1〜AC-8 すべてに対し evidence path / test ID / G1〜G4 紐付けが確立
- [ ] 5 点 PASS セット（typecheck / lint / test / build / grep-gate）の evidence path が確定
- [ ] redaction grep gate 0 hit（本タスク全成果物）
- [ ] G1〜G4 全承認準備完了（linearity 維持）
- [ ] aiworkflow-requirements references 反映準備完了（Phase 12）
- [ ] issue-495 spec との責務境界に侵食なし
- [ ] webhook URL 実値 / token / workspace id fragment が一切露出していない
- [ ] Phase 11 G1 着手条件（user approval 取得 path / runbook / 1Password / `cf.sh` / `gh` ラッパー所在）整備

## 検証コマンド

```bash
# 本タスク全成果物への redaction 最終 grep
! rg -n 'hooks\.slack\.com/services/[A-Z0-9]|B[0-9A-Z]{8,}/[0-9A-Za-z]{16,}|xox[bp]-|w[0-9]{10}-ek[0-9]{10}' \
    docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/

# Phase 10 output に必須セクション
grep -q "SYS-\|STR-\|PRB-" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-10/main.md
grep -q "GO\|NO-GO" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-10/main.md
grep -q "G1\|G4" docs/30-workflows/issue-520-slack-incidents-channel-webhook-provisioning/outputs/phase-10/main.md
```

## 成果物

- `outputs/phase-10/main.md`（SYS / STR / PRB 各観点の判定表 / Go/No-Go 結論 / G1 着手条件 / セキュリティチェック / aiworkflow-requirements 反映予約）

## 完了条件

- [ ] SYS-01〜SYS-05 / STR-01〜STR-05 / PRB-01〜PRB-05 すべてに判定が記録
- [ ] Go の場合は G1 取得条件（user approval 経路 / runbook / 1Password 投入準備 / `cf.sh` / `gh` ラッパー所在）が明示
- [ ] No-Go の場合は戻り先と修正項目を明示
- [ ] DEFER の場合は対象観点と Phase 12 吸収方針を明示
- [ ] redaction grep gate 0 hit

## 次 Phase への引き渡し

Phase 11 へ: Go/No-Go 結果 / G1 着手条件 / 5 点 PASS evidence path テンプレ / runbook / aiworkflow-requirements 反映予約 / issue-495 unblock 条件。

## 実行タスク

- 本 Phase の確定事項を対応する outputs/phase-* 成果物へ反映する。

## 参照資料

- 本 workflow の前段 Phase。
- task-specification-creator / aiworkflow-requirements の該当 reference。

## 完了条件

- 必須成果物が存在し、runtime pending と static PASS の境界が明記されている。

## 統合テスト連携

- ローカル静的検証は focused test / validator / redaction grep で行い、実 Slack / secret / smoke は user approval 後の Phase 11 runtime wave で実行する。
