# タスク仕様書: Issue #626 — Share build output between Lighthouse and PR build jobs (RB-01)

[実装区分: 実装仕様書]

判定根拠: 本タスクは `.github/workflows/lighthouse.yml` の `pnpm --filter @ubm-hyogo/web build` と `.github/workflows/pr-build-test.yml` の root `pnpm build`（内部で `@ubm-hyogo/web` build を含む）の重複を排除し、build output（`apps/web/.next/`）を artifact 経由で共有するための **CI workflow コード変更**を伴う。Issue 本文の `採用条件`（両ゲート安定稼働 + build duplication 観測済）は Stage 3 完了 (#608 closed @ 2026-05-11) と現行 workflow に web build を含む build step が存在することで充足している。コード変更（workflow YAML / 関連 script / runbook 追記）を伴うため CONST_004 デフォルトに従い実装仕様書として作成する。Issue #626 は `gh issue view 626 --json state,closedAt` で `CLOSED`（closed_at: 2026-05-12T04:19:14Z）を確認済みであるため、CLOSED Issue Reference Rule に従い `Closes` / `Fixes` / `Resolves` は使わず、PR・commit には `Refs #626, #608` のみを使う。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-626-rb01-share-build-output-lighthouse-pr-build |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/626 |
| 上位親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/608 (closed) |
| 起票元 backlog | `docs/30-workflows/e2e-quality-uplift/backlog.md` (RB-01) |
| 配置先 | `docs/30-workflows/issue-626-rb01-share-build-output-lighthouse-pr-build/` |
| 作成日 | 2026-05-12 |
| 状態 | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 優先度 | LOW（issue label `priority:low`） |
| Wave | Stage 4 follow-up (e2e-quality-uplift) |
| 想定 PR 数 | 1 |
| coverage AC | 適用外（`.github/workflows/` + `scripts/` 配下。focused regression + workflow lint で代替） |

実装状態: `.github/workflows/pr-build-test.yml` への `lighthouse-ci` 統合、標準 Next.js build artifact upload、`.github/workflows/lighthouse.yml` 削除、RB-01 backlog 同期はローカル実装済み。PR 作成・dry-run PR checks・merge 後 branch protection before/after diff は user-gated runtime evidence のため未取得であり、root state は `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` とする。

## 着手判断（着手 Gate）

| Gate | 内容 | 状態 |
| --- | --- | --- |
| Gate-A | 親 Issue #608 (Stage 3) が closed であること | ✅ 2026-05-11T10:52:04Z closed |
| Gate-B | `lighthouse-ci` / `build-test` 両 status check が複数 PR で安定稼働 | ✅ recent PRs (#674, #675, #681, #686) で連続 PASS |
| Gate-C | build duplication が観測されること | ✅ `lighthouse.yml` の web build と `pr-build-test.yml` の root `pnpm build`（web build を含む）が同じ `.next` 出力を生成している |

## 苦戦箇所（Issue #626 本文と現状から抽出）

1. **untrusted PR context**: `pr-build-test.yml` は `permissions: {}` + `secrets 非注入` の untrusted フォークセーフ設計。同じ build output を Lighthouse が消費する場合も untrusted を維持する必要がある（artifact 受け渡し以外で trust 境界を越えない）。
2. **build 種別の差**: `pr-build-test.yml` は `pnpm build`（Next.js 標準）と `pnpm --filter @ubm-hyogo/web build:cloudflare`（OpenNext standalone）の 2 段。`lighthouse.yml` は `pnpm --filter @ubm-hyogo/web build` のみ。**Lighthouse が必要なのは標準 build（`apps/web/.next/`）であり、`build:cloudflare` artifact は対象外**。
3. **artifact サイズ**: `.next/` 全体は数百 MB になりうる。Lighthouse は `start` で動かせる範囲（`.next/standalone` ではなく通常の `.next/` server output）が必要。
4. **GitHub Actions cross-workflow 依存**: 別 workflow からの artifact 受け取りには `workflow_run` トリガが必要だが、`pull_request` イベントで動く `lighthouse.yml` が `workflow_run` に変わると PR コメント / required status check 紐付けが変わる。
5. **required status check との互換**: branch protection `required_status_checks.contexts` の current required context は `lighthouse-ci`。`build-test` は `lighthouse-ci.needs` の workflow-local dependency として扱い、両 job 名は不変条件として扱う。
6. **キャッシュとの差別化**: `actions/cache` は best-effort で hit が保証されない。RB-01 は「保証された共有」を目的とするため `actions/upload-artifact` + `actions/download-artifact` を主経路とし、actions/cache は副次最適化に留める。

## リスクと対策

| リスク | 検知 | 対策（rollback） |
| --- | --- | --- |
| 統合後に Lighthouse が build 不一致で再ビルド発生 | Phase 11 evidence の `lighthouse.yml` run log に `build` step が出現 | 手順書通り `actions/download-artifact` 経路を維持。再発時は本タスク Phase 5 設計に戻る |
| artifact size 過大で upload/download が遅延 | run time が現行より長くなる | `.next/cache` 等を除外する `path:` パターンへ縮退 |
| untrusted context で artifact 改竄 | Lighthouse 結果が異常値 | Lighthouse 結果は閾値 gate のみで PR merge には影響しない設計を維持（現行通り） |
| required status check 名が変わり branch protection 不一致 | `gh api repos/.../branches/dev/protection` で乖離 | job `name:` を `build-test` / `lighthouse-ci` から変更しない |
| fork PR で `GITHUB_TOKEN` 権限不足により download 失敗 | Lighthouse 段が download エラー | 同一 workflow 内 `needs:` 経路（採用案）であれば fork でも `GITHUB_TOKEN` 不要で動く |

## 設計方針（採用案）

**採用案: `pr-build-test.yml` 内に `lighthouse-ci` job を追加し、`needs: build-test` で `actions/upload-artifact` / `actions/download-artifact` 経由で `.next/` を共有する**。`lighthouse.yml` は削除する。

理由:
- 同一 workflow 内なら fork PR でも `GITHUB_TOKEN` の追加権限不要で artifact を共有可能
- `workflow_run` トリガを使わないため、required status check / PR コメント挙動が現行と同等に保てる
- build artifact の信頼境界が untrusted のままで完結する（trusted context へ昇格しない）

非採用案:
- `workflow_run` 経由: cross-workflow になると required status check 同期と PR コメント挙動が複雑化
- `actions/cache` のみ: 共有が best-effort で hit 率が保証されない

## 検証方法

1. **CI workflow lint**: `actionlint` で `pr-build-test.yml` の構文 / job 依存 / artifact 利用を検証
2. **focused regression**: `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` 既存 test の継続 PASS
3. **dry-run PR**: 本タスク自身の PR で `build-test` → `lighthouse-ci` の順に走り、`lighthouse-ci` 内に `build` step が**存在しない**ことを run log で証跡化
4. **branch protection contexts 確認**: `gh api repos/daishiman/UBM-Hyogo/branches/dev/protection` で `contexts` 配列に current required context `lighthouse-ci` が残り、YAML 上で `lighthouse-ci.needs: build-test` が維持されていることを確認

## スコープ（CONST_007）

| 項目 | 含める | 含めない |
| --- | --- | --- |
| 含む | `pr-build-test.yml` 統合改修 / `lighthouse.yml` 削除 / `docs/30-workflows/e2e-quality-uplift/backlog.md` の RB-01 status 更新 / `docs/runbooks/` への追記（必要時） | Lighthouse 閾値変更 / 認証付き `/profile` 計測（EXT-X1） / composite action 化（RB-02） / docs-only PR skip 戦略（RB-03） |

EXT-X1 / RB-02 / RB-03 は別 backlog 項目として既存登録済みであり、本タスクの**先送り**ではなく**元から別スコープ**である。

## Phase 構成

| Phase | 目的 |
| --- | --- |
| [Phase 1](phase-01.md) | 要件定義と現状調査 |
| [Phase 2](phase-02.md) | 設計（採用案の YAML 構造設計） |
| [Phase 3](phase-03.md) | 依存関係と前提条件確認 |
| [Phase 4](phase-04.md) | 詳細実装計画 |
| [Phase 5](phase-05.md) | YAML 改修実装 |
| [Phase 6](phase-06.md) | テスト（actionlint / dry-run PR） |
| [Phase 7](phase-07.md) | レビュー観点 |
| [Phase 8](phase-08.md) | governance / branch protection 整合 |
| [Phase 9](phase-09.md) | runbook / docs 更新 |
| [Phase 10](phase-10.md) | rollback 設計 |
| [Phase 11](phase-11.md) | 実行 evidence |
| [Phase 12](phase-12.md) | Phase 12 必須 6 タスク |
| [Phase 13](phase-13.md) | commit / PR / merge |

## 参照

- `.github/workflows/lighthouse.yml`
- `.github/workflows/pr-build-test.yml`
- `docs/30-workflows/e2e-quality-uplift/backlog.md` (RB-01)
- `lighthouserc.json`
- 親 Issue #608 / `docs/30-workflows/completed-tasks/...e2e-quality-uplift-stage-3...`
