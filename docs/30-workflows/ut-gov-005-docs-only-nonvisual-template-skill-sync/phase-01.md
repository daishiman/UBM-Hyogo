# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 1 / 13 |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| 上流 | 親タスク task-github-governance-branch-protection（Phase 11 / 12 実証済） |
| 下流 | Phase 2（設計） |
| 状態 | completed |
| タスク種別 | skill-improvement / docs-only / `NON_VISUAL` |
| user_approval_required | false |

## 目的

`task-specification-creator` skill に対する docs-only / NON_VISUAL 縮約テンプレ反映タスクのスコープ・苦戦箇所・受入条件を不可逆化し、Phase 2 設計の入力を凍結する。原典スペック §1〜§8 を本ワークフローの Phase 1〜13 構造に再展開し、`artifacts.json.metadata` の確定と「`visualEvidence` を Phase 1 必須入力化する」運用ルールを skill に追記する根拠を固める。

本タスクは「自分自身の Phase 11 / 12 が、追加するテンプレの第一適用例になる」自己適用構造（drink-your-own-champagne）を持つため、Phase 1 ではこの循環構造を破綻させない順序ゲート（Phase 5 で skill 編集を完了 → Phase 11 で自己適用）を要件として確定する。

## 入力

| 種別 | パス / 内容 |
| --- | --- |
| 原典スペック | `docs/30-workflows/completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md` |
| 親タスク Phase 11 実証 | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` |
| 親タスク Phase 12 実証 | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/` |
| 改修対象 skill | `.claude/skills/task-specification-creator/SKILL.md` / `references/phase-template-phase11.md` / `references/phase-template-phase12.md` / `references/phase-11-non-visual-alternative-evidence.md` |
| mirror 同期先 | `.agents/skills/task-specification-creator/` |

## 受入基準（AC）

- AC-1: 縮約テンプレが `phase-template-phase11.md` に追加され、必須 artefact が `main.md` / `manual-smoke-log.md` / `link-checklist.md` の 3 点固定
- AC-2: `visualEvidence=NON_VISUAL` を発火条件とする判定ルールが `SKILL.md` と `phase-template-phase11.md` の双方に明記
- AC-3: Phase 12 Part 2 必須 5 項目（型 / API / 例 / エラー / 設定値）が `phase-12-completion-checklist.md` で項目化
- AC-4: docs-only 用判定ブランチで `spec_created`（workflow root）と `completed`（Phase 別）の状態分離が明文化
- AC-5: `.claude/skills/` ↔ `.agents/skills/` mirror が `diff -qr` で差分 0
- AC-6: Phase 1 で `visualEvidence` を必須入力化するルールが `phase-template-phase1.md`（または `phase-template-core.md`）に追記
- AC-7: タスク種別 / メタ情報が `artifacts.json.metadata` と一致
- AC-8: 本タスク自身が縮約テンプレの第一適用例として Phase 11 / 12 で自己適用される設計
- AC-9: 代替案 4 案以上が PASS / MINOR / MAJOR で評価され、base case D で確定
- AC-10: Phase 1〜13 の状態が `artifacts.json` と完全一致

## 実行タスク

1. 原典スペック §1〜§8 の精読、苦戦箇所 6 件（visualEvidence メタ未設定 / Part 2 チェック漏れ / 状態分離 / mirror 同期忘れ / 遡及適用判断 / 自己適用循環）を抽出
2. 親タスク（task-github-governance-branch-protection）の Phase 11 / 12 outputs を実証データとして確認
3. 改修対象 skill ファイル（SKILL.md / phase-template-phase11.md / phase-template-phase12.md / phase-11-non-visual-alternative-evidence.md / phase-template-phase1.md / phase-template-core.md）の現状把握
4. `.claude` ↔ `.agents` mirror の現状 parity 確認（`diff -qr` の baseline 取得）
5. AC-1〜AC-10 を `outputs/phase-01/main.md` に確定記述
6. `artifacts.json.metadata` を確定（`taskType=docs-only` / `visualEvidence=NON_VISUAL` / `scope=skill_governance` / `workflow_state=spec_created`）
7. 自己適用順序ゲート（Phase 5 完了 → Phase 11 自己適用）を要件として明文化

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `docs/30-workflows/completed-tasks/UT-GOV-005-docs-only-nonvisual-template-skill-sync.md` |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-core.md` |
| 必須 | `docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/` |
| 参考 | `docs/30-workflows/skill-ledger-b1-gitattributes/index.md`（フォーマット模倣元） |

## 検証コマンド

```bash
# 改修対象 skill 一覧
ls .claude/skills/task-specification-creator/SKILL.md \
   .claude/skills/task-specification-creator/references/phase-template-phase11.md \
   .claude/skills/task-specification-creator/references/phase-template-phase12.md \
   .claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md \
   .claude/skills/task-specification-creator/references/phase-template-phase1.md \
   .claude/skills/task-specification-creator/references/phase-template-core.md

# mirror baseline parity 確認
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator || true

# 親タスク実証データの存在確認
ls docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/main.md \
   docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/manual-smoke-log.md \
   docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-11/link-checklist.md
```

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-01/main.md` | 背景 / 苦戦箇所 / スコープ / AC-1〜AC-10 / 4 条件評価 / 自己適用性確定 |

## 完了条件 (DoD)

- [x] 原典スペック §1〜§8 を精読済み
- [x] 苦戦箇所 6 件を main.md に転記
- [x] 改修対象 skill ファイル 6 件を一覧化
- [x] mirror baseline parity を確認（差分 0 が初期状態であることを確認）
- [x] AC-1〜AC-10 が確定
- [x] `artifacts.json.metadata` 確定（taskType=docs-only / visualEvidence=NON_VISUAL / scope=skill_governance）
- [x] 自己適用順序ゲートを要件として明文化

## 苦戦箇所・注意

- **`visualEvidence` メタ未設定の連鎖**: Phase 1 で確定しないと Phase 11 縮約テンプレが発火しない。本タスク Phase 1 で `artifacts.json.metadata.visualEvidence=NON_VISUAL` を確実に書く + skill 側で「Phase 1 必須入力」ルールを追記する 2 段構えが必要
- **自己適用循環**: 本タスク自身が縮約テンプレの第一適用例。Phase 11 着手時に skill が未編集だと検証不能になるため、Phase 5（skill 編集完了）→ Phase 11（自己適用検証）の順序を Phase 1 から固定
- **状態分離の誤認**: `状態 = spec_created` は workflow root の状態（実装着手前）であり、Phase 1〜3 の `status = completed` とは別レイヤ。混同しないよう Phase 1 main.md で明示
- **CLOSED Issue の扱い**: GitHub Issue #148 は CLOSED のまま再起票しない。タスク仕様書側で `github_issue_state: CLOSED` を明示し、reopen が必要かは Phase 12 で判断

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [x] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `pnpm typecheck` / `pnpm lint`（副作用なし確認）、`diff -qr` mirror parity、Phase 11 の縮約テンプレ自己適用 smoke で代替する。
- 改修後の skill 構造は skill-fixture-runner で別タスクとして検証する（本タスクスコープ外）。

## 次 Phase

- 次: Phase 2（設計：SKILL.md / references 改修 diff、mirror 同期手順、自己適用順序ゲート、state ownership）
- 引き継ぎ: AC-1〜AC-10 / 苦戦箇所 6 件 / 改修対象ファイル 6 件 / mirror baseline / 自己適用順序
