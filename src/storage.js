/*
 * The app was written against a host-provided `window.storage` object.
 * As a standalone PWA it owns its own persistence: localStorage, which
 * survives reinstalls of the service worker and works with no network.
 *
 * The async shape of the original API is kept so callers don't care which
 * backing store they got.
 */

const memory = new Map();

// Safari in private mode and some embedded webviews throw on any access.
const available = (() => {
  try {
    const probe = "__tl_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

export const storage = {
  async get(key) {
    const value = available ? window.localStorage.getItem(key) : memory.get(key);
    return value == null ? null : { value };
  },

  async set(key, value) {
    if (!available) {
      memory.set(key, value);
      return;
    }
    window.localStorage.setItem(key, value);
  },

  async remove(key) {
    if (!available) {
      memory.delete(key);
      return;
    }
    window.localStorage.removeItem(key);
  },

  /* True when writes will outlive this tab. The UI warns when they won't. */
  persistent: available,
};

/*
 * Ask the browser not to evict the log under storage pressure. Chrome grants
 * this silently to installed PWAs; elsewhere it's a no-op we don't care about.
 */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* not supported, nothing to do */
  }
}
