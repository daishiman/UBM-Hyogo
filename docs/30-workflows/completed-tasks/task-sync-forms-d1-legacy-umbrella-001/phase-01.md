# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-sync-forms-d1-legacy-umbrella-001 |
| Phase 番号 | 01 |
| Phase 名称 | 要件定義 |
| Wave | -（legacy / governance） |
| 実行種別 | serial |
| 作成日 | 2026-04-30 |
| 前 Phase | -（最初の Phase） |
| 次 Phase | phase-02.md（設計） |
| 状態 | pending |

## 目的

旧 UT-09「Sheets→D1 同期ジョブ実装」を direct implementation として残すと現行の Forms API sync 仕様と二重正本が発生するため、legacy umbrella として閉じる方針を「真の論点」として確定させる。元仕様 §1〜§2 / §5 / §7 を要件として整理し、AC-1〜AC-14 を確定する。実装コードは書かない（docs-only / NON_VISUAL）。

## 真の論点（true issue）

> **旧 UT-09 を direct implementation として残すと、Google Forms API sync（現行 03a/03b）と Google Sheets API sync（旧 UT-09）の二重正本が発生し、`apps/api` に不要な Sheets 経路、別監査テーブル `sync_audit`、`responseId` / `memberId` / current response / consent snapshot の整合性破壊を招く。**

> **Why の根拠**:
> - `docs/00-getting-started-manual/specs/00-overview.md` は本サイトを「公開 / 会員 / 管理」の 3 層で定義しており、sync 経路は管理層から会員データへの単一導線として規定されている。
> - `docs/00-getting-started-manual/specs/03-data-fetching.md` は sync_jobs / cursor pagination / current response / consent snapshot を sync 契約の正本と定めており、旧 UT-09 の Sheets API 経路はこの契約と矛盾する。

つまり問題は「Sheets→D1 sync の実装が必要か否か」ではなく、「旧 UT-09 を direct task として実装せず、現行タスクへ責務を分散吸収する判断が一意にできる状態を作れるか」である。

## 依存境界

| 境界 | 内側（本タスクの責務） | 外側（本タスクの非責務） |
| --- | --- | --- |
| ドキュメント | legacy umbrella close-out 仕様書、責務移管表、移植要件リスト | 03a/03b/04c/09b/02c 各 Phase 実行、実装コード |
| データ | D1 テーブル名 / `sync_jobs` / `member_responses` の正本マッピング記録 | テーブル DDL 定義（02c/03a/03b 管轄） |
| API | `/admin/sync/schema` / `/admin/sync/responses` を正本と固定する記録 | endpoint 実装（04c 管轄） |
| 認証 | secret 名（GOOGLE_SERVICE_ACCOUNT_EMAIL 等）の参照 | secret 配備（インフラ管轄） |
| 環境 | `dev branch -> staging env` / `main branch -> production env` の正規化 | wrangler.toml 定義（09b 管轄） |

## 価値とコスト

| 観点 | 内容 |
| --- | --- |
| 価値 | (a) 実装者が stale UT-09 を参照して二重実装する事故を防ぐ、(b) D1 競合対策の知見を 03a/03b/09b に確実に移植できる、(c) 未タスク監査の 9 セクション準拠 reference example を作成 |
| コスト | docs-only タスクのため実装コスト 0、レビュー時間と Phase 12 ドキュメント生成のみ |
| 機会損失 | 放置すると AI エージェント / 実装者が直接 stale UT-09 を読み、Sheets API 経路を追加 → 後段 rollback 工数増 |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 価値性（valuable） | PASS | 二重正本リスクと監査 violation を同時解消する |
| 実現性（feasible） | PASS | docs-only であり外部依存なし。元仕様が既に存在する |
| 整合性（consistent） | PASS | CLAUDE.md 不変条件 #1 / #5 / #6 / #7 と整合、aiworkflow-requirements current facts と整合 |
| 運用性（operable） | PASS | 未タスク監査スクリプトで自動検証可能。Phase 13 は user_approval_required で運用 gate あり |

