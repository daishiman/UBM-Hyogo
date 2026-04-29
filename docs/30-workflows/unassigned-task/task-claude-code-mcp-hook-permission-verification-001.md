# MCP server / hook permission 挙動検証 - タスク指示書

## メタ情報

```yaml
issue_number: unassigned
```

## メタ情報

| 項目         | 内容                                                                  |
| ------------ | --------------------------------------------------------------------- |
| タスクID     | task-claude-code-mcp-hook-permission-verification-001                 |
| タスク名     | MCP server / hook permission 挙動検証                                 |
| 分類         | セキュリティ / 開発環境                                               |
| 対象機能     | Claude Code MCP server / hook の permission 評価経路                  |
| 優先度       | LOW                                                                   |
| 見積もり規模 | 小規模                                                                |
| ステータス   | 未実施                                                                |
| 発見元       | task-claude-code-permissions-apply-001 Phase 12                       |
| 発見日       | 2026-04-28                                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-claude-code-permissions-apply-001` の実反映では `Bash` / `Read` / `Edit` / `Write` を中心に TC-01〜TC-05 / TC-F-01,02 / TC-R-01 を確認した。一方、MCP server (`mcp__*`) と hook（`PreToolUse` / `PostToolUse` / `Stop` 等の settings.json hook）は permission 評価において別経路を持ち、`bypassPermissions` および `--dangerously-skip-permissions` との相互作用は未検証のまま残った。

### 1.2 問題点・課題

- MCP server 由来 tool が enabled の場合、その permission がどの設定階層で評価されるかが整理されていない
- hook (`settings.json` の `hooks` キー) が allow / deny / ask のどれに従って実行されるかが未確認
- bypass 下でも維持されるべき deny 項目（secret 読取系・破壊的操作系）が MCP / hook 経路でも有効か不明
- 元タスクの完了条件チェックリスト「品質要件」では検証対象外として外出しした経緯がある

### 1.3 放置した場合の影響

- MCP server から secret や `.env` を読み取る経路が静かに発生し、AI 学習混入対策が破綻する
- hook 経由で意図しない破壊的操作が無確認実行されるリスクが残る
- bypass 適用範囲が「実は MCP / hook には及ばない」または「過度に及ぶ」場合、設計意図と乖離する

---

## 2. 何を達成するか（What）

### 2.1 目的

MCP server と hook の permission 評価経路を検証し、`bypassPermissions` 下で守るべき deny 項目が両経路でも維持されることを確認する。

### 2.2 最終ゴール

- enabled MCP server に対する permission 評価順序（global / project / local）が記録されている
- hook 実行時の allow / deny / ask の扱いが確認され記録されている
- secret / `.env` 読取禁止が MCP / hook 経由でも維持されることが安全な範囲で検証されている
- 検証は token / secret の実値を一切使わず、ダミー値・read-only 観測のみで完了している

### 2.3 スコープ

#### 含むもの

- enabled MCP server の permission 評価経路の確認（実機観測）
- hook (`PreToolUse` / `PostToolUse` / `Stop`) の allow / deny / ask 挙動確認
- bypass 下での `Read(.env)` / 破壊的 hook の deny 維持確認
- 検証手順と観測結果の記録（manual log 形式）

#### 含まないもの

- 新規 MCP server の追加・有効化
- hook の新規実装
- secret 実値を使った検証
- enterprise managed settings の検証

### 2.4 成果物

- MCP / hook 検証ログ（`manual-smoke-log.md` 相当）
- permission 評価結果まとめ（経路別マトリクス）
- 必要に応じた `claude-code-config.md` への追記差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-claude-code-permissions-apply-001` が完了している
- `task-claude-code-permissions-deny-bypass-verification-001` の結論が出ている（または並行参照可能）
- 検証用にダミー値の `.env` を用意できる

### 3.2 依存タスク

- `task-claude-code-permissions-apply-001`（完了済み）
- `task-claude-code-permissions-deny-bypass-verification-001`（前提結論を参照）

### 3.3 必要な知識

- Claude Code settings の階層優先順位
- MCP server permission 記法（`mcp__<server>__<tool>`）
- hook 設定（`hooks.PreToolUse` 等）の matcher と実行コンテキスト
- `--dangerously-skip-permissions` が `permissions.deny` に作用する範囲

### 3.4 推奨アプローチ

- read-only 観測を優先する（hook 内部で破壊的コマンドを実行しない）
- ダミー `.env` と read-only スクリプト hook で deny 維持を検証
- MCP server は既存 enabled 一覧から read 系の安全な操作のみ実行
- 観測結果は元タスク同様 `manual-smoke-log.md` 形式に記録する

---

## 4. 実行手順

### Phase構成

1. 検証対象 MCP / hook の棚卸し
2. permission 評価経路の観測
3. bypass 下の deny 維持確認
4. 結果記録と運用メモ整備

### Phase 1: 検証対象 MCP / hook の棚卸し

#### 目的

実機で有効な MCP server と hook を一覧化する。

#### 手順

1. `~/.claude/settings.json` / `<project>/.claude/settings.json` の `enabledMcpjsonServers` / `hooks` を抽出
2. 対象が「read-only で安全に呼べる」か判定
3. 検証用ダミー `.env`（実値なし）を作業 worktree に作成

#### 成果物

検証対象一覧 + 安全性判定メモ

#### 完了条件

破壊的呼出しを伴わない検証セットが確定

### Phase 2: permission 評価経路の観測

#### 目的

