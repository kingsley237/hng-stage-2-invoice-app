import { InvoiceStatus } from '../types';
import styles from './StatusBadge.module.css';

interface Props {
  status: InvoiceStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`${styles.badge} ${styles[status]}`} aria-label={`Status: ${status}`}>
      <span className={styles.dot} aria-hidden="true" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}