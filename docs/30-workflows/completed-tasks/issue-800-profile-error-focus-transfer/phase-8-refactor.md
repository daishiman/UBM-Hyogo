# Phase 8: リファクタリング判断

**[実装区分: 実装仕様書]**

## 1. 実施したリファクタ

| 候補 | 判定 | 理由 |
|---|---|---|
| `useAutoFocusOnMount(ref)` 共通 hook 抽出 | **実施** | profile に加えて login/admin の同等漏れも今回サイクルで回収したため、root/profile/login/admin の 4 箇所で focus pattern が重複する。`issue-769-followup-001` の「3 箇所目で抽出」条件を満たした |
| `ErrorBoundaryLayout` 共通コンポーネント抽出 | 見送り | h1 文言、補助文、CTA 文言が route ごとに異なり、現時点では props 設計コストが benefit を上回る |
| test fixture 共通化 | 見送り | 各 route の文言と CTA が異なるため、テストは route-local に残す |

## 2. hook 契約

- ファイル: `apps/web/src/lib/a11y/useAutoFocusOnMount.ts`
- default: `preventScroll: true`
- opt-out: `options` で明示的に上書き可能
- 呼び出し側責務: h1 等の非 interactive element には `tabIndex={-1}` を付与する
- 順序: `logger.error` effect を hook 呼び出しより上に置き、既存の「ログ記録 → focus」順を維持する

## 3. 依存関係の消化

- `issue-769-followup-001-use-auto-focus-on-mount-hook.md`: 本 workflow で consumed
- `issue-769-followup-003-admin-error-focus-transfer.md`: 本 workflow で consumed
- `/login/error.tsx` の残差: 既存 `integration-fixes-i05-login-loading-and-error-focus.md` / Issue #768 の error focus 残差として本 workflow で追加回収
