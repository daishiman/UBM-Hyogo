# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 本番 D1 バックアップ長期保管・日次自動取得 (ut-06-followup-E-d1-backup-long-term-storage) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-01 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (テスト戦略) |
| 状態 | spec_created |
| タスク種別 | docs-only / spec_created / NON_VISUAL / data_backup |

## 目的

Phase 2 で確定した設計（cron 配置 base case = GHA + CF cron triggers 併用 / 暗号化 base case 候補 / R2 lifecycle / UT-08 通知 / 復元 runbook + 机上演習 / 空 export 許容 / secret rotation）に対して、4 条件（価値性 / 実現性 / 整合性 / 運用性）+ 不変条件 #5 + scripts/cf.sh ルール + monthly 無料枠 + 暗号化必須性 の評価軸で代替案比較を行い、PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通す。base case の最終判定は **PASS（with notes）** とし、notes は Phase 5 / 10 / 12 への申し送り事項として明記する。

## レビュー対象の確定

| 対象 | 出所 |
| --- | --- |
| cron 配置 4 案 / base case = GHA + CF cron triggers Worker 併用 | Phase 2 §設計対象の特定 |
| export スクリプト 6 ステップ擬似シーケンス | Phase 2 §設計対象の特定 |
| R2 lifecycle（daily 30 日 / monthly 12 ヶ月 / 月初 copy 昇格） | Phase 2 §設計対象の特定 |
| 暗号化 3 案 / base case 候補（SSE-S3 or SSE-C） | Phase 2 §設計対象の特定 |
| UT-08 通知 payload schema | Phase 2 §設計対象の特定 |
| 復元 runbook 8 章立て + 月次机上演習 | Phase 2 §設計対象の特定 |
| 空 export 許容バリデーション分岐（`INITIAL_BACKUP_FLAG`） | Phase 2 §設計対象の特定 |
| secret rotation 4 対象 | Phase 2 §設計対象の特定 |

## 実行タスク

1. cron 配置代替案 4 案（A〜D）を比較表に並べる（完了条件: A〜D が並ぶ）。
2. 暗号化 3 案（SSE-S3 / SSE-C / KMS）を比較表に並べる（完了条件: 3 案が並ぶ）。
3. 9 観点（4 条件 + 不変条件 #5 / scripts/cf.sh ルール / 無料枠 / 暗号化必須性 / ロールバック）× cron 4 案 で PASS / MINOR / MAJOR を付与する（完了条件: 空セルゼロ）。
4. base case（GHA + CF cron triggers 併用 / SSE-C 想定）を選定理由付きで確定する（完了条件: 選定理由が代替案比較から導出されている）。
5. PASS / MINOR / MAJOR の判定基準を定義する（完了条件: 各レベルの基準文）。
6. NO-GO 条件を定義し、3 上流前提（UT-12 R2 / UT-08 通知 / Phase 9 機密性判定）未完了 / 暗号化方式未確定 / 復元演習計画なし / wrangler 直接呼び出し混入 / 不変条件 #5 違反 を NO-GO として明記する（完了条件: 5 件すべて記述）— UT-12 / UT-08 / Phase 9 については重複明記 3/3。
7. open question を Phase 4 / 5 / 10 / 12 に振り分ける（完了条件: 全件に受け皿 Phase 指定）。
8. base case の最終 PASS / MINOR / MAJOR 判定を 4 条件で全 PASS にロックする（完了条件: 全 PASS）。

## 依存タスク順序（3 上流前提必須）— 重複明記 3/3

