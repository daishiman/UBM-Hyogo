[実装区分: 実装仕様書]

# Phase 11: 実測 evidence（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | 実測 evidence（NON_VISUAL 縮約テンプレ） |
| 作成日 | 2026-05-03 |
| 前 Phase | 10 (リリース準備) |
| 次 Phase | 12 (ドキュメント・未タスク検出・スキルフィードバック) |
| 状態 | pending |
| taskType | implementation |
| visualEvidence | **NON_VISUAL** |
| Issue | #393 (CLOSED) |

## 適用テンプレ

`artifacts.json.metadata.visualEvidence == "NON_VISUAL"` のため、`.claude/skills/task-specification-creator/references/phase-template-phase11.md` の **NON_VISUAL 縮約テンプレ** および `phase-11-non-visual-alternative-evidence.md` の 4 階層代替 evidence を適用する。

screenshot は **生成禁止**（false green 防止）。本タスクは literal 置換実装 / lint strict 化 PoC のため画面なし。

## 目的

14 ファイル・148 件の stableKey literal を正本 supply module 経由参照に置換した結果、
`lint-stablekey-literal.mjs --strict` の violation が 148 → 0 に下がること、stableKeyCount=31 が維持されること、typecheck / vitest focused が PASS することを **実測 log** で証明する。

## 必須 outputs（NON_VISUAL 縮約テンプレ準拠 / 3 ファイル）

| # | ファイル | 役割 | 最小フォーマット |
| --- | --- | --- | --- |
| 1 | `outputs/phase-11/main.md` | Phase 11 トップ index | テスト方式（NON_VISUAL）/ 必須 outputs リンク / 「保証する範囲・しない範囲」/ 申し送り先 |
| 2 | `outputs/phase-11/manual-smoke-log.md` | 置換実装の手動スモーク log（family 別 typecheck / strict lint PASS 確認） | 「実行コマンド / 期待結果 / 実測 / PASS or FAIL」テーブル |
| 3 | `outputs/phase-11/link-checklist.md` | 仕様書 → 実装ファイル / 親 03a workflow / SKILL リンクの dead link チェック | 「参照元 → 参照先 / 状態（OK / Broken）」テーブル |

## 必須 evidence ファイル（NON_VISUAL 実測証跡 / 5 件）

| # | ファイル | 取得方法 | 何を保証 |
| --- | --- | --- | --- |
| E1 | `outputs/phase-11/evidence/lint-strict-before.txt` | 置換実装着手前に `mise exec -- node scripts/lint-stablekey-literal.mjs --strict 2>&1 \| tee outputs/phase-11/evidence/lint-strict-before.txt` | 置換前 baseline = **148 violations** snapshot |
| E2 | `outputs/phase-11/evidence/lint-strict-after.txt` | 置換実装完了後に同コマンド再実行 → `tee outputs/phase-11/evidence/lint-strict-after.txt` | 置換後 = **0 violations**（AC-1） |
| E3 | `outputs/phase-11/evidence/typecheck.txt` | `mise exec -- pnpm typecheck 2>&1 \| tee outputs/phase-11/evidence/typecheck.txt` | TypeScript 型整合（AC-4） |
| E4 | `outputs/phase-11/evidence/vitest-focused.txt` | `mise exec -- pnpm vitest run --changed 2>&1 \| tee outputs/phase-11/evidence/vitest-focused.txt` | 既存 unit / 統合 test PASS（AC-3） |
| E5 | `outputs/phase-11/evidence/stable-key-count.txt` | `mise exec -- node scripts/lint-stablekey-literal.mjs --report-count 2>&1 \| tee outputs/phase-11/evidence/stable-key-count.txt`（または該当 grep スクリプト） | stableKeyCount=**31** 維持（AC-2） |

> 任意 evidence: `outputs/phase-11/evidence/lint-strict-intentional-fail.txt`（Phase 9 「赤がちゃんと赤になる」確認手順）

## 取得手順（実装 wave 実行コマンド）

