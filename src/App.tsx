import { useState } from 'react';
import { InvoiceProvider } from './context/InvoiceContext';
import Sidebar from './components/Sidebar';
import InvoiceList from './components/InvoiceList';
import InvoiceDetail from './components/InvoiceDetail';

type View = { page: 'list' } | { page: 'detail'; id: string };

function AppInner() {
  const [view, setView] = useState<View>({ page: 'list' });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        {view.page === 'list' && (
          <InvoiceList onSelect={id => setView({ page: 'detail', id })} />
        )}
        {view.page === 'detail' && (
          <InvoiceDetail
            invoiceId={view.id}
            onBack={() => setView({ page: 'list' })}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <InvoiceProvider>
      <AppInner />
    </InvoiceProvider>
  );
}