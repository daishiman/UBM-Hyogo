# Phase 8: DRY 化 / 重複検出

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 8 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #363（CLOSED） |

## 実行タスク

1. UT-07B 本体の Phase 5 `migration-runbook.md` / `rollback-runbook.md` と本タスク Phase 5 runbook の差分を抽出する。
2. 重複部分を「参照（include）に置き換える方針」に整理する。
3. UT-07B Phase 5（実装期 runbook）と本タスク Phase 5（production apply runbook）の責務分離を明文化する。
4. DRY 化判定（コピペになっていないか・参照で十分か）を残す。
5. 4 条件評価（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）を実施する。

## 目的

UT-07B 本体の Phase 5 にも migration / rollback runbook が存在するため、本タスク Phase 5 が
それらと同質のコピーにならないよう「責務境界」と「参照方針」を確定する。コピペを排し、
production apply に固有の preflight / 承認ゲート / failure handling のみを本タスク runbook に
集中させることで、保守時の更新コストを最小化する。

## 参照資料

- `index.md`
- `phase-05.md`（本タスクの runbook 本体仕様）
- `phase-06.md`（異常系・失敗ハンドリング）
- 比較先: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- 比較先: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`

## 入力

- UT-07B Phase 5 `migration-runbook.md`（local + staging までの実装期 runbook）
- UT-07B Phase 5 `rollback-runbook.md`（実装期失敗シナリオの rollback 表）
- 本タスク Phase 5 runbook 仕様（preflight / apply / post-check / evidence / failure handling の 5 セクション）

## 責務分離マトリクス

| 観点 | UT-07B Phase 5 migration-runbook | UT-07B Phase 5 rollback-runbook | 本タスク Phase 5 runbook |
| --- | --- | --- | --- |
| 適用対象環境 | local / staging（実装検証期） | local / staging（実装検証期） | production（`ubm-hyogo-db-prod`） |
| 起動条件 | 実装ブランチ作業中 | 実装中の失敗時 | commit / PR / merge 完了 + ユーザー明示承認 |
| 主目的 | schema 設計の実装可否確認 | 実装期の rollback 判断 | 本番適用の運用手順固定 |
| 承認ゲート | 不要（実装者判断） | 不要（実装者判断） | 必須（ユーザー承認・対象 DB 名確認） |
| evidence 保存 | UT-07B `outputs/phase-05` 内 | UT-07B `outputs/phase-05` 内 | 本タスク `outputs/phase-11/main.md`（dry-run のみ）+ 別運用タスク |
| `--env` 指定 | 暗黙（local/staging） | 暗黙（local/staging） | 明示必須（`--env production`） |
| 対象 SQL | `0008_schema_alias_hardening.sql` | 同左 | 同左 |
| 二重適用検知 | 軽量（実装中は前提が固定） | 軽量 | 厳格（preflight で `migrations list` 必須） |
| Token / Account ID 扱い | 言及なし | 言及なし | 値の記録禁止を runbook 内で明示 |
| failure handling 粒度 | 4 シナリオ（index / collision / back-fill / CPU） | 同左 | 4 シナリオ + production 固有（DB 取り違え / 二重適用 / UNIQUE 衝突 / ALTER TABLE 衝突） |

## 重複箇所と DRY 化方針

| 項目 | UT-07B Phase 5 側の記述 | 本タスク Phase 5 側の記述 | DRY 化方針 |
| --- | --- | --- | --- |
| 対象 SQL の objective 列挙（`schema_aliases` テーブル / 2 つの UNIQUE index / `schema_diff_queue` 追加カラム） | 設計意図として簡潔に列挙 | preflight / post-check のチェック対象として再列挙 | **参照に置換**: 本タスク runbook 冒頭で「対象オブジェクトの設計意図は UT-07B Phase 5 `migration-runbook.md` を参照」と link し、本タスク側はチェック観点（存在 / UNIQUE / カラム追加）のみ記述 |
| collision detection SQL（`(revision_id, stable_key)`） | 実装期の事前検出として記載 | preflight でも production 重複チェックとして必要 | **コマンドのみ再掲**: SQL 文面は UT-07B 側を canonical として参照リンクし、本タスクでは実行対象 DB 指定（`--env production`）と期待結果のみを書く |
| `__extra__:*` / `unknown` / NULL の挿入可否確認 | 実装期の動作確認項目 | post-check での退化確認 | **参照に置換**: UT-07B Phase 5 を引用し、本タスクは「production 適用後にも同条件が維持されること」のみ宣言 |
| rollback シナリオ表（index blocks / collision / back-fill 失敗 / CPU 枯渇） | 4 行の表で整理済み | production 固有 4 シナリオの追加が必要 | **継承 + 追補**: UT-07B `rollback-runbook.md` を base table として cross-reference し、本タスク Phase 6 で production 固有行（DB 取り違え / 二重適用 / UNIQUE 衝突 / ALTER TABLE 衝突）を追加する差分テーブルにする |
| `bash scripts/cf.sh` 利用ルール | 1 行のみ言及 | 全コマンドに必須 | **本タスクで強化**: 本タスク runbook 内で `wrangler` 直接実行禁止を明示し、UT-07B 側は base reference として残す |

## 責務分離の固定文言（本タスク Phase 5 で書くべきこと）

Phase 5 runbook 冒頭に以下を必須とする（重複を防ぐためのテンプレート文）:

- 「UT-07B Phase 5 `migration-runbook.md` は実装期（local / staging）の runbook である」
- 「本 runbook は production apply の運用手順であり、UT-07B Phase 5 と相補関係にある」
- 「対象 SQL の設計意図は UT-07B Phase 5 を参照し、本書では preflight / apply / post-check / evidence / failure handling のみを定義する」
- 「rollback の base table は UT-07B `rollback-runbook.md` を参照し、production 固有シナリオは Phase 6 で追補する」

## DRY 化候補の評価（YAGNI 適用）

| 候補 | 内容 | 採否 | 理由 |
| --- | --- | --- | --- |
| 統合 runbook 化 | UT-07B Phase 5 + 本タスク Phase 5 を 1 ファイルに集約 | 不採用 | 「実装期」と「production 運用期」で承認ゲート・対象環境・evidence 保存先が異なる。1 本化すると変更影響範囲が肥大化し、CLOSED 済 UT-07B 側に運用差分を遡及書き込む必要が生じる |
| 共通 SQL スニペット集 | collision SQL / introspection SQL を別ファイルに切り出し共有 | 不採用（将来候補） | 現状参照箇所は 2 タスクのみ。集約コスト > 効果。U-FIX-CF-ACCT-01 Phase 8 の「権限マトリクス集約」と同様、3 件目発生時に再評価 |
| rollback 表の継承 + 差分追補 | UT-07B `rollback-runbook.md` を base に production 固有 4 行を本タスク Phase 6 に追加 | 採用 | 既存 4 シナリオを保持しつつ、production 固有を分離して保守 |
| 設計意図の参照リンク化 | 対象オブジェクトの目的説明は UT-07B 側を canonical として参照のみ | 採用 | 本タスクは運用手順に集中し、設計説明を重複させない |
| `scripts/cf.sh` 利用ルールの集約 | 別 reference に切り出し | 不採用 | CLAUDE.md とリポジトリ root の運用ルールに既に集約済み。再度切り出す必要なし |
| 共通スクリプト化（`scripts/cf-prod-migrate.sh` 等） | preflight + apply + post-check を bash 化 | 不採用 | production apply は人間の都度承認が要件であり、自動化すると承認ゲートを逸脱する（YAGNI 違反） |

## 並列・上流タスクとの責務境界

| 領域 | 本タスク (UT-07B-FU-03) | UT-07B 本体（CLOSED） | U-FIX-CF-ACCT-01 |
| --- | --- | --- | --- |
| `0008_schema_alias_hardening.sql` の中身 | 触らない（UT-07B 完了済を前提） | 担当（CLOSED） | 触らない |
| local / staging 適用検証 | 触らない | 担当（CLOSED） | 触らない |
| production apply runbook | 担当 | 触らない | 触らない |
| Token 権限の最小化 | 利用者として参照のみ | 触らない | 担当 |
| `scripts/cf.sh` 実装 | 利用のみ | 利用のみ | 利用のみ |

## 4 条件評価

| 条件 | 評価 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | UT-07B Phase 5 と本タスク Phase 5 の責務境界（実装期 / 運用期）が排他的に定義されている |
| 漏れなし | PASS | 重複候補 6 項目すべてに採否判定と理由を付与済み。production 固有の追補項目（DB 取り違え / 二重適用 / UNIQUE 衝突 / ALTER TABLE 衝突）が Phase 6 へ橋渡し済み |
| 整合性 | PASS | CLAUDE.md `scripts/cf.sh` ルール、UT-07B canonical reference、AC-9（本タスクで production apply を実行しない）と矛盾しない |
| 依存関係整合 | PASS | 上流（UT-07B 完了）/ 上流（U-FIX-CF-ACCT-01 Token 整備）/ 下流（実 production apply 別運用タスク）の依存が破綻しない |

## navigation drift 確認

| 観点 | 結果 |
| --- | --- |
| `bash scripts/cf.sh` 命名 | OK（CLAUDE.md `scripts/cf.sh` ルールと整合） |
| `--env production` の指定統一 | OK（runbook 内で固定） |
| 対象 DB 名 `ubm-hyogo-db-prod` | OK（index / Phase 5 / Phase 6 で同一表記） |
| migration ファイル名 `0008_schema_alias_hardening.sql` | OK（UT-07B canonical と一致） |

## 統合テスト連携

- 本タスクは production runbook 文書化のみであり、アプリケーション統合テスト追加は行わない。
- 重複検出の検証は Phase 9 の line budget / リンク健全性チェック、および Phase 11 の dry-run smoke で担保する。

## 判定結果

**DRY 化適用方針: 「責務境界による分離 + 設計意図と rollback base の参照継承」**。

- 採用案 1: 設計意図の参照リンク化（UT-07B Phase 5 を canonical として cross-reference）。
- 採用案 2: rollback 表の継承 + 差分追補（UT-07B `rollback-runbook.md` を base、本タスク Phase 6 で production 固有行を追加）。
- 不採用案: 統合 runbook 化 / 共通スクリプト化 / 共通 SQL スニペット集（YAGNI および承認ゲート要件と矛盾）。
- 将来再評価: 同種 production runbook が 3 件目に到達した時点で「共通 SQL スニペット集」「権限マトリクス集約」の再評価を Phase 12 unassigned-task に記録する。

## 完了条件

- [ ] UT-07B Phase 5 / 本タスク Phase 5 の責務分離マトリクスが記録されている
- [ ] 重複箇所 5 件に DRY 化方針（参照 / 継承 / コマンドのみ再掲）が割当されている
- [ ] DRY 化候補 6 件が採否判定されている
- [ ] 4 条件評価（矛盾なし / 漏れなし / 整合性 / 依存関係整合）が PASS で記録されている
- [ ] 将来再評価条件（3 件目到達時）が unassigned-task 候補として記録されている

## 苦戦想定

**1. 統合 runbook 化への誘惑**

UT-07B Phase 5 と本タスク Phase 5 はどちらも `0008_schema_alias_hardening.sql` を扱うため、1 本化したくなる。しかし「実装期は実装者判断」「production 期はユーザー承認必須」と承認ゲートが排他的に異なるため、統合は AC-2 / AC-9 を侵害する。本 Phase で「独立 + cross-reference」を明文化しておく。

**2. CLOSED 済 UT-07B 側への遡及更新の禁止**

UT-07B 本体は CLOSED であり、`completed-tasks/` 配下に移動済みのため、本タスクから UT-07B Phase 5 ファイルを書き換えることは禁止。参照リンクのみで対応する。

**3. rollback 表の base 継承時の表記揺れ**

UT-07B `rollback-runbook.md` は英語表記、本タスクは日本語表記となる。Phase 6 で base 行を日本語へ翻訳して再掲する際、原文意図を保つ責務がある。

## 関連リンク

- 上位 index: `./index.md`
- runbook 本体: `./phase-05.md`
- 異常系: `./phase-06.md`
- UT-07B canonical: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/migration-runbook.md`
- UT-07B canonical: `../completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/rollback-runbook.md`

## 成果物

- `outputs/phase-08/main.md`
