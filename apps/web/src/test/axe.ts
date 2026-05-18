import { configureAxe } from "jest-axe";

export const axe = configureAxe({
  rules: {
    // jsdom cannot resolve OKLch design tokens into browser-accurate contrast.
    "color-contrast": { enabled: false },
    // Primitive tests render isolated fragments, not full application landmarks.
    region: { enabled: false },
    // Primitive tests do not own the page-level <main> landmark contract.
    "landmark-one-main": { enabled: false },
  },
});
