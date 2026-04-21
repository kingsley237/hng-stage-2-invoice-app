import { useState } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import { InvoiceStatus } from '../types';
import StatusBadge from './StatusBadge';
import InvoiceForm from './InvoiceForm';
import { formatCurrency, formatDate } from '../utils';
import styles from './InvoiceList.module.css';
import no_invoice from '../assets/no_invoice.svg'

export default function InvoiceList({ onSelect }: { onSelect: (id: string) => void }) {
  const { state, dispatch, filteredInvoices } = useInvoices();
  const [filterOpen, setFilterOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const filterOptions: { value: InvoiceStatus | 'all'; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
  ];

  const totalLabel =
    filteredInvoices.length === 0
      ? 'No invoices'
      : `There are ${filteredInvoices.length} total invoice${filteredInvoices.length !== 1 ? 's' : ''}`;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>{totalLabel}</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.filterWrap}>
            <button
              className={styles.filterBtn}
              onClick={() => setFilterOpen(o => !o)}
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
              aria-label="Filter by status"
            >
              <span className={styles.filterLabel}>
                Filter <span className={styles.filterLabelFull}>by status</span>
              </span>
              <svg
                width="11"
                height="7"
                viewBox="0 0 11 7"
                fill="none"
                className={filterOpen ? styles.chevronUp : ''}
                aria-hidden="true"
              >
                <path d="M1 1l4.228 4.228L9.456 1" stroke="#7C5DFA" strokeWidth="2"/>
              </svg>
            </button>

            {filterOpen && (
              <div className={styles.filterDropdown} role="listbox" aria-label="Filter options">
                {filterOptions.map(opt => (
                  <label key={opt.value} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      role="option"
                      aria-selected={state.filter === opt.value}
                      checked={state.filter === opt.value}
                      onChange={() => {
                        dispatch({
                          type: 'SET_FILTER',
                          payload: state.filter === opt.value ? 'all' : opt.value,
                        });
                        setFilterOpen(false);
                      }}
                      className={styles.filterCheckbox}
                    />
                    <span className={styles.customCheck} aria-hidden="true">
                      {state.filter === opt.value && <CheckIcon />}
                    </span>
                    <span className={styles.filterOptionLabel}>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            className={styles.newBtn}
            onClick={() => setShowForm(true)}
            aria-label="Create new invoice"
          >
            <span className={styles.newBtnIcon} aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M6.313 0v4.688H11v1.624H6.313V11H4.688V6.312H0V4.688h4.688V0z" fill="#7C5DFA"/>
              </svg>
            </span>
            New invoice
          </button>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIllustration} aria-hidden="true">
            <img src={no_invoice} alt="no invoice illustration" className={styles.logoImg} />            
          </div>
          <h2 className={styles.emptyTitle}>There is nothing here</h2>
          <p className={styles.emptyText}>
            Create an invoice by clicking the<br />
            <strong>New Invoice</strong> button and get started
          </p>
        </div>
      ) : (
        <ul className={styles.list} aria-label="Invoice list">
          {filteredInvoices.map(invoice => (
            <li key={invoice.id}>
              <button
                className={styles.invoiceRow}
                onClick={() => onSelect(invoice.id)}
                aria-label={`Invoice ${invoice.id}, ${invoice.clientName}, due ${formatDate(invoice.paymentDue)}, ${formatCurrency(invoice.total)}, status ${invoice.status}`}
              >
                <span className={styles.invoiceId}>
                  <span className={styles.hash} aria-hidden="true">#</span>{invoice.id}
                </span>
                <span className={styles.invoiceDue}>Due {formatDate(invoice.paymentDue)}</span>
                <span className={styles.invoiceClient}>{invoice.clientName}</span>
                <span className={styles.invoiceAmount}>{formatCurrency(invoice.total)}</span>
                <span className={styles.invoiceStatus}>
                  <StatusBadge status={invoice.status} />
                </span>
                <span className={styles.invoiceChevron} aria-hidden="true">
                  <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
                    <path d="M1 1l4.228 4.228L1 9.456" stroke="#7C5DFA" strokeWidth="2"/>
                  </svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <InvoiceForm
          mode="create"
          onClose={() => setShowForm(false)}
        />
      )}
    </main>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4l2.667 2.667L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}