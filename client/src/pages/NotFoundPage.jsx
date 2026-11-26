import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="card empty-state">
      <span className="empty-mark" aria-hidden="true">
        ?
      </span>
      <h1>Page not found</h1>
      <p className="muted">
        That route does not exist. Head back to explore savings circles.
      </p>
      <Link className="button-primary button-link" to="/">
        Go to All Circles
      </Link>
    </section>
  );
}
