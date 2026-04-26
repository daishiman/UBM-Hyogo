# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-runtime-foundation |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-23 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR作成) |
| 状態 | completed |

## 目的

モノレポとランタイム基盤 における Phase 12 の判断と成果物を固定し、下流 Phase の手戻りを防ぐ。

## 実行タスク

- input / output を確定する
- 正本仕様との整合を確認する
- 4条件と downstream 影響を確認する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-overview-core.md | apps/web / apps/api |
| 必須 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | dependency rule |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-core.md | Node / pnpm / Next.js |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-frontend.md | Next.js / Tailwind |
| 必須 | .claude/skills/aiworkflow-requirements/references/technology-backend.md | Workers / D1 / backend stack |

## 実行手順

### ステップ 1: input と前提の確認
- 上流 Phase と index.md を読む。
- 正本仕様との差分を先に洗い出す。

### ステップ 2: Phase 成果物の作成
- 本 Phase の主成果物と必須6成果物を outputs/phase-12/ に作成・更新する。
- downstream task から参照される path を具体化する。
- `outputs/phase-02/version-policy.md` を根拠に、正本仕様の Step 2 domain sync 要否を確定する。

### ステップ 3: 4条件と handoff の確認
- 価値性 / 実現性 / 整合性 / 運用性を再確認する。
- 次 Phase に渡す blocker と open question を記録する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | 本 Phase の出力を入力として使用 |
| Phase 7 | AC トレースに使用 |
| Phase 10 | gate 判定の根拠 |
| Phase 12 | close-out と spec sync 判断 |

## 多角的チェック観点（AIが判断）

- 価値性: 誰のどのコストを下げるか明確か。
- 実現性: 初回無料運用スコープで成立するか。
- 整合性: branch / env / runtime / data / secret が一致するか。
- 運用性: rollback / handoff / same-wave sync が可能か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | input 確認 | 12 | completed | upstream を読む |
| 2 | 成果物更新 | 12 | completed | outputs/phase-12/main.md |
| 3 | 4条件確認 | 12 | completed | next phase へ handoff |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 の主成果物 |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1/2 の実装ガイド |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1-A〜1-C と Step 2 domain sync の結果 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 変更履歴と artifact parity |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 0件でも必須の未タスク検出 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須のskill feedback |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | 最終準拠チェック |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

- [ ] 主成果物が作成済み
- [ ] 正本仕様参照が残っている
- [ ] downstream handoff が明記されている

## タスク100%実行確認【必須】

- 全実行タスクが completed
- 全成果物が指定パスに配置済み
- 全完了条件にチェック
- 異常系（権限・無料枠・drift）も検証済み
- 次 Phase への引き継ぎ事項を記述
- artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 13 (PR作成)
- 引き継ぎ事項: モノレポとランタイム基盤 の判断を次 Phase で再利用する。
- ブロック条件: 本 Phase の主成果物が未作成なら次 Phase に進まない。

## Part 1 中学生レベル概念説明 (例え話)
なぜ必要か: 開発で使う道具の置き場所や役割が人によって違うと、同じ作業をしているつもりでも別々のものを直してしまう。

たとえば学校の文化祭で、受付係、会計係、案内係がそれぞれ別のノートを正しい名簿だと思っていると、参加者の数も集金状況もずれてしまう。このタスクでは、Web画面、API、共通部品、外部連携の役割を1冊の決まり表にそろえる。

何をするか: Node / pnpm / Next.js / React / TypeScript の採用バージョン、apps/web と apps/api の境界、Cloudflare 上で動かす入口を文書として固定し、古い正本仕様に残る記述を同じ wave で更新する。

## Part 2 技術者レベル詳細

### TypeScript contract

