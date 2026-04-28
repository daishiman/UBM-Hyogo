# Claude Code permissions の project-local-first vs global-first 比較設計 - タスク指示書

## メタ情報

```yaml
issue_number: 142
```

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | task-claude-code-permissions-project-local-first-comparison-001     |
| タスク名     | Claude Code permissions の project-local-first vs global-first 比較設計 |
| 分類         | 設計                                                                |
| 対象機能     | Claude Code permissions 設定の影響半径選定                          |
| 優先度       | 高                                                                  |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | Phase 3（impact-analysis）                                          |
| 発見日       | 2026-04-28                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-decisive-mode` Phase 3 で、prompt 復帰を防ぐために以下 2 案が候補として挙がった。

- 案 A: `~/.claude/settings.json` の `defaultMode` を `bypassPermissions` に変更し、`cc` alias に `--dangerously-skip-permissions` を追加する（global + shell 全体に波及）
- 案 B: `<project>/.claude/settings.local.json` のみで bypass を維持する（影響半径は当該プロジェクトに限定）

Phase 3 では案 A を「個人開発マシン限定」で CONDITIONAL ACCEPT としたが、global / shell alias 変更が他プロジェクト（特に `scripts/cf.sh` 経由の Cloudflare CLI 運用や `op run` 注入経路）の権限評価に副作用を与えるかを即断できなかった。

### 1.2 問題点・課題

- settings 階層（global → global.local → project → project.local）の優先順位と各層の責務分担を意思決定する基準が未整備
- 案 A 採用時、fresh 環境（global.local 未配置）で常時 bypass になるリスクが残る
- 案 B 採用時、新規 worktree / 新規プロジェクトで毎回 prompt 復帰する再発リスクがある
- どちらを `task-claude-code-permissions-apply-001` の実装入力にするかが未確定で、apply タスクが着手できない

### 1.3 放置した場合の影響

- apply タスクが影響半径不明のまま実装に入り、他プロジェクトの権限評価を破壊する可能性
- `--dangerously-skip-permissions` を alias に焼き込んだ後で deny の実効性が確認できず rollback コストが膨らむ
- project 単位で再発する prompt を都度手動 bypass する運用負債が固定化する

---

## 2. 何を達成するか（What）

### 2.1 目的

global / globalLocal / project / projectLocal 各層の影響範囲・副作用・再発リスクを表で対比し、`task-claude-code-permissions-apply-001` が採用すべき層配置方針を 1 案に確定する。

### 2.2 最終ゴール

- 4 層 × 評価軸（影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用）の比較表が `outputs/` に存在する
- project-local-first で prompt 復帰を防げるかが実機検証または公式仕様引用付きで判定されている
- 採用案（A / B / ハイブリッド）が明文化され、apply タスクの設計入力として参照可能になっている
- global 採用時の rollback 手順と他プロジェクト副作用一覧が記載されている

### 2.3 スコープ

#### 含むもの

- 4 層の優先順位と責務分担の表化
- project-local-first での prompt 復帰防止の実機 or 公式仕様確認
- 案 A / 案 B / ハイブリッド案の trade-off 比較
- 採用方針の確定と apply タスクへのハンドオフメモ
- global 採用時の rollback 手順整理

#### 含まないもの

- 実 `~/.claude/settings.json` / `~/.zshrc` の書き換え（→ apply タスクで実施）
- bypass モード下の deny 実効性検証（→ `task-claude-code-permissions-deny-bypass-verification-001` で実施）
- MCP server / hook の permission 挙動検証（U4 候補）

### 2.4 成果物

- 比較設計ドキュメント 1 通（`docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/comparison.md` 想定）
- 4 層比較表
- 採用方針の決定ログ
- apply タスクへのハンドオフ箇条書き

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-decisive-mode` Phase 3 / Phase 12 成果物が参照可能
- 実機（個人開発マシン）で `~/.claude/settings.json` および各プロジェクトの `.claude/settings.json` の `defaultMode` を読み取れる権限がある（書き換えはしない）

### 3.2 依存タスク

- `task-claude-code-permissions-decisive-mode`（仕様策定済み・前提）
- 並行: `task-claude-code-permissions-deny-bypass-verification-001`（結果が判明すれば本タスクの判定材料に追加）

### 3.3 必要な知識