MCP / hook が permission 階層をどう参照するか確認する。

#### 手順

1. enabled MCP server の read 系 tool を呼び出し、prompt の有無 / allow 評価層を観測
2. hook (`PreToolUse` 等) を 1 つ用意し、settings 階層を変えて挙動を観測
3. 観測結果を経路別マトリクスへ記録

#### 成果物

経路別 permission 評価マトリクス

#### 完了条件

各経路の評価層が 1 つに同定される

### Phase 3: bypass 下の deny 維持確認

#### 目的

`bypassPermissions` + `--dangerously-skip-permissions` 下でも deny が守られるか確認する。

#### 手順

1. ダミー `.env` を `Read(.env)` 相当で読もうとし、deny されることを確認
2. hook 経由で同等の試みを行い、deny が維持されるか観測
3. 結果を MCP / hook の経路別に記録

#### 成果物

deny 維持観測ログ

#### 完了条件

両経路で守るべき deny 項目の実効性が記録される

### Phase 4: 結果記録と運用メモ整備

#### 目的

検証結果を将来の作業者に引き継げる形で残す。

#### 手順

1. `manual-smoke-log.md` 相当のログを `outputs/` に配置
2. 必要に応じ `claude-code-config.md` に追記
3. 元タスクの skill-feedback-report に「MCP/hook 検証完了」を追記

#### 成果物

検証ログ + 運用メモ差分

#### 完了条件

MCP / hook の評価経路と deny 維持結論が引き継ぎ可能な形で残る

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] MCP server の permission 評価結果が経路別に記録されている
- [ ] hook の allow / deny / ask 扱いが記録されている
- [ ] bypass 下で守るべき deny 項目の実効性が両経路で確認されている

### 品質要件

- [ ] 検証に token / secret の実値を一切使っていない
- [ ] read-only 観測で完結している
- [ ] `task-claude-code-permissions-deny-bypass-verification-001` の結論と整合している

### ドキュメント要件

- [ ] 検証ログが `manual-smoke-log.md` 相当の形式で残っている
- [ ] 経路別 permission 評価マトリクスが残っている
- [ ] 元タスク skill-feedback-report に追記済み

---

## 6. 検証方法

### テストケース

| TC ID    | 内容                                                | 期待                                |
| -------- | --------------------------------------------------- | ----------------------------------- |
| TC-M-01  | enabled MCP read tool 呼出し（prompt 有無）         | bypass 下で prompt なし              |
| TC-M-02  | MCP tool に対する `permissions.deny` 効果           | deny が維持される                    |
| TC-H-01  | hook 経由 `Read(.env)` 試行                         | deny される（dummy 値だが拒否）      |
| TC-H-02  | hook が global / project どちらの設定で評価されるか | 1 階層に同定される                   |

### 検証手順

```bash
# enabled MCP / hooks の抽出
node -e "const s=JSON.parse(require('fs').readFileSync('$(pwd)/.claude/settings.json','utf8')); console.log(JSON.stringify({mcp:s.enabledMcpjsonServers, hooks:s.hooks}, null, 2))"

# ダミー .env の用意（実値禁止）
printf 'DUMMY_KEY=op://Vault/Item/Field\n' > /tmp/dummy.env

# 検証は Claude Code セッション内で対話的に実行し、prompt 有無と deny 挙動を記録
```

---

## 7. リスクと対策

| リスク                                            | 影響度 | 発生確率 | 対策                                                          |
| ------------------------------------------------- | ------ | -------- | ------------------------------------------------------------- |
| 検証中に実 secret が読み込まれる                  | 高     | 低       | ダミー `.env` のみ使用、実 `.env` に触れない                  |
| MCP tool が破壊的副作用を持つ                     | 高     | 低       | Phase 1 で read-only に限定                                   |
| hook 実装ミスでローカル環境を破壊                 | 中     | 低       | hook 内部は echo / printf のみ                                |
| 評価経路の同定誤り                                | 中     | 中       | 階層 1 つずつ変更し差分観測する                               |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/task-claude-code-permissions-apply-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-deny-bypass-verification-001.md`
- `docs/30-workflows/unassigned-task/task-claude-code-permissions-allowlist-minimization-001.md`
- `doc/00-getting-started-manual/claude-code-config.md`

### 参考資料

- Anthropic Claude Code docs（permissions / hooks / MCP）

---

## 9. 備考

### 苦戦箇所【記入必須】

> `task-claude-code-permissions-apply-001` の検証スコープ外として外出しされた経緯。

| 項目     | 内容                                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| 症状     | 元タスクの TC-01〜TC-05 は Bash/Read/Edit/Write 中心で、MCP / hook 経路は対象外として残った                            |
| 原因     | 検証コストと安全性の観点から MCP / hook はダミー値準備と慎重な観測手順が要り、本体タスクの完了を阻害するため分離された |
| 対応     | 検証手順とテストケースを明文化し、本未タスクとして切り出した                                                          |
| 再発防止 | bypass 下の deny 検証は MCP / hook も含めて評価することを未タスク台帳で恒久管理                                       |

### レビュー指摘の原文（該当する場合）

```
task-claude-code-permissions-apply-001 Phase 12 review
U4 候補: MCP / hook 経路の permission 検証
```

### 補足事項

- 本タスクは `bypass` モード下で守るべき deny の網羅性に関わるが、優先度は LOW（直近の運用は元タスク完了で安定）
- 検証で得られた知見は将来の `permissions.deny` 設計に反映する
