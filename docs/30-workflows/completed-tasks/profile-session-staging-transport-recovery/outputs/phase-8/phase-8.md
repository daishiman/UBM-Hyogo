# Phase 8: リファクタリング方針 + エラーパターン / fail-fast / rollback

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 8 / 13 |
| taskType | implementation |
| implementation_mode | `edit` |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

T03 実装直後に生じる「単発 resolve（`resolveApiFetch` / `fetchViaApiTransport`）と chain の一時的な重複」（Phase 3 MINOR-1）を回収するリファクタリング方針（対象 / Before / After / 理由）を確定し、T01〜T04 で起こり得る失敗パターンと fail-fast 条件・rollback 起点（**merge revert 手順を含む**）を列挙する。

## 実行タスク

### 8.1 リファクタリング方針（MINOR-1 回収: 単発 resolve を chain の内部要素として整理）

| 対象 | Before（T03 実装直後） | After（本 Phase 適用後） | 理由 |
| --- | --- | --- | --- |
| 候補解決ロジック | `resolveApiFetch`（単発・優先順位 isTest→binding→internal→localhost）と `resolveApiTransportChain`（候補列）が**同じ優先順位ロジックを二重に持つ** | `resolveApiFetch(env)` を **`resolveApiTransportChain({...env})[0]` を返す互換 wrapper** として再定義（または chain 構成の共通内部関数を両者が呼ぶ）。優先順位の SSOT は chain 構成 1 箇所に集約 | 優先順位の将来変更（候補追加等）が 1 箇所で済む。単発系 caller（magic-link / gate-state / api/me proxy / verify-magic-link）は**シグネチャ・挙動不変**のまま恩恵を受ける |
| 単発実行 | `fetchViaApiTransport`（1 transport 実行 + `ApiTransportError` 包み）と chain 実行が並立 | `fetchViaApiTransport` は **chain 実行の最小 primitive として現状維持**し、`fetchViaApiTransportChainWithMeta` が内部で再利用する（task-03 §2 の実装構造どおり）。重複実装を作らない | 1 transport の実行 + エラー包みは chain の構成要素そのもの。削除せず「chain の内部要素」として位置づけを README コメントで明記 |
| descriptor 生成 | `describeTransport` を authed.ts と chain 内 warn の両方が呼ぶ | 現状維持（純関数の多点呼び出しは重複でない）。warn payload 整形だけ chain 内に閉じる | `describeTransport` が transportKind/baseHost の SSOT。整形ロジックを増殖させない |
| 互換 wrapper の検証 | — | `resolveApiFetch` の既存テスト（T01 取込分含む）を**無変更で green** に保つことを wrapper 化の合格条件とする | 既存 caller（4 route + verify-magic-link）の挙動凍結。挙動差が出る wrapper 化は不採用（重複保持の方が安全） |

> 本 Phase の適用は T03 の DoD 達成後・同一サイクル内。wrapper 化で既存 `resolveApiFetch` テストに赤が出る場合は MINOR-1 を「重複コメント明記のみ」へ縮退し、コード統合は見送る（fail-fast。契約安定 > 重複排除）。

### 8.2 エラーパターン一覧

| # | 段階 | エラー | 検出 | ハンドリング |
| --- | --- | --- | --- | --- |
| E-1 | T01 統合 | コンフリクトが想定（最小）を超える / 解消後にテスト赤 | task-01 §6 | 両意図保持で再解消。解消不能なら §8.4 の merge rollback で起点へ戻し、dev 側変更との衝突原因を特定してから再 merge |
| E-2 | T01 統合 | magic-link 系 spec が fail-closed 追従漏れで赤 | task-01 §6 手順 3 | merge 側の `vi.stubEnv("ENVIRONMENT", "local")` 追加が落ちていないか diff 確認 |
| E-3 | T02 | EV-1 が green にならない（field 単位 parse が効かない） | Phase 9 vitest | `AuthEnvSchema.shape` の iterate と `undefined` スキップ順序を task-02 §2 と照合 |
| E-4 | T02 | EV-2 で warn payload に値が混入 | Phase 9 vitest | payload を `{ keys }` 固定に戻す（**AC-5 NO-GO**） |
| E-5 | T03 | FB-3 で HTTP エラー Response に fallback してしまう | Phase 9 vitest | fallback 条件を `error instanceof ApiTransportError` のみへ戻す（**AC-3/AC-7 NO-GO**: status 体系侵襲） |
| E-6 | T03 | CH-5 で非明示環境が localhost に落ちる | Phase 9 vitest | `environmentExplicit === true` ガードの欠落を確認（**AC-4 NO-GO**: fail-closed 崩れ） |
| E-7 | T03 | FB-4 で POST が fallback される | Phase 9 vitest | `FALLBACK_SAFE_METHODS` 判定（`init?.method ?? "GET"` の大文字化）を確認（二重適用リスク・NO-GO） |
| E-8 | T03 | AU-2 で 401 が `AuthRequiredError` にならない / PG-1 redirect 回帰 | Phase 9 vitest | chain が Response に介入していないか確認。介入していれば T03 revert（**AC-7 NO-GO**） |
| E-9 | T03 | FB-6 で warn に cookie/headers が混入 | Phase 9 vitest | warn payload を `{from, to, path}` 固定へ戻す（**AC-5 NO-GO**） |
| E-10 | T04 | probe が web `/me`（旧経路）のまま / `/api/me` が常に 404 | task-04 §6 | probe path を proxy 実経路へ。catch-all 不一致なら task-04 §2 実装注意のとおり `/api/me/profile` へ調整 |
| E-11 | T04 | 出力に secret/cookie 実値が混入 / wrangler 直叩き | task-04 §7 DoD-T04-6/3 | 出力 key を §2 の固定セットへ戻す。版数確認は hint 文字列出力のみへ（NO-GO） |
| E-12 | 8.1 適用 | `resolveApiFetch` wrapper 化で既存テスト赤 | Phase 9 vitest | wrapper 化を見送り重複コメント明記へ縮退（8.1 の fail-fast） |
| E-13 | 横断 | `pnpm typecheck` / `pnpm lint` exit≠0 | Phase 9 | `lint --fix` → 残件を最小差分で手修正 |

