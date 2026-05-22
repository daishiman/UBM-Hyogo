# Phase 11: Visual evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 11 / 13 |
| Phase 名称 | Visual evidence (manual smoke) |
| 前 Phase | 10 (リファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | implemented_local_evidence_captured_runtime_visual_pending |

## 目的

`ToastProvider` 配置後、実 toast UI が dev server で表示されることを目視確認する。

## 手順

### Step 1: dev server 起動

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" dev
```

### Step 2: admin route アクセス

1. `http://localhost:3000/login` で admin アカウント (`manjumoto.daishi@senpai-lab.com`) でログイン
2. `http://localhost:3000/admin` へ navigate
3. console を開いておく（`warnMissingToastProvider` の warn 出力が消えたことを確認）

### Step 3: toast 発火

以下のいずれかで toast を発火:

- **(A) serial-05 完了済の場合**: admin route 上で member edit 等の mutation を発火
- **(B) serial-05 未着手の場合**:
  - 開発者ツール console で次を実行:
    ```js
    // Toast.tsx の export を window 経由で参照できる場合
    document.querySelector('div[aria-live="polite"]')
    document.querySelector('div[aria-live="assertive"]')
    ```
  - または `apps/web/src/components/ui/Toast.tsx` の `ToastProvider` が context を提供しているかを React DevTools で確認

### Step 4: 観測ポイント

| 観測項目 | 期待 |
| --- | --- |
| Console warn | `warnMissingToastProvider` を含む warn 出力**なし** |
| DOM 上 toast region | `div[aria-live="polite"]` / `div[aria-live="assertive"]` が存在 |
| Toast role | status toast は `role="status"`、alert toast は `role="alert"` |
| React DevTools | `ToastProvider` が `<RootLayout>` 配下にある |
| toast 発火時 | UI が一定時間表示され、自動で消える |

### Step 5: スクリーンショット

`outputs/phase-11/` 配下にスクリーンショット 2 枚を保存:
- `phase-11-toast-visible.png`: toast 表示中
- `phase-11-devtools-provider.png`: React DevTools での Provider 確認

## NON_VISUAL fallback

serial-05 未着手で実 toast 発火が困難な場合は、以下を evidence として代替:

- `outputs/phase-11/manual-smoke.md` に React DevTools 経由で `ToastProvider` が tree に存在することのテキスト記録
- console output に `warnMissingToastProvider` が出ていないことの抜粋
- `pnpm build` ログで hydration warning がないことの抜粋

## 成果物

| パス | 内容 |
| --- | --- |
| outputs/phase-11/manual-smoke.md | 手順 + 観測結果 |
| outputs/phase-11/phase-11-toast-visible.png | (任意) toast 表示 SS |
| outputs/phase-11/phase-11-devtools-provider.png | (任意) DevTools SS |

## 完了条件

- [x] local static/build evidence で `ToastProvider` root mount と client boundary を確認
- [x] authenticated admin visual smoke は user-session runtime gate として未実施を明記
- [x] manual-smoke.md に手順 + 結果記載

## 次 Phase

Phase 12: 正本同期
