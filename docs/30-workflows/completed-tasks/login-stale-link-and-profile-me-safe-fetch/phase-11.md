# Phase 11: 手動テスト（VISUAL モード）

## モード判定

`VISUAL`（UI 表示変更あり: `/profile` で `SectionError` UI 降下、`/login` リンクの修正）。

## 3層評価

### Semantic（意味的整合）

| 項目 | 期待 |
|------|------|
| `/profile` 5xx 時の `SectionError` 文言 | 「セッション情報を取得できませんでした」+ detail に upstream message + retry href `/profile` |
| `/profile` 401 時 | `/login?redirect=/profile` redirect |
| `/login` レンダリング | Network panel に `/[object Object]` が出ない |

### Visual（screenshot）

| ファイル名（semantic canonical） | 状態 | mode |
|---------------------------------|------|------|
| `profile-session-error.png` | `/me` 5xx mock 時 | desktop chromium |
| `profile-success.png` | 既存（regression baseline） | desktop chromium |
| `login-no-stale-link.png` | `/login` 初期表示（network panel snapshot 併記） | desktop chromium |

実行は staging deploy 後の user 操作（user-gated）。本サイクル内では capture 計画のみ。

### AI UX

- digest-only ではなく SectionError の `detail` で原因要素が見えることを確認（UX 改善）。
- `/login` で `[object Object]` リクエストが console error に残らないことを確認（noise 削減）。

## screenshot 計画 metadata

`outputs/phase-11/screenshot-plan.json` に capture 対象一覧（filename / tc / route / state / viewport）を JSON で記録。
