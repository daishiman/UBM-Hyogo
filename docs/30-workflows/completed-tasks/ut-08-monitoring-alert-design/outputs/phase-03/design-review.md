# UT-08 Phase 3: 設計レビュー (AC-9)

| 項目 | 値 |
| --- | --- |
| 対応 AC | AC-9 |
| レビュー日 | 2026-04-27 |
| 担当 | delivery |
| レビュー対象 | Phase 2 全 9 ドキュメント |
| 判定基準 | CRITICAL=0 かつ MAJOR=0、全 AC 観点 PASS、05a 整合性 PASS |

Phase 2 で作成した 9 ドキュメントを 6 観点で多角的レビューし、Wave 2 実装タスク引き渡し前の設計欠陥・無料枠リスク・Secret 漏洩リスク・アラート疲れリスク・05a 整合性を検証する。

---

## 1. 重大度サマリ

| 区分 | 件数 | 内訳 |
| --- | --- | --- |
| CRITICAL | 0 | なし |
| MAJOR | 0 | なし |
| MINOR | 3 | M-01, M-02, M-03（後述、Phase 4 並行修正可） |
| PASS | 26 | 主要観点 |

**最終判定: GO（条件付き）**

CRITICAL = 0、MAJOR = 0 のため次 Phase 4 に進む。MINOR 3 件は Phase 4 着手と並行して修正する。

---

## 2. 観点 1: AC 充足レビュー

| AC | レビュー対象 | 確認内容 | 判定 | コメント |
| --- | --- | --- | --- | --- |
| AC-1 | metric-catalog.md | Workers / Pages / D1 / Cron 網羅 | PASS | 4 カテゴリ全て掲載、自動化区分 / 取得元別サマリあり |
| AC-2 | alert-threshold-matrix.md | WARNING/CRITICAL + 根拠 | PASS | 12 メトリクス × 2 段階、根拠（無料枠 / SLA / アラート疲れ抑止）明記 |
| AC-3 | notification-design.md | メール / Slack 比較 + Secret 取扱 | PASS | 比較表、ペイロード仕様、ローテーション方針あり |
| AC-4 | external-monitor-evaluation.md | 複数候補比較 | PASS | 6 候補比較表、採用 / サブ / 棄却の判定明記 |
| AC-5 | wae-instrumentation-plan.md | イベント名 / フィールド / sampling | PASS | 6 イベント、blob/double/index 詳細、サンプリング切替条件あり |
| AC-6 | runbook-diff-plan.md | 05a 上書き禁止明記 | PASS | §1 で上書き禁止項目、追記範囲を分離記述 |
| AC-7 | failure-detection-rules.md | D1 失敗 + 同期失敗双方 | PASS | 10 ルール、評価窓 / severity / 通知先記載 |
| AC-8 | monitoring-design.md | 7 ドキュメントへのリンク | PASS | §2 AC 対応表で 8 ドキュメント全リンク確認 |
| AC-11 | secret-additions.md | 1Password Environments 管理 | PASS | 7 Secret/Variable、1Password 起点、ローテーション手順あり |

---

## 3. 観点 2: 05a 整合性レビュー

| レビュー項目 | 確認内容 | 判定 | コメント |
| --- | --- | --- | --- |
| 上書き禁止遵守 | runbook-diff-plan.md が 05a を変更しない方針か | PASS | §1 上書き禁止項目を明文化。追記は別ファイルに集約 |
| 責務境界の明確化 | 自動化昇格 / 手動据え置きが明示か | PASS | metric-catalog.md §1〜5 で「自動化区分」列、monitoring-design.md §4 で責務境界の最終結論 |
| リンク整合性 | 05a 成果物への相対リンク解決 | MINOR (M-01) | 上流 05a の `outputs/phase-02/` 直下のファイル名（observability-matrix.md / cost-guardrail-runbook.md）を参照しているが、05a 側で実ファイル未配置の場合リンクが解決しない。Phase 11 link-checklist で再確認 |
| 二重管理の回避 | 同一メトリクスの別定義回避 | PASS | metric-catalog.md §7 で 05a との対応関係を明示、05a の定義を上書きしない記述 |

