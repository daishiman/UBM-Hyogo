# Phase 4 — テスト戦略 (Test Strategy)

## 概要

`.claude/skills/*/SKILL.md` の Progressive Disclosure 分割に対し、コード実装ではなく
構造的整合性を検証するための 6 検証カテゴリ（V1〜V6）を定義する。
全カテゴリは `wc` / `rg` / `find` / `diff` / `git diff` のみで完結し、特殊ツール不要。

evidence 保存先: `outputs/phase-04/evidence/`
スクリプト保存先: `outputs/phase-04/scripts/`

---

## 検証カテゴリ一覧

| ID | カテゴリ | 自動化 | カバー AC |
| --- | --- | --- | --- |
| V1 | 行数検査 (Line Count Verification) | 自動 | AC-1, AC-6, AC-9 |
| V2 | リンク健全性検査 (Link Integrity) | 自動 | AC-4, AC-7 |
| V3 | 未参照 reference 検出 (Orphan References) | 自動 | AC-2, AC-8 |
| V4 | canonical / mirror 差分検査 (Mirror Diff) | 自動 | AC-5 |
| V5 | entry 残置要素チェック (Entrypoint 10 Elements) | 半自動（目視併用） | AC-3, AC-10 |
| V6 | 意味的書き換え混入検査 (Mechanical Cut & Paste) | 半自動 | AC-2, AC-3 |

---

## V1. 行数検査 (Line Count Verification)

| 項目 | 内容 |
| --- | --- |
| 対象 | `.claude/skills/*/SKILL.md` 全件 |
| PASS 条件 | 全件で `wc -l` < 200 |
| 実行スクリプト | `outputs/phase-04/scripts/line-count.sh` |
| evidence | `outputs/phase-04/evidence/line-count.log` |
| カバー AC | AC-1, AC-6, AC-9 |

実行例:

```bash
bash outputs/phase-04/scripts/line-count.sh \
  | tee outputs/phase-04/evidence/line-count.log
```

判定: `FAIL:` 行が 1 件でも存在すれば NG。`exit 1` で CI 連携可能。

---

## V2. リンク健全性検査 (Link Integrity)

| 項目 | 内容 |
| --- | --- |
| 対象 | 各 SKILL.md 内の `references/<topic>.md` 相対リンク |
| PASS 条件 | SKILL.md から指す全 references パスが実在 |
| 実行スクリプト | `outputs/phase-04/scripts/link-integrity.sh` |
| evidence | `outputs/phase-04/evidence/link-integrity.log` |
| カバー AC | AC-4, AC-7 |

実行例:

```bash
bash outputs/phase-04/scripts/link-integrity.sh \
  | tee outputs/phase-04/evidence/link-integrity.log
```

副次検査: `rg -n '\.\./SKILL\.md|\.\./\.\./SKILL\.md' .claude/skills/*/references/`
で references → SKILL.md への戻り参照が 0 件であることを確認 (AC-4 片方向)。

---

## V3. 未参照 reference 検出 (Orphan References)

| 項目 | 内容 |
| --- | --- |
| 対象 | `.claude/skills/<skill>/references/*.md` 全件 |
| PASS 条件 | 全 reference ファイルが SKILL.md 内のリンク表で 1 回以上参照される |
| 実行スクリプト | `outputs/phase-04/scripts/orphan-references.sh` |
| evidence | `outputs/phase-04/evidence/orphan-references.log` |
| カバー AC | AC-2, AC-8 |

---

## V4. canonical / mirror 差分検査 (Mirror Diff)

| 項目 | 内容 |
| --- | --- |
| 対象 | `.claude/skills/<skill>` ↔ `.agents/skills/<skill>` |
| PASS 条件 | `diff -r` の出力が空 |
| 実行スクリプト | `outputs/phase-04/scripts/mirror-diff.sh` |
| evidence | `outputs/phase-04/evidence/mirror-diff.log` |
| カバー AC | AC-5 |

---

## V5. entry 残置要素チェック (Entrypoint 10 Elements)

分割後 SKILL.md に「entry として loader が必要な 10 要素」が残存していることを確認する。
詳細チェックリスト雛形: `outputs/phase-04/checklists/entry-checklist-template.md`

