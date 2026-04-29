# Claude Code permissions allowlist 最小化 - タスク指示書

## メタ情報

```yaml
issue_number: unassigned
```

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-claude-code-permissions-allowlist-minimization-001               |
| タスク名     | Claude Code permissions allowlist 最小化                              |
| 分類         | セキュリティ / 開発環境                                               |
| 対象機能     | `.claude/settings.json` の allow / deny 棚卸                          |
| 優先度       | HIGH                                                                  |
| 見積もり規模 | 中規模                                                                |
| ステータス   | 未実施                                                                |
| 発見元       | task-claude-code-permissions-apply-001 Phase 12 review                |
| 発見日       | 2026-04-28                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-apply-001` で settings 3 層の `defaultMode` を `bypassPermissions` に統一し、`cc` alias を `--dangerously-skip-permissions` 付きに正準化した。これにより日常作業の prompt は消えたが、副作用として広い allowlist（`Bash(rm:*)`, `Bash(git:*)`, 広い `Edit(...)` / `Write(...)`）が持つ「誤操作時の被害範囲」が直接的に効いてくる構造になった。さらに backup ファイル（`.claude/settings.json.bak.<TS>`）が repo 内に存在しており、PR 混入と履歴汚染の懸念が残る。

### 1.2 問題点・課題

- `Bash(rm:*)` は再帰削除を含む全 `rm` コマンドを許可しており、誤実行時の被害が大きい
- `Bash(git:*)` は `git push --force` / `git reset --hard` / `git branch -D` 等の破壊的サブコマンドも一括許可している
- `Edit(...)` / `Write(...)` の許可範囲が広く、想定外パスへの書込みが confirm なしで通る
- `.claude/settings.json.bak.<TS>` が repo 直下に残っており、PR に混入する可能性がある（`.gitignore` 未整備）
- 関連タスク `task-claude-code-permissions-deny-bypass-verification-001` の結論次第で `--dangerously-skip-permissions` 下の deny 実効性が変わるため、設計が結論と矛盾しないことを保証する必要がある

### 1.3 放置した場合の影響

- bypassPermissions と広い allowlist の組合せにより、AI エージェントの誤操作で repo / ホスト環境が破損する確率が増大する
- backup ファイルが PR に混入し、機微設定の履歴が外部公開される可能性がある
- allowlist の根拠が記録されないままドリフトし、将来の保守者が削除可否を判断できなくなる

---

## 2. 何を達成するか（What）

### 2.1 目的

`.claude/settings.json` の allow / deny を棚卸し、bypassPermissions 下でも安全側に倒した最小 allowlist を確立する。同時に backup ファイルの取り扱い方針を確定する。

### 2.2 最終ゴール

- broad allow（`Bash(rm:*)` / `Bash(git:*)` / 広い `Edit` / `Write` 等）の現状一覧と残す理由が表で説明されている
- 破壊的操作（`rm -rf` / `git push --force` / `git reset --hard` / `git branch -D` 等）は `ask` または `deny` に寄せる判断が明記されている
- backup ファイル（`.claude/settings.json.bak.*`）の扱い（削除 / `.gitignore` / PR 除外）が決定されている
- `task-claude-code-permissions-deny-bypass-verification-001` の結論と矛盾しない

### 2.3 スコープ

#### 含むもの

- `.claude/settings.json` の allow / deny を全項目棚卸し
- `Bash(rm:*)` / `Bash(git:*)` / `Edit(...)` / `Write(...)` の現状用途調査
- コマンド単位での `deny` / `ask` / narrow allow 分類
- backup ファイル運用方針の決定（削除 / `.gitignore` / PR 除外）
- 段階適用が必要な場合の移行計画
- `bypassPermissions` 下で守るべき deny 項目との整合確認

#### 含まないもの

- MCP server / hook 経路の検証（→ `task-claude-code-mcp-hook-permission-verification-001`）
- `cc` alias 自体の変更（→ apply-001 / cc-alias-guard-ci-001）
- 新規 tool の allow 追加
- enterprise managed settings の整備

### 2.4 成果物

- 現行 allow / deny の棚卸表（用途・残置理由・分類）
- 最小化後の allow / deny 設計差分（`.claude/settings.json` 提案）
- backup ファイル運用方針メモ（`.gitignore` 差分または削除手順）
- 段階適用計画（必要時）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-apply-001` が完了している
- `task-claude-code-permissions-deny-bypass-verification-001` の結論が出ている、または並行確認できる
- 現行 `.claude/settings.json` の allow / deny を `git log -p` で 2〜3 ヶ月分追跡できる

