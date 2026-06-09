# Workflow Artifact Inventory — public-member-detail-survey-fields-richness

## Summary

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/public-member-detail-survey-fields-richness/` |
| status | `implemented_local_visual_present_staging_pending / implementation / VISUAL_ON_EXECUTION` |
| purpose | make public member detail render survey answers as prototype-compliant rich sections and make `TEST-MEM-01` carry all public survey fields |
| user gate | staging seed apply, authenticated staging screenshots, commit, push, PR |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/web/src/lib/adapters/member-detail.ts` | stableKey-driven reconstruction into hero/business/personal/message/links/other |
| `apps/web/src/components/public/ProfileHero.tsx` | hometown chip, eyebrow, xl avatar |
| `apps/web/src/components/public/MemberDetail.tsx` | prototype section composition |
| `apps/web/src/components/public/BusinessOverviewSection.tsx` | BUSINESS OVERVIEW |
| `apps/web/src/components/public/PersonalSection.tsx` | PERSONAL KV list |
| `apps/web/src/components/public/MessageCard.tsx` | MESSAGE accent card |
| `apps/api/src/testing/test-accounts/catalog.ts` | `TEST-MEM-01` public profile fixture |
| `apps/api/src/testing/test-accounts/build-seed-sql.ts` | public response field generation |
| `apps/api/migrations/seed/test-accounts-seed.sql` | generated seed SQL |

## Evidence

| Evidence | Status |
| --- | --- |
| focused Vitest 5 files / 31 tests | PASS |
| web typecheck | PASS |
| api typecheck | PASS |
| stableKey lint | PASS |
| Phase 11 local screenshots | present |
| authenticated staging screenshots | pending_user_gate |

## Invariants

No API endpoint, API response contract, D1 migration, or Google Form schema change.

## Lessons Learned

- **L-PMDSR-001（root cause が二重なら両 lane を同一 cycle で）**: 公開ページが「薄い」根本原因は 1 つでなく 2 つ（A: apps/web adapter/components が `publicSections` を flat KV でそのまま並べる / B: `TEST-MEM-01` seed が 3 field しか持たない）。片側だけ直すと visual verification が弱いまま残るため、Lane A（web UI 再構成）と Lane B（api seed 充填）を同一 cycle で修正した。causal analysis で「症状＝薄さ」を UI 構造と seed データの 2 因に分解したのが奏功。
- **L-PMDSR-002（`other` fallback は元 section 構造を保持）**: 固定割当外の public field を 1 つの合成 section へ畳むと将来増えた質問の出所が失われる。`buildOtherSections` は元 section の `key/title` を保ったまま `MemberDetailSections` へ渡す設計とし（Phase 6 TC-A-29）、multi-section fallback の regression を `member-detail.spec.ts` に追加した。「取りこぼし防止」を構造保持で実現する。
- **L-PMDSR-003（sticky footer 重なりは local screenshot でのみ顕在化）**: screenshot review で公開 footer が PERSONAL section に重なる視覚不具合を発見し、`legacy-public.css` で `PublicFooter` を normal document flow へ戻して解消。`position: sticky` 由来の重なりは jsdom 検証では検出できず、local Playwright screenshot capture で初めて顕在化する（L-SHTL-003 と同型）。VISUAL_ON_EXECUTION で local runtime screenshot を撮る価値の実証。
- **L-PMDSR-004（Phase 12 strict 7 に `main.md` を含める）**: Phase 12 strict inventory が 6/7 の混在表記になっていたため、`main.md` を strict 7 の canonical 1 件として数え、`phase-12.md` の表記を 7 へ統一した。`main.md` は物理ファイル必須で root の代替ファイルでは満たせない（L-SHTL-004 と同型）。
- **L-PMDSR-005（implementation タスクは spec_created で止めない）**: workflow が `spec_created` のまま留まっていたが taskType は `implementation`。同一 cycle で実コードを landed し `implemented_local_visual_present_staging_pending` へ再分類して state drift を解消した。double-loop で「ドキュメントのみ」フレームを「同一 cycle 実装」へ切替えた判断。
- **L-PMDSR-006（process: skill-sync 完了には `indexes:rebuild` 明示実行が必須）**: system-spec-update-summary が「index rebuild は reference 直接更新で代替」と記して `indexes:rebuild` を遅延させたため、topic-map / keywords が新 artifact-inventory slug を反映しない stale 状態だった。skill-sync の完了判定には `pnpm indexes:rebuild` の明示実行（と冪等確認）が必須（L-TAS / L-SASR 等と同型の頻出取りこぼし点）。
- **L-PMDSR-007（process: 検証中の並行 close-out 移動は内部一貫性で判断）**: 本 skill-sync 検証中（mtime 06:25）に並行 claude セッションが workflow dir を `docs/30-workflows/` → `docs/30-workflows/completed-tasks/` へ close-out 移動した。`task-workflow-active.md` の成果物パスと workflow 内部 docs（documentation-changelog 等）がいずれも completed-tasks 指向で一貫し、かつ skill-sync 同期対象 file（resource-map / quick-reference / SKILL.md / SKILL-changelog / LOGS）の mtime が baseline（17:58）のまま＝並行はギャップ未着手だったため、revert せず移動を正規 close-out として尊重し、completed-tasks パス参照で残ギャップを補完した。判別則は「参照方向の内部一貫性」と「同期対象 mtime による並行の作業範囲特定」。
