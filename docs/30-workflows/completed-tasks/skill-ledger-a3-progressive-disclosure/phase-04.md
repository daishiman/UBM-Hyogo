# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | SKILL.md の Progressive Disclosure 分割 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-28 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | spec_created |
| タスク分類 | docs-only / spec_created / NON_VISUAL（test-strategy） |

## 目的

Phase 3 で確定した分割方針に対して、コード実装ではなく `.claude/skills/*/SKILL.md` の構造的検証を行うための検証スイート（行数検査 / リンク健全性 / 未参照 reference / canonical-mirror diff / entry 残置要素 / 意味的書き換え混入）を設計する。Phase 5 ランブックで cut & paste 作業後に「迷わず合否判定」できる evidence 生成手順を整備し、AC-1〜AC-11 の各受入条件と検証カテゴリを 1 対 1 にトレースする。

## 依存境界

- 検証対象は `.claude/skills/*/SKILL.md` および `.claude/skills/*/references/*.md`、ならびに mirror の `.agents/skills/*` のみ。
- アプリ層（`apps/web` / `apps/api`）・D1・Cloudflare Workers 設定には touch しない。
- Vitest / Playwright 等のランタイム・テストフレームワークは使用しない（純粋にシェル + `wc` / `rg` / `diff` / `find` / `git diff` で完結）。
- 並列で同一 SKILL.md を編集する他タスクが存在しないことが前提（タスク開始時に announce 済み）。

## 実行タスク

1. 6 種の検証カテゴリ（行数検査 / リンク健全性 / 未参照 reference / canonical-mirror diff / entry 残置要素 / 意味的書き換え混入）の対象範囲・PASS 条件・実行コマンド・evidence 保存先を確定する（完了条件: 各カテゴリで 4 項目が空欄なく埋まる）。
2. 行数検査スクリプトを Phase 5 ランブックへ受け渡し可能な形で記述する（完了条件: `wc -l` ベースで全 SKILL.md が 200 行未満を判定し `OK/FAIL` を出力する）。
3. リンク健全性検査の手順を確定する（完了条件: SKILL.md → references の `rg` 出力と `find references -type f` 出力の突合手順が記述）。
4. canonical / mirror diff 検査手順を確定する（完了条件: `diff -r .claude/skills/<skill> .agents/skills/<skill>` が空であることを保証する evidence 取得方法が明記）。
5. entry 残置要素チェックリストを定義する（完了条件: 10 要素（front matter / 概要 5〜10 行 / trigger / allowed-tools / Anchors / クイックスタート / モード一覧 / agent 導線 / references リンク表 / 最小 workflow）が目視チェック表に揃う）。
6. 意味的書き換え混入検査を `git diff` ベースで定義する（完了条件: 追加行と削除行が同一テキストでセクション境界に揃うことを示す手順が確立）。
7. AC-1〜AC-11 と検証カテゴリの対応表を作成する（完了条件: 全 AC が 1 つ以上の検証カテゴリでカバーされ、空セルが無い）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/unassigned-task-skill-ledger/task-skill-ledger-a3-progressive-disclosure.md | 原典タスク指示書（§4 Phase 5 検証手順） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/index.md | AC-1〜AC-11 の正本 |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-02.md | 分割設計表（行数見積もり / topic 命名） |
| 必須 | docs/30-workflows/skill-ledger-a3-progressive-disclosure/phase-03.md | 設計レビュー結果 |
| 必須 | docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-7/skill-split-runbook.md | Step 1〜5 の機械的手順 |
| 参考 | .claude/skills/aiworkflow-requirements/SKILL.md | 既に分割済みの参考例 |

## 検証カテゴリ設計

### V1. 行数検査（Line Count Verification）

| 項目 | 内容 |
| --- | --- |
| 対象 | `.claude/skills/*/SKILL.md` 全件（特に Phase 1 棚卸しで挙がった 200 行超対象） |
| PASS 条件 | 全件で `wc -l` < 200 |
| 実行コマンド | 下記スニペット参照 |
| evidence | `outputs/phase-04/evidence/line-count.log` |
| カバー AC | AC-1, AC-6, AC-9 |

```bash
for f in .claude/skills/*/SKILL.md; do
  lines=$(wc -l < "$f")
  if [[ $lines -ge 200 ]]; then
    echo "FAIL: $f = $lines lines"
  else
    echo "OK:   $f = $lines lines"
  fi
done | tee outputs/phase-04/evidence/line-count.log
```

### V2. リンク健全性検査（Link Integrity）

| 項目 | 内容 |
| --- | --- |
| 対象 | 各対象 SKILL.md 内の `references/` 相対リンク |
| PASS 条件 | SKILL.md から指す全 references パスが実在し、かつリンク切れ 0 件 |
| 実行コマンド | `rg -n 'references/' .claude/skills/<skill>/SKILL.md` で抽出後、各 path に対し `test -f` 確認 |
| evidence | `outputs/phase-04/evidence/link-integrity.log` |
| カバー AC | AC-4, AC-7 |

