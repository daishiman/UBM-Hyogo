[実装区分: 実装仕様書]

# Phase 12: ドキュメント更新（必須 6 タスク / 必須 7 ファイル）

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 12 / 13 |
| 名称 | 必須 6 タスク・必須 7 ファイル整備 / aiworkflow-requirements 同時更新 |
| 依存 (前) | Phase 11（evidence 完了） |
| 依存 (後) | Phase 13（PR 作成） |
| 想定工数 | 0.2 人日 |

## 2. ゴール / 非ゴール

### ゴール
1. 必須 6 タスク（implementation guide Part1/2 / システム仕様書更新 / ドキュメント更新履歴 / 未タスク検出レポート / skill feedback / コンプライアンスチェック）を完了
2. 必須 7 ファイルを `outputs/phase-12/` 配下に配置
3. aiworkflow-requirements の `quick-reference` / `topic-map` / `task-workflow-active` を本 task 用に同時更新
4. `docs/00-getting-started-manual/specs/09b-design-tokens.md` に verify gate の言及を追加

### 非ゴール
- PR 本文の最終生成（Phase 13）
- skill prompt の改善（必要なら別 issue 切り出し）

## 3. 変更対象ファイル

### 3.1 必須 7 ファイル（`outputs/phase-12/`）

| パス | 種別 | 説明 |
|------|------|------|
| `outputs/phase-12/implementation-guide.md` | new | 中学生レベル概念説明を含む実装ガイド Part1（設計判断・全体図） |
| `outputs/phase-12/implementation-guide-part2.md` | new | 実装ガイド Part2（コード例・トラブルシュート） |
| `outputs/phase-12/system-spec-update.md` | new | システム仕様書（`specs/*.md`）への差分まとめ |
| `outputs/phase-12/doc-update-history.md` | new | このワークフロー中に更新したドキュメント一覧と理由 |
| `outputs/phase-12/untasked-findings.md` | new | 範囲外で発見した課題・将来 task 化候補 |
| `outputs/phase-12/skill-feedback.md` | new | task-specification-creator / aiworkflow-requirements への feedback |
| `outputs/phase-12/compliance-check.md` | new | CONST_001..010 / SCOPE.md / 不変条件遵守の確認結果 |

### 3.2 既存ドキュメント編集

| パス | 種別 | 説明 |
|------|------|------|
| `docs/00-getting-started-manual/specs/09b-design-tokens.md` | edit | §10 末尾に「verify-design-tokens CI gate により drift は機械検出される」旨を追加（値変更なし） |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.json` | edit | task-18 verify-tokens / playwright-smoke エントリ追加 |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.json` | edit | regression-gate / design-tokens-verify / playwright-smoke の topic 追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | edit | active task として task-18 を登録、Phase 1-13 へのリンク |
| `CLAUDE.md` (ui-prototype-alignment-mvp-recovery セクション) | edit (任意) | 不変条件「CI gate `verify-design-tokens` で fail 判定」が既存記載と整合することを再確認（変更不要なら touch しない） |

## 4. 手順 / コマンド

### 4.1 必須 6 タスク

| # | タスク | 出力ファイル | 概要 |
|---|--------|------------|------|
| 1 | implementation guide Part1 (中学生レベル概念説明) | `outputs/phase-12/implementation-guide.md` | 「なぜ token gate と smoke が要るか」を平易に説明、全体図 (Mermaid) |
| 2 | implementation guide Part2 | `outputs/phase-12/implementation-guide-part2.md` | verify-design-tokens.ts の流れ図、Playwright config 解説、トラブルシュート |
| 3 | システム仕様書更新 | `outputs/phase-12/system-spec-update.md` + `specs/09b-design-tokens.md` 編集 | verify gate の存在を SSOT に追記 |
| 4 | ドキュメント更新履歴 | `outputs/phase-12/doc-update-history.md` | 編集ファイル一覧・diff 要約・理由 |
| 5 | 未タスク検出レポート | `outputs/phase-12/untasked-findings.md` | Cross-browser smoke 拡張・Lighthouse CI など将来候補 |
| 6 | skill feedback | `outputs/phase-12/skill-feedback.md` | Phase 分解で困った点 / aiworkflow-requirements 索引の改善案 |
| 7 | コンプライアンスチェック | `outputs/phase-12/compliance-check.md` | CONST_001..010 / 不変条件 / SCOPE 遵守の self-audit |

