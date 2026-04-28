# Claude Code permissions.deny の bypass モード下実効性検証 - タスク指示書

## メタ情報

```yaml
issue_number: 141
```

## メタ情報

| 項目         | 内容                                                                |
| ------------ | ------------------------------------------------------------------- |
| タスクID     | task-claude-code-permissions-deny-bypass-verification-001           |
| タスク名     | Claude Code permissions.deny の bypass モード下実効性検証            |
| 分類         | 検証 / セキュリティ                                                 |
| 対象機能     | Claude Code permissions.deny + `--dangerously-skip-permissions` 相互作用 |
| 優先度       | 高（HIGH blocker）                                                  |
| 見積もり規模 | 小規模                                                              |
| ステータス   | 未実施                                                              |
| 発見元       | Phase 3（残存リスク R-1 / TC-05）                                   |
| 発見日       | 2026-04-28                                                          |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-decisive-mode`（Phase 1〜13）では、`cc` alias に
`--permission-mode bypassPermissions --dangerously-skip-permissions` を併用する案 A を採用した。
ただし `--dangerously-skip-permissions` 適用時に `permissions.deny`（例: `Bash(git push --force:*)` /
`Bash(rm -rf /:*)` / 将来的な `Write(/etc/**)` 等）が実効するかは、Phase 3 のレビュー時点で
公式ドキュメントから明示的な記述を取得できず、UNKNOWN のまま BLOCKER として残った
（`outputs/phase-3/main.md` R-2）。

### 1.2 問題点・課題

- bypass 下で deny が無効化される場合、deny を「保険」として alias 強化を採用する設計根拠が崩れる
- 公式 docs に記述がなく、推測ベースで安全判断を続けると破壊的操作（force push / rm -rf）の
  事故リスクを設計者・実装者が共有できない
- 検証なしに `task-claude-code-permissions-apply-001` を着手すると、`~/.zshrc` と
  `~/.claude/settings.json` の双方が「deny は効くはず」前提で書き換わってしまう

### 1.3 放置した場合の影響

- `Bash(git push --force:*)` 等の deny が空振りする状態で、Claude Code が破壊的操作を
  prompt なしで実行してしまうリスク
- alias 強化（`--dangerously-skip-permissions`）の採用根拠が失われ、
  apply タスク完了後にロールバックが必要になり手戻りコストが発生
- セキュリティレビューでの追跡可能性が下がり、後続タスク（U4: MCP / hook 検証 等）の
  優先度判断が出典なしになる

---

## 2. 何を達成するか（What）

### 2.1 目的

`permissions.deny` が `--dangerously-skip-permissions` 適用時に実効するか否かを、
公式ドキュメント上の明示記述または実機検証ログのいずれかで確定し、
`task-claude-code-permissions-apply-001` の前提条件として記録する。

### 2.2 最終ゴール

- deny 実効性に関する判定（YES / NO）が出典付きで `phase-3/main.md` R-2 の更新欄に追記される
- 判定が NO の場合、`cc` alias から `--dangerously-skip-permissions` を外す
  代替案（settings 層のみで `bypassPermissions` を維持）が apply タスク前提条件として確定する
- 判定が YES の場合、出典 URL または実機ログのパスが apply タスクの参照情報に転記される

### 2.3 スコープ

#### 含むもの

- Anthropic 公式 Claude Code docs の deny / dangerous-skip 周辺ページ調査
- 安全な実機検証（dummy ref / `--dry-run` / isolated repository / 一時ディレクトリのみ）
- 検証結果の記録と apply タスクへの前提条件反映
- deny 不実効と判明した場合の代替案（alias 縮小）の文書化

#### 含まないもの

- `~/.claude/settings.json` および `~/.zshrc` の本番反映（apply タスクの責務）
- MCP server / hook の permission 挙動検証（U4 として別タスク）
- project-local-first 案との比較設計（U3 として別タスク）
- whitelist の項目追加・拡張

### 2.4 成果物

- 検証ログ: `outputs/phase-11/manual-smoke-log.md` に TC-05 結果を追記、
  または本タスク専用 `verification-log.md` として新設
- 公式 docs 引用: 該当 URL とスニペットを `phase-3/main.md` R-2 欄に追記
- apply タスク前提条件の更新差分（`task-claude-code-permissions-apply-001.md`）
- 判定 NO 時のフォールバック alias 案（`alias-diff.md` の縮小版）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-decisive-mode` が `spec_created` で完了済み
- 検証用に隔離可能な isolated git repository（一時ディレクトリ配下）を準備可能であること
- Claude Code CLI が手元で起動でき、`--permission-mode` / `--dangerously-skip-permissions`
  フラグが利用可能なバージョンであること

### 3.2 依存タスク

- 上流: `task-claude-code-permissions-decisive-mode`（完了済み）
- 下流（本タスク完了がブロッカー解除条件）:
  - `task-claude-code-permissions-apply-001`
  - `task-claude-code-permissions-project-local-first-comparison-001`（参考扱い）

### 3.3 必要な知識

- Claude Code の `permissions.allow` / `permissions.deny` 評価モデル
- `--permission-mode` と `--dangerously-skip-permissions` の差分
- git の dummy ref / `--dry-run` / 一時 bare repo の作り方
- 破壊的コマンドを isolated 環境で安全に検証する手順設計

### 3.4 推奨アプローチ

1. **docs 優先**: まず Anthropic 公式 docs（Claude Code permissions / CLI flags ページ）で
   `permissions.deny` と `--dangerously-skip-permissions` の関係を明示する記述を探す
2. **docs で不明なら実機検証**: 一時ディレクトリに isolated repo を作り、
   `Bash(git push --force:*)` を deny に登録した状態で `--dangerously-skip-permissions` 起動下で
   `git push --force` を dummy remote（`/tmp/.../bare.git`）に対して試行
3. **破壊的操作は必ず dummy ref / `--dry-run` / isolated repo に限定**。実プロジェクトの
   remote / branch には絶対に触らない
4. 結果を YES / NO で確定し、出典を残す

---

## 4. 実行手順

### Phase構成

1. 公式 docs 調査
2. 検証環境構築（isolated repo）
3. 実機検証実施
4. 判定記録と前提条件反映

### Phase 1: 公式 docs 調査

#### 目的

Anthropic 公式 docs から `permissions.deny` と `--dangerously-skip-permissions` の優先関係に
関する明示的記述を取得する。

#### 手順

1. Claude Code 公式 docs の permissions / CLI flags / settings ページを通読
2. `dangerously-skip-permissions` / `deny` / `bypass` キーワードでページ内検索
3. 該当記述があれば URL とスニペットを記録
4. 記述がなければ Phase 2 へ進む

#### 成果物

- 引用 URL / スニペットまたは「該当記述なし」の確定メモ

#### 完了条件

公式 docs の調査結果が一意に確定している（YES / NO / 該当なしのいずれか）

---

### Phase 2: 検証環境構築（isolated repo）

#### 目的

破壊的検証が実プロジェクトに影響しないよう、完全に隔離された git repo と Claude Code 起動環境を作る。

#### 手順

1. `/tmp/cc-deny-verify-$(date +%s)/` 配下に空ディレクトリを作る
2. その中に bare repo（`bare.git`）と作業 repo を作り、作業 repo の remote を bare に向ける
3. 検証専用の `.claude/settings.local.json` を当該作業 repo 内に置き、
   `permissions.deny` に `Bash(git push --force:*)` 等の検証対象パターンを記述
4. 当該ディレクトリ内で `claude --permission-mode bypassPermissions --dangerously-skip-permissions` を起動

#### 成果物

isolated repo パスと `.claude/settings.local.json` の内容

#### 完了条件

実プロジェクトの remote / branch / ファイルに一切触れない検証環境が起動できる

---

### Phase 3: 実機検証実施

#### 目的

bypass + skip 環境下で deny に登録したコマンドが blocked されるかを観測する。

#### 手順

1. isolated repo で Claude Code に `git push --force origin main` 相当の操作を依頼
2. blocked / 実行のいずれが起きたかを観測。実行された場合も dummy bare 先のため実害なし
3. 追加で `Bash(rm -rf /:*)` 等のパターンも `--dry-run` 相当の安全な代替（`echo rm -rf ...`）で
   テストし、deny が pattern マッチで止めるかを補助確認
4. 結果を `verification-log.md` に時刻 / コマンド / 観測結果の形で残す

#### 成果物

`verification-log.md`（実行コマンドと観測結果の対応表）

#### 完了条件

deny の実効性が YES / NO のいずれかで確定し、ログとして残っている

---

### Phase 4: 判定記録と前提条件反映

#### 目的

判定結果を上流 / 下流タスクに反映し、apply タスクのブロッカーを解除（または代替案へ切替）する。

#### 手順

1. `outputs/phase-3/main.md` の R-2 欄に判定と出典を追記
2. `task-claude-code-permissions-apply-001.md` の前提条件欄に判定結果を転記
3. 判定が NO の場合、apply タスクの alias 差分を「`--dangerously-skip-permissions` を含めない」案に書き換える
4. 判定が YES の場合、apply タスクの参照情報に出典 URL / verification-log パスを追記

#### 成果物

- 上流 / 下流タスクの差分
- 必要に応じて `alias-diff.md` の縮小版

#### 完了条件

apply タスクのブロッカー（R-2）が解除されている

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] 公式 docs 調査結果（URL / スニペット / 該当なし）が記録されている
- [ ] isolated repo での実機検証ログが残っている（docs で確定しなかった場合）
- [ ] deny 実効性の判定（YES / NO）が一意に確定している
- [ ] `task-claude-code-permissions-apply-001` の前提条件が更新されている

### 品質要件

- [ ] 検証中に実プロジェクトの remote / branch / ファイルに変更が発生していない
- [ ] 破壊的操作はすべて isolated repo / dummy ref / dry-run のみで実施
- [ ] 検証ログから第三者が再現可能（コマンドと環境が記録されている）

### ドキュメント要件

- [ ] `outputs/phase-3/main.md` R-2 欄に判定と出典が追記されている
- [ ] 判定 NO 時の代替 alias 案が文書化されている
- [ ] 苦戦箇所（本ファイル §9）が後続タスクへ転記可能な粒度で記録されている

---

## 6. 検証方法

### テストケース

| TC | 内容 | 期待結果 |
| --- | --- | --- |
| TC-05a | `--dangerously-skip-permissions` 起動下で deny 登録済み `git push --force` を試行 | blocked / 実行のいずれかが観測される |
| TC-05b | deny 登録なしの安全コマンド（`git status`）が prompt なしで通る | 通る（bypass が効いている確認） |
| TC-05c | 公式 docs の該当記述存在確認 | URL とスニペットが取得できるか「該当なし」が確定 |

### 検証手順

```bash
# Phase 2 で構築する isolated 環境例
mkdir -p /tmp/cc-deny-verify-$$/work
cd /tmp/cc-deny-verify-$$
git init --bare bare.git
cd work
git init && git remote add origin ../bare.git
mkdir -p .claude
# .claude/settings.local.json を配置（permissions.deny に検証対象を記述）
claude --permission-mode bypassPermissions --dangerously-skip-permissions
```

検証完了後 `/tmp/cc-deny-verify-*` を削除し、ホスト環境への副作用がないことを確認する。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| 検証中に実プロジェクトの remote へ誤って push | 高 | 低 | isolated repo 限定。`origin` を bare path に固定し、CWD を `/tmp/cc-deny-verify-*` から出ない |
| 公式 docs に記述がなく実機検証も判定不能 | 中 | 中 | 「判定不能」を結論として記録し、apply 側で alias 縮小（`--dangerously-skip-permissions` 不採用）をデフォルトに切替 |
| Claude Code バージョン差で挙動が変わる | 中 | 中 | 検証時の `claude --version` をログに残す。後続バージョンで再検証可能にする |
| dummy ref のつもりが実 ref を指していた | 高 | 低 | `git remote -v` を検証開始前と push 試行直前の双方で確認しログに残す |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-3/impact-analysis.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-11/manual-smoke-log.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-apply-001.md`

### 参考資料

- Anthropic 公式 Claude Code docs（permissions / CLI flags / settings ページ）
- `doc/00-getting-started-manual/claude-code-config.md`

---

## 9. 備考

### 苦戦箇所【記入必須】

> Phase 3 / Phase 12 由来の苦戦点を、後続の skill-feedback-report に転記できる粒度で記録する。
> source evidence: `outputs/phase-3/main.md` R-2 / `outputs/phase-12/unassigned-task-detection.md` U2

| 項目 | 内容 |
| ---- | ---- |
| 症状 | 公式 docs に bypass モード下の `permissions.deny` 実効性に関する明示記述が見つからず、Phase 3 R-2 を BLOCKER のまま閉じざるを得なかった |
| 原因 | Claude Code SDK の権限評価順序（`--dangerously-skip-permissions` と `permissions.deny` の優先関係）が公開資料に乏しく、推測ベースでは破壊的フラグ採用の安全判断ができなかった |
| 対応 | HIGH blocker として独立タスク化し、apply タスクの前提条件に格上げ。docs 不在時は isolated repo で実機検証する手順をこの指示書に内包 |
| 再発防止 | 破壊的フラグ（`--dangerously-skip-*` 系）を含む設計は、実効性の出典（公式 docs URL or 実機検証ログ）を採用前に必ず明記する。検証は必ず isolated repo / dummy ref / dry-run に限定し、実プロジェクトに触れない |

### レビュー指摘の原文（該当する場合）

```
Phase 3 main.md R-2: `permissions.deny` が skip 環境下で実効するか UNKNOWN。
これが blocker の核心。実装タスクで以下のいずれかを実施するまで、
`--dangerously-skip-permissions` を「保険として deny で守られている」前提にしない。
```

### 補足事項

- 本タスクは `spec_created` で完了する小規模検証タスク。実装着手は不要で、
  検証ログと判定の文書反映のみが成果物となる。
- 判定 NO の場合のフォールバック（alias から `--dangerously-skip-permissions` を外す）は、
  Phase 3 R-2 の「NG 時のフォールバック」に既に記載済みなので、本タスクではその案を
  apply タスクの差分として実体化するだけで足りる。
- MCP / hook の挙動（U4）は本タスクのスコープ外。検証中に観察できた範囲があれば
  補助記録として残し、別タスクの設計入力にする。
