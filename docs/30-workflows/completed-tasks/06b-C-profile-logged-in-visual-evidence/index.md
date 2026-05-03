# 06b-C-profile-logged-in-visual-evidence

## 実装区分

| 項目 | 値 |
| --- | --- |
| taskType | **implementation-spec** |
| 判定根拠 | M-09 / M-10 の自動再現性確保のため既存 Playwright 配置に spec (`apps/web/playwright/tests/profile-readonly.spec.ts`) を新規追加し、合わせて evidence capture を行う wrapper script (`scripts/capture-profile-evidence.sh`) を新規追加するため。アプリ本体（API / Server Component / DB）には変更を加えない。CONST_004 に基づき「コード変更を伴う実測再現スクリプトの追加」は実装仕様書として扱う。 |

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 6b-fu |
| mode | parallel（実依存は serial） |
| owner | - |
| 状態 | spec_created |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

06b `/profile` の logged-in visual evidence を取得し、read-only 境界を実画面で確認する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、正本上で未実装・未実測として残った follow-up gate だけを扱う。

06b 本体は `/login` screenshot と `/profile` redirect curl まで取得済みだが、ログイン済み session + `/me` `/me/profile` 実データでの profile screenshot は未取得である。

## scope in / out

### Scope In
- logged-in `/profile` screenshot M-08 取得
- 本文編集 form/input/textarea/submit が存在しないことの M-09 evidence
- `/profile?edit=true` でも read-only 維持の M-10 evidence
- staging M-14〜M-16 visual evidence

### Scope Out
- profile 本文編集 UI の追加
- Magic Link retry-after UI 復元
- 新規 member API 実装
- production deploy

## dependencies

### Depends On
- 04b /me and /me/profile
- 05a/05b session establishment
- 06b profile page
- 06b-A-me-api-authjs-session-resolver（先行: production session 解決が前提）
- 06b-B-profile-self-service-request-ui（先行: 申請 UI 反映後の visual 取得）

### 内部依存（同 wave 内 serial 実行を明示）
- 表記上は parallel だが、実依存は **06b-A → 06b-B → 06b-C** の serial。
- 002 完了で `/me` が production session で 200 → 003 で申請 UI を実装 → 001 で logged-in visual + 申請 UI evidence を取得。

### Blocks
- 08b Playwright profile scenario
- 09a staging visual smoke

## refs

- docs/30-workflows/completed-tasks/UT-06B-PROFILE-VISUAL-EVIDENCE.md
- docs/30-workflows/completed-tasks/06b-parallel-member-login-and-profile-pages/
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/07-edit-delete.md

## AC

- M-08 profile screenshot が保存されている
- M-09 no-form evidence で編集 form/input/textarea/submit が 0 件
- M-10 edit query ignored evidence が保存されている
- manual-smoke-evidence の該当行が captured に更新される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #4 本文更新は Google Form 再回答のみ
- #5 public/member/admin boundary
- #8 localStorage/GAS prototype を正本にしない
- #11 管理者も他人本文を直接編集しない

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。
