import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, InvoiceItem, FormErrors } from '../types';
import { useInvoices } from '../context/InvoiceContext';
import { generateId, calculatePaymentDue, calculateInvoiceTotal } from '../utils';
import styles from './InvoiceForm.module.css';

interface Props {
  mode: 'create' | 'edit';
  invoice?: Invoice;
  onClose: () => void;
}

const PAYMENT_TERMS = [
  { value: 1, label: 'Net 1 Day' },
  { value: 7, label: 'Net 7 Days' },
  { value: 14, label: 'Net 14 Days' },
  { value: 30, label: 'Net 30 Days' },
];

/*
  qty and price are kept as strings while the user is typing so the
  input behaves like a normal text box — no phantom leading zeros,
  no value lock. They are parsed to numbers only at save time.
*/
interface EditableItem {
  id: string;
  name: string;
  qty: string;
  price: string;
}

function blankItem(): EditableItem {
  return { id: uuidv4(), name: '', qty: '1', price: '' };
}

function toEditable(item: InvoiceItem): EditableItem {
  return {
    id: item.id,
    name: item.name,
    qty: String(item.quantity),
    price: String(item.price),
  };
}

function toInvoiceItem(item: EditableItem): InvoiceItem {
  const qty = Math.max(1, parseFloat(item.qty) || 1);
  const price = parseFloat(item.price) || 0;
  return { id: item.id, name: item.name, quantity: qty, price, total: qty * price };
}

function itemTotal(item: EditableItem): number {
  const qty = Math.max(1, parseFloat(item.qty) || 1);
  const price = parseFloat(item.price) || 0;
  return qty * price;
}

