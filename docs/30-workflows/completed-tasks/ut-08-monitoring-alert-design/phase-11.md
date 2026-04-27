# Phase 11: 手動 smoke テスト（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | 手動 smoke テスト（NON_VISUAL） |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |
| タスク種別 | design / non_visual / spec_created |
| Phase 11 モード | **NON_VISUAL**（screenshot 不要） |
| 証跡の主ソース | 自動チェックスクリプト + リンクチェック + 設計成果物の参照整合性確認 |
| screenshot を作らない理由 | 本タスクは設計成果物（Markdown ドキュメント）のみで UI 変更がないため、視覚比較対象が存在しない |

---

## 目的

UT-08 は設計タスク（spec_created / non_visual）のため、Phase 11 では UI スクリーンショット検証ではなく、
**設計成果物の参照整合性とリンク有効性に対する非視覚 smoke テスト**を実施する。
SKILL.md「UBM-002 / UBM-003」に従い、必須 outputs は以下 3 点。

- `outputs/phase-11/main.md`（Phase 11 サマリー）
- `outputs/phase-11/manual-smoke-log.md`（自動チェック実行ログ）
- `outputs/phase-11/link-checklist.md`（リンク確認結果）

> 視覚タスク用の `manual-test-checklist.md` / `manual-test-result.md` / `screenshot-plan.json` は本 Phase では作成しない。

---

## 実行タスク

- [ ] `outputs/phase-11/main.md` を作成し、smoke テストの実施意図と証跡サマリーを記載する
- [ ] 設計成果物の自動チェック（artifact 名一致・JSON validity・line budget）を実行する
- [ ] 設計成果物リンクの参照切れチェックを行い `link-checklist.md` に結果を記録する
- [ ] 05a 既存ファイル（`observability-matrix.md` / `cost-guardrail-runbook.md` / その他 phase-NN）への参照整合を全件確認する
- [ ] 自動チェック結果を `manual-smoke-log.md` に保存する
- [ ] AC-10（05a 整合性 smoke チェック）の判定を確定する

---

## smoke テスト範囲

### 11-1. 自動チェック（manual-smoke-log.md に記録）

| チェック | 実行コマンド例 | 期待結果 |
| --- | --- | --- |
| artifact 名整合 | `node .claude/skills/task-specification-creator/scripts/validate-phase-output.js --workflow docs/30-workflows/ut-08-monitoring-alert-design --phase all` | 全 phase で PASS |
| artifacts.json schema | JSON parse + schema validation | parse 成功 |
| line budget | `wc -l outputs/phase-02/*.md docs/30-workflows/ut-08-monitoring-alert-design/phase-*.md` | Phase 9 の上限内 |
| 05a 参照存在 | `grep -rn "05a-parallel-observability-and-cost-guardrails" docs/30-workflows/ut-08-monitoring-alert-design/` で抽出した全パスに対して `test -e` | 全件存在 |

### 11-2. リンクチェック（link-checklist.md に記録）

| 起点 | 確認対象リンク | PASS / FAIL |
| --- | --- | --- |
| `index.md` | 必須参照表の各パス | |
| `phase-01.md` 〜 `phase-13.md` | 参照資料セクションの全パス | |
| `outputs/phase-02/monitoring-design.md` | 個別成果物 8 種への内部リンク | |
| `outputs/phase-02/runbook-diff-plan.md` | 05a `observability-matrix.md` / `cost-guardrail-runbook.md` への参照 | |
| `outputs/phase-12/implementation-guide.md`（Phase 12 で作成） | 設計成果物への参照 | （Phase 12 完了後に再チェック） |

### 11-3. 05a 整合性確認（AC-10 判定）

| 確認項目 | 期待 | 判定 |
| --- | --- | --- |
| 05a 既存ファイル（`observability-matrix.md` / `cost-guardrail-runbook.md`）が**上書きされていない** | 不変条件 1 遵守 | PASS / FAIL |
| `runbook-diff-plan.md` が 05a の追記計画として記述されている（差分追記方針） | 不変条件 1 遵守 | PASS / FAIL |
| 05a 参照リンクが全件有効 | 11-1 の grep 結果と一致 | PASS / FAIL |

---

## 必須 outputs テンプレート

### `outputs/phase-11/main.md`

