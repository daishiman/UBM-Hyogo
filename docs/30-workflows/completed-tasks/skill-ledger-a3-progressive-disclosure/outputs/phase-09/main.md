# Phase 9 — 品質保証 (QA)

本タスク特有の品質観点 5 つ (無料枠影響 / skill loader 動作 / mirror 同期 /
1 PR = 1 skill / ドッグフーディング) を Phase 4 の検証カテゴリと結線して
品質ゲート総点検する。a11y は対象外 (Markdown 編集のみ、UI なし)。

無料枠影響なしの根拠詳細は `outputs/phase-09/free-tier-estimation.md` 参照。

---

## QA 観点サマリ

| # | 観点 | 結論 | 根拠 |
| --- | --- | --- | --- |
| Q1 | 無料枠影響 | 影響なし | Cloudflare / Google API 不使用 (free-tier-estimation.md) |
| Q2 | skill loader 動作 | entry 健全性のみ確認 (loader doctor 未提供のため Phase 11 で目視) | front matter 健全性 + entry 10 要素 (V5) |
| Q3 | mirror 同期自動化 | `rsync --delete` + `diff -r` で冪等的に成立 | Phase 5 ランブック / Phase 4 V4 |
| Q4 | 1 PR = 1 skill 厳守 | チェックリスト 7 項目で担保 | 下記チェックリスト |
| Q5 | ドッグフーディング | task-specification-creator 単独 PR で 200 行未満化 | AC-9 / AC-10 (Phase 7 マトリクス) |
| Q6 | a11y | 対象外 | Markdown 編集のみ |
| Q7 | line budget (phase-XX.md 100-250 行) | 個別判定 | 下記 budget 表 |

---

## Q1. 無料枠影響: 影響なし

> 詳細: `outputs/phase-09/free-tier-estimation.md`

| サービス | 本タスクでの利用 | 影響 |
| --- | --- | --- |
| Cloudflare Workers | 利用しない | なし |
| Cloudflare D1 | 利用しない | なし |
| Google Sheets API | 利用しない | なし |
| Google Forms API | 利用しない | なし |
| GitHub API (gh CLI) | PR 作成時のみ (Phase 13) | 個人開発の通常使用範囲内 |

**結論: 本タスクは Cloudflare / Google API を一切呼ばない。無料枠影響は「なし」。**

---

## Q2. skill loader 動作確認

| 状況 | 対応 |
| --- | --- |
| loader doctor スクリプトが提供されている | 実行して entry SKILL.md が分割後も entrypoint として解決できることを確認 |
| loader doctor 未提供 (現状) | Phase 11 の手動 smoke で `rg -n '^---' SKILL.md` 等を用い front matter 健全性を目視 |

> 本タスクは loader / doctor 本体に手を入れない (index.md スコープ外)。動作確認は「entry が壊れていないこと」を起点とする最小確認。

確認コマンド (Phase 11 で実行):

```bash
# front matter の存在
for f in .claude/skills/*/SKILL.md; do
  rg -nq '^---$' "$f" && echo "OK: $f front matter exists" || echo "FAIL: $f"
done

# 必須 10 要素 (V5 entry-checklist) の充足
# → outputs/phase-04/checklists/entry-checklist-template.md を skill ごとに記入
```

---

## Q3. mirror 同期の自動化

### 推奨コマンド

```bash
# canonical → mirror 全 skill 同期 (--delete でずれを物理矯正)
rsync -av --delete .claude/skills/ .agents/skills/

# 単一 skill のみ同期
rsync -av --delete ".claude/skills/<skill>/" ".agents/skills/<skill>/"

# 差分検証 (AC-5)
bash outputs/phase-04/scripts/mirror-diff.sh
```

### 冪等性の根拠

- `rsync --delete` は canonical を正本として mirror を完全一致させる。再実行で結果不変。
- `diff -r` で差分 0 を確認できた時点で同期は冪等的に達成。
- Phase 5 ランブックには「PR の最終 commit で必ず rsync を 1 回実行 → diff -r で 0 を確認」を含める。

### 自動化のスコープ判定

- pre-commit hook 等への組み込みは **本タスクスコープ外** (hook 整備は別タスク化)。
- 本タスクでは「ランブック上の手順として明示」「`diff -r` を AC-5 として完了条件化」までで止める。

---

## Q4. 1 PR = 1 skill 厳守チェックリスト

