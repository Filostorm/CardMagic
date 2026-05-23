declare module "react-native-view-shot/src/RNViewShot.web.js" {
  type WebViewShotOptions = {
    width?: number;
    height?: number;
    format?: "png" | "jpg";
    quality?: number;
    result?: "tmpfile" | "base64" | "data-uri";
  };

  const RNViewShotWeb: {
    captureRef: (view: HTMLElement, options: WebViewShotOptions) => Promise<string>;
    captureScreen: (options: WebViewShotOptions) => Promise<string>;
    releaseCapture: (uri: string) => void;
  };

  export default RNViewShotWeb;
}
