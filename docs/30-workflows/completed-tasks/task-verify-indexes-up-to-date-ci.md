# verify-indexes-up-to-date CI の新設 - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-verify-indexes-up-to-date-ci |
| タスク名 | verify-indexes-up-to-date CI の新設 |
| 分類 | DevEx / CI |
| 対象機能 | aiworkflow-requirements generated indexes |
| 優先度 | 高 |
| 見積もり規模 | 小規模 |
| ステータス | 未実施 |
| 発見元 | task-git-hooks-lefthook-and-post-merge Phase 12 |
| 発見日 | 2026-04-28 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`post-merge` hook から `.claude/skills/aiworkflow-requirements/indexes/*` の自動再生成を削除した。これにより無関係 PR へ generated diff が混入する問題は解消するが、開発者が `pnpm indexes:rebuild` を忘れた場合に古い index のまま PR が通るリスクが残る。

### 1.2 問題点・課題

- local hook は `--no-verify` や未インストールで回避できる
- generated index の鮮度を authoritative に保証する CI がまだない
- spec sync の手順と実際の index 差分が乖離してもレビューまで発見されない

### 1.3 放置した場合の影響

- `keywords.json` / `topic-map.md` が references とずれた状態で main に入る
- search-spec / topic-map ベースの仕様参照が古い情報を返す
- post-merge 廃止後の品質保証が local 運用に依存し、再発防止として弱い

---

## 2. 何を達成するか（What）

### 2.1 目的

GitHub Actions に `verify-indexes-up-to-date` job を追加し、PR 上で `pnpm indexes:rebuild` 実行後の差分有無を検査する。

### 2.2 最終ゴール

- PR / main push で index drift が自動検出される
- drift がある場合は job が fail し、差分ファイル名をログに出す
- local hook ではなく CI が authoritative gate になる

### 2.3 スコープ

#### 含むもの

- `.github/workflows/verify-indexes.yml` 追加、または既存 CI workflow への job 追加
- `mise exec -- pnpm indexes:rebuild` 実行
- 実行後 `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` で drift 検出
- README / CLAUDE.md への CI gate 名の最小追記（必要な場合）

#### 含まないもの

- post-merge hook の復活
- generated index の仕様変更
- `generate-index.js` 自体のリファクタリング

### 2.4 成果物

- CI workflow 差分
- drift あり / なしの検証ログ
- Phase 12 system spec への CI gate 反映記録

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `package.json` に `indexes:rebuild` が存在する
- Node / pnpm は既存 CI と同じ setup 手順を使う
- `generate-index.js` が CI 上でネットワークなしに実行できる

### 3.2 依存タスク

- `task-git-hooks-lefthook-and-post-merge`

### 3.3 必要な知識

- GitHub Actions workflow
- pnpm / mise の CI setup
- aiworkflow-requirements の generated indexes

### 3.4 推奨アプローチ

既存 CI の Node setup を再利用し、job は小さく独立させる。index drift 検出は `git diff --exit-code` を使い、失敗時に `git status --short` と `git diff --name-only` を出力する。

---

## 4. 実行手順

### Phase構成

1. 既存 CI setup の確認
2. workflow / job 追加
3. drift なし検証
4. 意図的 drift の fail 検証

### Phase 1: 既存 CI setup の確認

#### 目的

Node / pnpm / mise setup の既存パターンを確認する。

#### 手順

1. `.github/workflows/` の既存 workflow を読む
2. pnpm install のキャッシュ方針を確認する
3. `indexes:rebuild` が CI で使えるかローカルで確認する

#### 成果物

採用する setup 手順のメモ

#### 完了条件

既存 CI と矛盾しない setup が決まっている

### Phase 2: workflow / job 追加

#### 目的

index drift を検出する CI job を追加する。

#### 手順

1. `verify-indexes-up-to-date` job を追加
2. `pnpm indexes:rebuild` を実行
3. `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes` を実行

#### 成果物

CI workflow 差分

#### 完了条件

drift がない状態で job が PASS する

### Phase 3: drift なし検証

#### 目的

現在の main 相当で false positive がないことを確認する。

#### 手順

1. ローカルまたは PR 上で job を実行
2. `git status --short` が空であることを確認

#### 成果物

PASS ログ

#### 完了条件

index drift なしで fail しない

### Phase 4: 意図的 drift の fail 検証

#### 目的

index が古い場合に確実に fail することを確認する。

#### 手順

1. references に一時的な差分を作る
2. index を再生成しない状態で job 相当を実行
3. fail ログが差分ファイルを示すことを確認
4. 一時差分を戻す

#### 成果物

fail ログ

#### 完了条件

drift が検出され、原因ファイルが分かる

---

## 6. 検証方法

- `mise exec -- pnpm indexes:rebuild`
- `git diff --exit-code -- .claude/skills/aiworkflow-requirements/indexes`
- GitHub Actions 上の `verify-indexes-up-to-date` job PASS
- 意図的 drift で job FAIL

---

## 5. 完了条件チェックリスト

- [ ] PR で index drift が検出される
- [ ] drift なしの場合に false positive がない
- [ ] fail 時に差分ファイル名がログに出る
- [ ] post-merge hook に index 再生成を戻していない

---

## 8. 参照情報

- `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md`
- `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md`
- `package.json` の `indexes:rebuild`

---

## 7. リスクと対策

- CI setup が重い場合、PR feedback が遅くなる
- generated index の出力順が非決定的な場合、false positive が出る
- references 以外の差分を誤って検出対象に含めるとレビューしづらい

---

## 9. 備考

- `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md`
- `CLAUDE.md`
- 対応タスクの Phase 12 `system-spec-update-summary.md`
