# alias-diff: `cc` エイリアス書き換え設計

## 対象ファイル

`~/.zshrc` または `~/.config/zsh/conf.d/<n>-claude.zsh`（いずれかに `cc` alias が定義される想定）。実ファイル名は本タスクで非確定。

## Before（現行）

```zsh
alias cc='claude --verbose --permission-mode bypassPermissions'
```

## After（採用案）

```zsh
alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

## diff 形式

```diff
-alias cc='claude --verbose --permission-mode bypassPermissions'
+alias cc='claude --verbose --permission-mode bypassPermissions --dangerously-skip-permissions'
```

## 設計理由

| 観点 | 説明 |
| --- | --- |
| `--permission-mode bypassPermissions` | session 内のモード設定。起動初期化中の prompt 経路は別フローで発火する可能性 |
| `--dangerously-skip-permissions` | permission チェック自体をスキップする CLI フラグ。session 開始前から有効 |
| 併用効果 | 起動瞬間〜session 中まで一貫して bypass を保証 |

## 副作用と運用注意

- セキュリティ警告がスキップされる。誤って destructive コマンドを実行するリスクが上がる
- リスク低減策: `permissions.deny` で破壊的コマンド（`rm -rf /*`, `rm -rf ~/*`, `git push --force origin main|master`, `wrangler *`）を必ず塞ぐ（`whitelist-design.md` 参照）
- ただし `--dangerously-skip-permissions` 環境下で `permissions.deny` が実効するかは Phase 3 で blocker 確認
- 対象 alias は **個人開発環境のみ**。共有 / 本番運用環境（CI、共有マシン）では適用しない

## 適用範囲

| 環境 | 適用 |
| --- | --- |
| 個人開発マシン（本タスク対象） | 適用 |
| 共有 dev サーバー | 非適用 |
| CI runner | 非適用（CI は `claude` を用いない） |

## ロールバック手順

1. 当該 alias 行を Before の状態に戻す（diff 逆適用）
2. `source ~/.zshrc` で再読込、または新規 zsh セッション起動
3. `alias cc` の出力で確認

## 実装タスクへの引き継ぎ事項

- 本タスクは設計のみ。実 `.zshrc` / fragment への書き換えは別実装タスク
- 実装後は新規ターミナル（または `exec zsh`）で `cc` を実行し、起動直後のモード表示を Phase 11 manual-smoke-log.md に記録
- alias 適用前後で `claude --version` / `claude --help` を確認し、フラグの非推奨化が起きていないか毎回チェック

## Phase 3 ゲート

- `--dangerously-skip-permissions` と `permissions.deny` の相互作用が公式仕様または実機で確認できない限り、**本 alias 設計は実装承認を保留**
- 確認できない場合は alias を Before に戻し、project-local settings 中心案へフォールバック
