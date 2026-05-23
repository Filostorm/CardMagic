import { createContext, ReactNode, useContext, useState } from "react";

export type HybridSymbolStyle = "normal" | "guild";

type HybridSymbolStyleContextValue = {
  hybridSymbolStyle: HybridSymbolStyle;
  setHybridSymbolStyle: (style: HybridSymbolStyle) => void;
};

const HybridSymbolStyleContext = createContext<HybridSymbolStyleContextValue>({
  hybridSymbolStyle: "normal",
  setHybridSymbolStyle: () => {},
});

export function HybridSymbolStyleProvider({ children }: { children: ReactNode }) {
  const [hybridSymbolStyle, setHybridSymbolStyle] = useState<HybridSymbolStyle>("normal");

  return (
    <HybridSymbolStyleContext.Provider value={{ hybridSymbolStyle, setHybridSymbolStyle }}>
      {children}
    </HybridSymbolStyleContext.Provider>
  );
}

export function useHybridSymbolStyle() {
  return useContext(HybridSymbolStyleContext);
}
