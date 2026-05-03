[実装区分: 実装仕様書]

# Phase 6: 異常系検証 — ut-05a-auth-ui-logout-button-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-auth-ui-logout-button-001 |
| phase | 6 / 13 |
| wave | Wave 5 follow-up |
| mode | parallel |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

sign-out 操作で起こりうる異常系を網羅し、検出条件・evidence 化方針・再実行条件を確定する。

## 実行タスク

1. sign-out API 呼出系の失敗条件を列挙する。
2. cookie / session 残存時の FAIL 条件を定義する。
3. UI 表示漏れと public route 混入を検出条件化する。
4. PII / token redaction 不合格時の停止条件を定義する。

## 参照資料

- apps/web/src/components/auth/SignOutButton.tsx
- apps/web/middleware.ts
- apps/web/src/lib/auth.ts

## 統合テスト連携

- Phase 4 の unit / E2E / manual smoke が本 Phase の異常系を検出する。
- public route 混入は `rg "SignOutButton" apps/web/app/(public) apps/web/src/components/public` で確認する。

## 異常系一覧

### sign-out API 呼出系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| `signOut` ネットワーク失敗 | promise reject / timeout | toast or console error 化、`isPending` を解除して再試行可能にする |
| Auth.js endpoint 5xx | redirect されず同一 URL に滞留 | E2E で fail を検出、Issue 起票 |
| CSRF token 不在 | `signOut` が 403 | `next-auth/react` の規定挙動に委譲、追加実装はしない |

### Cookie / Session 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| cookie が削除されない | `context.cookies()` で session token が残存 | 即時 FAIL（AC-4）、Auth.js 設定の見直しを別タスク化 |
| `/api/auth/session` が body を残す | `{}` 相当ではない | 即時 FAIL（AC-3） |
| `/profile` 再アクセスで 200 | middleware redirect されず到達 | 即時 FAIL（AC-5）、middleware 側の修正は本タスク外 |

### UI 系

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| 多重クリック | 連打で `signOut` が複数回発火 | `isPending` 状態で `disabled` 化することで防止 |
| ボタン非表示 | layout / sidebar に描画されない | E2E で fail、layout 配置を見直し |
| public route で表示 | 未ログインで sign-out が見える | `(public)` には配置しないことで防止（実装時に grep 確認） |

### 個人情報 / 機密漏洩

| ケース | 検出条件 | 対応 |
| --- | --- | --- |
| screenshot に実名・連絡先 | redaction checklist 不合格 | 削除して再取得 |
| log に session token | wrangler tail / console に token 文字列 | log 全体破棄 → redaction 後再取得 |

## 多角的チェック観点

- 異常系を「失敗」ではなく「evidence 化対象」として扱う
- 個人情報露出時は他判定より優先で停止
- middleware 側のバグは本タスク外として別 Issue 起票

## サブタスク管理

- [ ] 各異常系の検出条件と対応を確定
- [ ] AC への影響を case 単位で記述
- [ ] PII 露出時の停止フローを記述
- [ ] outputs/phase-06/main.md を作成する

## 成果物

- outputs/phase-06/main.md

## 完了条件

- API / cookie / UI / PII の異常系が網羅されている
- 各 case の evidence 化と再実行条件が定義されている
- AC への影響が明記されている

## タスク100%実行確認

- [ ] 異常系を PASS と誤認するルートが残っていない
- [ ] PII 露出時の停止が他判定より優先されている

## 次 Phase への引き渡し

Phase 7 へ、AC マトリクスの前提（異常系含む）を渡す。