```ts
export interface RuntimeFoundationPolicy {
  node: "24.x";
  pnpm: "10.x";
  next: "16.x";
  react: "19.2.x";
  typescript: "6.x";
  webRuntime: "@opennextjs/cloudflare";
  apiRuntime: "hono-workers";
  packageScopes: ["apps/web", "apps/api", "packages/shared", "packages/integrations"];
}

export interface RuntimeFoundationArtifactMap {
  topology: "outputs/phase-02/runtime-topology.md";
  versionPolicy: "outputs/phase-02/version-policy.md";
  bootstrapRunbook: "outputs/phase-05/foundation-bootstrap-runbook.md";
  dependencyRules: "outputs/phase-08/dependency-boundary-rules.md";
  phase12Compliance: "outputs/phase-12/phase12-task-spec-compliance-check.md";
}
```

### API / command signatures

```bash
node --version
pnpm --version
npm view next version
npm view react version
npm view typescript version
npm view @opennextjs/cloudflare version
rg -n "Node 22|Next.js 15|TypeScript 5.7|Cloudflare Pages" .claude/skills/aiworkflow-requirements/references
```

### 使用例

1. Phase 2 で `outputs/phase-02/version-policy.md` に採用候補を記録する。
2. Phase 10 で AC-2 / AC-4 を `SPEC-PASS_WITH_SYNC` として判定する。
3. Phase 12 で `.claude/skills/aiworkflow-requirements/references/technology-core.md` / `technology-frontend.md` / `architecture-overview-core.md` を same-wave sync する。
4. Phase 12 の `system-spec-update-summary.md` に更新対象、no-op 対象、未タスク化対象を分けて記録する。

### エラーハンドリングとエッジケース

| ケース | 対処 |
| --- | --- |
| npm registry の最新値が `version-policy.md` と異なる | `version-policy.md` を更新し、Phase 10 AC-2 の根拠を再判定する |
| 正本仕様が旧値を保持している | Phase 12 Step 2 を required にし、未同期のまま完了しない |
| Workers bundle size が無料枠を超える | Pages Functions または分割 Workers を Phase 3 / 10 の blocker として再評価する |
| 実装済みファイルと未タスク検出が衝突する | current facts を優先し、実装済み項目は DONE に再分類。残課題だけを UT として残す |

### 設定可能パラメータと定数

| 名称 | 値 | 用途 |
| --- | --- | --- |
| `NODE_MAJOR` | `24` | runtime LTS line |
| `PNPM_MAJOR` | `10` | workspace manager |
| `NEXT_MAJOR` | `16` | apps/web framework |
| `REACT_MINOR` | `19.2` | UI runtime |
| `TYPESCRIPT_MAJOR` | `6` | strict typecheck |
| `WEB_ADAPTER` | `@opennextjs/cloudflare` | Next.js to Cloudflare runtime |
| `API_RUNTIME` | `Hono on Cloudflare Workers` | apps/api runtime |

## system spec 更新概要
- Step 1-A〜1-C を `code_and_docs` 前提で閉じる。
- Step 2 domain sync は required。対象は `architecture-overview-core.md` / `architecture-monorepo.md` / `technology-core.md` / `technology-frontend.md` / `technology-backend.md`。
- OpenNext Workers 形式の `apps/web/wrangler.toml`、Phase 11 screenshot、Node 24.x 検証残課題を current facts として記録する。

## LOGS.md 記録
- 変更要約
- 判定根拠
- 未解決事項

## Phase 12 必須成果物
| 成果物 | パス |
| --- | --- |
| 実装ガイド | outputs/phase-12/implementation-guide.md |
| system spec update | outputs/phase-12/system-spec-update-summary.md |
| changelog | outputs/phase-12/documentation-changelog.md |
| unassigned | outputs/phase-12/unassigned-task-detection.md |
| skill feedback | outputs/phase-12/skill-feedback-report.md |
| compliance check | outputs/phase-12/phase12-task-spec-compliance-check.md |

## 依存Phase成果物参照

- 参照対象: Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 / Phase 8 / Phase 9 / Phase 10 / Phase 11
