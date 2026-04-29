# Phase 11: cross-reference 双方向 link-checklist

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 11 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | done |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |

---

## 1. SKILL.md ↔ references 内部参照

| 参照元 | 参照先 | 検証手段 | 状態 |
| --- | --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md`（タスクタイプ判定フロー） | `references/phase-template-phase11.md`（縮約テンプレ実体） | grep + 目視 | **OK** |
| `.claude/skills/task-specification-creator/SKILL.md`（タスクタイプ判定フロー） | `references/phase-11-non-visual-alternative-evidence.md`（NON_VISUAL 代替 evidence） | grep + 目視 | **OK** |
| `.claude/skills/task-specification-creator/SKILL.md`（Part 2 5 項目） | `references/phase-12-completion-checklist.md`（C12P2-1〜5） | `rg "C12P2-[1-5]"` | **OK** |
| `references/phase-template-phase11.md`（縮約テンプレ） | `references/phase-template-phase11-detail.md`（詳細運用） | 目視 | **OK** |
| `references/phase-template-phase1.md`（Phase 1 必須入力 visualEvidence） | `artifacts.json.metadata.visualEvidence` | 目視 + key 整合 | **OK** |
| `references/phase-template-phase12.md`（C12P2-1〜5） | `references/phase-12-completion-checklist.md`（同 ID） | `rg "C12P2-[1-5]"` 双方 | **OK** |

---

## 2. mirror parity（`.claude` ↔ `.agents`）6 ファイル一対一

`diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` → 出力 0 行 / exit 0。

| `.claude` 側 | `.agents` 側（mirror） | 状態 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | `.agents/skills/task-specification-creator/SKILL.md` | **OK（mirror 一致）** |
| `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | `.agents/skills/task-specification-creator/references/phase-template-phase1.md` | **OK（mirror 一致）** |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | `.agents/skills/task-specification-creator/references/phase-template-phase11.md` | **OK（mirror 一致）** |
| `.claude/skills/task-specification-creator/references/phase-template-phase11-detail.md` | `.agents/skills/task-specification-creator/references/phase-template-phase11-detail.md` | **OK（mirror 一致）** |
| `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | `.agents/skills/task-specification-creator/references/phase-template-phase12.md` | **OK（mirror 一致）** |
| `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | `.agents/skills/task-specification-creator/references/phase-12-completion-checklist.md` | **OK（mirror 一致）** |

→ **6 ファイル一対一 / mirror 完全同期**。

---

## 3. workflow 内部リンク（仕様書 ↔ outputs / phase 間双方向）

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `index.md` | `phase-01.md` 〜 `phase-13.md` | **OK** |
| `phase-09.md` | `outputs/phase-09/main.md` | **OK** |
| `phase-10.md` | `outputs/phase-10/go-no-go.md` | **OK** |
| `phase-11.md` | `outputs/phase-11/main.md` | **OK** |
| `phase-11.md` | `outputs/phase-11/manual-smoke-log.md` | **OK** |
| `phase-11.md` | `outputs/phase-11/link-checklist.md` | **OK** |
| `outputs/phase-09/main.md` | `outputs/phase-07/ac-matrix.md` | **OK** |
| `outputs/phase-10/go-no-go.md` | `outputs/phase-09/main.md` | **OK** |
| `outputs/phase-10/go-no-go.md` | `outputs/phase-08/main.md` | **OK** |
| `outputs/phase-11/main.md` | `outputs/phase-10/go-no-go.md` | **OK** |
| `outputs/phase-11/main.md` | `outputs/phase-09/main.md` | **OK** |
| `outputs/phase-11/main.md` | skill 本体 6 ファイル（参照リンク section） | **OK** |
| `outputs/phase-11/manual-smoke-log.md` | `outputs/phase-11/main.md` | **OK** |
| `outputs/phase-11/link-checklist.md`（本ファイル） | `outputs/phase-11/main.md` / `manual-smoke-log.md` | **OK** |

---

## 4. 親タスク第一実証データ参照

| 参照元 | 参照先 | 状態 |
| --- | --- | --- |
| `outputs/phase-11/main.md`（第一適用例宣言） | `completed-tasks/task-github-governance-branch-protection/outputs/phase-11/`（NON_VISUAL 先行先例） | **OK（参考リンク）** |
| `phase-11.md`（参照資料） | `docs/30-workflows/skill-ledger-b1-gitattributes/phase-11.md`（NON_VISUAL 先行先例） | **OK** |

---

## 5. artifacts.json メタ整合（AC-7 確認）

| キー | `artifacts.json.metadata` | `phase-template-phase1.md` 必須入力 | 状態 |
| --- | --- | --- | --- |
| `visualEvidence` | `NON_VISUAL` | `Phase 1 必須入力` 明記 | **OK** |
| `taskType` | `docs-only` | Phase 1 で固定 | **OK** |
| `category` | `skill_governance` | Phase 1 で固定 | **OK** |

---

## 6. 状態分離記述（AC-4 確認）

| 状態 | 記述場所 | 状態 |
| --- | --- | --- |
| `spec_created`（workflow root） | `references/phase-12-completion-checklist.md` | **OK** |
| `completed`（ledger / Phase 別） | `references/phase-12-completion-checklist.md` | **OK** |
| compliance-check docs-only ブランチ | `references/phase-12-completion-checklist.md` | **OK** |

---

## 7. 集計

| 集計項目 | 値 |
| --- | --- |
| Section 1: SKILL.md ↔ references | 6 / 6 OK |
| Section 2: mirror parity 6 ファイル | 6 / 6 OK |
| Section 3: workflow 内リンク | 14 / 14 OK |
| Section 4: 親タスク参照 | 2 / 2 OK |
| Section 5: artifacts.json メタ整合 | 3 / 3 OK |
| Section 6: 状態分離記述 | 3 / 3 OK |
| **合計** | **34 / 34 OK** |
| Broken link 数 | **0** |

---

## 8. 結論

全 34 項目の cross-reference が **OK**、Broken link **0**。`.claude` ↔ `.agents` mirror も `diff -qr` 出力 0 行で完全一致。SKILL.md「タスクタイプ判定フロー」から `references/phase-template-phase11.md`「縮約テンプレ」への内部参照、および Phase 12 Part 2 5 項目の compliance-check 一対一対応をすべて検証済み。

→ **Phase 11 link-checklist 全件 OK / Phase 12 着手可**。
