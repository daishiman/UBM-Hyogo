# Phase 9: 品質検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 / 13 |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |

## 目的

実装変更後にリポジトリ全体の typecheck / lint / coverage / yml lint を実行し、回帰がないことを保証する。

## 品質検証マトリクス

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| 依存解決 | `mise exec -- pnpm install --frozen-lockfile` | exit 0 |
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| coverage | `bash scripts/coverage-guard.sh` | exit 0 |
| yamllint | `yamllint .github/workflows/ci.yml` | exit 0 |
| workflow 表示 | `gh workflow view ci.yml` | `coverage-gate` 定義に `continue-on-error` なし |

## 自動修復ループ

| 失敗 | 修復方針 |
| --- | --- |
| typecheck | 本タスク差分は yml のみ。typecheck 失敗は別 task の取り込みによる。Task C/D を疑い差戻し |
| lint | 同上 |
| coverage | Task C/D 差戻し |
| yamllint | Phase 5 の編集ミスを修正 |

最大 3 回まで自動修復。それ以上は Phase 2 へ戻し設計再検討。

## 成果物

- `outputs/phase-9/quality-verification.md`（各コマンドの実行結果ログ summary）

## 完了条件

- [ ] 6 検証すべて exit 0
- [ ] coverage Statements / Branches / Functions / Lines ≥80%（apps/api / apps/web / packages/* 全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0

## タスク 100% 実行確認【必須】

- [ ] 自動修復ループの上限が明記されている

## 次 Phase

Phase 10（最終レビュー）。