```markdown
# Phase 11: 手動 smoke テスト（NON_VISUAL）サマリー

## メタ情報
| 項目 | 値 |
| --- | --- |
| 実施日 | YYYY-MM-DD |
| 実施者 | <担当者名> |
| Phase 11 モード | NON_VISUAL |
| 証跡の主ソース | 自動チェックログ + リンクチェック結果 |
| screenshot を作らない理由 | 設計成果物のみで UI 変更なし |

## 実施結果サマリー
- 自動チェック: PASS / FAIL（詳細は `manual-smoke-log.md`）
- リンクチェック: PASS / FAIL（詳細は `link-checklist.md`）
- 05a 整合性（AC-10）: PASS / FAIL

## AC-10 判定
（PASS / FAIL の根拠）

## 検出された問題と対処
（問題が無い場合は「検出なし」）
```

### `outputs/phase-11/manual-smoke-log.md`

```markdown
# 自動チェック実行ログ

## 実施日: YYYY-MM-DD
## 実施環境: <Node version> / <pnpm version> / mise

## チェック 1: artifact 名整合
コマンド:
```
（実行コマンド）
```
結果:
```
（出力）
```
判定: PASS / FAIL

## チェック 2: artifacts.json schema
（同上）

## チェック 3: line budget
（同上）

## チェック 4: 05a 参照存在
（同上）
```

### `outputs/phase-11/link-checklist.md`

```markdown
# リンクチェック結果

| 起点ファイル | リンク先 | 種別 | 結果 | 備考 |
| --- | --- | --- | --- | --- |
| index.md | docs/01-infrastructure-setup/05a-.../index.md | 既存 doc | PASS / FAIL | |
| ... | ... | ... | ... | ... |

## 集計
- 総リンク数: N
- PASS: N
- FAIL: N
- FAIL のあるリンクは Phase 2 / Phase 8 へ差し戻し
```

---

## 統合テスト連携

本タスクは spec_created / non_visual の設計タスクであり、この Phase では実装コード・外部監視設定・Secret 投入を実行しない。統合テスト連携は、後段 Wave 2 実装タスクが本 Phase の成果物を入力として実行する。

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| 後段 Wave 2 実装タスク | WAE 計装、外形監視設定、通知疎通、D1 / Sheets 失敗検知テスト | 設計・検証観点を定義し、実行は委譲 |
| UT-09 | Sheets→D1 同期失敗検知ルール | UT-09 完了後に閾値とイベント名を再確認 |
| UT-07 | 通知基盤との接続 | 通知チャネル候補として参照し、実装は UT-07 / 後段タスクで確認 |

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC-10 定義 |
| 必須 | outputs/phase-10/go-nogo-decision.md | GO 判定の前提確認 |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md | 05a 既存ファイルの参照対象 |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | UBM-002 / UBM-003（NON_VISUAL ルール） |
| 参考 | .claude/skills/task-specification-creator/scripts/validate-phase-output.js | 自動チェックスクリプト |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-11/main.md | Phase 11 サマリー（NON_VISUAL） |
| ドキュメント | outputs/phase-11/manual-smoke-log.md | 自動チェック実行ログ |
| ドキュメント | outputs/phase-11/link-checklist.md | リンクチェック結果 |

> screenshot 関連ファイル（`screenshots/` 等）は作成しない。空の `screenshots/.gitkeep` も置かない（SKILL.md「NON_VISUAL 判定時は `.gitkeep` を削除」遵守）。

---

## 完了条件

- [ ] 必須 outputs 3 点が全て作成されている
- [ ] `main.md` のメタに「証跡の主ソース」「screenshot を作らない理由」が明記されている
- [ ] 自動チェック 4 種が全て実行され結果が記録されている
- [ ] リンクチェックが全件 PASS（または FAIL があれば差し戻し記録あり）
- [ ] AC-10（05a 整合性）の判定が確定している
- [ ] screenshot 関連ファイルが**作成されていない**ことを確認した

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み（3 点）
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-11 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次 Phase: 12（ドキュメント更新）
- 引き継ぎ: `link-checklist.md` の集計結果と `main.md` の AC-10 判定を Phase 12 の `documentation-changelog.md` に引き継ぐ
- ブロック条件: 自動チェック / リンクチェック / AC-10 のいずれかが FAIL の場合は Phase 12 に進まない
