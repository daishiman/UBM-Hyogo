# scripts/cf.sh CI 経路ドキュメント補強（op skip 条件明示） - タスク指示書

## メタ情報

```yaml
issue_number: 661
task_id: ci-secret-alignment-followup-001-cf-sh-ci-path-doc
task_name: scripts/cf.sh CI 経路ドキュメント補強（op skip 条件明示）
category: ドキュメント補強
target_feature: scripts/cf.sh CI 経路契約
priority: 中
scale: 小規模
status: 未実施
source_phase: docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md（In-scope 未充足項目）
created_date: 2026-05-10
dependencies: []
taskType: docs-only
visualEvidence: NON_VISUAL
```

| 項目 | 内容 |
| --- | --- |
| タスクID | `ci-secret-alignment-followup-001-cf-sh-ci-path-doc` |
| タスク名 | scripts/cf.sh CI 経路ドキュメント補強（op skip 条件明示） |
| 分類 | ドキュメント補強 |
| 対象機能 | `scripts/cf.sh` の CI 経路契約（`CF_SH_SKIP_WITH_ENV=1` env passthrough） |
| 優先度 | 中 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md`（In-scope 未充足項目） |
| 発見日 | 2026-05-10 |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |
| dependencies | なし |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`scripts/cf.sh` は冒頭の `CF_SH_SKIP_WITH_ENV=1` 分岐で、env `CLOUDFLARE_API_TOKEN` が既に存在する場合に `op`（1Password CLI）の呼び出しを skip する。CI（GitHub Actions）はこの分岐に乗ることを前提に動作する一方で、その契約が **`scripts/cf.sh` のコード内コメント**にも、**`docs/00-getting-started-manual/`** にも、**`CLAUDE.md`** にも明示的に書かれていない。

中学生向けの説明をすると、`cf.sh` は「ローカルでは金庫（1Password）から鍵を取り出して使い、CI では既にポケットに入っている鍵をそのまま使う」という二経路の動きをしている。しかしポケット経由の経路がドキュメントに書かれていないため、後から `cf.sh` を読む人は「金庫の鍵が見つからないとエラー」と誤解しやすい。

### 1.2 問題点・課題

PR #648 マージ後に発生した `web-cd / deploy-staging` 失敗（`[cf.sh] 1Password CLI (op) が見つかりません`）は、workflow 側 secret 名 drift が直接原因だが、`cf.sh` の env-passthrough 契約が暗黙だったため、AI エージェントを含む後続オペレーターが drift を即座に検知できなかった。`docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md` の In-scope に文書化が明記されているが、task-01 / task-02 のいずれの実装にも未反映で、`git diff dev..HEAD -- scripts/ docs/00-getting-started-manual/` が空である。

### 1.3 放置した場合の影響

`cf.sh` ロジックを将来編集する人物が `CF_SH_SKIP_WITH_ENV` 分岐を「ローカル限定の最適化」と誤認して削除すると、CI の Cloudflare 系ジョブ全体が `op` 不在で停止する。同種の secret 名 drift が再発した際にも、契約の所在が暗黙であるため初動の原因切り分けに時間を要する。

---

## 2. 何を達成するか（What）

### 2.1 目的

`scripts/cf.sh` の env passthrough 契約（CI 経路では `op` を呼ばない）を、コード冒頭コメントとプロジェクト正本ドキュメント（`CLAUDE.md`）に明文化し、後続オペレーターおよび AI エージェントが drift / 契約変更を即座に検知できる状態にする。

### 2.2 最終ゴール

- `scripts/cf.sh` 冒頭に CI 経路契約コメントが存在する。
- `CLAUDE.md` の Cloudflare 系 CLI 実行ルール末尾に同契約段落が存在する。
- 必要に応じて `docs/00-getting-started-manual/` 配下の Cloudflare デプロイ doc に同契約への参照が追記されている。

### 2.3 スコープ

#### 含むもの

- `scripts/cf.sh` 冒頭コメント（5-10 行）の追記。
- `CLAUDE.md` の `### Cloudflare 系 CLI 実行ルール` セクション末尾への 1 段落追加。
- `docs/00-getting-started-manual/` 配下に Cloudflare CLI / デプロイ doc が存在する場合、そこへの参照追記の要否判断と、必要なら追記。

#### 含まないもの

- `scripts/cf.sh` の挙動変更（分岐ロジック・条件式の修正）。
- API token / OAuth token などの実値の記述。
- workflow 側 secret 名 alignment（task-01 で完了済み範囲）の再実装。
- commit / push / PR 作成（Phase 13 はユーザー承認ゲート）。

### 2.4 成果物

