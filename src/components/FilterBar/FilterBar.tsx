import filterIcon from '../../assets/icons/filter-chips.svg';
import chevronIcon from '../../assets/icons/chevron-down.svg';
import s from './FilterBar.module.css';

export type QuickFilter = { id: string; label: string };

type Props = {
  filters: QuickFilter[];
  onOpenAll?: () => void;
  onOpenFilter?: (id: string) => void;
};

/** «Filter sroll»: the «filter-chips» button, then one Chips per quick filter; scrolls sideways. */
export function FilterBar({ filters, onOpenAll, onOpenFilter }: Props) {
  return (
    <nav className={s.scroll} aria-label="Фильтры">
      <div className={s.content}>
        <button type="button" className={`${s.chip} ${s.iconChip}`} aria-label="Все фильтры" onClick={onOpenAll}>
          <img className={s.icon} src={filterIcon} width={16} height={16} alt="" draggable={false} />
        </button>
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={s.chip}
            aria-haspopup="dialog"
            onClick={() => onOpenFilter?.(f.id)}
          >
            <span className={s.label}>{f.label}</span>
            <img className={s.icon} src={chevronIcon} width={16} height={16} alt="" draggable={false} />
          </button>
        ))}
      </div>
    </nav>
  );
}