> **UT-12（R2 storage）/ UT-08（monitoring base）/ UT-06 Phase 9（secret-hygiene-checklist）が completed でなければ、本 Phase の着手可否ゲートは強制 NO-GO となる。**
>
> 3 上流のいずれかが未完了で本 Phase を Phase 4 以降の実装ランブックに移すと、(1) R2 バケット不在で cron が upload 失敗、(2) 失敗アラートが届かずサイレント失敗、(3) 暗号化方式の選定根拠が不在、のいずれかが発生する。これは Phase 1 §依存境界（1/3）/ Phase 2 §依存タスク順序（2/3）/ 本 Phase §NO-GO 条件（3/3）の 3 箇所で重複明記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-02.md | レビュー対象設計 |
| 必須 | docs/30-workflows/ut-06-followup-E-d1-backup-long-term-storage/phase-01.md | 真の論点 / 4 条件 / AC |
| 必須 | docs/30-workflows/completed-tasks/ut-06-followup-E-d1-backup-long-term-storage.md §苦戦箇所 | 空 export / 暗号化 / 無料枠 / 机上演習 |
| 必須 | CLAUDE.md §重要な不変条件 #5 / §Cloudflare 系 CLI 実行ルール | 不変条件 / scripts/cf.sh 強制 |
| 必須 | docs/30-workflows/completed-tasks/ut-06-production-deploy-execution/outputs/phase-09/secret-hygiene-checklist.md | 暗号化方式選定根拠 |
| 参考 | https://developers.cloudflare.com/workers/configuration/cron-triggers/ | CF cron triggers |
| 参考 | https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions | GHA 月 2,000 分無料枠 |

## 代替案評価表 1: cron 配置（A/B/C/D）

| 観点 | 案 A: CF cron Worker 単独 | 案 B: GHA schedule 単独 | 案 C: 手動実行 | 案 D: GHA + CF cron Worker 併用（base） |
| --- | --- | --- | --- | --- |
| 価値性（AC-1 達成） | MAJOR（Worker から wrangler CLI 実行不可） | PASS | MAJOR（自動化されない） | PASS |
| 実現性 | MAJOR（wrangler 不可 / R2 API 直接呼び要） | PASS | PASS | PASS |
| 整合性（不変条件 #5 / scripts/cf.sh） | MINOR（scripts/cf.sh 経由不可） | PASS | PASS | PASS |
| 運用性 | MINOR | MINOR（GHA 単一障害点） | MAJOR | PASS（GHA 失敗を CF cron で二重検知） |
| 不変条件 #5 | PASS | PASS | PASS | PASS |
| scripts/cf.sh ルール | MINOR（直接実行不可） | PASS | PASS | PASS |
| monthly 無料枠 | PASS（CF 側無料） | PASS（150 分 / 2,000 分の 7.5%） | PASS | PASS（同上 + AC-8 監視対象） |
| 暗号化必須性 | PASS | PASS | PASS | PASS |
| ロールバック設計 | PASS | PASS | PASS | PASS（YAML + Worker 削除の 2 コミット） |

## 代替案評価表 2: 暗号化（SSE-S3 / SSE-C / KMS）

| 観点 | SSE-S3 | SSE-C（base case 候補） | KMS |
| --- | --- | --- | --- |
| 価値性（AC-3 / AC-9） | PASS（中以下機密性のみ） | PASS（中〜高機密性 OK） | PASS（最強だが過剰） |
| 実現性 | PASS（R2 標準） | PASS（R2 S3 互換 SSE-C 対応） | MAJOR（KMS 統合自前実装） |
| 整合性 | PASS | PASS | MINOR（独自実装で監査性は高いが運用負荷） |
| 運用性 | PASS | MINOR（key 紛失時ロックアウト） | MAJOR（DEK 管理運用負荷） |
| 不変条件 #5 | PASS | PASS | PASS |
| scripts/cf.sh ルール | PASS | PASS | PASS |
| monthly 無料枠 | PASS | PASS | PASS |
| 暗号化必須性 | PASS（機密性中以下） | PASS | PASS |
| ロールバック | PASS | MINOR（key 履歴管理必要） | MAJOR |

### 採用結論

- cron 配置 base case = **案 D: GHA + CF cron triggers Worker 併用**。GHA schedule（主経路）が `bash scripts/cf.sh d1 export` を実行し、CF cron triggers Worker が R2 オブジェクト存在ヘルスチェックを実施。GHA 単一障害を CF 側で二重検知する defense in depth。AC-8 を満たすため UT-05-FU-003 監視対象として登録する。
- 暗号化 base case = **SSE-C（機密性中〜高想定）**。Phase 9 secret-hygiene-checklist で会員氏名・メール含有が確認されたため、SSE-C で「Cloudflare 側に key を保有させない」設計を採用。SSE-S3 への縮退は Phase 9 値が「低」と再判定された場合のみ許容。

