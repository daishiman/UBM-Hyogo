# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-01 |
| 前 Phase | 2（設計 - DB 制約 + 再開可能 back-fill + retryable contract） |
| 次 Phase | 4（検証戦略） |
| 状態 | spec_created |
| タスク分類 | implementation（design review gate） |
| visualEvidence | NON_VISUAL |

## 目的

Phase 2 で確定した 4 成果物 (`db-constraint-design.md` / `resumable-backfill-design.md` / `retryable-contract-design.md` / `large-scale-measurement-plan.md`) に対し、最低 2 案以上の代替案を比較し、4 条件（価値性 / 実現性 / 整合性 / 運用性）+ 観点別（不変条件 #5、2 段階 migration 順序、idempotent 性、HTTP semantic、queue 分離 follow-up 判断）に対する PASS / MINOR / MAJOR 判定を確定し、Phase 4 以降に進むための着手可否ゲートを通すこと。

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 当該観点で base case が代替案より明確に優位、または同等で他制約と矛盾なし | そのまま採用 |
| **MINOR** | 軽微な懸念あり（例: ドキュメント追補で解消可能 / 後続 Phase で吸収可能） | base case 維持。Phase 4-5 で追補メモ化 |
| **MAJOR** | 不変条件違反 / 採択理由が代替案で覆る / idempotent 破綻 / migration 順序逆転 | **Phase 2 に差し戻し**。当該設計を再起草 |

> **MAJOR が 1 件でも検出された場合、Phase 4 へ進まず Phase 2 に戻す**。

## 代替案比較（最低 2 案以上）

### 軸 A: DB constraint

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **A-1: partial UNIQUE index（base case）** | `WHERE stable_key IS NOT NULL AND != 'unknown' AND NOT LIKE '__extra__:%'` | 確定済キーだけ守る。既存 `unknown` / 暫定行と共存可能。SQLite ネイティブ機能 | partial 条件のメンテが必要 | ✅ |
| A-2: 全行 UNIQUE | `UNIQUE(revision_id, stable_key)` | DDL がシンプル | 既存 `unknown` 重複行で migration 失敗 | - |
| A-3: trigger による INSERT/UPDATE 検証 | `BEFORE INSERT/UPDATE` trigger で SELECT して衝突なら RAISE | 細かい制御可 | 複雑性増。partial unique と同等性能を得にくい | - |
| A-4: app pre-check のみ継続（現状維持） | DB 制約なし | 変更ゼロ | race condition 残る（本タスクの目的を達成しない） | - |

**判定**: A-1 PASS。A-2 は MAJOR（migration 失敗）。A-3 は MINOR（複雑性）。A-4 は MAJOR（目的未達）。

### 軸 B: alias 確定 / back-fill 責務分離

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **B-1: Stage 1（即時 commit）+ Stage 2（cursor 管理 / 再開可能）（base case）** | `schema_diff_queue.backfill_cursor/status` で進捗保持 | 中間状態が「正常な継続中」として表現可能。retry で残件のみ処理 | カラム 2 つ追加（migration 1 段階増） | ✅ |
| B-2: 単一 transaction（現状） | 既存実装 | 状態管理不要 | CPU budget 超過で全 rollback。alias 確定すら巻き戻る | - |
| B-3: Stage 2 を完全に Workers Queue / Cron に移譲 | apply は alias 確定のみ。back-fill は Queue producer | 即時応答。スケール容易 | 実装規模増。本タスクスコープ超え。Phase 11 実測次第で follow-up | - |

**判定**: B-1 PASS。B-2 は MAJOR（中間不整合）。B-3 は MINOR（follow-up 候補）。

### 軸 C: retryable HTTP contract

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **C-1: 200 / 202 in_progress / 202 exhausted / 409 / 422（base case）** | semantic に沿った 5 ケース分岐 | 監視 / 自動 retry が HTTP status のみで判別可能 | ケース数増 | ✅ |
| C-2: 全部 200 + body の `status` フィールドで判別 | レスポンス構造が均一 | HTTP semantic を弱める。標準的な retry 機構と相性悪 | - | - |
| C-3: 202 ではなく 503 で retry 指示 | RFC 的に retry-after を返す慣例 | クライアント / インフラエラーと混同。意味論ねじれ | - | - |

**判定**: C-1 PASS。C-2 は MINOR。C-3 は MAJOR（意味論ねじれ）。

