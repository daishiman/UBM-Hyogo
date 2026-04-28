# Phase 7: AC マトリクス / トレーサビリティ

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 (skill-ledger A-3) |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-28 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（specification-design / traceability） |

## 目的

index.md で定義された AC-1〜AC-11 を、検証手段（`wc -l` / `rg` / `diff -r` / `git diff` / 目視）・対象 skill・evidence 保存先・対応 Phase 番号に縦串で結ぶトレーサビリティマトリクスを作成し、Phase 8 以降に「未検証 AC」「未割当 skill」が残らないことを保証する。実装を伴わず spec_created 段階でも、AC ごとの「検証コマンド」「PASS 判定基準」「証跡パス」が一意に定まる粒度を確定する。

## 依存境界

- 入力: index.md の AC-1〜AC-11、Phase 1 inventory（200 行超 SKILL.md 一覧）、Phase 2 split-design（topic 切り出し計画）、Phase 4 test-strategy、Phase 5 implementation-runbook、Phase 6 failure-cases。
- 出力: `outputs/phase-07/ac-matrix.md`（トレース表）。
- 非対象: skill loader 本体への変更、`.claude/skills/` 配下の編集、コミット / PR。

## 実行タスク

1. AC-1〜AC-11 × 5 列（AC 内容 / 検証手段 / PASS 判定基準 / evidence 保存先 / 対応 Phase）の 11 行マトリクスを完成する（完了条件: 空セル無し）。
2. 対象 skill ごとの個別ステータス表（skill 名 × AC × `spec_created` / `pending`）を作成する（完了条件: Phase 1 inventory の全対象 skill が網羅）。
3. 検証コマンドを 1 行ずつ実行可能な形で記述する（完了条件: `wc -l` / `rg` / `diff -r` の引数が具体パスで埋まっている）。
4. evidence 保存先を `outputs/phase-04/` または `outputs/phase-11/` のいずれかに割り振る（完了条件: 全 AC で保存先が一意）。
5. Phase 9 / Phase 10 / Phase 11 への引き継ぎ項目（実測値・GO/NO-GO 入力）を箇条書きで予約する（完了条件: 引き継ぎ Phase が明示されている）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md | AC-1〜AC-11 原典 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-01.md | 対象 skill inventory |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-02.md | 分割設計表 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-04.md | 検証戦略（行数 / `rg` / `diff -r`） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-06.md | 異常系（参照切れ等） |
| 参考 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md | Step 1〜5 機械的手順 |

## AC × 検証手段 マトリクス（テンプレート）

> 実値は `outputs/phase-07/ac-matrix.md` に転記。本仕様書では各 AC に対する検証契約のみを固定する。

| AC# | AC 内容（要約） | 検証手段（コマンド） | PASS 判定基準 | evidence 保存先 | 対応 Phase |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 全対象 SKILL.md が 200 行未満 | `for f in .claude/skills/*/SKILL.md; do lines=$(wc -l < "$f"); [[ $lines -ge 200 ]] && echo "FAIL: $f=$lines" \|\| echo "OK: $f=$lines"; done` | 全行 `OK:` で `FAIL:` 0 件 | outputs/phase-11/manual-smoke-log.md（行数ログ） | Phase 4（戦略）/ Phase 5（実装）/ Phase 11（実測） |
| AC-2 | references/<topic>.md が単一責務で命名・配置 | `find .claude/skills/*/references -type f -name '*.md'` + 目視（topic 名 ↔ Phase 2 設計表突合） | 命名揺れ 0、Phase 2 設計表と一致 | outputs/phase-04/test-strategy.md（命名規約） | Phase 2（設計）/ Phase 11（最終確認） |
| AC-3 | entry に固定 10 要素（front matter / 概要 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow）が保持 | `rg -n '^---\|^## (Anchors\|クイックスタート\|モード\|references)' .claude/skills/<skill>/SKILL.md` + 目視 | 10 要素すべてヒット | outputs/phase-11/link-checklist.md | Phase 4（チェック項目）/ Phase 11（実測） |
| AC-4 | SKILL.md → references 参照は片方向、references 同士に循環参照なし | `rg -n '\.\./SKILL\.md\|SKILL\.md' .claude/skills/*/references/` で 0 件 + references 間相互リンクのグラフ目視 | 戻り参照 0、循環 0 | outputs/phase-11/link-checklist.md | Phase 2（設計）/ Phase 11（実測） |
| AC-5 | canonical (`.claude/skills/...`) と mirror (`.agents/skills/...`) の差分 0 | `for s in .claude/skills/*/; do n=$(basename "$s"); diff -r ".claude/skills/$n" ".agents/skills/$n"; done` | 出力空（差分 0） | outputs/phase-11/manual-smoke-log.md（diff セクション） | Phase 5（rsync）/ Phase 11（実測） |
| AC-6 | 行数検査で全対象 SKILL.md が `OK` | AC-1 と同コマンド | 全 `OK:` | outputs/phase-11/manual-smoke-log.md | Phase 4 / Phase 11 |
| AC-7 | リンク健全性（リンク切れ 0） | `rg -n 'references/' .claude/skills/<skill>/SKILL.md` の各 path に対し `test -f` 検証スクリプト | 全 path が実在 | outputs/phase-11/link-checklist.md | Phase 4 / Phase 11 |
| AC-8 | 未参照 reference 0 | `find .claude/skills/<skill>/references -name '*.md'` の各ファイル名が SKILL.md に `rg` ヒット | 未参照 0 件 | outputs/phase-11/link-checklist.md | Phase 4 / Phase 11 |
| AC-9 | `task-specification-creator/SKILL.md` が単独 PR で 200 行未満 | `wc -l .claude/skills/task-specification-creator/SKILL.md` + `git log --oneline -- .claude/skills/task-specification-creator/SKILL.md` で 1 PR 確認 | 行数 < 200 かつ単独 PR | outputs/phase-11/manual-smoke-log.md | Phase 5（PR 計画）/ Phase 11 |
| AC-10 | skill 改修ガイドに「fragment で書け」「200 行を超えたら分割」Anchor 追記 | `rg -n 'fragment で書け\|200 行を超えたら分割' .claude/skills/task-specification-creator/` | 2 フレーズが Anchor として存在 | outputs/phase-11/manual-smoke-log.md | Phase 5（小 PR）/ Phase 11 |
| AC-11 | 4条件（価値性 / 実現性 / 整合性 / 運用性）最終判定 PASS | Phase 10 go-no-go.md の判定 | 4 条件すべて PASS | outputs/phase-10/go-no-go.md | Phase 10 |

