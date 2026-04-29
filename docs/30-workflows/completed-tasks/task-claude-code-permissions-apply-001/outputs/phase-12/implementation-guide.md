# Implementation Guide: Claude Code Permissions Apply (after実反映)

## PR メッセージ用サマリ（5-10 行・冒頭抜粋）

- 元タスク `task-claude-code-permissions-decisive-mode` の設計（spec_created）を host 環境へ実機反映した。
- 反映 TS=`20260428-192736` で backup 4 件（global settings / project settings / `cc` alias / zshrc）を取得し、project settings に §4 minimum guarantee（allow 7 / deny 4）を採用候補 (b) で包含。
- `cc` alias は `~/.config/zsh/conf.d/79-aliases-tools.zsh:7` に `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` で正準化。
- TC-01〜TC-04 / TC-F-01,02 / TC-R-01 = PASS、TC-05（bypass 下 deny 実効性）は前提タスク未完で BLOCKED（FORCED-GO 既知）。
- NON_VISUAL（UI 変更ゼロ）。主証跡は `outputs/phase-11/manual-smoke-log.md`、screenshot 不要。
- rollback は `cp -p <bak.20260428-192736> <original>` 4 件 + `exec zsh -l` で完全復帰可能。

---

## Part 1（中学生レベル・鍵の例え話の続き）

元タスクでは「家族（自分の作業環境）が玄関を通るときに毎回確認しなくて済む鍵の取り付け図」を **設計図** として描きました。本タスクではその設計図どおりに **本物の鍵屋さんを呼んで実際に鍵を付け替える** 作業をしました。

やったこと（家のドア＝設定ファイル＋玄関の合言葉＝`cc` 起動コマンド）:

1. **3 つのドアの鍵設定を確認**: 家のドアは 3 段階あって（global / global-local / project）、上のドアの設定が下を上書きします。本当に「家族は確認なし」になっているか、ドアごとに jq で覗いて確かめました。すでに正しかったドアは触らず、念のため写真（=backup ファイル）だけ撮りました。
2. **玄関の貼り紙（allow / deny リスト）を貼り直し**: 「やって OK のリスト」（pnpm install / git status など 7 枚）と「絶対ダメのリスト」（git push --force など 4 枚）を、project の貼り紙に既存のものと混ぜて重複なく追加しました。
3. **玄関の合言葉に保険のひとことを足す**: `cc` という合言葉に「最初から確認スキップ」（`--dangerously-skip-permissions`）を足しました。これで設定ファイルの読み込みに何かあっても、玄関の段階で確認をスキップできます。
4. **一個ずつドアを開け閉めして確認**: 鍵を付け替えた後、扉を 8 通りの順序（TC-01〜TC-R-01）で開けて、合言葉が壊れていないか・貼り紙が読まれているかを確かめました。1 件だけ「ダメ集が本当にダメで止まるか」（TC-05）は前提の確認実験が終わっていなかったので、いったん保留にしました（前提実験は別タスクとして登録）。
5. **元に戻せるようにしておく**: 古い鍵の写真（`*.bak.20260428-192736`）が 4 枚あるので、何かあれば 1 行のコマンドで全部元に戻せます。

なぜ大事？: 設計図だけでは家は守れません。実際に取り付けて、扉が動くかを確かめて、戻し方も決めて初めて「使える」状態になります。本タスクはまさにその「取り付け・確認・戻し方」を完了させる Phase です。

---

## Part 2（技術詳細）

### 元タスク guide との差分構造（before → after）

| 項目 | 元タスク（before / 設計） | 本タスク（after / 実反映） |
| --- | --- | --- |
| `cc` alias 配置先 | `~/.zshrc` 直書き（設計時） | **`~/.config/zsh/conf.d/79-aliases-tools.zsh:7`**（zsh conf.d 経路で正準化） |
| `defaultMode` 配置 | layer ごとの `defaultMode`（flat） | **nested `permissions.defaultMode`**（実 schema 適合） |
| whitelist 採用方針 | E-3 案 7+4 件のみ提示 | **採用候補 (b)**（既存 + §4 minimum guarantee 包含、unique 化）で実反映 |
| `~/.zshrc` conf.d source | 手順記載なし（設計時保留） | line 25 の個別 source で十分 → **追記不要 / no-op**（idempotent 判定） |
| 実反映の状態 | spec_created（実機未反映） | **completed**（TS=20260428-192736 で実反映） |
| TC 全件 | テンプレ穴埋め | TC-01〜04 / TC-F-01,02 / TC-R-01 = PASS、TC-05 = BLOCKED |
| 証跡 | manual-smoke-log テンプレ | CLI 出力で穴埋め済 + Phase 11 再観測値も記録 |

### E-1 / E-2 / E-3 実反映結果サマリ

#### E-1: settings 階層の `defaultMode` 統一（実反映後）

| Layer | Path | 実反映後 `permissions.defaultMode` | 操作 |
| --- | --- | --- | --- |
| global | `~/.claude/settings.json` | `bypassPermissions` | **no-op**（既値）+ backup B1 取得 |
| globalLocal | `~/.claude/settings.local.json` | （不在） | **不在維持**（作成しない設計方針）|
| project | `<project>/.claude/settings.json` | `bypassPermissions` | nested で確認、whitelist のみ更新 |
| projectLocal | `<project>/.claude/settings.local.json` | （不在） | **不在維持** |

#### E-2: `cc` エイリアス（実反映後）

