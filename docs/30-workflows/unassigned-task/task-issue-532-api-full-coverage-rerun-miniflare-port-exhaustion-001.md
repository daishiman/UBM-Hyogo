# Issue #532 API full coverage rerun / Miniflare port exhaustion triage - タスク指示書

## メタ情報

```yaml
issue_number: 577
```


## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | task-issue-532-api-full-coverage-rerun-miniflare-port-exhaustion-001 |
| タスク名     | Issue #532 API full coverage rerun / Miniflare port exhaustion triage |
| 分類         | 改善 |
| 対象機能     | `@ubm-hyogo/api` Vitest coverage / Miniflare D1 test execution |
| 優先度       | 中 |
| 見積もり規模 | 小規模 |
| ステータス   | 未実施 |
| GitHub Issue | #577 |
| 発見元       | Issue #532 Phase 11 / Phase 12 evidence review |
| 発見日       | 2026-05-08 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

Issue #532 では write/tag/note provider への ctx 注入パターン展開を実装し、typecheck、lint、focused changed-path tests、direct import grep gate は PASS した。一方で、`mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` は broad concurrent D1/Miniflare test run 中に `undici fetch failed / EADDRNOTAVAIL` 系のローカル port exhaustion で NOT PASS となった。

### 1.2 問題点・課題

Phase 12 では full coverage 未完了を「実装漏れではなく verification evidence debt」と境界記録しているが、PR 前に再実行または切り分け結果を残さないと、Issue #532 の provider refactor が API 全体 coverage gate に与える影響を客観証跡で確認できない。

### 1.3 放置した場合の影響

- Issue #532 の PR で broad API coverage の未確認状態が残る
- Miniflare D1 test の並列実行限界が再発しても、再現条件・回避策が共有されない
- focused tests は PASS しているのに full coverage だけ失敗する状況を、実装回帰と環境枯渇のどちらとして扱うべきか判断しづらくなる

---

## 2. 何を達成するか（What）

### 2.1 目的

`@ubm-hyogo/api` full coverage を再実行し、PASS するか、Miniflare port exhaustion の再現条件と暫定回避策を Phase 11 / PR 前 evidence として固定する。

### 2.2 最終ゴール

- `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` の PASS evidence が取得されている
- もし再度 port exhaustion が発生する場合、並列度制御や test shard 分割などの再現抑制策が検証され、次アクションが明記されている
- Issue #532 workflow の Phase 11/12 evidence と PR 説明で、full coverage の扱いが矛盾しない

### 2.3 スコープ

#### 含むもの

- `@ubm-hyogo/api` full coverage の再実行
- Miniflare / undici `EADDRNOTAVAIL` が再発した場合の切り分け
- 必要に応じた Vitest 並列度・shard 実行・D1 test grouping の一時回避策検証
- evidence log の保存と Issue #532 Phase 11/12 参照の追記

#### 含まないもの

- Issue #532 の provider 実装変更
- D1 schema 変更
- production deploy
- commit / push / PR 作成
- coverage 閾値そのものの変更

### 2.4 成果物

- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/evidence/full-coverage-rerun.log`
- 必要に応じて `outputs/phase-11/evidence/full-coverage-triage.md`
- Issue #532 workflow の Phase 11 / Phase 12 追記差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- Issue #532 の実装差分が worktree に残っている
- `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` と focused tests が PASS 済み
- ローカルで Miniflare D1 test を実行できる状態である

### 3.2 依存タスク

- 親: `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/`
- 関連: Issue #532 closed boundary。PR 文脈は `Refs #532` を使う

### 3.3 必要な知識

- Vitest の並列実行設定
- Miniflare / Workers D1 test のローカル実行特性
- 既存 `scripts/coverage-guard.sh` と `@ubm-hyogo/api` package scripts の使い分け

### 3.4 推奨アプローチ

まず通常の full coverage を再実行する。再発しなければ PASS log を保存して完了する。再発した場合は、実装回帰の assertion failure とローカル resource exhaustion を分離するため、並列度制御または test file grouping を試し、再現条件と暫定運用を evidence に残す。

---

## 4. 実行手順

### Phase 1: Baseline rerun

#### 目的

通常の full coverage が現在のローカル状態で通るか確認する。

#### 手順

1. `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` を実行する
2. stdout/stderr を `full-coverage-rerun.log` に保存する
3. PASS / NOT PASS と失敗種別を記録する

#### 成果物