## 対象 skill 個別ステータス表（テンプレート）

> 実値は Phase 1 inventory が確定後、`outputs/phase-07/ac-matrix.md` に展開。

| skill 名 | 行数（before） | AC-1 | AC-2 | AC-3 | AC-4 | AC-5 | AC-6 | AC-7 | AC-8 | AC-9 | AC-10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| task-specification-creator（最優先） | TBD（>200） | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created |
| 対象 skill #2 | TBD | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | spec_created | N/A | N/A |
| 対象 skill #N | ... | ... | ... | ... | ... | ... | ... | ... | ... | N/A | N/A |
| aiworkflow-requirements（参考・対象外） | 既分割 | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

> AC-9 / AC-10 はドッグフーディング由来のため `task-specification-creator` のみ対象。それ以外の skill では `N/A`。

## 検証コマンド一覧（完全実行例）

```bash
# 行数検査（AC-1 / AC-6）
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  if [[ $lines -ge 200 ]]; then
    echo "FAIL: $f = $lines lines"
  else
    echo "OK:   $f = $lines lines"
  fi
done

# リンク列挙（AC-7 入力）
for skill in .claude/skills/*/; do
  rg -n 'references/' "$skill/SKILL.md" || true
done

# 戻り参照検出（AC-4）
rg -n '\.\./SKILL\.md|SKILL\.md' .claude/skills/*/references/ || echo "OK: 戻り参照 0"

# canonical / mirror 差分（AC-5）
for skill in .claude/skills/*/; do
  name=$(basename "$skill")
  diff -r ".claude/skills/$name" ".agents/skills/$name" || true
done

# Anchor 確認（AC-10）
rg -n 'fragment で書け|200 行を超えたら分割' .claude/skills/task-specification-creator/

# 単独 PR 確認（AC-9）
git log --oneline -- .claude/skills/task-specification-creator/SKILL.md
```

## 実行手順

1. Phase 1 inventory から対象 skill を確定し、個別ステータス表の skill 行を埋める。
2. 11 行 × 5 列の AC マトリクスを `outputs/phase-07/ac-matrix.md` に転記。
3. 検証コマンドを skill 名で展開した実行例を `outputs/phase-07/ac-matrix.md` 末尾に添付。
4. evidence 保存先（`outputs/phase-04/` または `outputs/phase-11/`）が一意に割り振られているか目視確認。
5. Phase 9 / 10 / 11 への引き継ぎ項目を箇条書きで予約。

## 多角的チェック観点

- 価値性: AC-9（ドッグフーディング）と AC-10（Anchor 追記）が単独で評価可能か。
- 実現性: 検証コマンドが Cloudflare / Google API を要さずローカルで完結するか。
- 整合性: AC-5（canonical / mirror 差分 0）が機械的 cut & paste 原則と矛盾しないか。
- 運用性: PASS 判定基準が再現可能（同じコマンドで同じ結果）か。
- トレーサビリティ: 全 AC が evidence 保存先と対応 Phase に紐付いているか。
- スコープ境界: aiworkflow-requirements 等の既分割 skill が `N/A` で除外されているか。

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは実行しない。AC マトリクスは Phase 11 の実測ログと Phase 12 の compliance check の照合表として使う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × evidence × Phase × 対象 skill のトレース表 |
| メタ | artifacts.json | Phase 7 状態更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] AC-1〜AC-11 の 11 行 × 5 列マトリクスに空セル無し
- [ ] 対象 skill 個別ステータス表が Phase 1 inventory と一致
- [ ] 検証コマンドが skill 名展開済みで実行可能
- [ ] evidence 保存先が `outputs/phase-04/` または `outputs/phase-11/` のいずれかに一意割当
- [ ] AC-9 / AC-10 が `task-specification-creator` のみ対象であることが明示
- [ ] aiworkflow-requirements が `N/A` で除外
- [ ] Phase 9 / 10 / 11 への引き継ぎ項目が箇条書き

## タスク 100% 実行確認【必須】

- 実行タスク 5 件すべて `spec_created`
- 成果物 `outputs/phase-07/ac-matrix.md` 配置予定
- AC-1〜AC-11 全件に検証手段・PASS 基準・evidence・対応 Phase が記述
- 対象 skill ごとの AC 個別ステータスが網羅
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 GO/NO-GO の根拠として再利用
  - 検証コマンド → Phase 11 manual smoke の入力
  - 個別ステータス表 → Phase 8 で重複セクション洗い出し時に参照
- ブロック条件:
  - AC マトリクス空セル残存
  - evidence 保存先未割当
  - 対象 skill が Phase 1 inventory と不一致
