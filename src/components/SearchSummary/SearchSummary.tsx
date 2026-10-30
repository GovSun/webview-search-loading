import expandIcon from '../../assets/icons/close-circle.svg';
import s from './SearchSummary.module.css';

type Props = {
  title: string;
  subtitle: string;
  onClick?: () => void;
};

/** Appbar centre «search/filter» → «Tab»: route and dates; tapping it reopens the search form. */
export function SearchSummary({ title, subtitle, onClick }: Props) {
  return (
    <button type="button" className={s.tab} onClick={onClick} aria-label={`Изменить поиск: ${title}, ${subtitle}`}>
      <span className={s.text}>
        <span className={s.title}>{title}</span>
        <span className={s.subtitle}>{subtitle}</span>
      </span>
      <img className={s.icon} src={expandIcon} width={16} height={16} alt="" draggable={false} />
    </button>
  );
}