## 受入条件（AC）一覧

元仕様 §5 完了条件チェックリストから抽出。

### 機能要件 (AC-1 〜 AC-4)

- AC-1: 旧 UT-09 が direct implementation task ではなく legacy umbrella として扱われる
- AC-2: 実装対象が 03a / 03b / 04c / 09b / 02c に分解されている（direct 残責務 0 件）
- AC-3: Google Sheets API 前提ではなく Google Forms API 前提（`forms.get` / `forms.responses.list`）に統一
- AC-4: `/admin/sync/schema` と `/admin/sync/responses` を正とし、新規 `/admin/sync` を作らない

### 品質要件 (AC-5 〜 AC-9)

- AC-5: `SQLITE_BUSY` retry/backoff、短い transaction、batch-size 制限が 03a/03b 異常系で追跡
- AC-6: `sync_jobs.status='running'` の同種 job 排他で二重起動が 409 Conflict
- AC-7: Workers Cron Triggers の pause / resume / evidence が 09b runbook に記録
- AC-8: `dev branch -> staging env` / `main branch -> production env` が明記
- AC-9: 不変条件 #5（apps/web→D1 直接禁止）に違反する記述がない

### ドキュメント要件 (AC-10 〜 AC-14)

- AC-10: 未タスクテンプレートの必須 9 セクション準拠
- AC-11: filename が lowercase / hyphen の監査規則を満たす
- AC-12: stale パス `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/` を新設しない
- AC-13: 本タスクの全成果物は `docs/00-getting-started-manual/specs/01-api-schema.md` の Forms API 契約、`03-data-fetching.md` の sync_jobs / cursor pagination / current response / consent snapshot 契約、`08-free-database.md` の D1 制約と矛盾しない（追加・読み替え・新規 schema を行わない）
- AC-14: Phase 13 commit / PR はユーザー承認まで実行しない

## Open Questions（オープン論点）

| # | 論点 | 暫定方針 | 確定 Phase |
| --- | --- | --- | --- |
| OQ-1 | `sync_audit`（旧）→ `sync_jobs`（新）読み替えで履歴データを保全する必要はあるか | docs-only タスクのため履歴 schema 移行はスコープ外。02c の `sync_jobs` を新正本として運用 | Phase 2 |
| OQ-2 | Cloudflare D1 で `PRAGMA journal_mode=WAL` を運用上適用するか | Cloudflare 側 PRAGMA 互換性が未確認のため適用しない。retry/backoff で代替 | Phase 2 |
| OQ-3 | 旧 UT-09 ファイル自体を削除するか保持するか | 保持（legacy 参照記録として）。新導線では参照しない | Phase 3 |
| OQ-4 | `sync_audit` 名を含む過去ドキュメントの全置換を本タスクで行うか | 本タスクは方針記録のみ。実置換は 02c/03a/03b の Phase 12 で実施 | Phase 12 |

## 実行タスク

1. **元仕様読込**: `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` の §1〜§9 を読み込む（完了条件: 全章を要約できる）
2. **真の論点確定**: 二重正本問題を 1 文で言語化（完了条件: 上記「真の論点」セクションが他のメンバーから一意に解釈できる）
3. **依存境界マトリクス作成**: 内側 / 外側を明確化（完了条件: 上記「依存境界」表が phase-02 設計の入力として使える）
4. **AC 抽出**: 元仕様 §5 と仕様整合ゲートから AC-1〜AC-14 を抽出（完了条件: AC リストが Phase 7 の AC matrix の入力になる）
5. **4 条件評価**: 価値性・実現性・整合性・運用性を各 PASS/CONCERN/FAIL で評価（完了条件: 全 4 PASS、もしくは CONCERN なら open question 化）
6. **Open Questions 整理**: 未確定論点を Phase 2/3/12 へ送る（完了条件: OQ-1〜OQ-4 が次 Phase で解消される計画になる）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 元仕様（§1〜§9） |
| 必須 | docs/30-workflows/completed-tasks/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | schema sync 正本 |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | response sync 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | admin sync endpoint 正本 |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | cron / runbook 正本 |
| 必須 | CLAUDE.md | 不変条件 #1 / #5 / #6 / #7 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 公開 / 会員 / 管理 3 層構成と本タスクの位置（Why の根拠） |
| 必須 | docs/00-getting-started-manual/specs/03-data-fetching.md | sync_jobs / cursor pagination / current response / consent snapshot 契約（真の論点の根拠） |
| 参考 | .claude/skills/aiworkflow-requirements/references/task-workflow.md | D1 / deployment current facts |

