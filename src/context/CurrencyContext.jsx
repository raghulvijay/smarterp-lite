/**
 * CurrencyContext — multi-currency display support (USD, EUR, INR, GBP).
 *
 * Persists the selected currency code to localStorage under "erp_currency".
 * All prices in the app are stored as USD internally; fmt() converts on render.
 *
 * @returns {{
 *   code: 'USD'|'EUR'|'INR'|'GBP',
 *   currency: { code:string, symbol:string, rate:number, label:string },
 *   currencies: Array<{code, symbol, rate, label}>,
 *   setCurrency: (code: string) => void,
 *   fmt: (usdValue: number) => string
 * }}
 */
import { createContext, useCallback, useContext, useState } from "react";

const CURRENCIES = [
  { code: "USD", symbol: "$",  rate: 1,     label: "USD — US Dollar"   },
  { code: "EUR", symbol: "€",  rate: 0.92,  label: "EUR — Euro"        },
  { code: "INR", symbol: "₹",  rate: 83.5,  label: "INR — Indian Rupee" },
  { code: "GBP", symbol: "£",  rate: 0.79,  label: "GBP — British Pound" },
];

const STORAGE_KEY = "erp_currency";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || "USD"; } catch { return "USD"; }
  });

  const currency = CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

  const setCurrency = useCallback((newCode) => {
    setCode(newCode);
    try { localStorage.setItem(STORAGE_KEY, newCode); } catch {}
  }, []);

  const fmt = useCallback((usdValue) => {
    const converted = usdValue * currency.rate;
    if (code === "INR") {
      return `${currency.symbol}${converted.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    return `${currency.symbol}${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [code, currency]);

  return (
    <CurrencyContext.Provider value={{ code, currency, currencies: CURRENCIES, setCurrency, fmt }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
