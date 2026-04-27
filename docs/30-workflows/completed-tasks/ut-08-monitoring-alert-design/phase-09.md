# Phase 9: 品質保証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 名称 | 品質保証 |
| タスク | UT-08 モニタリング/アラート設計 |
| 作成日 | 2026-04-27 |
| 担当 | delivery |
| 状態 | completed |
| GitHub Issue | #10（CLOSED） |
| タスク種別 | design / non_visual / spec_created |

---

## 目的

UT-08 は設計タスク（コード実装なし）であるため、品質保証は**設計成果物の品質**に閉じる。
具体的には以下 5 観点で全成果物をチェックし、レビュー・smoke テスト前に修正を完了させる。

1. **line budget**：各設計書が 1 ファイルあたり 300 行を大きく超過しないこと（読み手の認知負荷管理）
2. **link parity**：相互参照が双方向で成立し、参照切れがないこと
3. **artifact 名整合**：phase-NN.md / index.md / artifacts.json / 実体ファイル名の 1 対 1 一致
4. **05a 参照リンク有効性**：`docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/` 配下の既存ファイルへの参照がすべて有効
5. **mirror parity**：`.claude/skills/` と `.agents/skills/` の同期確認

---

## 実行タスク

- [ ] line budget チェック（`wc -l outputs/phase-02/*.md`）を実施する
- [ ] link parity チェック（成果物間の相互参照が双方向で成立するか）を実施する
- [ ] artifact 名整合チェック（artifacts.json ↔ phase ファイル ↔ 実体ファイル）を実施する
- [ ] 05a 参照リンクの有効性を確認する
- [ ] `.claude/skills` と `.agents/skills` の mirror parity を確認する
- [ ] 全結果を `outputs/phase-09/quality-checklist.md` に記録する
- [ ] FAIL 項目があれば Phase 2 / Phase 8 への差し戻し計画を記載する

---

## 品質チェック観点（詳細）

### 9-1. line budget

| ファイル | 上限目安 | 確認方法 |
| --- | --- | --- |
| `outputs/phase-02/monitoring-design.md` | 400 行 | `wc -l` 結果を記録 |
| その他 phase-02 成果物 | 各 300 行 | 同上 |
| `phase-NN.md` | 各 300 行 | 同上 |

> 上限超過は即 FAIL ではなく、**分割可能性のレビューを義務化**する。意味的に分割不可な場合はその旨を記録。

### 9-2. link parity（双方向参照確認）

| 起点ファイル | 参照先 | 双方向確認項目 |
| --- | --- | --- |
| `monitoring-design.md` | `metric-catalog.md` 他 phase-02 成果物 | 起点 → 各成果物 / 各成果物 → 起点（「総合まとめは monitoring-design.md を参照」） |
| `runbook-diff-plan.md` | 05a `observability-matrix.md` / `cost-guardrail-runbook.md` | 一方向（外部参照のため）。ただしリンクが死んでいないこと |
| `phase-12.md` 内ガイド | `outputs/phase-02/*.md` | 一方向。識別子（メトリクス名等）が現行と一致 |

### 9-3. artifact 名整合

```bash
# artifacts.json の phase-N artifacts.path と outputs ディレクトリの実体ファイル名を突合
# （Phase 11 で実行する）
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js \
  --workflow docs/30-workflows/ut-08-monitoring-alert-design \
  --phase all
```

| 確認項目 | 期待値 |
| --- | --- |
| artifacts.json の各 phase artifacts | phase-NN.md「成果物」テーブルと完全一致 |
| 実体ファイル名 | artifacts.json と完全一致（拡張子・ハイフン位置含む） |

### 9-4. 05a 参照リンク有効性

```bash
# 05a 配下への参照が全て有効ファイルを指していることを確認する
grep -rn "docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails" \
  docs/30-workflows/ut-08-monitoring-alert-design/ \
  | while read -r line; do
    # 参照先パスが存在するかをチェック（Phase 11 で実行）
    echo "$line"
  done
```

確認対象:

- `index.md` の参照表
- `phase-01.md` 〜 `phase-13.md` の参照資料セクション
- `outputs/phase-02/runbook-diff-plan.md` の差分対象記載

### 9-5. mirror parity（`.claude/skills` ↔ `.agents/skills`）

| 確認項目 | 確認方法 |
| --- | --- |
| `task-specification-creator` の SKILL.md mirror | `diff -r .claude/skills/task-specification-creator .agents/skills/task-specification-creator` |
| `aiworkflow-requirements` の references mirror | `diff -r .claude/skills/aiworkflow-requirements/references .agents/skills/aiworkflow-requirements/references` |
| 差分検出時 | Phase 12 のシステム仕様更新で同期する旨を記録 |

> 本タスクは設計のためスキル本体を改変しないが、**Phase 12 で `documentation-changelog.md` を出す前に必ず確認する**。

---

## 品質チェックリスト（サマリー）

`outputs/phase-09/quality-checklist.md` に以下の表で結果を記録する。

| カテゴリ | チェック項目 | 状態 | 備考 |
| --- | --- | --- | --- |
| line budget | phase-02 成果物 9 種が全て 400 行以内 | PASS / FAIL | 超過時は分割可能性をレビュー |
| line budget | phase-NN.md が各 300 行以内 | PASS / FAIL | |
| link parity | monitoring-design.md ↔ 個別成果物の双方向リンク成立 | PASS / FAIL | |
| link parity | 05a 参照が全て生存 | PASS / FAIL | |
| artifact 名 | artifacts.json ↔ phase ファイル ↔ 実体一致 | PASS / FAIL | |
| 05a 参照 | runbook-diff-plan.md が 05a 既存ファイルを上書きしない方針 | PASS / FAIL | 不変条件 1 |
| mirror parity | `.claude/skills` ↔ `.agents/skills` 差分なし | PASS / FAIL | 差分時は Phase 12 で同期 |
| DRY | Phase 8 で確定した SSOT が逸脱されていない | PASS / FAIL | refactoring-log.md と突合 |

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
| 必須 | docs/30-workflows/ut-08-monitoring-alert-design/index.md | AC 一覧 |
| 必須 | outputs/phase-08/refactoring-log.md | SSOT 確定結果（Phase 9 のチェック対象） |
| 必須 | docs/01-infrastructure-setup/05a-parallel-observability-and-cost-guardrails/index.md | 05a 参照リンクの有効性確認元 |
| 参考 | .claude/skills/task-specification-creator/references/quality-standards.md | 品質基準の正本 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-09/quality-checklist.md | 品質チェックリスト（5 観点全結果） |

---

## 完了条件

- [ ] line budget チェックが全件記録されている
- [ ] link parity が双方向で成立している（起点ファイルと参照先の往復が確認済み）
- [ ] artifact 名整合が PASS している
- [ ] 05a 参照リンクが全件有効である
- [ ] mirror parity 結果（差分の有無）が記録されている
- [ ] FAIL 項目に対する Phase 2 / 8 差し戻し計画が記載されている

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-09 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次 Phase: 10（最終レビュー）
- 引き継ぎ: `outputs/phase-09/quality-checklist.md` の全結果が PASS であれば Phase 10 で GO 判定の根拠として参照する。FAIL があれば該当 Phase に差し戻し
- ブロック条件: 5 観点中 1 つでも FAIL の場合、修正を完了させずに Phase 10 へ進まない