### 8.3 fail-fast / NO-GO 条件

- Phase 9 の typecheck / lint / focused vitest / `bash -n` / grep ゲートの**いずれか 1 件でも fail したら commit へ進まない**。
- **NO-GO 条件**（該当 diff を revert し Phase 2/3 の設計へ戻る）:
  - AC-3/AC-7: HTTP エラー Response への fallback 介入・401 `AuthRequiredError`/404 CTA/`/profile` 文言の回帰（E-5/E-8）。
  - AC-4: 非明示環境での localhost fallback（E-6）。
  - AC-5: ログへの値・secret・cookie・memberId 露出（E-4/E-9/E-11）。
  - AC-7: `apps/api` への diff 混入・`/me` 契約変更。
- 本サイクルは worktree 内で完結（未 push）のため、すべての変更は完全に戻せる。

### 8.4 rollback 起点（merge revert 手順含む）

| 状況 | rollback 手順 |
| --- | --- |
| T01 統合 自体を取り消す（T02/T03 着手**前**・未 push） | `git reset --hard origin/dev`（work branch を起点へ戻す。最速・履歴も消える） |
| T01 統合 を取り消す（T02/T03 着手**後** or 履歴保持が必要） | `git revert -m 1 <T01-merge-commit-sha>`。**注意**: T02/T03 は T01 の型（`ApiTransportError` 等）に依存するため、先に T02/T03 の commit を `git revert` してから merge を revert する（逆順 revert）。typecheck が依存欠落を fail-fast で検出する |
| T02 のみ revert | `git checkout -- apps/web/src/lib/env.ts apps/web/src/lib/__tests__/env.spec.ts`（commit 済なら該当 commit を `git revert`）。F-A は未根治に戻るが他タスクへ影響なし |
| T03 のみ revert | task-03 §7 の 5 ファイル checkout / 該当 commit revert。単発 transport（観測性あり・fallback なし）へ戻る。8.1 の wrapper 化を適用済みの場合は wrapper commit も同時に revert |
| T04 のみ revert | `git checkout -- scripts/diagnose-profile-session.sh`。旧 probe（誤誘導あり）へ戻るのみ |
| 8.1（MINOR-1 回収）のみ revert | wrapper 化 commit を revert。chain と単発の重複併存（T03 直後の状態）へ戻る。機能・契約は不変 |
| staging deploy 後の障害（Phase 11 で発覚） | deploy は user-gated。`bash scripts/cf.sh rollback <VERSION_ID> --config apps/web/wrangler.toml --env staging`（CLAUDE.md の rollback 規約）。コード側は上記の各 revert を適用して再 deploy |

> 4 タスクは env / transport+authed / scripts で対象ファイルが排他のため、1 タスクの revert が他タスクの成果を巻き込まない。唯一の依存は「T02/T03 が T01 の型に依存」であり、revert は必ず T02/T03 → T01 の順で行う。

## 完了条件

- [x] MINOR-1 回収方針（`resolveApiFetch` を chain の先頭要素 / 互換 wrapper として整理・`fetchViaApiTransport` を chain の内部 primitive として位置づけ）を 対象 / Before / After / 理由 で確定
- [x] wrapper 化の合格条件（既存テスト無変更 green）と縮退条件（fail 時はコメント明記のみ）を明示
- [x] E-1〜E-13 のエラーパターンを段階・検出・ハンドリング付きで列挙
- [x] fail-fast / NO-GO 条件（AC-3/AC-4/AC-5/AC-7）を明示
- [x] rollback 起点を merge revert（reset / `git revert -m 1` + 逆順 revert 注意）含めて確定

## 成果物

- `outputs/phase-8/phase-8.md`（本ファイル）

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 認証設計 | `docs/00-getting-started-manual/specs/02-auth.md` | 401/410 境界（NO-GO の根拠） |
| API schema | `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約不変（AC-7 NO-GO の根拠） |

- `outputs/phase-3/phase-3.md` §3.6（MINOR-1/MINOR-2 の追跡元）
- `outputs/phase-5/task-01..04`（各タスクの個別 rollback）
- `outputs/phase-2/phase-2.md` §2.4（resolveApiFetch 再利用方針）
- `CLAUDE.md`（`bash scripts/cf.sh rollback` 規約・sync-merge ポリシー）

## 統合テスト連携

E-1〜E-13 の検出は Phase 9 の品質ゲートに紐づき、NO-GO（AC-3/AC-4/AC-5/AC-7）違反は Phase 10 の最終レビューで blocker 判定の根拠になる。8.1 の wrapper 化は既存 `resolveApiFetch` テスト + Phase 6 の CH/FB 系の**両方 green** を合格条件とし、Phase 11 の staging 復旧検証（user-gated）前に完了させる。
