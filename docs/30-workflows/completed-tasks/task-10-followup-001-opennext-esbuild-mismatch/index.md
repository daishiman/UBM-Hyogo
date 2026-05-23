# task-10-followup-001-opennext-esbuild-mismatch — タスク仕様書 index

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | TASK-10-FOLLOWUP-001 |
| タスク名 | OpenNext esbuild host/binary mismatch 解消 + `build:cloudflare` 回復 |
| ディレクトリ | docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch |
| artifacts | `artifacts.json` + `outputs/artifacts.json`（`cmp -s` 同値維持） |
| Wave | 1 |
| 実行種別 | serial（Phase 1-13） |
| 作成日 | 2026-05-11 |
| 担当 | unassigned |
| 状態 | implemented-local |
| taskType | implementation |
| subtype | build-toolchain-fix |
| visualEvidence | NON_VISUAL |
| implementation_mode | new |
| priority | HIGH |
| 既存タスク組み込み | なし |
| GitHub Issue | https://github.com/daishiman/UBM-Hyogo/issues/609 (CLOSED 状態を維持) |

## 目的

`mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` を「Host version "0.25.4" does not match binary version "0.21.5"」エラーから恢復し、ローカル / CI 双方で安定して PASS させる。

2026-05-11 実行結果: `package.json` の `pnpm.overrides.esbuild = "0.25.4"` と `pnpm-lock.yaml` 再生成により `build:cloudflare` は exit 0 へ回復した。`scripts/cf.sh` fallback 実装は不要と判定し、ヘッダコメントの運用ノートのみ更新する。

## 発生現象（2026-05-11 再現済み）

```
✘ [ERROR] Cannot start service: Host version "0.25.4" does not match binary version "0.21.5"
```

- host esbuild: `node_modules/@opennextjs/aws/node_modules/esbuild`（v0.25.4）
- binary 解決先: `node_modules/@esbuild/darwin-arm64`（v0.21.5、top-level vite 経由）
- nested `node_modules/@opennextjs/aws/node_modules/@esbuild/darwin-arm64`（v0.25.4）は存在するが解決対象になっていない

## 背景・派生元

- 由来: task-10 (UI primitives) Phase 11 で `build:cloudflare` を実行した際にブロック
- 既存指示書（短縮版）: `docs/30-workflows/unassigned-task/task-10-followup-001-opennext-esbuild-mismatch.md` — 本ディレクトリで Phase 1-13 構成へ展開・上書き
- 関連 commit: `80ee5616 fix(web): switch apps/web production build to webpack for Cloudflare Workers` — Turbopack→webpack に切り替え済みだが esbuild mismatch は別問題

## issue 状態に関する判断

- GitHub Issue #609 は CLOSED 状態。
- 2026-05-11 時点で `build:cloudflare` の同一エラーは再現したが、本サイクル内で `pnpm.overrides.esbuild = "0.25.4"` により解消済み。
- ユーザー指示により Issue は CLOSED のまま、本仕様書をローカル正本として作成する（reopen はユーザー判断に委ねる）。

## スコープ

### 含む

- `package.json` への `pnpm.overrides` で esbuild を `0.25.4` に単一化
- `pnpm-lock.yaml` 再生成
- `scripts/cf.sh` の既存 `ESBUILD_BINARY_PATH` 解決ロジックを維持し、OpenNext mismatch 再発時の復旧ノートをヘッダに追加（overrides で解消済みのため fallback 実装は不要）
- `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` PASS 確認
- `mise exec -- pnpm --filter @ubm-hyogo/api build`（wrangler 系）が回帰しないことを確認
- `mise exec -- pnpm typecheck` / `pnpm lint` の回帰なし
- 再現手順を `scripts/cf.sh` のヘッダコメントまたは `docs/00-getting-started-manual/` 配下の短いノートに追記
- aiworkflow-requirements の関連 lesson-learned を追加

### 含まない

- `@opennextjs/cloudflare` / `@opennextjs/aws` のメジャー version bump
- D1 schema 変更、API endpoint 追加、UI 実装変更
- task-10 Phase 13 PR の再オープン（本タスクは task-10 とは独立した build toolchain fix として完結）
- 新規 Cloudflare binding の追加

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | なし | build toolchain の独立タスク |
| 下流 | task-10 Phase 11 runtime visual evidence | 本タスク完了で取得可能になる |
| 下流 | task-11..17 (`ui-prototype-alignment-mvp-recovery`) | 同 build pipeline を共有 |
| 下流 | Cloudflare Workers staging / production deploy | 失敗時の rollback 手段確保 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | package.json | overrides 追加対象 |
| 必須 | pnpm-lock.yaml | overrides 適用後の再生成対象 |
| 必須 | apps/web/package.json | `build:cloudflare` script 起点 |
| 必須 | scripts/cf.sh | ESBUILD_BINARY_PATH 解決ロジックの正本 |
| 必須 | node_modules/@opennextjs/aws/package.json | host esbuild 要求バージョン確認 |
| 必須 | CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | 不変条件 |
| 参考 | https://github.com/daishiman/UBM-Hyogo/issues/609 | CLOSED issue |
| 参考 | https://pnpm.io/package_json#pnpmoverrides | overrides 仕様 |
| 参考 | https://esbuild.github.io/getting-started/#bundled-binaries | host/binary 仕様 |

## 受入条件 (AC)

