# Phase 7: AC M-08 / M-09 / M-10 / M-16 判定 — 06b-c-runtime-evidence-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-c-runtime-evidence-execution |
| phase | 7 / 13 |
| 作成日 | 2026-05-04 |
| taskType | implementation（execution） |
| user_approval_required | false |

## 目的

Phase 6 検査結果を AC matrix に落とし込み、各 marker を `OK` / `FAIL` / `BLOCKED` のいずれかで判定する。判定根拠と evidence path を 1 marker = 1 行で確定する。

## AC matrix（記入テンプレート）

| Marker | AC 内容 | OK 判定基準 | FAIL 判定基準 | BLOCKED 判定基準 | 判定 evidence path |
| --- | --- | --- | --- | --- | --- |
| M-08 | logged-in `/profile` screenshot が desktop / mobile で保存 | 2 ファイルとも存在 + redaction 済 + 解像度基準 OK | 1 ファイル以上欠落 / redaction 漏洩 / 真っ白画像 | storageState 期限切れで取得できない等の環境要因 | `outputs/phase-11/screenshots/M-08-desktop-*.png` / `M-08-mobile-*.png` |
| M-09 | 本文編集 form / input / textarea / submit が 0 件 | DOM dump JSON の `counts` 全 key が 0 (desktop / mobile 両方) | 1 つでも > 0（**invariant #4 違反**） | DOM dump 取得不可 | `outputs/phase-11/dom/M-09-no-form-desktop.json` / `M-09-no-form-mobile.json` |
| M-10 | `/profile?edit=true` でも read-only | DOM dump `counts` 全 key 0 + screenshot あり (desktop / mobile) | counts > 0（query で編集 form が出現 = **invariant 違反**） | 取得失敗 | `outputs/phase-11/dom/M-10-edit-query-ignored-{desktop,mobile}.json` + `screenshots/M-10-{desktop,mobile}-*.png` |
| M-16 | logout redirect / 未ログイン境界 evidence | logout 後 `/profile` 訪問 → `/login` redirect の screenshot あり | redirect しない / `/profile` がそのまま表示 | logout flow を実現できない | `outputs/phase-11/screenshots/M-16-redirect-*.png` |
| M-14（参考） | staging Magic Link → `/profile` flow | screenshot あり + redaction 済 | redaction 漏洩 / flow 失敗 | Magic Link 受信不可（mailbox 未連携など） | `outputs/phase-11/screenshots/M-14-flow-*.png` |
| M-15（参考） | staging Google OAuth → `/profile` flow | screenshot あり + redaction 済 | redaction 漏洩 / flow 失敗 | OAuth 設定未完了 | `outputs/phase-11/screenshots/M-15-flow-*.png` |

M-14 / M-15 は本タスクの Issue Scope-in には含まれていないが、`manual-smoke-evidence.md` の更新範囲に存在するため Phase 8 で取得を試みる。取得不能なら `BLOCKED` で記録する。

## 判定の優先順序

1. invariant 違反（M-09 / M-10 で counts > 0）→ **最優先で FAIL** とし、Phase 12 unassigned-task-detection に follow-up を起票
2. redaction 漏洩 → 当該 evidence を破棄し再取得（Phase 5 へ戻る）。再取得不能なら BLOCKED
3. ファイル欠落（件数不足）→ Phase 5 を再実行
4. 環境要因の取得不能 → BLOCKED（Phase 8 で `manual-smoke-evidence.md` に記録）

## 実行手順

1. Phase 6 検査表を確認する。
2. 上記 AC matrix を `outputs/phase-07/ac-matrix.md` として実値で埋める。
3. `outputs/phase-07/main.md` に判定サマリ（OK 件数 / FAIL 件数 / BLOCKED 件数 / 各根拠）を記載する。
4. invariant 違反検出時は Phase 12 unassigned-task-detection に渡す follow-up タスクの draft を `outputs/phase-07/follow-up-draft.md` に書く。

## 完了条件チェックリスト

- [ ] AC matrix が 4 marker (M-08 / M-09 / M-10 / M-16) すべて埋まっている
- [ ] M-14 / M-15 は判定済（OK / BLOCKED いずれか）
- [ ] FAIL がある場合は follow-up draft が起票されている
- [ ] OK / FAIL / BLOCKED の件数集計が `outputs/phase-07/main.md` にある

## 次 Phase への引き渡し

Phase 8 へ AC 判定結果を引き渡す。Phase 8 は `manual-smoke-evidence.md` の status 列を実測値に書き換える。
