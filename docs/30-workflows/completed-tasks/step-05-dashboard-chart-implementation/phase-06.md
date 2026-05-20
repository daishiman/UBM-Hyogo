# Phase 6: 検証コマンド / 手動確認手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 区分 | 実装補助（CLI / runbook はなし、検証コマンドの整理） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 5 実装の動作確認を、ローカル / CI / 手動の 3 経路で漏れなく実行するためのコマンド列を確定する。本タスクは新規 CLI / runbook を追加しない（admin UI 単体改修のため）。

## 1. ローカル検証コマンド

すべて `mise exec --` 経由で実行する（Node 24 / pnpm 10 を保証）。

```bash
# 1. 依存インストール
mise exec -- pnpm install

# 2. 型チェック
mise exec -- pnpm typecheck

# 3. lint
mise exec -- pnpm lint

# 4. unit test (対象 spec のみ)
mise exec -- pnpm test apps/web --run -- StatusDistribution.spec.tsx

# 5. apps/web 全体 unit test
mise exec -- pnpm --filter @ubm-hyogo/web test --run

# 6. build (OpenNext Workers 互換確認)
mise exec -- pnpm --filter @ubm-hyogo/web build
```

## 2. 手動視覚確認

```bash
# dev server 起動
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://localhost:3000/login で admin アカウントログイン
#   admin: manjumoto.daishi@senpai-lab.com（MEMORY.md 記載）
# → http://localhost:3000/admin 遷移
# → "公開ステータス" カードを目視確認
```

### 確認観点

| 観点 | 期待 |
| --- | --- |
| placeholder | legacy API response や empty data で `byStatus` が得られない場合 → "分布データは現在集計対象外です" が表示される |
| chart | API が `byStatus` を返す場合、3 bar の SVG が表示される |
| responsive | window 幅を狭めても SVG が縦横比を維持して縮む（`preserveAspectRatio`） |
| color | 各 bar の色が OKLch token（緑/青/橙系）で描画される |
| a11y | DevTools の Accessibility パネルで `role="img"` + `aria-label` が認識される |

### 手動 mock 手順（任意）

legacy fallback の動作確認が必要な場合、`apps/web/src/lib/admin/admin-dashboard-ui.ts` 内で一時的に `byStatus: undefined` を return する debug 文を挟む方法を runbook 化する（コミット前に必ず revert）。

```typescript
// 一時 debug only — コミット禁止
return { ...result, byStatus: [
  { status: "public", count: 12 },
  { status: "member_only", count: 8 },
  { status: "hidden", count: 3 },
] };
```

## 3. CI gate チェック（pre-push 想定）

```bash
# token 引当 (HEX 直書きなし)
bash scripts/verify-design-tokens.sh   # 存在しない場合はスキップ

# Phase 12 compliance pre-flight
bash scripts/verify-pr-ready.sh
```

## 4. visual regression（任意 / Phase 11 で本実行）

```bash
mise exec -- pnpm e2e:visual --project=visual-chromium
```

## 実行タスク

- Phase 6: local verification command を実行し、exit code を evidence に保存する。

## 参照資料

- - `phase-04.md`
- - `phase-05.md`
- - `apps/web/package.json` scripts

## 成果物

- - focused test、grep gate、typecheck のログを `outputs/phase-11/evidence/` に保存する。

## 統合テスト連携

- - Phase 11 local evidence inventory に接続する。

## 完了条件

- [ ] 上記コマンド 1〜3 がすべて 0 終了することを確認した
- [ ] 手動確認観点 4 件のうち、legacy response fallback と populated chart の両方が確認できる
