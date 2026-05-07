# Phase 3: 設計レビューゲート

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-497 post-release-dashboard 30 日連続実行 conclusion 集計と skill feedback 化 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビューゲート |
| 作成日 | 2026-05-06 |
| 前 Phase | 2（設計 - 集計手順 / redaction / references 追記構造） |
| 次 Phase | 4（検証戦略 / NON_VISUAL / read-only） |
| 状態 | spec_created |
| 実装区分 | **ドキュメントのみ（CONST_004 例外条件適用 / コード変更なし）** |
| タスク分類 | docs-only（design review gate） |
| visualEvidence | NON_VISUAL |
| GitHub Issue | #497（CLOSED 維持） |
| Gate Phase | ✅（Phase 1 / Phase 2 戻し判定を行うゲート） |

## 目的

Phase 1（要件定義）と Phase 2（設計）の出力を、5 観点（AC-1〜AC-11 充足 / redaction 漏れリスク / 30 日 window 算出ロジック / 次アクション分岐しきい値根拠 / Issue #497 再 OPEN 禁止徹底）と 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価し、MAJOR / MINOR / PASS の判定を確定する。MAJOR が 1 件でも検出されれば Phase 1 または Phase 2 に差し戻す。GO 判定の場合 Phase 4 へ進める。

CONST_005 骨格（変更対象ファイル / テスト方針 / DoD）を Phase 2 から引き継ぎ、レビューゲート観点で漏れがないことを確認する（深掘りは Phase 5 / 6 / 9）。関数シグネチャ / 型定義 / コードテストは **N/A（コード変更なし）**。

---

## ゲート判定基準

| 判定 | 基準 | アクション |
| --- | --- | --- |
| **PASS** | 当該観点で base case が代替案より明確に優位、または同等で他制約と矛盾なし | そのまま採用 |
| **MINOR** | 軽微な懸念あり（ドキュメント追補で解消可能 / 後続 Phase で吸収可能） | base case 維持。Phase 4 / 5 で追補メモ化 |
| **MAJOR** | redaction 漏れ / 30 日 window 算出誤り / しきい値主観判定 / Issue 再 OPEN 含意 / AC 未充足 | **Phase 1 or Phase 2 に差し戻し**。当該設計を再起草 |

> **MAJOR が 1 件でも検出された場合、Phase 4 へ進まず Phase 2（設計）または Phase 1（要件定義）に戻す**。観点別に戻し先を明示する。

戻し先決定ルール:
- 「真の論点」「依存境界」「苦戦箇所」「AC 文言」関連 → **Phase 1 戻し（MAJOR 戻り）**
- 「集計手順」「redaction 設計」「references 構造」「判定式」関連 → **Phase 2 戻し（MINOR 戻り）**

---

## レビュー観点

### 観点 1: Phase 2 設計が AC-1〜AC-11 をすべて充足するか

| AC | 充足要素（Phase 2 出力） | 判定方法 |
| --- | --- | --- |
| AC-1（30 日連続期間カバー） | 軸 1-1 の 30 日 window 算出 + Phase 10 ゲート | THRESHOLD と OLDEST の比較式が機械的に判定可能か |
| AC-2（conclusion 分布表） | 軸 1-3 jq + 軸 3-2 セクション構造 | 6 conclusion 分類が分岐網羅 |
| AC-3（failure 根本原因分類表） | 軸 1-5 + 軸 3-2 サブセクション 2 | 6 カテゴリ（token / GraphQL / cron drift / schema drift / retention / その他）が定義済 |
| AC-4（連続 failure 区間） | 軸 1-4 jq reduce | 0 日明記方針が明示されている |
| AC-5（次アクション判断） | 軸 4 + 起票テンプレ | 2 分岐 + 判断根拠 + 起票 issue 番号フィールドあり |
| AC-6（changelog 1 行） | trade-off C + 出力契約 | changelog/20260506-issue497-30day-feedback.md 採用 / workflow-local close-out fallback 明示 |
| AC-7（raw JSON 保存） | trade-off B / outputs/phase-11/ | 保存先パス確定 |
| AC-8（redaction） | 軸 2 / rg コマンド | 4 パターン必須前処理 / マッチ時転記禁止方針 |
| AC-9（Issue CLOSED 据え置き） | 全 Phase の方針記述 | Phase 1 / 2 / 3 で再 OPEN 言及がない |
| AC-10（4 条件評価 PASS） | Phase 1 / 2 の 4 条件表 | 全 PASS が根拠付きで明示 |
| AC-11（Phase 12 6 成果物 + skill 同期） | Phase 12 で扱う（現時点は引き継ぎ） | 出力契約に skill-references-diff.md 含まれているか |