- Claude Code settings の階層優先順位（global / global.local / project / project.local）
- `defaultMode` / `permissions.allow` / `permissions.deny` の評価順
- `--dangerously-skip-permissions` フラグの効果範囲
- ホームディレクトリ配下の他 worktree / 他リポジトリ構成（`scripts/cf.sh` / 1Password `op run` 等の他プロジェクト前提機能との衝突確認）

### 3.4 推奨アプローチ

「案 B（project-local-first）を default、案 A（global）を fallback」のハイブリッドを起点に評価する。各層の最終値が変わらないシナリオ（Phase 3 シナリオ A / B）を起点に、変わるシナリオ（C / D）の許容可否で採否を切る。

---

## 4. 実行手順

### Phase構成

1. 4 層の責務・優先順位の整理
2. project-local-first の再発防止可否の確認
3. 案 A / 案 B / ハイブリッドの比較表化
4. 採用方針確定と apply タスクへのハンドオフ

### Phase 1: 4 層の責務・優先順位の整理

#### 目的

global / global.local / project / project.local の各層が、誰のどの判断を表現する層かを定義する。

#### 手順

1. 公式 docs（Claude Code settings の階層仕様）を参照し優先順位を確定
2. 各層の「想定利用者」「変更頻度」「git 管理可否」を表化
3. 既存の本リポジトリ `.claude/settings.local.json` と `~/.claude/settings.json` の現状値を読み取り（書き換え禁止）

#### 成果物

4 層責務表

#### 完了条件

各層の責務とどのキーをどこに置くべきかが 1 表に集約されている

### Phase 2: project-local-first の再発防止可否の確認

#### 目的

project.local だけで bypass を維持した場合、新規 worktree / 新規プロジェクトでも prompt 復帰しないかを判定する。

#### 手順

1. 公式 docs で「`defaultMode` 未指定時の組み込み default」を引用 or 実機で fresh プロジェクトを 1 件作成し挙動観測（書き換えは local のみ）
2. `.claude/settings.local.json` を git ignore する運用が new worktree でどう作用するかを確認
3. 「project-local-first だけでは新規プロジェクトでは再発する」が真かを判定

#### 成果物

再発判定メモ（公式仕様引用 or 実機ログ）

#### 完了条件

project-local-first 単独での再発有無が 1 結論で記載されている

### Phase 3: 案 A / 案 B / ハイブリッドの比較表化

#### 目的

trade-off を一目で比較できる表を作る。

#### 手順

1. 評価軸を決定: 影響半径 / 再発リスク / rollback コスト / 他プロジェクト副作用 / fresh 環境挙動
2. 各案を 5 軸で評価し表化
3. global 採用時の rollback 手順（差分の保存・復元コマンド）を別ブロックで明記
4. `scripts/cf.sh` / `op run` / 他 worktree との衝突可能性を必ず 1 行で言及

#### 成果物

比較表 + rollback 手順 + 他プロジェクト副作用一覧

#### 完了条件

3 案の trade-off が 5 軸で読み取れる

### Phase 4: 採用方針確定と apply タスクへのハンドオフ

#### 目的

`task-claude-code-permissions-apply-001` が即着手できる粒度の方針を確定する。

#### 手順

1. Phase 1〜3 の結果から採用案を 1 つ選定（理由を明記）
2. apply タスクの「設定変更対象ファイル」「キー」「値」「rollback 手順」を箇条書き
3. apply タスク指示書の参照欄に本ドキュメントを追記する依頼を残す

#### 成果物

採用方針の決定ログ + ハンドオフ箇条書き

#### 完了条件

apply タスクが本ドキュメントだけを読めば実装に入れる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 4 層責務表が完成している
- [ ] project-local-first での再発有無が判定されている
- [ ] 3 案の比較表が 5 軸で記述されている
- [ ] 採用案が 1 つに確定している
- [ ] global 採用時の rollback 手順が記載されている

### 品質要件

- [ ] 比較表に出典（公式 docs or 実機ログ）が紐付いている
- [ ] 他プロジェクト副作用（`scripts/cf.sh` / `op run` / 他 worktree）への言及がある
- [ ] Phase 3 シナリオ A〜D との対応が明示されている

### ドキュメント要件

- [ ] `task-claude-code-permissions-apply-001` 指示書の参照欄に本ドキュメントが追記されている
- [ ] `task-claude-code-permissions-decisive-mode` の Phase 3 / Phase 12 成果物がリンクされている

