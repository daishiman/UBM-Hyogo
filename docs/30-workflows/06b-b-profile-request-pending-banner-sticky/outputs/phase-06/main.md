# Phase 6: 異常系検証 — 06b-b-profile-request-pending-banner-sticky-001

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-b-profile-request-pending-banner-sticky-001 |
| phase | 6 / 13 |
| wave | 06b-fu |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

reload 永続性 + 重複申請 + 401 / 422 / 5xx / network failure 各シナリオで UI の挙動を仕様化し、stale UI でも user-visible になる error 経路を確定する（S5）。

## 異常系シナリオ

| ID | シナリオ | 期待挙動 |
| --- | --- | --- |
| ER-01 | `GET /me/profile` 401（session 失効） | Server Component で `redirect('/login?redirect=/profile')`（既存規約） |
| ER-02 | `GET /me/profile` 5xx | profile fetch 失敗 → エラー UI（既存）。pending banner は表示しない（S1: server 正本不在で楽観表示しない） |
| ER-03 | `GET /me/profile` network failure | 同上 |
| ER-04 | `POST /me/visibility-request` 409（DUPLICATE_PENDING_REQUEST・stale UI 経由） | `SelfRequestError(code:'DUPLICATE_PENDING_REQUEST')` を user-visible に表示し、`router.refresh()` で server pending を取得 → banner 表示・ボタン disabled |
| ER-05 | `POST /me/visibility-request` 422 | 既存 `RequestErrorMessage` で表示（変更なし） |
| ER-06 | `POST /me/visibility-request` 401 | `/login?redirect=/profile` |
| ER-07 | `POST /me/visibility-request` 5xx | エラー UI、楽観的 banner は revert |
| ER-08 | `POST /me/visibility-request` network failure | 同上 |
| ER-09 | `getPendingRequestsForMember` D1 例外 | 500 を返却し、UI は ER-02 と同じ |
| ER-10 | reload 中に admin が approve した（race） | 直後の reload で banner 消滅（natural な server 正本反映） |

## error code mapping（S5: 既存再利用・追加なし）

| HTTP status | 既存 code | 表示文言（既存） |
| --- | --- | --- |
| 409 | `DUPLICATE_PENDING_REQUEST`（既存 SelfRequestError） | 「すでに申請を受け付けています」 |
| 422 | `INVALID_REQUEST` | 「入力内容を確認してください」 |
| 401 | （API） | redirect |
| 5xx | `SERVER` | 「時間をおいて再度お試しください」 |
| network | `NETWORK` | 「通信に失敗しました」 |

新 error code を追加しないことを grep で確認する:

```bash
rg -n "code:\s*['\"]DUPLICATE_PENDING_REQUEST['\"]" apps/api/  # 既存 hit のみ
rg -n "code:\s*['\"]" apps/api/src/routes/me/         # 新規追加 0
```

## stale UI 経路の検証

- ユーザーが古いタブで pending を未認識のまま再 submit → server が 409 を返す
- client は 409 を受信 → 既存 error UI 表示 + `router.refresh()` で server pending を再取得
- これにより stale tab でも banner が server 正本で sticky 化される

## 多角的チェック観点

- pending banner を**楽観的に表示しない**（5xx / network 時）
- 409 後に必ず `router.refresh()` を呼んで server 正本に追従
- a11y: error は `role="alert"`、banner は `role="status"`
- 不変条件 #11: 401 redirect 先 URL に memberId を含めない

## サブタスク管理

- [ ] ER-01..ER-10 を確定
- [ ] error code mapping を Phase 2 と整合
- [ ] stale UI 経路を文書化
- [ ] `outputs/phase-06/main.md` 作成

## 成果物

| 成果物 | パス |
| --- | --- |
| 異常系仕様 | `outputs/phase-06/main.md` |

## 完了条件

- [ ] ER-01..ER-10 が記載
- [ ] error code を新設していない（S5）
- [ ] stale UI が user-visible（AC-3）
- [ ] 本 Phase 内タスク 100% 実行

## タスク 100% 実行確認【必須】

- [ ] 実装、deploy、commit、push、PR を実行していない

## 次 Phase への引き渡し

Phase 7 へ、AC × evidence × error path のクロスマトリクス入力を渡す。
