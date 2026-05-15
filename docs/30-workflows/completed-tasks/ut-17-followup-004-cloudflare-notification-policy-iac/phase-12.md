# Phase 12: 正本同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化 + drift 検知 (ut-17-followup-004) |
| 作成日 | 2026-05-14 |
| 担当 | delivery |
| 状態 | completed |
| GitHub Issue | #636（CLOSED — Refs として参照、本 PR でも close しない） |
| タスク種別 | improvement / infrastructure / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は local implementation complete の正本同期 Phase。`infra/cloudflare-alerts/` + `scripts/cf.sh alerts` + CI drift gate + runbook 切替は実コードとして存在する。Cloudflare mutation・GitHub Secret 配置・commit/push/PR は user-gated operation として Phase 13 以降に分離する。 |

---

## 目的

Phase 1〜11 で実装した Cloudflare Notification Policy IaC 化（`infra/cloudflare-alerts/`）と drift 検知運用（`scripts/cf.sh alerts diff` + CI workflow）の仕様を、システム仕様書群（aiworkflow-requirements skill）へ `implementation_complete / implementation / NON_VISUAL / runtime Cloudflare mutation pending_user_approval` として登録する。
本 Phase は **strict 7 outputs**（task-specification-creator skill `references/phase-12-spec.md` 準拠）を `outputs/phase-12/` 配下に全て出力する。

---

## なぜ正本同期が必要か（中学生レベル）

「家のブレーカー警報を IoT で自動監視できるようにした」だけでは、次の月の自分や別の家族が「警報が止まったらどうやって直すんだっけ？」と毎回迷ってしまう。

Phase 12 では「**新しい監視装置の取扱説明書を、これまでの取扱説明書と差し替える作業**」を行う。

- 玄関の壁（CLAUDE.md「Cloudflare 系 CLI 実行ルール」）に「`scripts/cf.sh alerts diff` でいつでも設定ズレを検査できる」と追記
- 月次点検カード（monthly healthcheck runbook）から「ブレーカーの目視確認」の項目を消し、「装置に diff コマンドを 1 回打つ」に書き換える
- 親システム（UT-17 親 implementation-guide Part 5）の「外部操作残」欄に「IaC 化された経路はこちら」のリンクを足す
- skill インデックス（aiworkflow-requirements）に「Cloudflare alerts IaC」「drift gate」のキーワードを足し、将来 AI が探しやすくする

これをスキップすると、3 ヶ月後に「`scripts/cf.sh alerts diff` を打って良いんだっけ？」「Dashboard を直接いじっても良いんだっけ？」が分からなくなり、最悪「Dashboard で policy を消した結果、無料枠超過に気付けず課金」が起きる。

---

## strict 7 outputs（必須）