**判定**: 全 AC が Phase 2 出力にマップ可能であれば PASS。1 件でも欠落があれば対応戻し先（Phase 1 or 2）へ MAJOR 差し戻し。

### 観点 2: redaction 漏れリスク評価（機微情報パターン網羅性）

| 確認項目 | 期待状態 |
| --- | --- |
| `token` / `bearer` / `secret` / `Authorization` の 4 パターンが必須前処理として固定 | Phase 2 軸 2 で固定済 |
| マッチ件数 1 件以上の場合、log 内容を references に転記しない方針 | 軸 2-2 の表で明示 |
| 追加パターン（`x-api-key` / `client_secret` / `password` / cookie）の補強余地が Phase 6 に渡される | Phase 2 軸 2-3 で「Phase 6 で補強」記載 |
| references 追記後の grep 二重チェック手順が Phase 9 / 10 で扱われる引き継ぎ | Phase 2 → Phase 9 / 10 移譲明示 |

**判定方法**: Phase 2 軸 2 の redaction 設計と grep コマンドが具体化されているか確認。基本 4 パターンが欠落していれば MAJOR、追加パターン未言及なら MINOR、すべて網羅なら PASS。

### 観点 3: 30 日 window 算出ロジックの正確性

| 確認項目 | 期待状態 |
| --- | --- |
| THRESHOLD = 着手日 - 30 日（UTC ISO 8601） | Phase 2 軸 1-1 で明示 |
| OLDEST = `gh run list --json createdAt --jq '[.[].createdAt] \| min'` | 軸 1-1 で明示 |
| 30 日 gate 判定: `OLDEST <= THRESHOLD` | Phase 10 で再判定する方針あり |
| macOS BSD date / GNU date の差分が記載されている | 軸 1-1 で両方記載済 |
| 30 日 window 内のみで集計する jq filter が後続 Phase（11）に引き継がれる | 出力契約に明示 |

**判定方法**: Phase 2 軸 1-1 のコマンドと判定式を読み、tz / 日付演算が ISO 8601 文字列比較で機械的に成立するか確認。文字列比較で正しく順序判定できる（ISO 8601 は lexicographically sortable）ことが PASS の前提。誤りがあれば MAJOR（Phase 2 戻し）。

### 観点 4: 次アクション分岐 (`< 10%` / `>= 10%`) のしきい値根拠

| 確認項目 | 期待状態 |
| --- | --- |
| failure_rate の分子が `failure` + `startup_failure` + `timed_out` で確定 | Phase 2 軸 4-1 で明示 |
| `cancelled` / `action_required` を除外する根拠が記述されている | trade-off D で明示（人為的 / 外部要因） |
| 10% しきい値の妥当性根拠が記述されている | 起票元仕様（task-issue-351-...md）由来。「30 日中 3 件以上」相当の運用感覚 |
| 起票時のテンプレ（`gh issue create`）が Phase 12 に引き継がれる | Phase 2 軸 4-3 で明示 |

**判定方法**: 10% という数値が起票元仕様（unassigned-task）と起票元 Phase 12 detection の方針に整合しているか確認。主観的根拠のみで `5%` や `15%` 等に変更されていれば MINOR（Phase 2 戻し）。10% が起票元仕様と一致していれば PASS。

