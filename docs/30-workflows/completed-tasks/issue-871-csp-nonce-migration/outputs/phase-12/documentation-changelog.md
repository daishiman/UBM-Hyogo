# Phase 12: ドキュメント変更履歴

## 2026-05-24 — implemented_local_evidence_captured（issue-871 CSP nonce 化）

種別: `implementation / NON_VISUAL`

issue #871（AWSHH-FU-002 / CSP nonce 化）について、Phase 1-13 workflow を作成し、同一サイクルで `apps/web` の local implementation と focused evidence を追加した。

### 追加・更新ファイル一覧

| パス | 種別 |
|------|------|
| `apps/web/src/lib/security-headers.ts` | CSP builder nonce support |
| `apps/web/middleware.ts` | nonce generation and request/response CSP propagation |
| `apps/web/src/lib/security-headers.spec.ts` | focused unit tests |
| `apps/web/__tests__/middleware.spec.ts` | focused middleware tests |
| `apps/web/playwright/tests/security-headers.spec.ts` | HTTP smoke expectation update |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/index.md` | workflow root |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/artifacts.json` | gate metadata root |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/artifacts.json` | gate metadata mirror |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-11/canonical-paths.json` | Phase 11 evidence manifest |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-11/evidence/*.log` | local evidence |
| `docs/30-workflows/completed-tasks/issue-871-csp-nonce-migration/outputs/phase-12/*` | strict 7 updated |
| `.claude/skills/aiworkflow-requirements/references/security-web-response-headers.md` | system spec sync |
| `.claude/skills/aiworkflow-requirements/references/workflow-issue-871-csp-nonce-migration-artifact-inventory.md` | artifact inventory |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | lookup entry |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | lookup entry |
| `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` | changelog row |

### 変更なし（保持）

- `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-002-csp-nonce-migration.md` は削除・改変せず保持。
- commit / push / PR / staging・production verification は user-gated。

### スコープ整合（2026-05-24 30種思考法レビュー追補）

- `index.md` スコープ表は `apps/web/app/layout.tsx` での nonce 取得・伝播 を含むが、実装では layout を変更していない。Next.js 16 App Router は middleware が **request header `Content-Security-Policy`** に nonce を埋めるとフレームワーク内部が自動抽出し、自動生成 inline script へ伝播する設計のため、`layout.tsx` を `headers().get('x-nonce')` で明示注入する必要が無かった。`<Script nonce={...}>` を明示的に書く第三者 inline script は現状存在しない。実害なしのため layout は無変更で確定する。
- `style-src-attr 'unsafe-inline'` の将来撤去 followup として `docs/30-workflows/completed-tasks/unassigned-task/awshh-followup-005-style-src-attr-retirement.md` を新規作成。過渡境界の有限性を担保する。
