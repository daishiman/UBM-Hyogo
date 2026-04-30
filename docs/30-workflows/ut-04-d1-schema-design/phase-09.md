# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-04-29 |
| 前 Phase | 8 (DRY 化 / リファクタリング) |
| 次 Phase | 10 (最終レビュー) |
| 状態 | spec_created |
| タスク分類 | specification-design（QA） |

## 目的

Phase 8 で確定した命名・path・型・migration 番号規約を前提に、D1 無料枠余裕度（5GB / 25M reads / 50K writes）・パフォーマンス想定（index 戦略の妥当性）・セキュリティ確認（PII カラム識別 / 暗号化方針 / 機密データ分離）・line budget・link 整合・mirror parity の 6 観点で品質保証チェックを行い、Phase 10 の GO/NO-GO 判定に必要な客観的根拠を揃える。a11y は対象外（schema 設計のため）と明記する。

## 実行タスク

1. 無料枠見積もりを別ファイル `outputs/phase-09/free-tier-estimation.md` に詳細化する（完了条件: D1 storage / reads / writes の 3 軸 × dev / production 2 環境すべての試算が記述）。
2. パフォーマンス想定（index 戦略の妥当性）を `outputs/phase-09/main.md` に記述する（完了条件: 主要クエリ × index × 想定行数の 3 軸表が完成）。
3. セキュリティ確認（PII カラム識別 / 暗号化方針 / 機密データ分離）を実施する（完了条件: PII カラム一覧 + 暗号化対象 + 分離テーブル方針が記述）。
4. line budget を確認する（完了条件: 各 phase-XX.md が 100-250 行、index.md が 250 行以内）。
5. link 検証を行う（完了条件: outputs path / artifacts.json / index.md / phase-XX.md 間のリンク切れが 0）。
6. mirror parity を確認する（完了条件: 本タスクは N/A 判定であることが明記）。
7. a11y 対象外を明記する（完了条件: 「schema 設計のため a11y 対象外」と記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/phase-08.md | DRY 化済みの命名・path |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/index.md | 想定データ量・関連サービス無料枠 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | テーブル名・カラム名規約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | D1 無料枠・wrangler 操作 |
| 必須 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠制約・D1 選定理由 |
| 参考 | https://developers.cloudflare.com/d1/platform/limits/ | D1 無料枠公式 |

## 無料枠見積もり（サマリー）

詳細は `outputs/phase-09/free-tier-estimation.md` を参照。本仕様書には主要数値のみ記載する。

### 想定データ量（main 環境 / 2 年運用想定）

| テーブル | 想定行数 | 1 行あたり平均サイズ | 合計 |
| --- | --- | --- | --- |
| `member_responses` | 2,000 行（年間 1,000 新規 × 2 年） | 約 2 KB（31 questions × 平均 60 bytes） | 約 4 MB |
| `sync_job_logs` | 4,380 行（4 sync/day × 365 × 3 年保持） | 約 300 bytes | 約 1.3 MB |
| `sync_locks` | 0〜1 行（実行中のみ） | 約 200 bytes | < 1 KB |
| `audit_logs` | 10,000 行/year × 2 年 | 約 500 bytes | 約 10 MB |
| index 合計 | 上記の 30〜50% 想定 | - | 約 5〜8 MB |
| **合計** | - | - | **約 20〜25 MB** |

### Cloudflare D1 storage（main 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 想定 storage | 約 25 MB | 2 年運用後 |
| 無料枠 | 5 GB | |
| 余裕度 | 0.5% | 極めて余裕（10 年運用しても 5% 未満） |

### Cloudflare D1 reads（main 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 想定 read/月 | 約 100,000 reads | 公開ディレクトリ閲覧 + マイページ + admin |
| 無料枠 | 25,000,000 reads/month | |
| 余裕度 | 0.4% | 極めて余裕 |

### Cloudflare D1 writes（main 環境）

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Sheets→D1 sync writes | 約 12,000 writes/month | UT-09 試算（4 sync/day × upsert 100） |
| audit_logs writes | 約 10,000 writes/month | UT-21 想定 |
| その他 admin 書き込み | 約 1,000 writes/month | |
| 合計 | 約 23,000 writes/month | |
| 無料枠 | 50,000 writes/month | |
| 余裕度 | 46% | 余裕 |

### dev 環境

| 項目 | 値 | 備考 |
| --- | --- | --- |
| storage | 約 5 MB（fixture 100 records） | 余裕 |
| writes | UT-09 と整合（約 5,000 writes/month） | 余裕 |

> **重要**: schema 単体での無料枠リスクは無いが、UT-09 の sync 頻度・UT-21 の audit log retention により writes が増える可能性があるため、`audit_logs` の retention（90 日 / 365 日）は Phase 12 で unassigned-task 候補として送出する。

