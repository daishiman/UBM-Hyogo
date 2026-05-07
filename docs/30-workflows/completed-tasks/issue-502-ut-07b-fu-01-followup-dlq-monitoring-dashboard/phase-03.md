# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-502 UT-07B-FU-01-FOLLOWUP schema alias back-fill Queue / DLQ 監視ダッシュボード整備 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-07 |
| 前 Phase | 2（設計 - 集計 SQL / runbook 構造 / skill references 追記） |
| 次 Phase | 4（検証戦略 / NON_VISUAL / read-only） |
| 状態 | spec_created |
| 実装区分 | **ドキュメントのみ（CONST_004 例外条件適用 / コード変更なし）** |
| タスク分類 | docs-only（design review gate） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #502（CLOSED 維持） |
| Gate Phase | ✅（Phase 1 / Phase 2 戻し判定を行うゲート） |

---

## 目的

Phase 1（要件定義）と Phase 2（設計）の出力を、5 観点（AC-1〜AC-11 充足 / 集計 SQL の read-only 性 / runbook 5 章構成の AC 網羅 / skill references 追記構造の正当性 / Issue #502 再 OPEN 禁止徹底）と 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、MAJOR / MINOR / PASS の判定を確定する。MAJOR が 1 件でも検出されれば Phase 1 または Phase 2 に差し戻す。GO 判定の場合 Phase 4 へ進める。

CONST_005 骨格（変更対象ファイル / テスト方針 / DoD）を Phase 2 から引き継ぎ、レビューゲート観点で漏れがないことを確認する（深掘りは Phase 5 / 6 / 9）。関数シグネチャ / 型定義 / コードテストは **N/A（コード変更なし）**。

---

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 当該観点で base case が代替案より明確に優位、または同等で他制約と矛盾なし | そのまま採用 |
| **MINOR** | 軽微な懸念あり（ドキュメント追補で解消可能 / 後続 Phase で吸収可能） | base case 維持。Phase 4 / 5 で追補メモ化 |
| **MAJOR** | read-only 性違反 / runbook 章欠落 / skill 構造誤り / Issue 再 OPEN 含意 / AC 未充足 | **Phase 1 or Phase 2 に差し戻し**。当該設計を再起草 |

> **MAJOR が 1 件でも検出された場合、Phase 4 へ進まず Phase 2（設計）または Phase 1（要件定義）に戻す**。観点別に戻し先を明示する。

戻し先決定ルール:
- 「真の論点」「観測対象棚卸し」「依存境界」「苦戦箇所」「AC 文言」関連 → **Phase 1 戻し（MAJOR 戻り）**
- 「集計 SQL」「runbook 章構成」「skill references 構造」「cf.sh 経路」関連 → **Phase 2 戻し（MINOR 戻り）**

---

## レビュー観点

### 観点 1: Phase 2 設計が AC-1〜AC-11 をすべて充足するか

| AC | 充足要素（Phase 2 出力） | 判定方法 |
| --- | --- | --- |
| AC-1（Queue / DLQ 観測手順） | 軸 2 章 2 / 軸 4-2 / 4-3（dash + `scripts/cf.sh queues list` フォールバック） | dash 不可時の取得不能理由と代替運用手順が runbook 章 2.3 に記載。D1 SQL は AC-2 に分離 |
| AC-2（D1 集計 SQL 3 種） | 軸 1-1 / 1-2 / 1-3 | DLQ / retry / exhausted の 3 種が `SELECT` のみで構成 |
| AC-3（しきい値 DLQ≥1 / retry≥3 / exhausted24h） | 軸 1 + 軸 2 章 4 | 起票元仕様と一致 |
| AC-4（escalation 分岐） | 軸 2 章 5 + 起票テンプレ | `gh issue create` テンプレが具体化 |
| AC-5（references topic 追加） | 軸 3-1 / 3-2 | `dlq-monitoring.md` 単独 topic / 既存統合 fallback |
| AC-6（index drift なし） | 軸 3-3 | `pnpm indexes:rebuild` + `git status` 手順 |
| AC-7（read-only） | 軸 1-4 | rg grep で `INSERT/UPDATE/DELETE/DROP/ALTER/CREATE/REPLACE/TRUNCATE` 不在 |
| AC-8（binding / schema 逆引き） | 軸 3-2 topic 内 binding 表 + D1 schema 表 | aiworkflow-requirements から topic-map / keywords 経由で逆引き可能 |
| AC-9（既存変更なし） | 全 Phase の方針記述 | コード / migration / wrangler.toml / API contract に変更なし |
| AC-10（4 条件評価 PASS） | Phase 1 / 2 の 4 条件表 | 全 PASS が根拠付きで明示 |
| AC-11（Phase 12 strict 7 成果物 + runbook + skill 同期） | Phase 12 で扱う（現時点は引き継ぎ） | 出力契約に `main.md` を含む strict 7、runbook、skill references / changelog / indexes が含まれているか |

**判定**: 全 AC が Phase 2 出力にマップ可能であれば PASS。1 件でも欠落があれば対応戻し先（Phase 1 or 2）へ MAJOR 差し戻し。

