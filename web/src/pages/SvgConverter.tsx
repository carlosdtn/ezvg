import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useVsCodeApi } from "../context/VsCodeApiContext";

interface PathData {
  d: string;
  stroke: string;
  strokeWidth: string;
  strokeLinecap: string;
  strokeLinejoin: string;
  fill: string;
}

interface ConversionResult {
  componentName: string;
  useWrapper: boolean;
  viewBox: string;
  paths: PathData[];
}

const SvgConverter: React.FC = () => {
  const [componentName, setComponentName] = useState("");
  const [useWrapper, setUseWrapper] = useState(true);
  const [svgInput, setSvgInput] = useState("");
  const [convertedCode, setConvertedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vscode = useVsCodeApi();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "svgConverted") {
        const result = message.payload as ConversionResult;
        generateReactComponent(result);
      }

      if (message.type === "conversionError") {
        setError(message.payload.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!componentName.trim()) {
      setError("Please, fill the component name");
      return;
    }

    if (!svgInput.trim()) {
      setError("Please, fill the SVG code");
      return;
    }

    vscode.postMessage({
      type: "convertSvg",
      payload: {
        svg: svgInput,
        componentName: componentName,
        useWrapper: useWrapper,
      },
    });
  };

  const generateReactComponent = (result: ConversionResult) => {
    const { componentName, useWrapper, viewBox, paths } = result;

    let code = "";

    if (useWrapper) {
      // IconV2 wrapper version
      const pathsCode = paths
        .map((path) => {
          return `      <path
        d="${path.d}"
        stroke="currentColor"
        strokeWidth="${path.strokeWidth}"
        strokeLinecap="${path.strokeLinecap}"
        strokeLinejoin="${path.strokeLinejoin}"
        fill="${path.fill}"
      />`;
        })
        .join("\n");

      code = `import React from "react";
import { IconV2, IIconV2 } from "./IconV2";

export const ${componentName} = (props: IIconV2) => {
  return (
    <IconV2 viewBox="${viewBox}" fill="none" {...props}>
${pathsCode}
    </IconV2>
  );
};
`;
    } else {
      // Stantalone version
      const pathsCode = paths
        .map((path) => {
          return `      <path
        d="${path.d}"
        stroke="currentColor"
        strokeWidth="${path.strokeWidth}"
        strokeLinecap="${path.strokeLinecap}"
        strokeLinejoin="${path.strokeLinejoin}"
        fill="${path.fill}"
      />`;
        })
        .join("\n");

      code = `import React from "react";

interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const ${componentName} = ({ size = 24, ...props }: ${componentName}Props) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="${viewBox}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
${pathsCode}
    </svg>
  );
};
`;
    }

    setConvertedCode(code);
  };

  const handleCopyCode = () => {
    if (convertedCode) {
      navigator.clipboard.writeText(convertedCode);
    }
  };

  return (
    <div className="min-h-screen p-10 bg-[#1e1e1e] text-[#cccccc]">
      <h1 className="mb-6 text-2xl font-bold">
        Convert SVG to React Component
      </h1>

      {error && (
        <div className="p-3 mb-4 text-white bg-red-500 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block mb-2" htmlFor="componentName">
            Component Name:
          </label>
          <input
            id="componentName"
            type="text"
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
            placeholder="Ej. HistoryIcon"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useWrapper}
              onChange={(e) => setUseWrapper(e.target.checked)}
              className="mr-2"
            />
            Use wrapper IconV2
          </label>
        </div>

        <div className="mb-4">
          <label className="block mb-2" htmlFor="svgInput">
            SVG Code:
          </label>
          <textarea
            id="svgInput"
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            className="w-full p-2 font-mono bg-gray-700 border border-gray-600 rounded"
            rows={10}
            placeholder="<svg>...</svg>"
          />
        </div>

        <button
          type="submit"
          className="px-3 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded-md text-sm focus:outline-none"
        >
          Convert
        </button>
      </form>

      {convertedCode && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Result:</h2>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              Copy to Clipboard
            </button>
          </div>

          <div className="overflow-hidden rounded">
            <SyntaxHighlighter
              language="tsx"
              style={oneDark}
              showLineNumbers
              customStyle={{
                margin: 0,
                borderRadius: 4,
                backgroundColor: "#282c34",
                border: "1px solid #444",
              }}
            >
              {convertedCode}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
};

export default SvgConverter;
