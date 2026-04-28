# Implementation Guide: Claude Code Permissions Decisive Mode

本ガイドは別タスクで実機反映する実装担当者に渡す手順書。
Part 1 は概念を中学生向けに、Part 2 は技術詳細を Engineer 向けに記述する。

---

## Part 1（中学生レベル）: 鍵の例え話

なぜ必要か。
家のドアに「開けますか？」と毎回聞いてくる電子ロックが付いていると想像してください。
家族（=自分が普段使う作業環境）が出入りするだけなのに、毎回確認が出ると面倒で作業が止まります。
たとえば、家の中を移動するたびに玄関まで戻って許可を取るようなものです。

何をするか。
このタスクでは次の 3 つを揃えます。

1. **家の中の鍵の設定を全部「家族は確認なしで通す」に統一する**
   - Claude Code には設定ファイルが 3 段階あり、上の段が下を上書きします。
   - 段ごとに違う値が書かれていると、起動するたびに「確認するモード」へ戻る事故が起きます。
   - だから 3 段全部を `bypassPermissions`（=確認スキップ）に揃えます。
2. **玄関を開ける合言葉（起動コマンド）にも「最初から確認をスキップ」と書いておく**
   - `cc` というショートカットに `--permission-mode bypassPermissions --dangerously-skip-permissions` というオプションを足す案を作ります。
   - ただし、危ない操作を止める貼り紙が本当に効くかは未確認なので、実際の反映は別タスクで確認してからにします。
3. **「これはやって OK / これは絶対ダメ」のリストを玄関に貼る**
   - `permissions.allow` には「pnpm install」「git status」など読み取り中心の安全なコマンドを並べます。
   - `permissions.deny` には「git push --force」など取り返しの付かないコマンドを並べます。
   - 確認をスキップしても、ダメ集にあるコマンドが止まるかを別タスクで確認します。

なぜ大事？: 起動のたびに確認が出ると集中が切れます。階層がバラバラだと「どの値が効いているか」が誰にも分からなくなります。揃えて、貼り紙を出して、玄関の合言葉にも書く——この三重で再発を防ぎます。

### 今回作ったもの

- 設定ファイルをどの順番で読むかを説明する設計メモ。
- `cc` ショートカットをどう変えるかの差分案。
- やってよい操作と止めたい操作のリスト案。
- 実機で確認するための手順書とチェック表。

---

## Part 2（技術詳細）

### E-1: settings 階層の `defaultMode` 統一

対象 3 ファイルを `bypassPermissions` で統一する（採用案 A）。

| Layer | Path | defaultMode |
| --- | --- | --- |
| global | `~/.claude/settings.json` | `bypassPermissions` |
| globalLocal | `~/.claude/settings.local.json` | `bypassPermissions` |
| projectLocal | `<project>/.claude/settings.local.json` | `bypassPermissions`（必要な project のみ） |

> 本リポジトリの `<project>/.claude/settings.json` は既に `bypassPermissions` であることを Phase 1 で確認済み。

### E-2: `cc` エイリアスへの `--dangerously-skip-permissions` 併用

```zsh
# ~/.zshrc
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

理由: settings の読み込み順や parser の挙動に依らず、起動時点で確実に bypass を確定させるため。
TC-R-01 で `grep -nE '^alias cc=' ~/.zshrc` の結果が 1 行のみであることを必ず確認する。

### E-3: `permissions.allow` / `deny` whitelist

```jsonc
{
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint)",
      "Bash(pnpm test)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)"
    ],
    "deny": [
      "Bash(git push --force:*)",
      "Bash(git push -f:*)",
      "Bash(rm -rf /:*)",
      "Bash(curl * | sh:*)"
    ]
  }
}
```

- `Edit` / `Write` の whitelist 化は Phase 10 MINOR として保留（Phase 12 で別タスク化候補に登録）
- 公式 docs URL は `system-spec-update-summary.md` に列挙

### 階層優先順位

```
project/.claude/settings.local.json   (最優先)
  > project/.claude/settings.json
    > ~/.claude/settings.local.json
      > ~/.claude/settings.json       (最弱)