### 3.2 依存タスク

- `task-claude-code-permissions-apply-001`（完了済み）
- `task-claude-code-permissions-deny-bypass-verification-001`（前提結論を参照）

### 3.3 必要な知識

- Claude Code permissions の `Tool(pattern)` 記法
- `bypassPermissions` と `--dangerously-skip-permissions` の deny への影響
- `.gitignore` パターンと既存 backup ファイルの履歴扱い
- 段階適用（feature flag 不要のため allow を縮小→不足が出たら narrow allow を足す）の進め方

### 3.4 推奨アプローチ

「broad allow を残す根拠」を 1 行で書けないものは原則 narrow allow / ask / deny に寄せる。破壊的操作は `bypass` 下でも prompt が出る `ask`、もしくは `deny` を優先する（apply-001 の TC-05 BLOCKED と整合させる）。backup は repo に残さないことを基本方針とし、`.gitignore` 追加 + 既存ファイル削除を組合せる。

---

## 4. 実行手順

### Phase構成

1. 現行 allowlist 棚卸し
2. 分類（deny / ask / narrow allow / 残置）
3. backup ファイル運用方針確定
4. 設計差分作成と段階適用計画

### Phase 1: 現行 allowlist 棚卸し

#### 目的

何が許可されているか、なぜ許可されたかを可視化する。

#### 手順

1. `.claude/settings.json` の `permissions.allow` / `deny` を全項目抽出
2. 各項目について直近の使用実績（`Bash` 実行ログ / commit 履歴）を確認
3. 残置理由を 1 行で書けない項目をマーク

#### 成果物

棚卸し表（項目 / 用途 / 残置理由 / マーク）

#### 完了条件

全項目に用途と残置理由が記載される

### Phase 2: 分類（deny / ask / narrow allow / 残置）

#### 目的

各項目を 4 区分のどこに寄せるか決める。

#### 手順

1. 破壊的操作（`rm -rf` / `git push --force` / `git reset --hard` / `git branch -D` 等）を `deny` または `ask` に分類
2. broad allow を narrow allow（特定パス / 特定サブコマンド）に縮小可能か判定
3. 残置妥当な項目は理由を補強

#### 成果物

分類済み一覧

#### 完了条件

全項目が 4 区分のいずれかに分類されている

### Phase 3: backup ファイル運用方針確定

#### 目的

`.claude/settings.json.bak.<TS>` の取り扱いを確定する。

#### 手順

1. 既存 backup ファイルを列挙
2. `.gitignore` に `.claude/*.bak.*` を追加するか判定
3. PR 混入防止策（`git rm --cached` / pre-commit guard）を決定
4. ホスト側 backup の保存場所を repo 外に移すかを判断

#### 成果物

運用方針メモ + `.gitignore` 差分（必要時）

#### 完了条件

backup ファイルが PR に混入しない仕組みが決まっている

### Phase 4: 設計差分作成と段階適用計画

#### 目的

最小化後の allow / deny を設計し、必要なら段階適用する。

#### 手順

1. `.claude/settings.json` の allow / deny 提案差分を作成
2. 既存作業フローへの影響を見積り、必要なら段階適用順序を決定
3. `task-claude-code-permissions-deny-bypass-verification-001` の結論と矛盾しないか確認
4. 適用後の smoke test 観点を列挙

#### 成果物

設計差分 + 段階適用計画 + smoke 観点

