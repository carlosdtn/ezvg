import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let webview = vscode.commands.registerCommand(
    "ezvg-react.previewIcons",
    () => {
      let panel = vscode.window.createWebviewPanel(
        "webview",
        "View React Component Icons",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      let scriptSrc = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "web", "dist", "index.js")
      );

      let cssSrc = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "web", "dist", "index.css")
      );

      panel.webview.onDidReceiveMessage(
        async (message) => {
          if (message.type === "processIcon") {
            try {
              const content = message.payload.content;

              // Check if the icon uses fillRule="evenodd" (filled icons)
              const usesFillRule =
                /fillRule=["']evenodd["']/.test(content) ||
                /fill-rule=["']evenodd["']/.test(content);

              // Check if the icon has a dynamic strokeWidth parameter
              const hasDynamicStrokeWidth =
                /strokeWidth\s*=\s*\{\s*strokeWidth\s*\}/.test(content);
              let defaultStrokeWidth = "1"; // Default to thin stroke

              if (hasDynamicStrokeWidth) {
                // Extract the default value
                const strokeWidthParamMatch =
                  /strokeWidth\s*=\s*\{\s*strokeWidth\s*=\s*([^,}]+)/.exec(
                    content
                  );
                if (strokeWidthParamMatch) {
                  defaultStrokeWidth = strokeWidthParamMatch[1].replace(
                    /['"]/g,
                    ""
                  );
                }
              }

              // Extract component name
              const nameMatch = /export\s+const\s+(\w+)/.exec(content);
              const componentName = nameMatch
                ? nameMatch[1]
                : message.payload.name.replace(".tsx", "");

              // Extract viewBox - improved extraction logic
              let viewBox = "0 0 24 24"; // Default

              // Check for static viewBox
              const staticViewBoxMatch = /viewBox=["']([^"']+)["']/.exec(
                content
              );
              if (staticViewBoxMatch) {
                viewBox = staticViewBoxMatch[1].trim();
              }
              // Check if it's a variable/parameter
              else {
                const paramViewBoxMatch =
                  /viewBox\s*=\s*\{\s*viewBox\s*\}/.exec(content);
                if (paramViewBoxMatch) {
                  // Look for the parameter definition
                  const paramDefMatch =
                    /{\s*viewBox\s*=\s*["']([^"']+)["']/.exec(content);
                  if (paramDefMatch) {
                    viewBox = paramDefMatch[1].trim();
                  }
                }
              }

              // Extract fill attribute
              const fillMatch = /fill=["']([^"']+)["']/.exec(content);
              const fill = fillMatch
                ? fillMatch[1]
                : usesFillRule
                ? "currentColor"
                : "none";

              // Extract group attributes
              const groupAttrs = {
                stroke: usesFillRule ? "none" : "currentColor",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: defaultStrokeWidth,
                fill: usesFillRule ? "currentColor" : "none",
              };

              // Find group tags and extract their attributes
              const groupRegex = /<g([^>]*)>([\s\S]*?)<\/g>/g;
              let groupMatch;

              if ((groupMatch = groupRegex.exec(content)) !== null) {
                const groupAttrsStr = groupMatch[1];

                const gStrokeMatch = /stroke=["']([^"']+)["']/.exec(
                  groupAttrsStr
                );
                if (gStrokeMatch) {
                  groupAttrs.stroke = gStrokeMatch[1];
                }

                const gStrokeLinecapMatch =
                  /strokeLinecap=["']([^"']+)["']/.exec(groupAttrsStr);
                if (gStrokeLinecapMatch) {
                  groupAttrs.strokeLinecap = gStrokeLinecapMatch[1];
                }

                const gStrokeLinejoinMatch =
                  /strokeLinejoin=["']([^"']+)["']/.exec(groupAttrsStr);
                if (gStrokeLinejoinMatch) {
                  groupAttrs.strokeLinejoin = gStrokeLinejoinMatch[1];
                }

                const gStrokeWidthMatch =
                  /strokeWidth=["']([^"']+)["']|stroke-width=["']([^"']+)["']/.exec(
                    groupAttrsStr
                  );
                if (gStrokeWidthMatch) {
                  groupAttrs.strokeWidth =
                    gStrokeWidthMatch[1] || gStrokeWidthMatch[2];
                }

                const gFillMatch = /fill=["']([^"']+)["']/.exec(groupAttrsStr);
                if (gFillMatch) {
                  groupAttrs.fill = gFillMatch[1];
                }
              }

              // Extract all SVG elements (paths and circles)
              const elements = [];

              // Extract paths
              const pathRegex = /<path([^>]*)>/g; // Cambiado para capturar rutas anidadas
              let pathMatch;

              while ((pathMatch = pathRegex.exec(content)) !== null) {
                const pathAttrsStr = pathMatch[1];

                // Determine if this is a fill-rule path or stroke path
                const isFilledPath =
                  /fillRule=["']evenodd["']/.test(pathAttrsStr) ||
                  /fill-rule=["']evenodd["']/.test(pathAttrsStr);

                // Extract d attribute
                const dMatch = /d=["']([^"']+)["']/.exec(pathAttrsStr);
                const idMatch = /id=["']([^"']+)["']/.exec(pathAttrsStr);

                // Solo verificamos si tenemos un atributo d válido, ignoramos la condición del id
                if (dMatch) {
                  const strokeMatch = /stroke=["']([^"']+)["']/.exec(
                    pathAttrsStr
                  );
                  const strokeLinecapMatch =
                    /strokeLinecap=["']([^"']+)["']/.exec(pathAttrsStr);
                  const strokeLinejoinMatch =
                    /strokeLinejoin=["']([^"']+)["']/.exec(pathAttrsStr);
                  const strokeWidthMatch =
                    /strokeWidth=["']([^"']+)["']|stroke-width=["']([^"']+)["']/.exec(
                      pathAttrsStr
                    );
                  const strokeMiterlimitMatch =
                    /strokeMiterlimit=["']([^"']+)["']/.exec(pathAttrsStr);
                  const pathFillMatch = /fill=["']([^"']+)["']/.exec(
                    pathAttrsStr
                  );

                  elements.push({
                    type: "path",
                    d: dMatch[1],
                    stroke: strokeMatch
                      ? strokeMatch[1]
                      : isFilledPath
                      ? "none"
                      : groupAttrs.stroke,
                    strokeLinecap: strokeLinecapMatch
                      ? strokeLinecapMatch[1]
                      : groupAttrs.strokeLinecap,
                    strokeLinejoin: strokeLinejoinMatch
                      ? strokeLinejoinMatch[1]
                      : groupAttrs.strokeLinejoin,
                    strokeWidth: strokeWidthMatch
                      ? strokeWidthMatch[1] || strokeWidthMatch[2]
                      : isFilledPath
                      ? "0"
                      : groupAttrs.strokeWidth,
                    strokeMiterlimit: strokeMiterlimitMatch
                      ? strokeMiterlimitMatch[1]
                      : "10",
                    fill: pathFillMatch
                      ? pathFillMatch[1]
                      : isFilledPath
                      ? "currentColor"
                      : groupAttrs.fill,
                    id: idMatch ? idMatch[1] : undefined,
                  });
                }
              }

              // Extract circles
              const circleRegex = /<circle([^>]*)\/>/g;
              let circleMatch;

              while ((circleMatch = circleRegex.exec(content)) !== null) {
                const circleAttrsStr = circleMatch[1];

                const cxMatch = /cx=["']([^"']+)["']/.exec(circleAttrsStr);
                const cyMatch = /cy=["']([^"']+)["']/.exec(circleAttrsStr);
                const rMatch = /r=["']([^"']+)["']/.exec(circleAttrsStr);

                if (cxMatch && cyMatch && rMatch) {
                  const strokeMatch = /stroke=["']([^"']+)["']/.exec(
                    circleAttrsStr
                  );
                  const strokeWidthMatch =
                    /strokeWidth=["']([^"']+)["']|stroke-width=["']([^"']+)["']/.exec(
                      circleAttrsStr
                    );
                  const circleFillMatch = /fill=["']([^"']+)["']/.exec(
                    circleAttrsStr
                  );

                  // Determine if this is a filled circle
                  const isFilledCircle =
                    circleFillMatch && circleFillMatch[1] !== "none";

                  elements.push({
                    type: "circle",
                    cx: cxMatch[1],
                    cy: cyMatch[1],
                    r: rMatch[1],
                    stroke: strokeMatch
                      ? strokeMatch[1]
                      : isFilledCircle
                      ? "none"
                      : groupAttrs.stroke,
                    strokeWidth: strokeWidthMatch
                      ? strokeWidthMatch[1] || strokeWidthMatch[2]
                      : isFilledCircle
                      ? "0"
                      : groupAttrs.strokeWidth,
                    fill: circleFillMatch
                      ? circleFillMatch[1]
                      : groupAttrs.fill,
                  });
                }
              }

              panel.webview.postMessage({
                type: "processedIcon",
                payload: {
                  name: componentName,
                  originalName: message.payload.name,
                  viewBox,
                  fill,
                  elements,
                },
              });
            } catch (error) {
              console.error("Error processing icon:", error);
            }
          }
        },
        undefined,
        context.subscriptions
      );

      panel.webview.html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <link rel="stylesheet" href="${cssSrc}" />
            <script>
              window.MODE = "viewer";
            </script>
          </head>
          <body>
            <div id="root"></div>
            <script src="${scriptSrc}"></script>
          </body>
        </html>
      `;
    }
  );

  let convertSvg = vscode.commands.registerCommand(
    "ezvg-react.convertSvg",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "svgConverter",
        "SVG to React Component",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      // Use static files from React build
      const scriptSrc = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "web", "dist", "index.js")
      );

      const cssSrc = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, "web", "dist", "index.css")
      );

      panel.webview.html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SVG to React Component</title>
            <link rel="stylesheet" href="${cssSrc}" />
            <script>
              window.MODE = "converter";
            </script>
          </head>
          <body>
            <div id="root"></div>
            <script src="${scriptSrc}"></script>
          </body>
        </html>`;

      panel.webview.onDidReceiveMessage(
        async (message) => {
          if (message.type === "convertSvg") {
            try {
              // Process SVG data
              const { svg, componentName, useWrapper } = message.payload;

              // Extract viewBox
              const viewBoxMatch = /viewBox=["']([^"']*)["']/.exec(svg);
              const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";

              // Extract paths
              const pathElements = [];
              const pathRegex = /<path\s+([^>]*)\/>/g;
              let pathMatch;

              while ((pathMatch = pathRegex.exec(svg)) !== null) {
                const pathProps = pathMatch[1];

                // Extract attributes
                const dMatch = /d=["']([^"']*)["']/.exec(pathProps);
                const strokeMatch = /stroke=["']([^"']*)["']/.exec(pathProps);
                const strokeWidthMatch = /stroke-width=["']([^"']*)["']/.exec(
                  pathProps
                );
                const strokeLineCapMatch =
                  /stroke-linecap=["']([^"']*)["']/.exec(pathProps);
                const strokeLineJoinMatch =
                  /stroke-linejoin=["']([^"']*)["']/.exec(pathProps);
                const fillMatch = /fill=["']([^"']*)["']/.exec(pathProps);

                if (dMatch) {
                  const pathData = {
                    d: dMatch[1],
                    stroke: "currentColor", // Use currentColor by default
                    strokeWidth: strokeWidthMatch ? strokeWidthMatch[1] : "1.5",
                    strokeLinecap: strokeLineCapMatch
                      ? strokeLineCapMatch[1]
                      : "round",
                    strokeLinejoin: strokeLineJoinMatch
                      ? strokeLineJoinMatch[1]
                      : "round",
                    fill:
                      fillMatch && fillMatch[1] !== "none"
                        ? fillMatch[1]
                        : "none",
                  };

                  pathElements.push(pathData);
                }
              }

              // Sen data to the webview
              panel.webview.postMessage({
                type: "svgConverted",
                payload: {
                  componentName,
                  useWrapper,
                  viewBox,
                  paths: pathElements,
                },
              });
            } catch (error) {
              console.error("Error processing SVG:", error);
              panel.webview.postMessage({
                type: "conversionError",
                payload: { error: (error as Error).message },
              });
            }
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(webview, convertSvg);
}

export function deactivate() {}
