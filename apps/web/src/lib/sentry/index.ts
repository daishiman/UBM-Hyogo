export type { CaptureContext } from "./capture";
export { captureException, captureMessage } from "./capture";
export {
  EXTENSION_DENY_URLS,
  EXTENSION_IGNORE_ERRORS,
  EXTENSION_PROTOCOL_PREFIXES,
  eventHasExtensionFrame,
  filterExtensionNoise,
  isExtensionUrl,
} from "./extension-noise-filter";