| # | output | 必須 | 出力先 |
| --- | --- | --- | --- |
| 1 | main.md | ✅ | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | ✅ | `outputs/phase-12/implementation-guide.md` |
| 3 | phase12-task-spec-compliance-check.md | ✅ | `outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 4 | system-spec-update-summary.md | ✅ | `outputs/phase-12/system-spec-update-summary.md` |
| 5 | skill-feedback-report.md | ✅ | `outputs/phase-12/skill-feedback-report.md` |
| 6 | unassigned-task-detection.md | ✅ | `outputs/phase-12/unassigned-task-detection.md` |
| 7 | documentation-changelog.md | ✅ | `outputs/phase-12/documentation-changelog.md` |

> compliance check は task-specification-creator の `phase12-compliance-check-template.md` が定める英語 9 headings を使用する。

---

## 12-1. main.md（サマリ）

`outputs/phase-12/main.md` の必須セクション:

1. **本タスクの仕様サマリ**: 4 categories / 5 policy files + 1 webhook destination を `infra/cloudflare-alerts/` で宣言し、`scripts/cf.sh alerts {apply,diff,list}` で冪等適用 + drift 検知する計画を固定
2. **strict 7 outputs 一覧**: 上表をリンク化して再掲
3. **正本同期対象 5 件**:
   - aiworkflow-requirements skill（indexes / task-workflow-active / LOGS）
   - 本 workflow root の root/output artifacts parity
   - Phase 12 strict 7 outputs
   - 後続実装時に更新する UT-17 親 implementation-guide / monthly runbook / CLAUDE.md の参照先
4. **次 Phase（Phase 13）へのバトン**: PR 本文 Summary / Evidence の元データ参照先

---

## 12-2. implementation-guide.md（実装後の運用ガイド）

### Part 1 — 中学生レベル概念説明

| 概念 | 家の例え |
| --- | --- |
| Notification Policy | 「電気使用量が 80% 行ったら教えて」という事前設定 |
| webhook destination | 「教えて」の送り先（家族 LINE グループの投稿用 URL） |
| IaC（宣言ファイル） | 「家中の警報装置の設定を 1 冊のノートにまとめた取扱説明書」 |
| `scripts/cf.sh alerts apply` | ノート通りに装置を組み直す「再セットアップボタン」 |
| `scripts/cf.sh alerts diff` | ノートと現在の装置設定がズレてないか「答え合わせするボタン」 |
| drift（ドリフト） | 誰かがノートを見ずに装置をいじって設定が変わってしまった状態 |
| CI drift gate | 毎日 / 毎 PR でノートと装置が一致しているかを GitHub が自動で確認する装置 |
| 専用 API Token | 「警報装置の設定を変えるための鍵」。家の他の鍵（デプロイ用）と分けて持つ |
| 1Password 経由 | 鍵は金庫に入れて取り出すときだけ使う運用 |

#### 必須セクション

1. なぜ Cloudflare Notification Policy を IaC 化する必要があったか（手動設定の audit log がリポジトリ側に残らない問題）
2. なぜ専用 API Token を分けたか（deploy 失敗時の切り分け容易性 + 権限最小化）
3. なぜ webhook destination を name で参照するか（環境再構築時に ID が変わるため、ID 直書きは禁止）
4. なぜ閾値は `quota-base * 0.8` の computed 値で生成するか（Cloudflare 公式 free tier 改定への追従）
5. drift が出たら何をするか（runbook の手順を読む）
6. なぜ CI 上では read-only token を別途使うか（CI compromise 時の apply 権限流出を防ぐ）

### Part 2 — 技術者レベル詳細

#### 必須セクション

1. **アーキテクチャ**:
   - `infra/cloudflare-alerts/policies/*.json` ← 1 policy = 1 ファイル（Workers Requests / D1 Read / D1 Write / Pages Build / R2 Class A の 4〜5 件）
   - `infra/cloudflare-alerts/webhooks/*.json` ← webhook destination 1 件（UT-17 relay endpoint 向け）
   - `infra/cloudflare-alerts/quota-base.json` ← 無料枠 base 値 SSOT
   - `scripts/cf.sh alerts {apply,diff,list}` ← Cloudflare API v4 `accounts/:account_id/alerting/v3/{policies,destinations/webhooks}` を叩く
   - `.github/workflows/cloudflare-alerts-drift.yml` ← read-only token で `alerts diff --ci` を schedule + PR 時に実行

2. **`scripts/cf.sh alerts apply` 仕様**:
   - 順序: webhook destination 作成（既存名 → PUT / 無 → POST、ID 取得） → 各 policy で `mechanisms.webhooks[].id` を destination 名から resolve → policy 作成（既存名 → PUT / 無 → POST）
   - 冪等性: 2 回連続実行で `alerts diff` が exit 0
   - 失敗時: 1 件目で失敗したら以降を skip し non-zero exit

3. **`scripts/cf.sh alerts diff` 仕様**:
   - `GET /alerting/v3/policies` + `GET /alerting/v3/destinations/webhooks` の結果と repo 定義を JSON 正規化して unified diff
   - 正規化: destination ID → name 置換 / `created` `modified` `id` フィールド除外 / key sort
   - 差分あり → exit 1 + 標準出力に diff
   - 差分なし → exit 0 + "no drift" 出力

4. **`scripts/cf.sh alerts list --normalize` 仕様**:
   - read-only `GET` のみ
   - 正規化済み JSON を stdout 出力（evidence canonical path に redirect 可）

5. **token scope 分離（CONST_007 観点で先送り禁止）**:

   | 用途 | scope | 保管先 | `.env` 参照 |
   | --- | --- | --- | --- |
   | apply（書込み） | `Account.Notifications:Edit` | 1Password `UBM-Hyogo Alerts Apply Token` | `op://Vault/UBM-Hyogo Alerts Apply Token/credential` |
   | diff（read-only / CI） | `Account.Notifications:Read` | GitHub Secrets `CLOUDFLARE_ALERTS_TOKEN_READ` | CI 環境変数（`op run` skip） |
   | deploy（既存） | Workers / Pages / D1 / R2 deploy | 1Password `CLOUDFLARE_API_TOKEN`（既存） | 既存路線維持 |

6. **閾値の computed 値生成**:
   - `infra/cloudflare-alerts/quota-base.json` に `{ "workers_requests_per_day": 100000, "d1_read_per_day": 5000000, ... }` を SSOT として置く
   - `scripts/cf.sh alerts apply` が apply 時に `threshold = quotaBase * 0.8` で計算して送信
   - monthly healthcheck runbook に「Cloudflare 公式 free tier 値の差分確認」を 1 行追加

7. **CI drift gate 仕様**:
   - workflow: `.github/workflows/cloudflare-alerts-drift.yml`
   - 発火: `schedule`（毎日 1 回）+ `pull_request` で `infra/cloudflare-alerts/**` `scripts/cf.sh` に差分があったとき
   - job: `bash scripts/cf.sh alerts diff --ci`
   - failure: exit 1 で job fail、Slack 通知は UT-17 relay 経由（任意 / 将来拡張）
   - secret: `CLOUDFLARE_ALERTS_TOKEN_READ`（read-only）のみ

8. **rotation 手順（1Password token rotate）**:
   - 必要 scope 表（上記 token scope 分離表）
   - rotate 順序: 新 token 発行 → 1Password Item 更新 → `bash scripts/cf.sh alerts diff` で疎通確認 → 旧 token 失効
   - CI 用 RO token は GitHub Secrets を `gh secret set` で更新

9. **Phase 11 evidence 一覧**: AC-1〜AC-9 evidence canonical path（`outputs/phase-11/evidence/*`）

10. **将来拡張ポイント**:
    - Terraform 採用が必要になった時点で `infra/cloudflare-alerts/*.json` → HCL 一括変換スクリプトを 1 回限り作成
    - 95% 閾値の段階アラート追加（`quota-base * 0.95`）
    - UT-18（Workers CPU time）統合 / UT-14（WAF レート制限）連携

#### スニペット引用ルール

- API endpoint / payload schema は Cloudflare API v4 公式仕様から引用（手書きしない）
- 設定値は `infra/cloudflare-alerts/` の JSON を引用（identifier drift 防止）

---

## 12-3. phase12-task-spec-compliance-check.md（Required Sections 9 項目）

| # | チェック項目 | 結果 |
| --- | --- | --- |
| 1 | メタ情報セクションが存在 | [ ] |
| 2 | 目的セクションが存在 | [ ] |
| 3 | 中学生レベル概念説明（Part 1）が存在 | [ ] |
| 4 | 技術者レベル詳細（Part 2）が存在 | [ ] |
| 5 | 正本同期対象 5 件が明記されている（monthly runbook / UT-17 親 implementation-guide / CLAUDE.md / aiworkflow-requirements skill） | [ ] |
| 6 | 受入基準（AC）が phase-11.md の AC-1〜AC-9 と整合 | [ ] |
| 7 | 完了条件が strict 7 outputs を網羅 | [ ] |
| 8 | 次 Phase（Phase 13）引き継ぎ事項が記載 | [ ] |
| 9 | 参照資料に CLAUDE.md / 入力 task spec / 親 UT-17 phase-12 が含まれる | [ ] |

> 追加チェック（task-spec ガイド準拠）:
> - [ ] Phase 1〜12 の artifacts.json 全 phase が `completed`、Phase 13 が `pending`
> - [ ] strict 7 outputs が全て `outputs/phase-12/` 配下に存在
> - [ ] 状態列で `PASS` 単独使用がない
> - [ ] `wrangler` 直接呼び出しが repo 上にない（grep PASS）
> - [ ] Issue #636 が `Refs` 表記（`Closes` 使用禁止）

---

## 12-4. system-spec-update-summary.md

### Step 1-A：完了タスク記録

| 更新対象 | 更新内容 |
| --- | --- |
| `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/index.md`（任意作成） | local implementation complete を維持。completed-tasks 移動は Phase 13 user approval 後 |
| `.claude/skills/task-specification-creator/LOGS/_legacy.md` または changelog fragment | ut-17-followup-004 仕様化行を追記 |
| `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` または changelog fragment | Cloudflare alerts IaC + drift gate 仕様化を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json`（存在する場合） | 「Cloudflare alerts IaC」「Notification Policy drift」「scripts/cf.sh alerts」「Cloudflare alerting token scope」キーワード追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` または同等 | monitoring / IaC セクションに ut-17-followup-004 を追加 |
| `.claude/skills/task-specification-creator/references/resource-map.md`（存在する場合） | 同上 |

### Step 1-B：実装状況テーブル更新

ut-17-followup-004 を **`implementation_complete / implementation / NON_VISUAL / runtime Cloudflare mutation pending_user_approval`** として task-workflow / unassigned-task index に記録する。completed-tasks 移動は Phase 13 user approval 後に限定する。

### Step 1-C：関連タスクテーブル更新

| 関連タスク | 更新内容 |
| --- | --- |
| UT-17 親（ut-17-cloudflare-analytics-alerts） | 「Notification Policy IaC 化は ut-17-followup-004 で完了。Part 5「外部操作残」は IaC 経路へ参照リンク追加」を備考に追記 |
| UT-08-IMPL | 影響なし（WAE custom alert は別経路） |
| UT-14（WAF / Rate Limiting） | 影響なし（独立） |
| UT-18（Workers CPU time） | 「ut-17-followup-004 で確立した IaC + drift gate に Workers CPU time 閾値を追加する余地あり」を備考に追記 |

### Step 2：システム仕様更新

| 判定 | 結論 |
| --- | --- |
| 新規インターフェース追加 | なし（既存 Cloudflare API v4 を利用） |
| 既存インターフェース変更 | なし |
| 新規定数 / 設定値 | あり（`infra/cloudflare-alerts/quota-base.json` の無料枠 base 値、`scripts/cf.sh alerts` の閾値係数 0.8）。本タスク内 SSOT (`infra/cloudflare-alerts/`) に閉じる |
| 結論 | **Step 2 実施**（CLAUDE.md「Cloudflare 系 CLI 実行ルール」に `alerts` サブコマンドを追記、aiworkflow-requirements の関連 reference に IaC 経路を反映） |
| 再判定条件 | Terraform 採用判断時、または UT-18 / UT-14 の閾値統合時に再評価 |

---

## 12-5. skill-feedback-report.md

| カテゴリ | 学び |
| --- | --- |
| 実装 | Cloudflare API v4 `alerting/v3` の `alert_type` 別 schema は metric によって `conditions` が異なる。JSON 正規化（diff 用）では `created` / `modified` / `id` 等の volatile field を除外する設計が必須 |
| セキュリティ | API Token を「apply（書込み）」「diff（read-only / CI）」「deploy（既存）」で 3 系統に分離することで、CI compromise 時の apply 権限流出を構造的に防げる |
| 運用 | webhook destination を ID ではなく **name で参照** することで、Account 再構築や Token rotate 後の ID 変化に対する耐性が出る。lint で ID 直書きを禁止する grep gate が有効 |
| 設計 | 無料枠絶対値 (`quota-base`) を SSOT に切り出し、policy 側は `quotaBase * 0.8` の computed 値で生成することで、Cloudflare 公式 free tier 改定に追従可能な構造になる |
| ツール | `scripts/cf.sh` ラッパに `alerts` サブコマンドを足すことで、`wrangler` 直接禁止ポリシーを維持しつつ Cloudflare API v4 を運用に取り込める。`op run` skip path（CI 専用）を 1 系統足すだけで CI 互換を担保できる |

---

## 12-6. unassigned-task-detection.md

```markdown
# ut-17-followup-004 仕様同期サマリー

## タスク
Cloudflare Notification Policy 4カテゴリ / 5 policyの IaC 化 + drift 検知

## 期間
2026-05-14（実工数: review cycle 内で完了）

## 成果
- `infra/cloudflare-alerts/` に 4 categories / 5 policy files + 1 webhook destination + quota-base を JSON 宣言する計画を固定
- `scripts/cf.sh alerts {apply,diff,list}` で冪等適用 + drift 検知する計画を固定
- `.github/workflows/cloudflare-alerts-drift.yml` で毎日 + PR 時に drift gate を置く計画を固定
- API Token を apply / diff(RO) / deploy の 3 系統に分離
- monthly healthcheck runbook を Dashboard 目視 → `scripts/cf.sh alerts diff` に切替える後続実装手順を固定
- UT-17 親 implementation-guide Part 5 から IaC 経路への参照リンク追加方針を固定
- AC-1〜AC-9 は local implementation boundary で検証済み。Cloudflare mutation evidence は user-gated。

## 影響範囲
- `infra/cloudflare-alerts/`（新規）
- `scripts/cf.sh`（alerts サブコマンド拡張）
- `.github/workflows/cloudflare-alerts-drift.yml`（新規）
- `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（手順差替）
- `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md`（Part 5 参照追加）
- `CLAUDE.md`（Cloudflare CLI 実行ルール）
- `.claude/skills/`（LOGS / indexes 更新）

## 派生未タスク（Unassigned Task Detection）
- **ut-17-followup-005（仮）**: Terraform 化判断時の migration script
  - 発火条件: 他 IaC を Terraform で書く必要が出た時点
  - 内容: `infra/cloudflare-alerts/*.json` → HCL 一括変換スクリプト（1 回限り）
  - 優先度: 低（YAGNI 適用、現時点では発火条件未成立）
- **ut-18 連携（既存タスクへの追加）**: Workers CPU time 閾値を `quota-base.json` に追加
- **段階アラート（任意）**: 95% 閾値の policy 追加（80% との 2 段警告）

## Wave 2 / 後続タスクへの引き継ぎ
- UT-18: CPU time 閾値を IaC 構造に追加
- UT-14: relay endpoint への WAF レート制限と本タスクの drift gate は独立
- UT-08-IMPL: 影響なし
```

---

## 12-7. documentation-changelog.md

```markdown
# ut-17-followup-004 changelog（2026-05-14）

## workflow-local 同期（docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/）
### 新規
- phase-11.md / phase-12.md / phase-13.md
- outputs/phase-11/visual-verification-skip.md + evidence/*
- outputs/phase-12/ strict 7 outputs
- outputs/phase-13/ pr-checklist.md / local-check-result.md / change-summary.md / retrospective.md

### 更新
- なし（新規タスク）

## global skill sync（.claude/skills/）
- task-specification-creator/LOGS.md（ut-17-followup-004 完了行）
- aiworkflow-requirements/LOGS.md（IaC + drift gate 実装完了記録）
- aiworkflow-requirements/indexes/keywords.json（4 キーワード追加）
- aiworkflow-requirements/indexes/topic-map.md（monitoring / IaC セクション）
- task-specification-creator/references/resource-map.md（同上）

## コード / インフラ変更
### 新規
- infra/cloudflare-alerts/policies/workers-requests.json
- infra/cloudflare-alerts/policies/d1-read.json
- infra/cloudflare-alerts/policies/d1-write.json
- infra/cloudflare-alerts/policies/pages-build.json
- infra/cloudflare-alerts/policies/r2-class-a-b.json
- infra/cloudflare-alerts/webhooks/ut-17-relay.json
- infra/cloudflare-alerts/quota-base.json
- infra/cloudflare-alerts/README.md
- .github/workflows/cloudflare-alerts-drift.yml

### 編集
- scripts/cf.sh（alerts {apply,diff,list} サブコマンド追加）
- .dev.vars.example（UBM-Hyogo Alerts Apply Token op:// 参照追加）

## runbook / docs（既存ドキュメント）
### 編集
- docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md（Dashboard 目視 → `scripts/cf.sh alerts diff` 経路差替）
- docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md（Part 5 末尾に IaC 経路への参照リンク追加）
- CLAUDE.md（「Cloudflare 系 CLI 実行ルール」に alerts サブコマンド項追記）

## mirror parity
- .claude/skills と .agents/skills の差分を Phase 12 で確認、必要に応じ rsync で同期
```

---

## 正本同期対象（衝突時の優先順位）

1. `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/outputs/phase-12/` strict 7 outputs（本タスク正本）
2. `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`（経路差替）
3. `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md` Part 5（参照追加のみ・本文書換禁止）
4. `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」（alerts 項追記）
5. `.claude/skills/aiworkflow-requirements/`（indexes / LOGS / references / 必要時）

---

## 受入基準（AC・Phase 11 と整合）

| AC | 内容 | 検証方法 |
| --- | --- | --- |
| AC-12-1 | strict 7 outputs が `outputs/phase-12/` 配下に全て存在 | `ls outputs/phase-12/` で 7 ファイル確認 |
| AC-12-2 | implementation-guide.md が Part 1（中学生）+ Part 2（技術者）の 2 部構成 | 目次確認 |
| AC-12-3 | system-spec-update-summary.md に Step 1-A / 1-B / 1-C / Step 2 の判定が明記 | grep で見出し確認 |
| AC-12-4 | phase12-task-spec-compliance-check.md の 9 項目チェック + 追加チェックがすべて [x] | チェック実行 |
| AC-12-5 | documentation-changelog.md に workflow-local / global skill / コード・インフラ / runbook・docs / mirror parity の 5 ブロックが分離 | grep で見出し確認 |
| AC-12-6 | UT-17 親 implementation-guide Part 5 が参照リンク追加のみ（本文書換なし） | git diff で行追加のみ確認 |
| AC-12-7 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」に `alerts` 項が追記され、`wrangler` 直接禁止表現を維持 | grep で確認 |
| AC-12-8 | monthly runbook が Dashboard 目視 → `scripts/cf.sh alerts diff` に切替 | diff 確認 |
| AC-12-9 | mirror parity（.claude ↔ .agents）が同期、または明示的に同期不要と判定 | `diff -r` 実行 |

---

## 完了条件

- [ ] strict 7 outputs が全て `outputs/phase-12/` 配下に配置されている
- [ ] implementation-guide.md が Part 1（中学生レベル）+ Part 2（技術者レベル）の 2 部構成
- [ ] system-spec-update-summary.md に Step 1-A / 1-B / 1-C / Step 2 の判定が明記
- [ ] phase12-task-spec-compliance-check.md の Required 9 項目 + 追加チェックが全 [x]
- [ ] documentation-changelog.md に 5 ブロック分離
- [ ] LOGS（2 ファイル）と aiworkflow-requirements indexes / references が更新（該当する場合）
- [ ] UT-17 親 implementation-guide Part 5 への参照リンクが追加（本文書換なし）
- [ ] monthly healthcheck runbook が `scripts/cf.sh alerts diff` 経路に切替
- [ ] CLAUDE.md「Cloudflare 系 CLI 実行ルール」に alerts 項追記
- [ ] Issue #636 は `Refs` 表記、`Closes` 不使用
- [ ] mirror parity（.claude ↔ .agents）整合
- [ ] artifacts.json の phase-12 を `completed` に更新（実装完了後）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 親 | Part 5「外部操作残」→ IaC 経路への参照追加 | implementation-guide.md Part 5 末尾に追記（本文書換禁止） |
| monthly healthcheck runbook | Dashboard 目視 → `scripts/cf.sh alerts diff` 切替 | runbook 既存セクションを diff で置換 |
| UT-18 / UT-14 / UT-08-IMPL | 後続・並列タスクへの引継ぎ | system-spec-update-summary.md Step 1-C で備考更新 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/unassigned-task/ut-17-followup-004-cloudflare-notification-policy-iac.md` | 入力 task spec |
| 必須 | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/phase-12.md` | 親 Phase 12 構造の参照元 |
| 必須 | `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md` | Part 5 参照追加対象 |
| 必須 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 経路差替対象 |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 outputs ルール |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | Required Sections 9 項目 |
| 必須 | `CLAUDE.md`「Cloudflare 系 CLI 実行ルール」「シークレット管理」 | 本タスク不変条件 |

---

## 成果物（artifacts.json phase-12 と完全一致）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 サマリ |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1（中学生）+ Part 2（技術者） |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Required 9 項目 + 追加チェック |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜Step 2 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 5 カテゴリの学び |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 派生未タスク + サマリ |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 5 ブロック分離 changelog |
| 更新 | .claude/skills/task-specification-creator/LOGS（fragment） | ut-17-followup-004 完了行 |
| 更新 | .claude/skills/aiworkflow-requirements/LOGS（fragment） | IaC + drift gate 実装完了記録 |
| 更新 | .claude/skills/aiworkflow-requirements/indexes/keywords.json（存在時） | 4 キーワード追加 |
| 更新 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md（存在時） | monitoring / IaC セクション |
| 更新 | CLAUDE.md | Cloudflare CLI 実行ルールに alerts 項追記 |
| 更新 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | 経路差替 |
| 更新 | docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md | Part 5 末尾に参照追加 |
| メタ | artifacts.json | phase-12 を completed に更新 |

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが `completed` / `runtime_pending` / `completed` のいずれか
- [ ] strict 7 outputs + 該当 skill / docs 更新が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-12 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 13（PR・振り返り）
- 引き継ぎ:
  - documentation-changelog.md の変更ファイル一覧 = Phase 13 PR 本文の change-summary
  - unassigned-task-detection.md = Phase 13 PR 本文の Summary セクションの元データ
  - implementation-guide.md = PR レビュア向け参照
  - phase12-task-spec-compliance-check.md = Phase 13 ローカルチェックの compliance evidence
- ブロック条件: strict 7 outputs に欠落 / mirror parity 未解消 / UT-17 親 Part 5 本文を書換えてしまった / `wrangler` 直接呼び出しが repo に混入 / Issue #636 を `Closes` で書いた