## PASS / MINOR / MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 観点を満たす。Phase 4 へ進める |
| MINOR | 警告レベル。Phase 5 / 10 / 12 で補足対応が必要だが、Phase 4 への移行は許可 |
| MAJOR | block。Phase 4 へ進めない。Phase 2 へ差し戻すか、open question として MVP スコープ外に明確化 |

## base case 最終 PASS / MINOR / MAJOR 判定

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | バックアップ消失・復元不能リスク解消 / 月次 long-term 保管確立 |
| 実現性 | PASS | Cloudflare cron triggers + GHA schedule + R2 SSE-C + 1Password はすべて既存基盤 |
| 整合性 | PASS | **不変条件 #5 を侵害しない**（cron 経路は CLI 経由 / `apps/web` 不在）。`bash scripts/cf.sh d1 export` 経由で scripts/cf.sh ルール遵守 |
| 運用性 | PASS（with notes） | UT-08 通知 + 30 日 + 月次 12 ヶ月世代管理 + 月次机上演習で運用境界完結。SSE-C key 紛失リスクは notes で rotation 手順をPhase 12 ドキュメント化 |
| 不変条件 #5 | PASS | cron 経路に `apps/web` から D1 binding 直接アクセスが現れない |
| scripts/cf.sh ルール | PASS | wrangler 直接呼び出しなし / `op run` 経由で Token 動的注入 |
| monthly 無料枠 | PASS | GHA 試算 150 分 / 月（無料枠の 7.5%）で AC-8 監視対象登録 |
| 暗号化必須性 | PASS | SSE-C で会員情報 SQL 平文をクライアント側 key で保護 |
| ロールバック設計 | PASS | YAML + Worker + R2 lifecycle + secret 削除の 2〜3 コミット粒度で逆操作可能 |

**最終判定: PASS（with notes）**

notes:
- 3 上流（UT-12 / UT-08 / Phase 9）completed 確認は Phase 5 着手前の必須ゲート（NO-GO 条件として再明示）。
- SSE-C key 紛失時のロックアウト対策として、key 履歴を 1Password に世代管理する手順を Phase 12 ドキュメント化。
- `INITIAL_BACKUP_FLAG` を D1 migration 適用後に `false` へ切替える運用 SOP を Phase 12 ドキュメント化。
- 月次スナップショット昇格は `mv` ではなく `copy` で実施する規則を Phase 5 実装ランブックで明記。
- UT-08 payload schema は UT-08 本体の contract と Phase 12 で最終整合。

## NO-GO 条件（Phase 4 への着手可否ゲート）

### GO 条件（全て満たすこと）

- [x] cron 配置代替案 4 案以上が評価マトリクスに並んでいる
- [x] 暗号化代替案 3 案が評価マトリクスに並んでいる
- [x] base case の最終判定が全観点 PASS（or PASS with notes）
- [x] MAJOR が一つも残っていない
- [x] MINOR がある場合、対応 Phase（5 / 10 / 12）が指定されている
- [x] open question が全件 Phase 振り分け済み

### NO-GO 条件（一つでも該当）

- **3 上流（UT-12 R2 / UT-08 通知 / Phase 9 secret-hygiene-checklist）のいずれかが completed でない** ← R2 不在 / アラート不在 / 暗号化選定根拠不在の事故主要因（重複明記 3/3）
- **暗号化方式が未確定** ← SSE-S3 / SSE-C / KMS のいずれを採用するか base case が空の場合
- **復元机上演習計画なし** ← Phase 10 で `outputs/phase-10/restore-rehearsal-result.md` テンプレ要件が記述されていない場合
- **wrangler 直接呼び出し混入** ← 擬似シーケンス / 実装計画で `bash scripts/cf.sh d1 export` 以外の経路が残っている場合
- **不変条件 #5 違反** ← cron 経路で `apps/web` から D1 binding を直接叩く構造が混入した場合
- 4 条件のいずれかに MAJOR が残る
- ロールバックが 4 コミット以上を要求している