| # | 要素 | 検出方法 | 必須 |
| --- | --- | --- | --- |
| 1 | front matter (`---` 〜 `---`) | `head -n 20` 目視 | yes |
| 2 | 概要 5〜10 行 | front matter 直後の段落 | yes |
| 3 | trigger | `rg -n '(^trigger:|TRIGGER when)' SKILL.md` | yes |
| 4 | allowed-tools | `rg -n '^allowed-tools:' SKILL.md` | yes |
| 5 | Anchors セクション | `rg -n '^##.*Anchors' SKILL.md` | yes |
| 6 | クイックスタート | `rg -n '^##.*(クイックスタート|Quick Start)' SKILL.md` | yes |
| 7 | モード一覧 | `rg -n '^##.*モード' SKILL.md` | yes |
| 8 | agent 導線 | `rg -n '^##.*(エージェント\|agent)' SKILL.md` | yes |
| 9 | references リンク表 | `rg -n 'references/.*\.md' SKILL.md` | yes |
| 10 | 最小 workflow | `rg -n '^##.*(workflow\|ワークフロー)' SKILL.md` | yes |

evidence: `outputs/phase-04/evidence/entry-checklist-<skill>.md`
カバー AC: AC-3, AC-10（Anchor 追記の可視化）

---

## V6. 意味的書き換え混入検査 (Mechanical Cut & Paste)

| 項目 | 内容 |
| --- | --- |
| 対象 | `git diff main -- .claude/skills/<skill>` の追加行 / 削除行 |
| PASS 条件 | 削除行群（旧 SKILL.md 区間）と追加行群（references/<topic>.md 区間）がセクション境界に整列し、テキスト本体が一致 |
| 実行コマンド | `git diff --stat main -- .claude/skills/<skill>` + 目視 |
| evidence | `outputs/phase-04/evidence/semantic-diff-<skill>.md` |
| カバー AC | AC-2, AC-3（cut & paste 原則） |

検査手順:

1. PR ブランチで `git diff main -- .claude/skills/<skill>/SKILL.md` を取得し、削除行を抽出。
2. `git diff main -- .claude/skills/<skill>/references/` の追加行を抽出。
3. 両者を `diff <(sort) <(sort)` で突合し、差分が「セクション見出しの再配置」のみであることを確認。
4. 加筆や言い換えが混入している場合は FAIL とし、Phase 5 の cut & paste をやり直し。

---

## AC ↔ 検証カテゴリ対応表

| AC | 内容 | V1 | V2 | V3 | V4 | V5 | V6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 全対象 SKILL.md が 200 行未満 | ◎ | | | | | |
| AC-2 | references が単一責務命名 | | | ◎ | | | ◎ |
| AC-3 | entry に 10 要素保持 | | | | | ◎ | ◎ |
| AC-4 | SKILL.md → references 片方向 | | ◎ | | | | |
| AC-5 | canonical / mirror 差分 0 | | | | ◎ | | |
| AC-6 | 行数検査全件 OK | ◎ | | | | | |
| AC-7 | リンク切れ 0 件 | | ◎ | | | | |
| AC-8 | 未参照 reference 0 件 | | | ◎ | | | |
| AC-9 | task-specification-creator 単独 PR で 200 行未満 | ◎ | | | | | |
| AC-10 | skill 改修ガイドに Anchor 追記 | | | | | ◎ | |
| AC-11 | 4条件最終判定 PASS | ◎ | ◎ | ◎ | ◎ | ◎ | ◎ |

---

## 実行順序（推奨）

1. V1（行数検査） — 最速で全体傾向を把握
2. V4（mirror diff） — canonical/mirror 整合性
3. V2（リンク健全性） — リンク切れ検出
4. V3（orphan references） — 未参照検出
5. V5（entry 10 要素） — 構造保持確認
6. V6（cut & paste） — 意味的書き換え混入検出（PR レビュー時）

---

## evidence 保存規約

- 全 evidence は `outputs/phase-04/evidence/` 配下に集約。
- ファイル名は `<verification-id>-<skill?>.log` 形式。
- 行末改行を保ち、PR description に貼付可能。
- Phase 11 の manual-smoke-log.md にもダイジェストを引用する。
