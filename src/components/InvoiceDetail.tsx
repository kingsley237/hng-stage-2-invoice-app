import { useState } from 'react';
import { useInvoices } from '../context/InvoiceContext';
import StatusBadge from './StatusBadge';
import InvoiceForm from './InvoiceForm';
import DeleteModal from './DeleteModal';
import { formatCurrency, formatDate } from '../utils';
import styles from './InvoiceDetail.module.css';

interface Props {
  invoiceId: string;
  onBack: () => void;
}

export default function InvoiceDetail({ invoiceId, onBack }: Props) {
  const { state, dispatch } = useInvoices();
  const invoice = state.invoices.find(inv => inv.id === invoiceId);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (!invoice) {
    return (
      <main className={styles.page}>
        <button className={styles.backBtn} onClick={onBack} aria-label="Go back to invoice list">
          <BackArrow /> Go back
        </button>
        <p>Invoice not found.</p>
      </main>
    );
  }

  function handleMarkPaid() {
    dispatch({ type: 'MARK_PAID', payload: invoice!.id });
  }

  function handleDelete() {
    dispatch({ type: 'DELETE_INVOICE', payload: invoice!.id });
    onBack();
  }

  const isPaid = invoice.status === 'paid';
  const isDraft = invoice.status === 'draft';

  return (
    <main className={styles.page}>
      <button className={styles.backBtn} onClick={onBack} aria-label="Go back to invoice list">
        <BackArrow /> Go back
      </button>

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusLabel}>Status</span>
          <StatusBadge status={invoice.status} />
        </div>
        <div className={styles.actions}>
          <button
            className={styles.btnEdit}
            onClick={() => setShowEdit(true)}
            aria-label={`Edit invoice ${invoice.id}`}
          >
            Edit
          </button>
          <button
            className={styles.btnDelete}
            onClick={() => setShowDelete(true)}
            aria-label={`Delete invoice ${invoice.id}`}
          >
            Delete
          </button>
          {!isPaid && (
            <button
              className={styles.btnPaid}
              onClick={handleMarkPaid}
              aria-label={`Mark invoice ${invoice.id} as paid`}
            >
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTop}>
          <div>
            <p className={styles.invoiceId}>
              <span className={styles.hash}>#</span>{invoice.id}
            </p>
            <p className={styles.description}>{invoice.description}</p>
          </div>
          <address className={styles.senderAddress}>
            <span>{invoice.senderAddress.street}</span>
            <span>{invoice.senderAddress.city}</span>
            <span>{invoice.senderAddress.postCode}</span>
            <span>{invoice.senderAddress.country}</span>
          </address>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>Invoice Date</p>
            <p className={styles.metaValue}>{formatDate(invoice.createdAt)}</p>
          </div>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>Bill To</p>
            <p className={styles.metaValue}>{invoice.clientName}</p>
            <address className={styles.clientAddress}>
              <span>{invoice.clientAddress.street}</span>
              <span>{invoice.clientAddress.city}</span>
              <span>{invoice.clientAddress.postCode}</span>
              <span>{invoice.clientAddress.country}</span>
            </address>
          </div>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>Payment Due</p>
            <p className={styles.metaValue}>{formatDate(invoice.paymentDue)}</p>
          </div>
          <div className={styles.metaBlock}>
            <p className={styles.metaLabel}>Sent to</p>
            <p className={styles.metaValue}>{invoice.clientEmail}</p>
          </div>
        </div>

        <div className={styles.itemsTable} aria-label="Invoice items">
          <div className={styles.tableHeader}>
            <span>Item Name</span>
            <span className={styles.alignCenter}>QTY.</span>
            <span className={styles.alignRight}>Price</span>
            <span className={styles.alignRight}>Total</span>
          </div>
          {invoice.items.map(item => (
            <div key={item.id} className={styles.tableRow}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemQty}>{item.quantity} x {formatCurrency(item.price)}</span>
              <span className={`${styles.itemQtyDesktop} ${styles.alignCenter}`}>{item.quantity}</span>
              <span className={`${styles.itemPriceDesktop} ${styles.alignRight}`}>{formatCurrency(item.price)}</span>
              <span className={`${styles.itemTotal} ${styles.alignRight}`}>{formatCurrency(item.total)}</span>
            </div>
          ))}
          <div className={styles.tableFooter}>
            <span className={styles.amountLabel}>Amount Due</span>
            <span className={styles.amountValue}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className={styles.mobileActions}>
        <button className={styles.btnEdit} onClick={() => setShowEdit(true)} aria-label={`Edit invoice ${invoice.id}`}>Edit</button>
        <button className={styles.btnDelete} onClick={() => setShowDelete(true)} aria-label={`Delete invoice ${invoice.id}`}>Delete</button>
        {!isPaid && (
          <button className={styles.btnPaid} onClick={handleMarkPaid} aria-label={`Mark invoice ${invoice.id} as paid`}>
            Mark as Paid
          </button>
        )}
      </div>

      {showEdit && (
        <InvoiceForm
          mode="edit"
          invoice={invoice}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDelete && (
        <DeleteModal
          invoiceId={invoice.id}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </main>
  );
}

function BackArrow() {
  return (
    <svg width="7" height="10" viewBox="0 0 7 10" fill="none" aria-hidden="true">
      <path d="M6 1L1.228 5.228 6 9.456" stroke="#7C5DFA" strokeWidth="2"/>
    </svg>
  );
}