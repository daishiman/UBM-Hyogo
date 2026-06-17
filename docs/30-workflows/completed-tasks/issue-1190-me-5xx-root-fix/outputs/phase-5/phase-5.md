# Phase 5: 実装手順インデックス

## メタ情報
正本: `outputs/phase-5/phase-5.md` / 上位 SSOT: `../../_shared-context.md`

参照: `../phase-2/phase-2.md`（§1 レーン設計・§4/§5 Before/After）/ `../phase-4/phase-4.md`（I/O 契約・テスト期待値表）/ `../../_shared-context.md`（§3 タスク分解・§4 AC）

## 目的
T01-T04 の実装タスク本体（`task-0N-*.md`）への索引を提供し、依存順・並列可否・各タスクの責務境界を固定する。各 task 本体は CONST_005 の必須項目（実装区分 / 変更対象ファイル一覧と種別 / 主要シグネチャまたは Before/After / 入出力・副作用 / テスト方針 / ローカル実行コマンド / DoD / 不変条件）を持つ。

---

## 1. タスク一覧と本体リンク

| タスク | 領域 | 対象問題 | 本体 | 概要 |
|--------|------|----------|------|------|
| T01 | `apps/api/src/routes/me/index.ts` | F-1 | [`task-01-me-profile-pending-requests-fail-soft.md`](./task-01-me-profile-pending-requests-fail-soft.md) | `getPendingRequestsForMember` の fail-soft 化（失敗時 `{}` + 構造化 `logError`・200 維持） |
| T02 | `apps/api/src/middleware/session-guard.ts` + `apps/api/src/routes/me/index.ts` | F-2 | [`task-02-primary-d1-exception-classification.md`](./task-02-primary-d1-exception-classification.md) | 一次データ D1 例外を `UBM-5001` + `context.scope` で分類 rethrow（P1/P2/P3） |
| T03 | `index.contract.spec.ts` 追記 + `session-guard.spec.ts` 新規 | F-3 | [`task-03-me-5xx-contract-tests.md`](./task-03-me-5xx-contract-tests.md) | D1 例外注入の契約テスト（TC-1〜TC-4 + Phase 6 拡充ケース） |
| T04 | 本 WF `outputs/phase-12/` 配下（docs） | §1.2 再定義 | [`task-04-issue-1190-modernization-draft.md`](./task-04-issue-1190-modernization-draft.md) | Issue #1190 現行コード最適化コメントの**草稿**作成（GitHub mutation は user-gated） |

---

## 2. 依存順（実装着手順）と並列可否

```
T02 (一次データ分類: session-guard.ts + routes/me/index.ts)
  └─→ T01 (P4 fail-soft: routes/me/index.ts)        [直列: 同一ファイル編集の衝突回避。設計依存はなし]
        └─→ T03 (契約テスト TC-1〜TC-4)              [T01/T02 の確定 diff に依存。期待値は Phase 4 で契約固定済み]

T04 (Issue 草稿: docs のみ)                           [完全独立・いつでも並列可]
```

- **T02 → T01 直列**: 両タスクが `apps/api/src/routes/me/index.ts` を編集する（T02 は P3 の `.catch` rethrow、T01 は P4 の `.catch` fail-soft + import 追加）。編集衝突回避のため T02 を先に確定させる（Phase 2 §1 レーン A → B）。逆順でも論理的には成立するが、本仕様では T02 → T01 に固定する。
- **T03 は T01/T02 の後**: テストは確定 diff に対して RED→GREEN を確認する。なお TDD で進める場合は T03 のテストを先に書いて RED を確認してから T01/T02 を実装してもよい（期待値は Phase 4 で固定済みのため順序の入れ替えは仕様逸脱ではない）。
- **T04 は独立並列可**: コード非接触の docs タスク。T01-T03 と並行して作成してよいが、草稿内の「経路特定済み」根拠は Phase 1 §2 の経路マップ（既確定）を引くため実装完了を待つ必要はない。

## 3. 共通の不変条件（全 task 共通・SSOT §5）

1. `/me` の path・response shape（zod schema）・status 体系（200/401/404/410/5xx）を変更しない。**5xx の「発生のしかた」（分類・fail-soft）だけを変える**（AC-4）。
2. 不変条件 #11: memberId / email をエラー response・エラーログ context に露出しない。`context` は literal `{ scope: "<3値のいずれか>" }` 固定（Phase 2 §6）。
3. apps/web 非接触（`git diff --stat -- apps/web` 空が DoD・AC-6）。D1 schema・migrations・新規 endpoint・Google Form 仕様変更なし（AC-7）。
4. repository 層（`findIdentityByMemberId` / `buildMemberProfile` 本体等）に触らない。catch は呼び出し側のみ（Phase 2 §2.2）。
5. 新規 production ファイル 0。新規 test ファイルは `session-guard.spec.ts` のみ（`*.spec.ts` 命名）。
6. エラーコードは既定義 `UBM-5001` のみ使用。`UBM-5500`（503）は不使用（status 体系不変のため）。
7. GitHub mutation（Issue コメント・ラベル・close）・commit・push・PR・staging deploy は本サイクル実行しない（AC-10・user-gated）。

## 4. レーン横断の結合点（Phase 3 で特定・Phase 4 で契約固定）

結合点は (1) `.catch` rethrow した `ApiError` が既設 onError（`apps/api/src/index.ts:195`）に届いて problem+json + logError 整形される一方向フロー、(2) failing D1 Proxy の SQL パターンが経路を一意に選択する前提（Phase 4 §3.3 で実 SQL 検証済み）、の 2 点。各 task は契約の自分の担当部分のみ実装し、shape を勝手に変えない。

## 統合テスト連携
各 task の focused spec は Phase 4 のテスト期待値表（TC-1〜TC-4）と Phase 6 の拡充ケース（P6-1〜P6-9）に従う。Phase 9 で focused vitest + `pnpm typecheck` + `pnpm lint` + 非接触 gate（`git diff --stat -- apps/web` 空）を直列実行して締める。実機統合は Phase 11（`wrangler tail` を `scripts/cf.sh` 経由・user-gated）。

## 参照資料
- `../phase-2/phase-2.md`（レーン設計・Before/After）/ `../phase-4/phase-4.md`（I/O 契約）/ `../../_shared-context.md`
- `task-01-me-profile-pending-requests-fail-soft.md` / `task-02-primary-d1-exception-classification.md` / `task-03-me-5xx-contract-tests.md` / `task-04-issue-1190-modernization-draft.md`

## 成果物
- `outputs/phase-5/phase-5.md`
- `outputs/phase-5/task-01-me-profile-pending-requests-fail-soft.md`
- `outputs/phase-5/task-02-primary-d1-exception-classification.md`
- `outputs/phase-5/task-03-me-5xx-contract-tests.md`
- `outputs/phase-5/task-04-issue-1190-modernization-draft.md`

## 完了条件
- [x] T01-T04 の依存順（T02 → T01 → T03 / T04 独立並列）と本体リンクを索引化した。
- [x] 共通不変条件と結合点契約参照を固定した。
- [x] 各 task 本体（CONST_005 必須項目）への導線を整備した。
