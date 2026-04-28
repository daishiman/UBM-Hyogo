---
timestamp: 2026-04-28T17:01:31Z
branch: feat/issue-130-skill-ledger-a2-fragment-task-spec
author: claude-code
type: lessons-learned
---

# A-2 fragment 化（Changesets パターン）移行で苦戦した点

本ファイルは skill ledger（LOGS / SKILL-changelog / lessons-learned）を 1 entry = 1 file の fragment 化（Changesets パターン）に移行するタスクで遭遇した3つの主要な苦戦点を記録する。

スキル: `aiworkflow-requirements`
タスク仕様: `docs/30-workflows/completed-tasks/task-conflict-prevention-skill-state-redesign/A-2/`
PR/Branch: `feat/issue-130-skill-ledger-a2-fragment-task-spec`

---

## L-SLR-A2-010: 旧 lessons-learned との並走移行（74個 _legacy 保持と canonical 切替宣言不足の混乱）

### 状況

`references/lessons-learned-*.md` が 74 ファイル存在し、これらを `lessons-learned/_legacy-*.md` に rename 退避すると同時に、新規 fragment は `lessons-learned/<timestamp>-<escapedBranch>-<nonce>.md` 形式で `lessons-learned/` 直下に書く設計だった。
旧ファイルを削除せず保持したまま canonical を切り替えるため、reader 側が「どこを正本として読むべきか」を判断できる必要があった。

### 困った点

- `_legacy-*.md` が 74 ファイル積まれた状態で、新規 fragment と同じディレクトリに同居するため、render CLI / 人間 reader の両方が「legacy も含めて render すべきか」を判断できなかった
- `resource-map.md` / `quick-reference.md` 上で「canonical = fragment」「`_legacy*` = 履歴参照のみ」を明示していなかったため、SKILL.md 経由で aiworkflow-requirements を呼び出した consumer が古い `references/lessons-learned-*.md` 経路を引用し続ける事故が複数発生
- `references/` ディレクトリには他の reference docs も残っているため、ディレクトリ単位で「全部 legacy」と宣言できず、prefix ベース（`lessons-learned-` 始まり）で個別退避する必要があった

### 対処

- `_legacy` prefix を物理 path 規約に昇格させ、render CLI 側で `_legacy` 始まりは集約対象から除外するルールを実装
- canonical 切替宣言を `indexes/resource-map.md` の「skill ledger」ブロックと `indexes/quick-reference.md` の skill-ledger 早見表に追加（旧 path → 新 path 対応の3行を明示）
- `references/legacy-ordinal-family-register.md` の Current Alias Overrides に 2026-04-28 entry を 3 系統（LOGS / changelog / lessons-learned）追加し、旧 citation からの逆引きを可能にした

### 再発防止

- ledger 系ファイルの fragment 化を行うときは、**rename 完了 + canonical 切替宣言 + 逆引き register 追記** をワンセットで実施（PR 単位で3つ揃わない場合は merge を保留）
- `_legacy` prefix を render CLI の除外規約として固定し、新規 fragment 命名規則に `_legacy` を絶対に使わないよう lint 化候補に挙げる
- canonical 切替時は SKILL.md / resource-map / quick-reference の3点同期を必須とする（topic-map は本タスクでは触らないが、別タスクで同期予定）

---

## L-SLR-A2-011: fragment naming nonce 衝突回避（escapedBranch truncation 規約）

### 状況

fragment ファイル命名は `<YYYYMMDD-HHMMSS>-<escapedBranch>-<nonce>.md` 規約。
`escapedBranch` はブランチ名の `/` を `_` に置換したものを使用するが、ブランチ名が長くなりがち（本タスクの `feat/issue-130-skill-ledger-a2-fragment-task-spec` は 50 文字超）で、ファイル名長が OS / FS の上限に近づくケースが発生した。

### 困った点

- escapedBranch を truncation せずに使うとファイル名が 100 文字を超え、一部 FS（特に encrypted 領域 / iCloud 同期領域）で path length error が発生
- 4 worktree 並列実行時、同一 branch の同一秒に複数 fragment が append されると nonce のみで衝突回避する必要があるが、escapedBranch の truncation 桁数が writer 間で不一致だと「同じ意図の名前」が 2 種類生まれて diff が読みにくくなった
- nonce のみに頼ると衝突確率が無視できず、`scripts/lib/retry-on-collision.ts` でリトライ実装が必要だった

### 対処

- `scripts/lib/branch-escape.ts` に escapedBranch の生成ルール（`/` → `_`、長さ truncation 桁数の固定値）を集約。writer / reader / test すべてがこの 1 関数を経由するよう統一
- truncation は「先頭 N 文字保持 + tail nonce で識別」方式を採用（先頭側に意味のあるブランチ prefix を残す）
- nonce 衝突時は `scripts/lib/retry-on-collision.ts` で nonce のみ再生成（timestamp / escapedBranch は固定）。retry 上限を設けて無限ループを防止

### 再発防止

- escapedBranch / timestamp / nonce の生成は **必ず `scripts/lib/` の専用 lib 経由**で行う。writer のインライン実装を禁止
- 新しい writer を追加する場合は `scripts/lib/branch-escape.ts` / `scripts/lib/timestamp.ts` / `scripts/lib/retry-on-collision.ts` の3点を import すること（lint で import チェックを将来追加候補）
- truncation 桁数を変更する場合は migration plan を別タスク化（既存 fragment の rename を伴うため）

---

## L-SLR-A2-012: writer 経路ガード CI 検出の誤検出（doc 文字列除外設計）

### 状況

fragment 書き込みを `scripts/skill-logs-append.ts` に一本化するため、CI で「writer 経路以外から `LOGS/` `changelog/` `lessons-learned/` に書き込もうとしている箇所」を検出する writer 経路ガードを設けた。
具体的には、コードベース全体を grep して `LOGS/` / `changelog/` / `lessons-learned/` に対する fs.writeFile / fs.appendFile 等の呼び出しを検出する。

### 困った点

- ドキュメント / lessons-learned fragment 自身 / SKILL.md 内に「`lessons-learned/<fragment>.md` に書く」「`pnpm skill:logs:append` で `LOGS/` に追記」等の説明文字列が大量にあり、これらが false positive として検出された
- 単純な path 文字列マッチでは、実装コードと説明テキストを区別できず、CI が常に red になった
- 一方で「説明文字列をすべて除外」してしまうと、本物の writer 違反（テストや scripts 内の手書き append）を見逃すリスクがあった

### 対処

- writer 経路ガードを「コード AST レベル」で実装し、実際の `fs.writeFile` / `fs.appendFile` / `fs.writeFileSync` 等の呼び出しのみを検出対象にする方式に変更（doc 内の path 文字列は AST に出てこないため自然に除外される）
- どうしても string レベルで検出が必要な箇所では、検出対象を `.ts` / `.js` ファイルに限定し、`.md` / `_legacy*.md` / `lessons-learned/` 配下を除外 path として明示
- writer 経路ガード自体を test ファイル化し、誤検出が再発した際に test fixture で再現できるようにした

### 再発防止

- writer 経路ガード CI を実装するときは **AST レベル検出を第一選択**にする（string match は false positive を生みやすい）
- 説明テキストとコードを区別する必要があるガードはすべて拡張子 / path filter を必須要件とする
- ガード追加 PR には必ず「false positive 試験」を test として同梱する（実装コード以外で path 文字列が出てくるケースをテスト fixture に用意）
