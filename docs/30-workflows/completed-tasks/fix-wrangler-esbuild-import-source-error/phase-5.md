# Phase 5: 実装手順

> 本仕様書では実装そのものは行わない。後続実装者がそのまま着手できるよう手順を確定する。

## 5.1 変更対象ファイル一覧

| パス | 変更種別 | 概要 |
|------|---------|------|
| `package.json` | 編集 | `pnpm.overrides.esbuild` を確定バージョンに更新 |
| `pnpm-lock.yaml` | 編集（自動再生成） | `pnpm install` による esbuild 関連 entry 更新 |
| `scripts/cf.sh` | 編集（コメントのみ・任意） | override 根拠コメントを最新版に追従 |

## 5.2 タスク 1: esbuild バージョン確定

```bash
# wrangler が要求する esbuild 範囲を取得
pnpm view wrangler@4.85.0 dependencies.esbuild
# => "0.27.3"

# @opennextjs/cloudflare の依存も確認
pnpm view @opennextjs/cloudflare@1.19.4 dependencies.esbuild || true
pnpm view @opennextjs/aws@3.10.4 dependencies.esbuild || true
# => "0.25.4"
```

採用ロジック:
- wrangler 側が `supported.import-source` を渡す側のため、まず **wrangler exact version の `0.27.3`** に合わせる。
- `@opennextjs/aws` 側は `0.25.4` exact で交点がないため、両方を満たす最小 patch という前提は採らない。OpenNext 互換性は `build:cloudflare` の実走で判定する。
- `build:cloudflare` が失敗した場合のみ、scoped override または override 削除を再判定する。

## 5.3 タスク 2: package.json 更新

```jsonc
// package.json (root)
{
  "pnpm": {
    "overrides": {
      "esbuild": "0.27.3"
    }
  }
}
```

入力: バージョン文字列（semver patch まで完全指定）
出力: `package.json` の override 1 行更新
副作用: なし（インストール前）

## 5.4 タスク 3: lockfile 再生成

```bash
mise exec -- pnpm install --frozen-lockfile=false
# --frozen-lockfile は使わない（lockfile を更新するため）
```

`pnpm-lock.yaml` の以下が変わることを目視確認:
- `overrides:` セクションの `esbuild` 値
- `@esbuild/<platform>@<old>` の解決 → `@esbuild/<platform>@<new>` に置換
- 解決された全 esbuild エントリの version 整合

## 5.5 タスク 4: ローカル回帰確認

Phase 4 の GREEN-1 〜 GREEN-6 を順に実行し、すべて exit 0 を確認する。
1 つでも失敗した場合は Phase 5 タスク 1 に戻り、より新しい patch バージョンを採用してリトライ（最大 3 回まで）。

## 5.6 タスク 5: scripts/cf.sh コメント更新（任意）

`scripts/cf.sh` 冒頭の以下コメントを、確定したバージョンに合わせて短文追記:

> `# OpenNext build の host/binary mismatch 再発時は root package.json の pnpm.overrides.esbuild を ...`

例:
> `# 現在の override は wrangler 4.85.0 が要求する esbuild 0.27.3 に固定。`

## 5.7 タスク 6: ドキュメント影響範囲確認

- `CLAUDE.md` の Cloudflare CLI 実行ルール / 開発環境セクションに esbuild バージョンへの直接言及は無いため更新不要。
- `docs/00-getting-started-manual/` 配下の specs にも該当言及無し（必要に応じ Phase 12 で再確認）。

## 5.8 DoD（Phase 5 完了条件）

- `package.json` と `pnpm-lock.yaml` の差分が esbuild 関連に限定される（`git diff --stat`）。
- ローカルで GREEN-1 〜 GREEN-6 がすべて exit 0。
- 変更コミットは「ビルド/デプロイ回復」に責務を絞った 1 コミットで構成。
