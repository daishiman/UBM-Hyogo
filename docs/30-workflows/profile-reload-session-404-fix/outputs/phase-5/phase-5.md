# Phase 5: 実装手順インデックス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| taskType | implementation |
| implementation_mode | new |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

Phase 4 で確定した I/O 契約を、コード実装可能な 3 つの実装仕様書本体（task-01..03）へ分解し、各タスクの相互依存と実行順を確定する。本サイクルで 3 タスクすべてを完結させる（CONST_007: 先送り無し）。

## 実行タスク

### 5.1 タスク一覧と実装仕様書本体

| タスク | 領域 | 実装仕様書 | 概要 |
| --- | --- | --- | --- |
| T01 | `apps/api` | [`task-01-api-trailing-slash-and-mount-test.md`](./task-01-api-trailing-slash-and-mount-test.md) | 全 route 共通 trailing-slash 正規化 middleware 追加 + フルアプリ・マウント統合テスト |
| T02 | `apps/web`（proxy） | [`task-02-web-proxy-trailing-slash-fix.md`](./task-02-web-proxy-trailing-slash-fix.md) | `/api/me/[...path]` の空 path 時 `/me/` 生成バグ修正 + テスト |
| T03 | `apps/web`（UI） | [`task-03-profile-defensive-ux-relogin-cta.md`](./task-03-profile-defensive-ux-relogin-cta.md) | `/profile` の `/me` 404 分岐 → 再ログイン CTA + `SectionError` CTA 拡張 |

### 5.2 依存関係と実行順

3 タスクはすべて関心が分離しており（API ルーティング / web proxy / web UI）、相互にコード依存が無いため**並列実装可能**。レビュー観点での推奨実行順は以下:

1. **T01（apps/api）** — ルート解決層の 404 を根治し、再発検知の統合テストを先に固める。
2. **T02（apps/web proxy）** — client 経由経路の `/me/` 生成バグを是正。T01 が landed していれば 308 で吸収されるが、proxy 側でも末尾スラッシュを生成しないことを独立に保証する（多重防御）。
3. **T03（apps/web UI）** — 上記が解決しても残る「生エラー露出」を UX 防御で閉じる。T01/T02 と独立だが、ユーザー体験の最終層のため最後に確認する。

> T01 と T02 は同じ「末尾スラッシュ起因 404」を異なる層（API 解決層 / web URL 構築）で防ぐ。どちらか一方でも 404 を抑止できるが、両方実装して多重防御とする（Phase 3 §3.2 / §3.3）。

### 5.3 検証コマンド（全タスク共通の最終確認）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api exec vitest run src/middleware/__tests__/trailing-slash.spec.ts src/__tests__/me-route-mount.integration.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run "app/api/me/[...path]/route.route.spec.ts" "app/(member)/profile/page.spec.tsx" "src/components/member/__tests__/SectionError.spec.tsx"
```

## 完了条件

- [x] T01〜T03 の実装仕様書本体へのリンクを確定
- [x] 依存関係（相互非依存・並列可）と推奨実行順を確定
- [x] 全タスク共通の検証コマンドを確定
- [x] 先送り・別 PR・バックログ送りが無いことを明記（CONST_007）

## 成果物

- `outputs/phase-5/phase-5.md`（本ファイル）
- `outputs/phase-5/task-01-api-trailing-slash-and-mount-test.md`
- `outputs/phase-5/task-02-web-proxy-trailing-slash-fix.md`
- `outputs/phase-5/task-03-profile-defensive-ux-relogin-cta.md`

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | `/me` 解決 / session 境界 |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` レスポンス shape の不変確認 |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | エラー表示 / 導線の方針 |

- `outputs/phase-4/phase-4.md`（I/O 契約）

## 統合テスト連携

各 task-0N の `## 5. テスト方針` の TC-ID を Phase 6（fail path / 回帰 guard）で集約し、Phase 7 で変更ブロックの line/branch カバレッジを確認する。
