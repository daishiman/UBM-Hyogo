# scripts/new-worktree.sh の実改修（lock + shell reset + tmux opt-in + audit） - タスク指示書

## メタ情報

```yaml
issue_number: 134
```


## メタ情報

| 項目         | 内容                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| タスクID     | ut-worktree-002-new-worktree-script-hardening                                     |
| タスク名     | scripts/new-worktree.sh の実改修（lock + shell reset + tmux opt-in + audit）       |
| 分類         | 機能拡張（攻め）                                                                   |
| 対象機能     | ワークツリー作成スクリプトの並列安全化と環境分離                                   |
| 優先度       | 高                                                                                 |
| 見積もり規模 | 中規模                                                                             |
| ステータス   | 未実施                                                                             |
| 発見元       | task-worktree-environment-isolation Phase 5 / Phase 12 implementation-guide §2.3  |
| 発見日       | 2026-04-28                                                                         |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-worktree-environment-isolation` は docs-only / spec_created として完了し、Phase 5 ランブックと Phase 12 implementation-guide §2.3 に `scripts/new-worktree.sh` を改修するための差分マップ・スニペット・検証手順までを正本化した。しかしスクリプト本体への反映は本タスク以降のスコープに切り出されている。現状の `scripts/new-worktree.sh` には lock 機構・shell state リセット・tmux session-scoped state の opt-in・skill symlink audit のいずれも実装されていない。

### 1.2 問題点・課題

- 同名ブランチで `bash scripts/new-worktree.sh` を並列起動すると、`git worktree add` が競合し worktree レイアウトが破損するリスクがある
- 親シェルから継承された `OP_SERVICE_ACCOUNT_TOKEN` や `PATH` キャッシュが新 worktree 内 `pnpm install` に汚染を持ち込む
- tmux のグローバル環境変数が複数 worktree 間で混線（implementation-guide Part 1 §1.3 の「親機メッセージ漏れ」）し、`UBM_WT_*` を session 単位で隔離できない
- skill symlink が再混入したかを検出する手段が new-worktree フローに無く、`.claude/skills/` の遡及監査ができない

### 1.3 放置した場合の影響

- 並列タスクの `pnpm install` が同一 lockfile で衝突し、依存解決の不整合が定常化する
- `OP_SERVICE_ACCOUNT_TOKEN` などの 1Password トークンが意図せず子プロセスへ流出し、AI 学習混入リスクが拡大する
- worktree 環境分離が再発防止できないため、`task-worktree-environment-isolation` で蓄積した教訓（Phase 12 lessons-learned）が形骸化する
- skill symlink 撤去（D-1）が CI/手動の双方で再検出できず、不変条件「skill は実ファイル or `~/.claude/skills/` に一本化」が維持できない

---

## 2. 何を達成するか（What）

### 2.1 目的

`scripts/new-worktree.sh` に対して、後方互換を維持したまま (a) branch slug 単位の lock 取得、(b) shell state リセット、(c) `--with-tmux` opt-in、(d) `--audit` opt-in を実装し、Phase 11 で定義された EV-4 / EV-5 / EV-7 を CI または手動 smoke で取得可能にする。

### 2.2 最終ゴール

- `bash scripts/new-worktree.sh feat/foo` が従来と同じ最終状態（worktree 作成 + 依存インストール）に到達する
- 同名 branch を 2 ターミナルで同時起動した場合、後発が即時 `exit 75` で失敗し、stderr に既存 lock owner の `pid/host/ts/wt` が出力される
- worktree 入場時に `OP_SERVICE_ACCOUNT_TOKEN` が unset され、`hash -r` 実行後に `mise install` が走る
- `--with-tmux` 指定時のみ tmux session が作成され、`UBM_WT_PATH` / `UBM_WT_BRANCH` / `UBM_WT_SESSION` の 3 件が session-scoped で注入される
- `--audit` 指定時に `.claude/skills/` 配下の symlink インベントリが標準出力に出力される
- EV-4 / EV-5 / EV-7 の証跡が手動 smoke ログまたは CI ログとして残る

### 2.3 スコープ

#### 含むもの

- `scripts/new-worktree.sh` の改修（slug 生成関数、lock 取得関数、引数解析、shell リセット、tmux opt-in、audit opt-in）
- mkdir 方式 lock の実装（既定）と `UBM_LOCK_MODE=flock` opt-in 経路
- EV-4 / EV-5 / EV-7 を取得する手動 smoke 手順または GitHub Actions 上の smoke job
- 後方互換性の回帰テスト（`bash scripts/new-worktree.sh feat/foo` 単独呼び出し）

#### 含まないもの

- `~/.tmux.conf` の配布手段（UT-D の責務）
- skill symlink を pre-commit で検出する lefthook hook（UT-A の責務）
- aiworkflow-requirements `references/` の追記反映（UT-C の責務）
- `.claude/skills/` 内の実ファイル化方針の決定（別タスクで決定済み前提）

### 2.4 成果物

- `scripts/new-worktree.sh` の差分（後方互換維持）
- `outputs/` 等に置く手動 smoke ログ（EV-4 / EV-5 / EV-7）または CI smoke job 定義
- `--audit` の出力例ログ
- 後方互換性検証ログ（`bash scripts/new-worktree.sh feat/foo` の実行結果）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `task-worktree-environment-isolation` の Phase 5 ランブックおよび Phase 12 implementation-guide §2.3 が main にマージされている
- `.gitignore` に `.worktrees/` が登録済み（runbook §7 で確認済み）
- macOS（Darwin 25.x 以上）または Linux 主要 distro 上で `git` 2.40+ / `mise` / `pnpm` 10 が利用可能

### 3.2 依存タスク

- `task-worktree-environment-isolation` の docs 確定（必須前提）
- UT-A（lefthook 側 symlink 検出）とは独立して進行可能だが、`--audit` 出力フォーマットが UT-A の hook 入力と整合することが望ましい

### 3.3 必要な知識

- bash の `trap` / `mkdir` 排他取得 / `flock(1)` の挙動差
- macOS/BSD `find` と GNU find の互換差（`-exec sh -c 'for p; do ... done' sh {} +` パターン）
- tmux の `update-environment` と `-e` フラグの session-scoped 注入
- mise / pnpm workspace の依存解決順序

### 3.4 推奨アプローチ

implementation-guide §2.3 の差分マップ（`L7 直後`に lock、`cd "$WT_PATH"` 直後に `unset OP_SERVICE_ACCOUNT_TOKEN; hash -r`、末尾に `--with-tmux` / `--audit` 分岐）をそのまま反映する。スニペットは「コピペで動く前提」で記述されているため、文言改変は最小限とする。lock は既定で mkdir 方式、`UBM_LOCK_MODE=flock` 設定 + `flock(1)` 存在時のみ flock 方式に切り替える系統選択ロジックを採用する。

---

## 4. 実行手順

### Phase構成

1. 現状スクリプトの棚卸しと差分マップ照合
2. slug 生成関数と lock 取得関数の実装
3. shell state リセットと tmux opt-in / audit opt-in の組み込み
4. 後方互換性検証と EV-4 / EV-5 / EV-7 取得

### Phase 1: 現状スクリプトの棚卸しと差分マップ照合

#### 目的

現状の `scripts/new-worktree.sh` と implementation-guide §2.3 / runbook §6 の差分マップを 1:1 で照合する。

#### 手順

1. `scripts/new-worktree.sh` の現行行番号を取得
2. implementation-guide §2.3 の表（L7 直後 / WT path 決定 / L18 / L21 / L25 / L28-34 / 末尾）と現行行を突合
3. ズレがあれば差分マップ側を正本として採用し、本タスク内では implementation-guide を改変しない

#### 成果物

差分マップ照合メモ

#### 完了条件

implementation-guide §2.3 の各行と現行行が対応付けられている

### Phase 2: slug 生成関数と lock 取得関数の実装

#### 目的

`slug_of_branch` と `acquire_lock` / `acquire_lock_mkdir` / `acquire_lock_flock` を runbook §4 のスニペット通りに実装する。

#### 手順

1. `slug_of_branch` を runbook §4.4 通りに追加（`<prefix-55>-<sha8>`）
2. `acquire_lock_mkdir` を runbook §4.1 通りに追加（stale lock 判定込み）
3. `acquire_lock_flock` を runbook §4.2 通りに追加（opt-in）
4. `acquire_lock` 系統選択ロジックを runbook §4.3 通りに追加
5. `git fetch origin main` の直前で `acquire_lock "$SLUG"` を呼び出す

#### 成果物

slug / lock 関数の差分

#### 完了条件

`UBM_LOCK_MODE=mkdir` / `UBM_LOCK_MODE=flock` の双方で動作し、stale lock が同一 host かつ pid 不在時のみ削除される

### Phase 3: shell state リセットと tmux opt-in / audit opt-in の組み込み

#### 目的

D-4（shell state 分離）と D-2（tmux session-scoped state）を opt-in で組み込み、`--audit` で skill symlink インベントリを出力する。

#### 手順

1. 引数解析を `--with-tmux` / `--audit` / `BRANCH` の 3 系統に拡張（runbook §6.2）
2. `cd "$WT_PATH"` 直後に `unset OP_SERVICE_ACCOUNT_TOKEN; hash -r` を挿入（D-4）
3. `--with-tmux` 指定時のみ tmux `has-session` チェック + `new-session -d -s ubm-${SLUG} -e UBM_WT_*` を実行（D-2）
4. `--audit` 指定時のみ末尾で macOS/BSD 互換 `find .claude/skills -maxdepth 3 -type l -exec sh -c '...' sh {} +` を実行
5. 既存セッションがあれば `exit 1`、再利用は禁止（runbook §3.3）

#### 成果物

opt-in 分岐の差分

#### 完了条件

`--with-tmux` / `--audit` 双方が opt-in でのみ発動し、未指定時は従来挙動と一致する

### Phase 4: 後方互換性検証と EV-4 / EV-5 / EV-7 取得

#### 目的

implementation-guide §2.2 表の EV-4 / EV-5 / EV-7 を取得し、後方互換性を smoke する。

#### 手順

1. `bash scripts/new-worktree.sh feat/compat-check` を単独実行し、worktree 作成 + 依存インストール完了まで従来通りであることを確認
2. 2 ターミナルで `bash scripts/new-worktree.sh feat/lock-check` を同時起動 → 後発が `exit 75`（EV-4）
3. `cat .worktrees/.locks/feat-lock-check-<sha8>.lockdir/owner` で `pid/host/ts/wt` の 4 行（EV-5）
4. worktree 内で `mise exec -- node --version` が `v24.x.x`（EV-7）
5. すべて手動 smoke ログまたは CI smoke job のログとして保存

#### 成果物

EV-4 / EV-5 / EV-7 のログと後方互換性検証ログ

#### 完了条件

3 件の証跡が記録され、後方互換性 smoke が PASS している

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `bash scripts/new-worktree.sh feat/foo` が後方互換で動作する
- [ ] 同名 branch 並列起動時に後発が `exit 75` で失敗する
- [ ] `--with-tmux` 指定時のみ tmux session が作成され `UBM_WT_*` 3 件が session-scoped で注入される
- [ ] `--audit` 指定時に skill symlink インベントリが出力される
- [ ] worktree 入場時に `OP_SERVICE_ACCOUNT_TOKEN` が unset され `hash -r` が実行される

### 品質要件

- [ ] `bash -n scripts/new-worktree.sh` が syntax error なし
- [ ] `shellcheck scripts/new-worktree.sh` の重大警告が 0 件
- [ ] EV-4 / EV-5 / EV-7 の証跡が CI または手動 smoke ログとして保存されている

### ドキュメント要件

- [ ] `--with-tmux` / `--audit` / `UBM_LOCK_MODE` の使い方が CLAUDE.md または `docs/` の該当箇所に追記されている
- [ ] implementation-guide §2.3 の差分マップとスクリプト実装が 1:1 で一致している

---

## 6. 検証方法

### テストケース

- 後方互換: `bash scripts/new-worktree.sh feat/foo` 単独実行で worktree が作成され `pnpm install` が完走する
- lock: 2 ターミナルで同名 branch を同時起動 → 後発が `exit 75`、stderr に owner メタ情報出力
- stale lock: 既存 lockdir の owner を `pid=99999`（不在 PID）で書き込み → 同一 host で再実行時に削除して再取得
- shell state: 親シェルで `export OP_SERVICE_ACCOUNT_TOKEN=dummy` した状態で worktree 作成 → worktree 内 `printenv OP_SERVICE_ACCOUNT_TOKEN` が空
- tmux opt-in: `--with-tmux` 無しで実行時に `tmux list-sessions` に `ubm-*` が増えない
- audit: `--audit` 実行時に `find .claude/skills -type l` の出力が stdout に現れる

### 検証手順

```bash
# 後方互換 smoke
bash scripts/new-worktree.sh feat/compat-check
git worktree list | grep compat-check