### 4.2 aiworkflow-requirements 同時更新

```bash
# quick-reference.json に追加（例: 検索キー）
# - "verify-design-tokens" → docs/30-workflows/task-18-verify-tokens-playwright-smoke-spec/
# - "playwright-smoke" → 同上
# - "regression-gate" → 同上

# topic-map.json に追加
# - topic "design-tokens-verify" / "playwright-smoke" / "required-status-checks" を spec へリンク

# task-workflow-active.md に task-18 行を追加
# (Phase 1-13 のリンクと完了状況)
```

更新後、必ず再生成・整合確認:

```bash
mise exec -- pnpm indexes:rebuild
git diff --stat .claude/skills/aiworkflow-requirements/
```

### 4.3 09b-design-tokens.md への追記方針

`docs/00-getting-started-manual/specs/09b-design-tokens.md` §10 の末尾に以下趣旨を 1 段落追加:

> 本 SSOT と `apps/web/src/styles/tokens.css` / `apps/web/src/styles/globals.css @theme inline` の drift は CI gate `verify-design-tokens` で機械検出される。`pnpm verify:tokens` のローカル実行と、PR 上の `verify-design-tokens / verify-design-tokens` チェックを満たすこと。

§9 JSON の値変更は行わない（不変条件 2）。

## 5. テスト・検証方針

| 検証項目 | 方法 |
|---------|------|
| 7 ファイル存在 | `ls outputs/phase-12/*.md \| wc -l` が 7 |
| aiworkflow indexes 整合 | `verify-indexes` CI gate が green（local では `pnpm indexes:rebuild` 後 diff 0） |
| 09b 追記が機械検証を壊さない | `mise exec -- pnpm verify:tokens` を再実行し exit 0 |
| skill 索引 lint | `quick-reference.json` / `topic-map.json` が JSON として valid（`jq . > /dev/null` で確認） |
| 中学生レベル説明 | implementation-guide.md に「token とは何か」「smoke とは何か」を 100〜200 字で日本語平易に説明している |

## 6. ローカル実行コマンド

```bash
# 必須 7 ファイル雛形作成
WF=docs/30-workflows/ui-prototype-alignment-mvp-recovery/outputs/phase-12
mkdir -p "$WF"
touch "$WF"/{implementation-guide.md,implementation-guide-part2.md,system-spec-update.md,doc-update-history.md,untasked-findings.md,skill-feedback.md,compliance-check.md}

# aiworkflow indexes 再生成
mise exec -- pnpm indexes:rebuild

# 機械検証
mise exec -- pnpm verify:tokens
jq . .claude/skills/aiworkflow-requirements/indexes/quick-reference.json > /dev/null
jq . .claude/skills/aiworkflow-requirements/indexes/topic-map.json       > /dev/null

# ファイル数確認
ls "$WF"/*.md | wc -l   # 7 を期待
```

## 7. DoD チェックリスト

- [ ] 必須 7 ファイルを `outputs/phase-12/` に配置（空ファイル不可・実内容を記述）
- [ ] `implementation-guide.md` に中学生レベル概念説明セクション（token / smoke / required check）を含む
- [ ] `system-spec-update.md` に `specs/09b-design-tokens.md` への追記内容を記録
- [ ] `09b-design-tokens.md` §10 末尾に verify gate 言及を追加（§9 JSON 値は変更しない）
- [ ] `quick-reference.json` / `topic-map.json` / `task-workflow-active.md` に task-18 エントリを追加
- [ ] `pnpm indexes:rebuild` 後の indexes が `verify-indexes` gate を通る状態（drift 0）
- [ ] `compliance-check.md` で CONST_001..010 と SCOPE.md §6 diff scope 規律を遵守している旨を self-audit
- [ ] `untasked-findings.md` に範囲外発見（あれば列挙、なしなら「該当なし」を明示）
