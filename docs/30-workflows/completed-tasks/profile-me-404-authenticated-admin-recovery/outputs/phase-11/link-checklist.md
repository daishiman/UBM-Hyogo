# Phase 11 Link Checklist

Phase 11 成果物間のリンク整合チェック（ALL_LINKS_EXIST 形式）。各リンク先ファイル / アンカーの実在と状態を確認する。

## 成果物間リンク（ALL_LINKS_EXIST）

| Link | Target | Status |
| --- | --- | --- |
| `phase-11.md` → `manual-test-result.md`（手順正本） | `outputs/phase-11/manual-test-result.md` | EXISTS |
| `phase-11.md` → `main.md`（証跡サマリ） | `outputs/phase-11/main.md` | EXISTS |
| `phase-11.md` → `manual-smoke-log.md`（実行ログ雛形） | `outputs/phase-11/manual-smoke-log.md` | EXISTS |
| `phase-11.md` → `link-checklist.md`（本ファイル） | `outputs/phase-11/link-checklist.md` | EXISTS |
| `phase-11.md` → `ui-sanity-visual-review.md`（NON_VISUAL 宣言） | `outputs/phase-11/ui-sanity-visual-review.md` | EXISTS |
| `phase-11.md` → screenshots placeholder | `outputs/phase-11/screenshots/.gitkeep` | EXISTS |
| `manual-test-result.md` → SSOT | `_shared-context.md` | EXISTS |
| `manual-test-result.md` → Phase 3 特化宣言 | `outputs/phase-3/phase-3.md` | EXISTS |
| `manual-test-result.md` → diagnose script（T04 対象） | `scripts/diagnose-profile-session.sh` | EXISTS |
| `manual-test-result.md` → mint cookie smoke 資産 | `scripts/smoke/mint-staging-session-cookie.mts` | EXISTS |
| `manual-test-result.md` → runtime smoke 資産 | `scripts/smoke/runtime-admin-web.sh` | EXISTS |
| `phase-11.md` → api-cd 同型雛形 | `.github/workflows/web-cd.yml` | EXISTS |

## 検証リンク（復旧確認・user-gated 状態）

| Link | Status |
| --- | --- |
| 復旧後 `/me/healthz` 200 vs `/me` route 存在差分（RT-B） | pending（user-gated・local証跡は実施済み） |
| minted-cookie 認証 `GET {API}/me` 200（RT-C） | pending（user-gated・認証必須） |
| `/profile` 本体描画（復旧確認・RT-D） | pending（user-gated・認証必須） |
| `/login?redirect=/profile` redirect（401 回帰・page.spec.tsx で固定） | 実装着手時に focused tests で固定（spec で確定） |
| 再ログイン CTA（`MEMBER_SESSION_404` 回帰・session-error-display で固定） | 実装着手時に focused tests で固定（spec で確定） |
| staging `/profile` authenticated route | user-gated |
| API notFound `UBM-1404 GET /me` 構造化ログ（RT-E / S1 判定） | pending（user-gated・非復旧時のみ） |

> 成果物間リンクはすべて EXISTS。検証リンクは `implemented_local_runtime_pending` のため実結果 pending（user-gated）であり、これは設計通り（NO-GO ではない）。
