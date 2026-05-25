// Ambient module declaration for SVG asset imports.
// Allows `import url from "./foo.svg"` to be treated as a string URL.
declare module "*.svg" {
  const src: string;
  export default src;
}
