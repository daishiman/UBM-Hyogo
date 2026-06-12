# Phase 8: リファクタリング（設計書）

## メタ情報

| 項目 | 値 |
|------|-----|
| Phase | 8 / 13 |
| 名称 | リファクタリング |
| 種別 | 設計書 |
| 主タスク | **M-1 解消**: 会員セッション JWT 検証ロジックを共通ヘルパーへ抽出し重複排除 |
| 方針 | [Feedback RT-03] 変更内容を `対象 / Before / After / 理由` テーブルで記録。リファクタ後も全 TC GREEN 維持 |

## 目的

C2 で `require-public-access.ts` に実装した会員セッション JWT 検証が、既存の `require-admin.ts` / `session-guard.ts` の検証ロジックと重複している（M-1）。
この重複を共通ヘルパー（`verify-session-jwt.ts` 等）へ抽出し、3 ファイルから単一実装を呼ぶ形へ整理する。
インターフェース・外部挙動は不変とし、リファクタ後も Phase 4/6 の全 TC が GREEN を維持することを完了条件とする。

## 実行タスク

1. JWT 検証重複箇所を `grep` で検出し、重複実体（cookie 名解決・JWT decode・有効性判定）を特定する。
2. 共通ヘルパー `apps/api/src/lib/auth/verify-session-jwt.ts` を新規作成し、純粋な「session 検証」責務に閉じる。
3. `require-admin.ts` / `session-guard.ts` / `require-public-access.ts` の重複ロジックを共通ヘルパー呼び出しへ置換する。
4. 命名整合（`requireXxx` 規則・helper は `verbNoun`）を確認する。
5. navigation / duplicate drift を削減し、全 TC GREEN を再実行で確認する。

## 参照資料

| 参照資料 | パス | 用途 |
|---------|------|------|
| 設計レビュー（M-1 追跡） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-3.md` | M-1 の解決予定 Phase は本 Phase 8 |
| middleware シグネチャ | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-2.md` §3.1 | 検証責務の共通化方針 |
| 命名規則 | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-1.md` §4 | `requireXxx` / kebab-case |
| 品質基準 | `.claude/skills/task-specification-creator/references/quality-standards.md` | 重複排除・責務境界 |

## 実行手順

### 手順 1: 重複検出コマンド

```bash
# JWT 検証・cookie 名・decode 系の重複を検出
grep -rn "verify.*jwt\|jwtVerify\|authjs.session-token" apps/api/src

# 検証責務を持つ middleware を列挙
grep -rln "getCookie\|Authorization\|Bearer" apps/api/src/middleware
```

期待: `require-admin.ts` / `session-guard.ts` / `require-public-access.ts` に JWT decode・cookie 取得・`authjs.session-token` 参照が**重複して**現れる。これを抽出対象とする。

### 手順 2: リファクタ内容（`対象 / Before / After / 理由`）

[Feedback RT-03] 形式で記録する。

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `apps/api/src/lib/auth/verify-session-jwt.ts`（新規） | — | `verifySessionJwt(req, env): Promise<SessionPayload \| null>` を新規追加。cookie/`Authorization` ヘッダから token 抽出 → JWT decode → 有効性判定を 1 箇所に集約 | M-1 解消の共通実体。session 検証の SSOT 化 |
| `apps/api/src/middleware/require-public-access.ts` | 自前で cookie 取得 + JWT decode を実装 | `verifySessionJwt()` を呼び、戻り値 `!= null` を session 経路の合格条件にする。内部認証分岐はそのまま保持 | 重複排除。`require-public-access` は「session OR 内部認証 OR 401」の orchestration に専念 |
| `apps/api/src/middleware/require-admin.ts` | 自前 JWT 検証 + `isAdmin` 判定が密結合 | session 検証部分を `verifySessionJwt()` に委譲し、`isAdmin` 判定のみ自身に残す | 検証ロジック重複を排除。admin 固有判定（role）は責務として分離 |
| `apps/api/src/middleware/session-guard.ts` | 自前 JWT 検証 | `verifySessionJwt()` を呼ぶ | 同上 |

> 抽出後、`verifySessionJwt` は `isAdmin` を判定しない（admin 固有の role 判定は `require-admin.ts` 側に残す）。これにより `require-public-access` は role 不問で「有効 session かどうか」のみを使える。

### 手順 3: 命名整合チェック

| 種別 | 規則 | 本リファクタの命名 |
|------|------|-------------------|
| middleware ファイル | kebab-case | `verify-session-jwt.ts`（middleware ではなく `lib/auth/` 配置） |
| 公開関数（helper） | `verbNoun`（`verifySessionJwt`） | `verifySessionJwt` |
| middleware export | `requireXxx` | `requirePublicAccess` / `requireAdmin`（不変） |

- helper は middleware ではないため `lib/auth/` に配置し、`requireXxx` 命名は使わない（役割が「検証関数」であり「ゲート」ではないため）。

### 手順 4: 重複0確認（M-1 解決確認は Phase 9）

```bash
# 抽出後、JWT decode 実体が helper 1 箇所のみであることを確認
grep -rn "verify.*jwt\|jwtVerify" apps/api/src