```bash
for skill in .claude/skills/*/; do
  name=$(basename "$skill")
  rg -n 'references/[a-zA-Z0-9_\-]+\.md' "$skill/SKILL.md" -o --no-filename | sort -u | while read -r link; do
    path="$skill$link"
    if [[ -f "$path" ]]; then
      echo "OK:   $name -> $link"
    else
      echo "FAIL: $name -> $link (missing)"
    fi
  done
done | tee outputs/phase-04/evidence/link-integrity.log
```

### V3. 未参照 reference 検出（Orphan Reference Detection）

| 項目 | 内容 |
| --- | --- |
| 対象 | `.claude/skills/<skill>/references/*.md` 全件 |
| PASS 条件 | 全 reference パスが SKILL.md 内のリンク表で 1 回以上 hit |
| 実行コマンド | `find <skill>/references -type f -name '*.md'` の各 path を SKILL.md に対して `rg -F` で検索 |
| evidence | `outputs/phase-04/evidence/orphan-references.log` |
| カバー AC | AC-2, AC-8 |

```bash
for skill in .claude/skills/*/; do
  refdir="$skill/references"
  [[ -d $refdir ]] || continue
  find "$refdir" -type f -name '*.md' | while read -r ref; do
    rel="references/$(basename "$ref")"
    if rg -F -q "$rel" "$skill/SKILL.md"; then
      echo "OK:   $rel referenced in $skill/SKILL.md"
    else
      echo "FAIL: $rel orphan (not referenced)"
    fi
  done
done | tee outputs/phase-04/evidence/orphan-references.log
```

### V4. canonical / mirror 差分検査（Mirror Sync Verification）

| 項目 | 内容 |
| --- | --- |
| 対象 | `.claude/skills/<skill>` ↔ `.agents/skills/<skill>` |
| PASS 条件 | `diff -r` の出力が空 |
| 実行コマンド | `diff -r .claude/skills/<skill> .agents/skills/<skill>` |
| evidence | `outputs/phase-04/evidence/mirror-diff.log` |
| カバー AC | AC-5 |

```bash
for skill in .claude/skills/*/; do
  name=$(basename "$skill")
  if [[ -d ".agents/skills/$name" ]]; then
    out=$(diff -r ".claude/skills/$name" ".agents/skills/$name" 2>&1)
    if [[ -z $out ]]; then
      echo "OK:   $name canonical == mirror"
    else
      echo "FAIL: $name diff:"
      echo "$out"
    fi
  else
    echo "FAIL: $name mirror missing"
  fi
done | tee outputs/phase-04/evidence/mirror-diff.log
```

### V5. entry 残置要素検査（Entrypoint Element Checklist）

| 項目 | 内容 |
| --- | --- |
| 対象 | 分割後 SKILL.md（canonical 側）の構造 |
| PASS 条件 | 10 要素すべてが残存（目視チェック） |
| 実行手段 | チェックリスト記入 + `rg` で目視補助 |
| evidence | `outputs/phase-04/evidence/entry-checklist-<skill>.md` |
| カバー AC | AC-3 |

#### entry 残置要素チェックリスト

| # | 要素 | 検出方法 | 必須 |
| --- | --- | --- | --- |
| 1 | front matter（`---` 〜 `---`） | `head -n 20` 目視 | yes |
| 2 | 概要 5〜10 行 | front matter 直後の段落 | yes |
| 3 | trigger | `rg '^trigger:' SKILL.md` | yes |
| 4 | allowed-tools | `rg '^allowed-tools:' SKILL.md` | yes |
| 5 | Anchors セクション | `rg '^## Anchors' SKILL.md` | yes |
| 6 | クイックスタート | `rg '^##.*クイックスタート' SKILL.md` | yes |
| 7 | モード一覧 | `rg '^##.*モード' SKILL.md` | yes |
| 8 | references リンク表 | `rg '^\| topic \|' SKILL.md` または `rg 'references/.*\.md'` | yes |
| 9 | 最小 workflow | `rg '^##.*workflow' SKILL.md` | yes |

### V6. 意味的書き換え混入検査（Mechanical Cut & Paste Verification）

| 項目 | 内容 |
| --- | --- |
| 対象 | `git diff` の追加行 / 削除行 |
| PASS 条件 | 削除行（旧 SKILL.md 該当区間）と追加行（references/<topic>.md 該当区間）がセクション境界に整列し、テキスト本体が完全一致 |
| 実行コマンド | `git diff --stat` + `git diff -- .claude/skills/<skill>` 目視 |
| evidence | `outputs/phase-04/evidence/semantic-diff-<skill>.md` |
| カバー AC | AC-2, AC-3（cut & paste 原則） |

検査手順:

1. PR ブランチで `git diff main -- .claude/skills/<skill>/SKILL.md` を取得し、削除行を抽出。
2. 同 PR で `git diff main -- .claude/skills/<skill>/references/` の追加行を抽出。
3. 削除行群と追加行群を `diff <(sort) <(sort)` で突合し、差分が「セクション見出しの再配置のみ」であることを確認。
4. 加筆や言い換えが混入している場合は FAIL とし、Phase 5 の cut & paste やり直し。

