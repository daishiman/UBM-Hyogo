# Phase 10: 最終レビュー — issue-230-lefthook-edit-guard

> 実装完了物が AC-1..AC-4 / R-1..R-4 / 不変条件（index.md §3）を漏れなく満たすことを 1:1 トレースで最終確認する。
> このフェーズはコードを変更しない（検証のみ）。乖離があれば Phase 5-8 へ差し戻す。

## 10.1 AC / R 最終トレース表（1:1）

各行は「要件 → 充足根拠（spec ケース / メッセージ文字列 / script ロジック）」を 1 対 1 で対応させる。

| AC | R | 充足根拠（spec ケース） | 充足根拠（メッセージ / ロジック文字列） |
|----|---|------------------------|------------------------------------------|
| AC-1 (local) | R-1 | guard spec「手書き `.git/hooks/pre-commit` 追加 → exit 1」 | `print_handwritten_hook_block` が offender 一覧を stderr 出力後 `exit 1` |
| AC-1 (CI 面) | R-1 | integrity spec「`run:` 参照 script 欠落 → exit 1」 / 「tracked stray hook 影 → exit 1」 | `::error::lefthook.yml references missing script:` / `::error::tracked stray git-hook shadow files detected:` |
| AC-2 | R-2 | guard spec「`lefthook.yml` stage + ack 無 → exit 1」「ack 有 → exit 0」 | `LEFTHOOK_EDIT_ACK=1` env 判定（`[ "${LEFTHOOK_EDIT_ACK:-}" != "1" ]`）+ `print_lefthook_edit_block` |
| AC-3 | R-3 | guard spec「block 出力に 3 文字列を含む」grep assertion | `LEFTHOOK_EDIT_ACK=1` / `CLAUDE.md「Git hook の方針」` / `docs/00-getting-started-manual/lefthook-operations.md`（`print_policy_footer`） |
| AC-4 | R-4 | guard spec「`pre-commit.sample` のみ → pass」「lefthook 署名 hook → pass」「`MERGE_HEAD` 存在 → exit 0」 | `case "$f" in *.sample) continue;;` / `grep -qiE 'LEFTHOOK\|lefthook'` 除外 / `in_special_git_state && exit 0` |

> AC-2 の「review 必須化」literal は solo 運用（`required_pull_request_reviews=null`）で不採用、**ack ゲート**で代替（index.md §0 / Phase 1.5）。AC-1 の「CI で `.git/hooks` 検知」literal は `.git/` が repo 管理外で観測不能なため、**local pre-commit + CI integrity（SSOT 整合）**へ再配置済（index.md §0）。

## 10.2 不変条件（index.md §3）遵守確認表

| # | 不変条件 | 遵守根拠 | 判定 |
|---|---------|---------|------|
| 1 | `lefthook.yml` が hook 正本・手書き `.git/hooks/*` 禁止（CLAUDE.md） | guard が手書き hook を検知し block。正本逸脱を機械強制 | ✅ |
| 2 | 新規 test は `*.spec.{ts,tsx}` のみ | `lefthook-edit-guard.spec.ts` / `verify-hook-integrity.spec.ts` のみ追加（`*.test.ts` 無し） | ✅ |
| 3 | guard は `set -euo pipefail` + merge/rebase/cherry-pick 中 skip | 両 script 冒頭 `set -euo pipefail`。guard は `in_special_git_state`（MERGE/REBASE/CHERRY_PICK/REVERT_HEAD）で早期 exit 0 | ✅ |
| 4 | CI workflow `permissions` は `contents: read` 最小権限 | `verify-hook-integrity.yml` が `permissions: contents: read`（既存 verify-*.yml 踏襲） | ✅ |
| 5 | guard fail_text / メッセージに CLAUDE.md hook 方針 + lefthook-operations.md リンクを含む | `print_policy_footer` + lefthook.yml `fail_text` 双方に導線（AC-3） | ✅ |
| 6 | 1Password 参照系・秘密値を一切 echo しない | 両 script は `.env` / `cf.sh` / token に触れず、lefthook.yml と `.git/hooks` のみ参照 | ✅ |

## 10.3 設計レビュー補正（Phase 3.4）の反映確認

| 補正 | 反映確認 | 判定 |
|------|---------|------|
| 3.4-1 worktree hooks dir | `resolve_git_common_dir` が `git rev-parse --git-common-dir` を使用（`--git-dir` でない）。worktree fixture spec で検証 | ✅ |
| 3.4-2 `while read` サブシェル / `set -e` | `offenders` 累積は process substitution（`done < <(find ...)`）。`grep`/`git diff` no-match は `\|\| true`/`continue` で握る | ✅ |
| 3.4-3 integrity 参照抽出 | `run:` 行から第 2 トークン（スクリプトパス）抽出。`--changed` 等の引数を誤検出しない正規表現 | ✅ |

## 10.4 スコープ境界の最終確認（CONST_007）

| 含む（垂直スライス） | 状態 |
|---------------------|------|
| guard + lefthook.yml 編集 + guard spec（Task A） | 実装完了 |
| integrity script + CI workflow + integrity spec（Task B） | 実装完了 |
| lefthook-operations.md + CLAUDE.md 追記（Task C） | 実装完了 |

| 含まない（明確な理由による除外） | 理由 |
|--------------------------------|------|
| `.git/hooks` の **CI** 検知 | `.git/` は repo 管理外で CI checkout に現れず観測不能（local pre-commit で代替） |
| `lefthook.yml` 必須レビュー | solo 運用 `required_pull_request_reviews=null`（ack + CI integrity で代替） |

## 10.5 最終ゲート判定

| 条件 | 判定 |
|------|------|
| AC-1..AC-4 が R-1..R-4 経由で 1:1 充足（§10.1） | PASS |
| 不変条件 6 項目すべて遵守（§10.2） | PASS |
| Phase 3.4 補正すべて反映（§10.3） | PASS |
| スコープ境界が垂直スライスで閉じている（§10.4） | PASS |
| Phase 9 DoD 全項目 ✅ | PASS（Phase 9 参照） |

→ **Phase 11（手動テスト / NON_VISUAL 証跡）・Phase 12（ドキュメント）・Phase 13（PR）へ進行可**。

## 完了条件（Phase 10）

- [ ] §10.1 で AC-1..AC-4 が R-1..R-4 / spec ケース / メッセージ文字列に 1:1 トレースされ、未充足が 0 である
- [ ] §10.2 で不変条件 6 項目すべてが遵守根拠付きで ✅ である
- [ ] §10.3 で Phase 3.4 の 3 補正がすべて実装へ反映されている
- [ ] §10.4 でスコープ境界（含む / 含まない）が当初設計どおり閉じている
- [ ] §10.5 最終ゲートが全 PASS で、後続 Phase 11-13 への進行が承認された
