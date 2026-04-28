# skill LOGS / changelog の fragment 化 - タスク指示書

## メタ情報

| 項目         | 内容                                                            |
| ------------ | --------------------------------------------------------------- |
| タスクID     | task-skill-ledger-a2-fragment                                   |
| タスク名     | skill LOGS / changelog / lessons-learned の fragment 化         |
| 分類         | リファクタリング                                                |
| 対象機能     | skill ledger（`.claude/skills/<skill>/` 配下の append-only 群） |
| 優先度       | 高                                                              |
| 見積もり規模 | 中規模                                                          |
| ステータス   | 未実施                                                          |
| 発見元       | task-conflict-prevention-skill-state-redesign Phase 12          |
| 発見日       | 2026-04-28                                                      |
| 位置付け     | A-1 / A-3 / B-1 の前段。本タスクが先頭タスクで他は本タスクに依存 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-conflict-prevention-skill-state-redesign` で、複数 worktree 並列開発時の skill ledger 衝突を解消するため A-2「Changesets パターンによる fragment 化」が選定された。
対象は以下 3 種:

- `aiworkflow-requirements/LOGS.md` — 単一 append-only Markdown
- `task-specification-creator/SKILL-changelog.md` — 単一 append-only changelog
- `**/lessons-learned-*.md` — 単一ファイル append

これらは **append-only 規約のもとでも、複数 worktree が同じ末尾行に追記すると 3-way merge で同一バイト位置が衝突する**。
1 entry = 1 file の fragment に変えれば、各 worktree が別 path を新規作成するため、同位置の競合が物理的に発生しない。

### 1.2 問題点・課題

- 4 worktree 並列実行時、`LOGS.md` の末尾追記が頻繁に conflict → 解消に毎回 5〜10 分のコスト
- 既存履歴の append 形式は append helper / hook / 手動運用が混在しており、書き手ごとに format ぶれが発生
- 集約 view（時系列降順）が「ファイルを読めば自然に読める」という前提に依存し、render 機構を持たないため、fragment 化すると読みづらくなる懸念

### 1.3 放置した場合の影響

- 並列開発が増えるほど merge コストが線形に増加
- 衝突回避のため worktree 間で「LOGS を触る順番」を口頭調整する非スケーラブルな運用が固定化
- 後続施策 A-1（gitignore 化）/ A-3（Progressive Disclosure）/ B-1（merge=union）の前提（fragment 受け皿）が満たされず、redesign 全体が止まる

---

## 2. 何を達成するか（What）

### 2.1 目的

skill ledger を **1 entry = 1 file** の fragment 形式へ移行し、`pnpm skill:logs:render` による on-demand 集約 view を提供する。
既存履歴は `_legacy.md` として温存し、blame / log の連続性を維持する。

### 2.2 最終ゴール

- `LOGS/<YYYYMMDD>-<HHMMSS>-<escaped-branch>-<nonce>.md` が正本形式として運用されている
- `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` が `_legacy.md` 形式で退避済み
- `pnpm skill:logs:render` で時系列降順の集約 Markdown が stdout / `--out` に出力できる
- append helper（`pnpm skill:logs:append` 相当）が `LOGS.md` 直接追記を一切行わない
- 4 worktree 並列 smoke で fragment 由来の conflict が 0 件

### 2.3 スコープ

#### 含むもの

- fragment ディレクトリ作成（`LOGS/` `changelog/` `lessons-learned/`）と `.gitkeep` 追跡
- 既存 ledger の `_legacy.md` への `git mv` 退避
- writer / append helper の fragment 生成方式への書換え
- `pnpm skill:logs:render` script 実装（**T-5 を本タスクに包含**）
- legacy migration（**T-7 を本タスクに包含**）
- front matter 必須項目の検証（fail-fast）
- 4 worktree 並列 smoke 検証

#### 含まないもの

- A-1（自動生成 ledger の `.gitignore` 化）の実施
- A-3（SKILL.md の Progressive Disclosure 分割）の実施
- B-1（`.gitattributes merge=union`）の適用
- skill 本体の機能変更
- legacy ledger の物理削除（履歴温存方針のため禁止）

### 2.4 成果物

- `.claude/skills/aiworkflow-requirements/LOGS/` ディレクトリ + `.gitkeep`
- `.claude/skills/task-specification-creator/changelog/` ディレクトリ + `.gitkeep`
- `.claude/skills/*/lessons-learned/` ディレクトリ + `.gitkeep`
- `_legacy.md` 退避済み既存履歴
- `scripts/skill-logs-render.ts`（または相当の TS 実装）
- `package.json` の `skill:logs:render` script 登録
- append helper（既存 hook / writer の fragment 化版）
- 4 worktree 並列 smoke 結果ログ

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-conflict-prevention-skill-state-redesign` の Phase 1〜13 が承認済
- Node 24 / pnpm 10（`mise exec --` 経由）が利用可能
- 並列開発中の他 worktree が同 ledger を触らない announce 済

### 3.2 依存タスク

- 上流: `task-conflict-prevention-skill-state-redesign`（仕様書承認）
- 下流: `task-skill-ledger-a1-gitignore` / `task-skill-ledger-a3-progressive-disclosure` / `task-skill-ledger-b1-gitattributes`（**全て本タスクに依存**）

### 3.3 必要な知識

- `outputs/phase-2/fragment-schema.md`（命名規約・正規表現・front matter）
- `outputs/phase-2/render-api.md`（CLI / TS API 仕様）
- `outputs/phase-6/fragment-runbook.md`（実装手順）
- `outputs/phase-12/implementation-guide.md`（実装順序・型定義・PR テンプレート）
- Changesets パターン（fragment + render の概念）
- `git mv` による rename 検出と blame 連続性

### 3.4 推奨アプローチ

実装順を厳密に守る:

1. fragment 受け皿（ディレクトリ + `.gitkeep`）を **先に作る**
2. legacy 退避（`git mv`）を 1 コミットで実施し、blame 断絶を最小化
3. render script を実装し、legacy + fragment の merge view が出ることを確認
4. **最後に** writer / append helper を fragment 生成方式に切替（順序を逆にすると render できない期間が生じる）

---

## 4. 実行手順

### Phase構成

1. fragment 受け皿作成
2. legacy 退避
3. render script 実装
4. append helper 切替
5. 検証（4 worktree 並列 smoke）

### Phase 1: fragment 受け皿作成

#### 目的

新形式の保存先ディレクトリを作成し、空ディレクトリを git 追跡可能にする。

#### 手順

1. 対象 skill ごとに `LOGS/` `changelog/` `lessons-learned/` を `mkdir -p`
2. `.gitkeep` を `touch` し追加
3. 命名規約 regex を `scripts/skill-logs-render.ts` の定数に固定化（実装は Phase 3 だが、定数だけ先に置く）

#### 成果物

- `.claude/skills/<skill>/LOGS/.gitkeep` 等
- 命名 regex 定数

#### 完了条件

- `git status` で各 `.gitkeep` が tracked
- 受け皿が空でも CI / lint がエラーを出さない

### Phase 2: legacy 退避

#### 目的

既存 `LOGS.md` / `SKILL-changelog.md` / `lessons-learned-*.md` を `_legacy.md` として fragment ディレクトリ配下に温存する。

#### 手順

1. `git mv .claude/skills/aiworkflow-requirements/LOGS.md .claude/skills/aiworkflow-requirements/LOGS/_legacy.md`
2. `git mv .claude/skills/task-specification-creator/SKILL-changelog.md .claude/skills/task-specification-creator/changelog/_legacy.md`
3. `lessons-learned-*.md` は内容スコープごとに `lessons-learned/_legacy-<original-base>.md` へ退避
4. 1 commit でまとめる: `refactor(skill): move ledgers to fragment dir as _legacy (A-2)`

#### 成果物

- `_legacy.md` 群
- rename 検出済み git 履歴

#### 完了条件

- `git log --follow LOGS/_legacy.md` で旧 `LOGS.md` の履歴が継続
- 旧 path への参照（`git grep 'LOGS\.md'` 等）が writer 以外で 0 件

### Phase 3: render script 実装

#### 目的

`pnpm skill:logs:render` で fragment + `_legacy.md` を timestamp 降順 merge した集約 view を出力する。

#### 手順

1. `RenderSkillLogsOptions` 型を定義（`skill` / `since` / `out` / `includeLegacy`）
2. `renderSkillLogs(options)` を `scripts/skill-logs-render.ts` に実装
3. `LOGS/*.md` を readdir → front matter parse → timestamp 降順 sort → stream filter → 出力
4. `--include-legacy` 指定時は legacy include window（既定 30 日）内の `_legacy*.md` の本文も末尾「Legacy」セクションに連結
5. `package.json` に `"skill:logs:render": "tsx scripts/skill-logs-render.ts"` 等で登録
6. front matter（`timestamp` / `branch` / `author` / `type`）が欠損 / parse 不能なら **対象 path を stderr に出力して exit 1**
7. `--out` が tracked canonical ledger を指す場合は exit 2

#### 成果物

- `scripts/skill-logs-render.ts`
- `package.json` への script 登録
- 単体テスト（fragment 0 件 / 1 件 / N 件 / 不正 front matter）

#### 完了条件

- `pnpm skill:logs:render --skill aiworkflow-requirements` が legacy 内容を降順で出力
- 不正 fragment が 1 件あると path 付き exit 1
- `--out` が gitignore 対象外なら exit 2

### Phase 4: append helper 切替

#### 目的

writer / hook / 手動運用が `LOGS.md` 直接追記をやめ、fragment 生成方式へ移行する。

#### 手順

1. `git grep -n 'LOGS\.md' .claude/skills/` 等で append 箇所を全列挙
2. 各箇所を fragment 生成方式へ書換え（`ts=$(date -u +%Y%m%d-%H%M%S)` / `branch_esc=...` / `nonce=$(openssl rand -hex 4)` で path 生成 → front matter 付き fragment 作成）
3. append helper（`pnpm skill:logs:append` 相当 / hook 内 shell）を共通実装に集約
4. 同一秒・同一 branch でも nonce で衝突しないことを単体テストで保証
5. append 残存箇所を CI で 0 件チェック（`git grep 'LOGS\.md' .claude/skills/` の writer ヒット 0）

#### 成果物

- 新 append helper
- writer 書換え差分
- CI 0 件チェック

#### 完了条件

- writer 経路で `LOGS.md` 直接追記が 0 件
- 同一秒・同一 branch でも fragment path が必ず一意

### Phase 5: 検証（4 worktree 並列 smoke）

#### 目的

fragment 化が conflict 0 件を実現することを実機検証する。

#### 手順

1. `bash scripts/new-worktree.sh verify/a2-1` 〜 `verify/a2-4` で 4 worktree 作成
2. 各 worktree から `pnpm skill:logs:append` で fragment 生成 → commit
3. main から 4 branch を順次 merge
4. `git ls-files --unmerged` が 0 行であることを確認
5. `pnpm skill:logs:render --skill <skill>` で 4 entry が timestamp 降順で出力されることを確認
6. 証跡を `outputs/phase-11/evidence/<run-id>/` に保存

#### 成果物

- 4 worktree merge ログ
- render 出力確認ログ

#### 完了条件

- merge exit code 0
- conflict 0 件
- render 出力に 4 entry 全部が含まれる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] LOGS / changelog / lessons-learned の fragment 保存先が作成されている
- [ ] 既存 ledger が `_legacy.md` として保持され、blame が連続している
- [ ] append writer が `LOGS.md` 直接追記を行わない
- [ ] `pnpm skill:logs:render` が timestamp 降順で出力する
- [ ] 不正 front matter が file path 付きで fail-fast する（exit 1）
- [ ] `--out` が tracked canonical ledger を指すと exit 2
- [ ] `--include-legacy` で legacy include window 30 日が機能する
- [ ] 4 worktree smoke で fragment 由来の conflict が 0 件

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] render script の単体テスト緑
- [ ] CI で writer 残存 grep 0 件チェックが緑

### ドキュメント要件

- [ ] `.claude/skills/<skill>/SKILL.md` から fragment 形式への参照が追加
- [ ] `outputs/phase-12/system-spec-update-summary.md` の正本化対象を反映

---

## 6. 検証方法

### テストケース

- 同秒・同 branch で fragment 2 件作成 → 命名衝突なし（C-1）
- 異なる branch / 異なる秒 → 衝突なし（C-2）
- render 出力が timestamp 降順（C-6）
- timestamp 欠損 fragment → render fail-fast、対象 path が stderr に出る（C-7）
- legacy include window 外の `_legacy.md` は `--include-legacy` 指定時のみ出力
- 4 worktree 並列 merge → conflict 0 件

### 検証手順

```bash
# 受け皿確認
ls -la .claude/skills/aiworkflow-requirements/LOGS/

# render 動作
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements > /tmp/render.txt
head -n 20 /tmp/render.txt

# 不正 front matter 検証
echo '---\n---\n' > .claude/skills/aiworkflow-requirements/LOGS/20260101-000000-broken-deadbeef.md
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements
echo "exit: $?"   # => 1

# 4 worktree 並列 smoke
for n in 1 2 3 4; do bash scripts/new-worktree.sh verify/a2-$n; done
# 各 worktree で append → main から merge
git ls-files --unmerged   # => 0 行

# writer 残存チェック
git grep -n 'LOGS\.md' .claude/skills/   # => 0 件（writer 経路）
```

---

## 7. リスクと対策

| リスク                                                                             | 影響度 | 発生確率 | 対策                                                                                                                       |
| ---------------------------------------------------------------------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| append-only 規約を破る writer が残存し、A-2 効果が失われる                         | 高     | 中       | CI で `git grep 'LOGS\.md' .claude/skills/` の writer ヒット 0 件を必須化                                                    |
| 同一秒・同一 branch で nonce が衝突する                                            | 中     | 極低     | 8 hex（32bit）nonce で実質 1/2^32。事前存在チェック → 衝突時は再生成リトライをルーチン化                                    |
| `_legacy.md` の rename 検出が失敗し blame が断絶                                   | 中     | 中       | `git mv` を必ず使用し、退避を 1 コミットに集約。`git log --follow` で履歴連続性をテスト                                     |
| render script が `_legacy.md` と新規 fragment を混在マージできず順序が崩れる       | 中     | 中       | `_legacy.md` から擬似 timestamp（mtime / 内容の最終 entry 日付）を抽出する変換層を render に組み込み、テストで降順を保証   |
| 4 worktree smoke で意図せず conflict 0 件を達成できない                            | 高     | 低       | smoke 前に worktree 間の announce、smoke 失敗時は writer 残存箇所の追跡を最優先                                             |
| writer 切替前に append helper が中途半端で fragment 生成と直接追記が併存          | 高     | 中       | Phase 4 を 1 PR で完結させ、レビュアー必須項目に「append 残存 grep 0 件」を含める                                            |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/fragment-schema.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-2/render-api.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-6/main.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-6/fragment-runbook.md`
- `docs/30-workflows/task-conflict-prevention-skill-state-redesign/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/unassigned-task/task-skill-ledger-a1-gitignore.md`（後続）
- `docs/30-workflows/unassigned-task/task-skill-ledger-a3-progressive-disclosure.md`（後続）
- `docs/30-workflows/unassigned-task/task-skill-ledger-b1-gitattributes.md`（後続）

### 参考資料

- Changesets パターン（fragment + render の OSS 事例）
- `git mv` による rename 検出仕様

### 設定項目と定数

| 項目                  | 値                                                          |
| --------------------- | ----------------------------------------------------------- |
| fragment 命名 regex   | `^LOGS/[0-9]{8}-[0-9]{6}-[a-z0-9_-]+-[a-f0-9]{8}\.md$`      |
| timestamp format      | `YYYYMMDD-HHMMSS`（UTC）                                    |
| nonce length          | 8 hex（4 byte）                                             |
| escaped-branch 上限   | 64 文字                                                     |
| path 全体上限         | 240 byte（NTFS 互換マージン）                               |
| legacy include window | 30 日                                                       |
| front matter 必須     | `timestamp` / `branch` / `author` / `type`                  |

### CLI / TS API

```bash
pnpm skill:logs:render --skill <name> [--since <ISO>] [--out <path>] [--include-legacy]
```

```ts
export interface RenderSkillLogsOptions {
  skill: string;
  since?: string;
  out?: string;
  includeLegacy?: boolean;
}

export async function renderSkillLogs(options: RenderSkillLogsOptions): Promise<string>;
```

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状 1   | 既存 `LOGS.md` の append-only 規約を破らずに移行する難しさ。writer / hook / 手動運用が混在しており、どれか 1 経路が直接追記を続けると A-2 効果（conflict 0 件）が完全に失われる                                                                  |
| 原因 1   | append 経路が複数モジュールに散らばっており、grep ベースで全列挙してもレビュー時に見落としが発生する                                                                                                                                            |
| 対応 1   | Phase 4 で writer 切替を 1 PR で完結させ、CI に `git grep 'LOGS\.md' .claude/skills/` の writer ヒット 0 件チェックを追加。Phase 1〜3 は writer 切替前でも legacy 経由で動作するよう設計                                                          |
| 症状 2   | 同一秒・同一 branch から fragment が 2 件生成されると path が衝突する                                                                                                                                                                           |
| 原因 2   | 当初仕様で `<YYYYMMDD>-<HHMMSS>-<branch>.md` のみだったため、秒精度では並列追記に耐えなかった                                                                                                                                                   |
| 対応 2   | 8 hex（32bit）nonce を必須化。1 worktree 秒間 1000 ファイル生成でも期待衝突回数 ≈ 1.16×10⁻⁴ に抑制。事前存在チェック → 衝突時は再生成リトライを append helper に組み込む                                                                          |
| 症状 3   | render script が `_legacy.md` と新規 fragment を timestamp 降順で merge する際、legacy には fragment と同形式の timestamp が無いため順序が崩れる                                                                                                |
| 原因 3   | legacy は append-only 1 ファイル形式で、entry ごとの timestamp が本文中の自由記述に埋まっている                                                                                                                                                 |
| 対応 3   | render に擬似 timestamp 抽出層を入れる（legacy ファイルの mtime か、本文末尾 entry の日付を heuristic で抽出）。`--include-legacy` 指定時のみ末尾「Legacy」セクションへ連結し、純粋な fragment 群と混在しないようにする                          |
| 症状 4   | 4 worktree 並列 smoke で衝突 0 件を保証する手順が標準化されていない                                                                                                                                                                             |
| 原因 4   | これまで 2 worktree smoke しか経験がなく、3 way merge と 4 way merge では衝突発生条件が異なる                                                                                                                                                   |
| 対応 4   | `scripts/new-worktree.sh verify/a2-{1,2,3,4}` で 4 worktree 作成 → 各で fragment 生成 → main から順次 merge → `git ls-files --unmerged` が 0 行を必須化。証跡を `outputs/phase-11/evidence/<run-id>/` に保存し、後続タスクの reference にする |
| 再発防止 | (1) writer 切替を最後に行う実装順序を runbook に明記、(2) nonce 必須を schema regex に固定、(3) legacy 擬似 timestamp 抽出ロジックをユニットテスト化、(4) 4 worktree smoke を CI の手動 trigger ジョブとして登録                                  |

### レビュー指摘の原文（該当する場合）

```
task-conflict-prevention-skill-state-redesign Phase 12 で、A-2 fragment 化を実装する別タスクが必要と識別。
T-5（render script 実装）と T-7（legacy migration）は本タスクの subtask として包含する方針。
```

### 補足事項

- 本タスクは **後続 A-1 / A-3 / B-1 の前提** であり、必ず先頭で実施する
- T-5（render script）と T-7（legacy migration）は独立タスク化せず、本タスク内で扱う
- `_legacy*.md` は **削除禁止**（Phase 3 backward-compat 方針）
- B-1 は本タスク完了後の保険として、`_legacy*.md` のみを対象として残す案あり（後続タスクで確定）

### 苦戦箇所（ドッグフーディング設計時の追加記録）

> `outputs/phase-12/skill-feedback-report.md` F-2 / F-3 / `outputs/phase-12/implementation-guide.md` §実装順序で発見した A-2 関連の追加苦戦箇所。

| 項目     | 内容                                                                                                                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `task-specification-creator/SKILL-changelog.md` および `aiworkflow-requirements/LOGS.md` という skill 自身の append-only ledger が、複数 worktree から同時追記されて常に conflict 源になっていた（最頻発の hot spot） |
| 原因     | A-2 の対象から「skill 自身の changelog / LOGS」を当初除外していたため、redesign 効果が skill 改修 PR 自体に及ばないドッグフーディング不足                                                                              |
| 対応     | A-2 のスコープに `task-specification-creator/SKILL-changelog.md` の `changelog/_legacy.md` 退避と fragment 移行を明示的に含める（feedback F-2）。`aiworkflow-requirements/LOGS.md` は最優先対象として fragment 化する（feedback F-3） |
| 再発防止 | render script の単体テストに「skill 自身の changelog / LOGS が fragment 経由で render される」ケースを追加。`SKILL.md` の Anchors に「変更履歴は fragment で書け」を A-3 タスクで明記                                  |

### スコープ（ドッグフーディング由来の追記）

#### 含む（追加）

- `task-specification-creator/SKILL-changelog.md` の `changelog/_legacy.md` 退避
- `aiworkflow-requirements/LOGS.md` の `LOGS/_legacy.md` 退避（最優先）
- 上記 2 ファイルへの fragment append helper 適用

#### 含まない（追加）

- `SKILL.md` 内 Anchors への「fragment で書け」追記（A-3 Progressive Disclosure 化のスコープ）

### リスクと対策（ドッグフーディング由来の追記）

| リスク                                                                                       | 影響度 | 発生確率 | 対策                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| skill 自身の changelog / LOGS を A-2 対象に含めると skill 改修 PR が一時的に大きくなる       | 中     | 中       | 1 PR = 1 skill の fragment 化粒度に分割し、`task-specification-creator` と `aiworkflow-requirements` を別 commit に分ける             |
| skill 改修者がガイド未整備のため再び LOGS.md / SKILL-changelog.md へ直接 append してしまう   | 高     | 中       | CI の `git grep 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` writer 0 件チェックを skill 自身も対象に拡張し、A-3 完了までの暫定運用 |

### 検証方法（ドッグフーディング由来の追記）

```bash
# skill 自身の changelog / LOGS への直接 append が writer 経路に残っていないこと
git grep -n 'SKILL-changelog\.md' .claude/skills/    # => 0 件
git grep -n 'LOGS\.md'           .claude/skills/    # => 0 件（writer 経路）

# skill 自身の fragment が render される
mise exec -- pnpm skill:logs:render --skill task-specification-creator
mise exec -- pnpm skill:logs:render --skill aiworkflow-requirements
```

