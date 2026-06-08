export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
  wide: { width: 1920, height: 1080 },
} as const

export type ViewportName = keyof typeof VIEWPORTS
