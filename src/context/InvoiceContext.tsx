import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import { seedInvoices } from '../data/invoices';
import { loadFromStorage, saveToStorage } from '../utils';

const STORAGE_KEY = 'hng_invoices';

interface State {
  invoices: Invoice[];
  filter: InvoiceStatus | 'all';
  theme: 'light' | 'dark';
}

type Action =
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'ADD_INVOICE'; payload: Invoice }
  | { type: 'UPDATE_INVOICE'; payload: Invoice }
  | { type: 'DELETE_INVOICE'; payload: string }
  | { type: 'MARK_PAID'; payload: string }
  | { type: 'SET_FILTER'; payload: InvoiceStatus | 'all' }
  | { type: 'TOGGLE_THEME' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_INVOICES':
      return { ...state, invoices: action.payload };
    case 'ADD_INVOICE':
      return { ...state, invoices: [action.payload, ...state.invoices] };
    case 'UPDATE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.map(inv =>
          inv.id === action.payload.id ? action.payload : inv
        ),
      };
    case 'DELETE_INVOICE':
      return {
        ...state,
        invoices: state.invoices.filter(inv => inv.id !== action.payload),
      };
    case 'MARK_PAID':
      return {
        ...state,
        invoices: state.invoices.map(inv =>
          inv.id === action.payload ? { ...inv, status: 'paid' } : inv
        ),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
}

interface ContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  filteredInvoices: Invoice[];
}

const InvoiceContext = createContext<ContextValue | null>(null);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const savedTheme = (localStorage.getItem('hng_theme') as 'light' | 'dark') || 'light';

  const [state, dispatch] = useReducer(reducer, {
    invoices: [],
    filter: 'all',
    theme: savedTheme,
  });

  useEffect(() => {
    const stored = loadFromStorage(STORAGE_KEY);
    dispatch({ type: 'SET_INVOICES', payload: stored ?? seedInvoices });
  }, []);

  useEffect(() => {
    if (state.invoices.length > 0) {
      saveToStorage(STORAGE_KEY, state.invoices);
    }
  }, [state.invoices]);

  useEffect(() => {
    localStorage.setItem('hng_theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const filteredInvoices =
    state.filter === 'all'
      ? state.invoices
      : state.invoices.filter(inv => inv.status === state.filter);

  return (
    <InvoiceContext.Provider value={{ state, dispatch, filteredInvoices }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider');
  return ctx;
}