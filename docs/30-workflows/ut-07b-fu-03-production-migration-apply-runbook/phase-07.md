# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 7 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| subtype | production-migration-runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. `index.md` の AC-1〜AC-12 を、検証手段（TC / FC / Step）／検証 Phase ／証跡成果物にトレースする。
2. AC ごとに上流／下流 Phase の依存エッジを明示する。
3. 本タスクは production apply を実行しないため、Runtime AC は staging 模擬と文書整合性確認に限定し、Production AC は「文書品質ゲート」のみで close する設計を明記する。
4. 各 AC のトレース PASS 判定を出す。

## 目的

12 件の AC が Phase 4〜6 のテスト戦略・runbook 本体・異常系全てとマッピングされ、Phase 11 evidence でクローズ可能であること、かつ production への実 apply を伴わずに runbook 文書品質として close できることを保証する。

## 参照資料

- `index.md`（AC-1〜AC-12）
- `artifacts.json`
- `phase-02.md`（runbook 構造設計）
- `phase-04.md`（TC ID）
- `phase-05.md`（runbook 本体 8 セクション / Step）
- `phase-06.md`（FC ID / rollback 判断基準）

## 入力

- index.md の AC 一覧
- Phase 4 / 5 / 6 成果物

## AC × 検証 × 成果物 マトリクス

| AC | 内容 | 検証手段（TC / FC / Step） | 検証 Phase | 証跡成果物 |
| --- | --- | --- | --- | --- |
| AC-1 | runbook が `outputs/phase-05/main.md`（または同等運用手順書）として作成されている | TC-D01（必須 8 セクション存在 grep）、Phase 5 Step 全体 | Phase 5 | outputs/phase-05/main.md |
| AC-2 | commit / PR / merge 後・ユーザー承認後にのみ実行する境界が runbook 内で明記 | TC-D07（承認ゲート文言 grep）、Phase 5 Section 1 / Section 2 / Section 7 | Phase 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |
| AC-3 | 対象オブジェクト（schema_aliases / 2 UNIQUE index / backfill_cursor / backfill_status）が runbook 内で特定 | TC-D05（5 オブジェクト網羅 grep）、Phase 5 Section 1 / Section 5 | Phase 5 / 11 | outputs/phase-05/main.md |
| AC-4 | preflight（migration list / 既適用判定）の手順とコマンド具体化 | TC-D04（`--env production` grep）、Phase 5 Section 3、TC-R02（staging 模擬 list） | Phase 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |
| AC-5 | apply 手順（`bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`）と期待 exit code / 出力が記載 | TC-D03（DB 名 grep）、TC-D04（`--env production` grep）、TC-D06（wrangler 直叩き禁止 grep）、Phase 5 Section 4 | Phase 5 / 11 | outputs/phase-05/main.md |
| AC-6 | post-check（schema_aliases / index / 追加カラム存在確認）の SQL とコマンドが記載 | TC-D05、TC-R04 / TC-R05 / TC-R06（staging 模擬 SELECT・PRAGMA）、Phase 5 Section 5 | Phase 5 / 11 | outputs/phase-05/main.md, outputs/phase-11/main.md |
| AC-7 | evidence の保存項目（コマンド・出力・時刻・承認者・対象 DB・SHA）と保存先が定義 | Phase 5 Section 6（10 項目テーブル）、Phase 6 FC-15〜FC-18（混入時の redaction） | Phase 5 / 6 / 11 | outputs/phase-05/main.md, outputs/phase-06/main.md |
| AC-8 | failure handling（二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗）と停止判断条件が runbook 内で明記 | TC-N01〜N04（Negative 再現）、Phase 5 Section 7、Phase 6 FC-01〜FC-14 | Phase 5 / 6 / 11 | outputs/phase-05/main.md, outputs/phase-06/main.md |
| AC-9 | production apply を本タスク内では実行しないことが index と Phase 5 双方で明記 | TC-D07（「本タスクでは実行しない」grep）、index.md 目的・スコープ、Phase 5 運用境界・Section 1 / Section 2 | Phase 1 / 5 / 12 | index.md, outputs/phase-05/main.md, outputs/phase-12/main.md |
| AC-10 | post-check smoke は read / dryRun 系限定、destructive smoke は別承認に分離 | TC-D08（smoke 分離記述 grep）、Phase 5 Section 5 / Section 8、Phase 6 FC-13 / FC-14 | Phase 5 / 6 | outputs/phase-05/main.md, outputs/phase-06/main.md |
| AC-11 | skill 検証 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係）が PASS | Phase 4 / 5 / 6 / 7 各 4 条件評価セクション、Phase 3 / 9 / 10 のレビュー判定 | Phase 3 / 9 / 10 | outputs/phase-03/main.md, outputs/phase-09/main.md, outputs/phase-10/main.md |
| AC-12 | Phase 11 evidence に Token 値・Cloudflare API Key・Account ID 等の機密情報が含まれない | TC-E01〜E04（grep gate）、Phase 6 FC-15〜FC-18（incident 手順） | Phase 4 / 6 / 11 | outputs/phase-11/main.md（grep 0 件確認ログ） |

## 依存エッジ

