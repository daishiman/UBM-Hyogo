# Phase 5: 実装ランブック（skill 編集）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック（skill 編集） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 4（テスト戦略） |
| 下流 | Phase 6（異常系検証） |
| 状態 | pending |
| user_approval_required | false |

## 目的

Phase 2 の編集計画と Phase 4 の TC を順序立てた実装手順に展開する。`.claude/skills/task-specification-creator/` の 6 ファイルへの追記、`.agents/` mirror 同期、コミット粒度、検証コマンドを **派生実装エージェントが単独実行可能な粒度** で固定する。コミットを Step ごとに切ることで、`git revert <commit>` 1 回で個別ロールバック可能にする。

## 入力

- `outputs/phase-02/main.md`（編集計画 / mirror 同期手順 / state ownership）
- `outputs/phase-04/test-strategy.md`（TC-1〜TC-8）
- `outputs/phase-03/main.md`（自己適用順序ゲート: Phase 5 → Phase 11）

## 実行手順

### Step 0: 事前確認（Red）

```bash
# baseline parity（既に差分 0 を Phase 1 で確認済。再確認）
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
# 期待: 出力 0 行

# 編集対象 6 ファイルの存在確認
ls .claude/skills/task-specification-creator/SKILL.md \
   .claude/skills/task-specification-creator/references/phase-template-phase11.md \
   .claude/skills/task-specification-creator/references/phase-template-phase12.md \
   .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md \
   .claude/skills/task-specification-creator/references/phase-template-phase1.md \
   .claude/skills/task-specification-creator/references/phase-template-core.md

# Red: TC-1-1 がまだ FAIL（タスクタイプ判定フロー未追加）
rg -n "タスクタイプ判定フロー" .claude/skills/task-specification-creator/SKILL.md || echo "RED: not yet added"
```

### Step 1: SKILL.md にタスクタイプ判定フロー追記

Phase 2 §2 の仕様に従い、SKILL.md 末尾に以下セクションを追加。

- セクション見出し: `## タスクタイプ判定フロー（docs-only / NON_VISUAL）`
- 内容:
  - `artifacts.json.metadata.visualEvidence` を Phase 1 必須入力化する記述
  - 入力 → 適用テンプレ対応表（`docs-only × NON_VISUAL` / `docs-only × VISUAL` / `implementation` 等）
  - 状態分離節（`workflow root = spec_created` / `phases[].status = completed`）

| コミット | メッセージ |
| --- | --- |
| 1 | `docs(skill/task-spec-creator): add task-type decision flow for docs-only/NON_VISUAL` |

### Step 2: phase-template-phase11.md に縮約テンプレ追記

- セクション見出し: `## docs-only / NON_VISUAL 縮約テンプレ（発火条件: visualEvidence=NON_VISUAL）`
- 必須 outputs 3 点（`main.md` / `manual-smoke-log.md` / `link-checklist.md`）の表
- screenshot 不要の明文化
- VISUAL 必須 outputs と「別セット」「混在させない」の明示
- 自己適用第一例として `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/` への参照

| コミット | メッセージ |
| --- | --- |
| 2 | `docs(skill/task-spec-creator): add docs-only/NON_VISUAL phase-11 condensed template` |

### Step 3: phase-template-phase12.md Part 2 を 5 項目チェック化

- Part 2 必須要件を 5 項目（型定義 / API シグネチャ / 使用例 / エラー処理 / 設定可能パラメータ）に整理
- `phase-12-completion-checklist.md` への相互参照リンクを追加

| コミット | メッセージ |
| --- | --- |
| 3 | `docs(skill/task-spec-creator): itemize phase-12 Part 2 mandatory 5 checks` |

### Step 4: phase-12-completion-checklist.md に docs-only ブランチ追加

- C12P2-1〜C12P2-5 のチェック ID とラベル一対一表
- docs-only ブランチ判定フロー（`taskType == "docs-only"` のとき Part 2 を「型定義 / 配置ルール / 使用例」で代替判定）
- 状態分離節: `workflow_state = spec_created` を許容しつつ `phases[].status = completed` を別レイヤで判定する記述

| コミット | メッセージ |
| --- | --- |
| 4 | `docs(skill/task-spec-creator): add docs-only branch and state-ownership rule to compliance-check` |

### Step 5: phase-template-phase1.md / phase-template-core.md（Phase 1 必須入力ルール）

- `phase-template-phase1.md` に「`artifacts.json.metadata.visualEvidence` は Phase 1 完了条件として必須入力」を追記
- `phase-template-core.md` の Phase 1〜3 共通セクションに、タスクタイプ判定フロー（SKILL.md §）への参照リンクを 1 行追記

| コミット | メッセージ |
| --- | --- |
| 5 | `docs(skill/task-spec-creator): require visualEvidence as phase-1 mandatory input` |

### Step 6: `.agents/` mirror 同期

```bash
# .claude → .agents へ 6 ファイルを同期
cp .claude/skills/task-specification-creator/SKILL.md \
   .agents/skills/task-specification-creator/SKILL.md

for f in phase-template-phase11.md \
         phase-template-phase12.md \
         phase-12-completion-checklist.md \
         phase-template-phase1.md \
         phase-template-core.md \
         phase-11-non-visual-alternative-evidence.md; do
  cp ".claude/skills/task-specification-creator/references/$f" \
     ".agents/skills/task-specification-creator/references/$f"
done

# parity 検証（差分 0 必須）
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator
# 期待: 出力 0 行
```

| コミット | メッセージ |
| --- | --- |
| 6 | `chore(skill/task-spec-creator): sync .claude → .agents mirror (parity 0)` |

