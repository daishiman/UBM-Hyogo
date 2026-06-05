# lessons-learned-issue-1078-bulk-tag-picker-large-catalog-ux-2026-06

`issue-1078-bulk-tag-picker-large-catalog-ux`（`implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`）の知見。元 issue は cosmetic な large-catalog UX を主題にしていたが、実コードでは依存先 API の応答 shape 変更で client fetch が壊れており、その P0 contract バグを同一サイクルへ取り込んで解消した。

## L-I1078-001 古い issue は依存先 endpoint の応答 shape を実コードで突合する

- Situation: 元 issue #1078 は「50 件超のタグで picker が使いにくい」という cosmetic UX を主問題に置いていた。だが実コードでは `fetchTagMaster()` が `{ available }` を読む前提のまま、依存先 #1035 が `GET /admin/tags` を `{ total, items }` へ変更しており、`r.available` が `undefined` → `BulkActionBar` の `groupedTags` for-of が空表示／クラッシュしていた。
- Resolution: Phase 1 inventory で「issue が古い場合、依存先 endpoint の実応答 shape を実コードで突合する」を必須化。本タスクでは contract バグを AC-0 として最優先化し、cosmetic UX より先に修正した。
- Verification: `members.spec.ts` が `{ total, items }` 応答を mock し、`{ available, total }` への正規化と pagination/cap/error 契約を 11 tests でカバー。

## L-I1078-002 test mock の shape を実 API response schema と突合する

- Situation: `BulkActionBar.spec.tsx` の fetch mock が実 API 形（`{ total, items }`）ではなく client の誤った前提（`{ available }`）を mirror していたため、テストは緑のまま runtime 破綻を隠蔽していた。
- Resolution: component が叩く endpoint の実 response schema と test mock の shape を突合する guard を入れる。mock を `{ total, items }` の real shape に修正したことで、正規化漏れがテストで検出可能になった。
- Verification: 修正後の `BulkActionBar.spec.tsx` 20 tests は real API mock 経由で large catalog regression を含めて緑。mock が誤前提を再現していた旧版なら fetch 正規化バグを検出できなかった。

## L-I1078-003 paginated mode の selected ラベルは known-tag の accumulated Map で保持する

- Situation: ページング／検索で絞り込んだ結果に含まれないタグも、selected chip としてラベル付きで描画し続ける必要があった（AC-4: selected は available から独立）。
- Resolution: `Map<tagId, AdminTagRef>` に既知タグを蓄積し、現在の filtered/fetched 結果の外にある selected でも label を解決する。解決できない場合は id fallback。selected Set 自体は available catalog から独立に保つ。
- Verification: `BulkActionBar.spec.tsx` が「現在ページ外の selected が label 付きで pinned row に残る」regression を assert。

## L-I1078-004 client pagination の default pageSize は API max に合わせ、cap guard で無限ループを防ぐ

- Situation: 旧実装は 50 件で silently truncate していた（>50 タグが黙って欠落）。
- Resolution: `fetchAllTagMaster()` を `pageSize=100`（#1035 の API max）で page walk させ、cap guard と truncated 判定で過剰ループと無制限取得の双方を防ぐ。apps/api は #1035 read endpoint が landed 済みのため変更不要。
- Verification: `members.spec.ts` が pageSize default・cap・truncated guard を契約テストで固定。

## L-I1078-005 並列 SubAgent の backbone Write はワークツリー root 相対／pwd 確認済み絶対パスで行う

- Situation: 仕様書 backbone を絶対パスで Write する際にワークツリー prefix を欠き、メインリポジトリ側へ書き込む path 事故が発生した（後に単一 root へ統合・残骸削除で復旧）。
- Resolution: ファイル生成は必ずワークツリー root からの相対パス、または `pwd` で確認した絶対パスを使う。並列 SubAgent には起動 cwd（ワークツリー root）を明示し、生成後に `git status` で root 不一致の残骸が無いか検査する。
- Verification: 統合後 `git status` クリーン、全成果物が単一 workflow root 配下に存在。

## L-I1078-006 artifacts.json の gate `status` は zod enum 4 値のみ（`pending_user_approval` は不可）

- Situation: Gate-C を `"status": "pending_user_approval"` と記述したため、`gate-metadata:validate` が `schema: 2.status — Invalid option: expected one of "pending"|"passed"|"failed"|"waived"` で ERROR 2 件（root + outputs parity）。
- Resolution: gate の機械検証 `status` は `pending|passed|failed|waived` のみ。user-gated の意味は `status:"pending"` + `passed_at:null` で表し、「PR / staging visual / issue mutation は user 承認後」のニュアンスは自由記述の `notes` に書く。root と outputs/artifacts.json の両方を同値で直す（parity）。
- Verification: 修正後 `gate-metadata:validate` の ERROR 0、`verify:phase12-compliance` は `ok:true` を維持。

## 関連パターン

- 依存先 API shape の実コード突合（L-I1078-001）と test mock parity guard（L-I1078-002）は、UI 緑のまま runtime contract が壊れる隠れ破綻の予防として task-specification-creator 側の Phase 1/4/9 チェックへ昇格候補。
- gate enum の機械検証（L-I1078-006）は [[lessons-learned-issue-1054-wrangler-binding-drift-ci-gate-2026-06]] の gate-metadata 知見（passed_at:null refine）と同系の artifacts.json schema 制約。