---

## 6. 検証方法

### テストケース

- TC-01: project-local-first 単独で fresh プロジェクトの `defaultMode` が `bypassPermissions` を維持するか（仕様 or 実機）
- TC-02: 案 A 適用後、他プロジェクトの最終 `defaultMode` が変化しないことをシナリオ A / B で確認
- TC-03: 案 A 適用後、fresh 環境（シナリオ C）で意図せず bypass 化することの許容判断
- TC-04: rollback 手順を dry-run で読み合わせ（実書き換えは禁止）

### 検証手順

```bash
# 現状値の参照のみ（書き換え禁止）
cat ~/.claude/settings.json | jq '.defaultMode'
ls -la ~/.claude/settings.local.json 2>/dev/null
grep -r "defaultMode" ~/dev/**/.claude/settings.json 2>/dev/null

# 比較表のレビュー
$EDITOR docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/comparison.md
```

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| 公式仕様で `defaultMode` 未指定時の挙動が未文書化 | 中 | 中 | 実機 fresh プロジェクトで観測し、結果を出典として記載 |
| project-local-first を選んだ後、新規 worktree で再発が頻発 | 中 | 中 | テンプレート `.claude/settings.local.json` を `scripts/new-worktree.sh` に組み込む案を apply タスクへハンドオフ |
| global 案採用時の他プロジェクト副作用見落とし | 高 | 低 | `~/dev` 配下の `.claude/settings.json` を grep し、`defaultMode` 明示プロジェクトを全件列挙してから採否判断 |
| `--dangerously-skip-permissions` の deny 実効性が未検証のまま採用 | 高 | 中 | `task-claude-code-permissions-deny-bypass-verification-001` の結果を待つか、結果未着なら本タスクの採用案から alias 強化を除外 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-apply-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-deny-bypass-verification-001.md`
- `doc/00-getting-started-manual/claude-code-config.md`

### 参考資料

- Claude Code 公式 docs: settings 階層と `defaultMode` 仕様
- `CLAUDE.md` の「Claude Code 設定」「シークレット管理」節（`scripts/cf.sh` / `op run` 経路）

---

## 9. 備考

### 苦戦箇所【記入必須】

> Phase 3 impact-analysis 起票時の判断困難点を記録する。
> source evidence: `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`

| 項目     | 内容                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | Phase 3 で案 A（global + shell alias 変更）を採用候補にしたが、global 変更が他プロジェクト（`scripts/cf.sh` 経由 Cloudflare CLI 運用や 1Password `op run` 注入経路、別 worktree の権限評価）へ副作用を与えるか即断できなかった                  |
| 原因     | settings の階層優先順位（global → global.local → project → project.local）と各層の責務分担を意思決定する基準が未整備で、「最終値が変わらないから ACCEPT」というシナリオ A / B 評価のみに依存し、シナリオ C（fresh 環境）の許容可否が宙吊りだった |
| 対応     | 比較タスクを本ドキュメントとして別出しし、apply タスク（`task-claude-code-permissions-apply-001`）の前段で方針確定する構成に変更。Phase 3 では CONDITIONAL ACCEPT に留め、書き換えはしない                                                       |
| 再発防止 | 影響半径が global に及ぶ設計は、必ず project-local 代替案との trade-off 表を作る。`secrets/.env` / Cloudflare CLI / `op run` 等の他プロジェクト前提機能との衝突を「他プロジェクト副作用」軸として比較表に必ず含める                                |

### レビュー指摘の原文（該当する場合）

```
Phase 3 impact-analysis にて、案 A の global 変更がシナリオ C（fresh 環境）で意図せず bypass 化するリスクを CONDITIONAL ACCEPT で残した。
project-local-first（案 B）との trade-off を別タスクで比較し、apply タスク着手前に方針確定すること。
（出典: docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/unassigned-task-detection.md U3）
```

### 補足事項

本タスクは spec_only。実 `~/.claude/settings.json` / `~/.zshrc` への書き換えは一切行わず、現状値の読み取りと公式仕様 / 実機観測ログの引用に留める。書き換えは `task-claude-code-permissions-apply-001` で実施する。`task-claude-code-permissions-deny-bypass-verification-001` の結果が先行して得られた場合は、本タスクの比較表に「deny 実効性」軸を追加すること。