## AC ↔ 検証カテゴリ対応表

| AC | 内容 | V1 | V2 | V3 | V4 | V5 | V6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 全対象 SKILL.md が 200 行未満 | ◎ | | | | | |
| AC-2 | references が単一責務命名で配置 | | | ◎ | | | ◎ |
| AC-3 | entry に 10 要素が保持 | | | | | ◎ | ◎ |
| AC-4 | SKILL.md → references 片方向、循環なし | | ◎ | | | | |
| AC-5 | canonical / mirror 差分 0 | | | | ◎ | | |
| AC-6 | 行数検査スクリプトで全件 OK | ◎ | | | | | |
| AC-7 | リンク切れ 0 件 | | ◎ | | | | |
| AC-8 | 未参照 reference 0 件 | | | ◎ | | | |
| AC-9 | task-specification-creator が単独 PR で 200 行未満 | ◎ | | | | | |
| AC-10 | skill 改修ガイドに Anchor 追記 | | | | | ◎ | |
| AC-11 | 4条件最終判定 PASS | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ |

## 実行手順

1. `outputs/phase-04/test-strategy.md` を新規作成し、本 Phase の 6 検証カテゴリ（V1〜V6）を転記する。
2. 各検証カテゴリのコマンドスニペットを `outputs/phase-04/scripts/` 配下に shell スクリプトとして記述（`line-count.sh` / `link-integrity.sh` / `orphan-references.sh` / `mirror-diff.sh`）。
3. entry 残置要素チェックリストを `outputs/phase-04/checklists/entry-checklist-template.md` として雛形化。
4. AC ↔ 検証カテゴリ対応表を Phase 7（AC マトリクス）と相互参照可能なフォーマットで保存。
5. evidence 保存先 `outputs/phase-04/evidence/` を作成し、Phase 5 の Step 5 完了時に成果物を流し込む準備を整える。

## 多角的チェック観点

- 価値性: 6 検証カテゴリが AC-1〜AC-11 をすべてカバーするか（対応表で空セル無し）。
- 実現性: 全カテゴリが `wc` / `rg` / `find` / `diff` / `git diff` のみで完結し、特殊ツール不要か。
- 整合性: 既存 `.claude/skills/aiworkflow-requirements/` の references レイアウトと同一規約に揃うか。
- 運用性: PR ごとに evidence ログが自動生成可能で、レビューアが目視でも確認できるか。
- 不変条件: 「機械的 cut & paste のみ」を V6 で構造的に担保しているか。

## 統合テスト連携

docs-only / spec_created のためアプリ統合テストは対象外。代替として、行数検査・リンク健全性・未参照 reference・canonical / mirror diff・entry 10 要素確認を統合検証セットとして扱う。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 6 検証カテゴリ + AC 対応表 + コマンド集 |
| スクリプト | outputs/phase-04/scripts/*.sh | 4 種の自動検証スクリプト雛形 |
| チェックリスト | outputs/phase-04/checklists/entry-checklist-template.md | entry 残置要素 9 項目チェック雛形 |
| evidence 配置 | outputs/phase-04/evidence/ | Phase 5 で生成するログの受け皿 |
| メタ | artifacts.json | Phase 4 状態更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 6 検証カテゴリ（V1〜V6）の 4 項目（対象 / PASS 条件 / 実行コマンド / evidence）に空欄が無い
- [ ] AC-1〜AC-11 がすべて 1 つ以上の検証カテゴリにマップ
- [ ] 行数検査スクリプトが `wc -l` ベースで全 `.claude/skills/*/SKILL.md` を走査
- [ ] リンク健全性検査が `rg` + `test -f` で双方向検証
- [ ] 未参照 reference 検査が `find` + `rg -F` で全 reference を網羅
- [ ] canonical / mirror diff 検査が `diff -r` で全 skill 走査
- [ ] entry 残置要素チェックリストが 10 要素を網羅
- [ ] 意味的書き換え混入検査が `git diff` ベースで定義済

## タスク 100% 実行確認【必須】

- 実行タスク 7 件すべてが `spec_created`
- 成果物が `outputs/phase-04/test-strategy.md` に配置済み
- AC-1〜AC-11 すべてに 1 つ以上の検証カテゴリが対応
- evidence 保存先が Phase 5 と整合
- スクリプト雛形が `outputs/phase-04/scripts/` に列挙

## 次 Phase への引き渡し

- 次 Phase: 5 (実装ランブック)
- 引き継ぎ事項:
  - 6 検証カテゴリのコマンドを Phase 5 ランブック Step 5（mirror 同期 + 検証）に紐付け
  - evidence パス `outputs/phase-04/evidence/` を Phase 5 の最終成果物保存先として共有
  - V5 entry 残置要素チェックリストを Phase 5 Step 4（入口リライト）の完了条件に組み込み
  - V6 意味的書き換え検査を Phase 5 各 Step 完了時の必須ゲートに昇格
- ブロック条件:
  - V1〜V6 のいずれかで PASS 条件が未確定
  - AC-9（task-specification-creator 単独 PR）に対応する検証手順が抜けている
