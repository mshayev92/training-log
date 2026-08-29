import { useRegisterSW } from "virtual:pwa-register/react";

/*
 * Service worker lifecycle, surfaced instead of hidden.
 *
 * A silent auto-reload would be simpler, but this app is used mid-workout with
 * unsaved input on screen, so a new version waits until you say so.
 */
export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="tl-toast" role="status">
      <div className="tl-toast-msg">
        {needRefresh
          ? "New version ready."
          : "Ready to use offline — no signal needed at the gym."}
      </div>
      {needRefresh && (
        <button className="tl-toast-btn" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
      )}
      <button className="tl-toast-btn ghost" onClick={dismiss}>
        {needRefresh ? "Later" : "OK"}
      </button>
    </div>
  );
}