#### 完了条件

広い allow が残る場合、その理由が表で 1 行説明できる

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] broad allow の一覧と残す理由が表で説明されている
- [ ] 破壊的操作が `ask` または `deny` に寄せられている
- [ ] backup ファイルの扱いが決定されている
- [ ] `.claude/settings.json` の最小化差分が作成されている

### 品質要件

- [ ] `task-claude-code-permissions-deny-bypass-verification-001` の結論と矛盾しない
- [ ] 既存作業フローを壊さない（必要なら段階適用）
- [ ] `bypassPermissions` 下で守るべき deny 項目と整合

### ドキュメント要件

- [ ] 棚卸表が残っている
- [ ] 運用方針メモが残っている
- [ ] `claude-code-config.md` に追記が必要なら反映

---

## 6. 検証方法

### テストケース

| TC ID    | 内容                                              | 期待                                |
| -------- | ------------------------------------------------- | ----------------------------------- |
| TC-P-01  | `Bash(rm -rf /)` 試行                             | deny で拒否される                    |
| TC-P-02  | `git push --force origin main` 試行               | deny または ask で停止する           |
| TC-P-03  | 想定外パスへの `Write` 試行                       | ask または deny                      |
| TC-P-04  | `.claude/*.bak.*` を含む commit 試行              | guard で阻止 or `.gitignore` で除外 |

### 検証手順

```bash
# 現行 allow / deny 抽出
node -e "const s=JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log(JSON.stringify(s.permissions, null, 2))"

# backup ファイル列挙
ls -la .claude/*.bak.* 2>/dev/null || echo 'no backup'

# 提案適用後の smoke
# Claude Code セッション内で TC-P-01〜04 を対話的に確認
```

---

## 7. リスクと対策

| リスク                                                      | 影響度 | 発生確率 | 対策                                                                  |
| ----------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------- |
| allow 縮小により既存フローが prompt 多発で停止              | 中     | 中       | 段階適用 + smoke 観点で確認、必要箇所は narrow allow を追加           |
| backup ファイルがすでに PR に混入している                   | 高     | 中       | `git log -p .claude/*.bak.*` で履歴確認、必要なら BFG / filter-repo   |
| `--dangerously-skip-permissions` で deny が無視される結論に該当 | 高     | 不明     | 前提タスク結論を反映、`ask` の有効性も含めて再設計                  |
| narrow allow の記法ミスで意図せず広く許可                   | 中     | 中       | 設計差分を JSON validity 検証 + Claude Code 起動で確認                |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-deny-bypass-verification-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-mcp-hook-permission-verification-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-cc-alias-guard-ci-001.md`
- `doc/00-getting-started-manual/claude-code-config.md`

### 参考資料

- Anthropic Claude Code docs（permissions allow / deny）
- 元タスク `outputs/phase-2/whitelist-design.md`

---

## 9. 備考

### 苦戦箇所【記入必須】

> `task-claude-code-permissions-apply-001` Phase 10 MINOR 保留 + Phase 12 review より。

| 項目     | 内容                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| 症状     | apply-001 で `Edit` / `Write` の whitelist 化が MINOR 保留となり、broad allow が残ったまま bypass を恒常化した    |
| 原因     | apply-001 のスコープは「設計の実反映」で allowlist 最小化は別軸の検討事項だったため                              |
| 対応     | 本未タスクとして切り出し、deny-bypass-verification の結論を入力にして最小化を進める                              |
| 再発防止 | broad allow を増やす提案には常に「残す理由 1 行」を要件化する                                                     |

### レビュー指摘の原文（該当する場合）

```
task-claude-code-permissions-apply-001 Phase 12 review
broad allow と backup ファイルの取り扱いを未タスクとして切り出すこと
```

### 補足事項

- 本タスクは HIGH 優先度。bypassPermissions 恒常化の副作用に直結するため早期着手が望ましい
- backup ファイルがすでに PR に混入していないかは、Phase 3 の最初の確認事項に含める
