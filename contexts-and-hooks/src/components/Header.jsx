import { useGroups } from "../hooks/useGroups.js";

export default function Header() {
  const { groups } = useGroups();
  const totalCollected = groups.reduce(
    (total, group) =>
      total +
      group.contributions.reduce(
        (groupTotal, contribution) => groupTotal + contribution.amount,
        0,
      ),
    0,
  );

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Susu Circle home">
        <span className="brand-mark" aria-hidden="true">
          SC
        </span>
        <span>Susu Circle</span>
      </a>
      <div className="collected-badge" aria-label="Total contributions collected">
        <span>Total collected</span>
        <strong>{new Intl.NumberFormat().format(totalCollected)}</strong>
      </div>
    </header>
  );
}