# authjs.session-token のリテラルが helper に集約されたことを確認
grep -rn "authjs.session-token" apps/api/src
```

期待: JWT decode の実体は `verify-session-jwt.ts` の 1 箇所。`require-admin.ts` / `session-guard.ts` / `require-public-access.ts` は helper 呼び出しのみ（実装本体の重複が 0）。

### 手順 5: 全 TC GREEN 維持確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test \
  src/middleware/require-public-access.spec.ts \
  src/middleware/require-admin.spec.ts \
  src/middleware/session-guard.spec.ts \
  src/routes/public/index.contract.spec.ts
```

- リファクタは外部挙動不変のため、Phase 4/6 の全 TC が GREEN を維持すること（インターフェース不変）。
- 既存 `require-admin` / `session-guard` のテストも GREEN を維持すること（回帰なし）。

## 統合テスト連携

- 共通ヘルパー抽出後、`require-public-access` の session 経路 TC（TC-API-200-SESSION）と `require-admin` の admin 判定 TC が同一ヘルパーを経由する。
- session 検証の単体テスト（`verify-session-jwt.spec.ts`）を追加し、cookie/Bearer 両経路・無効 token を直接検証する。

## 多角的チェック観点（AIが判断）

- システム系: session 検証の状態所有権を helper に集約し、`require-admin`（role 判定）と `require-public-access`（gate orchestration）の責務を分離。混在を解消。
- 問題解決系: 重複は「公開境界の検証ロジックが分散すると 1 箇所修正漏れで認証バイパスを生む」リスク。SSOT 化で再発防止。

## サブタスク管理

- [ ] JWT 検証重複を grep で検出した
- [ ] `verify-session-jwt.ts` を抽出した
- [ ] 3 ファイルを helper 呼び出しへ置換した（`対象/Before/After/理由` 記録）
- [ ] 命名整合を確認した
- [ ] 全 TC GREEN を再実行で確認した

## 成果物

| 成果物 | 配置 |
|--------|------|
| リファクタリング（本書） | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/phase-8.md` |
| リファクタ実施ログ | `docs/30-workflows/completed-tasks/require-auth-public-access-gate/outputs/phase-8/refactor-result.md` |

## 完了条件

- [ ] `対象/Before/After/理由` テーブルが記載されている
- [ ] JWT 検証 helper が抽出され、3 ファイルが呼び出しに統一されている
- [ ] 命名整合（`requireXxx` / `verbNoun`）が確認されている
- [ ] 全 TC GREEN が維持されている

## タスク100%実行確認【必須】

- [ ] M-1（JWT 検証重複）を共通ヘルパー抽出で解消し、全 TC GREEN を維持した

## 次Phase

[phase-9.md](phase-9.md) — 品質保証（typecheck / lint / token gate / mirror parity / 回帰）
