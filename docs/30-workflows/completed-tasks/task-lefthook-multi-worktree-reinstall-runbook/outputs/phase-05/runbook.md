# Phase 5 成果物: lefthook 一括再インストール runbook（最終化版）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 30+ worktree への lefthook 一括再インストール runbook 運用化 |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-28 |
| 出力ファイル | `outputs/phase-05/runbook.md`（本ファイル） |
| タスク分類 | docs-only / runbook-spec |
| 整合参照 | `lefthook.yml` / `scripts/new-worktree.sh` / `doc/00-getting-started-manual/lefthook-operations.md` |
| 派生元 | `outputs/phase-02/runbook-design.md` |
| MINOR 吸収 | M-01 (ISO8601 UTC) / M-02 (rebuild 二度目失敗時の警告文面) / M-03 (commit 行為不発生ガード) |

---

## 1. 重要な注意事項（冒頭ガード）

本 runbook の実行前に、以下 5 項目を必ず確認すること。違反は「lefthook 採用前提の崩壊」と
「pnpm store 破損」の二大事故を直接的に引き起こす。

1. **並列禁止（pnpm store 競合）**
   - `xargs -P` / GNU `parallel` / バックグラウンド `&` は **禁止**。
   - 根拠: pnpm の content-addressable store（`~/.pnpm-store`）は複数プロセスからの
     同時書き込みを安全に処理しない。複数 worktree で並列に `pnpm install` を走らせると
     store の整合性が壊れ、最悪 `pnpm store prune` + 全 worktree 再 install が必要になる。
   - 既存ガイド（`doc/00-getting-started-manual/lefthook-operations.md`）も同方針を明記している。
2. **コミット行為の不発生（M-03 吸収）**
   - 本 runbook は `pnpm install`（`prepare` script 経由で `lefthook install` が走る）と
     `pnpm exec lefthook version` のみを実行する。
   - `git commit` / `git push` / `git checkout <branch>` を **一切発生させない**。
   - detached HEAD worktree でも HEAD 状態を変更せず、作業ツリーへの commit も生成しない。
   - 旧 hook の自動削除も行わない（ADR-03）。
3. **冪等性**
   - `pnpm install --prefer-offline` / `lefthook install` / `pnpm rebuild lefthook` はすべて
     冪等。途中中断後の再実行も安全。
   - ログのみ非冪等（実行ごとに新行追記）。
4. **実行ラッパ**
   - 全コマンドに `mise exec --` を前置する。Node 24 / pnpm 10 を保証するため。
5. **`wrangler` 直接実行禁止（ポリシー継承）**
   - 本 runbook は Cloudflare CLI を呼ばないが、CLAUDE.md の「Cloudflare 系 CLI 実行ルール」
     に倣い、Cloudflare 系操作は `scripts/cf.sh` 経由のみとするポリシーを継承する。

---

## 2. 前提

| 前提 | 内容 |
| --- | --- |
| ホスト | macOS (Darwin) / Apple Silicon を主対象。Intel Mac / Linux はベストエフォート |
| Node 環境 | `mise install` 完了済み（Node 24.15.0 / pnpm 10.33.2） |
| 作業 cwd | リポジトリ root（main worktree でも feature worktree でも可） |
| `lefthook.yml` | 正本が repo root に存在。`min_version: 1.6.0` 以上を満たす lefthook が install されること |
| ログファイル | `outputs/phase-11/manual-smoke-log.md` が事前作成済み（ヘッダ行のみ） |
| 権限 | `git worktree list` の実行権限と各 worktree への読み書き権限 |

---

## 3. ログ書式（M-01 吸収: ISO8601 UTC）

`outputs/phase-11/manual-smoke-log.md` に下記表形式で追記する。
**実行日時カラムは UTC・ISO8601（`YYYY-MM-DDTHH:MMZ`）固定**。

### 3.1 ヘッダ + 1 行例

```markdown
| 実行日時 (ISO8601 UTC) | worktree path | install result | lefthook version | hook hygiene | 備考 |
| --- | --- | --- | --- | --- | --- |
| 2026-04-28T10:00Z | /Users/dm/dev/.../UBM-Hyogo | PASS | 1.10.10 | OK | - |
```

### 3.2 カラム値域

| カラム | 値域 | 説明 |
| --- | --- | --- |
| 実行日時 (ISO8601 UTC) | `YYYY-MM-DDTHH:MMZ` | `date -u +%Y-%m-%dT%H:%MZ` で生成。タイムゾーンは UTC 固定 |
| worktree path | 絶対パス | `git worktree list --porcelain` から取得（prunable 除外後） |
| install result | `PASS` / `FAIL` / `SKIP_NOT_FOUND` | `pnpm install --prefer-offline` の exit code に対応 |
| lefthook version | semver | `pnpm exec lefthook version` の最終行。失敗時は `-` |
| hook hygiene | `OK` / `STALE` / `ABSENT` | `.git/hooks/post-merge` の sentinel 判定 |
| 備考 | 任意 | `rebuilt` / `WARN: lefthook unavailable after rebuild` 等 |

