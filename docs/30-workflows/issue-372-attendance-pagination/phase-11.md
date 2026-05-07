# Phase 11: 手動実機検証（VISUAL）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Planned output | `outputs/phase-11/phase-11.md` |
| visualEvidence | VISUAL |

## 目的
VISUAL evidence と curl evidence を取得し、ページング動作が staging で実機 PASS することを確認する。

## evidence 取得手順
0. Phase 2 の `outputs/phase-2/cursor-format.md` を確認し、cursor encode/decode と HTTP 400 仕様を固定する。
1. staging に deploy（`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` / web 同様）。
2. test fixture: `manju.manju.03.28@gmail.com`（一般会員）に attendance 60 件を seed する SQL を staging D1 に流す（runbook 化）。
3. **profile VISUAL**: ブラウザでログイン → `/profile` で attendance セクション初期状態を screenshot → 「もっと見る」クリック後 → 末尾到達。3 枚保存。
4. **admin VISUAL**: admin (`manjumoto.daishi@senpai-lab.com`) でログイン → `/admin/members/<test-user-id>` の attendance セクションで同様に 3 枚保存。
5. **curl evidence**:
   ```bash
   curl -s "https://staging.ubm-hyogo.../api/me/profile" -H "Cookie: ..." > evidence/me-profile-page1.json
   curl -s "https://staging.ubm-hyogo.../api/me/attendance?cursor=<NEXT>" -H "Cookie: ..." > evidence/me-attendance-page2.json
   curl -s "https://staging.ubm-hyogo.../api/me/attendance?cursor=invalid" -H "Cookie: ..." -o evidence/me-attendance-400.json -w "%{http_code}"
   ```

## 参照資料
- `outputs/phase-11/phase-11.md`
- `outputs/phase-2/cursor-format.md`
- `outputs/phase-12/cursor-runbook.md`（Phase 12 で実装者向け runbook として最終化）

## 成果物
- `outputs/phase-11/screenshots/profile-attendance-initial.png`
- `outputs/phase-11/screenshots/profile-attendance-after-load-more.png`
- `outputs/phase-11/screenshots/profile-attendance-end.png`
- `outputs/phase-11/screenshots/admin-attendance-initial.png`
- `outputs/phase-11/screenshots/admin-attendance-after-load-more.png`
- `outputs/phase-11/screenshots/admin-attendance-end.png`
- `outputs/phase-11/evidence/me-profile-page1.json`
- `outputs/phase-11/evidence/me-attendance-page2.json`
- `outputs/phase-11/evidence/me-attendance-400.json`
- `outputs/phase-11/evidence/admin-members-page1.json`
- `outputs/phase-11/evidence/admin-members-attendance-page2.json`

## 完了条件
- screenshot 6 枚 + curl evidence 5 ファイルが揃う。
- 不正 cursor の HTTP 400 が記録されている。
- staging で regression なし（既存 `/me/profile` ユーザーで `attendance` 配列が従来通り取得できる）。

## 実行タスク
- [ ] staging deploy → fixture seed → screenshot / curl evidence 取得を実行する。
- [ ] Phase 13 PR body に evidence パスを反映する。

## 統合テスト連携
- Phase 6 の Playwright と Phase 11 の手動実機の両方を evidence とする。
