# Phase 11: 手動 smoke 実行ログ（manual-smoke-log）

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

## 必須メタ

| 項目 | 値 |
| --- | --- |
| 証跡の主ソース | 自己適用 smoke（S-1〜S-7）+ mirror parity diff |
| screenshot 非作成理由 | `visualEvidence=NON_VISUAL`（skill 6 ファイル追記のみ / UI / runtime / D1 影響なし） |
| 実行日時 | 2026-04-29（JST） |
| 実行者 | Claude Code（task-20260429-064919-wt-9） |
| branch 名 | `feat/issue-148-ut-gov-005-docs-only-nonvisual-template-skill-sync` |
| mirror diff 結果 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` → 出力 0 行 / exit 0 |

---

## smoke 実行テーブル（PASS / FAIL 機械判定）

| ID | 実行コマンド | 期待結果 | 実測 | 判定 |
| --- | --- | --- | --- | --- |
| S-1 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` | 出力 0 行 / exit 0 | 出力 0 行 / exit 0 | **PASS** |
| S-2 | `grep -q "タスクタイプ判定フロー" .claude/skills/task-specification-creator/SKILL.md` | exit 0 | exit 0 | **PASS** |
| S-3 | `grep -q "docs-only / NON_VISUAL 縮約テンプレ" .claude/skills/task-specification-creator/references/phase-template-phase11.md` | exit 0 | exit 0 | **PASS** |
| S-3b | `grep -q "screenshot.*不要" .claude/skills/task-specification-creator/references/phase-template-phase11.md` | exit 0 | exit 0 | **PASS** |
| S-4a | `grep -q "Phase 1 必須入力" .claude/skills/task-specification-creator/references/phase-template-phase1.md` | exit 0 | exit 0 | **PASS** |
| S-4b | `grep -E "C12P2-(1\|2\|3\|4\|5)" .claude/skills/task-specification-creator/references/phase-template-phase12.md` | 5 件以上 HIT | **9 件 HIT** | **PASS** |
| S-5 | Progressive Disclosure 行数チェック（references/*.md ≤ 1000、SKILL.md ≤ 500） | 全ファイル制限内 | 全ファイル制限内 | **PASS** |
| S-6a | `! ls outputs/phase-11/screenshot-plan.json 2>/dev/null` | screenshot 関連ファイル不在 | 不在 | **PASS** |
| S-6b | `ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/` | `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点のみ | 3 点のみ | **PASS** |
| S-7a | `mise exec -- pnpm typecheck` | 全パッケージ exit 0 | 全パッケージ Done | **PASS** |
| S-7b | `mise exec -- pnpm lint` | 全パッケージ exit 0 | 全パッケージ Done | **PASS** |

---

## smoke シナリオ詳細

### S-1: mirror parity（差分 0 検証 / AC-5）

```bash
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
echo $?
```

**期待**: 出力 0 行 / exit 0
**実測**: 出力 0 行 / exit 0
**判定**: **PASS**

### S-2: SKILL.md 判定フロー文書整合（AC-2）

```bash
grep -q "タスクタイプ判定フロー" .claude/skills/task-specification-creator/SKILL.md
```

**期待**: exit 0（タスクタイプ判定フローが SKILL.md に追記されている）
**実測**: exit 0
**判定**: **PASS**

### S-3: 縮約テンプレ 3 点固定 / screenshot 不要明文化（AC-1）

```bash
grep -q "docs-only / NON_VISUAL 縮約テンプレ" .claude/skills/task-specification-creator/references/phase-template-phase11.md
grep -q "screenshot.*不要" .claude/skills/task-specification-creator/references/phase-template-phase11.md
```

**期待**: 両 grep exit 0
**実測**: 両 grep exit 0
**判定**: **PASS**

### S-4: Phase 1 必須入力 / Phase 12 Part 2 5 項目（AC-3 / AC-6）

```bash
grep -q "Phase 1 必須入力" .claude/skills/task-specification-creator/references/phase-template-phase1.md
grep -E "C12P2-(1|2|3|4|5)" .claude/skills/task-specification-creator/references/phase-template-phase12.md
```

**期待**: 第 1 が exit 0、第 2 が 5 件以上 HIT
**実測**: 第 1 exit 0、第 2 **9 件 HIT**（C12P2-1〜5 が compliance-check 側と一対一対応）
**判定**: **PASS**

### S-5: Progressive Disclosure 行数チェック

```bash
wc -l .claude/skills/task-specification-creator/SKILL.md
wc -l .claude/skills/task-specification-creator/references/phase-template-phase11.md
wc -l .claude/skills/task-specification-creator/references/phase-template-phase12.md
wc -l .claude/skills/task-specification-creator/references/phase-template-phase1.md
```

**期待**: SKILL.md ≤ 500 行 / 各 reference ≤ 1000 行
**実測**: 全ファイル制限内
**判定**: **PASS**

### S-6: 自己適用 3 点構成 / 冗長 artefact 不在（AC-8 / drink-your-own-champagne）

```bash
# screenshot 関連 artefact が存在しないこと
! ls outputs/phase-11/screenshot-plan.json 2>/dev/null

# 3 点のみであること
ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/
```

**期待**:
- screenshot 関連 artefact 不在
- `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点のみ存在

**実測**:
- screenshot 関連 artefact 不在（PASS）
- 3 点のみ存在（PASS）

**判定**: **PASS**

### S-7: typecheck / lint 副作用ゼロ再確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

**期待**: 全パッケージ exit 0
**実測**: 全パッケージ Done（Phase 9 で実行済 / 同結果再確認）
**判定**: **PASS**

---

## AC 確定対応表

| AC | 確認 smoke | 結果 |
| --- | --- | --- |
| AC-1（縮約テンプレ追加 / 3 点固定 / screenshot 不要明文化） | S-3 + S-3b | **GREEN** |
| AC-2（NON_VISUAL → 縮約発火 判定が SKILL.md に明記） | S-2 | **GREEN** |
| AC-3（Phase 12 Part 2 5 項目 一対一チェック） | S-4b（9 件 HIT） | **GREEN** |
| AC-5（mirror diff 0） | S-1 | **GREEN** |
| AC-6（Phase 1 visualEvidence 必須入力） | S-4a | **GREEN** |
| AC-8（自己適用第一例 / drink-your-own-champagne） | S-6a + S-6b | **GREEN** |

---

## 集計

| 集計項目 | 値 |
| --- | --- |
| 実行 smoke 数 | 7 シナリオ（11 サブコマンド） |
| PASS | 11 / 11 |
| FAIL | 0 / 11 |
| 全体判定 | **ALL PASS** |
| Phase 12 着手判定 | **GO** |

---

## 苦戦箇所・実施所感

- mirror parity の事前確認（Phase 9）と Phase 11 での再確認の二重化により、`.agents` 同期忘れによる古典的事故を完全に防止できた
- 3 点固定の自己適用 smoke（S-6）が drink-your-own-champagne の核であり、screenshot 等の冗長 artefact を作らないという制約を S-6a で機械判定できることを確認
- C12P2-1〜5 が **9 件 HIT** したのは、compliance-check 側と Part 2 側で同じ ID を双方記述しているため。一対一対応を保ちつつ件数が増える正常挙動

---

## 次 Phase

- 次: Phase 12（ドキュメント更新）
- 引き継ぎ: 全 smoke PASS / AC-1/2/5/8 GREEN / 3 点固定の自己適用実証データ