- AC-1: 標準経路 `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` がエラーなしで完走する（exit 0）。overrides 単独で解消せず `scripts/cf.sh build:web` fallback を採用する場合は、`apps/web/package.json#build:cloudflare` を fallback 経路へ接続し、同じ標準経路で PASS することを必須とする
- AC-2: `mise exec -- pnpm why esbuild` と `find node_modules -path "*/@esbuild/*/package.json"` の出力で、OpenNext host と platform binary の mismatch 組み合わせが消滅している（単一化が第一候補だが、tsx/wrangler 互換性のため scope override に切り替えた場合は「mismatch pair 0 件」を合格条件にする）
- AC-3: 修正前後で `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` が green を維持
- AC-4: `apps/api` の wrangler 系操作（`bash scripts/cf.sh whoami`、`bash scripts/cf.sh d1 list` の dry-run 相当）が回帰しない
- AC-5: `pnpm-lock.yaml` の差分が overrides 反映分のみで、無関係パッケージの drift が発生していない
- AC-6: 再現手順ノートが `scripts/cf.sh` ヘッダまたは `docs/00-getting-started-manual/` に追加されている
- AC-7: aiworkflow-requirements の fragment 構造に合わせ、`lessons-learned/lessons-learned-task-10-followup-001-opennext-esbuild-mismatch-2026-05.md`、`changelog/20260511-task-10-followup-001-opennext-esbuild-mismatch.md`、`LOGS/_legacy.md`、`indexes/{quick-reference,resource-map}.md`、`references/task-workflow-active.md` に同一 wave で同期されている
- AC-8: 不変条件（D1 直接アクセス禁止、`wrangler` 直接呼び出し禁止、`scripts/cf.sh` ラッパー経路維持）に違反していない
- AC-9: Phase 12 close-out で 7 ファイル（main.md + 6 補助）が揃っている
- AC-10: skill 検証 4 条件（矛盾なし / 漏れなし / 整合性あり / 依存関係整合）が PASS

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義（mismatch の構造的原因の確定） | phase-01.md | spec_created | outputs/phase-01/main.md |
| 2 | 設計（overrides 戦略 + cf.sh 復旧ノート） | phase-02.md | spec_created | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | spec_created | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | spec_created | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | spec_created | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | spec_created | outputs/phase-07/main.md |
| 8 | DRY 化 / 重複解消確認 | phase-08.md | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | spec_created | outputs/phase-10/main.md |
| 11 | 手動 smoke / build evidence | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md（+ 6 補助） |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/main.md |

## 変更対象ファイル一覧

| パス | 変更種別 | サブタスク / Phase |
| --- | --- | --- |
| package.json | 編集（`pnpm.overrides` 追加） | Phase 5 |
| pnpm-lock.yaml | 編集（自動再生成） | Phase 5 |
| scripts/cf.sh | 編集（OpenNext esbuild recovery note 追加。fallback 実装は不要） | Phase 5 / Phase 12 |
| docs/00-getting-started-manual/cloudflare-cli-troubleshooting.md | 新規（短い復旧ノート） | Phase 12 |
| .claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-task-10-followup-001-opennext-esbuild-mismatch-2026-05.md | 新規（lesson 追記） | Phase 12 |
| .claude/skills/aiworkflow-requirements/changelog/20260511-task-10-followup-001-opennext-esbuild-mismatch.md | 新規（変更履歴） | Phase 12 |
| .claude/skills/aiworkflow-requirements/LOGS/_legacy.md | 編集（log 追加） | Phase 12 |
| .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | 編集（task-10 blocker 解消導線） | Phase 12 |
| .claude/skills/aiworkflow-requirements/indexes/resource-map.md | 編集（workflow/lesson/changelog 登録） | Phase 12 |
| .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | 編集（active workflow 登録） | Phase 12 |
| .claude/skills/aiworkflow-requirements/references/workflow-task-10-followup-001-opennext-esbuild-mismatch-artifact-inventory.md | 新規（成果物台帳） | Phase 12 |
| docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/artifacts.json | 編集（状態同期） | Phase 12 |
| docs/30-workflows/task-10-followup-001-opennext-esbuild-mismatch/outputs/artifacts.json | 編集（root mirror、`cmp -s` PASS） | Phase 12 |

## 不変条件 touched

| # | 不変条件 | 本タスクでの扱い |
| --- | --- | --- |
| CLAUDE.md「Cloudflare 系 CLI 実行ルール」 | `wrangler` 直接呼び出し禁止、`scripts/cf.sh` ラッパー経路 | `scripts/cf.sh` 経路を維持し、recovery note のみ追加 |
| 不変条件 #5 (D1 直接アクセスは apps/api に閉じる) | 影響なし（build toolchain のみ） | 影響なし |
| 不変条件 #1 (フォーム schema 固定) | 影響なし | 影響なし |

## 重要な参照ルール

- `wrangler` を直接呼び出さない。CI / ローカル双方で `bash scripts/cf.sh ...` 経路を正本とする
- `.env` 実値は読まない、API Token 値は出力・転記しない
- main 直接 push 禁止、PR base は `dev`
- コミット・PR・push はユーザー指示があるまで実行しない（本仕様書はそのまま実装着手可能な粒度で記述）

## 関連リンク

- 上位 README: ../README.md
- 短縮版指示書（supersede 対象）: ../unassigned-task/task-10-followup-001-opennext-esbuild-mismatch.md
- 親 task: ../task-10-ui-primitives-spec/
- 関連 followup: ../unassigned-task/task-10-followup-002-runtime-visual-axe-evidence.md
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/609 (CLOSED)