### 3.3 サマリー行書式

全件処理後、ログ末尾に以下を 1 行で追記する。

```markdown
<!-- summary: run=2026-04-28T10:30Z total=32 pass=30 fail=0 skip=1 stale=1 -->
```

---

## 4. 実行手順（人間向け）

1. リポジトリ root に `cd` する（`git rev-parse --show-toplevel` で確認）。
2. `outputs/phase-11/manual-smoke-log.md` のヘッダ行が存在することを確認する
   （無ければ §3.1 の書式通り作成）。
3. `git worktree list --porcelain` を実行し、prunable を含む全 worktree を目視確認する。
4. §5 の擬似実装に従って **逐次** ループを実行する（並列禁止）。
5. 全 worktree 完了後、ログ末尾に §3.3 のサマリー行を追記する。
6. `hygiene = STALE` の worktree があれば、`.git/hooks/post-merge` を手動確認し、
   `lefthook-operations.md` のトラブルシュート節を参照して削除可否を判断する
   （runbook は **自動削除しない**: ADR-03）。
7. `version = -`（FAIL）の worktree があれば、warning（§5 内 M-02）の指示通り
   `lefthook-operations.md` のトラブルシュート節に従って手動復旧する。

---

## 5. 擬似実装（最終版・コードは生成しない）

> 本タスクは docs-only / runbook-spec のため、`scripts/reinstall-lefthook-all-worktrees.sh`
> は生成しない。別 Wave でコード化する際は、本擬似実装と **100% 整合** させること。
> Phase 2 の擬似スクリプトとの差分は、M-01（ISO8601 表記）/ M-02（警告文面）/
> M-03（冒頭ガード文）の 3 点のみで、フロー・分岐・出力カラムは Phase 2 と同一。

```bash
#!/usr/bin/env bash
# scripts/reinstall-lefthook-all-worktrees.sh （仕様。本タスクでは実装しない）
# 並列禁止: pnpm store の同時書き込み破壊を回避するため、必ず逐次で回す。
set -uo pipefail

LOG="${LOG:-outputs/phase-11/manual-smoke-log.md}"
TODAY="$(date -u +%Y-%m-%dT%H:%MZ)"   # M-01: ISO8601 UTC
REPO_ROOT="$(git rev-parse --show-toplevel)"

git -C "$REPO_ROOT" worktree list --porcelain |
  awk 'BEGIN{path=""}
       /^worktree /{path=$2}
       /^prunable/{path=""}            # prunable レコードは除外
       /^$/{if(path) print path; path=""}
       END{if(path) print path}' |
  while read -r wt; do
    # M-03: HEAD 状態を変更せず、commit / checkout / push を一切発生させない
    if [ ! -d "$wt" ]; then
      printf "| %s | %s | SKIP_NOT_FOUND | - | - | - |\n" "$TODAY" "$wt" >> "$LOG"
      continue
    fi
    pushd "$wt" >/dev/null || continue

    # ---- (1) install ----
    # prepare script 経由で lefthook install も同時に走る
    if mise exec -- pnpm install --prefer-offline >/dev/null 2>&1; then
      install_status="PASS"
    else
      install_status="FAIL"
    fi

    # ---- (2) lefthook version 検証（Apple Silicon mismatch 対策の rebuild retry 込み）----
    if mise exec -- pnpm exec lefthook version >/dev/null 2>&1; then
      version="$(mise exec -- pnpm exec lefthook version 2>/dev/null | tail -n1)"
      version_status="OK"
    else
      mise exec -- pnpm rebuild lefthook >/dev/null 2>&1 || true
      if mise exec -- pnpm exec lefthook version >/dev/null 2>&1; then
        version="$(mise exec -- pnpm exec lefthook version 2>/dev/null | tail -n1)"
        version_status="OK_AFTER_REBUILD"
      else
        version="-"
        version_status="FAIL"
        # M-02: 二度目失敗時の警告文面を確定（stderr に出力）
        printf "WARN: lefthook unavailable after rebuild at %s; this worktree will skip pre-commit hooks until manual recovery (see lefthook-operations.md troubleshooting).\n" "$wt" >&2
      fi
    fi

    # ---- (3) hook hygiene（旧 .git/hooks/post-merge 残存点検）----
    if [ ! -f .git/hooks/post-merge ]; then
      hygiene="ABSENT"
    elif head -n1 .git/hooks/post-merge 2>/dev/null | grep -q "LEFTHOOK"; then
      hygiene="OK"
    else
      hygiene="STALE"
    fi

    # ---- (4) 備考列の決定 ----
    if [ "$version_status" = "OK_AFTER_REBUILD" ]; then
      note="rebuilt"
    elif [ "$version_status" = "FAIL" ]; then
      note="WARN: lefthook unavailable after rebuild"
    else
      note="-"
    fi

    # ---- (5) ログ追記 ----
    printf "| %s | %s | %s | %s | %s | %s |\n" \
      "$TODAY" "$wt" "$install_status" "$version" "$hygiene" "$note" >> "$LOG"

    popd >/dev/null
  done
```

