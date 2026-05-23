# Lessons Learned — fix-verify-design-tokens-og-route-exclude（2026-05-23）

> task: `fix-verify-design-tokens-og-route-exclude`
> date: 2026-05-23
> branch: `fix/verify-design-tokens-og-route-exclude`
> 上流: Issue #806 dynamic member OG image / task-18 design-token verifier contract
> 関連 spec: `docs/00-getting-started-manual/specs/09b-design-tokens.md`
> 関連 workflow: `docs/30-workflows/completed-tasks/fix-verify-design-tokens-og-route-exclude/`、`docs/30-workflows/issue-806-dynamic-member-og-image/`
> 関連 reference: `references/workflow-fix-verify-design-tokens-og-route-exclude-artifact-inventory.md`、`references/task-workflow-active.md`（fix-verify-design-tokens-og-route-exclude 行）、`indexes/resource-map.md`（同行）
> 関連 lessons-learned: `lessons-learned-task-08-w2-design-tokens-doc-2026-05.md`（token SSOT・verifier 設計）、`lessons-learned-issue-274-public-pages-ogp-sitemap-robots-2026-05.md`（OG route runtime 制約）

## 教訓一覧

### L-FVOG-001: Next.js Metadata Files の route handler convention は satori の CSS var 非対応で raw HEX が**必須**になる

- **症状**: Issue #806 で追加した `apps/web/app/(public)/members/[id]/opengraph-image/route.tsx` が `verify-design-tokens` の forbidden HEX literal scan に false positive で fail。PR #175 がブロックされた。
- **原因**: design-token verifier は全 `apps/web/app` 配下で raw HEX を禁止する設計だが、`next/og` の `ImageResponse` 内部の satori は CSS variable (`var(--ubm-color-*)`) を解決できない。OG image 系の route handler では token を最終 hex に展開した literal を**直接書くしかない**。両不変条件が衝突する。
- **採用解**: `scripts/verify-design-tokens.ts` の `DEFAULTS.colorLiteralExcludes` を **唯一の例外 SSOT** とし、root convention 4 件（`opengraph-image.tsx` / `twitter-image.tsx` / `icon.tsx` / `apple-icon.tsx`）+ route handler convention 4 件（同名 + `/route.tsx`）の合計 8 regex を一括登録。重複していた root OG one-off filter は削除し、登録は exclude list 一箇所に統一。
- **再発防止**: OG / metadata image 系の HEX 例外を `DEFAULTS.colorLiteralExcludes` 以外に増やさない（grep で唯一性を保証）。Next.js が新 metadata image convention（例: `opengraph-video`、追加 raster path）を増やした場合は **fail closed**: 新 convention は exclude に明示登録するまで verify が落ちる設計を維持。

### L-FVOG-002: scanner はテスト可能にするため `DEFAULTS` と `scanForbiddenColorLiterals` を **named export** で公開する

- **症状**: 当初は spec が regex を duplicate して書いていたため、本体の exclude を更新しても spec が古い regex を保持し、契約乖離が起こり得た。
- **原因**: scanner 本体が module-private で、spec が再現実装に依存していた。
- **採用解**: `scripts/verify-design-tokens.ts` から `DEFAULTS`（`VerifyDesignTokenDefaults`）と `scanForbiddenColorLiterals(roots, excludes?)` を named export。`scripts/verify-design-tokens.spec.ts` は **本物の `DEFAULTS.colorLiteralExcludes`** を import し、実 path で C-EX-1〜C-EX-6 を検証する形に書き換え。
- **再発防止**: 例外 list を変更したら **必ず spec 側の C-EX-* を増減**で同期させる。spec が本体 regex を独自定義し直す書き方は禁止（review gate）。

### L-FVOG-003: drift canary は「真陽性」「真陰性」の両方を Phase-11 evidence として残す

- **症状**: 「OG route だけ通り、通常 source は落ちる」ことを CI passing だけで証明できなかった。
- **採用解**: 一時的に `apps/web/src/lib/_drift_canary.ts`（通常 source の raw HEX → 落ちる）と `apps/web/app/_canary_not_og/route.tsx`（OG convention じゃない route handler → 落ちる）を作って `verify:tokens` が exit 1 になることを確認し、その出力を `outputs/phase-11/drift-canary-fail.txt` と `outputs/phase-11/canary-non-og-route.txt` に保存。確認後、canary file は削除する。
- **再発防止**: exclude regex を新規追加する任意の future workflow で、Phase 11 に「OG 系は通す（真陰性）」「通常 source は落とす（真陽性）」「非 OG route handler も落とす（fail closed）」の 3 種類の canary evidence を残すことを Phase 11 evidence inventory の必須項目化する。

### L-FVOG-004: workflow 物理移動（`docs/30-workflows/X` → `docs/30-workflows/completed-tasks/X`）時は **artifacts.json の `evidence_path` を同 wave で grep-update**する

- **症状**: 当該ワークフローを `completed-tasks/` 配下に移動した後、`gate-metadata:validate` が 4 件 ERROR を吐き、`evidence_path not found` で `verify-pr-ready.sh` が fail。`artifacts.json` の `canonical_workflow` / `evidence_path` / parent `documentation-changelog.md` 内 path 言及・`canonical-paths.json` の `workflowDir` が旧 path のままだった。
- **採用解**: 移動 wave で grep `docs/30-workflows/<task-id>` を全 repo に対して走らせ、`completed-tasks/` 配下を含めて一括 sed 置換する。同時に aiworkflow-requirements skill 配下 (`changelog/`、`references/*-artifact-inventory.md`、`references/task-workflow-active.md`、`indexes/quick-reference.md`、`indexes/resource-map.md`) も同 wave で書き換える。
- **再発防止**: completed-tasks 移動は単一 wave で「物理 mv → grep → 全 path 一括置換 → `bash scripts/verify-pr-ready.sh` で `gate-metadata:validate` PASS 確認」を完了させる。中間状態で push しない。

## 関連メモ

- `09b-design-tokens.md` の token SSOT は今回**変更しない**。verifier 側の例外管理のみ。design rule そのものは「raw HEX は禁止」を維持。
- aiworkflow-requirements `keywords.json` / `topic-map.md` / `quick-reference.md` / `resource-map.md` への登録は `pnpm indexes:rebuild` で自動再生成（generator 経由）。手書きしない。
