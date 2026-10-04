import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ORD_SITE_1, getOrdinalsSite } from "../utils/inscriptions";

const OrdinalsHostContext = createContext<string>(ORD_SITE_1);

export function OrdinalsHostProvider({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<string>(ORD_SITE_1);

  useEffect(() => {
    let cancelled = false;
    getOrdinalsSite().then((resolved) => {
      if (!cancelled && resolved !== host) setHost(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <OrdinalsHostContext.Provider value={host}>{children}</OrdinalsHostContext.Provider>;
}

export function useOrdinalsHost(): string {
  return useContext(OrdinalsHostContext);
}
