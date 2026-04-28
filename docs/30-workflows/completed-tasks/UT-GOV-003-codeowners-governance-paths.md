# `.github/CODEOWNERS` governance paths 整備 - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | UT-GOV-003-codeowners-governance-paths                                        |
| タスク名     | `.github/CODEOWNERS` を governance パスへ拡張し doc/docs 表記揺れを解消        |
| 分類         | 実装 / governance                                                             |
| 対象機能     | GitHub branch protection と連動する CODEOWNERS レビュー必須化                 |
| 優先度       | 中（main 適用時の CODEOWNERS review が global fallback 依存）                 |
| 見積もり規模 | 小〜中規模                                                                    |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | task-github-governance-branch-protection                                      |
| 発見元       | outputs/phase-12/unassigned-task-detection.md current U-3                     |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-github-governance-branch-protection` で main / dev に branch protection を適用する設計が進んでいるが、現状リポジトリに `.github/CODEOWNERS` が無い、もしくは global fallback (`* @owner`) のみで運用されている。これにより `require_code_owner_reviews=true` を有効化しても governance 上重要なパス（タスク仕様書群・正本仕様・workflow 定義・実コード）について「誰がレビューすべきか」が表現できていない。

加えて CLAUDE.md と正本仕様の間で `doc/` と `docs/` の表記が混在しており、CODEOWNERS のパスマッチが旧表記で書かれると意図しないファイルが owner なしになる。

### 1.2 問題点・課題

- main の branch protection 草案では `require_code_owner_reviews=true` を要求するが CODEOWNERS が薄く、実質 global owner にフォールバックしてしまう
- governance 重要パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）が同一 owner 群に丸められ、実コードと仕様書のレビュー観点が分離できない
- `doc/` と `docs/` の表記揺れにより、CODEOWNERS の glob が片側にしかマッチしない事故が起こり得る
- CODEOWNERS は **最終マッチ勝ち** 仕様のため、ワイルドカード順序を間違えると後段の汎用ルールが governance パスを上書きする

### 1.3 放置した場合の影響

- `require_code_owner_reviews=true` 適用後、PR が「誰のレビューでも通る」または「永久 block される」のいずれかに振れる
- 正本仕様（`.claude/skills/**/references/**`）の意図しない改変がレビューなしで main に到達する
- `.github/workflows/**` の改変が governance レビューを経ずマージされ、CI gate そのものを silently 弱体化させ得る

---

## 2. 何を達成するか（What）

### 2.1 目的

`.github/CODEOWNERS` を governance パス単位で明示的に owner 指定し、main の `require_code_owner_reviews=true` 草案と整合させる。同時に `doc/` → `docs/` 表記揺れを棚卸しし現行 `docs/` に統一する。

### 2.2 想定 AC

1. リポジトリ直下に `.github/CODEOWNERS` が存在する（無ければ新設、あれば更新）
2. 以下のパスに対し owner が明示されている:
   - `docs/30-workflows/**`（タスク仕様書群）
   - `.claude/skills/**/references/**`（正本仕様）
   - `.github/workflows/**`（governance workflow / CI）
   - `apps/api/**`
   - `apps/web/**`
3. ファイル末尾に global fallback (`* @<owner>`) を 1 行のみ配置し、最終マッチ勝ち仕様を踏まえた順序になっている
4. `gh api repos/:owner/:repo/codeowners/errors` で `errors: []` （構文/権限エラーゼロ）が確認できる
5. リポジトリ内の `doc/` 表記が `docs/` へ統一されている、または残置箇所が「外部リンク等の不可避ケース」に限定され明示記録されている
6. main branch protection 草案の `require_code_owner_reviews=true` を有効化しても、想定パスで CODEOWNERS review が要求されることを dry-run で確認

### 2.3 スコープ

#### 含むもの

- `.github/CODEOWNERS` の新設または更新
- リポジトリ内 `doc/` / `docs/` 表記揺れの棚卸しと統一
- `gh api .../codeowners/errors` による構文検証
- main branch protection 草案 (`task-github-governance-branch-protection`) との整合確認

#### 含まないもの

- branch protection 自体の本適用（UT-GOV-001 で実施）
- CODEOWNERS で参照する team handle 自体の新規作成（GitHub 組織側の運用作業）
- 既存タスク仕様書本文のレビュー / 内容修正

### 2.4 成果物

- `.github/CODEOWNERS` 差分
- `doc/` → `docs/` 置換差分一覧（CLAUDE.md / 正本仕様等）
- `gh api .../codeowners/errors` 実行ログ（errors: [] であること）
- main branch protection 草案との整合チェックメモ

---

## 3. 影響範囲

- `.github/CODEOWNERS`
- `CLAUDE.md`（`doc/` 表記が混在）
- `.claude/skills/**/references/**`（同上の表記揺れが残存し得る）
- `docs/30-workflows/**` 配下の参照リンク
- main / dev branch protection 設定（CODEOWNERS review の挙動）

---

## 4. 依存・関連タスク

- 親: `task-github-governance-branch-protection`
- 関連: `UT-GOV-001-github-branch-protection-apply`（CODEOWNERS が整っていることが前提）
- 関連: `UT-GOV-002-pr-target-safety-gate-dry-run`（governance workflow パスの owner 指定）
- 関連: `UT-GOV-004-required-status-checks-context-sync`（`.github/workflows/**` の owner 整備）
- 関連: `UT-GOV-005-docs-only-nonvisual-template-skill-sync`（docs パス整備）

---

## 5. 推奨タスクタイプ

implementation

---

## 6. 参照情報

- `outputs/phase-2/design.md` §3（governance 設計）
- `outputs/phase-12/implementation-guide.md` §1
- `outputs/phase-12/unassigned-task-detection.md` U-3
- `CLAUDE.md` 主要ディレクトリ表（`doc/00-getting-started-manual/` と `docs/30-workflows/` が混在している点）
- GitHub Docs: "About code owners"（CODEOWNERS の最終マッチ勝ち仕様、team 権限要件）
- GitHub REST API: `GET /repos/{owner}/{repo}/codeowners/errors`

---

## 7. 備考

CODEOWNERS は単独で意味を成さず、main の `require_code_owner_reviews=true` と組み合わさって初めて governance gate として機能する。本タスクは UT-GOV-001（branch protection 本適用）の前段として完了している必要があり、UT-GOV-001 の AC からも参照される位置付け。

team handle を採用する場合は GitHub 組織側で対象 team が当該リポジトリに **write 以上** の権限を持つことを事前確認すること（権限不足時は CODEOWNERS が silently skip され、レビュー必須化が機能しない）。

---

## 8. 苦戦箇所・落とし穴

1. **`doc/` と `docs/` の表記揺れ**
   - CLAUDE.md / 正本仕様で `doc/` と `docs/` が混在しており、片側だけを CODEOWNERS に書くと governance パスの一部が owner 不在になる
   - 旧 `doc/` 表記の置換漏れが多発するため、`rg -n "(^|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git'` 等で全文棚卸しを先に済ませてから CODEOWNERS を書くこと

2. **CODEOWNERS は最終マッチ勝ち**
   - 「先頭から一致を全部適用」ではなく「最後に一致した行のみが有効」
   - 例: `* @global` を冒頭に、`docs/30-workflows/** @docs-team` を末尾に書くと意図通り動くが、逆順だと汎用 `*` が governance パスを上書きしてしまう
   - 末尾ほど具体度の高い、または governance 上重要なルールを置く設計に統一する

3. **team handle (`@org/team`) の権限要件**
   - team が当該リポジトリに **write 以上** の権限を持っていないと、CODEOWNERS で指定しても review 必須にならず silently skip される
   - 結果として `require_code_owner_reviews=true` を入れていても「誰のレビューでも通る」状態になる
   - 個人ハンドル (`@user`) に一旦寄せるか、組織側で team の repo 権限を事前付与してから team handle に切り替える

4. **構文エラーの sneaky な失敗**
   - CODEOWNERS の構文エラーや存在しないユーザー/team 指定は GitHub UI 上では警告のみで、PR 作成時には silently 無視される
   - 必ず `gh api repos/:owner/:repo/codeowners/errors` を CI またはローカルで実行し `errors: []` を確認する
   - main に `require_code_owner_reviews=true` を入れる前にこの確認を怠ると、PR が永久 block されて緊急対応が必要になる

5. **glob 仕様のクセ**
   - GitHub CODEOWNERS の glob は gitignore 風だが完全互換ではない（`**` の扱い、ディレクトリ末尾 `/` の有無で挙動が変わる）
   - `.claude/skills/**/references/**` のような多段ワイルドカードは、実ファイルに対して期待通りマッチするか `gh api .../codeowners/errors` と PR dry-run の両方で確認する

6. **branch protection との適用順序**
   - 先に `require_code_owner_reviews=true` を有効化してしまうと、CODEOWNERS 不備の PR が全て block されメンテ不能になる
   - 必ず「CODEOWNERS 整備 → errors=[] 確認 → branch protection 反映」の順で進め、UT-GOV-001 とのシーケンスを守る
