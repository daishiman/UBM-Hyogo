# Implementation Guide — task-issue-577-followup-002

## Part 1: 中学生レベル概念説明

### 何が起きていたの？

私たちのテスト（自動チェック）は、複数の作業員（worker）で同時に走らせると速いです。でも、Issue #577 で「同時に走らせすぎると、ネットワークの口（port）が足りなくなってエラー（`EADDRNOTAVAIL`）」が起きました。とりあえず「作業員 1 人だけで順番に走らせる（`--maxWorkers=1`）」設定にして、エラーを止めました。

でも作業員 1 人だと遅いです。本当は、テスト道具（Miniflare、undici、workerd という 3 つのライブラリ）の作り手が「port を使い回す改善」をしてくれたら、また作業員を 2 人・4 人に戻して速くできるはずです。

### このタスクは何をするの？

なぜ必要かというと、今の `--maxWorkers=1` は安全ですが遅く、上流改善が入っても誰も見直さなければ遅い設定が残り続けるからです。
たとえば、工事中の道が直ったのに通行止め看板を外し忘れると、みんな遠回りを続けます。このタスクは「道が直ったか確認し、直っていれば看板を外せるか試す」ための仕様です。

1. 月に 1 回、3 つのライブラリの「お知らせ（release notes）」を見に行く
2. 「socket」「port」「keep-alive」などのキーワードで改善が入っていないか調べる
3. 改善が入っていたら、本当に作業員 2 人・4 人に戻せるか実際にテストする（連続 3 回成功 + エラー 0 件で OK）
4. テストが OK なら設定を更新、ダメなら今のまま（作業員 1 人）を維持

### 大事なルール

- **今回のサイクルで結論を出す**：「来月見ます」と先送りしない（CONST_007）
- **1 回だけ成功でも採用しない**：3 回連続で完璧でないと採用しない
- **データベース（D1）には触らない**：今回いじるのは設定ファイル 1 行だけ

---

## Part 2: 技術者レベル詳細

### 実装区分

**実装仕様書（条件付き）**。改善検知時のみ `apps/api/package.json#scripts.test:coverage` を編集。改善なし時はドキュメント更新のみ（package.json 未変更）。

### 対象 repo / キーワード / 頻度

| 項目 | 値 |
| --- | --- |
| 追跡 repo | `cloudflare/workers-sdk` / `nodejs/undici` / `cloudflare/workerd` |
| キーワード | `socket`, `EADDRNOTAVAIL`, `keep-alive`, `agent pool`, `port`, `TIME_WAIT` |
| 頻度 | 月次 + Miniflare メジャー更新 |

### A/B 採用条件

- 連続 3 回 vitest 実行で **133/133 PASS** かつ **0 EADDRNOTAVAIL**
- coverage 数値が baseline を下回らない
- 試行順序: `--maxWorkers=2 → 4 → auto`、green を満たした最大値を採用

### 実行コマンド

```bash
# release 取得
gh api repos/cloudflare/workers-sdk/releases --paginate \
  -q '.[0:10] | .[] | {tag: .tag_name, body: .body}' \
  > outputs/phase-11/evidence/workers-sdk-releases.json
# undici / workerd も同様

# triage grep
grep -iE "socket|EADDRNOTAVAIL|keep-?alive|agent pool|\\bport\\b|TIME_WAIT" \
  outputs/phase-11/evidence/*-releases.json

# A/B 実行
for N in 2 4 auto; do
  for R in 1 2 3; do
    mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage --maxWorkers=$N \
      2>&1 | tee outputs/phase-11/evidence/ab-$N-run-$R.log
    sleep 5
  done
done
```

### package.json 編集案（A/B 採用時のみ）

現状（`apps/api/package.json`）:
```json
"test:coverage": "vitest run --coverage --maxWorkers=1 --minWorkers=1",
```

採用時の編集:
```diff
- "test:coverage": "vitest run --coverage --maxWorkers=1 --minWorkers=1",
+ "test:coverage": "vitest run --coverage --maxWorkers=<採用N>",
```

`<採用N>` は `2` / `4` / `auto` のいずれか。採用時は `--minWorkers` を削除し、`--maxWorkers=<採用N>` だけを正本とする。

### TypeScript / API シグネチャ

本タスクは API / TypeScript 関数を追加しないため、アプリケーションコードのシグネチャ変更は N/A。変更可能な契約は package script 文字列だけ。

