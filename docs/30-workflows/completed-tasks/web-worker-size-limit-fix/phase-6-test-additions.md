# Phase 6: テスト追加

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `web-worker-size-limit-fix` |
| phase | 6 / 13 |
| phase_name | テスト追加 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| implementation_mode | `new` |
| 前Phase | 5（実装手順） |
| 次Phase | 7（カバレッジ） |
| 命名規約 | 新規/更新 test = `*.spec.{ts,tsx}` のみ（CONST_008・既存 spec への追記が中心） |

## 目的

Phase 4 のテスト計画を、実装者が貼り付けられる粒度の `it()` 記述・assert 内容へ具体化する。Task A（Playwright 更新 + 動的 OG spec 削除）と Task B（regression spec への minify grep / `next/og` grep の 2 系統追加、size gate 検証）の実コード方針を確定する。fail path / 回帰 guard を網羅する。

## 実行タスク

1. Task A: `opengraph-image.spec.tsx` 削除と残存参照ゼロ確認を手順化する。
2. Task A: `public-metadata.spec.ts` の更新後ケース一覧（静的 PNG / 静的 og:image）を `it` 単位で確定する。
3. Task B: `opennext-config-regression.spec.ts` に minify assert / `next/og` 0 件 assert の 2 系統を追加する実コード方針を確定する。
4. Task B: `check-worker-size.sh` の dry-run 実行検証ケース（TC-B101..B104）の実行手順と evidence を確定する。

## 参照資料

- `phase-4-test-plan.md`（TC 期待値表）
- `apps/web/playwright/tests/public-metadata.spec.ts`
- `apps/web/__tests__/opennext-config-regression.spec.ts`（既存 4 `it` の parse ヘルパ）
- `apps/web/app/(public)/members/[id]/__tests__/opengraph-image.spec.tsx`（削除対象）

## 実行手順

### Task A-1: 動的 OG spec 削除（`opengraph-image.spec.tsx`）

- ファイルごと削除する（`vi.mock("next/og", ...)` 含む 4 `it`：profile 存在 / occupation 空 / notFound / rethrow）。
- 削除後の残存参照チェックを Phase 6 完了条件にする:
  ```bash
  rg -n "opengraph-image/route" apps/web        # 0 件
  rg -n "next/og|ImageResponse" apps/web/app apps/web/src  # 0 件
  ```

### Task A-2: `public-metadata.spec.ts` 更新後ケース一覧

更新後の `it` 構成（TC は phase-4 に対応）:

| `it` | TC | assert 内容 |
| --- | --- | --- |
| `public pages ... exposes OG and Twitter meta tags`（既存 for ループ） | TC-A205 | 不変。`og:image` `toHaveCount(1)` 等を維持 |
| `/members/[id] exposes member detail OG and Twitter meta tags`（既存） | TC-A205 | 不変。member 詳細でも meta tag 群が 1 件存在 |
| `/members/[id] exposes static og:image path`（**更新**: 旧 member-specific） | TC-A202 | `const content = await og.getAttribute("content")` に対し `expect(content!).toContain("/og-default.png")` かつ `expect(content!).not.toContain("/opengraph-image")`。`twitterContent` も同様 |
| `/og-default.png returns static PNG`（**新規**: 旧 `/opengraph-image returns PNG` を置換） | TC-A201 | `request.get("/og-default.png")` → `status 200`、`content-type` includes `image/png`、`body.subarray(0,8).toString("hex") === "89504e470d0a1a0a"` |
| `/sitemap.xml ...` / `/robots.txt ...`（既存） | — | 不変 |
| `/members/<nonexistent>/opengraph-image returns 404`（**削除**） | TC-A203 | route 撤去のためケースごと削除 |
| `/members/[id]/opengraph-image returns PNG`（**削除**） | TC-A204 | 同上。`writePhase11Evidence("og-image-seeded.png", ...)` も除去 |
| `/opengraph-image returns PNG`（**削除**） | TC-A204 | root 動的 OG 撤去のため削除 |

- `og-image-meta-grep.txt` の evidence 出力は TC-A202 更新後の content（`/og-default.png`）を記録するよう更新（任意・Phase 11）。

### Task B-1: `opennext-config-regression.spec.ts` への 2 系統追加

既存 4 `it`（wrangler.toml / .assetsignore / package.json deploy script 不在）は維持（TC-B203）。以下 2 `it` を `describe("OpenNext Workers config regression guard", ...)` 内に追加する。

#### B-1-a. production minify 維持 assert（TC-B201）

```ts
it("enables OpenNext bundle minify to keep Worker under the 3 MiB limit", () => {
  const configSource = readFileSync(
    resolve(repoRoot, "apps/web/open-next.config.ts"),
    "utf8",
  );
  // Phase 5 で確定する @opennextjs/cloudflare v1.19.4 の正確な minify キーに合わせる
  expect(configSource).toMatch(/minify\s*:\s*true/);
});
```

- assert 文言は Phase 5 で確定した事実（OpenNext v1.19.4 に `minify` config key 不在）に合わせ、`OPEN_NEXT_DEBUG` / `debug: true` の混入禁止を検証する。`repoRoot` は既存 spec の `resolve(import.meta.dirname, "../../..")` を再利用。

#### B-1-b. `next/og` 0 件 grep assert（TC-B202 / TC-A301 を 1 本化）