```zsh
# /Users/dm/.config/zsh/conf.d/79-aliases-tools.zsh:7
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

検証:
- `grep -cE '^alias cc=' ~/.config/zsh/conf.d/79-aliases-tools.zsh` → `1`
- `zsh -i -c 'type cc'` → `cc is an alias for claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions`
- `~/.zshrc:25` で `source ~/.config/zsh/conf.d/79-aliases-tools.zsh` 済 → conf.d source 追記は不要（no-op）

#### E-3: project `permissions.allow` / `deny`（採用候補 (b) で実反映後）

```text
allow count: 139 → 146 (+7)   # §4 minimum guarantee 7 件を unique 化包含
deny count:  13  → 16 (+3)    # §4 4 件のうち未包含 3 件を追加
defaultMode: bypassPermissions  # 変更なし
```

§4 minimum guarantee の包含確認:
- allow: `Bash(pnpm install)` / `Bash(pnpm typecheck)` / `Bash(pnpm lint)` / `Bash(pnpm test)` / `Bash(git status)` / `Bash(git diff:*)` / `Bash(git log:*)` = 7/7
- deny: `Bash(git push --force:*)` / `Bash(git push -f:*)` / `Bash(rm -rf /:*)` / `Bash(curl * | sh:*)` = 4/4

### 階層優先順位（再掲）

```
project/.claude/settings.local.json   (最優先)
  > project/.claude/settings.json
    > ~/.claude/settings.local.json
      > ~/.claude/settings.json       (最弱)
```

- 同名キーは上が下を上書き
- `permissions.allow` / `deny` は配列マージではなく上層が完全上書きする前提（実機 TC-04 で確認）
- enterprise managed settings は本タスク対象外

### Backup ファイル一覧（TS=20260428-192736）

| # | 絶対パス | サイズ | sha256 (head 16) |
| --- | --- | --- | --- |
| B1 | `/Users/dm/.claude/settings.json.bak.20260428-192736` | 4711 | `714c12e9534c6ca1` |
| B2 | `<project>/.claude/settings.json.bak.20260428-192736` | 6134 | `98e52b1fb1de4164` |
| B3 | `/Users/dm/.config/zsh/conf.d/79-aliases-tools.zsh.bak.20260428-192736` | 1462 | `c8ea14c47e71725e` |
| B4 | `/Users/dm/.zshrc.bak.20260428-192736` | 1417 | `249076b45d5e7b8b` |

### Rollback 手順（記録のみ・実行はしない）

```bash
TS=20260428-192736
PROJ="/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170927-wt-8/.claude/settings.json"

cp -p "$PROJ.bak.$TS" "$PROJ"
cp -p ~/.config/zsh/conf.d/79-aliases-tools.zsh.bak.$TS ~/.config/zsh/conf.d/79-aliases-tools.zsh
cp -p ~/.claude/settings.json.bak.$TS ~/.claude/settings.json
cp -p ~/.zshrc.bak.$TS ~/.zshrc
exec zsh -l
```

詳細手順: `outputs/phase-05/runbook-execution-log.md` Step 6

### TC 判定サマリ表

| TC | 名称 | 判定 | 証跡 |
| --- | --- | --- | --- |
| TC-01 | `cc` 起動直後のモード表示 | PASS | manual-smoke-log §TC-01 |
| TC-02 | reload / session 切替後のモード維持 | PASS | manual-smoke-log §TC-02 |
| TC-03 | 別プロジェクト階層適用 | PASS | manual-smoke-log §TC-03 |
| TC-04 | whitelist 効果（prompt なし） | PASS | manual-smoke-log §TC-04 |
| TC-05 | bypass 下の deny 実効性 | **BLOCKED** | 前提タスク未完（FORCED-GO 既知） |
| TC-F-01 | `defaultMode` typo 注入 | PASS | Phase 6 fail-path-tests |
| TC-F-02 | `cc` alias 重複定義注入 | PASS | Phase 6 fail-path-tests |
| TC-R-01 | alias 重複検出 guard | PASS | Phase 6 fail-path-tests |

集計: PASS 7 / BLOCKED 1 / FAIL 0。

### NON_VISUAL の根拠

- 検証対象は CLI 出力テキスト（`defaultMode` 文字列・`type cc` 出力・grep カウント）に限定
- UI 表示変更ゼロ → screenshot は **取得しない**（`outputs/phase-11/screenshots/` 自体作成しない・`.gitkeep` も置かない）
- 主証跡: `outputs/phase-11/manual-smoke-log.md`
- 補助証跡: `outputs/phase-11/link-checklist.md` / Phase 5 / Phase 6

### APIシグネチャ（再掲）

```bash
claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions
```

```ts
type PermissionMode = "acceptEdits" | "bypassPermissions";

interface ClaudeCodeSettingsLayer {
  name: "global" | "globalLocal" | "project" | "projectLocal";
  path: string;
  permissions?: {
    defaultMode?: PermissionMode;
    allow?: string[];
    deny?: string[];
  };
}

interface ResolvedPermission {
  effectiveMode: PermissionMode;
  sourceLayer: ClaudeCodeSettingsLayer["name"];
  allow: string[];
  deny: string[];
}

function resolvePermission(layers: ClaudeCodeSettingsLayer[]): ResolvedPermission;
```

### エラーハンドリング・エッジケース

| Case | 期待挙動 | 実観測 / TC |
| --- | --- | --- |
| `defaultMode` typo | bypass にマッチせず prompt fallback | TC-F-01 PASS |
| alias オプション typo | `unknown flag` エラー | TC-F-02 系（重複注入で代替確認）PASS |
| `cc` alias 重複 | 後勝ち（不本意な動作） | TC-F-02 で観測 + TC-R-01 guard で検出 |
| bypass + deny の衝突 | 未確認（前提タスク未完） | TC-05 BLOCKED |
| backup ファイルの grep 誤検出 | guard で `\.bak\.` 除外 | TC-R-01 で補正済 |
