# 未割り当てタスク検出レポート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| 対象 Phase | 12 |
| 作成日 | 2026-04-26 |

---

## 概要

本ファイルは、Phase 1〜11 の実施を通じて発見された「現時点でどのタスクにも割り当てられていない作業」を集約する。
これらは本タスクのスコープ外であるが、放置すると downstream に悪影響が生じる可能性がある。

---

## 未割り当てタスク一覧

| ID | 内容 | 発見 Phase | 重要度 | 推奨割り当て先 |
| --- | --- | --- | --- | --- |
| U-04 | 1Password Environments から local 環境変数を取得する具体的な手順（mise との連携）が README に未文書化 | Phase 12 implementation-guide | 中 | apps/web / apps/api の README 作成タスク |
| U-05 | `@opennextjs/cloudflare deploy --env staging` の実環境 smoke が未実施 | Phase 12 implementation-guide | 中 | 初回 staging deploy smoke |
| U-06 | D1 migration を backend deploy workflow に組み込むか未確定 | Phase 5 draft / actual workflow 差分 | 中 | `docs/unassigned-task/UT-22-d1-migration-sql-implementation.md` |
| U-07 | CD workflow が CI workflow の結果を直接 `needs` していない | Phase 12 review | 中 | branch protection で merge 前に担保。直接連携が必要なら後続 governance task |

---

## Phase 11 smoke test の SKIP 項目

| テストID | 内容 | スキップ理由 | 解消条件 |
| --- | --- | --- | --- |
| VIS-01 | UI screenshot capture | 画面 UI/UX 変更なし | N/A。Markdown evidence を正とする |

---

## Open Question 一覧

| ID | 質問 | 背景 | 判断責任者 |
| --- | --- | --- | --- |
| OQ-01 | `CLOUDFLARE_ACCOUNT_ID` は GitHub Variable と GitHub Secret のどちらに置くべきか | 非機密 identifier のため GitHub Variables に固定済み | 解消 |
| OQ-02 | dev branch への push で web と api の両方を同時デプロイするか、それとも変更があった方のみデプロイするか | path filter により変更があった方のみデプロイする方針で固定済み | 解消 |

---

## 対応アクション

| ID | アクション | 担当 | 期限 |
| --- | --- | --- | --- |
| U-04 | apps/web / apps/api README 作成時に 1Password Environments + mise 連携手順を追加する | README 作成タスク担当 | README 作成時 |
| U-05 | 初回 staging deploy 時に `deploy:staging` の OpenNext env 挙動を smoke する | deploy smoke 担当 | 初回 staging deploy |
| U-06 | D1 migration automation を UT-22 側で設計・実装する | UT-22 担当 | D1 migration 実装時 |
