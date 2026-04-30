# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-29 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | spec_created |
| タスク分類 | specification-design（final review gate） |

## 目的

Phase 1〜9 で蓄積した要件・schema 設計・migration runbook・マッピング・AC マトリクス・DRY 化・QA の各成果物を横断レビューし、AC-1〜AC-N すべての達成状態と 4条件最終判定（PASS/MINOR/MAJOR）を確定する。**spec_created 段階の本タスクでは「未適用だが schema 確定」状態を許容**し、Wave 1 内の合流タスク（特に UT-09 への schema 引き渡し）に対する影響を明文化する。MINOR 判定は必ず未タスク化（`docs/30-workflows/unassigned-task/` への formalize）方針を取る。

## 実行タスク

1. AC-1〜AC-N の達成状態を spec_created 視点で評価する（完了条件: 全件に「未適用だが仕様確定」「仕様未確定」のいずれかが付与）。
2. 4条件（価値性 / 実現性 / 整合性 / 運用性）に対する最終判定を確定する（完了条件: PASS/MINOR/MAJOR が一意に決定）。
3. blocker 一覧（着手前提）を作成する（完了条件: 上流タスク完了確認 + D1 instance 作成完了 + scripts/cf.sh 利用可否が含まれる）。
4. Wave 1 内の合流タスク（UT-09 への schema 引き渡し）への影響を明文化する（完了条件: UT-09 phase-08 の `MemberRow` 命名・PRIMARY KEY 構成との整合確認）。
5. MINOR 判定が出た場合の未タスク化方針を確定する（完了条件: `docs/30-workflows/unassigned-task/` への formalize ルートが記述）。
6. GO/NO-GO 判定を確定し、Phase 11 へ進めるかを決定する（完了条件: `outputs/phase-10/go-no-go.md` に GO 判定が記述）。
7. open question を Phase 11/12 へ送り出す（完了条件: 残課題の受け皿 Phase が指定）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-07.md | AC × 検証 × 実装トレース |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-09.md | QA 結果（無料枠 / index / PII） |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-08.md | DRY 化結果 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-03.md | base case 最終判定 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | AC / 不変条件 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-08.md | 合流タスクの schema 期待値 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | unassigned task formalize ルート |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-10.md | 最終レビュー参照事例 |

## GO / NO-GO 判定マトリクス（AC × 達成状態）

> **評価基準**: spec_created 段階のため、「仕様が Phase 1〜9 で具体的に確定し、Phase 5 migration runbook で適用可能粒度に分解されているか」で判定する。実 D1 への適用は未着手。

| AC | 内容 | 達成状態（spec_created 時点） | 仕様確定先 | 判定 |
| --- | --- | --- | --- | --- |
| AC-1 | D1 テーブル DDL（member_responses / sync_jobs / schema_diff_queue / audit_logs）が設計されている | 未適用だが仕様確定 | Phase 2 schema 設計、Phase 5 migration | PASS |
| AC-2 | wrangler migration ファイル（`migrations/0001_init.sql` 等）が作成設計されている | 未適用だが仕様確定 | Phase 5 migration runbook | PASS |
| AC-3 | Sheets→D1 マッピング表が作成されている | 仕様確定 | Phase 2 outputs | PASS |
| AC-4 | PRIMARY KEY / NOT NULL / UNIQUE / INDEX が適切に定義され、FK は既存 0001〜0006 では未使用と明記 | 仕様確定 | Phase 2 制約一覧 / migration-strategy.md §4 | PASS |
| AC-5 | dev 環境への migration 適用手順が runbook 化 | 未適用だが仕様確定 | Phase 5 migration runbook（scripts/cf.sh 経由） | PASS |
| AC-6 | production 環境への migration 適用手順が runbook 化 | 未適用だが仕様確定 | Phase 5 migration runbook | PASS |
| AC-7 | data-contract.md との整合性レビュー完了 | 仕様確定（spec レベル） | Phase 1〜2 で実施 | PASS |
| AC-8 | 無料枠余裕度（storage / reads / writes）が定量化 | 仕様確定 | Phase 9 free-tier-estimation.md | PASS |
| AC-9 | PII カラム識別 + 機密データ分離方針 | 仕様確定 | Phase 9 main.md | PASS |
| AC-10 | UT-09 への schema 引き渡し（テーブル名・カラム名・型） | 仕様確定 | Phase 8 DRY 化 + UT-09 phase-08 整合 | PASS |
| AC-11 | 4条件最終判定 PASS | 本 Phase で確定 | 下記 4条件最終評価 | PASS |