### 観点 2: 集計 SQL の read-only 性

| 確認項目 | 期待状態 |
| --- | --- |
| 集計 SQL 3 種が `SELECT` のみで構成されている | Phase 2 軸 1-1 / 1-2 / 1-3 確認済 |
| 機械検証コマンド（`rg -i -e 'INSERT\|UPDATE\|DELETE\|DROP\|ALTER\|CREATE\|REPLACE\|TRUNCATE'`）が runbook + 仕様書本文を対象に走る | 軸 1-4 で明示 |
| `last_error` を SELECT 句に含めない（redaction 観点） | 軸 1-2 / 軸 2 章 3 で明示 |
| `bash scripts/cf.sh d1 execute` 経由で `wrangler` 直接実行を回避 | 軸 4-1 で明示 |

**判定方法**: Phase 2 軸 1 / 4 の SQL と grep コマンドを確認。read-only 不変条件違反（書き換え系の混入）が検出されたら MAJOR（Phase 2 戻し）。`last_error` SELECT 含めれば MINOR（Phase 2 戻し / redaction 補強）。

### 観点 3: runbook 5 章構成が AC-1〜AC-4 を網羅するか

| 章 | 対応 AC | 期待状態 |
| --- | --- | --- |
| 1. 前提と対象 | AC-8 | binding 名 4 個 + D1 列 5 種が列挙 |
| 2. Queue / DLQ 観測手順 | AC-1 | dash + `scripts/cf.sh queues list` フォールバック + プラン制限時の取得不能理由注記。D1 SQL は AC-2 |
| 3. D1 集計 SQL | AC-2 / AC-7 | 3 種 SQL すべて `SELECT` |
| 4. 異常しきい値 | AC-3 | DLQ ≥ 1 / retry ≥ 3 / exhausted 24h |
| 5. エスカレーション分岐 | AC-4 | 観測のみ / 別 unassigned task 起票 + テンプレ |

**判定方法**: 5 章のいずれかが欠落していれば MAJOR（Phase 2 戻し）。サブ項目の追補で済むレベルなら MINOR。

### 観点 4: skill references 追記構造の正当性

| 確認項目 | 期待状態 |
| --- | --- |
| `references/dlq-monitoring.md` 単独 topic が base case | 軸 3-1 で明示 |
| topic 内に binding 表 / D1 schema 表 / 関連 runbook / 関連実装 4 セクション | 軸 3-2 で明示 |
| `pnpm indexes:rebuild` で `topic-map` / `keywords.json` / `quick-reference` / `resource-map` 4 種が drift なし | 軸 3-3 で明示 |
| 既存 observability topic への統合可能性が Phase 5 で再評価される旨記述 | 軸 3-1 fallback 明示 |

**判定方法**: 単独 topic 構造が AC-5 / AC-8 を充足するか確認。topic 内 4 セクションが欠落していれば MINOR、`pnpm indexes:rebuild` 手順が抜けていれば MAJOR（AC-6 違反 / Phase 2 戻し）。

### 観点 5: GitHub Issue #502 を再 OPEN しない方針が全 Phase で徹底されているか

| 確認項目 | 期待状態 |
| --- | --- |
| index.md の GitHub Issue 欄に「CLOSED 維持・再 OPEN しない」明示 | ✅ |
| Phase 1 メタ情報・参照資料・苦戦箇所のいずれも `gh issue reopen 502` を含まない | ✅ |
| Phase 2 trade-off / 起票テンプレが「**別** unassigned task として起票」と明示 | 軸 2 章 5 / Phase 5 引き継ぎで明示 |
| PR 文面が `Refs #502, Refs #UT-07B-FU-01`（`Closes` / `Fixes` を使わない）で統一 | Phase 1 / index.md で明示 |

**判定方法**: 全 Phase 文書（1 / 2 / 3 / index）を grep で `gh issue reopen 502` / `Closes #502` / `Fixes #502` の有無確認。検出ゼロなら PASS。1 件でも検出されれば MAJOR（Phase 1 戻し）。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Phase 2 設計が AC-1〜AC-11 全件を充足し、Queue / DLQ + D1 失敗永続化列を runbook 単一 view で観測する正本ベースラインの価値が損なわれていない |
| 実現性 | PASS | `scripts/cf.sh` / D1 read-only SQL / markdown 追記 / `pnpm indexes:rebuild` のみで完結。コード変更ゼロ。Queue Analytics プラン制限時は AC-1 を境界付き PASS、D1 SQL は AC-2 の正本観測経路として扱う |
| 整合性 | PASS | 不変条件 1〜7 すべて影響なし。aiworkflow-requirements references 構造に整合。Issue #502 再 OPEN 禁止が全 Phase で徹底 |
| 運用性 | PASS | read-only 不変条件 / staging count=0 許容 / しきい値起票元仕様継承 / `wrangler` 直接禁止が全観点で機械判定可能 |

---

## ゲート結果分岐

