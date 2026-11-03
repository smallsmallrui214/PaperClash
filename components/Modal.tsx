'use client';

import {useEffect, useId, useRef, type ReactNode} from 'react';
import {X} from 'lucide-react';

export default function Modal({title, description, children, onClose, wide = false}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={ref} className={`modal${wide ? ' modal-wide' : ''}`} aria-labelledby={titleId}
      onCancel={event => {event.preventDefault(); onClose();}}>
      <div className="modal-header">
        <div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>
        <button type="button" className="icon-button" onClick={onClose} aria-label={`关闭${title}`}><X size={20}/></button>
      </div>
      {children}
    </dialog>
  );
}