## 4条件最終判定

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Sheets を入力源とする会員データの正本 D1 化が成立し、公開ディレクトリ・マイページ・admin の 3 層が schema 上で表現可能。Phase 1 真の論点と整合。 |
| 実現性 | PASS | wrangler migrations + scripts/cf.sh 経由で dev / production 双方に適用可能。Phase 9 で D1 storage 0.5% / reads 0.4% / writes 46% と無料枠余裕を確認。 |
| 整合性 | PASS | 不変条件 #1（schema を mapper 層に閉じる）/ #2（consent キー `public_consent` `rules_consent` 統一）/ #3（responseEmail を system field 化）/ #4（admin-managed data 分離）/ #5（D1 access を apps/api 内に閉鎖）すべて満たす。Phase 8 DRY 化で命名統一済み。 |
| 運用性 | PASS | scripts/cf.sh 経由の migration apply / rollback / .schema 確認が runbook 化。PII カラム識別表により公開 API 設計時の判断材料が確保。 |

**最終判定: GO（PASS）**

## blocker 一覧（着手前提として確認必須）

| ID | blocker | 種別 | 解消条件 | 確認方法 |
| --- | --- | --- | --- | --- |
| B-01 | 03-serial-data-source-and-storage-contract（data-contract.md）完了 | 上流タスク | data-contract.md が source-of-truth として確定 | `docs/01-infrastructure-setup/03-...` の outputs |
| B-02 | 02-serial-monorepo-runtime-foundation（Wrangler 環境）完了 | 上流タスク | apps/api に wrangler.toml + D1 binding が存在 | `apps/api/wrangler.toml` |
| B-03 | 01b-parallel-cloudflare-base-bootstrap（D1 instance）完了 | 上流タスク | dev / production 用 D1 database が作成済み | `bash scripts/cf.sh d1 list` |
| B-04 | scripts/cf.sh が利用可能 | 環境準備 | `bash scripts/cf.sh whoami` が成功 | CLI 確認 |
| B-05 | 1Password に CLOUDFLARE_API_TOKEN 登録済み | 環境準備 | `op` 経由で .env を解決可能 | scripts/with-env.sh 動作確認 |
| B-06 | Google Form 31 questions が確定済み | 上流前提 | docs/00-getting-started-manual/google-form/01-design.md と整合 | 目視確認 |

> B-01〜B-03 のいずれかが未完了の場合、Phase 11 の実 D1 への migration apply は NO-GO となる（spec_created 仕様策定は可）。

## Wave 1 内の合流タスクへの影響（UT-09 への schema 引き渡し）

| 引き渡し項目 | UT-04 仕様 | UT-09 期待値 | 整合判定 |
| --- | --- | --- | --- |
| 主テーブル名 | `member_responses` | UT-09 phase-08: `members` 想定 → 要調整 | **要調整**: UT-04 phase-08 で `member_responses` に統一予定。UT-09 側の DRY 化で同期する必要 |
| sync log テーブル | `sync_jobs` | UT-09 phase-08: `sync_jobs` | 一致 |
| sync lock テーブル | `schema_diff_queue` | UT-09 phase-08: `schema_diff_queue` | 一致 |
| business unique key | `response_id` (UNIQUE) | UT-09 idempotency test の前提 | 一致 |
| timestamp 規約 | TEXT (ISO 8601 UTC) | UT-09 mapper 想定 | 一致 |
| consent カラム | `public_consent` / `rules_consent` (INTEGER 0/1) | UT-09 mapper 想定 | 一致（不変条件 #2 共通） |

> **重要**: 主テーブル名が UT-09 phase-08 では `members`、UT-04 では `member_responses` で乖離している。UT-04 の方が「Form 回答を正本とする」不変条件 #7 と整合するため、**`member_responses` を採用**し、UT-09 側 phase-08 の DRY 化で表記を更新する申し送りを行う（Phase 12 unassigned-task 候補）。

## MINOR 判定の未タスク化方針

- 本タスク Phase 10 では **MINOR 判定なし**（4条件すべて PASS）。
- 仮に今後 Phase 11/12 で MINOR が発生した場合のルール:
  1. MINOR は **必ず未タスク化** する。
  2. `docs/30-workflows/unassigned-task/` 配下に新規 .md を作成し、原典として登録。
  3. Phase 12 の `unassigned-task-detection.md` に該当 ID を記載。
  4. 該当 task は次 Wave 以降の優先度評価に回す。
- 例: 「audit_logs retention（90 日 / 365 日）の確定」「field-level 暗号化の採用判断」は MINOR ではなく Phase 9 から open question として送出済み。

## open question の Phase 振り分け（Phase 3 / Phase 9 から継承）

| # | 質問 | 受け皿 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | audit_logs の retention 期間（90 日 / 365 日 / 永久） | Phase 12 / UT-08 | unassigned-task 候補 |
| 2 | field-level 暗号化の MVP 不採用 → 将来の採用判断 | Phase 12 unassigned-task-detection | unassigned-task 候補 |
| 3 | UT-09 phase-08 との主テーブル名整合（`members` → `member_responses`） | UT-09 phase-08 への申し送り | Phase 12 で formalize |
| 4 | Sheets schema 変更時の ALTER TABLE 運用 | Phase 11 / Phase 12 runbook | runbook で対応 |
| 5 | 複合 index の追加判断（実運用後の slow query 観測ベース） | UT-08 monitoring | 観測後判断 |