---

## 4. 観点 3: 無料枠遵守レビュー

| レビュー項目 | 確認内容 | 判定 | コメント |
| --- | --- | --- | --- |
| WAE 書込上限 | sampling が無料枠超過しないか | PASS（条件付き） | 初期 100% / 超過時 10% の切替条件明記。data points 上限の正確値は MINOR (M-02) |
| WAE 保存期間 | 公式確認値前提か | MINOR (M-02) | 「公式再確認」「2026-04 時点の推測値」と明記しているが、Wave 2 実装直前に公式値で更新必須 |
| Cloudflare Analytics クエリ回数 | SQL 上限考慮 | PASS | Cron 1min 起動でも月 43,200 回、無料枠許容範囲（公式に明示の上限なし、合理的） |
| UptimeRobot monitor 数 | 50 上限内か | PASS | 4 monitor で着手、十分な余裕 |
| D1 クエリ無料枠 | 監視自体が消費しない設計か | PASS | アラートワーカーは KV を使い D1 直アクセスせず |
| 有料 SaaS 不採用 | 暗黙的依存なし | PASS | external-monitor-evaluation.md で有料候補を明示棄却 |

---

## 5. 観点 4: 責務境界レビュー

| レビュー項目 | 確認内容 | 判定 | コメント |
| --- | --- | --- | --- |
| UT-07 連携の任意性 | UT-07 未完成でも UT-08 成立 | PASS | notification-design.md で Webhook URL を Secret 直接保持する MVP 構成 |
| UT-09 連携 | Sheets→D1 同期失敗ルールの整合 | PASS | failure-detection-rules.md §3 で UT-09 完了後の再確認を明示 |
| Wave 2 実装委譲 | 計装コード未含 | PASS | 全成果物が設計のみ。`apps/` 配下にコード変更なし |
| apps/api / apps/web 境界 | apps/web から D1 直アクセス誘発しない | PASS | WAE 計装は apps/api のみ。apps/web は Pages Analytics のみ |

---

## 6. 観点 5: アラート疲れ抑止レビュー

| レビュー項目 | 確認内容 | 判定 | コメント |
| --- | --- | --- | --- |
| 初期 WARNING 中心 | 閾値マトリクスが WARNING 推奨 | PASS | alert-threshold-matrix.md §1 運用フェーズ別方針で明示 |
| CRITICAL 段階導入 | 実績ベース導入を明示 | PASS | §6 CRITICAL 段階導入チェックリスト記載 |
| 閾値の根拠 | 無料枠 / SLA / アラート疲れ抑止のいずれか付記 | PASS | §3 で根拠分類を整理 |
| 通知集約 | rate limiting 戦略 | PASS | §4 で重複抑制 / グループ通知 / 夜間抑制を記述 |
| 失敗検知の連続条件 | 単発で CRITICAL 発報しない | PASS | failure-detection-rules.md で連続条件 / 件数閾値明示 |

---

## 7. 観点 6: Secret 管理レビュー

| レビュー項目 | 確認内容 | 判定 | コメント |
| --- | --- | --- | --- |
| 1Password Environments 管理 | 全 Secret が 1Password 起点 | PASS | secret-additions.md §2 で構造を明示 |
| ハードコード禁止 | 設計内に実値が含まれない | PASS | プレースホルダのみ、実値なし |
| `wrangler secret put` 手順 | 配置手順記述 | PASS | §3 で 1Password CLI + wrangler の組合せ手順あり |
| .env コミット防止 | `.dev.vars` `.gitignore` 前提 | MINOR (M-03) | secret-additions.md §5 に「`.gitignore` 済」と記述あるが、実ファイル確認は Phase 11 link-checklist で確認するのが望ましい |
| Secret ローテーション | 失効時の差替手順 | PASS | §6 ローテーション、runbook-diff-plan.md §3.2 連携 |

---

## 8. MINOR 指摘事項一覧

