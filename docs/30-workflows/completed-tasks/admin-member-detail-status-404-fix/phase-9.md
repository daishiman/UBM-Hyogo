# Phase 9: 品質保証

> **[実装区分: 実装仕様書]** — コード変更を伴う（CONST_004 デフォルト）。

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 9（品質保証） |
| 入力 | Phase 8 リファクタリング後の実装 |
| 出力 | typecheck / lint / 対象テスト全 PASS・apps/web diff 0 の検証記録 |
| 分類 | NON_VISUAL（`apps/api` のみ） |
| line budget / mirror parity | **本タスク非該当**（skill 変更なし。`.claude/skills/**` への編集が無いため line budget 検査・mirror parity 検査の対象外） |

## 目的

Phase 8 までの実装が型・lint・テスト・スコープ境界の全観点で健全であることを、実行可能な検証コマンド列で確定する。AC-7（非回帰）と AC-8（`apps/web` diff 0）を機械的に検証する手順を固定する。

## 実行タスク

### 9.1 実行する検証コマンド（順序）

| # | コマンド | 目的 | 期待 |
|---|---------|------|------|
| 1 | `mise exec -- pnpm install --force` | 依存・lockfile 整合 | exit 0 |
| 2 | `mise exec -- pnpm typecheck` | 型整合（`ensureMemberStatusRow` / `defaultMemberStatusRow` / `MemberStatusRow` 充足 / degraded view の zod 型） | exit 0 |
| 3 | `mise exec -- pnpm lint` | lint（失敗時は `pnpm lint --fix` → 残差手修正） | exit 0 |
| 4 | unit/route 対象 vitest（後述 §9.2） | builder degraded / member-status route / ingest の回帰 | 全 PASS |
| 5 | D1 config 対象 vitest（後述 §9.2） | `ensureMemberStatusRow` 冪等・既定値 / migration 0024 backfill 冪等 | 全 PASS |
| 6 | `git diff --name-only dev...HEAD`（§9.3） | AC-8 スコープ境界（apps/web 不含有） | apps/web 行が 0 |

### 9.2 対象 vitest（unit config と D1 config を分離）

> **[FB-MSO-002]** repository / migration テストは D1 binding が必要なため `vitest.d1.config.ts`。unit config（`vitest.config.ts`）は repository spec を exclude する慣例。両 config を明示的に分けて実行する。

```bash
# unit / route（vitest.config.ts）— ルートから実行
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/repository/__tests__/builder.repository.spec.ts \
  apps/api/src/routes/admin/__tests__/member-status.route.spec.ts \
  apps/api/src/jobs/__tests__/sync-forms-responses.spec.ts

# D1 binding 必須（vitest.d1.config.ts）
mise exec -- pnpm exec vitest run --config=apps/api/vitest.d1.config.ts \
  apps/api/src/repository/__tests__/status.repository.spec.ts \
  apps/api/migrations/__tests__/0025_backfill_member_status.spec.ts
```

> spec パス・config の正確な所在は Phase 4 で確定したものに従う（builder.repository.spec が D1 binding を要する場合は D1 config 側へ移す）。`builder.repository.spec` は名称が `*.repository.spec` のため D1 config 側で実行する可能性があり、Phase 4 の config 判定を正本とする。

### 9.3 AC-8（apps/web diff 0）の grep gate 手順

```bash
# 変更ファイル一覧に apps/web を含まないことを検証（含めば非 0 = FAIL）
git diff --name-only dev...HEAD | grep -E '^apps/web/' && {
  echo "FAIL: apps/web に変更が混入"; exit 1;
} || echo "PASS: apps/web diff 0"
```

- 期待: `grep` がマッチ 0 件（apps/web 行が無い）で PASS。1 件でもマッチしたら AC-8 違反として Phase 8 へ差し戻す。
- 併せて `git diff --name-only dev...HEAD` の全行が `apps/api/` 配下（migration 含む）と本 workflow の `docs/30-workflows/**` のみであることを目視確認する。

### 9.4 非該当検査の明示

| 検査 | 本タスクでの扱い | 理由 |
|------|-----------------|------|
| line budget（skill 行数上限） | 非該当 | `.claude/skills/**` を変更しない |
| mirror parity（root↔outputs / skill mirror byte 一致） | 非該当（workflow artifacts の root↔outputs byte 一致は Phase 12 / gate-metadata 側で担保） | skill mirror は変更対象外 |
| `verify-design-tokens` | 非該当 | `apps/web` 無変更で色トークン抵触なし |

## 参照資料

- Phase 4（command suite）/ Phase 7（カバレッジ）
- CLAUDE.md「よく使うコマンド」/ vitest ルート実行ルール
- index.md §3 AC-7 / AC-8

## 成果物

- 本ファイル（Phase 9 品質保証）
- 検証コマンド列・D1/unit config 分離・AC-8 grep gate 手順の確定記録

## 統合テスト連携

- §9.2 の全 spec PASS が AC-1〜AC-7 の GREEN 証跡となり、Phase 10 の AC 充足判定に直結する。
- §9.3 の grep gate 結果が AC-8 の充足判定に直結する。
- 実コマンドは本 wave で実行済み。remote/staging 操作のみ Phase 13 user-gated とする。

## 完了条件

- [x] 検証コマンド列（install --force / typecheck / lint / unit vitest / D1 vitest / git diff）を順序付きで列挙した
- [x] unit config と D1 config を分離した spec 実行コマンドを明示した
- [x] AC-8 を grep gate で検証する手順を固定した
- [x] line budget / mirror parity が本タスク非該当であることを明記した