## open question（Phase 4 以降に渡す候補）

| # | 質問 | 受け皿 Phase | 備考 |
| --- | --- | --- | --- |
| 1 | SSE-C 採用最終確定（Phase 9 機密性レベル判定の最終値次第で SSE-S3 への縮退余地） | Phase 5 着手前 | base case は SSE-C |
| 2 | UT-08 通知 payload schema の最終確定（severity field の値域） | Phase 12 | UT-08 contract と整合 |
| 3 | monthly 保持期間の最終確定 | Phase 12 / UT-12 と整合 | base case は 12 ヶ月 |
| 4 | 机上演習頻度の最終確定 | Phase 10 | base case は月次 |
| 5 | `INITIAL_BACKUP_FLAG` 切替の運用 SOP | Phase 12 | D1 migration 適用後に切替 |
| 6 | SSE-C key rotation 周期（24 ヶ月仮）の最終確定 | Phase 12 | secret rotation 計画と整合 |

## 4 条件評価の最終ロック

| 条件 | 判定 | ロック根拠 |
| --- | --- | --- |
| 価値性 | PASS | バックアップ消失・復元不能リスク解消（Phase 1 / 2 / 3 一貫） |
| 実現性 | PASS | 既存基盤範囲（Cloudflare cron triggers + GHA + R2 SSE-C + 1Password + scripts/cf.sh） |
| 整合性 | PASS | **不変条件 #5 侵害なし**（cron 経路 CLI 経由 / `apps/web` 不在）+ scripts/cf.sh ルール遵守 |
| 運用性 | PASS（with notes） | 30 日 + 月次 12 ヶ月 + UT-08 通知 + 月次机上演習 + secret rotation で運用境界完結 |

→ **全 PASS（運用性は with notes）で Phase 4 への移行を許可**。

## Phase 4 以降への引き渡し条件

- cron 配置 base case = GHA + CF cron triggers Worker 併用
- 暗号化 base case = SSE-C（Phase 9 機密性中〜高想定）
- R2 lifecycle（daily 30 日 / monthly 12 ヶ月 / 月初 copy 昇格）
- UT-08 通知 payload schema 仮
- 復元 runbook 8 章立て + 月次机上演習
- 空 export 許容バリデーション分岐
- secret rotation 4 対象（CF API Token / R2 access key / SSE-C key / op service account token）
- AC-1〜AC-9 を Phase 4 テスト戦略の左軸に渡す
- open question 6 件を該当 Phase で resolve する

## 実行手順

### ステップ 1: 代替案の列挙

- cron 配置 4 案 + 暗号化 3 案を `outputs/phase-03/main.md` に記述。

### ステップ 2: 評価マトリクスの作成

- cron 配置 9 観点 × 4 案 / 暗号化 9 観点 × 3 案で空セルなく埋める。

### ステップ 3: base case 最終判定

- 全 PASS（運用性は with notes）であることを確認。MINOR の対応 Phase を明示。

### ステップ 4: NO-GO 条件の明示

- 3 上流前提 / 暗号化方式 / 机上演習計画 / wrangler 直接呼び出し / 不変条件 #5 を NO-GO として記述。

### ステップ 5: open question の Phase 振り分け

- 6 件すべてに受け皿 Phase（5 / 10 / 12）を割り当てる。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | base case を入力にテスト戦略を組む |
| Phase 5 | open question #1 / #5（暗号化最終確定 / `INITIAL_BACKUP_FLAG` SOP）を実装で確定 |
| Phase 6 | 異常系（GHA 失敗 / R2 upload 失敗 / SSE-C key 紛失 / 1Password 障害 / 行数 0 誤検知 / UT-08 webhook 失敗） |
| Phase 8 | SSE-C / IAM / signed URL をセキュリティ章へ |
| Phase 10 | 机上演習計画 + `restore-rehearsal-result.md` テンプレ |
| Phase 12 | open question #2 / #3 / #4 / #6（payload schema / monthly 保持 / 演習頻度 / SSE-C key rotation）をドキュメント化 |