### 観点 5: GitHub Issue #497 を再 OPEN しない方針が全 Phase で徹底されているか

| 確認項目 | 期待状態 |
| --- | --- |
| index.md の GitHub Issue 欄に「CLOSED 維持・再 OPEN しない」明示 | ✅ |
| Phase 1 メタ情報・参照資料・苦戦箇所のいずれも `gh issue reopen` を含まない | ✅ |
| Phase 2 trade-off / 起票テンプレが「**別** unassigned task として起票」と明示 | 軸 4-2 / 4-3 で明示 |
| PR 文面が `Refs #497, Refs #351`（`Closes` / `Fixes` を使わない）で統一 | Phase 1 / index.md で明示 |

**判定方法**: 全 Phase 文書（1 / 2 / 3 / index）を grep で `gh issue reopen` / `Closes #497` / `Fixes #497` の有無確認。検出ゼロなら PASS。1 件でも検出されれば MAJOR（Phase 1 戻し）。

---

## 4 条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | Phase 2 設計が AC-1〜AC-11 全件を充足し、機械的再現性と判断分岐の客観性を確立。30 日 baseline 正本化の価値が損なわれていない |
| 実現性 | PASS | gh / jq / rg のみで完結し、コード変更ゼロ。30 日 gate / failure_rate 判定が定量化済で、後続 Phase が機械的に実行可能 |
| 整合性 | PASS | 不変条件 1〜7 すべて影響なし。aiworkflow-requirements references 構造に整合。Issue #497 再 OPEN 禁止が全 Phase で徹底 |
| 運用性 | PASS | redaction 必須前処理 / 90 日 retention 回避 ASAP 着手 / failure_rate 2 分岐 / Phase 11 evidence 駆動の Phase 10 gate が運用上機械判定可能 |

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
   修正）/ 設計再起草       - 真の論点 / 依存境界 / 苦戦箇所
                           / AC 文言関連 → Phase 1
                           - 集計手順 / redaction / references
                           / 判定式関連 → Phase 2