```ts
it("does not reintroduce next/og (@vercel/og) which embeds resvg/yoga wasm", () => {
  const targets = [
    resolve(repoRoot, "apps/web/app"),
    resolve(repoRoot, "apps/web/src"),
  ];
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "__tests__" || entry.name === "node_modules") continue;
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        const src = readFileSync(full, "utf8");
        if (/from\s+["']next\/og["']/.test(src) || /\bImageResponse\b/.test(src)) {
          offenders.push(full);
        }
      }
    }
  };
  for (const t of targets) walk(t);
  expect(offenders, `next/og references: ${offenders.join(", ")}`).toEqual([]);
});
```

- `readdirSync` は `node:fs` から追加 import する（既存 spec は `readFileSync` のみ import のため `import { readFileSync, readdirSync } from "node:fs"` に拡張）。
- `__tests__` を除外して、テスト文字列内の `next/og` を誤検知しない。

### Task B-2: `check-worker-size.sh` 検証ケース（TC-B101..B104）

shell は決定論的で vitest spec を持たない（Script First）。Phase 6 では以下を実行 evidence にする:

| TC | 実行手順 | PASS 判定 |
| --- | --- | --- |
| TC-B101 | `build:cloudflare` 後 `bash scripts/check-worker-size.sh` | exit 0、stdout に `gzip: NNNN KiB` < 3072 |
| TC-B102 | `WORKER_SIZE_OVERRIDE_KIB=2900 bash scripts/check-worker-size.sh` | exit 0、stderr に WARN |
| TC-B103 | `WORKER_SIZE_OVERRIDE_KIB=3100 bash scripts/check-worker-size.sh` | exit 1 |
| TC-B104 | dry-run 出力に `gzip:` 行が無い状態（fallback path）で実行 | `.open-next` gzip 合算で計測し同判定 |

- TC-B301（web-cd.yml の step 配置）は `.github/workflows/web-cd.yml` の手動 review + 任意で regression spec から `readFileSync` で `check-worker-size.sh` 呼び出し step の存在を assert する。

## 統合テスト連携

- `mise exec -- pnpm --filter @ubm-hyogo/web test` で regression spec（minify / `next/og` 0 件 / 既存 4 維持）を実行。
- Playwright smoke（`playwright-smoke`）で更新後 `public-metadata.spec.ts`（静的 PNG 200 / 静的 og:image）を実行。
- `bash scripts/check-worker-size.sh` を `build:cloudflare` 後に実行し size gate を統合検証。
- coverage は Phase 7 で `bash scripts/coverage-guard.sh` により apps/web 4 軸 >=80% を統合判定。

## 多角的チェック観点（AIが判断）

- システム系: 削除テスト（動的 OG）と新規 guard（`next/og` 0 件）が「撤去したものは戻さない」回帰ループを閉じているか。
- 戦略・価値系: 静的 og:image 許容（`/og-default.png`）が OG 機能縮退と引き換えにデプロイ可能性を取る判断と一致しているか。
- 問題解決系: size gate 検証（TC-B101..B104）が「サイズ超過の CI 非検出」という主問題を上限・warn 両面で塞いでいるか。

## サブタスク管理

| ID | 内容 | 対象 | 依存 |
| --- | --- | --- | --- |
| ST-6A1 | 動的 OG spec 削除 + 残存参照ゼロ確認 | opengraph-image.spec.tsx | Phase 5 #2 |
| ST-6A2 | Playwright 静的 OG ケース更新 | public-metadata.spec.ts | Phase 5 #3/#4/#5 |
| ST-6B1 | regression spec minify assert 追加 | opennext-config-regression.spec.ts | Phase 5 #8 |
| ST-6B2 | regression spec `next/og` 0 件 assert 追加 | opennext-config-regression.spec.ts | Phase 5 #1/#2 |
| ST-6B3 | check-worker-size.sh 検証実行 | scripts/check-worker-size.sh | Phase 5 #9 |

## 成果物

- 本ファイル `phase-6-test-additions.md`（`it` 単位の実コード方針 + assert 内容 + size gate 検証手順）

## 完了条件

- [ ] `opengraph-image.spec.tsx` 削除と残存参照ゼロ（`next/og` / `opengraph-image/route` grep 0 件）の手順が定義されている
- [ ] `public-metadata.spec.ts` の更新後ケース一覧（静的 PNG TC-A201 / 静的 og:image TC-A202 / 削除 TC-A203/A204）が `it` 単位で確定している
- [ ] regression spec に minify assert（TC-B201）と `next/og` 0 件 assert（TC-B202）の実コード方針が定義されている
- [ ] check-worker-size.sh の検証ケース（TC-B101..B104）の実行手順が定義されている
- [ ] 新規/更新 test がすべて `*.spec.{ts,tsx}` 命名である
- [ ] coverage AC を含む（apps/web: Statements/Branches/Functions/Lines >=80% / `bash scripts/coverage-guard.sh` exit0）

## タスク100%実行確認【必須】

- [ ] ST-6A1 / ST-6A2 / ST-6B1 / ST-6B2 / ST-6B3 を完了した
- [ ] Phase 4 の全 TC を `it` 記述／実行手順へ 1:1 で具体化した
- [ ] fail path（TC-B103 上限超過 exit1）と回帰 guard（`next/og` 0 件）を網羅した
- [ ] 統合テスト連携（vitest / Playwright / size gate / coverage）を残した

## 次Phase

Phase 7（カバレッジ）— 変更ファイルの coverage layer 表と apps/web 4 軸 >=80% / `coverage-guard.sh` exit0 を確定する。