# lock smoke (EV-4 / EV-5)
( bash scripts/new-worktree.sh feat/lock-check & )
bash scripts/new-worktree.sh feat/lock-check ; echo "exit=$?"   # 期待: exit=75
cat .worktrees/.locks/feat-lock-check-*.lockdir/owner

# Node version (EV-7)
( cd .worktrees/task-feat-compat-check-*-wt && mise exec -- node --version )

# audit
bash scripts/new-worktree.sh feat/audit-check --audit | tee audit.log
```

---

## 7. リスクと対策

| リスク                                                                  | 影響度 | 発生確率 | 対策                                                                                                |
| ----------------------------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------- |
| 既存呼び出し（`bash scripts/new-worktree.sh feat/foo`）の後方互換崩壊   | 高     | 中       | 引数解析を「未知トークンは BRANCH」とする実装にし、Phase 4 smoke で常に検証                          |
| stale lock の誤判定で他ホストの lock を削除                             | 高     | 低       | 同一 host かつ pid 不在の双方を AND 条件で検査。runbook §4.1 のスニペット通りに実装                  |
| 日本語パスを含む `WT_PATH` で lockdir 名が破損                          | 中     | 中       | lockdir 名は `BRANCH_SLUG`（ASCII のみ）由来とし、`owner.wt` だけ UTF-8 を保持                       |
| tmux 既存セッションの再利用による環境変数汚染                           | 中     | 中       | `tmux has-session` 検出時は `exit 1` で中止し再利用しない                                           |
| flock 経路を opt-in にしたが macOS で誤って有効化される                 | 低     | 低       | `command -v flock` を AND 条件にし、未存在時は mkdir にフォールバック                                |
| `--audit` 出力が UT-A（lefthook hook）の入力フォーマットと不整合        | 中     | 中       | 出力形式は `<path> -> <target>` の 1 行 1 件で固定し、UT-A 側で同形式を採用するよう仕様メモを残す    |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/unassigned-task-detection.md` §1.2 UT-B
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-12/implementation-guide.md` §2.3（差分マップ）
- `docs/30-workflows/task-worktree-environment-isolation/outputs/phase-5/runbook.md`
- `scripts/new-worktree.sh`
- `CLAUDE.md`（ワークツリー作成セクション）

### 参考資料

- implementation-guide §1.3「tmux と shell の混線」（中学生向け説明）
- implementation-guide §2.2 EV-1〜EV-7 の証跡取得手順
- runbook §4「D-3: gwt-auto lock」mkdir / flock 双方のスニペット

---

## 9. 備考

### 苦戦箇所【記入必須】

> task-worktree-environment-isolation Phase 5 / Phase 12 で気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 症状     | 並列ワークツリーで `pnpm install` 実行時に依存解決が衝突し、shell 環境（`OP_SERVICE_ACCOUNT_TOKEN` / `PATH` キャッシュ）も親タブから漏れて新 worktree を汚染する事象が発生していた          |
| 原因     | `scripts/new-worktree.sh` に lock 機構と shell state リセットが未実装で、同名 branch の並列起動も親シェル状態の遮断もスクリプト側で防止できていなかった                                     |
| 対応     | task-worktree-environment-isolation 本体は docs-only に閉じ、実改修は本未タスクとして切り出した。implementation-guide §2.3 と runbook §4〜§6 でコピペ可能なスニペットを正本化済み           |
| 再発防止 | 「lock 取得 → shell reset → 任意で tmux」の 3 層を `scripts/new-worktree.sh` 内で必ず実行し、EV-4 / EV-5 / EV-7 を CI smoke で取得することで再発を機械的に検出する                           |

### レビュー指摘の原文（該当する場合）

```
task-worktree-environment-isolation Phase 12 unassigned-task-detection.md §1.2 にて、
scripts/new-worktree.sh の実改修（lock + shell reset + tmux opt-in + audit）を
新規タスク `task-new-worktree-script-hardening`（仮）として切り出すことを識別。
受け入れ条件: (a) 後方互換 (b) 同名並列で後発 exit 75 (c) --with-tmux opt-in (d) --audit で symlink インベントリ出力。
```

### 補足事項

本タスクは task-worktree-environment-isolation の docs-only スコープから切り出された実装タスクである。implementation-guide §2.3 のスニペットは「コピペで動く前提」で記述されているため、本タスク側での文言改変は最小限とし、ズレが必要になった場合は implementation-guide 側を別タスクで更新してから本タスクを再実行する運用とする。`~/.tmux.conf` の配布（UT-D）と pre-commit hook（UT-A）は別タスクの責務であり、本タスクのスコープ外とする。
