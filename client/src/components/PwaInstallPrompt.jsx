import React, { useState, useEffect } from 'react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const inStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(inStandaloneMode);

    if (inStandaloneMode) return;

    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIos(iosDevice);

    // Listen for native install prompt event (Android / Desktop Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if dismissed recently in localStorage
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    } else if (iosDevice) {
      // Show prompt for iOS users after 3 seconds if not in standalone mode
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(!showIosGuide);
      return;
    }

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
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-banner-content">
        <div className="pwa-banner-icon">🔱</div>
        <div className="pwa-banner-text">
          <strong>Install Sadhana Tracker</strong>
          <span>Add to your home screen for quick daily access & fast offline logging</span>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button className="btn-pwa-install" onClick={handleInstallClick} id="pwa-install-btn">
          {isIos ? 'How to Install' : 'Install App'}
        </button>
        <button className="btn-pwa-dismiss" onClick={handleDismiss} id="pwa-dismiss-btn" title="Dismiss">
          ✕
        </button>
      </div>

      {showIosGuide && (
        <div className="pwa-ios-modal">
          <p><strong>To install on iOS (iPhone / iPad):</strong></p>
          <ol>
            <li>Tap the <strong>Share</strong> button (<span>open safari share icon</span>) in Safari.</li>
            <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> in the top right corner.</li>
          </ol>
          <button className="btn-secondary btn-sm" onClick={() => setShowIosGuide(false)}>Got it</button>
        </div>
      )}
    </div>
  );
}