```bash
# 0. 置換着手前の baseline 取得（family A 着手前）
mise exec -- node scripts/lint-stablekey-literal.mjs --strict 2>&1 \
  | tee docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/lint-strict-before.txt

# 1. family G → A → B → D → C → E → F の順に実装、各 family commit 後:
mise exec -- pnpm typecheck
mise exec -- pnpm vitest run --changed

# 2. 全 family 完了後（最終確認）
mise exec -- node scripts/lint-stablekey-literal.mjs --strict 2>&1 \
  | tee docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/lint-strict-after.txt

mise exec -- pnpm typecheck 2>&1 \
  | tee docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/typecheck.txt

mise exec -- pnpm vitest run --changed 2>&1 \
  | tee docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/vitest-focused.txt

# 3. stableKeyCount = 31 確認（スクリプト側に --report-count 機能がない場合は grep 経由）
mise exec -- node -e "import('./packages/shared/src/zod/field.ts').then(m => console.log('stableKeyCount=', m.STABLE_KEY_LIST.length))" 2>&1 \
  | tee docs/30-workflows/issue-393-stablekey-literal-legacy-cleanup/outputs/phase-11/evidence/stable-key-count.txt
```

> stableKeyCount 計測のためのコマンドは正本 supply module の export 形式に合わせて調整する。Phase 4 で正本構造を確定済み。

## 代替 evidence 4 階層

| 階層 | 代替手段 | 何を保証 | 何を保証できないか（→ 申し送り先） |
| --- | --- | --- | --- |
| L1: 型 | E3 (`typecheck.txt`) | TypeScript 型整合（named import 解決を含む） | runtime での schema 整合 |
| L2: lint / boundary | E2 (`lint-strict-after.txt`) | allow-list 外で stableKey literal が静的に 0 件 | runtime 動的合成（template literal） |
| L3: in-memory test | E4 (`vitest-focused.txt`) | family 別 unit / 統合 test での挙動同一性 | 全 monorepo の e2e |
| L4: 意図的 violation | 任意 evidence (`lint-strict-intentional-fail.txt`) | 「赤がちゃんと赤になる」 | （L2 で吸収済） |

## 代替 evidence 差分表（main.md に転記必須）

```markdown
## 代替 evidence 差分表

| Phase 11 シナリオ | 元前提 | 代替手段 | カバー範囲 | 申し送り先 |
| --- | --- | --- | --- | --- |
| S-1 | 14 ファイル置換後 strict lint PASS | E1 + E2 (before/after diff) | violation 148 → 0 | （本タスク内で完結） |
| S-2 | TypeScript 型崩れがない | E3 (typecheck.txt) | named import 解決 / 型整合 | （本タスク内で完結） |
| S-3 | 既存 unit/統合 test に regression なし | E4 (vitest-focused.txt) | family 別 PASS | （本タスク内で完結） |
| S-4 | stableKeyCount 不変 | E5 (stable-key-count.txt) | =31 確認 | aiworkflow-requirements current facts |
| S-5 | runtime dynamic literal（template literal 合成） | （未対応） | — | Phase 12 unassigned-task-detection.md（runtime guard 検討） |
```

## AC × evidence × 不変条件 1:N トレース表

| AC | 内容 | evidence | 不変条件 | 階層 |
| --- | --- | --- | --- | --- |
| AC-1 | 14 ファイル strict violation 0 | E1 + E2 | #1 | L2 |
| AC-2 | stableKeyCount=31 維持 | E5 | #1 | L1 |
| AC-3 | 既存 unit / 統合 test PASS | E4 | #1 / #2 | L3 |
| AC-4 | typecheck PASS | E3 | #1 | L1 |
| AC-5 | lint PASS（ESLint + strict） | E2 + `pnpm lint` 出力（manual-smoke-log.md） | #1 | L2 |
| AC-6 | suppression 0 件 | manual-smoke-log.md（`git diff main...HEAD \| grep eslint-disable` 0 hit） | #1 | L2 |
| AC-7 | 親 03a AC-7 strict CI gate 昇格可能 state | E2 + Phase 10 AC-7 更新 diff 計画 | #1 | L1〜L4 |

