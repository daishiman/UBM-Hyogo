# phase 12 task spec compliance check

## 不変条件遵守状況

| 不変条件 | 遵守 | 根拠 |
| --- | --- | --- |
| #1 schema 固定しない | OK | profile field は stableKey 経由参照のみ（AC-11） |
| #2 consent キー統一 | OK | `publicConsent` / `rulesConsent` のみ使用（AC-5, AC-10） |
| #3 responseEmail = system field | OK | UI で system 扱い、ログイン用 email は別管理 |
| #4 本人本文編集禁止（Google Form 経由） | OK | `/profile` は read-only、アプリ内本文編集 form / input / textarea / submit button なし。`EditCta` は外部 Google Form link のみ提供（AC-8, AC-9） |
| #5 D1 直接アクセス禁止 | OK | 全 fetch は 04b / 05b 経由（AC-7, AC-8） |
| #6 GAS prototype 非昇格 | OK | `window.UBM` / `localStorage` 不採用（AC-12） |
| #7 responseId と memberId 混同なし | OK | session.memberId のみ参照、MVP では Google Form 再回答が本人更新の正式経路 |
| #8 localStorage 非正本 | OK | URL query 正本（AC-1, AC-12） |
| #9 `/no-access` 不依存 | OK | `/login` で 5 状態を吸収、`/no-access` ルート不存在（AC-4, AC-6, AC-7） |
| #10 無料枠内 | OK | Workers req 0.43% 使用 |
| #11 他人本文編集禁止 | OK | profile に編集 UI 不在（AC-8） |
| #12 admin_member_notes 漏れなし | N/A | 本タスクは admin scope 外 |
| #13 tag は queue 経由 | N/A | 本タスクは tag 操作なし |
| #14 schema 集約 | N/A | 本タスクは schema 操作なし |
| #15 attendance 重複防止 | N/A | 本タスクは attendance 操作なし |

## AC trace

| AC | 状態 | 根拠 |
| --- | --- | --- |
| AC-1 | trace 済 | U-01, U-02, E-01〜E-06 |
| AC-2 | trace 済 | U-03, C-01, E-02 |
| AC-3 | trace 済 | C-02, E-03 |
| AC-4 | trace 済 | E-04 |
| AC-5 | trace 済 | E-05 |
| AC-6 | trace 済 | E-06, F-14 |
| AC-7 | trace 済 | E-07, F-06 |
| AC-8 | trace 済 | S-04, Phase 11 local partial evidence。ログイン後 screenshot は実 session / API fixture 必要のため pending |
| AC-9 | trace 済 | `EditCta`, F-10。ログイン後 screenshot は実 session / API fixture 必要のため pending |
| AC-10 | trace 済 | E-10 |
| AC-11 | trace 済 | S-01 |
| AC-12 | trace 済 | S-02 |

## spec sync / evidence sync

| spec | 整合性 |
| --- | --- |
| docs/00-getting-started-manual/specs/02-auth.md | OK（aiworkflow-requirements index sync） |
| docs/00-getting-started-manual/specs/05-pages.md | OK（aiworkflow-requirements index sync） |
| docs/00-getting-started-manual/specs/06-member-auth.md | OK（aiworkflow-requirements index sync） |
| docs/00-getting-started-manual/specs/07-edit-delete.md | OK（aiworkflow-requirements index sync） |
| docs/00-getting-started-manual/specs/13-mvp-auth.md | OK（aiworkflow-requirements index sync） |
| Phase 11 screenshot | partial OK（M-01〜M-05 captured、profile logged-in / staging pending） |

## 結論

不変条件 #1〜#11（適用範囲）すべて OK。AC-1〜AC-12 はコード・静的テスト・local partial visual evidence で trace 済。`/profile` ログイン後 screenshot と staging smoke は実 session / API fixture / staging deploy が必要なため Phase 11 evidence の pending 項目として残す。