- `scripts/cf.sh`（冒頭コメント追加）
- `CLAUDE.md`（Cloudflare 系 CLI 実行ルール末尾段落追加）
- 必要に応じて `docs/00-getting-started-manual/` 配下のデプロイ doc

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `scripts/cf.sh` の現行 `CF_SH_SKIP_WITH_ENV=1` 分岐ロジックが維持されていること。
- `CLAUDE.md` の `### Cloudflare 系 CLI 実行ルール` セクションが存在すること。
- task-01（workflow 側 secret 名 `CLOUDFLARE_API_TOKEN` への整合）がマージ済みであること。

### 3.2 依存タスク

- 親 workflow: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/`
- 関連 evidence: `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/phase-1.md` §症状

### 3.3 必要な知識

- Bash スクリプト冒頭コメント記述慣行（shebang 直後の意図ブロック）。
- `CLAUDE.md` の Markdown 構成および表・段落の文体。
- 1Password CLI (`op run --env-file=.env`) と env passthrough の二経路設計。

### 3.4 推奨アプローチ

1. `scripts/cf.sh` の現行冒頭部分を読み、shebang 直後で `set -euo pipefail` 等の前後どこにコメントを挿入するか確定する。
2. CI 経路契約コメントを 5-10 行で記述する（実値は書かない）。
3. `CLAUDE.md` の `### Cloudflare 系 CLI 実行ルール` セクション末尾に 1 段落追記する。
4. `docs/00-getting-started-manual/` 配下を `grep -l "cf.sh\\|wrangler\\|Cloudflare" docs/00-getting-started-manual/` 等で確認し、該当 doc が存在し、かつ追記が後続運用上有効と判断される場合のみ追記する。

---

## 4. 実行手順

### Phase構成

1. Phase 1: 現状確認とコメント挿入位置確定
2. Phase 2: `scripts/cf.sh` 冒頭コメント追記
3. Phase 3: `CLAUDE.md` セクション末尾段落追記
4. Phase 4: `docs/00-getting-started-manual/` 追記要否判断と適用

### Phase 1: 現状確認とコメント挿入位置確定

#### 目的

既存コメント・契約記述の有無を確認し、追記の重複を避ける。

#### 手順

1. `scripts/cf.sh` の冒頭 30 行を読み、`CF_SH_SKIP_WITH_ENV` 分岐の位置と既存コメントを確認する。
2. `CLAUDE.md` の `### Cloudflare 系 CLI 実行ルール` セクション全文を読む。
3. `docs/00-getting-started-manual/` を `grep` で走査し、Cloudflare CLI / デプロイ doc の有無を確認する。

#### 成果物

- 既存記述の有無メモ（追記すべき箇所と、すでに記述済みの箇所の整理）。

#### 完了条件

- 追記対象 3 箇所（cf.sh / CLAUDE.md / 00-getting-started-manual）の現状が把握できている。

### Phase 2: `scripts/cf.sh` 冒頭コメント追記

#### 目的

`CF_SH_SKIP_WITH_ENV=1` 分岐の CI 経路契約を 5-10 行のコメントとして明文化する。

#### 手順

1. shebang と既存初期化処理の間にコメントブロックを挿入する。
2. CI 経路（GitHub Actions）では env `CLOUDFLARE_API_TOKEN` が既に注入される前提で `op` を skip すること、ローカル経路では `op run --env-file=.env` 経由で動的注入されることを記述する。
3. 実値（token / vault path 等）は書かず、契約と参照先（`CLAUDE.md`）のみ示す。

#### 成果物

- `scripts/cf.sh` 冒頭コメントブロック（5-10 行）。

#### 完了条件

- コメントが 5-10 行に収まっている。
- 実値が含まれていない。
- `CF_SH_SKIP_WITH_ENV=1` という変数名が明記されている。

### Phase 3: `CLAUDE.md` セクション末尾段落追記

#### 目的

プロジェクト正本に CI 経路契約を 1 段落として固定する。

#### 手順

1. `### Cloudflare 系 CLI 実行ルード` セクション末尾に「CI 経路では `op` を呼ばない」契約を 1 段落で追記する。
2. 段落は `cf.sh` の env passthrough 分岐（`CF_SH_SKIP_WITH_ENV=1`）と紐づけ、`scripts/cf.sh` の冒頭コメントを参照する。
3. 実値・token 名の値は書かない。

#### 成果物

- `CLAUDE.md` 末尾段落 1 段落。

#### 完了条件

- 段落が `### Cloudflare 系 CLI 実行ルール` セクション末尾に存在する。
- 既存の禁止事項リスト（`wrangler login` 禁止等）と矛盾しない。

### Phase 4: `docs/00-getting-started-manual/` 追記要否判断と適用

#### 目的

00-getting-started-manual に該当 doc がある場合、`CLAUDE.md` への参照を追記する。

#### 手順