### 5.1 分岐一覧（Phase 6 の異常系トレース用）

| 分岐 | install_status | version_status | hygiene | 備考 | 対処 |
| --- | --- | --- | --- | --- | --- |
| 正常系 | PASS | OK | OK | - | 不要 |
| 初回 hook 配置 | PASS | OK | ABSENT→OK | - | `lefthook install` が hook を配置 |
| Apple Silicon retry 成功 | PASS | OK_AFTER_REBUILD | OK | rebuilt | 不要（自動復帰） |
| rebuild 後も失敗 | PASS | FAIL | * | WARN: lefthook unavailable after rebuild | `lefthook-operations.md` トラブルシュート参照 |
| install 失敗 | FAIL | (実行せず) | (判定せず) | - | network / disk / lockfile を個別調査 |
| ディレクトリ消失 | SKIP_NOT_FOUND | - | - | - | `git worktree prune` 候補 |
| 旧 hook 残存 | PASS | OK | STALE | - | 手動で `.git/hooks/post-merge` 確認・削除判断 |

---

## 6. 実行例（単 worktree dry-run）

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo
mise exec -- pnpm install --prefer-offline
mise exec -- pnpm exec lefthook version
# stdout 例: 1.10.10
```

ログ追記例:

```markdown
| 2026-04-28T10:00Z | /Users/dm/dev/dev/個人開発/UBM-Hyogo | PASS | 1.10.10 | OK | - |
```

実行例（rebuild 経路）:

```bash
cd /Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260428-170623-wt-6
mise exec -- pnpm install --prefer-offline
mise exec -- pnpm exec lefthook version || mise exec -- pnpm rebuild lefthook
mise exec -- pnpm exec lefthook version
```

ログ追記例:

```markdown
| 2026-04-28T10:03Z | /Users/dm/dev/.../wt-6 | PASS | 1.10.10 | OK | rebuilt |
```

実行例（rebuild 後も FAIL）:

```text
WARN: lefthook unavailable after rebuild at /Users/dm/dev/.../wt-X; this worktree will skip pre-commit hooks until manual recovery (see lefthook-operations.md troubleshooting).
```

ログ追記例:

```markdown
| 2026-04-28T10:05Z | /Users/dm/dev/.../wt-X | PASS | - | ABSENT | WARN: lefthook unavailable after rebuild |
```

---

## 7. 冪等性・失敗復帰

### 7.1 冪等性

| 操作 | 冪等性 | 根拠 |
| --- | --- | --- |
| `pnpm install --prefer-offline` | 冪等 | 同一 lockfile に対する 2 回目以降は no-op に近い |
| `lefthook install` | 冪等 | 公式仕様。`.git/hooks/*` を sentinel 込みで上書き |
| `pnpm rebuild lefthook` | 冪等 | バイナリ再 build。複数回実行で破綻なし |
| ログ追記 | 非冪等（意図的） | 実行ごとの履歴を残す。重複行はタイムスタンプで区別 |

runbook 全体の再実行は無害（ログには新行が追加されるのみ）。

### 7.2 失敗復帰戦略

| 失敗種別 | 自動 retry | 復帰経路 |
| --- | --- | --- |
| install FAIL | なし | 該当 worktree で個別調査（network / disk full / lockfile 競合等） |
| version FAIL（1 回目） | あり: `pnpm rebuild lefthook` | 自動 retry 後に再判定 |
| version FAIL（2 回目） | なし | ログに `version=-` / 備考に WARN 文面を残し継続。手動 `pnpm rebuild` + `lefthook install` で復帰 |
| hygiene STALE | なし | runbook 末尾の warning を見て手動削除判断（ADR-03） |
| `git worktree list` 失敗 | なし | fatal。runbook 中断（リポジトリ破損相当） |
| SKIP_NOT_FOUND 多数 | なし | `git worktree prune` を別途実行 |

### 7.3 部分再実行ポリシー

- ログから `install_status=FAIL` または `version=-` の行を抽出し、該当 worktree のみで
  手動再実行する。
- runbook 全体の再実行は安全だが、30+ worktree 分の `pnpm install` 時間コストを考慮し、
  個別復旧を優先する。

---

## 8. 責務境界（new-worktree.sh と本 runbook / AC-7）

| 経路 | 担当 | 責務 | 対象集合 |
| --- | --- | --- | --- |
| **新規 worktree 作成** | `scripts/new-worktree.sh` | `git worktree add` 直後に `mise exec -- pnpm install` と `mise exec -- pnpm exec lefthook install` を自動実行する | これから作る 1 worktree |
| **既存 worktree 群への遡及** | 本 runbook（擬似仕様 `scripts/reinstall-lefthook-all-worktrees.sh`） | 既存の prunable 以外の全 worktree を逐次再 install + `lefthook version` 検証 + `.git/hooks/post-merge` hygiene チェック + ログ追記 | 既存の有効 worktree 全件 |
| **CI ドリフト検出** | `task-verify-indexes-up-to-date-ci`（unassigned） | hook が動かなかった結果としての indexes 未鮮度を CI で検出 | PR 上の差分 |
| **単発 hook 配置** | `mise exec -- pnpm exec lefthook install` を手動実行 | 個別 worktree でユーザーが緊急に hook を入れ直す経路 | 任意の 1 worktree |

### 責務の排他性

- `scripts/new-worktree.sh` は **これから作る** worktree が対象（作成完了後にループから抜ける）。
- 本 runbook は **既に存在する** worktree が対象（`git worktree list --porcelain` で列挙）。
- 両者は **対象集合が時間軸で排他**（新規作成の瞬間 vs 既存の遡及）であるため重複しない。
- `scripts/new-worktree.sh` で作成された worktree も、その後の lefthook 更新時には
  本 runbook の対象に組み込まれる（重複ではなく **責務の連続**）。

### 既存スクリプト・設定との整合

- `scripts/new-worktree.sh` の L31-L32 が `mise exec -- pnpm install` →
  `mise exec -- pnpm exec lefthook install` の順で呼んでいるため、
  本 runbook の擬似実装も同一順序を採用する（`pnpm install` の `prepare` script 経由で
  `lefthook install` が走る挙動に依存）。
- `lefthook.yml` の `min_version: 1.6.0` を本 runbook の `lefthook version` 確認で
  暗黙に検証する（`pnpm exec lefthook version` が semver を返せば版数 OK 相当）。
- `doc/00-getting-started-manual/lefthook-operations.md` の「初回セットアップ / 既存 worktree
  への適用」セクション直後に、本 runbook へのリンクを 1 行追加する（Phase 2 §10 の差分仕様）。

---

## 9. AC トレース（本 Phase の責務範囲）

| AC | 本 runbook 内の根拠箇所 |
| --- | --- |
| AC-1（prunable 除外抽出手順） | §5 擬似実装の `awk` ブロック（`/^prunable/{path=""}`） |
| AC-2（逐次 install + 並列禁止理由） | §1-1 / §5 擬似実装の `while read -r wt` |
| AC-3（`lefthook version` 検証） | §5 擬似実装 (2) ブロック |
| AC-4（`.git/hooks/post-merge` hygiene 点検） | §5 擬似実装 (3) ブロック |
| AC-5（ログ書式定義） | §3.1 / §3.2 / §3.3 |
| AC-6（lefthook-operations.md 差分仕様） | Phase 2 §10 を本 runbook §8 末尾に明示参照 |
| AC-7（new-worktree.sh との責務境界） | §8 全体 |

---

## 10. 完了条件（本 Phase 5）

- [x] 重要な注意事項 5 項目が冒頭にある（§1）
- [x] M-01（ISO8601 UTC）が §3 / §5 / §6 に反映されている
- [x] M-02（rebuild 後 FAIL の警告文面）が §5 / §6 / §7.2 に反映されている
- [x] M-03（commit 行為の不発生ガード）が §1-2 / §5 コメントに反映されている
- [x] 擬似実装が Phase 2 と整合している（フロー・分岐・出力カラムが同一）
- [x] `scripts/reinstall-lefthook-all-worktrees.sh` のコードファイルは生成していない
- [x] ログ書式・サマリー行書式が確定している（§3）
- [x] new-worktree.sh との責務境界が明記されている（§8 / AC-7）
- [x] 並列禁止理由（pnpm store 競合）が明記されている（§1-1 / §5 コメント）

---

## 11. Phase 6 への引き渡し

- §5.1 の分岐表（PASS / FAIL / OK_AFTER_REBUILD / STALE / ABSENT / SKIP_NOT_FOUND）に対応する
  異常系ケースを Phase 6 で列挙する。
- 警告文面（M-02）の発火条件を Phase 6 の「`lefthook version` 失敗」ケースに紐づける。
- detached HEAD ガード（M-03）を Phase 6 の「detached HEAD」ケースで再点検する。
- prunable 除外の awk ロジックを Phase 6 の「prunable worktree」ケースで境界値テストする。