> **重要**: Step 1〜5 と Step 6 を **1 コミットに混ぜない**。`.claude` 編集と mirror 同期を分離することで、mirror drift が発生した場合に Step 6 のみ再実行・revert できる。

### Step 7: Green 検証（TC-1〜TC-6）

```bash
# TC-5（mirror）— fail-fast 順序で先行
diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator

# TC-1（SKILL.md 構造）
rg -n "タスクタイプ判定フロー" .claude/skills/task-specification-creator/SKILL.md
rg -n "NON_VISUAL" .claude/skills/task-specification-creator/SKILL.md
rg -n "spec_created" .claude/skills/task-specification-creator/SKILL.md

# TC-2（縮約テンプレ）
rg -n "縮約テンプレ" .claude/skills/task-specification-creator/references/phase-template-phase11.md
rg -n "main\.md|manual-smoke-log\.md|link-checklist\.md" .claude/skills/task-specification-creator/references/phase-template-phase11.md

# TC-3（Part 2 5 項目）
rg -n "C12P2-[1-5]" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md

# TC-4（Phase 1 必須入力）
rg -n "visualEvidence.*必須|必須入力" .claude/skills/task-specification-creator/references/phase-template-phase1.md

# TC-6（副作用なし確認）
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## ロールバック設計

| Step | ロールバック手段 | 影響範囲 |
| --- | --- | --- |
| Step 1 | `git revert <commit-1>` | SKILL.md のみ |
| Step 2 | `git revert <commit-2>` | phase-template-phase11.md のみ |
| Step 3 | `git revert <commit-3>` | phase-template-phase12.md のみ |
| Step 4 | `git revert <commit-4>` | phase-12-completion-checklist.md のみ |
| Step 5 | `git revert <commit-5>` | phase-template-phase1.md / phase-template-core.md |
| Step 6 | `git revert <commit-6>` | `.agents/` mirror のみ（`.claude/` は維持）|

> **粒度を保つ理由**: skill 改修は drink-your-own-champagne で本タスクの Phase 11 / 12 で自己適用される。問題が出た特定ファイルだけを revert できる粒度を保つことで、自己適用ループの中でも切り戻し可能。

## 自己適用順序ゲート（再確認）

Phase 5 の Step 1〜6 が **すべて完了** しないと Phase 11 自己適用は実行不能。Step 6（mirror 同期）まで含めて Phase 5 完了とする。

| ゲート | 条件 |
| --- | --- |
| Phase 5 → Phase 6 | Step 7 検証で TC-1〜TC-6 すべて GREEN |
| Phase 5 → Phase 9 | mirror diff 0 が継続 |
| Phase 5 → Phase 11 | Step 1〜6 のコミットが main / dev に存在し、縮約テンプレが skill 本体に反映済 |

## 実行タスク

1. Step 0 事前確認（Red）
2. Step 1 SKILL.md タスクタイプ判定フロー追記 → 単独コミット
3. Step 2 phase-template-phase11.md 縮約テンプレ追記 → 単独コミット
4. Step 3 phase-template-phase12.md Part 2 5 項目化 → 単独コミット
5. Step 4 compliance-check docs-only ブランチ追加 → 単独コミット
6. Step 5 phase-template-phase1 / core 追記 → 単独コミット
7. Step 6 `.agents/` mirror 同期 → 単独コミット
8. Step 7 Green 検証（TC-1〜TC-6）

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-02/main.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase1.md` |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-core.md` |
| 必須 | `.agents/skills/task-specification-creator/`（mirror 同期先）|

## 依存Phase明示

- Phase 2 / 4 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-05/implementation-runbook.md` | Step 0〜7 / コミット粒度 / 検証コマンド / ロールバック設計 / 実行ログ |

## 完了条件 (DoD)

- [ ] Step 1〜6 が単独コミットで完了
- [ ] 各コミットが `git revert` 単独で戻せる粒度になっている
- [ ] `diff -qr .claude .agents` 差分 0
- [ ] TC-1〜TC-6 すべて GREEN
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` 成功
- [ ] runbook に実行ログ（コマンド出力）が転記済

## 苦戦箇所・注意

- **混在コミット禁止**: Step 1〜6 を 1 コミットに混ぜると revert 粒度を失う。**必ず Step ごとに分離**
- **mirror 同期忘れ**: Step 6 を Step 1〜5 と同じ作業セッションで完了する。タブを閉じて翌日 Step 6 だけ忘れる典型ケースに注意
- **`.agents/` 直編集禁止**: `.claude/` が正本（writable）、`.agents/` は mirror（read-only）。`.agents/` を直接編集すると Step 6 で `cp` 上書きされて作業が消失する
- **縮約テンプレ二重化**: `phase-template-phase11.md` には既に「docs-only / spec_created 必須3点」セクションが存在。Step 2 では **追加** ではなく **既存セクションへの統合 + 発火条件の明文化**。Phase 8 DRY 化で重複を最終整理（TECH-M-01）
- **typecheck の意味**: 本タスクはコード変更ゼロのため typecheck が PASS なのは当然。ただし「副作用なしの証跡」として runbook に必ず実行ログを残す

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の skill 改善であり、アプリケーション統合テストは追加しない。
- 統合検証は `diff -qr` mirror parity、`mise exec -- pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。

## 次 Phase

- 次: Phase 6（異常系検証）
- 引き継ぎ: 6 コミット ID / Step 7 Green ログ / mirror diff 0 確認 / 編集後の skill ファイル状態
