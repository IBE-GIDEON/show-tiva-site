import Link from "next/link";

import styles from "./detail.module.css";

// Preserves the original inline "Title not found" design while letting the
// route return a real 404 status.
export default function MovieNotFound() {
  return (
    <div className={styles.notFound}>
      <h1>Title not found</h1>
      <Link href="/watch" className={styles.notFoundLink}>
        Back to browse
      </Link>
    </div>
  );
}
