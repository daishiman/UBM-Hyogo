# Claude Code permissions 設計の実反映 - タスク指示書

## メタ情報

```yaml
issue_number: 140
```

## メタ情報

| 項目         | 内容                                                              |
| ------------ | ----------------------------------------------------------------- |
| タスクID     | task-claude-code-permissions-apply-001                            |
| タスク名     | Claude Code permissions 設計の実反映                              |
| 分類         | 改善                                                              |
| 対象機能     | Claude Code 起動時 Bypass Permissions Mode 維持                   |
| 優先度       | 高                                                                |
| 見積もり規模 | 小規模                                                            |
| ステータス   | completed（TC-05 BLOCKED 注記付き）                              |
| 発見元       | Phase 12（task-claude-code-permissions-decisive-mode）            |
| 発見日       | 2026-04-28                                                        |
| 完了日       | 2026-04-28                                                        |

> 実反映完了: `docs/30-workflows/task-claude-code-permissions-apply-001/outputs/phase-12/implementation-guide.md` 参照。TS=`20260428-192736`。TC-01〜TC-04 / TC-F-01,02 / TC-R-01 は PASS、TC-05（bypass 下 deny 実効性）は前提結論未取得のため BLOCKED として継続管理する。

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-decisive-mode` は `spec_created / docs-only / NON_VISUAL` として完了するため、設計までを成果物としており、実 settings ファイルおよび `cc` alias の書き換えはスコープ外として残った。決定事項は以下のとおり。

- 採用案 A: `~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.local.json` の 3 層すべてを `defaultMode: bypassPermissions` で統一する
- `cc` alias を `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` に正準化する
- `permissions.allow` / `permissions.deny` の whitelist を整理し project 層に閉じる

これらを実機の設定に反映し、Claude Code 起動時に毎回 permission prompt が出ない状態を恒常化することが本タスクの責務である。

### 1.2 問題点・課題

- 現状は global / globalLocal / project の 3 層で `defaultMode` が不一致（acceptEdits と bypassPermissions が混在）であり、起動条件によって effective mode が揺れる
- `cc` alias に `--dangerously-skip-permissions` が含まれておらず、settings の読み込み順や parser 挙動の差で「確認モード」へフォールバックする事故が再発しうる
- `permissions.allow` / `deny` が project 層で最新状態でないため、whitelist 追加・取り下げが反映されていない
- 実機変更に伴う backup / rollback 手順が手元に整備されていない

### 1.3 放置した場合の影響

- 通常作業のたびに permission prompt が再出現し、フロー中断と心理コストが継続発生する
- 「どの層の設定が効いているか」が不明瞭になり、別プロジェクトや新規 worktree でのトラブル切り分けが困難になる
- 失敗時の rollback 手順が場当たり対応となり、`~/.claude/` を破損させるリスクが高い
- whitelist が古いままだと、安全コマンドにも prompt が出続けて bypassPermissions の効果を相殺する

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-claude-code-permissions-decisive-mode` の Phase 2〜5 で確定した設計を、実機の settings 3 層 / `cc` alias / project whitelist に反映し、Claude Code が一貫した bypassPermissions モードで起動する状態を確立する。

### 2.2 最終ゴール

- `~/.claude/settings.json` / `~/.claude/settings.local.json` / `<project>/.claude/settings.local.json` の 3 層すべてが `"defaultMode": "bypassPermissions"` を保持
- `alias cc` が `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` に正準化され、`type cc` の出力が 1 行で一致
- `<project>/.claude/settings.json` の `permissions.allow` / `deny` が設計どおり
- 変更前 backup（タイムスタンプ付き `.bak.<TS>`）が 4 ファイル分残っており、ロールバック手順が `manual-smoke-log.md` 相当の形式で記録されている
- TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 の smoke test が成功記録済み

### 2.3 スコープ

#### 含むもの

- `~/.claude/settings.json` の `defaultMode` を `bypassPermissions` に変更
- `~/.claude/settings.local.json` の `defaultMode` 確認・整合
- `<project>/.claude/settings.local.json` の作成または `defaultMode` 整合（必要 project のみ）
- `<project>/.claude/settings.json` の `permissions.allow` / `deny` 更新
- `~/.zshrc`（または `~/.config/zsh/conf.d/*.zsh`）の `cc` alias 書き換え
- 変更前の自動 backup と rollback 手順の整備
- 実機 smoke test の結果記録

#### 含まないもの

- bypass モード下での `permissions.deny` 実効性の検証（→ `task-claude-code-permissions-deny-bypass-verification-001` の責務）
- project-local-first（global を触らず project 単位で適用）案の比較設計（→ `task-claude-code-permissions-project-local-first-comparison-001` の責務）
- MCP server / hook の permission 挙動検証（U4 候補、未タスク化）
- `Edit` / `Write` の whitelist 化（Phase 10 MINOR 保留）
- enterprise managed settings の対応

