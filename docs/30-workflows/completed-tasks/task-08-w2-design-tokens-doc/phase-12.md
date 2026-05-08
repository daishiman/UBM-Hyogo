# Phase 12: ドキュメント更新

実装区分: ドキュメントのみ仕様書

> `references/phase-12-spec.md` の **6 必須タスク**を実行し、最低 7 ファイルを実体出力する。`spec_created` / docs-only / NON_VISUAL は workflow root 状態を据え置き、`phases[].status` のみ更新する。

## Task 12-1: 実装ガイド作成（Part 1 中学生レベル + Part 2 技術者レベル）

`outputs/phase-12/implementation-guide.md` を生成する。

### Part 1（中学生レベル概念説明）

「色や余白の値を、Web ページのあちこちで同じ名前で呼べるようにする辞書を作る」というレベルから出発し、以下を 200〜300 字で説明:

- なぜトークン化するのか（同じ値を一箇所で管理する）
- なぜ `--ubm-*` という prefix なのか（他のライブラリの色と混ざらないように）
- なぜ OKLch なのか（人間の目に近い色空間で、ライト/ダークの切替がきれい）
- なぜ Tailwind v4 `@theme inline` なのか（CSS 変数のままにして、テーマ切替を効かせるため）

### Part 2（技術者レベル）

- アーキテクチャ図: `styles.css` (出典) → `09b-design-tokens.md` (正本) → `tokens.css` / `globals.css` (task-09 実装) → primitives (task-10) → `verify-design-tokens.ts` (task-18 CI gate)
- 命名規則 / 階層 / `:root` vs `[data-theme]` cascade / `@theme inline` の動作原理
- Style Dictionary 互換 flat JSON の構造
- sRGB fallback の `@supports not` 戦略

## Task 12-2: システム仕様書更新

### Step 1-A: 新規 spec 追加

`docs/00-getting-started-manual/specs/09b-design-tokens.md` を作成（本タスクの主成果物）。旧名 `design-tokens.md` は alias とせず、参照は `09b-design-tokens.md` へ置換する。

### Step 1-B: 既存 spec への link 追加

| 対象 | 追記 |
| --- | --- |
| `docs/00-getting-started-manual/specs/00-overview.md` | デザイントークン正本として 09b への link を spec 一覧に追加 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md` | token 値正本は 09b であり本ファイルに値を重複定義しないことを明記 |
| `docs/00-getting-started-manual/specs/09c-primitives.md` | 09b §2 / §11 anchor と `--ubm-color-*` 正本名へ補正 |
| `docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md` | 旧仮 `09e-design-tokens.md` link を 09b 正本へ補正 |
| 親 workflow の scope / phase-3 / task-01 / task-09 / task-18 docs | 旧 `design-tokens.md` link と旧 token contract を 09b 正本へ補正 |
| `docs/00-getting-started-manual/specs/09-ui-ux.md`（task-06 出力） | §6 token 参照規則から 09b へ link（task-06 完成後の cross-task 同期） |

> task-06 / task-07 出力ファイルは本タスクと並列で作られるため、本タスク Phase 12 の時点で未存在の場合は **TODO として残し、後続 cross-task 同期で接続**する。本タスクは 09b 自身の完成のみを必須とする。

### Step 1-C: aiworkflow-requirements skill index 同期

| 対象 | 追記 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `design-tokens` / `OKLch` / `--ubm-*` / `@theme inline` keyword に 09b への path を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | デザインシステム topic に 09b を追加 |

> indexes 再生成は post-merge では走らないため `mise exec -- pnpm indexes:rebuild` を明示実行する。CI gate `verify-indexes-up-to-date` で drift 0 を保証。

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を canonical absolute path で列挙:

```
- docs/00-getting-started-manual/specs/09b-design-tokens.md  [NEW]
- docs/00-getting-started-manual/specs/00-overview.md  [updated: link added]
- docs/00-getting-started-manual/specs/09-ui-ux.md  [updated: token SSOT link added]
- docs/00-getting-started-manual/specs/09c-primitives.md  [updated: 09b anchors and token names normalized]
- docs/00-getting-started-manual/specs/09f-screen-blueprints-member.md  [updated: stale temporary token link normalized]
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md  [updated: stale token link normalized]
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/01-scope/task-01-w1-solo-scope-gate-all-screens.md  [updated: stale token link normalized]
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/04-design-system/task-09-w3-par-tailwind-v4-setup.md  [updated: stale token link normalized]
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/08-regression/task-18-w7-solo-verify-tokens-and-playwright-smoke.md  [updated: verifier contract synced to 09b JSON and @theme inline]
- docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-3/phase-3.md  [updated: stale token link normalized]
- .claude/skills/aiworkflow-requirements/indexes/keywords.json  [updated]
- .claude/skills/aiworkflow-requirements/indexes/topic-map.md  [updated]
- docs/30-workflows/task-08-w2-design-tokens-doc/index.md  [NEW workflow]
- docs/30-workflows/task-08-w2-design-tokens-doc/artifacts.json  [NEW]
- docs/30-workflows/task-08-w2-design-tokens-doc/phase-{01..13}.md  [NEW x13]
```

`.claude/skills/<skill>/LOGS.md` 等の skill 履歴更新が発生する場合は LOGS.md の path を必ず併記（SKILL.md だけ列挙して LOGS.md 省略は FAIL）。

## Task 12-4: 未タスク検出レポート

`outputs/phase-12/unassigned-task-detection.md` を **0 件でも出力必須**。

期待される未タスク（本タスクで処理しない範囲）:

| 候補 | 扱い |
| --- | --- |
| dark mode 値確定 | 別 workflow（MVP 非対応のため未起票で OK） |
| sRGB fallback の精緻な近似値再計算（Culori / colorjs.io） | task-09 適用時に対応（separate task 不要） |
| Style Dictionary generator 化 | 将来 enhancement（MVP 範囲外） |

> 上記は **将来拡張の note** として記録し、未タスク Issue 起票は不要とする。

## Task 12-5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` を出力（**改善点なしでも必須**）。3 観点固定:

- テンプレ改善: docs-only / NON_VISUAL 縮約テンプレで本タスクは完全カバー。改善要望なし or 軽微項目
- ワークフロー改善: 親 workflow と並列実行（W2）でブロッキング 0
- ドキュメント改善: 09b の章立て規約は他の spec タスクの雛形として再利用可能 → 議論として記録

## Task 12-6: タスク仕様書コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` を出力。13 phase ファイル + index.md + artifacts.json の実体確認とチェックリスト。

## 7 ファイル実体確認（最低）

```bash
WD=docs/30-workflows/task-08-w2-design-tokens-doc/outputs/phase-12
ls -la \
  $WD/main.md \
  $WD/implementation-guide.md \
  $WD/system-spec-update-summary.md \
  $WD/documentation-changelog.md \
  $WD/unassigned-task-detection.md \
  $WD/skill-feedback-report.md \
  $WD/phase12-task-spec-compliance-check.md
```

## 状態の据え置き

| レイヤ | 値 |
| --- | --- |
| `artifacts.json.metadata.workflow_state` | `spec_created`（書き換えない。docs-only かつ実装着手前のため） |
| `artifacts.json.phases[12].status` | `completed` |

## 完了条件

- [ ] Task 12-1〜12-6 全タスク完了
- [ ] 7 ファイル実体確認 OK
- [ ] aiworkflow-requirements indexes drift 0（`pnpm indexes:rebuild` 後 CI gate PASS）
- [ ] workflow_state は `spec_created` で据え置き