### 軸 D: queue / cron 分離の本タスク内採否

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **D-1: 本タスクは cursor 管理 retry 方式で完結。queue 分離は Phase 11 実測結果次第で follow-up 起票（base case）** | YAGNI | 本タスクスコープが膨張しない。実測 evidence ベースで判断 | 100,000 行で恒常的に CPU 超過する場合は次タスクで再着手 | ✅ |
| D-2: 本タスクで queue 分離まで実装 | 1 タスクで完結 | 規模膨張・PR 巨大化・実測なしで設計判断 | scope creep | - |
| D-3: cursor 管理を入れず queue / cron に直行 | シンプル | 即時 retry が効かない（次の cron まで待つ）。UX 劣化 | - | - |

**判定**: D-1 PASS。D-2 は MINOR（scope）。D-3 は MAJOR（UX）。

## 4 条件再評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | DB 物理制約 + 責務分離 + retryable contract + 実測の 4 軸を一括で閉じ、運用昇格の前提が揃う |
| 実現性 | PASS | partial UNIQUE / cursor 管理 / 202 contract / fixture 生成いずれも既存スタックで実装可能 |
| 整合性 | PASS | 不変条件 #5 を侵さない（apps/api 内で完結）。UT-04 schema 変更とも独立適用可 |
| 運用性 | PASS | 衝突検出 SQL → 解消 → partial UNIQUE 適用の 2 段階順序が固定。retryable response で運用復旧手順が明確 |

## レビュー観点別判定

| 観点 | 判定 | 根拠・残課題 |
| --- | --- | --- |
| 不変条件 #5（D1 アクセスは apps/api 限定） | PASS | migration / repository / workflow / route すべて apps/api 配下 |
| 2 段階 migration 順序（衝突検出 → 解消 → partial UNIQUE） | PASS | `db-constraint-design.md` で固定。Phase 5 runbook で実行手順化 |
| idempotent 性（back-fill 二重 UPDATE 不発生） | PASS | `id > cursor` での走査により同じ行を再 UPDATE しない。`resumable-backfill-design.md` 進行表で証明 |
| HTTP semantic（202 + retryable: true） | PASS | 200 / 202 / 409 / 422 が responsibility ごとに分離 |
| queue / cron 分離 follow-up 判断条件 | PASS（追補要） | Phase 11 実測結果が 100,000 行で 3 retry 以下に収束しない場合は follow-up 起票（条件は `large-scale-measurement-plan.md` で固定） |
| `__extra__:<questionId>` / `unknown` の partial UNIQUE 除外 | PASS | partial 条件で除外され暫定状態の自由度を保つ |
| 既存衝突検出 SQL の網羅性 | （Phase 2 実行時確認） | staging で実 SQL を実行し、確定 stableKey 重複ゼロを確認したうえで migration 適用 |

## 着手可否ゲート

- すべての軸（A / B / C / D）と観点が **PASS**: Phase 4 へ GO。
- いずれかが **MINOR**: 残課題として記録し Phase 4 へ GO（Phase 5 runbook で追補吸収）。
- いずれかが **MAJOR**: NO-GO。Phase 2 に差し戻し当該成果物を再起草。

## 残課題（open question）

| # | 内容 | 委譲先 |
| --- | --- | --- |
| 1 | 100,000 行実測で恒常的に CPU 超過する場合の queue / cron 分離実装 | 別タスク（follow-up 起票・条件は Phase 11 で確定） |
| 2 | admin UI 側の 202 / retryable レスポンス対応（自動 polling） | 別タスク（管理画面側 UI 改修） |
| 3 | `aiworkflow-requirements/references/api-endpoints.md` / `database-schema.md` 同期更新 | 本タスク Phase 12（documentation 同期） |
| 4 | 監視アラート（`backfill.status='failed'` 検知）の閾値設計 | 別タスク（監視ダッシュボード） |

## 実行タスク

1. 軸 A / B / C / D それぞれで最低 2 案の代替案比較表を `outputs/phase-03/main.md` に記述する（完了条件: 各軸 2 案以上 + base case フラグ + 利点 / 欠点が表形式）。
2. 4 条件 PASS / MINOR / MAJOR 判定を根拠付きで記述する（完了条件: 4 セルすべてに判定 + 根拠）。
3. 観点別判定（不変条件 #5、migration 順序、idempotent、HTTP semantic、queue 分離、partial 除外、衝突検出網羅）を表化する（完了条件: 7 観点すべてに判定）。
4. 着手可否ゲート判定を実施し、GO / NO-GO を明示する（完了条件: 判定結果が文書化）。
5. 残課題を別タスク・別 Phase に振り分ける（完了条件: open question 表で委譲先が明示）。
6. MAJOR 検出時の Phase 2 戻しトリガを定義する（完了条件: 「MAJOR 1 件で戻し」基準が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/phase-02.md | レビュー対象設計 |
| 必須 | outputs/phase-02/db-constraint-design.md | base case の partial UNIQUE 設計 |
| 必須 | outputs/phase-02/resumable-backfill-design.md | base case の cursor 管理設計 |
| 必須 | outputs/phase-02/retryable-contract-design.md | base case の HTTP contract |
| 必須 | outputs/phase-02/large-scale-measurement-plan.md | base case の measurement plan |
| 必須 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 起票仕様 |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/api 境界制約 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 規約 |

