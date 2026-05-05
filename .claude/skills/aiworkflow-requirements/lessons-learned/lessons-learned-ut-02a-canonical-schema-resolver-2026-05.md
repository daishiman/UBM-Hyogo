---
timestamp: 2026-05-01T00:00:00Z
branch: docs/issue-108-ut-02a-response-sections-fields-canonical-schema-task-spec
author: claude-code
type: lessons-learned
---

# Lessons Learned: UT-02A Canonical Section/Field Schema Resolver (2026-05)

UT-02A（`apps/api/src/repository/_shared/builder.ts` の section/field 確定ロジックを `MetadataResolver` + generated static manifest baseline へ集約）で遭遇した苦戦点を記録する。

## 概要

| 項目 | 値 |
| --- | --- |
| ID | L-UT02A |
| タスク | docs/30-workflows/ut-02a-section-field-canonical-schema-resolution/ |
| 期間 | 2026-05 |
| 関連 Issue | #108 |
| 関連 follow-up | docs/30-workflows/unassigned-task/task-ut02a-canonical-metadata-diagnostics-hardening-001.md |
| 主要実装 | `apps/api/src/repository/_shared/{metadata,builder}.ts` / `generated/static-manifest.json` / `packages/shared/src/types/common.ts` / `packages/shared/src/zod/primitives.ts` |

---

## L-UT02A-001: Generated artifact が「暫定正本」として長期残留しやすい

### 症状

`apps/api/src/repository/_shared/generated/static-manifest.json` を canonical schema baseline として採用したが、03a alias queue 側の adapter が確定するまでの「暫定正本」という位置づけが Phase 12 の implementation guide のみに残り、retirement 条件・stale detection 責務がコード側からも index 側からも追えない状態が一時的に発生した。

### 根本原因

generated artifact はビルド済みデータとして扱いやすく「動いているのでそのまま」という慣性が働きやすい。仕様側に retirement 条件を書かないと、後続 PR で「これは何のために存在し、いつ削除されるのか」が読み取れない。

### 解決

- `references/spec-guidelines.md` に「Generated artifact を暫定正本とする workflow の retirement 条件」を guideline 化（採用理由 / 退役条件 / stale detection / diagnostics 経路 / follow-up task の 5 項目を必須記録）
- retirement work を `task-ut02a-canonical-metadata-diagnostics-hardening-001.md` に formalize し、`indexes/resource-map.md` / `quick-reference.md` から参照可能にした
- `MetadataResolver` の `diagnostics` を Phase 11 NON_VISUAL evidence と CI gate へ流す経路を follow-up に明示

### 教訓

generated artifact を採用した時点で「いつ捨てるか」を仕様に書く。書けない場合は採用しない。

---

## L-UT02A-002: ブランチ内に scope 外の大量削除が混入

### 症状

UT-02A canonical resolver の実装ブランチ（`docs/issue-108-...`）に `docs/30-workflows/09a-parallel-staging-deploy-smoke-and-forms-sync-validation/` / `09b-...` / `ut-06b-...` 配下の workflow ディレクトリ削除が大量に staged された状態で同期作業が進んだ。git status の D 行が膨大になり、PR 直前の差分把握コストが跳ね上がった。

### 根本原因

worktree / branch の履歴差分（main 取り込み前後）と current task のスコープが切り分けられていなかった。`spec_created → verified` への昇格ブランチでは、本来 scope に含まれない他 workflow の削除を `git add` 経路に乗せない運用が必要。

### 解決

- PR 前に branch-level audit（`git status` + `git diff --stat` で scope 外 path の D / M を点検）を実施するチェックを CLAUDE.md / spec-guidelines のフォローアップ候補として記録
- 同 wave sync では「current canonical workflow と直接関係する path のみ stage」を原則化（agents 指示にも反映）

### 教訓

worktree 内の差分は task scope と一致しない。PR 直前に scope filter を機械的に通す手順を持つ。

---

## L-UT02A-003: `diagnostics` 出力を Phase 11 evidence / CI に流す経路が未整備

### 症状

`MetadataResolver` は `Result<T, E>` 型と `diagnostics` を emit する設計だが、これを Phase 11 NON_VISUAL evidence ログ / CI gate（drift detection）に流す経路が当初未整備で、resolver 側の品質情報がブランチ外から見えない状態が続いた。

### 根本原因

resolver の interface 設計と evidence 経路設計が分離していた。「diagnostics を吐く」だけでは observability にならず、誰がどこで読むかまで仕様化する必要がある。

### 解決

- follow-up task `task-ut02a-canonical-metadata-diagnostics-hardening-001.md` に「diagnostics → Phase 11 evidence → CI gate」経路の整備を明示
- `references/spec-guidelines.md` の generated artifact retirement ガイドに `diagnostics 経路` を必須項目として追加

### 教訓

diagnostics / Result<T, E> を導入したら、その出力先（evidence file / CI gate / dashboard）を同 wave で仕様化する。

---

## L-UT02A-004: 03a alias queue adapter dryRun 契約テストが未着手（interface 先行定義による drift リスク）

### 症状

UT-02A は canonical resolver を確立し、03a alias queue 側 adapter の interface 接続点を想定したが、03a 側の dryRun 契約テストが未着手のため、interface 先行定義のまま長期化すると adapter 実装時に silent な契約 drift が起きるリスクが残った。

### 根本原因

resolver 側を先に固めた結果、consumer 側（03a alias queue adapter）の契約テストが「次フェーズ」に流れた。Contract First の原則からは consumer 側 dryRun を同一 wave で骨格だけでも置きたい。

### 解決

- follow-up `task-ut02a-canonical-metadata-diagnostics-hardening-001.md` に 03a alias queue adapter dryRun 契約テスト（interface 接続点の dryRun fixture）を必須項目化
- legacy-ordinal-family-register に UT-02A canonical workflow と 03a alias queue の関係を Current Alias Overrides 経由で可視化済み

### 教訓

producer / consumer interface を同 wave で固める場合、consumer 側 dryRun 契約テストも同 wave に骨格を置く。次フェーズに流すと silent drift が必ず発生する。

---

## 関連リソース

- `references/spec-guidelines.md`（Promoted implementation workflow の同期 / Generated artifact retirement 条件）
- `references/task-workflow-active.md`（`ut-02a-section-field-canonical-schema-resolution` 行）
- `references/legacy-ordinal-family-register.md`（UT-02A section/field mapping metadata origin 行）
- `indexes/resource-map.md` / `indexes/quick-reference.md`（UT-02A current canonical set）
- `docs/30-workflows/unassigned-task/task-ut02a-canonical-metadata-diagnostics-hardening-001.md`（retirement / diagnostics / dryRun follow-up）
