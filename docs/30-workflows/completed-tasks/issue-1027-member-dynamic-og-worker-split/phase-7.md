# Phase 7 — カバレッジ確認 / bundle サイズ実測

[実装区分: implementation]

> 変更・新規ファイルに限定したカバレッジ目標と、OG worker bundle の gzip サイズ実測手順を定義する。
> 全体一律カバレッジではなく、#1027 で触れた範囲に限定する。
> 正本アーキテクチャは `index.md` / `phase-1.md`〜`phase-3.md` で確定済み。

---

## 7.1 カバレッジ対象（限定スコープ）

| ファイル | 種別 | 行/分岐カバレッジ目標 | 重点 |
|----------|------|----------------------|------|
| `apps/og/src/member-source.ts` | 新規 | 行 ≥ 90% / 分岐 ≥ 90% | falsy ガード全分岐（undefined/null/""/空白）・404/500/例外・部分欠落 |
| `apps/og/src/index.ts` | 新規 | 行 ≥ 90% / 分岐 100%（success / default / catch の 3 経路） | フォールバック分岐・/health・404 |
| `apps/og/src/render.tsx` | 新規 | 行 ≥ 80% | `renderMemberOg` / `renderDefaultOg` の正常系。wasm 依存で測定困難な部分は smoke で代替担保（測定除外を明記） |
| `apps/web/src/lib/seo/site-metadata.ts`（差分） | 編集 | `buildMemberOgImageUrl` の全分岐（未設定 / 設定 / 末尾スラッシュ / 空文字） | 追加関数のみが対象（既存関数の網羅率は不問） |
| `apps/web/src/lib/env.ts`（差分） | 編集 | 追加スキーマ 1 行（parse 経路） | optional / 不正 URL |
| `apps/web/src/app/(public)/members/[id]/page.tsx`（差分） | 編集 | `generateMetadata` の og/twitter 分岐 | twitterCard / ogImagePath フォールバック |

> `render.tsx` の wasm 実行部はカバレッジ計測器の到達が不安定なため、`render-smoke.spec.ts`（Phase 4）による振る舞い担保を正とし、coverage の数値目標からは wasm ロード部を除外する旨を注記で明示する。専用 vitest config は追加せず root config を再利用する。

カバレッジ実行:
```bash
mise exec -- pnpm --filter @ubm-hyogo/og test -- --coverage
mise exec -- pnpm --filter web test -- --coverage site-metadata page-metadata env
```
report 出力先・閾値は対象ファイル限定で確認（モノレポ全体閾値を引き上げない）。

---

## 7.2 OG worker bundle gzip サイズ実測手順

予算: **3 MiB（gzip）**。`workers-og`（satori + resvg-wasm）+ 日本語フォント subset で膨らみやすいため必須。

手順:
```bash
# 1) OG worker をビルド（dist/index.js を生成）
mise exec -- pnpm --filter @ubm-hyogo/og build

# 2) size gate スクリプトを OG dist ディレクトリに適用（index.js + wasm 合算・後方互換拡張）
bash scripts/check-worker-size.sh apps/og/dist

# 参考: 手動で gzip サイズだけ確認（index.js + wasm 合算が実 Worker サイズ）
find apps/og/dist -type f \( -name '*.js' -o -name '*.wasm' \) -exec gzip -c {} \; | wc -c   # 概算 bytes
```

判定:
- gzip サイズ ≤ 3 MiB → exit 0（CI 通過）。
- 超過 → non-zero exit（CI fail）。`og-cd.yml` の size gate ステップで deploy 前にブロック。

---

## 7.3 サイズ超過時のフォント subset 調整方針

予算超過時の対処優先順位（影響小→大）:

1. **フォント subset の縮小**: Noto Sans JP を会員名で使われる文字種（常用漢字 + ひらがな + カタカナ + 英数記号）に限定。weight を 400 単独（700 を落とす）に削減。
2. **weight 統合**: bold をやめ、見出しは font-size / letter-spacing で強調。
3. **wasm の遅延 / 共有**: resvg-wasm を可能なら外部資産化（ただし Workers のバンドル制約に従う）。
4. **default OG を静的 PNG 化**: `renderDefaultOg` をビルド時生成の固定 PNG に置換し、ランタイム satori 呼び出しを member 描画時のみに限定（bundle 自体は減らないが実行コスト低減）。

> subset 縮小は描画可能文字の制約とトレードオフ。欠落文字は `.notdef`（豆腐）になるため、subset 範囲は「会員 fullName / occupation で実際に現れうる文字集合」を上限に設定し、Phase 6 OG-X 系（フォント欠落）テストで豆腐化が default fallback を誘発しないことを確認する。

---

## 7.4 web 側 bundle 非膨張の確認

- `apps/web` は OG を別 worker に分離したため、web bundle に next/og 系を含まない。
- 既存 web size gate（`scripts/check-worker-size.sh` を web bundle に適用）が #1027 後も GREEN であることを確認（AC: size gate web/og 双方）。
```bash
mise exec -- pnpm --filter web build
bash scripts/check-worker-size.sh   # 無引数で apps/web/.open-next を自動走査
```

---

## 7.5 DoD（Phase 7）

- 対象ファイル限定のカバレッジが目標値を満たす（render.tsx wasm 部は smoke で代替担保・除外明記）。
- OG worker bundle が gzip 3 MiB 以内で、`WORKER_FILE` 指定の size gate が exit 0。
- web bundle size gate が #1027 後も GREEN（next/og 非混入）。
- 超過時のフォント subset 調整方針が文書化されている。
- 受け入れ条件 AC-1〜AC-9（phase-1.md）が Phase 4〜7 のテスト / 実測でカバーされていることを確認（size gate web/og、OG 200 image/png、フォールバック、metadata 統合、env アクセサ経由、CI）。
