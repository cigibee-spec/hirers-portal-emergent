import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const lastDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!lastDismissed || Date.now() - parseInt(lastDismissed) > 7 * 24 * 60 * 60 * 1000) {
        setShowPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-80 z-50 animate-in slide-in-from-bottom-4" data-testid="pwa-install-prompt">
      <div className="bg-blueprint-navy text-white rounded-lg p-4 shadow-xl border border-white/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm">Install BuildForce</p>
            <p className="text-xs text-white/70 mt-1">Add to home screen for quick access, offline support & native experience.</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall} className="bg-safety-orange hover:bg-safety-orange/90 text-white rounded-sm text-xs h-8 px-3" data-testid="pwa-install-btn">
                Install App
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-white/60 hover:text-white hover:bg-white/10 rounded-sm text-xs h-8 px-3">
                Not Now
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-white/40 hover:text-white flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
