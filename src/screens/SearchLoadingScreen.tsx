import arrowLeft from '../assets/icons/arrow-left.svg';
import menuAlt from '../assets/icons/menu-alt.svg';
import { Appbar } from '../components/Appbar/Appbar';
import { FilterBar, type QuickFilter } from '../components/FilterBar/FilterBar';
import { IconButton } from '../components/IconButton/IconButton';
import { PlaneWindow } from '../components/PlaneWindow/PlaneWindow';
import { SearchSummary } from '../components/SearchSummary/SearchSummary';
import s from './SearchLoadingScreen.module.css';

export const QUICK_FILTERS: QuickFilter[] = [
  { id: 'activity', label: 'Вид активности' },
  { id: 'format', label: 'Формат' },
  { id: 'duration', label: 'Длительность' },
  { id: 'price', label: 'Цена' },
  { id: 'amenities', label: 'Удобства' },
];

type Props = {
  route?: string;
  details?: string;
  message?: string;
  filters?: QuickFilter[];
  onBack?: () => void;
  onEditSearch?: () => void;
  onSort?: () => void;
  onOpenAllFilters?: () => void;
  onOpenFilter?: (id: string) => void;
};

/** Figma «Экскурсии» → «Редактировать поиск» (903:119485): the search is running. */
export function SearchLoadingScreen({
  route = 'Бишкек → Москва',
  details = '29 мая – 02 июнь, 1 пассажира',
  message = 'Ищем авиабилеты....',
  filters = QUICK_FILTERS,
  onBack,
  onEditSearch,
  onSort,
  onOpenAllFilters,
  onOpenFilter,
}: Props) {
  return (
    <div className={s.screen}>
      <div className={s.top}>
        <Appbar
          left={<IconButton icon={arrowLeft} label="Назад" onClick={onBack} />}
          center={<SearchSummary title={route} subtitle={details} onClick={onEditSearch} />}
          right={<IconButton icon={menuAlt} label="Сортировка" onClick={onSort} />}
        />
        <FilterBar filters={filters} onOpenAll={onOpenAllFilters} onOpenFilter={onOpenFilter} />
      </div>

      <main className={s.stage}>
        <div className={s.loader} role="status" aria-live="polite">
          <PlaneWindow />
          <p className={s.message}>{message}</p>
        </div>
      </main>
    </div>
  );
}
