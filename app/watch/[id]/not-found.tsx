import Link from "next/link";

import { getChrome } from "@/lib/site";

import styles from "./detail.module.css";

// Preserves the original inline "Title not found" design while letting the
// route return a real 404 status.
export default async function MovieNotFound() {
  const { notFound } = await getChrome();

  return (
    <div className={styles.notFound}>
      <h1>{notFound.title}</h1>
      <Link href="/watch" className={styles.notFoundLink}>
        {notFound.backLabel}
      </Link>
    </div>
  );
}
