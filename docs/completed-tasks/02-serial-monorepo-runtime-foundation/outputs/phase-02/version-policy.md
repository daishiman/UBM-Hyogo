# Version Policy — runtime version ledger

> Wave 2 唯一の version ledger。downstream task はこのファイルを参照する。
> 正本仕様参照: `technology-core.md`, `technology-frontend.md`, `technology-backend.md`
> Phase 12 Step 2 で正本仕様へ同期する項目は "sync-required" と記載。

## 採用バージョン表

| 項目 | 採用バージョン | 制約 | Phase 12 同期要否 |
| --- | --- | --- | --- |
| Node.js | 24.x LTS（Krypton） | 2028-04 までサポート | no-op（technology-core.md に記録済み） |
| pnpm | 10.x（10.0.0 以上） | pnpm 9 は 2026-04-30 EOL | no-op（technology-core.md に記録済み） |
| Next.js | 16.x（16.2.4 以上） | @opennextjs/cloudflare 推奨版 | no-op（technology-core.md に記録済み） |
| React | 19.2.x | Next.js 16 対応 | no-op（technology-core.md に記録済み） |
| TypeScript | 6.x（6.0.3 以上） | v7.0 はベータのため非推奨 | **sync-required**（現行正本は 5.7.x） |
| Wrangler | 4.x（4.85.0 以上） | v3 は保守モード | no-op |
| Hono | 4.12.x | Workers 安定版 | no-op |
| Tailwind CSS | 4.x（4.2.4 以上） | CSS-first config | no-op |
| Auth.js | 5.x | JWT 暗号化の既知バグあり。AUTH_* プレフィックス | no-op |
| @opennextjs/cloudflare | 最新安定版 | @cloudflare/next-on-pages は Deprecated | **sync-required**（正本仕様で明示確認が必要） |

## 正本仕様との差分詳細

### TypeScript 5.7.x → 6.x（sync-required）

| 項目 | 現行正本（technology-core.md） | 本 task 採用方針 |
| --- | --- | --- |
| 推奨バージョン | `5.7.x` | `6.x`（6.0.3 以上） |
| 最小バージョン | `5.5.0` | `6.0.3` |
| 理由 | - | v6 は strict モード強化・型推論改善。v7.0 はベータ（非推奨）。 |

Phase 12 Step 2 で `technology-core.md` を更新する。

### @opennextjs/cloudflare 採用（sync-required）

| 項目 | 現行正本 | 本 task 採用方針 |
| --- | --- | --- |
| Web adapter | @opennextjs/cloudflare（architecture-overview-core.md に記載） | 同じ（@cloudflare/next-on-pages は不採用） |
| 理由 | - | @cloudflare/next-on-pages は Deprecated |

Phase 12 Step 2 で `technology-frontend.md`, `architecture-overview-core.md` に明示記録する。

## バージョン管理戦略

| 原則 | 内容 |
| --- | --- |
| パッチ | 即時適用可（セキュリティ修正） |
| マイナー | 検証後に適用（ breaking change 確認） |
| メジャー | Wave 単位で計画的移行 |

## Workers バンドルサイズ制限

| プラン | 上限 |
| --- | --- |
| Workers 無料枠 | 3MB |
| Workers 有料 | 10MB |
| Pages Functions | 25MB（fallback として検討可） |

`@opennextjs/cloudflare` の `optimizePackageImports` オプションを活用してバンドルサイズを削減する。3MB を超過する場合は Pages Functions への移行を検討する。

## pnpm workspace 設定（期待値）

```yaml
# pnpm-workspace.yaml（期待値）
packages:
  - 'apps/*'
  - 'packages/*'
```

## .nvmrc（期待値）

```
24
```

## tsconfig strict 設定（期待値）

| compilerOptions | 値 | 理由 |
| --- | --- | --- |
| strict | true | 厳格型チェック |
| noUncheckedIndexedAccess | true | 配列アクセス安全性 |
| exactOptionalPropertyTypes | true | オプショナルプロパティ厳密化 |
| noImplicitReturns | true | 暗黙の return 禁止 |
| target | ES2022 | Workers 互換 |
| module | ESNext | ESM 対応 |
| moduleResolution | bundler | バンドラー向け |
