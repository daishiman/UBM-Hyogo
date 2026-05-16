# Phase 9: 品質保証

## メタ情報

| 項目      | 値                                                                    |
| --------- | --------------------------------------------------------------------- |
| Phase     | 9                                                                     |
| 機能名    | serial-05-step-02-identity-conflicts-merge                            |
| 実装区分  | 実装仕様書                                                            |
| 作成日    | 2026-05-16                                                            |
| 前提Phase | Phase 8（リファクタ完了）                                             |
| 元仕様    | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/serial-05-admin-mutation-ui/step-02-identity-conflicts-merge/spec.md` |

## 目的

step-02 で追加した admin/identity-conflicts inline merge confirmation panel 実装が、定義された品質基準（typecheck / lint / coverage / unit / smoke / coverage-guard / design-token grep gate）をすべて満たすことを最終検証する。

## 品質ゲート

- 機能検証: 自動テスト（unit + smoke）の完全成功
- コード品質: `pnpm typecheck` / `pnpm lint` クリア
- テスト網羅性: coverage Statements / Branches / Functions / Lines が **すべて 80% 以上**
- coverage-guard: `bash scripts/coverage-guard.sh` が **exit 0**
- design-token grep gate: `bg-[#`, `text-[#`, `border-[#`, `#[0-9a-fA-F]{3,6}` の直書きが対象ファイル群に **0 件**
- セキュリティ: PII（email 等）が log / metrics / error stack に漏出していない
- a11y: textarea label / inline alert / aria-live が test で担保されている
- error handling: 400（TARGET_MEMBER_MISMATCH） / 409（ALREADY_MERGED）が toast 表示で正しく hand off されている

## 統合テスト連携【必須】

| 品質項目         | 確認内容                                                         | 結果       |
| ---------------- | ---------------------------------------------------------------- | ---------- |
| 機能検証         | unit test 全 green                                               | {{RESULT}} |
| 型チェック       | `pnpm typecheck` exit 0                                          | {{RESULT}} |
| Lint             | `pnpm lint` exit 0                                               | {{RESULT}} |
| Coverage         | Statements/Branches/Functions/Lines すべて >= 80%                | {{RESULT}} |
| coverage-guard   | `bash scripts/coverage-guard.sh` exit 0                          | {{RESULT}} |
| Smoke            | `pnpm e2e:smoke` PASS（`/admin/identity-conflicts` 含む）        | {{RESULT}} |
| design token gate| `bg-[#` / `text-[#` / `border-[#` 直書き 0                       | {{RESULT}} |
| a11y             | inline panel a11y test green                                            | {{RESULT}} |
| 409/400 handling | error toast 表示の unit test green                               | {{RESULT}} |
| PII redact       | log / metrics に email 等が生値で残らない                        | {{RESULT}} |

## 成果物

| 成果物             | パス                                       | 説明                                    |
| ------------------ | ------------------------------------------ | --------------------------------------- |
| 品質レポート       | `outputs/phase-09/quality-report.md`        | 全品質ゲート結果                        |
| Coverage 出力      | `outputs/phase-09/coverage-summary.txt`     | vitest --coverage 出力サマリ            |
| design-token grep  | `outputs/phase-09/design-token-grep.txt`    | grep gate 実行結果                      |
| coverage-guard log | `outputs/phase-09/coverage-guard.log`       | `bash scripts/coverage-guard.sh` 出力   |

## テスト実行コマンド

```bash
# 1. 型チェック
pnpm typecheck

# 2. Lint
pnpm lint

# 3. unit test (focus)
pnpm --filter @ubm-hyogo/web test -- IdentityConflictRow.spec.tsx

# 4. unit test 全体 + coverage
pnpm --filter @ubm-hyogo/web test:coverage

# 5. coverage-guard（必須・exit 0）
bash scripts/coverage-guard.sh
echo "coverage-guard exit: $?"

# 6. design-token grep gate
rg -n 'bg-\[#|text-\[#|border-\[#' apps/web/app/\(admin\)/admin/identity-conflicts apps/web/src/features/admin/_identity-conflicts 2>&1 | tee outputs/phase-09/design-token-grep.txt
rg -n '#[0-9a-fA-F]{3,6}\b' apps/web/app/\(admin\)/admin/identity-conflicts -g '!*.spec.tsx' 2>&1 | tee -a outputs/phase-09/design-token-grep.txt

# 7. smoke
pnpm e2e:smoke
```

## 完了条件

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm --filter @ubm-hyogo/web test:coverage` 全 green
- [ ] Coverage **Statements >= 80% / Branches >= 80% / Functions >= 80% / Lines >= 80%**（vitest coverage summary で確認）
- [ ] `bash scripts/coverage-guard.sh` **exit 0**（必須）
- [ ] design-token grep gate でヒット 0（`bg-[#`, `text-[#`, `border-[#`, HEX 直書き）
- [ ] `pnpm e2e:smoke` PASS（`/admin/identity-conflicts` 経路含む）
- [ ] inline confirmation a11y（label, role=alert, disabled state）が test で検証済
- [ ] 409 ALREADY_MERGED / 400 TARGET_MEMBER_MISMATCH の error toast unit test green
- [ ] 統合テスト結果が `outputs/phase-09/quality-report.md` に記録されている
- [ ] **本Phase内の全タスクを100%実行完了**

### PII redact checklist【Phase 9 品質ゲート・標準】

- [ ] **log redact 確認**: merge 実行時の Workers ログに raw email が生値で出ていない（masked / hash / 省略済み）
- [ ] **metrics_json PII 排除確認**: Analytics Engine 等送信 payload に email / responseId が生値で含まれていない
- [ ] **error stack redact**: 400 / 409 error response handling で stack trace に reason 入力値が出力されていない
- [ ] **Secrets vs Variables**: API token 等が Cloudflare Secrets 側に格納され、`wrangler.toml [vars]` に機密が混入していない

## タスク100%実行確認【必須】

- [ ] 上記「完了条件」の全項目を満たし、未完了を残さない（CONST_007 先送り禁止）
- [ ] coverage / coverage-guard / design-token grep / smoke の 4 つの ゲートが**全て PASS** していることを `quality-report.md` で個別 evidence 付きで確認
- [ ] 未達があった場合は Phase 8 へ差し戻して修正、その後再実行（最大 2 cycle）

## 次のPhase

Phase 10: 最終レビューゲート
