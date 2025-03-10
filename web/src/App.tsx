import React from "react";
import SvgConverter from "./pages/SvgConverter";
import IconsViewer from "./pages/IconsViewer";
import { VsCodeApiProvider } from "./context/VsCodeApiContext";

declare global {
  interface Window {
    MODE?: string;
  }
}

declare function acquireVsCodeApi(): any;
const vscodeApi = acquireVsCodeApi();

export default function App() {
  const isConverterMode = window.MODE === "converter";

  return (
    <VsCodeApiProvider value={vscodeApi}>
      <div className="h-full text-white bg-neutral-900">
        {isConverterMode ? <SvgConverter /> : <IconsViewer />}
      </div>
    </VsCodeApiProvider>
  );
}
