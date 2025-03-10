import React, { createContext, useContext } from "react";

interface VsCodeApi {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
}

const VsCodeApiContext = createContext<VsCodeApi | null>(null);

export const VsCodeApiProvider: React.FC<{
  value: VsCodeApi;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <VsCodeApiContext.Provider value={value}>
      {children}
    </VsCodeApiContext.Provider>
  );
};

export const useVsCodeApi = (): VsCodeApi => {
  const api = useContext(VsCodeApiContext);
  if (!api) {
    throw new Error("useVsCodeApi debe usarse dentro de un VsCodeApiProvider");
  }
  return api;
};