- [ ] 1 PR は 1 つの `.claude/skills/<skill>/` のみを変更する
- [ ] `task-specification-creator` は最優先・単独 PR で先行する
- [ ] Anchor 追記 (AC-10「fragment で書け」「200 行を超えたら分割」) は分割本体とは別の小 PR で実施
- [ ] 同一 PR 内で複数 skill を編集しない (影響範囲局所化)
- [ ] PR タイトルに対象 skill 名を明記 (例: `refactor(skill): split task-specification-creator into references/`)
- [ ] revert は 1 PR 単位で完結する
- [ ] PR 着手前に skill 単位で announce (並列衝突回避)

---

## Q5. ドッグフーディング検証 (task-specification-creator)

| 項目 | 確認方法 | PASS 条件 |
| --- | --- | --- |
| `task-specification-creator/SKILL.md` 行数 | `wc -l .claude/skills/task-specification-creator/SKILL.md` | < 200 |
| 単独 PR で完結 | `git log --oneline -- .claude/skills/task-specification-creator/SKILL.md` | 単一 PR |
| Anchor 追記 | `rg -n 'fragment で書け\|200 行を超えたら分割' .claude/skills/task-specification-creator/` | 2 フレーズ存在 |
| references 配置 | `find .claude/skills/task-specification-creator/references -name '*.md'` | Phase 2 設計表通り |

> 現在の `wc -l` は 517 (Phase 1 inventory 確認済み)。Phase 5 完了時に < 200 へ。
> spec_created 段階では「上記 4 項目の検証手順が記述されている」ことが PASS 基準。実値検証は Phase 11。

---

## Q6. a11y 対象外宣言

- 本タスクは `.claude/skills/*/SKILL.md` および `references/*.md` の Markdown 編集のみ。
- UI を持たないため WCAG / ARIA / コントラスト等の a11y チェックは **対象外**。

---

## Q7. Line budget 表 (phase-XX.md 100-250 行)

| ファイル | budget | 想定 | 判定 |
| --- | --- | --- | --- |
| index.md | 250 行以内 | 約 180 行 | PASS |
| phase-01.md 〜 phase-13.md | 各 100-250 行 | 各 100-260 行 | 個別判定 (大半 PASS) |
| outputs/phase-04/test-strategy.md | 個別 | 約 180 行 | PASS |
| outputs/phase-06/failure-cases.md | 個別 | 約 220 行 | PASS |
| outputs/phase-07/ac-matrix.md | 個別 | 約 130 行 | PASS |
| outputs/phase-08/main.md | 個別 | 約 170 行 | PASS |
| outputs/phase-08/before-after.md | 個別 | 約 150 行 | PASS |
| outputs/phase-09/main.md (本ファイル) | 個別 | 〜 200 行 | PASS |
| outputs/phase-10/go-no-go.md | 個別 | 〜 220 行 | PASS |

> phase-XX.md が 250 行を超える場合は Phase 12 ドキュメント更新時に分割を検討。

---

## Phase 4 検証カテゴリとの結線

| QA 観点 | 結線する V | 結線方法 |
| --- | --- | --- |
| Q3 mirror 同期 | V4 | `mirror-diff.sh` を完了条件化 |
| Q5 ドッグフーディング | V1, V5 | 行数検査 + entry 10 要素チェック |
| Q4 1 PR = 1 skill | (V 横断) | PR 描述で対象 skill 単一を確認 |
| Q2 loader 健全性 | V5 | front matter / 10 要素確認 |

---

## 完了条件

- [x] `outputs/phase-09/free-tier-estimation.md` に「影響なし」と根拠が記述
- [x] skill loader 動作確認の方針が明記 (未提供時 N/A、Phase 11 で代替確認)
- [x] mirror 同期の推奨コマンド (rsync + diff) が記述
- [x] 1 PR = 1 skill チェックリストが 7 項目以上
- [x] ドッグフーディング検証手順 (4 項目) が AC-9 / AC-10 と紐付き
- [x] line budget 表が記述
- [x] a11y 対象外と明記

---

## 次 Phase (10) への引き継ぎ

- 無料枠影響「なし」を Phase 10 GO/NO-GO の根拠として転記
- 1 PR = 1 skill チェックリスト → Phase 13 PR 作成時の self-review に再利用
- ドッグフーディング検証手順 → Phase 11 manual smoke の入力
- mirror 同期コマンド → Phase 11 で `diff -r` 実行ログを取得