1. `grep -rl "cf.sh\\|Cloudflare CLI\\|wrangler" docs/00-getting-started-manual/` を実行する。
2. 該当 doc が存在する場合、そこへ `CLAUDE.md` の Cloudflare 系 CLI 実行ルール参照を 1-2 行で追記する。
3. 該当 doc が存在しない場合は新規作成せず、Phase 4 を skip し、その旨を成果物メモに残す。

#### 成果物

- 該当 doc への参照行追加、または skip 判断のメモ。

#### 完了条件

- 追記または skip のいずれかが明示的に決定されている。

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `scripts/cf.sh` 冒頭に CI 経路契約コメント（5-10 行）が存在する。
- [ ] `CLAUDE.md` の `### Cloudflare 系 CLI 実行ルール` セクション末尾に契約段落が追記されている。
- [ ] `docs/00-getting-started-manual/` への追記要否が明示的に判断されている。

### 品質要件

- [ ] 実値（API token / OAuth token / vault path 値）が記述されていない。
- [ ] `CF_SH_SKIP_WITH_ENV=1` という env 変数名がコメントと段落の双方で明記されている。
- [ ] `scripts/cf.sh` の挙動（分岐ロジック）が変更されていない。

### ドキュメント要件

- [ ] `cf.sh` 冒頭コメントから `CLAUDE.md` のセクションへの参照が辿れる。
- [ ] `CLAUDE.md` の段落から `scripts/cf.sh` の該当分岐への参照が辿れる。

---

## 6. 検証方法

### テストケース

- `scripts/cf.sh` を編集後に `bash -n scripts/cf.sh` で構文エラーが発生しないこと。
- `bash scripts/cf.sh whoami` をローカル（op 経路）で実行し、従来通り動作すること。
- CI 経路の挙動は workflow 実行時に env `CLOUDFLARE_API_TOKEN` が注入された状態で `op` 呼び出しを skip すること（既存の task-01 alignment で担保済み）。

### 検証手順

```bash
bash -n scripts/cf.sh
grep -n "CF_SH_SKIP_WITH_ENV" scripts/cf.sh
grep -n "CF_SH_SKIP_WITH_ENV" CLAUDE.md
grep -rl "cf.sh" docs/00-getting-started-manual/ || echo "no cf.sh references in 00-getting-started-manual"
```

期待: `scripts/cf.sh` と `CLAUDE.md` の双方に `CF_SH_SKIP_WITH_ENV` への明示的参照があり、`bash -n` が exit 0 を返す。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| --- | --- | --- | --- |
| コメント追記時に分岐ロジックを誤って変更し CI が停止する | 高 | 低 | 編集対象は shebang 直後のコメント領域のみに限定し、`bash -n` と `grep` で挙動非変更を確認する |
| 実値（token 等）を誤って記述する | 高 | 低 | コメント・段落とも env 変数名のみ記述し、値は書かない方針を Phase 2/3 完了条件に明記する |
| `CLAUDE.md` の段落と `cf.sh` コメントが drift する | 中 | 中 | 双方から相互参照を張り、将来編集時に同時更新を促す |
| 00-getting-started-manual への追記が過剰となり情報重複が発生する | 低 | 中 | 該当 doc が存在しない場合は新規作成せず skip する |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md`（In-scope 未充足項目）
- `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/phase-1.md`
- `CLAUDE.md` の `### Cloudflare 系 CLI 実行ルール` セクション
- `scripts/cf.sh`（`CF_SH_SKIP_WITH_ENV=1` 分岐）

### 参考資料

- 1Password CLI `op run --env-file=.env` の env passthrough 仕様
- GitHub Actions Secrets injection と env 変数 propagation

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| --- | --- |
| 症状 | `web-cd / deploy-staging` が `[cf.sh] 1Password CLI (op) が見つかりません` で停止し、原因特定に時間を要した |
| 原因 | `cf.sh` の `CF_SH_SKIP_WITH_ENV=1` 分岐（env passthrough 契約）が暗黙で、ワークフロー側 secret 名 drift で env が空文字 → op fallback に進んだ |
| 対応 | task-01 で workflow 側 secret 名を `CLOUDFLARE_API_TOKEN` に整合させたが、`cf.sh` 自体の契約は文書化されないまま残った |
| 再発防止 | 本タスクで `cf.sh` 冒頭コメント + `CLAUDE.md` に env passthrough 契約を明示する |
| 参照 | `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/task-01-web-cd-secret-name-alignment/phase-1.md` §症状 |

### レビュー指摘の原文（該当する場合）

該当なし。`docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/index.md` の In-scope 未充足検出から formalize した。

### 補足事項

Phase 13 の commit / push / PR はユーザー承認ゲートであり、本タスクの作成時点では実行しない。実値（token / vault path 値）は本タスクの全成果物において記述しない。
