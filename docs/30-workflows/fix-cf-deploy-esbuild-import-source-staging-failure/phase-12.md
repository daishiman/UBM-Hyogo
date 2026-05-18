# Phase 12: 正本同期

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| 名称 | 正本同期 |
| タスク | Cloudflare deploy esbuild import-source feature failure fix |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| タスク種別 | implementation / NON_VISUAL |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は Phase 4-9 で実装する `package.json` overrides bump / `pnpm-lock.yaml` 再生成 / 必要なら `scripts/cf.sh` fallback 拡張 の正本を、PR 本文と documentation changelog へ反映する Phase。状態語彙は `implemented_local_evidence_captured / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（実装反映済み + CI 緑化観測待ち）。 |

---

## 目的

Phase 1〜11 で確定した修正内容を、PR 本文に直接転記可能な形（implementation-guide.md）と
documentation changelog として正本化する。

---

## なぜ正本同期が必要か（中学生レベル）

「壊れたインターホンの部品を 1 個だけ交換して直した」とき、修理伝票に
「いつ・どこの部品を・なぜ交換したか」を書いておかないと、3 ヶ月後に同じ症状が出たときに
「またこの部品か？それとも別の場所か？」と最初から調査し直すことになる。

Phase 12 では「**交換した部品（依存メタの 1 行）と、なぜその値にしたかを修理伝票に残す作業**」を行う。

- 修理伝票 = PR 本文（`implementation-guide.md` から転記）
- 部品 = `pnpm.overrides.esbuild` の値
- なぜその値 = wrangler 4.85.0 同梱の esbuild と整合させて `"import-source"` feature 名を parse 可能にするため
- 再発時の対応書 = `scripts/cf.sh` 内コメント更新

---

## 必須 outputs

| # | output | 出力先 |
| --- | --- | --- |
| 1 | main.md | `outputs/phase-12/main.md` |
| 2 | implementation-guide.md | `outputs/phase-12/implementation-guide.md` |
| 3 | system-spec-update-summary.md | `outputs/phase-12/system-spec-update-summary.md` |
| 4 | documentation-changelog.md | `outputs/phase-12/documentation-changelog.md` |
| 5 | unassigned-task-detection.md | `outputs/phase-12/unassigned-task-detection.md` |
| 6 | skill-feedback-report.md | `outputs/phase-12/skill-feedback-report.md` |
| 7 | phase12-task-spec-compliance-check.md | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

---

## 12-1. implementation-guide.md（Phase 13 PR 本文に直接転記される）

### Part 1 — 中学生レベル概念説明

| 概念 | 例え |
| --- | --- |
| pnpm overrides | 「家中のテレビのリモコンを 1 種類に統一する」強制ルール |
| esbuild | コードを Cloudflare で動く形に変換する翻訳機 |
| feature 名 `import-source` | 新しい翻訳機にしかない「この単語を訳せる」スイッチ |
| wrangler 4.85.0 同梱 esbuild | 翻訳機の新型（0.27.x） |
| override 0.25.4 | 「全員旧型を使え」と強制していた家ルール |
| 修正 | 家ルールを「全員新型を使え」に書き換えるだけ |

### Part 2 — 技術契約

| 項目 | 契約 |
| --- | --- |
| 変更対象 | ルート `package.json` の `pnpm.overrides.esbuild` のみ（第一候補 A）|
| 変更前 | `"esbuild": "0.25.4"` |
| 変更後 | `"esbuild": "0.27.3"` 以上（wrangler 4.85.0 同梱版に整合） |
| lockfile | `mise exec -- pnpm install --force` で再生成 |
| `scripts/cf.sh` fallback | `node_modules/wrangler/node_modules/@esbuild` 配下を優先解決。存在しない場合 `node_modules/esbuild/node_modules/@esbuild` を fallback に追加（Phase 5 ゲートで決定） |
| 影響範囲 | `apps/api` (wrangler deploy) / `apps/web` (OpenNext build) / vitest（trans piler） |
| 不変条件 | `wranglerVersion: 4.85.0` ピンは維持（候補 A 採用時）。CLAUDE.md「Cloudflare 系 CLI 実行ルール」「`apps/web` env アクセス不変条件」に変更なし |

### Part 3 — 変更ファイル一覧（CONST_005）

| 種別 | パス | 役割 |
| --- | --- | --- |
| 編集 | `package.json` | `pnpm.overrides.esbuild` を `0.27.3` 以上に bump |
| 再生成 | `pnpm-lock.yaml` | `pnpm install --force` で再生成 |
| 編集（条件付） | `scripts/cf.sh` | nested esbuild が存在しなくなった場合の fallback 配列拡張 |
| 編集（候補 B/C 採用時のみ） | `.github/workflows/web-cd.yml` / `backend-ci.yml` | `wranglerVersion` ピン更新 4 箇所 |
| 参照 | `apps/api/wrangler.toml` / `apps/web/wrangler.toml` | 変更なし |

### Part 4 — 主要関数シグネチャ

本タスクは依存メタ変更のため関数シグネチャ変更なし。
構造的には JSON オブジェクト `package.json#pnpm.overrides` の 1 値が変わるのみ:

```json
{
  "pnpm": {
    "overrides": {
      "esbuild": "0.27.3"
    }
  }
}
```

### Part 5 — 入出力・副作用

| 操作 | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `pnpm install --force` | 新 `package.json` | 新 `pnpm-lock.yaml` | `node_modules` 再構築、esbuild platform binary 再 download |
| `scripts/cf.sh deploy --dry-run` | bundle 設定 | bundle 出力 | esbuild エラーが出ないことを確認 |
| `pnpm --filter @ubm-hyogo/web build:cloudflare` | apps/web ソース | OpenNext Cloudflare bundle | `import-source` エラーが出ないことを確認。別 runtime blocker は Phase 11 に分離 |

### Part 6 — テスト方針

| テストレイヤ | 対象 | 想定ケース |
| --- | --- | --- |
| static | typecheck / lint | `mise exec -- pnpm typecheck` / `pnpm lint` PASS |
| build | apps/api (wrangler) | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle` PASS |
| build | apps/web (OpenNext) | `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` は `import-source` 再発なし。Miniflare/workerd SQLite blocker で runtime_pending |
| unit | vitest 全体 | esbuild 0.27.x で regression なし（Phase 6） |
| 統合 (CI) | web-cd / deploy-staging | conclusion: success |
| 統合 (CI) | backend-ci / deploy-staging | conclusion: success |

### Part 7 — ローカル実行コマンド

```bash
# 適用
# (package.json を手動 or 別プロンプトで編集後)
mise exec -- pnpm install --force