```
              [全観点 PASS]
                   │
                   ▼
              Phase 4 へ進む
                   │
       ┌───────────┴───────────┐
       │                       │
   [MINOR 検出]            [MAJOR 検出]
       │                       │
       ▼                       ▼
   Phase 2 戻り（軽微     観点別戻し先へ:
   修正）/ 設計再起草       - 真の論点 / 観測対象 / 依存境界
                             / 苦戦箇所 / AC 文言関連 → Phase 1
                           - 集計 SQL / runbook 章 / skill references
                             / cf.sh 経路関連 → Phase 2
```

---

## 代替案比較（最低 2 案以上）

### 軸 A: 集計実行経路

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **A-1: `bash scripts/cf.sh d1 execute`（base case）** | 1Password 経由 token 注入 + esbuild 解決 + Node 24 保証 | プロジェクト規約準拠 / 機微情報事故防止 | wrapper 介在 | ✅ |
| A-2: `wrangler d1 execute` 直接 | シンプル | CLAUDE.md「`wrangler` 直接禁止」違反 | - | MAJOR（規約違反）|
| A-3: D1 HTTP API 直叩き | 最汎用 | token 値を環境変数で扱う必要 / 機微情報事故リスク | - | - |

**判定**: A-1 PASS / A-2 MAJOR（規約違反）/ A-3 MINOR（運用上不採用）。

### 軸 B: 集計 SQL の出力粒度

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **B-1: COUNT + LIMIT 50 row（base case）** | 異常判定 + 異常 row 特定が 1 回で完結 | 出力長め | - | ✅ |
| B-2: COUNT のみ | 最短 | 異常 row 特定に 2nd SQL 必要 | - | MINOR |
| B-3: 全 row 出力 | 完全情報 | スケール時に出力膨張 | - | - |

**判定**: B-1 PASS / B-2 MINOR / B-3 MINOR（運用上不採用）。

### 軸 C: skill references topic 配置

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **C-1: 単独 topic `dlq-monitoring.md`（base case）** | resource-map / topic-map で逆引き容易 | 既存 observability topic と分散 | - | ✅ |
| C-2: 既存 observability topic 統合 | DRY | 統合先選定 / 構造の歪みリスク | - | fallback |
| C-3: 既存 deployment topic 統合 | プロジェクト整合 | 「DLQ 監視」が deployment 観点と直交 | 観念的不整合 | - |

**判定**: C-1 PASS / C-2 MINOR（Phase 5 で再評価）/ C-3 MAJOR（観念的不整合）。

---

## 承認記録テンプレ

| 項目 | 値 |
| --- | --- |
| レビュー日 | YYYY-MM-DD |
| レビュアー | （solo dev: user 自身による self-review） |
| Phase 1 評価 | PASS / MINOR / MAJOR |
| Phase 2 評価 | PASS / MINOR / MAJOR |
| 観点 1（AC 充足） | PASS / MINOR / MAJOR |
| 観点 2（read-only） | PASS / MINOR / MAJOR |
| 観点 3（runbook 5 章） | PASS / MINOR / MAJOR |
| 観点 4（skill references 構造） | PASS / MINOR / MAJOR |
| 観点 5（Issue 再 OPEN 禁止） | PASS / MINOR / MAJOR |
| 4 条件評価 | 全 PASS / 一部 MINOR / 一部 MAJOR |
| 結論 | GO（Phase 4 へ）/ Phase 1 戻し / Phase 2 戻し |
| 戻し時の差分要件 | （MAJOR / MINOR 検出時の修正項目） |
| 承認サイン | （user 承認） |

---

## 不変条件への影響

すべて影響なし（コード変更なし / D1 アクセス点はコード経路で不変 / フォーム関連変更なし）。Phase 1 / 2 と同様。

---

## DoD（Definition of Done / Phase 3）

- [ ] 5 観点（AC 充足 / read-only / runbook 5 章 / skill references 構造 / Issue 再 OPEN 禁止）すべてで判定が記録されている
- [ ] 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- [ ] 代替案比較 3 軸（実行経路 / SQL 粒度 / skill topic 配置）が base case 採択理由付き
- [ ] ゲート結果分岐（PASS / MINOR / MAJOR の戻し先ルール）が明示
- [ ] 承認記録テンプレが記入可能な状態
- [ ] Issue #502 再 OPEN を含意する記述が全 Phase で検出ゼロ
- [ ] `artifacts.json.phases[2].status` が `spec_created`、`metadata.visualEvidence` が `NON_VISUAL`

---

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略 / NON_VISUAL / read-only）
- 引き継ぎ事項:
  - 5 観点 PASS 判定（または戻り経路）
  - 代替案比較 3 軸の base case 確定
  - 承認記録テンプレの記入状態
  - Phase 11 / Phase 12 で実行する集計 SQL / skill references 追記 / index 再生成の引き継ぎ
- ブロック条件:
  - 5 観点のいずれかで MAJOR 検出（Phase 1 or 2 へ戻し）
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-11 が `index.md` と乖離
  - Issue #502 が再 OPEN されている

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| Phase spec | 本ファイル | 本 Phase の実行可能仕様 |
| outputs | `outputs/phase-03/` | レビュー結果（必要時） |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #502 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として 集計 SQL の `rg` read-only grep、staging D1 dry-run、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
