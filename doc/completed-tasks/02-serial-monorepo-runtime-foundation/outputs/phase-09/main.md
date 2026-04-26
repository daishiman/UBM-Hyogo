# Phase 9: 品質保証 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 状態 | completed |
| 作成日 | 2026-04-26 |

## 命名規則チェック

| 対象 | 基準 | 期待値 | 判定 |
| --- | --- | --- | --- |
| task dir | wave + mode + kebab-case | `02-serial-monorepo-runtime-foundation` | PASS |
| branch 名 | docs/feature/fix + kebab-case | `docs/02-serial-monorepo-runtime-foundation-task-spec` | PASS |
| secret 名 | ALL_CAPS_SNAKE_CASE | `AUTH_SECRET` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | PASS |
| app dir | apps/web / apps/api（kebab-case） | そのまま維持 | PASS |
| package dir | packages/shared / packages/integrations（kebab-case） | そのまま維持 | PASS |
| wrangler.toml | apps/web / apps/api それぞれに独立した toml | 分離構成確認済み | PASS |
| env var prefix | AUTH_*（Auth.js v5 から NEXTAUTH_* 廃止） | `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | PASS |

## 参照整合性チェック

| チェック項目 | 状態 | 備考 |
| --- | --- | --- |
| index.md の Phase 一覧が 1〜13 を網羅 | PASS | 全 phase が index.md に記載 |
| artifacts.json の outputs パスが実際のファイルと一致 | PENDING（Phase 12 完了後に最終確認） | artifacts.json 更新は Phase 12 で実施 |
| phase-05/foundation-bootstrap-runbook.md が存在 | PASS | 作成済み |
| phase-08/dependency-boundary-rules.md が存在 | PASS | 作成済み |
| downstream task 参照パスが存在 | PASS | foundation-bootstrap-runbook.md の downstream 参照表で明記 |
| .claude/skills/aiworkflow-requirements/references/ の参照が生きている | PASS | 全 5 ファイルが存在確認済み |

## 無料枠遵守チェック

| チェック項目 | 状態 | 備考 |
| --- | --- | --- |
| Workers バンドルサイズ（3MB 制限） | PASS | Node v24.15.0 で OpenNext build PASS。`worker.js` 2,278 bytes / assets 約 644KB |
| Pages build budget（500ビルド/月） | 対象外 | Web は OpenNext Workers 方針。本番デプロイはスコープ外 |
| 常設通知や有料サービスの前提 | なし | 不変条件として確認済み |
| D1 無料枠（5GB / 500万読み取り/日） | 言及なし（本番デプロイはスコープ外） | 下流 task で確認 |

## Secrets 漏洩チェック

| チェック項目 | 状態 |
| --- | --- |
| 実値（token, credential, password）の記述 | なし（全 phase で確認済み） |
| 1Password を local canonical として記述 | PASS（version-policy.md で明記） |
| Cloudflare と GitHub の配置先の混線 | なし（PASS） |
| Auth.js v5 の AUTH_SECRET が Cloudflare Secrets に配置されることを記述 | PASS |
| D1 の database_id（wrangler.toml に存在）の扱い | wrangler.toml は public 設定（非機密）のため記録可 |

## AC 全項目確認

| AC | 判定 | 根拠ファイル |
| --- | --- | --- |
| AC-1 | PASS | outputs/phase-02/runtime-topology.md |
| AC-2 | SPEC-PASS_WITH_SYNC（TS 6.x 同期必須） | outputs/phase-02/version-policy.md |
| AC-3 | PASS | outputs/phase-08/dependency-boundary-rules.md |
| AC-4 | SPEC-PASS_WITH_SYNC（正本仕様同期必須） | phase-02 設定値表 + phase-03 代替案 |
| AC-5 | PASS | outputs/phase-05/foundation-bootstrap-runbook.md |

## 4条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | 命名規則・参照整合性・無料枠・Secrets の品質を一括保証 |
| 実現性 | PASS | rg コマンド、ファイル確認、`pnpm typecheck`、Phase 11 screenshot で確認 |
| 整合性 | PASS | 全 phase の表記が DRY 化（Phase 8）後に整合している |
| 運用性 | PASS | Phase 10 へ引き継ぎ可能な状態 |

## Phase 9 → Phase 10 handoff

| 引き継ぎ事項 | 内容 |
| --- | --- |
| AC 全項目の判定 | AC-2, AC-4 が SPEC-PASS_WITH_SYNC（Phase 12 同期必須） |
| blocker | なし |
| Phase 10 での確認 | AC 全項目 PASS 判定表を作成し、GO/NO-GO を判定 |

## 完了条件チェック

- [x] 主成果物が作成済み
- [x] 正本仕様参照が残っている
- [x] downstream handoff が明記されている
