# Phase 12: ドキュメント更新（RB-02 Composite setup action）

[実装区分: 実装仕様書]

| 項目 | 値 |
|------|----|
| 入力 | `phase-11.md` 完了 evidence |
| 出力 | 中学生レベル概念説明 / backlog の RB-02 行を `closed (#627)` 更新 / LOGS.md / topic-map / CLAUDE.md 追記候補 |

---

## 1. 中学生レベル概念説明

> Phase 12 必須項目: タスクの本質を中学生にもわかるレベルで説明する。

### 1.1 composite action ってなに？

「composite action（コンポジット アクション）」は、GitHub Actions（自動テスト機）の中で **同じ手順を何度も書くのをやめて、1 つの部品にまとめる仕組み** です。

たとえば、ロボット教室で「電源を入れる」「タイヤをつける」「センサーをつける」という 3 工程を毎回ロボットごとに書くと、ロボット 7 体ぶんで計 21 行になります。これを「初期セットアップキット」という 1 つの箱にまとめておけば、各ロボットでは「初期セットアップキットを使う」と 1 行書くだけで済みます。

### 1.2 なぜ必要？

- 同じ手順をコピペすると、**バージョンを上げるとき 7 箇所全部を直す**必要があり、直し忘れが起きる
- 7 箇所のうち 1 箇所だけ書き方がズレると、CI が不安定になる
- YAML が長くなって読みにくくなる

### 1.3 今回置き換えるもの

GitHub Actions で **必ず最初に行う 3 工程**を 1 つの composite action にまとめます。

| 工程 | 内容 |
|------|------|
| 1. リポジトリを取り出す | `actions/checkout` |
| 2. Node.js を入れる | `actions/setup-node@v4`（Node 24.15.0 を固定）|
| 3. 依存ライブラリを入れる | `pnpm install --frozen-lockfile`（lockfile を厳密に守る）|

これを `.github/actions/setup-project/` という箱にまとめ、7 箇所の workflow から `uses: ./.github/actions/setup-project` の **1 行だけで呼び出せる**ようにします。

### 1.4 どう動く？

```
PR が作られる
   ↓
GitHub Actions が各 workflow を起動
   ↓
各 workflow が「初期セットアップキット」を呼ぶ（1 行）
   ↓
裏で Node / pnpm の準備と依存ライブラリの取り込みが自動展開
   ↓
それぞれの job（typecheck / lint / test / lighthouse / e2e ...）が本来の処理を始める
```

### 1.5 効果

- workflow YAML の合計行数が **70% 以上削減**
- Node / pnpm のバージョン更新は **composite action 1 箇所だけ**直せば OK
- 設定のばらつきがなくなり、CI の信頼性が上がる

---

## 2. backlog 更新（RB-02 closing）

