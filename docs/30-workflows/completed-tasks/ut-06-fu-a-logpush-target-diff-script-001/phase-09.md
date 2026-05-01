# Phase 9: 品質保証（QA）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | production observability target diff script (UT-06-FU-A-LOGPUSH-TARGET-DIFF-SCRIPT-001) |
| Phase 番号 | 9 / 13 |
| Phase 名称 | 品質保証 |
| 作成日 | 2026-05-02 |
| 前 Phase | 8 (リファクタリング) |
| 次 Phase | 10 (最終レビューゲート) |
| 状態 | spec_created |
| タスク分類 | quality-assurance（typecheck / lint / shellcheck / golden / no-secret-leak audit） |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Phase 8 までで完成した script 本体（`scripts/observability-target-diff.*` 配置・Phase 2 で確定）と redaction module、テスト群（Phase 4-7）に対して、**typecheck / lint / shellcheck / unit & golden test / redaction grep audit / no-secret-leak audit / `bash scripts/cf.sh` ラッパー一本化監査** の 7 観点で品質を最終検証する。Phase 10 GO 判定に渡す客観的根拠を揃える。本タスクは UI を持たず NON_VISUAL のため、a11y は対象外。代替指標として AC 充足率 / TC PASS 率 / redaction unit pass 率を実測値で記録する。

## 実行タスク

1. typecheck / lint を実行する（完了条件: `pnpm typecheck` / `pnpm lint` 全 PASS）。
2. shellcheck（script が bash の場合）を実行する（完了条件: warnings 0）。
3. unit + golden test を全実行する（完了条件: TC-01〜TC-08 + Phase 6 拡張 TC が全 PASS）。
4. redaction grep audit を実行する（完了条件: golden / 実 output ファイルに token-like / `Bearer ` / 32桁hex 等が 0 件）。
5. no-secret-leak audit を実行する（完了条件: `git diff` / `outputs/` 以下に `CLOUDFLARE_API_TOKEN=` / OAuth token / sink URL token が 0 件）。
6. `bash scripts/cf.sh` ラッパー一本化監査（完了条件: script 内・runbook 内に `wrangler ` 直呼びが 0 件）。
7. 1Password 参照ルール監査（完了条件: 実 secret 値直書き 0 件、`op://` 参照のみ）。
8. AC 網羅性最終確認（完了条件: AC-1〜AC-5 が TC / unit / golden で全 PASS）。

## 静的検証

| チェック | コマンド | 期待 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| shellcheck | `shellcheck scripts/observability-target-diff.sh` | warning 0 |
| markdown lint | 既存 lefthook 規則 | エラー 0 |
| 内部リンク | runbook / phase-XX.md の相対参照 | リンク切れ 0 |

## redaction grep audit（機械検証）

```bash
# 1. golden ファイル群に token-like 文字列が混入していないこと
grep -rEn 'ya29\.|^Bearer |sk-[A-Za-z0-9]{20,}|[0-9a-f]{32}' \
  tests/golden/observability-target-diff/ \
  || echo "OK: no token-like in golden"
# 期待: マッチ 0 件

# 2. 実 dry-run 出力（`outputs/phase-09/sample-run.md`）に token が混入していないこと
grep -rEn 'ya29\.|^Bearer |Authorization:|X-Auth-|sk-[A-Za-z0-9]{20,}' \
  outputs/phase-09/sample-run.md \
  || echo "OK: no token-like in sample"
# 期待: マッチ 0 件

# 3. JWT 構造の検出
grep -rEn 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.' outputs/phase-09/ tests/golden/ \
  || echo "OK: no JWT"
# 期待: マッチ 0 件
```

## no-secret-leak audit

```bash
# 1. 実 secret 直書き検出
grep -rEn '^[A-Z_]+=[A-Za-z0-9]{16,}' \
  scripts/observability-target-diff.* \
  outputs/ tests/golden/ tests/fixtures/
# 期待: 0 件（fixtures/golden に書く場合は明示的に MOCK プレフィックス必須）

# 2. account ID full 表示の検出
grep -rEn '[0-9a-f]{32}' outputs/phase-09/sample-run.md
# 期待: 0 件（account ID は末尾 4 桁のみ表示すべき）

# 3. CLOUDFLARE_API_TOKEN 直書き
git diff main..HEAD | grep -nE 'CLOUDFLARE_API_TOKEN=[A-Za-z0-9_-]{20,}'
# 期待: 0 件
```

## `bash scripts/cf.sh` ラッパー一本化監査

```bash
# 1. script 本体内で wrangler 直呼びを禁止
grep -nE '^[^#]*wrangler ' scripts/observability-target-diff.* \
  | grep -v 'bash scripts/cf.sh' \
  || echo "OK: wrapper enforced"
# 期待: 0 件

# 2. runbook / phase-XX.md 内のコマンド例
grep -rnE '^\+?[^#]*wrangler ' \
  docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/ \
  | grep -v 'bash scripts/cf.sh'
# 期待: 0 件

# 3. wrangler login / config の検出
grep -rnE 'wrangler login|\.wrangler/config|default\.toml' \
  docs/30-workflows/ut-06-fu-a-logpush-target-diff-script-001/ \
  scripts/observability-target-diff.*
# 期待: 0 件
```

## AC 網羅性最終確認