```

- 同名キーは上が下を上書き
- `permissions.allow` / `deny` は配列マージではなく上層が完全上書きする前提で設計（実機 TC-04/TC-05 で確認）
- enterprise managed settings は本タスク対象外

### APIシグネチャ

```bash
claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions
```

```ts
function resolvePermission(layers: ClaudeCodeSettingsLayer[]): ResolvedPermission;
```

### 使用例

```bash
# alias の正準形を確認
alias cc

# 期待する出力
# cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

```ts
const resolved = resolvePermission(layers);
if (resolved.effectiveMode !== "bypassPermissions") {
  throw new Error(`unexpected permission mode: ${resolved.effectiveMode}`);
}
```

### 設定項目と定数一覧

| Key | 値 | 備考 |
| --- | --- | --- |
| `defaultMode` | `acceptEdits` \| `bypassPermissions` | typo は TC-F-01 で挙動確認 |
| `permissions.allow` | `string[]` | tool(pattern) 形式 |
| `permissions.deny` | `string[]` | bypass 下で実効するかは TC-05 / U2 で確認してから採用 |
| `CC_ALIAS_EXPECTED` | `claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions` | `cc` alias の正準形 |

### エラーハンドリング

| Case | 期待挙動 | 検証 TC |
| --- | --- | --- |
| 不正な `defaultMode` 文字列 | エラーまたは安全側 fallback | TC-F-01 |
| alias オプション typo | `unknown flag` エラー | TC-F-02 |
| `cc` alias 重複定義 | 1 行のみであるべき | TC-R-01 |
| bypass + deny の衝突 | 未確認。deny が実効しない場合は `--dangerously-skip-permissions` を alias から外す | TC-05 / Remaining Blocker |

### エッジケース

| Case | 扱い |
| --- | --- |
| project local が global を上書きする | 最上位の project local を優先し、実装時に source layer を記録する |
| `permissions.allow` と `permissions.deny` が同じ操作を含む | deny 優先が確認できない限り、安全成立条件として扱わない |
| 別プロジェクトで `cc` alias を使う | global alias の影響を受けるため U3 で project-local-first 案と比較する |
| shell に alias が複数ある | TC-R-01 で 1 行に正規化する |

### テスト構成

| Test | 目的 | 証跡 |
| --- | --- | --- |
| TC-01〜TC-03 | mode 維持と settings 階層確認 | `outputs/phase-11/manual-smoke-log.md` |
| TC-04 | allow 対象コマンドの prompt 有無 | `outputs/phase-11/manual-smoke-log.md` |
| TC-05 | bypass 下の deny 実効性確認 | U2 の実装前ブロッカー |
| TC-F-01〜TC-F-02 | invalid mode / flag typo | `outputs/phase-11/manual-smoke-log.md` |
| TC-R-01 | alias 重複検出 | `outputs/phase-11/manual-smoke-log.md` |

### 視覚証跡（NON_VISUAL 説明）

- 本タスクは UI 変更なし。証跡は CLI 出力テキスト（mode 表示・prompt の有無・grep 結果）で取得する。
- スクリーンショットは生成しない。`screenshots/.gitkeep` も置かない。
- 主証跡: `outputs/phase-11/manual-smoke-log.md` / 補助: `outputs/phase-10/final-review-result.md`

### 実装着手前提

- HIGH ブロッカー（bypass + deny の優先関係 / project-local-first 適用方針）解消後に実機反映
- 実機反映は別実装タスクで行い、本タスクは `spec_created` のまま完了

### Reference Contracts (TypeScript)

```ts
type PermissionMode = "acceptEdits" | "bypassPermissions";

interface ClaudeCodeSettingsLayer {
  name: "global" | "globalLocal" | "project" | "projectLocal";
  path: string;
  defaultMode?: PermissionMode;
  permissions?: { allow?: string[]; deny?: string[] };
}

interface ResolvedPermission {
  effectiveMode: PermissionMode;
  sourceLayer: ClaudeCodeSettingsLayer["name"];
  allow: string[];
  deny: string[];
}
```

```ts
function resolvePermission(layers: ClaudeCodeSettingsLayer[]): ResolvedPermission;
```