| AC | 上流 Phase | 下流 Phase |
| --- | --- | --- |
| AC-1 | Phase 2（runbook 章立て設計） | Phase 5（本体作成）→ Phase 11（dry-run evidence） |
| AC-2 | Phase 1（運用境界） | Phase 5 / 11 / 13（ユーザー承認） |
| AC-3 | UT-07B（対象 SQL）／Phase 2 | Phase 5 / 11 |
| AC-4 | Phase 2 | Phase 5 Section 3 / Phase 11 |
| AC-5 | Phase 2 | Phase 5 Section 4 / Phase 11 |
| AC-6 | Phase 2 | Phase 5 Section 5 / Phase 11 |
| AC-7 | Phase 2 | Phase 5 Section 6 / Phase 6 / Phase 11 |
| AC-8 | UT-07B `rollback-runbook.md` / Phase 4 TC-N | Phase 5 Section 7 / Phase 6 |
| AC-9 | Phase 1 / index | Phase 5 / Phase 12 / Phase 13 |
| AC-10 | Phase 2 | Phase 5 Section 8 / Phase 6 FC-13 / FC-14 |
| AC-11 | Phase 4 / 5 / 6 / 7 各 4 条件評価 | Phase 3 / 9 / 10 review |
| AC-12 | Phase 4 TC-E gate | Phase 5 / 6 / 11 |

## Runtime / Documentation AC の確認タイミング

| AC | staging で確認（runbook 検証） | production で確認（実 apply） |
| --- | --- | --- |
| AC-4, AC-5, AC-6 | Phase 4 TC-R02〜R06（staging 模擬） | **本タスクでは実施しない**。Phase 13 ユーザー承認後の別運用で `outputs/phase-11/main.md` の dry-run evidence で文書整合性確認 |
| AC-1, AC-3 | Phase 5 完了時に TC-D01 / TC-D05 で文書品質確認 | 同上 |
| AC-2, AC-9 | Phase 5 完了時に TC-D07 で文書品質確認 | 同上 |
| AC-7, AC-8, AC-10 | Phase 5 / 6 完了時に TC-D08 / Phase 6 FC table で文書品質確認 | 同上 |
| AC-11 | Phase 4 / 5 / 6 / 7 各 4 条件評価セクションで PASS 判定 | Phase 9 / 10 final review |
| AC-12 | Phase 11 完了直前に TC-E01〜E04 を gate として実行 | 同（permanent gate） |

> 本タスクは「runbook 文書化」が責務であり、production への実 apply は Phase 13 承認後の別運用で行う。よって全 AC は **runbook 文書品質ゲート + staging 模擬実行** で close 可能であり、production 実 apply の成功は本タスクの完了条件に**含まない**。

## トレース PASS 判定

| AC | PASS 判定 | 根拠 |
| --- | --- | --- |
| AC-1 | PASS | Phase 5 Section 1〜8 が `outputs/phase-05/main.md` に書き下される設計。TC-D01 で機械的検証 |
| AC-2 | PASS | Phase 5 Section 2 承認ゲート 7 項目チェックリスト + Section 1 / Section 7 の境界記述。TC-D07 で grep |
| AC-3 | PASS | Phase 5 Section 1 / Section 5 で 5 オブジェクト全て特定。TC-D05 で grep |
| AC-4 | PASS | Phase 5 Section 3 で `migrations list` / schema 状態 / commit hash 確認を具体化。TC-R02 で staging 模擬 |
| AC-5 | PASS | Phase 5 Section 4 で apply コマンドと exit=0 / 適用件数=1 を明記。TC-D03 / D04 / D06 で grep |
| AC-6 | PASS | Phase 5 Section 5 に SELECT / PRAGMA SQL を具体化。TC-R04〜R06 で staging 模擬 |
| AC-7 | PASS | Phase 5 Section 6 evidence 10 項目 + 保存先 2 ファイルを定義。Phase 6 FC-15〜18 で混入時 redaction |
| AC-8 | PASS | Phase 5 Section 7 / Phase 6 FC-01〜FC-14 で 4 失敗領域 × 22 シナリオを網羅 |
| AC-9 | PASS | index.md「目的」「スコープ・含まない」「補足」と Phase 5 「運用境界」「Section 1」「Section 2」で重複明記 |
| AC-10 | PASS | Phase 5 Section 5（read-only smoke のみ）/ Section 8（destructive 別承認）/ Phase 6 FC-13 / FC-14 |
| AC-11 | PASS | Phase 4 / 5 / 6 / 7 各々で 4 条件 PASS 評価を内包 |
| AC-12 | PASS | Phase 4 TC-E01〜E04 を Phase 11 完了直前 gate に配置、Phase 6 FC-15〜FC-18 で incident 手順 |

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 全 AC が「runbook 文書品質 + staging 模擬」で close する設計に統一。production 実 apply は本タスクスコープ外と一貫 |
| 漏れなし | PASS | AC-1〜AC-12 全件が TC / FC / Step に紐付き、上流 / 下流 Phase が定義されている |
| 整合性あり | PASS | TC ID（Phase 4）／ Section ID（Phase 5）／ FC ID（Phase 6）が AC マトリクスで相互参照され、参照切れがない |
| 依存関係整合 | PASS | UT-07B（AC-3 / AC-8）／ U-FIX-CF-ACCT-01（AC-12 の Token gate）／ Phase 13 承認（AC-2 / AC-9）の上流依存が全て明示 |

## 統合テスト連携

- アプリ統合テストは追加しない。
- 全 AC は grep / `cf.sh` exit code / SQL SELECT 件数 / 文書目視のみで close する。
- production 実 apply の成功は本タスクの完了条件に含まない（Phase 13 承認後の別運用に分離）。

## 完了条件

- [ ] AC-1〜AC-12 が ID 付きで検証手段（TC / FC / Step）にマッピングされている
- [ ] 各 AC の証跡成果物が指定されている
- [ ] Runtime AC（AC-4〜AC-6）の確認は staging 模擬のみで、production 実 apply は本タスク外であることが明示されている
- [ ] 4 条件（矛盾なし / 漏れなし / 整合性 / 依存関係）が PASS と判定されている
- [ ] AC-11（4 条件 PASS）と AC-12（Token / Account ID 非記録 gate）の最終 gate タイミングが Phase 11 完了直前であることが明示されている

## 成果物

- `outputs/phase-07/main.md`
