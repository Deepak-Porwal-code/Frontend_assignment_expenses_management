import { ArrowLeft, Compass, Plus } from 'lucide-react';
import { LinkButton, Button } from '../components/ui/Button';
import { LogoMark } from '../components/ui/Logo';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { openTransactionModal } = useUI();

  return (
    <div className="not-found">
      <div className="not-found__art" aria-hidden="true">
        <span className="not-found__orb not-found__orb--one" />
        <span className="not-found__orb not-found__orb--two" />
        <span className="not-found__code">404</span>
        <span className="not-found__badge">
          <LogoMark size={30} />
        </span>
      </div>

      <p className="not-found__eyebrow">
        <Compass size={15} strokeWidth={2} aria-hidden="true" />
        Off the map
      </p>
      <h1 className="not-found__title">This page took a wrong turn.</h1>
      <p className="not-found__description">
        The address you followed doesn’t exist — or it moved. Everything else is right where you left it.
      </p>

      <div className="not-found__actions">
        <LinkButton to="/dashboard" icon={ArrowLeft}>Back to dashboard</LinkButton>
        <Button variant="soft" icon={Plus} onClick={() => openTransactionModal()}>
          Add a transaction
        </Button>
      </div>
    </div>
  );
}
