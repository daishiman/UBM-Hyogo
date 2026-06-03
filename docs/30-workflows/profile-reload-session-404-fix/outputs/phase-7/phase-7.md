# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 6 で確定したテスト群が、本サイクルで**変更・新規追加するブロックに限定**して line / branch を充足することを、対象ファイル・対象関数・実測予定値の表で固定する。カバレッジ目標は apps 全体の一律閾値ではなく、T01〜T03 が触れる関数・分岐に限定して評価する（広域指定にしない）。

## 実行タスク

### 7.1 カバレッジ対象範囲（限定スコープ）

| タスク | 変更/新規ファイル | カバレッジ評価対象ブロック | 評価対象外 |
|--------|-------------------|----------------------------|-----------|
| T01 | `apps/api/src/middleware/trailing-slash.ts`（新規） | 正規化関数本体（末尾スラッシュ判定 / `/` 単独除外 / OPTIONS 非干渉 / 308 生成 / query 保持） | 既存 `securityHeaders` 等の他 middleware |
| T01 | `apps/api/src/index.ts`（編集） | 追加した `app.use("*", trailingSlash)` 登録 1 行（mount 順） | 既存の全 route 登録（変更しない） |
| T02 | `apps/web/app/api/me/[...path]/route.ts`（編集） | `target` URL 構築の三項分岐（`tail` 有/無） | proxy の cookie/認証透過ロジック（変更しない） |
| T03 | `apps/web/app/(member)/profile/page.tsx`（編集） | `!meResult.ok` 内の error code 分岐（`MEMBER_SESSION_404` / それ以外 / 401 rethrow） | プロフィール本体描画（既存） |
| T03 | `apps/web/src/components/member/SectionError.tsx`（編集） | `actionHref && actionLabel` の描画分岐 | 既存 title/detail/retryHref 描画 |

### 7.2 変更ブロックの line / branch 実測予定値

| 対象ブロック | 関数 / 箇所 | line 予定 | branch 予定 | 充足テスト |
|--------------|-------------|-----------|-------------|-----------|
| trailing-slash 正規化本体 | `trailing-slash.ts` 正規化関数 | 100%（全 statement 実行） | 100%（末尾`/`有/無 × `/`単独 × OPTIONS × query有/無 の全分岐） | TS-1〜TS-6 |
| middleware 登録 | `index.ts` `app.use("*", ...)` 行 | 100% | 分岐なし（無条件登録） | MM-1〜MM-5 経由で実行 |
| proxy URL 三項 | `route.ts` `tail ? \`/${tail}\` : ""` | 100% | 100%（`tail` truthy / falsy 両分岐） | PX-1（falsy）/ PX-2〜PX-5（truthy） |
| profile error 分岐 | `page.tsx` `meResult.error.code` 判定 | 100% | 100%（`MEMBER_SESSION_404` / else / 401 rethrow の 3 分岐） | PF-1 / PF-2 / PF-3 |
| SectionError CTA 分岐 | `SectionError.tsx` `actionHref && actionLabel` | 100% | 100%（両 truthy / 片方欠落 / 両欠落） | SE-1 / SE-2 / SE-4 |

> line/branch は上表のとおり**変更ブロックで 100%** を充足予定値とする。新規追加コードはすべて Phase 6 のテストで分岐被覆されるため、未到達分岐を残さない設計とする。

### 7.3 coverage-guard 整合

- `bash scripts/coverage-guard.sh --changed` は変更行に対する被覆を判定する。本サイクルの変更行はすべて 7.2 の対象ブロックに含まれ、Phase 6 のテストで到達するため、changed-line coverage は閾値を割り込まない。
- sync-merge の merge commit は CLAUDE.md 記載のとおり coverage-guard を自動スキップする対象であり、本タスクの feature commit には適用される。

### 7.4 カバレッジ計測コマンド（限定実行）

| 対象 | コマンド |
|------|---------|
| T01 (api) | `mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run --coverage src/middleware/__tests__/trailing-slash.spec.ts src/__tests__/me-route-mount.integration.spec.ts` |
| T02/T03 (web) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --coverage "app/api/me/[...path]/route.route.spec.ts" "app/(member)/profile/page.spec.tsx" src/components/member/__tests__/SectionError.spec.tsx` |

計測後、`coverage/` レポートで 7.1 の対象ファイルのみを確認し、7.2 の line/branch 予定値（変更ブロック 100%）と一致することを判定する。

## 完了条件

- [x] カバレッジ評価対象を変更ファイル / 変更ブロックに限定（広域一律指定にしない）
- [x] 各変更ブロックの line / branch 実測予定値（100%）と充足テストを対応付け
- [x] coverage-guard（changed-line）との整合を明示
- [x] 限定スコープのカバレッジ計測コマンドを固定

## 成果物

- `outputs/phase-7/phase-7.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 系 path 一覧（変更対象外の境界確認） |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 分岐（profile error 分岐の根拠） |

- `outputs/phase-6/phase-6.md`（テストケース TS/MM/PX/PF/SE）
- `outputs/phase-3/phase-3.md`（変更ファイル俯瞰）

## 統合テスト連携

7.2 の変更ブロック被覆を Phase 9 の品質保証（typecheck/lint/対象 vitest 一括）と同時に確認し、未到達分岐ゼロを最終レビュー（Phase 10）の AC-8 充足判定へ引き継ぐ。