## パフォーマンス想定（index 戦略の妥当性）

| 主要クエリ | テーブル | 推奨 index | 想定行数 | 想定応答 | 妥当性 |
| --- | --- | --- | --- | --- | --- |
| `SELECT * FROM member_responses WHERE response_id = ?` | member_responses | `UNIQUE (response_id)`（PK 相当） | 2,000 | < 5ms | PASS |
| `SELECT * FROM member_responses WHERE email = ?` | member_responses | `idx_member_responses_email` | 2,000 | < 5ms | PASS |
| `SELECT * FROM member_responses WHERE public_consent = 1 ORDER BY created_at DESC LIMIT 50` | member_responses | `idx_member_responses_public_consent_created_at`（複合） | 2,000 | < 10ms | PASS（公開ディレクトリ向け） |
| `SELECT * FROM sync_job_logs ORDER BY started_at DESC LIMIT 5` | sync_job_logs | `idx_sync_job_logs_started_at` | 4,380 | < 10ms | PASS |
| `SELECT * FROM audit_logs WHERE actor = ? ORDER BY created_at DESC LIMIT 100` | audit_logs | `idx_audit_logs_actor_created_at`（複合） | 20,000 | < 20ms | PASS |
| `SELECT COUNT(*) FROM member_responses` | member_responses | PK スキャン | 2,000 | < 10ms | PASS |

> **index 過多リスク**: index 1 個あたり storage が約 30〜50% 増。本設計では 4 index 以内に抑え、storage 増を 50% 未満に保つ。複合 index は「カバリング index」として頻出クエリにのみ適用。

## セキュリティ確認

### PII カラム識別

| テーブル | カラム | PII 種別 | 取扱方針 |
| --- | --- | --- | --- |
| member_responses | `email` | 個人特定可能 | 認証目的のみ参照、公開 API では返さない |
| member_responses | `name` / `kana` | 個人特定可能 | `public_consent = 1` の場合のみ公開 |
| member_responses | `phone` | 個人特定可能 | 公開しない（admin のみ） |
| member_responses | `address` | 個人特定可能 | 公開しない（admin のみ） |
| audit_logs | `actor` (email / userId) | 個人特定可能 | admin のみ閲覧 |

### 暗号化方針

| 対象 | 方針 | 理由 |
| --- | --- | --- |
| at-rest 暗号化 | Cloudflare D1 のプラットフォーム既定（Cloudflare 側で暗号化） | アプリ層追加暗号化なし |
| in-transit 暗号化 | Workers⇔D1 binding は Cloudflare 内部 TLS で完結 | アプリ層追加暗号化なし |
| field-level 暗号化 | MVP では不採用（無料枠制約 + 鍵管理コスト） | Phase 12 unassigned-task 候補として送出 |

### 機密データ分離

| 分離 | 方針 |
| --- | --- |
| Form 回答（正本） vs admin-managed data | `member_responses`（Form 由来）と `admin_notes` 等（admin 入力）を別テーブル化（不変条件 #4） |
| 同期メタデータ | `sync_job_logs` / `sync_locks` を業務テーブルから分離 |
| 監査ログ | `audit_logs` を独立テーブル化、UT-21 audit hook が単一書き込み口 |

## a11y 対象外の明記

- 本タスクは D1 schema 設計および migration ファイル作成のみで構成され、UI を持たない。
- ゆえに WCAG 2.1 / a11y 観点は本タスクで **対象外**。
- 関連の a11y 確認は schema を参照する UI タスク（公開ディレクトリ / マイページ / admin dashboard）で行う。

## line budget 確認

