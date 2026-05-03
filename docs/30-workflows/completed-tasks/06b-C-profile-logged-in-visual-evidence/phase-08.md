# Phase 8: DRY 化 — 06b-C-profile-logged-in-visual-evidence

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06b-C-profile-logged-in-visual-evidence |
| phase | 8 / 13 |
| wave | 6b-fu |
| 作成日 | 2026-05-03 |
| taskType | implementation-spec |

## 目的

Playwright spec / capture script / DOM dump 等で重複しがちな処理を共通化し、後続タスク（08b / 09a）からの再利用性を高める。同時に命名・状態語彙・evidence path の DRY を整える。

## DRY 対象

| 対象 | 方針 |
| --- | --- |
| `maskPII(page)` helper | spec 内ローカル関数で実装。06b-A の `apps/web/playwright/fixtures/auth.ts` に類似 fixture があれば fixture 化候補（ただし本タスクで shared 化はしない、follow-up 候補に積むのみ） |
| `readReadonlyCounts(page)` helper | spec 内ローカル関数。selector 文字列を `const READONLY_SELECTORS` で 1 箇所に集約 |
| screenshot 命名 | `naming.ts`（または spec 内 `formatEvidencePath` 関数）で `${marker}-${viewport}-${date}.png` を生成 |
| DOM dump 形式 | JSON schema を spec 上部 const で定義し `as const satisfies DomDumpV1` |
| baseURL guard | capture script + globalSetup の 2 箇所で重複しているが、deliberate に二重化（DRY より安全性優先）。理由を spec 冒頭コメントに明記 |

## 命名・語彙の整合

| 項目 | 値（本タスクの正本） |
| --- | --- |
| viewport 表記 | `desktop` / `mobile`（`pc` / `sp` は使わない） |
| marker 表記 | `M-08` 等のハイフン付き 4 文字（`M08` は使わない） |
| date 表記 | `YYYYMMDD`（`YYYY-MM-DD` は使わない、ファイル名衝突回避） |
| evidence root | `outputs/phase-11/`（`outputs/evidence/` は使わない） |
| invariant violation 表記 | `INVARIANT-VIOLATION-{date}`（Phase 6 と統一） |

## 既存タスクとの重複チェック

| 既存タスク | 重複点 | 対応 |
| --- | --- | --- |
| 06b-parallel-member-login-and-profile-pages | `/login` screenshot は既取得 | M-14/M-15 の Magic Link/OAuth screenshot は本タスクで新規 |
| 06b-A-me-api-authjs-session-resolver | auth fixture 提供 | 本タスクは fixture 利用側 |
| 06b-B-profile-self-service-request-ui | 申請 UI 追加 | M-09 selector で `[data-testid="request-action-panel"]` 配下を **除外**（重複を回避） |
| 09a staging visual smoke | profile readonly 部分が再利用候補 | Phase 12 で継承点を documentation-changelog に記載 |

## サブタスク管理

- [ ] helper 共通化方針の確定
- [ ] 命名・語彙の整合確定
- [ ] 既存タスクとの重複境界確定
- [ ] outputs/phase-08/main.md に DRY サマリ記載

## 成果物

| 成果物 | パス |
| --- | --- |
| DRY 化レポート | `outputs/phase-08/main.md` |

## 完了条件

- [ ] helper / 命名 / evidence path が 1 箇所に集約された
- [ ] 既存タスクとの重複・差分が表で明示されている
- [ ] 申請 UI button が M-09 assertion で誤検知しない構造になっている

## タスク100%実行確認

- [ ] DRY のために安全性（baseURL guard 二重化）を犠牲にしていない

## 次 Phase への引き渡し

Phase 9 へ、命名規約・helper 配置・重複境界を引き渡す。
