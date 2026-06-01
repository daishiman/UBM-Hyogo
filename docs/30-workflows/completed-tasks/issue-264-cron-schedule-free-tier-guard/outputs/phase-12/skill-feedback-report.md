# Phase 12 — skill feedback report（skill-feedback-report）

> 対象 skill: `task-specification-creator` / `aiworkflow-requirements`
> 「苦戦なし」とは主張しない。本タスクで実際に判断に時間を要した点を具体的に記録する。

## 困難点 1: CLOSED issue の obsolete 前提を最新コードで再スコープする判定

- issue #264 は CLOSED かつ本文が「Sheets→D1 cron を 6h/1h/5min で 24h staging 実測」だったが、
  最新コードを当たると **(a) Sheets→Forms 移行済 / (b) `0 */6` 未デプロイ / (c) Sheets hourly 手動限定撤回 /
  (d) 3-cron 確定済み** と、原 issue の AC が軒並み陳腐化していた。
- 困難だったのは「CLOSED の issue を再オープンせずに、どこまでを obsolete と断じ、どこを残課題として再定義するか」の
  線引き。`wrangler.toml:14/91/173` の実値・`deployment-cloudflare.md:85-89,269` の根拠・`index.ts` scheduled handler の
  ジョブ対応を突合し、「間隔決定は obsolete だが、その間隔を守る**回帰ガードの不在**が真の残課題」という再スコープ核を
  抽出するのに調査を要した。
- **skill への要望**: task-specification-creator に「CLOSED / obsolete 前提 issue を最新コードへ再スコープする際の
  obsolete 判定マトリクス（原前提 × 現行コード × 出典 × 判定）」を patterns として明示テンプレ化すると、
  毎回の線引きが定型化できる。本 WF の index.md / main.md の obsolete 判定表がその雛形になる。

## 困難点 2: docs 寄りに見えるタスクにコード成果物を見出し実装仕様書化（CONST_004 適用）

- 初見では「cron 間隔の ADR / 予算文書」という docs 中心タスクに見えたが、ADR / 予算だけでは
  **4 本目混入や legacy 再登録を検知できず再発防止にならない**。CONST_004（docs に見えてもコード成果物を見出す）を
  適用し、`wrangler-cron-schedule.guard.spec.ts` という**実行可能な回帰ガード**をコード成果物として定義し、
  実装区分を NON_VISUAL の実装仕様書に確定した。
- 困難だったのは「ADR / 予算（解析的に確定で十分）」と「コード成果物（再発防止に必須）」の役割分担の整理。
  24h 実測を supersede しつつ、enforcement はテストで担保する、という二段構えの正当化に判断を要した。
- **skill への要望**: aiworkflow-requirements / task-specification-creator に「文書だけでは再発防止にならないタスクは
  guard test 等のコード成果物で enforcement 化する」判定基準（解析で結論が出る ⇒ 実測不要 / ただし drift 防止は test 必須）を
  明示すると、同種の「文書 vs テスト」判断が定型化できる。

## 困難点 3: free-tier 制約（zero-dep regex 抽出）で実装手段を縛った点

- free-tier 方針（依存追加 0）のため、TOML パーサライブラリを使えず、`extractCrons` を **regex + Node 標準 fs のみ**で
  実装する制約を課した。困難だったのはエッジケースの洗い出し: section 不在 → `[]` / クォート除去（`"`/`'`） /
  行コメント除外 / 複数行配列 / 末尾コメント。これらを「TOML を厳密パースせずに安全に cron だけ抜く」範囲で
  成立させる正規表現方針の設計に時間を要した。
- 特に「セクション境界を次の `\n[` で切る」「`crons\s*=\s*\[([^\]]*)\]` で改行込みキャプチャ」の 2 点は、
  TOML 一般構文ではなく **cron 式に `#` や `]` が出現しない**という対象特性に依存して安全性を担保しており、
  この前提を implementation-guide に明記する必要があった。
- **skill への要望**: free-tier zero-dep 制約下で「設定ファイルから特定キーだけ regex 抽出する純粋関数」の
  エッジケース定型（section 不在 → 空 / クォート除去 / コメント除去 / 複数行）を references に小さなレシピとして
  置くと、同種の guard test 作成が高速化する。

## まとめ

3 点いずれも「定型がなく毎回判断を要した」箇所であり、obsolete 再スコープ判定・文書 vs テストの enforcement 判定・
zero-dep regex 抽出のエッジケース定型を skill 側に明示テンプレ化すれば、再現性とスピードが上がる。

## same-wave routing

| Feedback | Routing | 状態 |
| --- | --- | --- |
| implementation target 明確時に spec-only close しない | 既存 `task-specification-creator/references/phase12-skill-feedback-promotion.md` の Implementation Target Physical Existence Gate / Spec-from-closed-issue implementation closeout rule で吸収 | no-op（既存 rule 適用済み） |
| cron free-tier current facts と enforcement の同期 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` に guard test back-link と legacy manual-only 境界を反映 | promoted |
| workflow state / inventory / quick lookup | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`, `indexes/quick-reference.md`, `indexes/resource-map.md`, `references/workflow-issue-264-cron-schedule-free-tier-guard-artifact-inventory.md`, `changelog/20260531-issue-264-cron-schedule-free-tier-guard.md` | promoted |
