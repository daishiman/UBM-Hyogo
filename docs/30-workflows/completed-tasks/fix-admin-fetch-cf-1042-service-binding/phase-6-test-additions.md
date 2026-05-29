# Phase 6: テスト拡充

## 追加テスト再判定

| 観点 | TC |
|------|----|
| fail path: binding.fetch が network error throw した場合に元 error が propagate される | 追加不要。既存実装は catch せず素通しで、transport 分岐と独立。 |
| fail path: HTTP 500 + body 空のとき message に body= が含まれない | 追加不要。既存 error body handling は変更しておらず、今回の CF 1042 body propagation test が主回帰。 |
| 回帰 guard: `INTERNAL_API_BASE_URL` 未設定 (test env でも binding 不在) のとき fail-fast する | 既存 `server-fetch.env.spec.ts` で ZodError と fetch 未呼出を検証済み。 |
| 既存 fixture 経路（`PLAYWRIGHT_TASK18_SMOKE` 系）が binding/HTTP どちらの分岐にも入らず early-return すること | 追加不要。fixture block は変更しておらず、今回差分の transport 分岐前に残っている。 |

## DoD

- Phase 4/5 と既存 env/url regression を合わせて local focused web regression green