| ID | 重大度 | 内容 | 解消方針 | 解消 Phase |
| --- | --- | --- | --- | --- |
| M-01 | MINOR | 05a 成果物 `outputs/phase-02/observability-matrix.md` / `cost-guardrail-runbook.md` の実在を Phase 11 で確認する必要がある | Phase 11 link-checklist で 05a 側のファイル存在確認、欠落時は 05a 側のタスクに引き渡し | Phase 11 |
| M-02 | MINOR | WAE 無料枠の保存期間 / data points 上限の正確値が「2026-04 時点の推測値」のまま | Wave 2 実装直前に公式 https://developers.cloudflare.com/analytics/analytics-engine/ で再確認、wae-instrumentation-plan.md §1 を更新 | Phase 4 / Wave 2 着手前 |
| M-03 | MINOR | `apps/api/.dev.vars` 相当ファイルの `.gitignore` 記載を Phase 11 で実機確認 | Phase 11 link-checklist で `git check-ignore` を実行し ignore されることを確認 | Phase 11 |

いずれも MAJOR/CRITICAL ではなく、Phase 4 着手 / Wave 2 引き渡し前の補修で十分対応可能。

---

## 9. 代替案棄却の確認

| 代替案 | 棄却理由 | 確認 |
| --- | --- | --- |
| 有料 APM (Datadog / NewRelic) | 不変条件 2 違反 | [x] |
| Sentry 有料プラン | 不変条件 2 違反 | [x] |
| 自前監視サーバー構築 | 運用コスト過大 | [x] |
| Cloudflare Health Checks (Pro) | 無料プラン外 | [x] |
| Workers Analytics をスキップし外部監視のみ | 内部失敗検知不可 | [x] |

monitoring-design.md §7 と external-monitor-evaluation.md §5 で記述を確認。

---

## 10. GO / NO-GO 判定

| 判定 | 条件 | 結果 |
| --- | --- | --- |
| GO | CRITICAL=0 かつ MAJOR=0、全 AC 観点 PASS、05a 整合性 PASS | **該当（GO）** |
| 条件付き GO | MAJOR=0、MINOR ≤ 3 で Phase 4 並行修正可 | （該当） |
| NO-GO | CRITICAL ≥ 1 または MAJOR ≥ 1 残存 | 非該当 |

### 最終判定: **GO（MINOR 3 件を Phase 4 と並行で修正）**

根拠:

1. AC-1〜AC-8・AC-11 の 9 観点すべて PASS（Phase 2 成果物が AC を充足）
2. 05a 整合性は M-01（リンク確認）以外 PASS、不変条件 1（上書き禁止）遵守
3. 無料枠遵守は M-02（WAE 仕様再確認）以外 PASS、不変条件 2 遵守
4. 責務境界・アラート疲れ抑止・Secret 管理の 3 観点すべて PASS（M-03 は Phase 11 での実機確認のみ）
5. 代替案棄却を全件確認、不変条件 5（実装委譲）も遵守

---

## 11. Phase 4 への引き継ぎ事項

| 事項 | 詳細 |
| --- | --- |
| MINOR 修正残 | M-01（Phase 11）, M-02（Wave 2 着手前）, M-03（Phase 11） |
| 追加検証項目 | WAE data points 月次累計のシミュレーション（想定 RPS から逆算）、UptimeRobot monitor 設定の事前検証手順 |
| ドキュメント未確定事項 | UT-09 完了後の Cron 間隔、UT-13 完了後の `auth.fail` 採否 |
| Phase 4 で必要な事前確認 | Cloudflare Analytics GraphQL API の認証方法（Service Token 発行手順） |

---

## 12. 完了条件チェック

- [x] 全レビュー項目（観点 1〜6）が PASS / MINOR / MAJOR / CRITICAL のいずれかで判定済み
- [x] CRITICAL = 0 かつ MAJOR = 0 を達成
- [x] 代替案棄却の確認が全てチェック済み
- [x] GO / NO-GO 判定が根拠付きで記録（GO）
- [x] MINOR 残（3 件）を Phase 4 への引き継ぎ事項に明記
- [x] `outputs/phase-03/design-review.md`（本書）が作成されている