## 実行手順

```bash
# Step 1: 元仕様読み込み
# Read tool で docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md を取得

# Step 2: 現行タスク index 突合
# Read tool で 03a / 03b / 04c / 09b / 02c の index.md を読み、責務移管先の存在を確認

# Step 3: outputs/phase-01/main.md に確定要件を書き出す
```

## 統合テスト連携

- 本 Phase の出力（AC リスト・open questions）は **Phase 2 設計** で責務移管マッピングの入力になる
- AC リストは **Phase 7 AC マトリクス** で全 Phase との対応に使われる
- Open Questions は **Phase 3 設計レビュー** で alternative 案の判定材料になる
- 不変条件チェックは **Phase 9 品質保証** で再検証される

## 多角的チェック観点（不変条件）

| 不変条件 | 本 Phase での確認 |
| --- | --- |
| #1 schema 過剰固定回避 | 旧 UT-09 が Sheets schema を固定していたが、現行は forms.get で動的取得する方針を維持 |
| #5 apps/web → D1 直接アクセス禁止 | 移植要件で apps/api 経由の sync を再確認 |
| #6 GAS prototype 本番昇格禁止 | cron は Workers Cron Triggers のみ、GAS trigger を採用しない |
| #7 Form 再回答が本人更新の正式経路 | response sync 正本性を 03b に集約 |

## サブタスク管理

- [ ] 元仕様 §1〜§9 を読み要約する
- [ ] 真の論点を 1 文で言語化する
- [ ] 依存境界マトリクスを作成する
- [ ] AC-1〜AC-14 を確定する
- [ ] 4 条件評価を実施し全 PASS を確認する
- [ ] Open Questions OQ-1〜OQ-4 を整理する
- [ ] outputs/phase-01/main.md を生成する

## 成果物

- `outputs/phase-01/main.md`: 要件定義の確定文書（真の論点 / 依存境界 / 4 条件 / AC / open questions を含む）

## 完了条件（AC）

- [ ] 真の論点が 1 文で記述されている
- [ ] AC-1〜AC-14 が抽出されている
- [ ] 4 条件評価で全 PASS、または CONCERN は open question 化済み
- [ ] 依存境界マトリクスが Phase 2 の入力に使える状態
- [ ] outputs/phase-01/main.md が生成される

## タスク 100% 実行確認

| 確認項目 | 期待値 | 実測値 |
| --- | --- | --- |
| 真の論点記述数 | 1 件 | - |
| AC 件数 | 12 件 | - |
| 4 条件 PASS 数 | 4/4 | - |
| Open Questions 件数 | ≥ 1 件（次 Phase へ送る） | - |
| outputs/phase-01/main.md 生成 | 存在 | - |

## 次 Phase への引き渡し

Phase 02（設計）へ次の inputs を渡す:

1. 真の論点と依存境界マトリクス
2. AC-1〜AC-14 リスト
3. Open Questions OQ-1〜OQ-4（特に OQ-1 sync_audit 読替、OQ-2 PRAGMA WAL 適用可否）
4. 不変条件 #1 / #5 / #6 / #7 の触れ方方針