## 完了条件チェックリスト

- [ ] 軸 A / B / C / D それぞれで最低 2 案の代替案比較が記述
- [ ] 4 条件評価マトリクスに空セルゼロ
- [ ] 観点別判定 7 件（不変条件 #5、migration 順序、idempotent、HTTP semantic、queue 分離、partial 除外、衝突検出網羅）すべてに判定
- [ ] PASS / MINOR / MAJOR の判定基準が文書化
- [ ] 着手可否ゲート（GO / NO-GO）が明示
- [ ] MAJOR 検出時の Phase 2 戻しトリガが定義
- [ ] 残課題が委譲先付きで列挙
- [ ] 不変条件 #5 違反ゼロ
- [ ] queue / cron 分離 follow-up 起票条件が `large-scale-measurement-plan.md` と整合

## 多角的チェック観点

- **代替案網羅性**: A-2（全行 UNIQUE）/ B-2（単一 transaction）/ C-3（503 retry）/ D-3（cursor なし queue 直行）の各リスクが本 Phase で **明示的に却下されている** こと（暗黙却下は不可）。
- **不変条件 #5**: 設計が apps/api 内に閉じ、`apps/web` から D1 binding を直接参照させる経路が含まれていないか。
- **migration 可逆性**: partial UNIQUE 適用後の rollback 手順（DROP INDEX）が記載されているか、衝突解消手順（`unknown` 戻し / 手動マージ）が `db-constraint-design.md` に存在するか。
- **idempotent 性破綻シナリオ**: cursor が進まないループ条件（同 LIMIT で 0 行返るが status が `in_progress` 残置）が Phase 6 異常系へ引き継がれているか。
- **HTTP semantic ねじれ**: 202 と 200 の境界（`backfill.status='completed'` のみ 200）が一意か。
- **YAGNI**: D-2（queue 分離を本タスクで実装）の scope creep 性が記述されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 軸 A 代替案比較（partial / 全行 / trigger / app のみ） | 3 | pending | A-1 採択 |
| 2 | 軸 B 代替案比較（Stage 分離 / 単一 trans / Queue 直行） | 3 | pending | B-1 採択 |
| 3 | 軸 C 代替案比較（202 / 200 一本 / 503） | 3 | pending | C-1 採択 |
| 4 | 軸 D 代替案比較（cursor / queue 即実装 / cursor なし queue） | 3 | pending | D-1 採択 |
| 5 | 4 条件再評価 | 3 | pending | 全 PASS |
| 6 | 観点別判定（7 件） | 3 | pending | 全 PASS or MINOR |
| 7 | 着手可否ゲート判定 | 3 | pending | GO / NO-GO 明示 |
| 8 | 残課題の委譲先確定 | 3 | pending | follow-up 起票 / Phase 12 / UI 別タスク / 監視 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 設計レビューゲート結果（代替案比較 / 4 条件 / 観点別判定 / GO-NO-GO / 残課題） |
| メタ | artifacts.json | Phase 3 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created` へ遷移
- 軸 A / B / C / D の代替案比較がすべて 2 案以上
- 4 条件評価が全 PASS
- 観点別判定 7 件が全件評価済み
- MAJOR ゼロ（MINOR は許容）
- artifacts.json の `phases[2].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略）
- 引き継ぎ事項:
  - 軸 A / B / C / D の base case 確定（partial UNIQUE / Stage 分離 + cursor / 202 retryable / cursor 方式で完結）
  - 4 条件評価 全 PASS
  - 残課題（queue 分離 follow-up / UI polling / aiworkflow-requirements 同期 / 監視アラート）の委譲先
  - 2 段階 migration 順序（衝突検出 → 解消 → partial UNIQUE）
  - queue / cron 分離 follow-up 起票条件（100,000 行で 3 retry 超 / failed 多発）
- ブロック条件:
  - MAJOR 検出時 → Phase 2 戻し
  - 4 条件いずれかが MAJOR
  - 観点別判定で不変条件違反 / idempotent 破綻 / migration 順序逆転
  - 代替案比較が 2 案未満

## 統合テスト連携

- 本 Phase の検証観点は `apps/api` 配下の unit / route / workflow integration test に接続する。
- D1 物理制約、`schema_aliases` write target、back-fill retry、NON_VISUAL evidence は Phase 4 / Phase 9 / Phase 11 で実測またはテスト証跡へ連結する。