```

---

## 代替案比較（最低 2 案以上）

### 軸 A: 集計コマンド方式

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **A-1: `gh run list --json` + jq（base case）** | CLI ネイティブ | 環境依存少 / 再現性高 / 公式 | jq 文法習得コスト | ✅ |
| A-2: GitHub REST API 直叩き（`gh api`） | curl 互換 | 細粒度制御 | pagination / rate limit を自前管理 | - |
| A-3: GraphQL API（`gh api graphql`） | 1 query で取得 | 通信効率 | schema drift で壊れやすい | - |

**判定**: A-1 PASS（base case）/ A-2 MINOR（base 不採用）/ A-3 MAJOR（schema drift 観点 3 と矛盾）。

### 軸 B: redaction 実装

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **B-1: rg grep 4 パターン必須前処理（base case）** | log 取得 → rg → 分岐 | シンプル / 機械化容易 | パターン追加時に手修正 | ✅ |
| B-2: 自動 redaction スクリプト | placeholder 置換 | 自動化 | コード追加（CONST_004 例外と矛盾） | - |
| B-3: redaction 不要・log 全文転記 | 簡単 | - | 機微情報混入リスク（観点 2 違反） | MAJOR |

**判定**: B-1 PASS / B-2 MINOR（コード追加で実装区分逸脱）/ B-3 MAJOR（観点 2 違反）。

### 軸 C: 30 日 gate 判定タイミング

| 案 | 設計 | 利点 | 欠点 | base case |
| --- | --- | --- | --- | --- |
| **C-1: Phase 10 gate（base case）** | 最終レビューゲートで判定 | spec_created で待機可 / 仮 evidence 防止 | gate 不成立時は仕様書再起動 | ✅ |
| C-2: Phase 1 で判定 | 早期判定 | - | spec 作成と判定が直交しない | - |
| C-3: Phase 11 で判定（実行直前） | 実 gh コマンドと同時 | - | Phase 10 gate が形骸化 | MAJOR |

**判定**: C-1 PASS（index.md 実行フローと整合）/ C-2 MINOR（早すぎる判定）/ C-3 MAJOR（gate 形骸化）。

---

## 承認記録テンプレ

| 項目 | 値 |
| --- | --- |
| レビュー日 | YYYY-MM-DD |
| レビュアー | （solo dev: user 自身による self-review） |
| Phase 1 評価 | PASS / MINOR / MAJOR |
| Phase 2 評価 | PASS / MINOR / MAJOR |
| 観点 1（AC 充足） | PASS / MINOR / MAJOR |
| 観点 2（redaction 網羅） | PASS / MINOR / MAJOR |
| 観点 3（30 日 window） | PASS / MINOR / MAJOR |
| 観点 4（しきい値根拠） | PASS / MINOR / MAJOR |
| 観点 5（Issue 再 OPEN 禁止） | PASS / MINOR / MAJOR |
| 4 条件評価 | 全 PASS / 一部 MINOR / 一部 MAJOR |
| 結論 | GO（Phase 4 へ）/ Phase 1 戻し / Phase 2 戻し |
| 戻し時の差分要件 | （MAJOR / MINOR 検出時の修正項目） |
| 承認サイン | （user 承認） |

---

## 不変条件への影響

すべて影響なし（コード変更なし / D1 アクセスなし / フォーム関連変更なし）。Phase 1 / 2 と同様。

---

## DoD（Definition of Done / Phase 3）

- [ ] 5 観点（AC 充足 / redaction / 30 日 window / しきい値根拠 / Issue 再 OPEN 禁止）すべてで判定が記録されている
- [ ] 4 条件評価（価値性 / 実現性 / 整合性 / 運用性）が全 PASS で根拠付き
- [ ] 代替案比較 3 軸（集計コマンド / redaction 実装 / gate タイミング）が base case 採択理由付き
- [ ] ゲート結果分岐（PASS / MINOR / MAJOR の戻し先ルール）が明示
- [ ] 承認記録テンプレが記入可能な状態
- [ ] Issue #497 再 OPEN を含意する記述が全 Phase で検出ゼロ
- [ ] `artifacts.json.phases[2].status` が `spec_created`、`metadata.visualEvidence` が `NON_VISUAL`

---

## 次 Phase への引き渡し

- 次 Phase: 4（検証戦略 / NON_VISUAL / read-only）
- 引き継ぎ事項:
  - 5 観点 PASS 判定（または戻り経路）
  - 代替案比較 3 軸の base case 確定
  - 承認記録テンプレの記入状態
  - Phase 11 / Phase 12 で実行する集計手順 / redaction / 起票判定の引き継ぎ
- ブロック条件:
  - 5 観点のいずれかで MAJOR 検出（Phase 1 or 2 へ戻し）
  - 4 条件のいずれかが MINOR / MAJOR
  - AC-1〜AC-11 が `index.md` と乖離
  - Issue #497 が再 OPEN されている

## 実行タスク

- 本 Phase の本文に定義済みの判断、設計、検証、または文書更新を実行する。
- docs-only / NON_VISUAL 境界を維持し、コード変更が必要になった場合は Phase 1 の taskType 判定へ戻す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/index.md` | AC / scope 正本 |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | Phase 1-13 / Phase 12 strict 7 files 準拠 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | skill references 同期準拠 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| Phase spec | 本ファイル | 本 Phase の実行可能仕様 |
| outputs | `outputs/phase-XX/` | 実行時に生成する Phase evidence / summary |

## 完了条件

- [ ] 本 Phase の目的、実行タスク、成果物、次 Phase への引き渡しが矛盾なく記録されている
- [ ] docs-only / NON_VISUAL / Issue #497 CLOSED 維持の境界が崩れていない
- [ ] 必要な参照資料と evidence path が実在パスで記録されている

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、unit / integration / e2e test の追加は N/A。代替として `gh run list` raw JSON の `jq empty`、redaction grep、Phase 12 strict 7 files、aiworkflow references 同期を検証ゲートとする。
