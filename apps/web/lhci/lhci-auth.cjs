const fs = require("node:fs");
const path = require("node:path");

module.exports = async (browser, context = {}) => {
  const storagePath = path.resolve(__dirname, "../.lhci/storage-state.json");
  if (!fs.existsSync(storagePath)) {
    throw new Error(
      `[lhci-auth] storage-state.json not found at ${storagePath}`,
    );
  }
  const state = JSON.parse(fs.readFileSync(storagePath, "utf8"));

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.setCookie(
    ...state.cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite,
    })),
  );

  if (context.url) {
    const response = await page.goto(context.url, { waitUntil: "networkidle0" });
    const finalUrl = page.url();
    if (!response || !response.ok()) {
      throw new Error(
        `[lhci-auth] authenticated pre-check failed: status ${response?.status() ?? "unknown"} at ${finalUrl}`,
      );
    }
    if (new URL(finalUrl).pathname !== "/profile") {
      throw new Error(
        `[lhci-auth] authenticated pre-check expected /profile, got ${finalUrl}`,
      );
    }
  }
};