```ts
type WorkerCapCandidate = 1 | 2 | 4 | "auto";
type AdoptionEvidence = {
  candidate: Exclude<WorkerCapCandidate, 1>;
  consecutiveRuns: 3;
  passedTests: 133;
  eaddrnotavailCount: 0;
  coverageNotRegressed: true;
};
```

### evidence layout

```
outputs/phase-11/evidence/
├── workers-sdk-releases.json
├── undici-releases.json
├── workerd-releases.json
├── triage-grep-raw.log
├── triage-table.md                   # 必須
├── pkg-unchanged.log                 # 改善なし時
├── ab-{2,4,auto}-run-{1,2,3}.log     # 改善あり時
├── ab-summary.md                     # 改善あり時
├── secret-hygiene-grep.log
└── apps-api-untouched.log
```

### 不変条件 trace

| 不変条件 | 検証 |
| --- | --- |
| #5 D1 直接アクセス禁止 | package.json scripts のみ編集対象（D1 binding 不変） |
| CONST_002 | Phase 13 で user 明示承認後のみ PR 作成 |
| CONST_007 先送り禁止 | 改善検知時は今回サイクルで A/B 完了 |
| aiworkflow-requirements | Cloudflare runtime / Workers binding 仕様不変 |

### 異常系対処

| 異常 | 対処 |
| --- | --- |
| A/B flaky | 該当 N 即不採用 |
| Miniflare major breaking | rollback + triage 記録 |
| macOS↔Linux 差分 | 両環境 green 確認まで不採用 |
| gh api rate limit | GH_TOKEN 経由再実行 |
| secret log 混入 | 削除 + rotate |

### 完了条件（DoD）

- 改善なし: triage-table.md + pkg-unchanged.log + hygiene + untouched
- 改善あり: 上記 + ab-{N}-run-* + ab-summary.md + （採用時のみ）package.json 編集
- Issue #616 CLOSED 維持（reopen 禁止）

---

## Part 3: 本サイクル実行結果（2026-05-11）

### triage 結果サマリ

| repo | 直近 15 件の主な hit | 改善判定 |
| --- | --- | --- |
| `cloudflare/workers-sdk` | Miniflare `TZ=UTC` default / hosted images mock variant names / dependabot bumps（`miniflare@4.20260507.0`〜`4.20260507.1`, `wrangler@4.89.x`〜`4.90.0`） | **なし** — socket pool / port reuse / keep-alive 関連変更 0 件 |
| `nodejs/undici` | WebSocket / WebSocketStream / http2 websocket 系 fix、`refactor(h1): track HEAD keep-alive override as boolean`（内部 refactor のみ）（`v6.25.0`〜`v8.2.0`） | **なし** — Agent pool / connection reuse / EADDRNOTAVAIL / TIME_WAIT に対応する fix なし |
| `cloudflare/workerd` | `[build] Improve test parallelism through custom resource for socket tests`（workerd 内部 test infra）/ `fix: populate localAddress on connect handler Socket`（`v1.20260507.1`〜`v1.20260511.1`） | **なし** — Miniflare 経由 outbound socket の port reuse セマンティクスに影響しない |

### 結論

- **改善なし → `apps/api/package.json#test:coverage` の `--maxWorkers=1 --minWorkers=1` を維持。A/B 実験は本サイクルでは実施しない（AC-3 適用、AC-4 は本サイクル不適用）。**
- `git status --porcelain apps/api/` / `git diff --stat HEAD -- apps/api/` ともに空（evidence: `pkg-unchanged.log` / `apps-api-untouched.log`）。
- secret hygiene grep 0 件（`secret-hygiene-grep.log` exit=1 = no match）。
- 次回起点 tag: `miniflare@4.20260507.1` / `undici v8.2.0` / `workerd v1.20260511.1`。次トリガは月次再走 or Miniflare メジャー更新。

### 本サイクル DoD 充足

- [x] AC-1: 追跡 repo / キーワード / 頻度を Phase 02 で固定
- [x] AC-2: 3 repo の release を `gh api` で取得し triage-table.md に記録
- [x] AC-3: 改善なし結論を明示、`apps/api/package.json` 未変更を `git status` / `git diff --stat` evidence で保存
- [-] AC-4: 改善なしのため A/B 実行 N/A
- [x] AC-5: secret hygiene grep 0 件確認