| AC# | AC 内容 | カバー TC | unit/golden | 最終判定 |
| --- | --- | --- | --- | --- |
| AC-1 | 新 / 旧 Worker の observability target を一覧化 | TC-01〜TC-04 | golden 一致 | 要 PASS |
| AC-2 | token / secret / sink credential が出力に 0 件 | TC-05, TC-06 | redaction grep | 要 PASS |
| AC-3 | Workers Logs / Tail / Logpush / Analytics Engine の 4 軸網羅 | TC-02〜TC-04, TC-07 | golden | 要 PASS |
| AC-4 | 親 runbook からの導線追加 | Phase 5 で runbook 追記 | manual check | 要 PASS |
| AC-5 | `bash scripts/cf.sh` ラッパー経由でのみ実行可能 | TC-08 | fail-fast unit | 要 PASS |

> 空セル禁止。1 つでも要 PASS が FAIL なら Phase 5 / 6 / 8 へ差し戻し。

## 代替指標 3 種の実測値（Phase 7 引き継ぎ）

| 指標 | 目標値 | 実測値（Phase 9 取得） | 出力先 |
| --- | --- | --- | --- |
| AC 充足率 | 100%（5/5） | 本 Phase で取得 | `outputs/phase-09/coverage-actual.md` |
| TC PASS 率 | 100%（TC-01〜TC-08 + 拡張） | 同上 | 同上 |
| redaction unit pass 率 | 100%（redaction 不変条件 5 項目） | 同上 | 同上 |

## a11y / mirror parity（N/A 判定）

- 本タスクは CLI script + redacted markdown 出力のみで UI を持たない。WCAG 2.1 観点は **対象外**。
- skill mirror（`.claude/` ↔ `.agents/`）への影響は無い（本タスクは skill 資源を更新しない）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-04/golden-output-spec.md` | redaction 不変条件・golden 雛形 |
| 必須 | `outputs/phase-07/ac-matrix.md` | AC × TC マトリクス |
| 必須 | `outputs/phase-08/main.md` | リファクタ後の最終 script 構造 |
| 必須 | `CLAUDE.md` | Cloudflare CLI 実行ルール |
| 必須 | `docs/30-workflows/unassigned-task/UT-06-FU-A-logpush-target-diff-script-001.md` | 原典仕様 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | `outputs/phase-09/main.md` | QA 結果サマリー（7 観点） |
| ドキュメント | `outputs/phase-09/quality-gates-report.md` | typecheck / lint / shellcheck / test 実行ログ |
| ドキュメント | `outputs/phase-09/secret-leak-audit.md` | redaction grep + no-secret-leak audit 結果 |
| ドキュメント | `outputs/phase-09/coverage-actual.md` | 代替指標 3 種の実測値 |
| ドキュメント | `outputs/phase-09/sample-run.md` | dry-run 実行サンプル（redacted） |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 10 | AC 網羅性 / redaction audit / no-secret-leak audit を GO/NO-GO 根拠に使用 |
| Phase 11 | NON_VISUAL evidence（golden 一致 + redaction grep + cf.sh wrapper 実行ログ）の前提確定 |
| Phase 12 | implementation-guide / system-spec-update に script 導線追加 |
| 親 UT-06-FU-A | 本タスクの runbook 追記が cutover 前検証ゲートで参照される |

## 多角的チェック観点

- 価値性: redaction 不変条件が grep ベースで機械検証され、token 漏洩リスクが排除されている
- 実現性: 検証コマンドが grep / shellcheck / pnpm 標準で再現可能で CI 化容易
- 整合性: AC-1〜AC-5 が TC / golden / unit で 1:1 以上でカバー
- 運用性: golden 更新時の review 手順が `outputs/phase-09/quality-gates-report.md` で再現可能
- セキュリティ: token / secret / sink credential / account ID / OAuth が出力に 0 件
- CLI 統制: `wrangler` 直呼び 0 件 / `wrangler login` 経路 0 件

## 完了条件チェックリスト

- [ ] `pnpm typecheck` / `pnpm lint` exit 0
- [ ] `shellcheck` warning 0（bash 採用時）
- [ ] TC-01〜TC-08 + 拡張 TC が全 PASS
- [ ] redaction grep audit で token-like 0 件
- [ ] no-secret-leak audit で 0 件
- [ ] `wrangler` 直呼び script / docs 内に 0 件
- [ ] `wrangler login` / `.wrangler/config` 経路 0 件
- [ ] AC-1〜AC-5 全 PASS（AC 網羅性表）
- [ ] 代替指標 3 種の実測値が `coverage-actual.md` に記録
- [ ] a11y 対象外 / mirror parity N/A が明記

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | typecheck / lint | spec_created |
| 2 | shellcheck | spec_created |
| 3 | unit + golden test 全実行 | spec_created |
| 4 | redaction grep audit | spec_created |
| 5 | no-secret-leak audit | spec_created |
| 6 | cf.sh ラッパー一本化監査 | spec_created |
| 7 | 1Password 参照ルール監査 | spec_created |
| 8 | AC 網羅性最終確認 | spec_created |
| 9 | 代替指標実測値転記 | spec_created |

## 次 Phase への引き継ぎ事項

- 全 7 観点の audit 結果を Phase 10 GO 判定の入力にする
- redaction unit pass 率 / golden 一致率を Phase 11 NON_VISUAL evidence のテキスト証跡として転記
- ブロック条件:
  - typecheck / lint / shellcheck / test の 1 件でも FAIL
  - redaction / no-secret-leak audit で 1 件でも検出
  - AC-1〜AC-5 のいずれか FAIL
