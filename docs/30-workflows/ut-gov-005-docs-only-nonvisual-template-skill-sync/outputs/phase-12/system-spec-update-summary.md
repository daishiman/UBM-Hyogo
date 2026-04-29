# system-spec-update-summary.md

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase | 12 / 13 |
| 作成日 | 2026-04-29 |
| 種別 | docs-only / NON_VISUAL |

---

## aiworkflow-requirements への影響: なし（明示宣言）

本タスクは **`task-specification-creator` skill 内部のみ** の改修であり、`aiworkflow-requirements` skill の references / indexes / SKILL.md / resource-map / quick-reference / topic-map のいずれにも変更を加えていない。

| aiworkflow-requirements 構成要素 | 影響 |
| --- | --- |
| `SKILL.md` | なし |
| `references/` 配下全ファイル | なし |
| `indexes/` 配下（resource-map / quick-reference / topic-map / keywords） | なし |
| `verify-indexes-up-to-date` CI gate | なし（drift 発生せず） |

---

## Step 1: 仕様書差分

### 1-1. task-specification-creator skill 6 ファイル追記（実差分）

| パス | 種別 | 追記セクション概要 |
| --- | --- | --- |
| `.claude/skills/task-specification-creator/SKILL.md` | 更新 | 「タスクタイプ判定フロー」セクション追加。`visualEvidence == NON_VISUAL && taskType == docs-only` で縮約テンプレ発火を明記 |
| `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | 更新 | docs-only / NON_VISUAL 縮約テンプレ実体（3 点固定 / screenshot 不要明文化） |
| `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | 更新 | Part 2 必須 5 項目（C12P2-1〜C12P2-5）チェック項目化 |
| `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` | 更新 | C12P2-1〜5 一対一対応行追加 + docs-only 判定ブランチ |
| `.claude/skills/task-specification-creator/references/phase-template-phase1.md` | 更新 | `visualEvidence` Phase 1 必須入力ルール追記 |
| `.claude/skills/task-specification-creator/references/phase-template-core.md` | 更新 | state ownership 分離（spec_created vs completed）参照リンク追記 |

### 1-2. mirror（`.agents/skills/task-specification-creator/`）

上記 6 ファイルを mirror 同期（`diff -qr` 出力 0 行）。Phase 9 / 11 で確定済。

### 1-3. aiworkflow-requirements

差分なし。

---

## Step 2A: 計画記録（別タスク化決定事項）

本タスクスコープ外として明示的に切り出した派生タスクは Phase 12 `unassigned-task-detection.md` に転記:

| 派生 ID | 切り出し対象 | 切り出し理由 |
| --- | --- | --- |
| U-7 | mirror parity CI gate 化（pre-commit / GitHub Actions） | TECH-M-02 として別 issue 化 |
| U-8 | skill-fixture-runner への縮約テンプレ構造検証ルール拡張 | TECH-M-04 として別 issue 化 |
| U-6 | UT-GOV-001〜007 系の遡及適用判定タスク | TECH-M-03 で「進行中タスクは Phase 11 着手時再判定」と明文化したため判定実施タスクが必要 |

---

## Step 2B: 実更新

`aiworkflow-requirements` に対する実更新は **なし**（影響範囲外）。

`task-specification-creator` への実更新は Phase 5 で完了済（本 Phase 12 では再修正なし）。

---

## Step 2B 補足: 計画系 wording 残存確認

完了前 grep:

```bash
rg -n "仕様策定のみ|実行対象|保留として記録" \
  docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-12/ \
  | rg -v 'phase12-task-spec-compliance-check.md' \
  || echo "計画系 wording なし"
```

期待出力: `計画系 wording なし`（compliance-check 内で「該当なし」と並記する文脈を除く）。

---

## 影響範囲（UT-GOV-001〜007 系での発火）

縮約テンプレは以下のタスクで発火する可能性がある（Phase 1 で `visualEvidence=NON_VISUAL` を宣言した時点で自動発火）:

| タスク | 想定 visualEvidence | 縮約発火 |
| --- | --- | --- |
| UT-GOV-001（CODEOWNERS）| NON_VISUAL | YES |
| UT-GOV-002（PR template）| NON_VISUAL | YES |
| UT-GOV-003（CI required checks）| NON_VISUAL | YES |
| UT-GOV-004（branch protection 拡張）| NON_VISUAL | YES |
| UT-GOV-005（本タスク）| NON_VISUAL | YES（自己適用第一例） |
| UT-GOV-006（labels）| NON_VISUAL | YES |
| UT-GOV-007（Issue template）| NON_VISUAL | YES |

> ただし TECH-M-03 遡及適用方針により、進行中タスクは Phase 11 着手時に再判定し、未着手なら適用 / 着手済なら従来テンプレで完走させる。

---

## 不変条件（CLAUDE.md §「重要な不変条件」）への影響

| # | 不変条件 | 影響 |
| --- | --- | --- |
| 1 | 実フォーム schema 固定化禁止 | なし |
| 2 | consent キー統一（`publicConsent` / `rulesConsent`） | なし |
| 3 | `responseEmail` を system field 扱い | なし |
| 4 | Google Form schema 外データを admin-managed として分離 | なし |
| 5 | D1 直接アクセスは `apps/api` に閉じる | なし（本タスクで D1 / API 触らず） |
| 6 | GAS prototype を本番昇格させない | なし |
| 7 | MVP では Google Form 再回答を本人更新の正式経路 | なし |

**不変条件への影響なし宣言**: 本タスクは markdown のみの skill 改修であり、上記 7 項目のいずれにも触れていない。

---

## 完了確認

- [x] aiworkflow-requirements 影響なし宣言を明記
- [x] task-specification-creator 6 ファイル差分を Step 1 に列挙
- [x] 別タスク化決定事項を Step 2A に列挙
- [x] 計画系 wording 残存確認スクリプトを記載
- [x] 不変条件への影響なし宣言
