# Phase 12: ドキュメント更新（Subtask 3b — `e2e-tests.yml` hard gate 化）

| 項目 | 値 |
|------|----|
| 入力 | `phase-11.md` 完了 evidence |
| 出力 | CLAUDE.md「よく使うコマンド」追記 / `docs/00-getting-started-manual/specs/` 該当更新 / Stage 4 backlog 反映 |

---

## 1. CLAUDE.md 更新

### 1.1 対象セクション

`/Users/dm/dev/dev/個人開発/UBM-Hyogo/CLAUDE.md` の **「よく使うコマンド」** セクションに E2E coverage gate 関連コマンドを追記する。

### 1.2 追記内容（差分）

```diff
 mise exec -- pnpm install         # 依存インストール（prepare で lefthook install も自動実行）
 mise exec -- pnpm typecheck       # 型チェック
 mise exec -- pnpm lint            # リント
 mise exec -- pnpm build           # ビルド
 mise exec -- pnpm indexes:rebuild # skill indexes を明示再生成（post-merge 廃止後の正規経路）
 mise exec -- pnpm sync:check      # origin/main・origin/dev とローカル/全 worktree の遅れを通知
+
+# E2E + coverage gate（task-3b）
+mise exec -- pnpm --filter @ubm-hyogo/web e2e --grep @critical-route   # critical-route smoke のみ
+mise exec -- pnpm --filter @ubm-hyogo/web e2e                          # 全件 e2e
+bash scripts/coverage-gate-e2e.sh                                       # E2E line coverage 70% 判定
+# coverage threshold = 70%（source: .claude/skills/task-specification-creator/references/quality-gates.md §7.5）
```

### 1.3 不変条件 §「重要な不変条件」への追記

なし（既存項目に変更なし）。

### 1.4 「Cloudflare 系 CLI 実行ルール」への影響

なし（3b は wrangler / Cloudflare API 不使用）。

---

## 2. `docs/00-getting-started-manual/specs/` 該当更新

### 2.1 影響範囲確認

| ファイル | 影響 | 対応 |
|---------|------|------|
| `00-overview.md` | システム全体概要 — CI 品質保証の説明あり | E2E coverage gate を追記（standard tier line >= 70%） |
| `01-api-schema.md` | API schema | 影響なし |
| `02-auth.md` | 認証設計 | 影響なし |
| `08-free-database.md` | D1 構成 | 影響なし |
| `13-mvp-auth.md` | MVP 認証 | 影響なし |

### 2.2 `00-overview.md` 追記要点

| 追記項目 | 内容 |
|---------|------|
| CI 品質保証の節 | `e2e-tests-coverage-gate` job が PR to dev で起動し、Playwright 全件 + critical-route fail-fast + line coverage >= 70% を判定 |
| 正本参照 | `.claude/skills/task-specification-creator/references/quality-gates.md` §7.5 (standard tier) |
| 関連 workflow / file | `.github/workflows/e2e-tests.yml` / `scripts/coverage-gate-e2e.sh` / `apps/web/playwright.config.ts`（monocart-reporter） |

> 既存 `00-overview.md` に CI 品質保証の節がない場合は追記を見送り、本 phase の更新対象外とする（spec 範囲拡大を避ける）。

---

## 3. Stage 4 backlog への記録（RB-3b-01..RB-3b-04）

### 3.1 対象ファイル

`docs/30-workflows/e2e-quality-uplift/backlog.md`（既存 or 新規。存在しなければ親 phase-12 §5 に従い新規作成）

### 3.2 追記 entry

| ID | 内容 | 優先 |
|----|------|------|
| RB-3b-01 | composite action `setup-project`（pnpm + node + install を 1 step 化） | mid |
| RB-3b-02 | `lighthouse` / `e2e-tests` の build 共有（artifact 受け渡し） | low |
| RB-3b-03 | `paths` filter による docs-only PR の skip 戦略確立 | mid |
| RB-3b-04 | `coverage-gate-e2e.sh` と `coverage-guard.sh` の共通 helper 抽出 | low |

> RB-3b-01..RB-3b-03 は親ワークフロー RB-01..RB-03 と同内容。重複登録を避けるため、既に親 backlog.md に記録済の場合は ID 番号で参照のみ。

---

## 4. LOGS.md 1 行追記（任意）

3b 単体の独立 LOGS.md は作らない。親ワークフロー（`e2e-quality-uplift-stage-3`）の `LOGS.md` に以下 1 行を追記:

```
- 2026-05-09 e2e-quality-uplift-stage-3-impl/3b 完了 — e2e-tests-coverage-gate (line >=70 hard gate / monocart-reporter / critical-route fail-fast)
```

---

## 5. topic-map 更新（任意・親 phase-12 §3 の subset）

3b 関連の topic 追加は親ワークフロー側で集約する。本 spec 単独では topic-map を更新しない（親 phase-12.md §3.2 の `e2e-coverage-gate` / `monocart-reporter` entry に統合）。

---

## 6. 更新コミット粒度

| commit | 内容 |
|--------|------|
| C1 | `CLAUDE.md`「よく使うコマンド」追記 |
| C2 | `docs/00-getting-started-manual/specs/00-overview.md` 該当更新（適用判定後） |
| C3 | `docs/30-workflows/e2e-quality-uplift/backlog.md` に RB-3b-01..RB-3b-04 追記 |
| C4 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/LOGS.md` に 1 行追記（親ワークフロー LOGS） |

---

## 7. 終了基準

| # | 条件 |
|---|------|
| EX-01 | CLAUDE.md「よく使うコマンド」に E2E + coverage gate コマンドが追記されている |
| EX-02 | specs 該当ファイルへの影響判定が完了し、必要時のみ更新されている |
| EX-03 | backlog に RB-3b-01..RB-3b-04 が記載 |
| EX-04 | 親ワークフロー LOGS.md に 3b 完了 1 行が反映 |

---

## 8. 引き継ぎ（Phase 13 へ）

| 項目 | 内容 |
|------|------|
| Phase 13 入力 | 全 phase 完了 + evidence + ドキュメント更新 |
| PR base | `dev` |
| 含む変更 | spec 群 + 実装ファイル + evidence + CLAUDE.md + backlog |

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-3-impl/3b-e2e-tests-hard-gate
- phase: 12
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: spec_created

## 目的

3b 完了に伴う CLAUDE.md「よく使うコマンド」/ specs / backlog 反映を確定し、Phase 13 PR 作成への入力を完備させる。

## 実行タスク

- 親 phase-12.md §1.2 / §2 / §3 から 3b 関連箇所を抽出。
- specs 影響判定を実行。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- 親 docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/phase-12.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 統合テスト連携

- NON_VISUAL phase は Playwright 実行の代替として list smoke、grep gate、typecheck を使用する。
- E2E runtime 実行が必要な項目は outputs/phase-11/evidence に結果を保存する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / scripts / .github 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。
