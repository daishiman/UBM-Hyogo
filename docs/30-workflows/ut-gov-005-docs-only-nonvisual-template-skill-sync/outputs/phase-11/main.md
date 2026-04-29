# Phase 11: 手動 smoke / 縮約テンプレ自己適用検証（main index）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 手動 smoke（縮約テンプレ自己適用検証） |
| 作成日 | 2026-04-29 |
| 状態 | done |
| 入力 Phase | Phase 10（Go-No-Go = GO） / Phase 9（品質保証 PASS） / Phase 7（AC マトリクス） / Phase 5（skill 追記実体） |
| 出力先 Phase | Phase 12（ドキュメント更新） |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| 縮約テンプレ適用 | **第一適用例（drink-your-own-champagne）** |

---

## NON_VISUAL 宣言

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | 自己適用 smoke（`manual-smoke-log.md` の S-1〜S-7）+ mirror parity diff |
| screenshot 非作成理由 | `visualEvidence=NON_VISUAL`（編集対象は markdown 6 ファイルのみ / UI / runtime / D1 影響なし） |
| 縮約テンプレ発火判定 | `artifacts.json.metadata.visualEvidence == "NON_VISUAL"` && `taskType == "docs-only"` → 縮約発火（SKILL.md 「タスクタイプ判定フロー」に準拠） |
| 自己適用宣言 | 本 Phase 11 outputs 自体が縮約テンプレの **第一適用例** である |

---

## テスト方式

| 項目 | 値 |
| --- | --- |
| 種別 | NON_VISUAL（docs walkthrough + 自己適用 smoke + mirror parity 検証） |
| screenshot | **不要**（visualEvidence=NON_VISUAL） |
| 代替 evidence | `main.md` / `manual-smoke-log.md` / `link-checklist.md`（**必須 3 点固定**） |

---

## 発火条件

```
artifacts.json.metadata.visualEvidence == "NON_VISUAL"
&& artifacts.json.metadata.taskType == "docs-only"
→ 縮約テンプレ発火（screenshot 不要 / 3 点固定 evidence のみ）
```

本タスク `artifacts.json.metadata` は `visualEvidence=NON_VISUAL` / `taskType=docs-only` のため、上記条件を満たして縮約テンプレが発火する。

---

## 必須 outputs 一覧（3 点固定）

| ファイル | 役割 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/main.md` | NON_VISUAL 宣言 / 自己適用宣言 / AC 確定マーク（本ファイル） | done |
| `outputs/phase-11/manual-smoke-log.md` | S-1〜S-7 の実行コマンド / 期待 / 実測 / PASS-FAIL テーブル | done |
| `outputs/phase-11/link-checklist.md` | cross-reference 双方向 checklist（SKILL.md ↔ references / `.claude` ↔ `.agents` mirror / workflow 内リンク） | done |

> **重要**: 本 Phase outputs は **3 点のみ**。screenshot / `manual-test-result.md` 等を作らないこと。
> 冗長 artefact が混入した時点で AC-8 FAIL となる。

---

## 第一適用例宣言（drink-your-own-champagne）

本 Phase 11 outputs は、Phase 5 で `.claude/skills/task-specification-creator/` に追記された **docs-only / NON_VISUAL 縮約テンプレ** の **第一適用例** である。本ワークフロー自身が定義した縮約テンプレを、本ワークフロー自身の Phase 11 で自己適用することで、後続タスク（UT-GOV-001〜007 系）が参照リンク可能な実証データを確立する。

---

## skill 本体への参照リンク

Phase 5 で skill 本体に追記された縮約テンプレ関連ファイルへの正本リンク。

| 参照先 | 内容 |
| --- | --- |
| [`.claude/skills/task-specification-creator/SKILL.md`](../../../../../.claude/skills/task-specification-creator/SKILL.md) | タスクタイプ判定フロー（NON_VISUAL → 縮約発火） |
| [`.claude/skills/task-specification-creator/references/phase-template-phase11.md`](../../../../../.claude/skills/task-specification-creator/references/phase-template-phase11.md) | docs-only / NON_VISUAL 縮約テンプレ実体（3 点固定 / screenshot 不要明文化） |
| [`.claude/skills/task-specification-creator/references/phase-template-phase11-detail.md`](../../../../../.claude/skills/task-specification-creator/references/phase-template-phase11-detail.md) | Phase 11 詳細運用 |
| [`.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md`](../../../../../.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md) | NON_VISUAL 代替 evidence プレイブック（最重要） |
| [`.claude/skills/task-specification-creator/references/phase-template-phase1.md`](../../../../../.claude/skills/task-specification-creator/references/phase-template-phase1.md) | Phase 1 必須入力（visualEvidence） |
| [`.claude/skills/task-specification-creator/references/phase-template-phase12.md`](../../../../../.claude/skills/task-specification-creator/references/phase-template-phase12.md) | Phase 12 Part 2 5 項目（C12P2-1〜5） |

mirror（`.agents/skills/task-specification-creator/`）は `diff -qr` 出力 0 行で一致。

---

## AC 確定マーク

| AC | smoke 確定根拠 | 判定 |
| --- | --- | --- |
| AC-1 | `manual-smoke-log.md` S-3（縮約テンプレ 3 点固定 / screenshot 不要明文化 grep HIT） | **GREEN** |
| AC-2 | `manual-smoke-log.md` S-2（SKILL.md タスクタイプ判定フロー grep HIT） | **GREEN** |
| AC-5 | `manual-smoke-log.md` S-1（mirror parity 0） | **GREEN** |
| AC-8 | `manual-smoke-log.md` S-6（自己適用 3 点構成 / 冗長 artefact なし） | **GREEN（Phase 11 で最終確定）** |

AC-3 / AC-4 / AC-6 / AC-7 / AC-9 / AC-10 は Phase 5 / 9 / 10 で確定済。本 Phase では再確認のみ実施（`manual-smoke-log.md` S-4 で AC-3 を再 grep）。

---

## smoke 結果サマリー

| smoke ID | 内容 | 結果 |
| --- | --- | --- |
| S-1 | mirror parity 0（diff -qr） | PASS |
| S-2 | SKILL.md 判定フロー文書整合 | PASS |
| S-3 | 縮約テンプレ 3 点固定 / screenshot 不要明文化 | PASS |
| S-4 | Phase 12 Part 2 必須 5 項目（C12P2-1〜5） | PASS（9 件 HIT） |
| S-5 | Progressive Disclosure 行数チェック | PASS |
| S-6 | 自己適用 3 点構成 / 冗長 artefact なし | PASS |
| S-7 | typecheck / lint 副作用ゼロ再確認 | PASS |

詳細: `manual-smoke-log.md` 参照。

---

## 完了条件 (DoD)

- [x] S-1〜S-7 全 PASS
- [x] AC-1 / AC-2 / AC-5 / AC-8 確定 GREEN
- [x] 必須 3 点（main / manual-smoke-log / link-checklist）作成済
- [x] screenshot / `manual-test-result.md` が `outputs/phase-11/` に存在しない
- [x] 第一適用例宣言 / 自己適用宣言を main.md に明記

---

## 次 Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ: AC-1 / AC-2 / AC-5 / AC-8 確定 GREEN / 自己適用 evidence 3 点 / mirror diff 0 ログ