export default function InvoiceForm({ mode, invoice, onClose }: Props) {
  const { dispatch } = useInvoices();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [senderStreet, setSenderStreet] = useState(invoice?.senderAddress.street ?? '');
  const [senderCity, setSenderCity] = useState(invoice?.senderAddress.city ?? '');
  const [senderPostCode, setSenderPostCode] = useState(invoice?.senderAddress.postCode ?? '');
  const [senderCountry, setSenderCountry] = useState(invoice?.senderAddress.country ?? '');
  const [clientName, setClientName] = useState(invoice?.clientName ?? '');
  const [clientEmail, setClientEmail] = useState(invoice?.clientEmail ?? '');
  const [clientStreet, setClientStreet] = useState(invoice?.clientAddress.street ?? '');
  const [clientCity, setClientCity] = useState(invoice?.clientAddress.city ?? '');
  const [clientPostCode, setClientPostCode] = useState(invoice?.clientAddress.postCode ?? '');
  const [clientCountry, setClientCountry] = useState(invoice?.clientAddress.country ?? '');
  const [createdAt, setCreatedAt] = useState(
    invoice?.createdAt ?? new Date().toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState(invoice?.paymentTerms ?? 30);
  const [description, setDescription] = useState(invoice?.description ?? '');
  const [items, setItems] = useState<EditableItem[]>(
    invoice?.items?.map(toEditable) ?? [blankItem()]
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    firstInputRef.current?.focus();
    document.body.style.overflow = 'hidden';

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'input:not([disabled]), button:not([disabled]), [tabindex="0"]'
          )
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function validate(asDraft: boolean): boolean {
    if (asDraft) { setErrors({}); return true; }
    const e: FormErrors = {};
    if (!senderStreet.trim()) e.senderStreet = "can't be empty";
    if (!senderCity.trim()) e.senderCity = "can't be empty";
    if (!senderPostCode.trim()) e.senderPostCode = "can't be empty";
    if (!senderCountry.trim()) e.senderCountry = "can't be empty";
    if (!clientName.trim()) e.clientName = "can't be empty";
    if (!clientEmail.trim()) e.clientEmail = "can't be empty";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) e.clientEmail = 'invalid email';
    if (!clientStreet.trim()) e.clientStreet = "can't be empty";
    if (!clientCity.trim()) e.clientCity = "can't be empty";
    if (!clientPostCode.trim()) e.clientPostCode = "can't be empty";
    if (!clientCountry.trim()) e.clientCountry = "can't be empty";
    if (!createdAt) e.createdAt = "can't be empty";
    if (!description.trim()) e.description = "can't be empty";
    if (items.length === 0) e.items = 'An item must be added';
    items.forEach((item, i) => {
      if (!item.name.trim()) e[`item_name_${i}`] = "can't be empty";
      const price = parseFloat(item.price);
      if (!item.price.trim() || isNaN(price) || price <= 0) {
        e[`item_price_${i}`] = 'required';
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildInvoice(status: 'draft' | 'pending'): Invoice {
    const invoiceItems = items.map(toInvoiceItem);
    return {
      id: invoice?.id ?? generateId(),
      createdAt,
      paymentDue: calculatePaymentDue(createdAt, paymentTerms),
      description,
      paymentTerms,
      clientName,
      clientEmail,
      status,
      senderAddress: { street: senderStreet, city: senderCity, postCode: senderPostCode, country: senderCountry },
      clientAddress: { street: clientStreet, city: clientCity, postCode: clientPostCode, country: clientCountry },
      items: invoiceItems,
      total: calculateInvoiceTotal(invoiceItems),
    };
  }

  function handleSaveAsDraft() {
    validate(true);
    const inv = buildInvoice('draft');
    dispatch({ type: mode === 'edit' ? 'UPDATE_INVOICE' : 'ADD_INVOICE', payload: inv });
    onClose();
  }

  function handleSaveAndSend() {
    if (!validate(false)) return;
    const inv = buildInvoice('pending');
    dispatch({ type: mode === 'edit' ? 'UPDATE_INVOICE' : 'ADD_INVOICE', payload: inv });
    onClose();
  }

  function handleSaveChanges() {
    if (!validate(false)) return;
    dispatch({ type: 'UPDATE_INVOICE', payload: buildInvoice(invoice?.status ?? 'pending') });
    onClose();
  }

  function updateItem(i: number, field: keyof EditableItem, value: string) {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className={styles.overlay}>
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? 'New Invoice' : `Edit Invoice ${invoice?.id}`}
      >
        <div className={styles.panelInner}>
          <h2 className={styles.heading}>
            {mode === 'create'
              ? 'New Invoice'
              : <>Edit <span className={styles.headingHash}>#</span>{invoice?.id}</>}
          </h2>

          <div className={styles.scrollArea}>

            <fieldset className={styles.fieldset}>
              <legend className={styles.sectionTitle}>Bill From</legend>

              <div className={styles.fieldFull}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="senderStreet">Street Address</label>
                  {errors.senderStreet && <span className={styles.errMsg}>{errors.senderStreet}</span>}
                </div>
                <input
                  id="senderStreet"
                  ref={firstInputRef}
                  className={`${styles.input} ${errors.senderStreet ? styles.inputError : ''}`}
                  value={senderStreet}
                  onChange={e => setSenderStreet(e.target.value)}
                  aria-invalid={!!errors.senderStreet}
                />
              </div>

              <div className={styles.fieldRow3}>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="senderCity">City</label>
                    {errors.senderCity && <span className={styles.errMsg}>{errors.senderCity}</span>}
                  </div>
                  <input id="senderCity" className={`${styles.input} ${errors.senderCity ? styles.inputError : ''}`} value={senderCity} onChange={e => setSenderCity(e.target.value)} aria-invalid={!!errors.senderCity} />
                </div>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="senderPostCode">Post Code</label>
                    {errors.senderPostCode && <span className={styles.errMsg}>{errors.senderPostCode}</span>}
                  </div>
                  <input id="senderPostCode" className={`${styles.input} ${errors.senderPostCode ? styles.inputError : ''}`} value={senderPostCode} onChange={e => setSenderPostCode(e.target.value)} aria-invalid={!!errors.senderPostCode} />
                </div>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="senderCountry">Country</label>
                    {errors.senderCountry && <span className={styles.errMsg}>{errors.senderCountry}</span>}
                  </div>
                  <input id="senderCountry" className={`${styles.input} ${errors.senderCountry ? styles.inputError : ''}`} value={senderCountry} onChange={e => setSenderCountry(e.target.value)} aria-invalid={!!errors.senderCountry} />
                </div>
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend className={styles.sectionTitle}>Bill To</legend>

              <div className={styles.fieldFull}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="clientName">Client's Name</label>
                  {errors.clientName && <span className={styles.errMsg}>{errors.clientName}</span>}
                </div>
                <input id="clientName" className={`${styles.input} ${errors.clientName ? styles.inputError : ''}`} value={clientName} onChange={e => setClientName(e.target.value)} aria-invalid={!!errors.clientName} />
              </div>

              <div className={styles.fieldFull}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="clientEmail">Client's Email</label>
                  {errors.clientEmail && <span className={styles.errMsg}>{errors.clientEmail}</span>}
                </div>
                <input id="clientEmail" type="email" className={`${styles.input} ${errors.clientEmail ? styles.inputError : ''}`} value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="e.g. email@example.com" aria-invalid={!!errors.clientEmail} />
              </div>

              <div className={styles.fieldFull}>
                <div className={styles.labelRow}>
                  <label className={styles.label} htmlFor="clientStreet">Street Address</label>
                  {errors.clientStreet && <span className={styles.errMsg}>{errors.clientStreet}</span>}
                </div>
                <input id="clientStreet" className={`${styles.input} ${errors.clientStreet ? styles.inputError : ''}`} value={clientStreet} onChange={e => setClientStreet(e.target.value)} aria-invalid={!!errors.clientStreet} />
              </div>

              <div className={styles.fieldRow3}>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="clientCity">City</label>
                    {errors.clientCity && <span className={styles.errMsg}>{errors.clientCity}</span>}
                  </div>
                  <input id="clientCity" className={`${styles.input} ${errors.clientCity ? styles.inputError : ''}`} value={clientCity} onChange={e => setClientCity(e.target.value)} aria-invalid={!!errors.clientCity} />
                </div>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="clientPostCode">Post Code</label>
                    {errors.clientPostCode && <span className={styles.errMsg}>{errors.clientPostCode}</span>}
                  </div>
                  <input id="clientPostCode" className={`${styles.input} ${errors.clientPostCode ? styles.inputError : ''}`} value={clientPostCode} onChange={e => setClientPostCode(e.target.value)} aria-invalid={!!errors.clientPostCode} />
                </div>
                <div className={styles.field}>
                  <div className={styles.labelRow}>
                    <label className={styles.label} htmlFor="clientCountry">Country</label>
                    {errors.clientCountry && <span className={styles.errMsg}>{errors.clientCountry}</span>}
                  </div>
                  <input id="clientCountry" className={`${styles.input} ${errors.clientCountry ? styles.inputError : ''}`} value={clientCountry} onChange={e => setClientCountry(e.target.value)} aria-invalid={!!errors.clientCountry} />
                </div>
              </div>
            </fieldset>

            <div className={styles.fieldRow2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="createdAt">Invoice Date</label>
                <input
                  id="createdAt"
                  type="date"
                  className={`${styles.input} ${errors.createdAt ? styles.inputError : ''}`}
                  value={createdAt}
                  onChange={e => setCreatedAt(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="paymentTermsBtn">Payment Terms</label>
                <div className={styles.selectWrap}>
                  <button
                    id="paymentTermsBtn"
                    type="button"
                    className={styles.selectBtn}
                    onClick={() => setTermsOpen(o => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={termsOpen}
                  >
                    {PAYMENT_TERMS.find(t => t.value === paymentTerms)?.label}
                    <svg width="11" height="7" viewBox="0 0 11 7" fill="none" className={termsOpen ? styles.chevronUp : ''} aria-hidden="true">
                      <path d="M1 1l4.228 4.228L9.456 1" stroke="#7C5DFA" strokeWidth="2"/>
                    </svg>
                  </button>
                  {termsOpen && (
                    <ul className={styles.selectDropdown} role="listbox" aria-label="Payment terms">
                      {PAYMENT_TERMS.map(term => (
                        <li
                          key={term.value}
                          role="option"
                          aria-selected={paymentTerms === term.value}
                          className={`${styles.selectOption} ${paymentTerms === term.value ? styles.selectOptionActive : ''}`}
                          tabIndex={0}
                          onClick={() => { setPaymentTerms(term.value); setTermsOpen(false); }}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setPaymentTerms(term.value); setTermsOpen(false); } }}
                        >
                          {term.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.fieldFull} style={{ marginBottom: 40 }}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="description">Project Description</label>
                {errors.description && <span className={styles.errMsg}>{errors.description}</span>}
              </div>
              <input
                id="description"
                className={`${styles.input} ${errors.description ? styles.inputError : ''}`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Graphic Design Service"
                aria-invalid={!!errors.description}
              />
            </div>

            <div className={styles.itemSection}>
              <h3 className={styles.itemSectionTitle}>Item List</h3>

              {items.length > 0 && (
                <div className={styles.itemHeader} aria-hidden="true">
                  <span>Item Name</span>
                  <span>Qty.</span>
                  <span>Price</span>
                  <span>Total</span>
                  <span />
                </div>
              )}

              <div className={styles.itemRows}>
                {items.map((item, i) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemNameField}>
                      <label className={styles.labelMobileOnly} htmlFor={`iname-${i}`}>Item Name</label>
                      <input
                        id={`iname-${i}`}
                        className={`${styles.input} ${errors[`item_name_${i}`] ? styles.inputError : ''}`}
                        value={item.name}
                        onChange={e => updateItem(i, 'name', e.target.value)}
                        aria-label={`Item ${i + 1} name`}
                        aria-invalid={!!errors[`item_name_${i}`]}
                      />
                    </div>

                    <div className={styles.itemQtyField}>
                      <label className={styles.labelMobileOnly} htmlFor={`iqty-${i}`}>Qty.</label>
                      <input
                        id={`iqty-${i}`}
                        inputMode="numeric"
                        className={styles.input}
                        value={item.qty}
                        onChange={e => updateItem(i, 'qty', e.target.value)}
                        onFocus={e => e.target.select()}
                        aria-label={`Item ${i + 1} quantity`}
                      />
                    </div>

                    <div className={styles.itemPriceField}>
                      <label className={styles.labelMobileOnly} htmlFor={`iprice-${i}`}>Price</label>
                      <input
                        id={`iprice-${i}`}
                        inputMode="decimal"
                        className={`${styles.input} ${errors[`item_price_${i}`] ? styles.inputError : ''}`}
                        value={item.price}
                        onChange={e => updateItem(i, 'price', e.target.value)}
                        onFocus={e => e.target.select()}
                        placeholder="0.00"
                        aria-label={`Item ${i + 1} price`}
                        aria-invalid={!!errors[`item_price_${i}`]}
                      />
                    </div>

                    <div className={styles.itemTotalField}>
                      <label className={styles.labelMobileOnly}>Total</label>
                      <span className={styles.itemTotal} aria-label={`Item ${i + 1} total`}>
                        {itemTotal(item).toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={styles.deleteItemBtn}
                      onClick={() => removeItem(i)}
                      aria-label={`Remove item ${item.name || i + 1}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={styles.addItemBtn}
                onClick={() => setItems(prev => [...prev, blankItem()])}
                aria-label="Add new item"
              >
                + Add New Item
              </button>
            </div>

            {hasErrors && (
              <div className={styles.errorSummary} role="alert" aria-live="polite">
                {errors.items && <p>- An item must be added</p>}
                {Object.keys(errors).some(k => k !== 'items') && (
                  <p>- All fields must be added</p>
                )}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            {mode === 'create' ? (
              <>
                <button type="button" className={styles.btnDiscard} onClick={onClose}>Discard</button>
                <div className={styles.footerRight}>
                  <button type="button" className={styles.btnDraft} onClick={handleSaveAsDraft}>Save as Draft</button>
                  <button type="button" className={styles.btnSend} onClick={handleSaveAndSend}>Save &amp; Send</button>
                </div>
              </>
            ) : (
              <>
                <button type="button" className={styles.btnDiscard} onClick={onClose}>Cancel</button>
                <button type="button" className={styles.btnSend} onClick={handleSaveChanges}>Save Changes</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.overlayDismiss} onClick={onClose} aria-hidden="true" />
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="16" viewBox="0 0 13 16" fill="none" aria-hidden="true">
      <path d="M11.583 3.556h-2.722V2.667A1.667 1.667 0 007.194 1H5.806a1.667 1.667 0 00-1.667 1.667v.889H1.417A.417.417 0 001 3.972v.417c0 .23.187.417.417.417h.416l.834 8.473A1.25 1.25 0 003.91 14.5h5.18a1.25 1.25 0 001.244-1.22l.833-8.474h.416A.417.417 0 0012 4.39v-.417a.417.417 0 00-.417-.417zM5.417 2.667a.389.389 0 01.389-.389h1.388a.389.389 0 01.39.389v.889H5.416v-.889zm4.26 10.116a.25.25 0 01-.248.217H3.571a.25.25 0 01-.249-.217l-.82-8.338h8l-.826 8.338z" fill="#888EB0"/>
    </svg>
  );
}