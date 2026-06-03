# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

T01〜T03 の修正方針を確定し、代替案を比較して Phase 4（I/O 契約）へ進めるかを判定する。後続の実装仕様書（Phase 5）がコード実装可能になるよう、対象モジュールと想定変更ファイル群を俯瞰する。

## 実行タスク

### 3.1 モジュール俯瞰（想定変更ファイル）

| タスク | 変更/新規ファイル | 種別 |
|--------|-------------------|------|
| T01 | `apps/api/src/middleware/trailing-slash.ts` | 新規（正規化 middleware） |
| T01 | `apps/api/src/index.ts` | 編集（middleware 登録） |
| T01 | `apps/api/src/middleware/__tests__/trailing-slash.spec.ts` | 新規（unit） |
| T01 | `apps/api/src/__tests__/me-route-mount.integration.spec.ts` | 新規（フルアプリ・マウント統合） |
| T02 | `apps/web/app/api/me/[...path]/route.ts` | 編集（upstream URL 末尾スラッシュ抑止） |
| T02 | `apps/web/app/api/me/[...path]/route.route.spec.ts` | 新規（proxy URL 構築テスト） |
| T03 | `apps/web/app/(member)/profile/page.tsx` | 編集（error code 分岐） |
| T03 | `apps/web/src/components/member/SectionError.tsx` | 編集（CTA props 追加） |
| T03 | `apps/web/app/(member)/profile/page.spec.tsx` | 編集（404→CTA テスト追加） |
| T03 | `apps/web/src/components/member/__tests__/SectionError.spec.tsx` | 新規 or 編集（CTA レンダリング） |

### 3.2 T01 修正方針（trailing-slash 正規化）と代替案

| 案 | 内容 | 採否 | 理由 |
|----|------|------|------|
| 案A（採用）| `app.use("*", ...)` で「pathname が `/` 以外で末尾 `/` のとき、308 で末尾スラッシュ無し URL に redirect」する middleware を `corsFromEnv` の後・route mount の前に登録 | ✅ | 全 route 共通・低ブラスト半径。Worker 間 fetch は redirect を追従するため `/me/` も最終的に解決。`/me` ハンドラ非改変 |
| 案B | `app.get("/me/", ...)` 等を route ごとに明示追加 | ✗ | `/me` 専用ハードコードが増え、他 route の同種 404 を取りこぼす（FB: 命名/網羅性） |
| 案C | middleware 内で内部 `app.fetch(rewrittenRequest)` 再帰呼び出し | ✗ | 再入・executionCtx 取り回しが複雑で副作用が読みにくい。308 redirect の方が観測容易 |

> 308（Permanent Redirect）を選ぶ理由: メソッド・body を保持する。`OPTIONS`（CORS preflight）は `corsFromEnv` が先に 204 を返すため正規化の影響外。正規化は非 OPTIONS かつ末尾スラッシュ付きのときのみ発火。

### 3.3 T02 修正方針

`target` 構築を、空 path のとき末尾スラッシュを付けない形へ修正する。

```
現行: const target = `${apiBase()}/me/${path.join("/")}${url.search}`;
方針: const tail = path.join("/");
      const target = `${apiBase()}/me${tail ? `/${tail}` : ""}${url.search}`;
```

`/api/me`（path=[]）→ `${api}/me`、`/api/me/visibility-request` → `${api}/me/visibility-request`（回帰なし）。

### 3.4 T03 修正方針

`/profile` の `!meResult.ok` 分岐で `meResult.error.code` を判定:

- `MEMBER_SESSION_404` → 再ログイン CTA つき明示エラー。`SectionError` に `actionHref="/login?redirect=/profile"` / `actionLabel="再ログイン"` を渡し、`detail` は固定の一般文言（生 message を渡さない）。
- それ以外 → 既存の「セッション情報を取得できませんでした」+ `retryHref="/profile"`、ただし `detail` は固定一般文言（生 message を露出しない）。

`SectionError` 拡張:

```tsx
export interface SectionErrorProps {
  title?: string;
  detail?: string;
  retryHref?: string;
  actionHref?: string;   // 追加
  actionLabel?: string;  // 追加
  className?: string;
}
```

`actionHref` && `actionLabel` のとき `<a data-role="action" href={actionHref}>{actionLabel}</a>` を `retry` リンクと並べて描画。既存 `retryHref` のみの呼び出しは不変。

### 3.5 4条件評価（設計レビュー判定）

| 条件 | 判定 | 根拠 |
|------|------|------|
| 価値性 | PASS | マイページ利用不能の解消（解決層）+ 生エラー露出の解消（UX）。ユーザーの「再ログインすべきか分からない」コストを下げる |
| 実現性 | PASS | 既存 middleware パターン / 既存 primitive 拡張 / 文字列構築修正のみ。新規依存・大規模変更なし。1 サイクルで実装可能 |
| 整合性 | PASS | API は UX を持たず、proxy は表示を持たず、UI は error code のみ参照。責務境界が閉じる。レスポンス shape / D1 / Form 不変 |
| 運用性 | PASS | フルアプリ・マウント統合テスト（AC-5）が再発を検知。trailing-slash 正規化は全 route 共通で将来の同種 404 も防ぐ |

判定: **Phase 4 へ進む（PASS）**。

## 完了条件

- [x] 3 タスクの修正方針を確定
- [x] T01 の代替案（案A/B/C）を比較し採用案を決定
- [x] 想定変更ファイル群を俯瞰
- [x] 4条件評価で Phase 4 進行可否を判定（PASS）

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル）

## 参照資料

- `outputs/phase-1/phase-1.md`（真因・AC）
- `outputs/phase-2/phase-2.md`（責務境界・再利用判定）
- `apps/api/src/index.ts` / `apps/api/src/middleware/security-headers.ts`（middleware 登録順の参照）

## 統合テスト連携

Phase 4 で本方針を HTTP / 関数 I/O 契約とテスト期待値の表へ確定し、Phase 5 の実装仕様書（task-01..03）へ展開する。