# 検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
mise exec -- pnpm test
```

### Part 8 — 設計判断

| 判断 | 理由 |
| --- | --- |
| override を削除せず bump | `scripts/cf.sh` コメントが明示する「OpenNext / wrangler 間の host/binary mismatch 対策」という存在意義を維持するため |
| 第一候補は最小差分（package.json 1 行 + lockfile 再生成） | 影響範囲を狭くし、原因切り分けと revert を容易にするため |
| 代替案として wrangler 4.92.0 bump を Phase 2 ゲート化 | OpenNext と 0.27.x が不整合だった場合の退避経路を事前に用意するため |
| `wranglerVersion: 4.85.0` ピンは維持 | CLAUDE.md「ピン更新の最小化」に整合。第一候補 A で解決すれば workflow 4 箇所に触れない |
| `scripts/cf.sh` fallback 拡張は条件付き | nested esbuild path が消失した場合のみ追記。実物の `node_modules` 構造に依存するため Phase 5 で実測判断 |

### Part 9 — 検証手順

ローカル:

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --dry-run --outdir /tmp/api-bundle
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

CI (PR push 後):

```bash
gh run list --workflow=web-cd.yml --branch fix/cf-deploy-esbuild-import-source-staging-failure --limit 1
gh run list --workflow=backend-ci.yml --branch fix/cf-deploy-esbuild-import-source-staging-failure --limit 1
```

### Part 10 — ロールバック手順

Phase 10 `outputs/phase-10/rollback.md` 参照。要点:

| 範囲 | 手順 |
| --- | --- |
| 依存メタ | `package.json` の override 値を `0.25.4` に戻し `pnpm install --force` |
| Cloudflare | `bash scripts/cf.sh rollback <VERSION_ID> --config apps/<api or web>/wrangler.toml --env <env>` |
| wrangler ピン（B/C 採用時のみ） | workflow 4 箇所を 4.85.0 に戻す |
| script | `scripts/cf.sh` の fallback 拡張コミットを git revert |

### Part 11 — DoD（Definition of Done）

- [x] `package.json` の `pnpm.overrides.esbuild` が `0.27.3` 以上
- [x] `pnpm-lock.yaml` が再生成済
- [x] `mise exec -- pnpm typecheck` PASS
- [x] `mise exec -- pnpm lint` PASS
- [x] `apps/api` build dry-run PASS（`"import-source"` エラー消失）
- [ ] `apps/web` OpenNext build PASS（`import-source` は再発なし、Miniflare/workerd SQLite blocker で runtime_pending）
- [x] vitest regression なし（`mise exec -- pnpm test` PASS）
- [ ] `web-cd / deploy-staging` 緑化
- [ ] `backend-ci / deploy-staging` 緑化
- [x] Phase 10 rollback.md に 4 範囲の手順が記載済
- [ ] `outputs/phase-11/ci-evidence.md` に Run URL 保管済（user-gated）

---

## 12-2. system-spec-update-summary.md（要点）

詳細は `outputs/phase-12/system-spec-update-summary.md` を参照。

| Step | 対象 | 内容 |
| --- | --- | --- |
| Step 1-A | 完了タスク記録 | 本タスクは `unassigned-task` 由来ではない（独立の障害修正）。`completed-tasks` 移動は適用なし |
| Step 1-B | 実装状況 | `spec_created` → `implemented-local-runtime-pending`（ローカル PASS + CI 観測待ち） → `completed`（CI 緑化観測後） |
| Step 1-C | 関連タスク | UT-17 / task-02 wrangler-env-injection / 他 deploy 関連タスクと独立。影響範囲は overrides 1 行のみ |
| Step 2 | システム仕様反映 | `scripts/cf.sh` 内コメントの override 値追従記述を更新（Phase 8）。aiworkflow-requirements skill の deployment-cloudflare 系には影響なし |

---

## 12-3. unassigned-task-detection.md（要点）

詳細は `outputs/phase-12/unassigned-task-detection.md` を参照。

- 本サイクルで新たに発見した unassigned task: **0 件**
  - build-only gate は既存 `.github/workflows/pr-build-test.yml` / `ci.yml` の Cloudflare build gate と本タスクの Phase 11 evidence で扱うため、別 unassigned-task として切り出さない。
- Issue 連動: なし（GitHub Issue 紐付けなし）。

---

## 12-4. skill-feedback-report.md（要点）

詳細は `outputs/phase-12/skill-feedback-report.md` を参照。

- task-specification-creator skill: 本タスクのような「依存メタ 1 行 bump」型の小規模 fix でも Phase 1-13 を踏襲できることを確認。Phase 4 と Phase 5 が薄くなる傾向あり（実装手順とローカル検証が物理的に短いため）。
- aiworkflow-requirements skill: 直接の影響なし。

---

## 12-5. phase12-task-spec-compliance-check.md（要点）

詳細は `outputs/phase-12/phase12-task-spec-compliance-check.md` を参照。

- 4 条件（価値性 / 実現性 / 整合性 / 運用性）: すべて PASS / CONDITIONAL（Phase 5 ゲートで解消）
- CONST_005 必須項目 6 件: 本仕様書内で網羅済
- CONST_007（1 サイクル完結）: 適合
- strict 7 outputs: 本仕様書 + 6 兄弟ファイルで充足

---

## 完了条件

- [ ] strict 7 outputs が `outputs/phase-12/` に配置されている
- [ ] `implementation-guide.md` に Part 1〜11 が揃っている
- [ ] `system-spec-update-summary.md` に Step 1-A / 1-B / 1-C / Step 2 の判定が明記されている
- [ ] `unassigned-task-detection.md` に 0 件判定と理由が記録されている

---

## 次 Phase 引き継ぎ事項

- 次 Phase: Phase 13 (PR・振り返り)
- 引き継ぎ:
  - `implementation-guide.md` Part 3 + 8 + 9 + 10 → PR 本文「変更ファイル / 設計判断 / 検証手順 / ロールバック」
  - `unassigned-task-detection.md` 0 件判定 → PR 本文「Follow-up なし」欄
- ブロック条件: strict 7 outputs に欠落がある場合 Phase 13 を実行しない

---

## 参照

- `.claude/skills/task-specification-creator/references/phase-12-spec.md`（strict 7 outputs ルール）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-12.md`（フォーマット参考）

## 実行タスク

- [x] Phase 12 strict 7 outputs を作成する
- [x] root / outputs artifacts mirror を同期する
- [x] aiworkflow-requirements の stale root 参照を今回 root へ retarget する
- [x] unassigned-task 0 件判定を明記する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| Phase 12 spec | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | strict 7 / status vocabulary |
| workflow state | `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md` | root state / runtime pending boundary |
| deployment SSOT | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| main | `outputs/phase-12/main.md` | Phase 12 verdict |
| guide | `outputs/phase-12/implementation-guide.md` | PR body source |
| summary | `outputs/phase-12/system-spec-update-summary.md` | same-wave sync summary |
| changelog | `outputs/phase-12/documentation-changelog.md` | documentation changelog |
| unassigned | `outputs/phase-12/unassigned-task-detection.md` | 0 件判定 |
| feedback | `outputs/phase-12/skill-feedback-report.md` | skill feedback report |
| compliance | `outputs/phase-12/phase12-task-spec-compliance-check.md` | final compliance check |
