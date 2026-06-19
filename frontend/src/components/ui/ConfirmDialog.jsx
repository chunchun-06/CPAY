import Modal from './Modal';
import Button from './Button';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  danger = false,
  loading = false,
}) {
  const { t } = useTranslation();
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('common.areYouSure')} size="sm">
      <div className="space-y-5">
        <p className="text-slate-600 text-sm leading-relaxed">{message || t('common.cannotBeUndone')}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText || t('common.cancel')}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText || t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
