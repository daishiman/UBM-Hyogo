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

`task-claude-code-permissions-decisive-mode` は `spec_created / docs-only / NON_VISUAL` として完了し、その後 `task-claude-code-permissions-project-local-first-comparison-001` で project-local-first / global / ハイブリッドを比較した。最新の決定事項は以下のとおり。

- 採用案: ハイブリッド（`<project>/.claude/settings.local.json` を主経路、`~/.claude/settings.json` を fresh worktree / new project 向け fallback）
- `cc` alias への `--dangerously-skip-permissions` 追加は、deny 実効性検証が完了するまで採用しない
- `permissions.allow` / `permissions.deny` は本タスクで新規拡張しない。既存値を壊さず、`defaultMode` のみを最小変更対象にする

これらを実機の設定に反映し、Claude Code 起動時に毎回 permission prompt が出ない状態を、影響半径を抑えて恒常化することが本タスクの責務である。

### 1.2 問題点・課題

- 現状は projectLocal が存在しない fresh worktree / new project で prompt 復帰するリスクが残る
- global fallback を入れる場合、他プロジェクトにも bypass が波及しうるため、事前 grep と rollback が必須になる
- `--dangerously-skip-permissions` は deny 実効性が未確定のため、alias に焼き込むと安全側の `permissions.deny` を期待できない可能性がある
- 実機変更に伴う backup / rollback 手順が手元に整備されていない

### 1.3 放置した場合の影響

- 通常作業のたびに permission prompt が再出現し、フロー中断と心理コストが継続発生する
- 「どの層の設定が効いているか」が不明瞭になり、別プロジェクトや新規 worktree でのトラブル切り分けが困難になる
- 失敗時の rollback 手順が場当たり対応となり、`~/.claude/` を破損させるリスクが高い
- projectLocal 未配置の worktree が増えるほど、同じ prompt 復帰問題を個別に手当てする運用負荷が増える

---

## 2. 何を達成するか（What）

### 2.1 目的

`task-claude-code-permissions-project-local-first-comparison-001` の採用案を、実機の settings に反映する。主経路は `<project>/.claude/settings.local.json`、fallback は `~/.claude/settings.json` とし、shell alias 強化は実施しない。

### 2.2 最終ゴール

- `<project>/.claude/settings.local.json` が `"defaultMode": "bypassPermissions"` を保持
- `~/.claude/settings.json` が fallback として `"defaultMode": "bypassPermissions"` を保持
- `~/.claude/settings.local.json` と `<project>/.claude/settings.json` は既存値を確認するのみで、必要な根拠がない限り変更しない
- `alias cc` に `--dangerously-skip-permissions` を追加しないことを確認する
- 変更前 backup（タイムスタンプ付き `.bak.<TS>` または `.absent.<TS>` marker）が残っており、ロールバック手順が `manual-smoke-log.md` 相当の形式で記録されている
- TC-01〜TC-05 / TC-F-01〜TC-F-02 / TC-R-01 の smoke test が成功記録済み

### 2.3 スコープ

#### 含むもの

- `~/.claude/settings.json` の `defaultMode` を `bypassPermissions` に変更
- `~/.claude/settings.local.json` の存在確認（実値転記禁止、原則変更なし）
- `<project>/.claude/settings.local.json` の作成または `defaultMode` 整合（必要 project のみ）
- `~/.zshrc`（または `~/.config/zsh/conf.d/*.zsh`）の `cc` alias 確認（dangerous flag を追加しない）
- 変更前の自動 backup と rollback 手順の整備
- 実機 smoke test の結果記録

#### 含まないもの

- bypass モード下での `permissions.deny` 実効性の検証（→ `task-claude-code-permissions-deny-bypass-verification-001` の責務）
- project-local-first（global を触らず project 単位で適用）案の比較設計（→ `task-claude-code-permissions-project-local-first-comparison-001` の責務）
- MCP server / hook の permission 挙動検証（U4 候補、未タスク化）
- `Edit` / `Write` の whitelist 化（Phase 10 MINOR 保留）
- enterprise managed settings の対応

