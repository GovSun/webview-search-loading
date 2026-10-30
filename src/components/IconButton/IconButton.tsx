import s from './IconButton.module.css';

type Props = {
  icon: string;
  label: string;
  onClick?: () => void;
};

/** Appbar «Left icon» / «Right icon 2»: 40×40, radius-lg, Dazzle icon 24. */
export function IconButton({ icon, label, onClick }: Props) {
  return (
    <button type="button" className={s.button} aria-label={label} onClick={onClick}>
      <img className={s.icon} src={icon} width={24} height={24} alt="" draggable={false} />
    </button>
  );
}