- `full-coverage-rerun.log`

#### 完了条件

- exit code と主要エラーが evidence に残っている

### Phase 2: Port exhaustion triage

#### 目的

`EADDRNOTAVAIL` が再発した場合に、実装回帰ではなく実行環境・並列度問題であるかを切り分ける。

#### 手順

1. Vitest の並列度制御オプションまたは test grouping を確認する
2. D1/Miniflare heavy test を少数グループで再実行する
3. assertion failure が出るか、port exhaustion のみ再発するかを記録する

#### 成果物

- `full-coverage-triage.md`

#### 完了条件

- 再発条件と暫定回避策が明記されている

### Phase 3: Evidence sync

#### 目的

Issue #532 workflow の Phase 11/12 evidence と PR 前説明を同期する。

#### 手順

1. Phase 11 evidence table に full coverage rerun 結果を追記する
2. Phase 12 implementation guide の Verification Summary を必要に応じて更新する
3. PR 説明で `Refs #532` と coverage 状態を矛盾なく記載できる状態にする

#### 成果物

- Phase 11 / Phase 12 追記差分

#### 完了条件

- Issue #532 workflow の evidence 記述が最新状態と一致している

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `@ubm-hyogo/api` full coverage rerun の結果が記録されている
- [ ] `EADDRNOTAVAIL` 再発時は、実装回帰との切り分け結果が記録されている
- [ ] Issue #532 の provider 実装スコープには追加変更を混ぜていない

### 品質要件

- [ ] typecheck / lint / focused tests の既存 PASS evidence と矛盾していない
- [ ] coverage 閾値を下げていない
- [ ] Miniflare port exhaustion の回避策が再現可能なコマンドで記述されている

### ドキュメント要件

- [ ] Phase 11 evidence に rerun log が追加されている
- [ ] Phase 12 summary または implementation guide に rerun 結果が反映されている
- [ ] PR 文脈は `Refs #532` を維持し、Issue #532 を reopen しない

---

## 6. 検証方法

### テストケース

- 通常 full coverage rerun
- port exhaustion 再発時の分割または並列度制御 rerun

### 検証手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
```

期待: exit 0。失敗時は assertion failure と `EADDRNOTAVAIL` / `undici fetch failed` を分離して記録する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
```

期待: Issue #532 の既存 PASS 状態を維持する。

---

## 7. リスクと対策

| リスク | 影響度 | 発生確率 | 対策 |
| ------ | ------ | -------- | ---- |
| Miniflare D1 tests が再度 port exhaustion で落ちる | 中 | 中 | 並列度制御または test grouping で再実行し、環境枯渇と実装回帰を分離する |
| full coverage triage のつもりで provider 実装を追加変更してしまう | 中 | 低 | 本タスクでは coverage evidence と実行基盤切り分けに限定し、実装変更は別タスクに分離する |
| coverage 閾値を下げて PASS 扱いにする | 高 | 低 | 閾値変更は禁止し、失敗時は NOT PASS evidence と次アクションを残す |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/evidence/coverage-guard.log`
- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-11/main.md`
- `docs/30-workflows/completed-tasks/issue-532-extend-ctx-injection-to-write-tag-note-providers/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`

### 参考資料

- `scripts/coverage-guard.sh`
- `apps/api/package.json`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目 | 内容 |
| ---- | ---- |
| 症状 | `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` が broad concurrent D1/Miniflare run 中に `undici fetch failed / EADDRNOTAVAIL` port exhaustion で NOT PASS になった |
| 原因 | focused changed-path tests は PASS しており、provider 実装の assertion failure ではなく、Miniflare D1 test の広範囲並列実行によるローカル port/resource 枯渇の可能性が高い |
| 対応 | Issue #532 Phase 11/12 では NOT PASS 境界を記録し、typecheck/lint/focused tests/grep gates を PASS evidence として残した |
| 再発防止 | full coverage rerun と、再発時の並列度制御・test grouping の切り分けを PR 前 evidence として formalize する |

### レビュー指摘の原文（該当する場合）

```text
Full coverage was attempted but broad concurrent Miniflare D1 tests hit local port exhaustion.
Full coverage should be rerun before PR if the local Miniflare port exhaustion condition clears.
```

### 補足事項

このタスクは Issue #532 の実装漏れではなく、PR 前の検証証跡 debt を扱う。Issue #532 自体は CLOSED 維持で、後続 PR は `Refs #532` を使う。