| ファイル | 想定行数 | budget | 判定 |
| --- | --- | --- | --- |
| index.md | 約 200 行 | 250 行以内 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-250 行 | 100-250 行 | 全 PASS |
| outputs/phase-XX/*.md | 個別判定（main.md は 200-400 行を目安） | 個別 | 個別チェック |

> 仕様書（phase-XX.md）が 100 行未満の場合は内容不足、250 行超の場合は分割を Phase 10 で検討する。

## link 検証

| チェック | 方法 | 期待 |
| --- | --- | --- |
| outputs path 整合 | artifacts.json `phases[*].outputs` × 実 path | 完全一致 |
| index.md × phase-XX.md | `Phase 一覧` 表 × 実ファイル | 完全一致 |
| phase-XX.md 内の `../` 相対参照 | 全リンク辿り | リンク切れ 0 |
| Skill reference path | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 実在確認 |
| 原典 unassigned-task 参照 | `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` | 実在 |
| UT-09 への引き渡し path | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` | 実在 |
| GitHub Issue link | `https://github.com/daishiman/UBM-Hyogo/issues/53` | 200 OK |

## mirror parity（N/A 判定）

- 本タスクは `.claude/skills/` 配下の skill 資源を更新しない（aiworkflow-requirements の reference を **参照** するのみ）。
- ゆえに `.claude` 正本と `.agents` mirror の同期は **本タスクは N/A**。
- 仮に Phase 12 documentation 更新時に skill reference を改訂した場合のみ mirror sync 義務が発生する。

## 実行手順

### ステップ 1: free-tier-estimation.md 作成
- D1 storage / reads / writes × dev / production の 6 マスを表化。
- 2 年・5 年・10 年の time-series で再計算。

### ステップ 2: index 戦略表を outputs/phase-09/main.md に記述
- 主要クエリ × index × 想定行数 × 応答時間予測。

### ステップ 3: PII / 暗号化 / 分離方針を記述
- PII カラム一覧、暗号化方針（field-level は MVP 不採用）、分離テーブル方針。

### ステップ 4: line budget 計測
- 各 phase-XX.md の `wc -l` を取り、100-250 行範囲内を確認。

### ステップ 5: link 検証
- artifacts.json / index.md / phase-XX.md の path 整合。

### ステップ 6: mirror parity / a11y 判定
- 本タスクは双方とも N/A / 対象外と明記。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | 無料枠余裕度・PII 識別・index 戦略を GO/NO-GO の根拠に使用 |
| Phase 11 | 手動 smoke 時の `.schema` 確認・NOT NULL violation 確認の前提に使用 |
| Phase 12 | implementation-guide.md の運用パートに retention / 暗号化方針未採用理由を転記 |
| UT-09 | sync writes 試算を引き渡し |
| UT-21 | audit_logs スキーマと writes 試算を共有 |

## 多角的チェック観点

- 価値性: 無料枠を超えない範囲で実フォーム正本データを保持できるか。
- 実現性: 想定行数 × index 設計が D1 の実応答時間制約に収まるか。
- 整合性: 不変条件 #1（schema 固定回避）/ #2（consent キー統一）/ #4（admin-managed data 分離）/ #5（D1 access 閉鎖）と整合。
- 運用性: PII カラム識別が公開 API 設計の前提として再利用可能。
- 認可境界: PII カラムの公開可否が `public_consent` フラグで一元管理。
- 無料枠: storage / reads / writes すべてで 50% 未満の使用率。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | free-tier-estimation.md 作成 | 9 | spec_created | 別ファイル |
| 2 | index 戦略表作成 | 9 | spec_created | 6 クエリ以上 |
| 3 | PII カラム識別 | 9 | spec_created | 5 カラム以上 |
| 4 | 暗号化方針確定 | 9 | spec_created | field-level は MVP 不採用 |
| 5 | 機密データ分離方針 | 9 | spec_created | 4 テーブル分離 |
| 6 | line budget 計測 | 9 | spec_created | 100-250 行 |
| 7 | link 検証 | 9 | spec_created | リンク切れ 0 |
| 8 | mirror parity / a11y 判定 | 9 | spec_created | 双方 N/A / 対象外 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/main.md | QA 結果サマリー（6 観点） |
| ドキュメント | outputs/phase-09/free-tier-estimation.md | D1 storage/reads/writes × dev/production 詳細試算 |
| メタ | artifacts.json | Phase 9 状態の更新 |

## 完了条件

- [ ] free-tier-estimation.md に 3 軸 × 2 環境の試算が記載
- [ ] index 戦略表に 6 クエリ以上の妥当性評価
- [ ] PII カラム識別が 5 カラム以上
- [ ] 暗号化方針（at-rest / in-transit / field-level）が確定
- [ ] 機密データ分離が 4 テーブル以上
- [ ] line budget が全 phase で 100-250 行範囲内
- [ ] link 検証でリンク切れ 0
- [ ] mirror parity が N/A と明記
- [ ] a11y 対象外と明記

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物 2 ファイルが `outputs/phase-09/` 配下に配置予定
- 無料枠余裕度が定量化されている
- PII カラム / 暗号化 / 分離が明記されている
- a11y 対象外が明記されている
- artifacts.json の `phases[8].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 10 (最終レビュー)
- 引き継ぎ事項:
  - 無料枠余裕度（storage 0.5% / reads 0.4% / writes 46%）
  - index 戦略の妥当性評価結果
  - PII カラム識別 + 暗号化方針（field-level は MVP 不採用）
  - 機密データ分離方針（4 テーブル）
  - line budget / link 整合 / mirror parity（N/A） / a11y（対象外）
- ブロック条件:
  - writes が無料枠を超え対策が無い
  - PII カラム識別漏れがある
  - link 切れが残る