## Phase 11 進行 GO / NO-GO

### GO 条件（すべて満たすこと）

- [ ] AC-1〜AC-12 すべて PASS
- [ ] 4条件最終判定が PASS
- [ ] blocker B-01〜B-04 が未着手の場合は実 D1 への apply に進めないが、spec_created 段階では Phase 11 の手動 smoke 仕様策定は可能
- [ ] MAJOR が一つもない
- [ ] open question すべてに受け皿 Phase が指定済み
- [ ] UT-09 への schema 引き渡し（主テーブル名整合）が Phase 12 で formalize される計画

### NO-GO 条件（一つでも該当）

- 4条件のいずれかに MAJOR が残る
- AC のうち PASS でないものがある
- blocker の解消条件が記述されていない
- MINOR を未タスク化せず本タスク内に抱え込む
- UT-09 との schema 命名乖離が放置される

## 実行手順

### ステップ 1: AC マトリクス再評価
- Phase 7 の AC マトリクスを基に、spec_created 視点で AC-1〜AC-12 評価。

### ステップ 2: 4条件最終判定
- Phase 3 の base case 判定を継承し、Phase 9 QA 結果で再確認。

### ステップ 3: blocker 一覧作成
- 上流タスク 3 件 + 環境準備 2 件 + 上流前提 1 件 = 6 件。

### ステップ 4: Wave 1 合流タスクへの影響整理
- UT-09 phase-08 との schema 命名差分を特定し、申し送り計画を確定。

### ステップ 5: MINOR 未タスク化方針の明文化
- 本 Phase で MINOR 0 を確認、ルールのみ記述。

### ステップ 6: GO/NO-GO 確定
- `outputs/phase-10/go-no-go.md` に判定を記述。

### ステップ 7: open question を次 Phase へ送出
- 5 件すべてに受け皿 Phase 指定。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | GO 判定を入力に手動 smoke test 実施 |
| Phase 12 | unassigned-task 候補（open question #1/#2/#3）を formalize |
| Phase 13 | GO/NO-GO 結果を PR description に転記 |
| UT-09 | 主テーブル名 `member_responses` を schema 引き渡しで反映 |
| UT-21 | audit_logs schema を audit hook の前提として利用 |

## 多角的チェック観点

- 価値性: 実フォーム回答を正本とする会員データ管理が schema 上で実現できる。
- 実現性: Phase 9 無料枠試算で 3 軸とも余裕、Phase 5 runbook で適用可能粒度。
- 整合性: 不変条件 #1〜#5 すべて satisfied、Phase 8 で命名・path 統一。
- 運用性: scripts/cf.sh 経由での migration apply / rollback が runbook 化。
- 認可境界: PII カラム識別により公開 API での返却可否が明確。
- 無料枠: storage 0.5% / reads 0.4% / writes 46% で 2 年運用想定でも余裕。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜AC-12 達成状態評価 | 10 | spec_created | 12 件 |
| 2 | 4条件最終判定 | 10 | spec_created | PASS |
| 3 | blocker 一覧作成 | 10 | spec_created | 6 件 |
| 4 | Wave 1 合流タスク影響整理 | 10 | spec_created | UT-09 schema 引き渡し |
| 5 | MINOR 未タスク化方針確定 | 10 | spec_created | ルール明文化 |
| 6 | GO/NO-GO 判定 | 10 | spec_created | GO |
| 7 | open question 送出 | 10 | spec_created | 5 件 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/go-no-go.md | GO/NO-GO 判定・AC マトリクス・blocker・4条件・UT-09 影響 |
| メタ | artifacts.json | Phase 10 状態の更新 |

## 完了条件

- [ ] AC-1〜AC-12 全件に達成状態が付与されている
- [ ] 4条件最終判定が PASS
- [ ] blocker 一覧に 6 件以上が記述されている
- [ ] Wave 1 合流タスク（UT-09）への影響が明文化されている
- [ ] MINOR 未タスク化方針が明文化されている
- [ ] GO/NO-GO 判定が GO で確定
- [ ] open question 5 件すべてに受け皿 Phase が指定
- [ ] outputs/phase-10/go-no-go.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 `outputs/phase-10/go-no-go.md` 配置予定
- AC × 4条件 × blocker × Wave 1 合流影響 × MINOR × GO/NO-GO × open question の 7 観点すべて記述
- artifacts.json の `phases[9].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 11 (手動 smoke test)
- 引き継ぎ事項:
  - GO 判定（spec_created 段階）
  - blocker 6 件（実 D1 apply 着手前に再確認必須）
  - UT-09 への schema 引き渡し計画（主テーブル名統一）
  - open question #1〜#5 を Phase 11/12 で消化
  - NON_VISUAL タスクであり Phase 11 では screenshot ではなく代替 evidence を採用
- ブロック条件:
  - 4条件のいずれかが MAJOR
  - AC で PASS でないものが残る
  - blocker の解消条件が未記述
  - UT-09 schema 整合の申し送り計画が無い
