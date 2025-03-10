import React, { useState, useEffect } from "react";
import { useVsCodeApi } from "../context/VsCodeApiContext";

interface SvgElement {
  type: "path" | "circle" | "rect" | "mask";
  d?: string;
  cx?: string;
  cy?: string;
  r?: string;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  rx?: string;
  transform?: string;
  stroke?: string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
  strokeWidth?: string;
  strokeMiterlimit?: string;
  fill?: string;
  id?: string;
  mask?: string;
  className?: string;
  content?: string;
}

interface IconData {
  name: string;
  originalName: string;
  viewBox: string;
  elements: SvgElement[];
  isEmpty?: boolean;
}

const IconsViewer: React.FC = () => {
  const [uploadedIcons, setUploadedIcons] = useState<IconData[]>([]);
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);

  const vscode = useVsCodeApi();

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "processedIcon") {
        try {
          // Convert paths to elements for backward compatibility
          const payload = message.payload;
          if (payload.paths && !payload.elements) {
            payload.elements = payload.paths.map((path: any) => ({
              ...path,
              type: "path",
            }));
          }

          setUploadedIcons((prev) => [...prev, payload]);
        } catch (error) {
          console.error("Error creating component:", error);
        }
      }
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const text = await file.text();
      vscode.postMessage({
        type: "processIcon",
        payload: {
          name: file.name,
          content: text,
        },
      });
    }
  };

  const renderSvgElement = (element: SvgElement, index: number) => {
    switch (element.type) {
      case "path":
        return (
          <path
            key={index}
            d={element.d}
            stroke={element.stroke}
            strokeLinecap={
              element.strokeLinecap as
                | "butt"
                | "round"
                | "square"
                | "inherit"
                | undefined
            }
            strokeLinejoin={
              element.strokeLinejoin as
                | "round"
                | "inherit"
                | "miter"
                | "bevel"
                | undefined
            }
            strokeWidth={element.strokeWidth}
            strokeMiterlimit={element.strokeMiterlimit}
            fill={element.fill}
            mask={element.mask}
          />
        );
      case "circle":
        return (
          <circle
            key={index}
            cx={element.cx}
            cy={element.cy}
            r={element.r}
            className={element.className}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            fill={element.fill}
          />
        );
      case "rect":
        return (
          <rect
            key={index}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rx={element.rx}
            transform={element.transform}
            stroke={element.stroke}
            strokeWidth={element.strokeWidth}
            fill={element.fill}
          />
        );
      case "mask":
        return (
          <mask key={index} id={element.id}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <path d={element.d} fill="black" />
          </mask>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-10 bg-[#1e1e1e] text-[#cccccc] h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4 text-[#ffffff]">
          View React Component Icons
        </h1>
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded-md text-sm focus:outline-none"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Browse Icons...
          </button>
          <input
            id="file-input"
            type="file"
            accept=".tsx"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-sm text-[#cccccc]">
            {uploadedIcons.length === 0
              ? "Select TSX icon files to preview"
              : `${uploadedIcons.length} icon${
                  uploadedIcons.length !== 1 ? "s" : ""
                } loaded`}
          </span>
        </div>
      </div>

      {uploadedIcons.length > 0 && (
        <div className="bg-[#252526] rounded-md border border-[#3c3c3c] overflow-hidden">
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
            {uploadedIcons.map((icon, index) => (
              <div
                key={index}
                className={`flex flex-col items-center p-4 rounded-md transition-all ${
                  hoveredIcon === index ? "bg-[#37373d]" : "bg-[#2d2d2d]"
                } hover:bg-[#37373d] cursor-pointer`}
                onMouseEnter={() => setHoveredIcon(index)}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <div className="flex items-center justify-center w-16 h-16 mb-3">
                  <svg
                    className={`text-[#cccccc] ${
                      icon.isEmpty
                        ? "border border-dashed border-yellow-500 rounded-full p-1"
                        : ""
                    }`}
                    viewBox={icon.viewBox}
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="xMidYMid meet"
                    width="100%"
                    height="100%"
                  >
                    {(icon.elements || []).map((element, idx) =>
                      renderSvgElement(element, idx)
                    )}
                  </svg>
                  {icon.isEmpty && (
                    <div className="absolute text-xs text-yellow-500">
                      Empty Icon
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-white">
                    {icon.name}
                  </div>
                  <div className="text-xs text-[#8c8c8c] mt-1">
                    {icon.originalName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconsViewer;