### 2.4 成果物

- 更新後の `~/.claude/settings.json`
- 更新後の `<project>/.claude/settings.local.json`
- 確認結果のみ: `~/.claude/settings.local.json` / `<project>/.claude/settings.json` / `~/.zshrc`
- backup ファイル群: `*.bak.<TS>` または `.absent.<TS>` marker（settings / zshrc の存在状態を復元可能にする）
- `manual-smoke-log.md` 相当の TC 実行ログ（CLI 出力テキストを主証跡）
- rollback 手順を記載した実行記録ノート

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-project-local-first-comparison-001` が完了し、ハイブリッド採用案を参照済みであること
- `task-claude-code-permissions-deny-bypass-verification-001` が未完了の場合でも、本タスクでは alias dangerous 強化を実施しないため着手可能
  - 公式 docs で明示判定できない場合は、`docs/30-workflows/completed-tasks/task-claude-code-permissions-deny-bypass-execution-001.md` の isolated 実機検証で deny 実効性を別途確認する
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

`task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-5/comparison.md` Section 4 / 6 を正本として、Step 1（backup）→ Step 2（global fallback）→ Step 3（projectLocal 主経路）→ Step 4（alias は確認のみ）→ Step 5（smoke test）→ 失敗時 Step 6（rollback）の順で実行する。

---

## 4. 実行手順

### Phase構成

1. 前提チェックと backup 取得
2. global fallback の `defaultMode` 設定
3. projectLocal 主経路の `defaultMode` 設定
4. `cc` alias の確認（dangerous flag 追加なし）
5. smoke test 実施と結果記録

### Phase 1: 前提チェックと backup 取得

#### 目的

実環境の現状を把握し、ロールバックに必要な完全 backup を取得する。

#### 手順

1. `claude --version` でバージョンを記録
2. `grep -rn "alias cc=" ~/.zshrc ~/.config/zsh/ 2>/dev/null` で alias 定義ファイルを 1 箇所に特定（複数ヒットなら中断）
3. `ls -la ~/.claude/settings.json ~/.claude/settings.local.json "$(pwd)/.claude/settings.json"` で settings 存在確認
4. `TS=$(date +%Y%m%d%H%M%S)` を発行し、存在するファイルは `*.bak.${TS}` でコピー、存在しないファイルは `.absent.${TS}` marker を作る
5. `ls -la ~/.claude/*${TS} ~/.zshrc*${TS}` で backup / absent marker の整合を確認
6. 取得した `${TS}` を実行記録ノートへ転記

#### 成果物

- 4 ファイルの `.bak.<TS>` セット
- 実行記録ノート（バージョン / TS / alias 定義ファイルパス）

#### 完了条件

- backup が 4 件すべて存在し、ファイルサイズが元と一致
- alias 定義ファイルが 1 箇所に確定

### Phase 2: global fallback の `defaultMode` 設定

#### 目的

`~/.claude/settings.json` を fresh worktree / new project 向け fallback として `bypassPermissions` にする。

#### 手順

1. `~/.claude/settings.json` の `"defaultMode"` を `bypassPermissions` に変更
2. JSON validity を `node -e` で検証
3. `~/.claude/settings.local.json` は存在確認のみ。変更が必要な場合は理由を記録して中断し、別判断に回す
4. `scripts/new-worktree.sh` が `<project>/.claude/settings.local.json` を生成しない場合、global fallback で補完する判断を記録する

#### 成果物

更新後の `~/.claude/settings.json`

#### 完了条件

- JSON validity 検証が `OK`
- `defaultMode` が `bypassPermissions`

### Phase 3: projectLocal 主経路の `defaultMode` 設定

#### 目的

必要 project の `<project>/.claude/settings.local.json` を主経路として `bypassPermissions` にする。

#### 手順

1. `<project>/.claude/settings.local.json` の存在を確認
2. 未存在なら作成し、既存なら `defaultMode` のみ整合
3. JSON validity を `node -e` で検証
4. `<project>/.claude/settings.json` の `permissions.allow` / `deny` は変更しない

#### 成果物

更新後の `<project>/.claude/settings.local.json`

#### 完了条件

- JSON validity OK
- `defaultMode` が `bypassPermissions`

### Phase 4: `cc` alias の確認

#### 目的

`cc` alias に `--dangerously-skip-permissions` を追加しないことを確認する。

#### 手順

1. Phase 1 で特定した alias 定義ファイルを確認
2. `grep -n -- '--dangerously-skip-permissions' <該当ファイル>` が 0 件であることを確認
3. `type cc` の出力を記録する
4. `grep -nE '^alias cc=' <該当ファイル>` の結果が 1 行のみであることを確認（TC-R-01）

#### 成果物

alias 確認ログ

#### 完了条件

- `type cc` 出力に `--dangerously-skip-permissions` が含まれない
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
- [ ] 必要 project の `<project>/.claude/settings.local.json` が `bypassPermissions`
- [ ] `type cc` に `--dangerously-skip-permissions` が含まれない
- [ ] alias 定義の重複が 0

### 品質要件

- [ ] 変更対象 settings 2 ファイルで JSON validity 検証 OK
- [ ] backup または absent marker が取得済み
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
| TC-04    | alias dangerous flag 不採用確認                   | `type cc` / alias 定義に `--dangerously-skip-permissions` が含まれない |
| TC-05    | bypass 下の deny 対象（`git push --force` 等）    | 前提タスク結論に従う                                                 |
| TC-F-01  | `defaultMode` typo 設定での起動                   | エラーまたは安全側 fallback                                          |
| TC-F-02  | alias オプション typo                             | `unknown flag` エラー                                                |
| TC-R-01  | `grep -nE '^alias cc=' <定義ファイル>`            | 1 行のみ                                                             |

### 検証手順

```bash
# JSON validity
node -e "JSON.parse(require('fs').readFileSync('/Users/<USER>/.claude/settings.json','utf8')); console.log('OK')"
node -e "JSON.parse(require('fs').readFileSync('$(pwd)/.claude/settings.local.json','utf8')); console.log('OK')"

# alias 検証
type cc
grep -nE '^alias cc=' ~/.zshrc

# defaultMode 確認
grep -n "defaultMode" ~/.claude/settings.json "$(pwd)/.claude/settings.local.json"
grep -n -- "--dangerously-skip-permissions" ~/.zshrc ~/.config/zsh/conf.d/*.zsh 2>/dev/null || true

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
| `--dangerously-skip-permissions` 下で deny が効かない      | 高     | 不明     | 本タスクでは alias dangerous を採用しない。検証完了後の別タスクで再評価 |
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
- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-5/comparison.md`
- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-3/impact-analysis.md`
- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/task-claude-code-permissions-project-local-first-comparison-001/outputs/phase-10/final-review-result.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-deny-bypass-verification-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-project-local-first-comparison-001.md`
- `doc/00-getting-started-manual/claude-code-config.md`

### 参考資料

- Anthropic 公式 Claude Code docs（`permissions` / `defaultMode` / `--dangerously-skip-permissions`）
- 元タスク `outputs/phase-2/{settings-diff,alias-diff,whitelist-design}.md`（旧案の履歴参照。実装方針は project-local-first comparison の結論を優先）
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
状態: docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md（指示書は存在、実反映は verification / execution 判定まで blocked）
（outputs/phase-12/unassigned-task-detection.md より）
```

### 補足事項

- 本タスクは `~/.claude/` および `~/.zshrc` というユーザー環境ファイルを編集するため、実行担当者は必ず単一マシン上で `${TS}` を発行し、backup と rollback 手順を実行記録ノートにコピーしてから着手すること
- 完了後は元タスクの `outputs/phase-12/skill-feedback-report.md` に「U1 反映完了」を追記し、未タスク台帳の整合を取る
- LOW 候補 U6（`Edit` / `Write` whitelist スコープ限定）/ U7（公式 docs URL の `claude-code-config.md` 反映）は履歴参照に留め、未着手のままでも本タスクの完了条件は満たされる