### 2.4 成果物

- 更新後の `~/.claude/settings.json` / `~/.claude/settings.local.json`
- 更新後の `<project>/.claude/settings.json`（および必要に応じ `settings.local.json`）
- 更新後の `~/.zshrc`（または該当 zsh 設定ファイル）
- backup ファイル群: `*.bak.<TS>` × 4（settings 3 つ + zshrc）
- `manual-smoke-log.md` 相当の TC 実行ログ（CLI 出力テキストを主証跡）
- rollback 手順を記載した実行記録ノート

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-deny-bypass-verification-001` が完了し、bypass 下での deny 実効性の結論が出ていること
  - deny が実効しない場合は alias から `--dangerously-skip-permissions` を外す方針へ切替
- `task-claude-code-permissions-project-local-first-comparison-001` が完了し、global を触る正当性が再確認されていること
- 他 worktree / 他リポジトリの `<project>/.claude/settings.json` を `grep -rn defaultMode` で再走査済みであること
- Claude Code バージョンを `claude --version` で記録済み

### 3.2 依存タスク

- `task-claude-code-permissions-deny-bypass-verification-001`（必須前提）
- `task-claude-code-permissions-project-local-first-comparison-001`（必須前提）
- 元タスク `task-claude-code-permissions-decisive-mode`（spec_created 完了済み）

### 3.3 必要な知識

- Claude Code settings の階層優先順位
  - `project/.claude/settings.local.json` > `project/.claude/settings.json` > `~/.claude/settings.local.json` > `~/.claude/settings.json`
- `--permission-mode bypassPermissions` と `--dangerously-skip-permissions` の意味の違い
- `permissions.allow` / `deny` の `Tool(pattern)` 記法
- zsh alias の解決順序および `type` / `which` の差異
- JSON validity を `node -e "JSON.parse(require('fs').readFileSync(...))"` で検証する手順

### 3.4 推奨アプローチ

`outputs/phase-5/runbook.md` の手順を厳密に踏襲し、Step 1（backup）→ Step 2（global settings）→ Step 3（project settings）→ Step 4（alias）→ Step 5（smoke test）→ 失敗時 Step 6（rollback）の順で実行する。各 Step で JSON validity と `type cc` 出力を必ず確認し、安全ガード（alias 重複検出 / JSON 破壊防止）を最優先する。

---

## 4. 実行手順

### Phase構成

1. 前提チェックと backup 取得
2. settings 3 層の `defaultMode` 統一
3. project whitelist の更新
4. `cc` alias の書き換えと反映
5. smoke test 実施と結果記録

### Phase 1: 前提チェックと backup 取得

#### 目的

実環境の現状を把握し、ロールバックに必要な完全 backup を取得する。

#### 手順

1. `claude --version` でバージョンを記録
2. `grep -rn "alias cc=" ~/.zshrc ~/.config/zsh/ 2>/dev/null` で alias 定義ファイルを 1 箇所に特定（複数ヒットなら中断）
3. `ls -la ~/.claude/settings.json ~/.claude/settings.local.json "$(pwd)/.claude/settings.json"` で settings 存在確認
4. `TS=$(date +%Y%m%d%H%M%S)` を発行し、4 ファイルを `*.bak.${TS}` でコピー
5. `ls -la ~/.claude/*.bak.${TS} ~/.zshrc.bak.${TS}` で backup 整合確認
6. 取得した `${TS}` を実行記録ノートへ転記

#### 成果物

- 4 ファイルの `.bak.<TS>` セット
- 実行記録ノート（バージョン / TS / alias 定義ファイルパス）

#### 完了条件

- backup が 4 件すべて存在し、ファイルサイズが元と一致
- alias 定義ファイルが 1 箇所に確定

### Phase 2: settings 3 層の `defaultMode` 統一

#### 目的

global / globalLocal / projectLocal の `defaultMode` を `bypassPermissions` に揃える。

#### 手順

1. `~/.claude/settings.json` の `"defaultMode"` を `bypassPermissions` に変更
2. `~/.claude/settings.local.json` の `"defaultMode"` を `bypassPermissions` に整合
3. 必要 project に `<project>/.claude/settings.local.json` を作成または整合
4. 各ファイルで `node -e "JSON.parse(require('fs').readFileSync('<path>','utf8')); console.log('OK')"` を実行

#### 成果物

更新後の settings 3 ファイル

#### 完了条件

- 3 ファイルすべてで JSON validity 検証が `OK`
- `defaultMode` が 3 層で一致（grep で確認）

### Phase 3: project whitelist の更新

#### 目的

`<project>/.claude/settings.json` の `permissions.allow` / `deny` を設計どおりに整える。

#### 手順

1. `outputs/phase-2/whitelist-design.md` の最新 allow / deny リストを取得
2. `<project>/.claude/settings.json` の `permissions.allow` / `deny` を上書き
3. JSON validity を `node -e` で検証
4. `git diff` で差分が設計と一致することを確認

#### 成果物

更新後の `<project>/.claude/settings.json`

#### 完了条件

- JSON validity OK
- 設計との差分が 0

### Phase 4: `cc` alias の書き換えと反映

#### 目的

`cc` alias を正準形へ書き換え、現行 shell に反映する。

#### 手順

1. Phase 1 で特定した alias 定義ファイルのみを編集
2. `alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'` に書き換え
3. 該当ファイルを `source` または新タブを開いて反映
4. `type cc` の出力が正準形 1 行と一致することを確認
5. `grep -nE '^alias cc=' <該当ファイル>` の結果が 1 行のみであることを確認（TC-R-01）

#### 成果物

更新後の zsh alias 定義ファイル

#### 完了条件

- `type cc` 出力が CC_ALIAS_EXPECTED と一致
- alias 定義の重複が 0

### Phase 5: smoke test 実施と結果記録

#### 目的

設計どおりの effective mode が起動時に確定することを確認する。

#### 手順

1. 新規タブで `cc` を起動し、起動直後の effective mode を記録（TC-01）
2. session 内 `/exit` → 再起動して mode 維持を確認（TC-02）
3. 別プロジェクトディレクトリへ `cd` して `cc` を起動し階層適用を確認（TC-03）
4. allow 対象コマンドの prompt 有無（TC-04）/ deny 対象の挙動は前提タスクの結果に従い記録（TC-05）
5. 不正 `defaultMode` / flag typo 動作確認（TC-F-01 / TC-F-02）
6. 結果を `manual-smoke-log.md` 相当のフォーマットで記録

#### 成果物

`manual-smoke-log.md` 相当の TC 実行ログ

#### 完了条件

- TC-01〜TC-04 / TC-F-01〜TC-F-02 / TC-R-01 がすべて期待値どおり
- TC-05 は前提タスクの結論と整合

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `~/.claude/settings.json` の `defaultMode` が `bypassPermissions`
- [ ] `~/.claude/settings.local.json` の `defaultMode` が `bypassPermissions`
- [ ] 必要 project の `<project>/.claude/settings.local.json` が `bypassPermissions`
- [ ] `<project>/.claude/settings.json` の whitelist が設計どおり
- [ ] `type cc` が CC_ALIAS_EXPECTED を 1 行で出力
- [ ] alias 定義の重複が 0

### 品質要件

- [ ] settings 4 ファイルそれぞれで JSON validity 検証 OK
- [ ] backup 4 ファイル（`.bak.<TS>`）が取得済み
- [ ] rollback 手順を実行記録ノートに記載済み
- [ ] smoke test ログがすべて期待値どおり

### ドキュメント要件

- [ ] `manual-smoke-log.md` 相当の TC 実行ログ作成
- [ ] 実行記録ノートに `${TS}` / Claude バージョン / alias 定義ファイルパスを記録
- [ ] 元タスク `outputs/phase-12/skill-feedback-report.md` のフィードバックに「実反映完了」を追記

---

## 6. 検証方法

### テストケース

| TC ID    | 内容                                              | 期待                                                                 |
| -------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| TC-01    | 新規タブで `cc` 起動後の effective mode 表示      | `bypassPermissions`                                                  |
| TC-02    | session 内 `/exit` → 再起動                       | mode 維持                                                            |
| TC-03    | 別 project ディレクトリでの `cc` 起動             | 階層適用が設計どおり                                                 |
| TC-04    | allow 対象（`pnpm install` 等）の prompt 有無     | prompt なし                                                          |
| TC-05    | bypass 下の deny 対象（`git push --force` 等）    | 前提タスク結論に従う                                                 |
| TC-F-01  | `defaultMode` typo 設定での起動                   | エラーまたは安全側 fallback                                          |
| TC-F-02  | alias オプション typo                             | `unknown flag` エラー                                                |
| TC-R-01  | `grep -nE '^alias cc=' <定義ファイル>`            | 1 行のみ                                                             |

### 検証手順

```bash
# JSON validity
node -e "JSON.parse(require('fs').readFileSync('/Users/<USER>/.claude/settings.json','utf8')); console.log('OK')"
node -e "JSON.parse(require('fs').readFileSync('/Users/<USER>/.claude/settings.local.json','utf8')); console.log('OK')"
node -e "JSON.parse(require('fs').readFileSync('$(pwd)/.claude/settings.json','utf8')); console.log('OK')"

# alias 検証
type cc
grep -nE '^alias cc=' ~/.zshrc

# defaultMode 一致確認
grep -n "defaultMode" ~/.claude/settings.json ~/.claude/settings.local.json "$(pwd)/.claude/settings.json"

# smoke test
cc   # 新規タブで実行し effective mode を観察
```

---

## 7. リスクと対策

| リスク                                                     | 影響度 | 発生確率 | 対策                                                                                                  |
| ---------------------------------------------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------- |
| グローバル変更が他プロジェクトへ silent 波及               | 高     | 中       | 実装前に `grep -rn defaultMode` で他 project の override を再走査（必須前提条件として Phase 1 に組込） |
| JSON 破壊により Claude Code が起動不能                     | 高     | 低       | 各 Step 後に `node -e "JSON.parse(...)"` 検証、失敗時は即 backup から復元                             |
| alias 定義の重複でどちらが効くか不明                       | 中     | 中       | Phase 1 grep で複数ヒット時は実装中断、TC-R-01 を完了条件に必須化                                     |
| `--dangerously-skip-permissions` 下で deny が効かない      | 高     | 不明     | `task-claude-code-permissions-deny-bypass-verification-001` を前提条件として完了させ結論を反映         |
| backup 未取得のまま編集して rollback 不能                  | 高     | 低       | Step 1 backup を必須化、`${TS}` を実行記録ノートへ即時転記                                            |
| project-local-first 比較未実施で global を不要に変更       | 中     | 中       | `task-claude-code-permissions-project-local-first-comparison-001` を前提条件化                        |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-12/unassigned-task-detection.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-3/main.md`
- `docs/30-workflows/task-claude-code-permissions-decisive-mode/outputs/phase-5/runbook.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-deny-bypass-verification-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-project-local-first-comparison-001.md`
- `doc/00-getting-started-manual/claude-code-config.md`

### 参考資料

- Anthropic 公式 Claude Code docs（`permissions` / `defaultMode` / `--dangerously-skip-permissions`）
- 元タスク `outputs/phase-2/{settings-diff,alias-diff,whitelist-design}.md`
- 元タスク `outputs/phase-4/test-scenarios.md`

---

## 9. 備考

### 苦戦箇所【記入必須】

> 元タスク `task-claude-code-permissions-decisive-mode`（特に Phase 3 / Phase 12）由来。source evidence: `outputs/phase-3/main.md`, `outputs/phase-12/unassigned-task-detection.md`。

| 項目     | 内容                                                                                                                                                                                                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 3 層 settings の `defaultMode` 不整合（global=`acceptEdits`, globalLocal=`bypassPermissions`, project=`bypassPermissions`）状態でどの値が effective になるか公式 docs から即決できず、`--dangerously-skip-permissions` が `permissions.deny` を無効化するか否かも判断保留となった |
| 原因     | Claude Code settings の階層優先順位および `--dangerously-skip-permissions` flag が `permissions.deny` にどう作用するかが、Anthropic 公式仕様で明示されておらず、実機検証が必須となるため設計のみで実装承認できなかった                                |
| 対応     | Phase 3 で他プロジェクト波及範囲を `impact-analysis.md` に列挙して許容判定し、bypass モード下の deny 実効性は別タスク `task-claude-code-permissions-deny-bypass-verification-001` の前提条件として外出し。global 変更の正当性は `task-claude-code-permissions-project-local-first-comparison-001` で再確認することにした |
| 再発防止 | 本タスク開始前に必ず deny-bypass-verification-001 を完了し結果を設計入力に反映する。global を触る前に project-local-first 比較も実施。手順上は backup → JSON validity → alias 重複検出を必須ガードとして runbook 化済み（`outputs/phase-5/runbook.md`） |

### レビュー指摘の原文（該当する場合）

```
U1: 実 settings / ~/.zshrc 書き換えを行う実装タスク
出典: 本タスク（task-claude-code-permissions-decisive-mode）のスコープ外
優先度: HIGH
状態: docs/30-workflows/unassigned-task/task-claude-code-permissions-apply-001.md
（outputs/phase-12/unassigned-task-detection.md より）
```

### 補足事項

- 本タスクは `~/.claude/` および `~/.zshrc` というユーザー環境ファイルを編集するため、実行担当者は必ず単一マシン上で `${TS}` を発行し、backup と rollback 手順を実行記録ノートにコピーしてから着手すること
- 完了後は元タスクの `outputs/phase-12/skill-feedback-report.md` に「U1 反映完了」を追記し、未タスク台帳の整合を取る
- LOW 候補 U6（`Edit` / `Write` whitelist スコープ限定）/ U7（公式 docs URL の `claude-code-config.md` 反映）は本タスクの設計入力として扱うが、未着手のままでも本タスクの完了条件は満たされる
