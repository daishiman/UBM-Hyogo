# Lessons Learned — admin-member-detail-status-404-fix (2026-06-02)

admin 会員管理の `GET /admin/members/:memberId` / `PATCH /admin/members/:memberId/status` が staging で 404 になる問題（`member_status` 欠落 orphan 起因）を apps/api 内で根本修正したサイクルから得た再利用可能な知見。NON_VISUAL / implementation / `implemented_local_evidence_captured`。

## L-ADMDET-001: orphan child-row 由来の 404 は「耐性化・予防・backfill」3 層で根絶する

- 症状: `member_identities` 行はあるが `member_status` 行が欠落した orphan 会員で、一覧（`members.ts:329` の `LEFT JOIN member_status`）は 200 で出るのに、詳細（`builder.ts:388/391` の `return null`）と status PATCH（`member-status.ts:53` の `if (!before) 404`）だけ 404 になる非対称デッドロック（表示できない → 更新もできない）。
- 対策 3 層:
  - 耐性化（即時可用）: builder は `member_status` / `current_response` 欠落でも default 値で degraded view を返し、404 境界を「親行（identity）不在のみ」へ縮小する（F-2 / F-3）。
  - 予防（再発防止）: ingest（Forms sync）で新規 identity を作る同経路で `ensureMemberStatusRow` を必ず呼び、新規 orphan の発生を止める（F-4）。
  - backfill（既存修復）: `INSERT OR IGNORE ... SELECT ... LEFT JOIN child ON ... WHERE child IS NULL` の冪等 migration で既存 orphan を一括補完する（F-5 / migration 0024）。
- 適用条件: D1 の親子テーブルで「子行欠落 → 読み取り/更新が 4xx・不整合」になるあらゆる整合性 bugfix（`member_status` / `member_photos` / follow-up 系）。

## L-ADMDET-002: degraded view の既定値は DB DEFAULT と 1:1 一致させ純関数で共有する

- 症状: 欠落時の代替値を builder / ensure / migration / test の複数箇所に重複定義すると、DB DEFAULT（`0002_admin_managed.sql:5-15`）と乖離して silent な不整合が起きる。
- 対策: `defaultMemberStatusRow()` 純関数 1 か所で既定値（`public_consent='unknown'` / `rules_consent='unknown'` / `publish_state='member_only'` / `is_deleted=0`）を返し、builder degraded view・`ensureMemberStatusRow`・spec の assertion がすべてこの関数を参照する。DB DEFAULT との一致を test で固定する。
- 適用条件: 「欠落時の代替値」を複数層で参照する整合性 bugfix 全般。

## L-ADMDET-003: NON_VISUAL かつ apps/web diff 0 の bugfix は screenshots ディレクトリを作らない

- 症状: `outputs/phase-11/screenshots/.gitkeep` を作ると Phase 11 evidence validator が PNG 0 件を missing-evidence と判定して fail する。UI 無変更（apps/web diff 0）の bugfix では修正前後で同一画面となり screenshot の証跡価値も無い。
- 対策: `screenshots/` ディレクトリ・`.gitkeep` を作らず、Phase 11 の主証跡は focused D1 Vitest PASS とし `manual-test-result.md` に手順と結果を記録する。staging 実機確認（authenticated admin）は user-gated として Phase 11 / Phase 13 の散文に記載し、`pending` 状態の実在ファイルとして列挙しない（physical file 検査と整合）。
- 適用条件: NON_VISUAL かつ apps/web diff 0 の apps/api 内 bugfix 全般。

## L-ADMDET-004: implemented_local close-out で Step 1/2 を N/A にしない

- 症状: `implemented_local_evidence_captured` の workflow で system-spec-update-summary の Step 1-A〜1-C を「N/A」と書くと close-out の証跡が失われ、後続監査で「実施済か判断できない」状態になる。
- 対策: Step 1-A（local テスト PASS）・1-B（typecheck/lint）・1-C（apps/web diff 0 grep + 関連タスク差分）を `implemented_local_evidence_captured` と明示記録する。Step 2（新規 public API / IPC 契約追加）は内部 repository helper のみで公開 surface 不変なら N/A とし、「内部 helper・契約追加なし」の根拠を 1 行添える。これにより aiworkflow-requirements の API/IPC 契約 references 更新が不要であることを機械的に説明できる。
- 適用条件: `implemented_local_evidence_captured` status の全 implementation workflow。

## L-ADMDET-005: backfill / ensure は INSERT OR IGNORE で冪等性を担保し 2 回適用テストで固定する

- 症状: backfill migration が冪等でないと、rollback 後の再適用や ingest の重複呼び出しで重複行・constraint violation が発生する。
- 対策: `ensureMemberStatusRow` は `INSERT OR IGNORE INTO member_status (member_id) VALUES (?1)` で既存行を破壊せず、migration 0024 は「親あり・子なし」の行のみ補完する。`migrations/__tests__/0024_backfill_member_status.spec.ts` で「2 回適用しても結果が同一」を `vitest.d1.config.ts` 経由（D1 config 必須）で PASS assert する。`setPublishState` の既存 `INSERT ... ON CONFLICT` も同じ冪等原則。
- 適用条件: D1 backfill migration / ensure 系 helper 全般。