## manual-smoke-log.md 必須メタ

- 証跡の主ソース: `lint-strict-before.txt` / `lint-strict-after.txt` / `typecheck.txt` / `vitest-focused.txt` / `stable-key-count.txt`
- screenshot を作らない理由: **NON_VISUAL**（literal 置換 / lint なので画面なし）
- 実行日時 / 実行者（worktree branch 名）
- secret hygiene grep: `grep -iE '(token|cookie|authorization|bearer|set-cookie)' outputs/phase-11/evidence/*.txt` が **0 hit**
- family A〜G 別 commit ごとの typecheck PASS 表（commit hash / family / typecheck 結果）

## link-checklist.md 最小項目

- 本仕様書 → `packages/shared/src/zod/field.ts`（正本）
- 本仕様書 → `packages/integrations/google/src/forms/mapper.ts`（正本）
- 本仕様書 → `scripts/lint-stablekey-literal.mjs`
- 本仕様書 → `docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/`（親 workflow）
- 本仕様書 → 14 ファイル全パス（family A〜G）
- workflow 内 `index.md` / `phase-*.md` / `outputs/*` 間リンク

## 異常時処理

- E2 で violation > 0 が残る → Phase 5 runbook の該当 family を再実装、commit を amend ではなく追加 commit で修正
- E3 typecheck fail → import path の typo / barrel export 設定不足 → Phase 4 で確定した正本 export を再確認
- E4 vitest fail → 置換が挙動を変えていないか diff レビュー、必要なら fixture を更新
- E5 stableKeyCount ≠ 31 → 正本 supply module への意図しない add/delete 発生 → 該当 commit を revert
- secret hygiene grep が hit → evidence ファイルを sanitize して再生成

## 実行タスク

- [ ] 必須 outputs 3 ファイル（main.md / manual-smoke-log.md / link-checklist.md）作成
- [ ] 必須 evidence 5 件（E1〜E5）取得
- [ ] 取得手順を main.md に転記
- [ ] AC × evidence × 不変条件 トレース表を main.md に転記
- [ ] 代替 evidence 差分表を main.md に転記
- [ ] secret hygiene grep 0 hit 確認
- [ ] runtime dynamic literal は Phase 12 unassigned-task-detection.md へ申し送り

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-09/main.md` | quality gate |
| 必須 | `outputs/phase-10/main.md` | merge 順序 / family commit |
| 必須 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | NON_VISUAL template |

## 成果物

| ファイル | 内容 |
| --- | --- |
| `outputs/phase-11/main.md` | evidence plan index |
| `outputs/phase-11/manual-smoke-log.md` | manual smoke log |
| `outputs/phase-11/link-checklist.md` | link check |
| `outputs/phase-11/evidence/lint-strict-before.txt` | 置換前 148 violations snapshot |
| `outputs/phase-11/evidence/lint-strict-after.txt` | 置換後 0 violations |
| `outputs/phase-11/evidence/typecheck.txt` | typecheck PASS log |
| `outputs/phase-11/evidence/vitest-focused.txt` | vitest focused PASS log |
| `outputs/phase-11/evidence/stable-key-count.txt` | stableKeyCount=31 確認 |

## 統合テスト連携

Phase 12 は本 Phase の evidence が `NOT_EXECUTED` か実測済みかを明確に分け、false green を防ぐ。

## 完了条件

- [ ] 必須 outputs 3 + evidence 5 件すべて取得済み
- [ ] AC × evidence × 不変条件 トレース表が埋まっている
- [ ] 代替 evidence 差分表が main.md に転記済み
- [ ] secret hygiene PASS
- [ ] family A〜G 全 commit で typecheck PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 全 evidence 配置済み
- [ ] secret hygiene PASS
- [ ] artifacts.json の phase 11 を completed

## 次 Phase

- 次: Phase 12 (ドキュメント・未タスク検出・スキルフィードバック)
- 引き継ぎ: 取得 evidence サマリ / runtime guard 等の未タスク化対象