## 多角的チェック観点

- **責務境界**: cron 経路が `apps/api` を介在せず、`apps/web` から D1 binding を直接叩く形にも変質していないか。
- **依存タスク順序**: 3 上流前提（UT-12 / UT-08 / Phase 9）が 3 重明記されたか（本 Phase が 3/3）。
- **価値とコスト**: base case が最小コスト（GHA 月 150 分 / 7.5% 枠）で最大価値（30 日 + 月次 + SSE-C + 通知 + 演習）を達成しているか。
- **ロールバック設計**: YAML + Worker + R2 lifecycle + secret 削除の 2〜3 コミット粒度で逆操作可能か。
- **状態所有権**: cron / R2 / 1Password / SSE-C key / UT-08 webhook の各 state が代替案で混線していないか。
- **不変条件 #5**: 案 A〜D いずれにおいても `apps/web` / `apps/api` から D1 binding を runtime で直接叩く形が混入していないか。
- **scripts/cf.sh ルール**: 全代替案で wrangler 直接呼び出しが除外されているか。
- **暗号化必須性**: SSE-S3 採用に縮退する場合の Phase 9 値の許容条件が明示されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | cron 配置 4 案列挙 | 3 | spec_created | A〜D |
| 2 | 暗号化 3 案列挙 | 3 | spec_created | SSE-S3 / SSE-C / KMS |
| 3 | 評価マトリクス作成 | 3 | spec_created | 9 観点 × 4 / 3 |
| 4 | base case 最終 PASS（with notes）判定 | 3 | spec_created | notes 5 件 |
| 5 | PASS/MINOR/MAJOR 基準定義 | 3 | spec_created | 3 レベル |
| 6 | NO-GO 条件 5 件の明記（3 上流前提含む） | 3 | spec_created | 重複明記 3/3 |
| 7 | open question 6 件 Phase 振り分け | 3 | spec_created | 5 / 10 / 12 |
| 8 | 4 条件評価の最終ロック | 3 | spec_created | 全 PASS |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 代替案比較・評価マトリクス・PASS/MINOR/MAJOR・NO-GO 条件・open question |
| メタ | artifacts.json | Phase 3 状態の更新 |

## 完了条件

- [x] cron 配置代替案が 4 案比較されている
- [x] 暗号化代替案が 3 案比較されている
- [x] 9 観点 × 4 案 / 3 案のマトリクスに空セルが無い
- [x] base case（GHA + CF cron 併用 / SSE-C）の最終判定が PASS（with notes）
- [x] PASS / MINOR / MAJOR の判定基準が明文化されている
- [x] NO-GO 条件で 3 上流前提 / 暗号化未確定 / 机上演習計画なし / wrangler 直接呼び出し / 不変条件 #5 違反 が明記されている（重複明記 3/3）
- [x] open question 6 件すべてに受け皿 Phase が割り当てられている
- [x] 4 条件評価が全 PASS（運用性は with notes）で最終ロックされている

## タスク100%実行確認【必須】

- 全実行タスク（8 件）が `spec_created`
- 4 条件 + 観点すべてが PASS（with notes）
- MAJOR ゼロ
- MINOR がある場合、対応 Phase が記述
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4 (テスト戦略)
- 引き継ぎ事項:
  - 採用 base case = cron 配置: GHA + CF cron triggers Worker 併用 / 暗号化: SSE-C
  - AC-1〜AC-9 を Phase 4 テスト戦略の左軸に渡す
  - notes 5 件（3 上流 completed 確認 / SSE-C key 履歴管理 / `INITIAL_BACKUP_FLAG` SOP / monthly copy 昇格 / UT-08 contract 整合）
  - open question 6 件を該当 Phase へ register
- ブロック条件:
  - GO 条件のいずれかが未充足
  - 3 上流のいずれかが completed でない
  - 暗号化方式 / 机上演習計画 / wrangler 直接呼び出し / 不変条件 #5 違反 のいずれかが残る
  - MAJOR が残っている
  - base case が代替案比較から導出されていない