### 2.1 対象ファイル

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/docs/30-workflows/e2e-quality-uplift/backlog.md`

### 2.2 更新内容（差分）

```diff
-| RB-02 | composite action `setup-project` | mid | Stage 4 |
+| RB-02 | composite action `setup-project` | mid | Stage 4 | closed (#627) |
```

> 既存 backlog のカラム数に合わせて末尾カラムを追加するか、`状態` カラムが存在する場合はそちらを `closed (#627)` に更新する。実カラム構造は phase 実行時に確認する。

### 2.3 確認コマンド

```bash
grep -n 'RB-02' docs/30-workflows/e2e-quality-uplift/backlog.md
# 期待: closed (#627) を含む 1 行
```

---

## 3. CLAUDE.md「よく使うコマンド」追記候補

### 3.1 対象ファイル

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/CLAUDE.md`

### 3.2 追記候補（差分）

```diff
 mise exec -- pnpm sync:check      # origin/main・origin/dev とローカル/全 worktree の遅れを通知（git fetch 後の手動チェック）
+
+# composite action / workflow YAML lint
+./actionlint -color .github/workflows/*.yml
+node -e "const fs=require('fs'); const s=fs.readFileSync('.github/actions/setup-project/action.yml','utf8'); if (!s.includes(\"using: 'composite'\")) process.exit(1)"
```

> CLAUDE.md は運用参照ドキュメントなので、composite action の存在を 1 箇所明示するだけに留め、詳細は `.github/actions/setup-project/action.yml` 自身の `description` に書く。

---

## 4. LOGS.md 更新

### 4.1 対象ファイル

| path | 内容 |
|------|------|
| `docs/30-workflows/issue-627-composite-setup-action/LOGS.md`（新規）| 本タスク完了ログ |
| `docs/30-workflows/LOGS.md`（既存）| workflow 群横断ログ。1 行追記 |

### 4.2 `issue-627-composite-setup-action/LOGS.md` 構造

| section | 内容 |
|---------|------|
| Header | `# Issue #627 Composite setup action LOGS` / 完了日 / PR URL |
| 1. 完了サマリ | `.github/actions/setup-project/action.yml` 新規 / 7 workflow job 置換 |
| 2. 行数削減実測 | `outputs/phase-11/evidence/setup-lines-delta.md` の合計表を転載（before / after / 削減率）|
| 3. actionlint 結果 | violation 0 |
| 4. branch protection drift | diff 0（before/after snapshot 参照）|
| 5. 残課題 | RB-05 候補（mise と setup-node 統一） |

### 4.3 `30-workflows/LOGS.md` への 1 行追記

```
- 2026-05-XX issue-627-composite-setup-action 完了 — .github/actions/setup-project/action.yml 新規 + 7 workflow job の setup 重複を 1 行 uses に集約。setup 行数 -68 行 / 83% 削減。branch protection drift なし。
```

---

## 5. topic-map 更新

### 5.1 対象ファイル

`.claude/skills/aiworkflow-requirements/indexes/topic-map.json`（または `topic-map.md`）。

### 5.2 追記 entry

| topic | references |
|-------|-----------|
| `composite-action` | `.github/actions/setup-project/action.yml`, `docs/30-workflows/issue-627-composite-setup-action/index.md` |
| `ci-setup-dedup` | `docs/30-workflows/issue-627-composite-setup-action/phase-11.md` (setup-lines-delta.md) |

### 5.3 indexes 再生成

```bash
mise exec -- pnpm indexes:rebuild
```

CI gate `verify-indexes-up-to-date`（`.github/workflows/verify-indexes.yml`）が pass することを確認。

---

## 6. spec 該当箇所

| path | 内容 |
|------|------|
| `docs/00-getting-started-manual/specs/00-overview.md` | 影響なし（CI infra のみ）|
| `docs/00-getting-started-manual/claude-code-config.md` | 影響なし |

> 本タスクは CI infra 改修のため、user-facing spec の更新は不要。LOGS.md に詳細を残す。

---

## 7. 更新コミット粒度

| commit | 内容 |
|--------|------|
| C1 | `docs/30-workflows/issue-627-composite-setup-action/LOGS.md` 新規 + `docs/30-workflows/LOGS.md` 1 行追記 |
| C2 | `.claude/skills/aiworkflow-requirements/indexes/topic-map.*` 更新 + `pnpm indexes:rebuild` 反映分 |
| C3 | `docs/30-workflows/e2e-quality-uplift/backlog.md` の RB-02 行を `closed (#627)` 更新 |
| C4 | `CLAUDE.md`「よく使うコマンド」に actionlint 1 行追記 |

---

## 8. 終了基準

| # | 条件 |
|---|------|
| EX-01 | 中学生レベル概念説明（§1）が記述済 |
| EX-02 | backlog の RB-02 行が `closed (#627)` に更新 |
| EX-03 | LOGS.md 2 ファイルが更新済 |
| EX-04 | topic-map に 2 entry 追加 + `verify-indexes-up-to-date` pass |
| EX-05 | CLAUDE.md に actionlint 1 行追記 |

---

## 9. 引き継ぎ（Phase 13 へ）

| 項目 | 内容 |
|------|------|
| Phase 13 入力 | 全 phase 完了 + evidence + ドキュメント更新 |
| PR base | `dev` |
| 含む変更 | `.github/actions/setup-project/action.yml` 新規 + 7 workflow 置換 + spec 群 + evidence + LOGS.md + topic-map + backlog + CLAUDE.md |

---

## DoD（Phase 12 完了条件・strict 7 files）

| # | 項目 | 状態 |
|---|------|------|
| D-01 | `outputs/phase-12/main.md` | 仕様記述済 |
| D-02 | `outputs/phase-12/implementation-guide.md` | 仕様記述済 |
| D-03 | `outputs/phase-12/system-spec-update-summary.md` | 仕様記述済 |
| D-04 | `outputs/phase-12/documentation-changelog.md` | 仕様記述済 |
| D-05 | `outputs/phase-12/unassigned-task-detection.md` | 仕様記述済 |
| D-06 | `outputs/phase-12/skill-feedback-report.md` | 仕様記述済 |
| D-07 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | 仕様記述済 |

---

## Template Compliance Appendix

## メタ情報

- workflow: issue-627-composite-setup-action
- phase: 12
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: implemented_local_runtime_pending

## 目的

composite action 導入完了に伴うドキュメント更新を 7 項目（中学生説明 / backlog closing / CLAUDE.md / LOGS / topic-map / spec / コミット粒度）で確定する。

## 実行タスク

- 中学生レベル説明を §1 に書く。
- backlog の RB-02 行を `closed (#627)` に更新。
- CLAUDE.md に actionlint 1 行追記。
- LOGS.md 2 ファイル / topic-map / コミット粒度を確定。

## 参照資料

- docs/30-workflows/issue-627-composite-setup-action/index.md
- phase-11.md（本サブタスク内）
- docs/30-workflows/e2e-quality-uplift/backlog.md

## 実行手順

1. 中学生説明を §1 に作成。
2. backlog の RB-02 行を closing 更新。
3. LOGS.md 2 ファイル更新。
4. topic-map に 2 entry 追加し indexes:rebuild。
5. CLAUDE.md に 1 行追記。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。

## 成果物

- 本 phase markdown
- LOGS.md / topic-map / backlog / CLAUDE.md 差分

## 完了条件

- [x] 仕様記述済: 必須 7 項目（D-01..D-07）が網羅。
- [x] 仕様記述済: coverage AC 適用: standard tier lines >= 70%（本タスクは NON_VISUAL）。
- [x] 仕様記述済: 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] 仕様記述済: phase 本文のタスクを棚卸しした。
- [x] 仕様記述済: 未実行項目を PASS として扱っていない。
