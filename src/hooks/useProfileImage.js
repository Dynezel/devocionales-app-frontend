import { useEffect, useState } from "react";
import axios from "axios";
import defaultImage from "../Images/default-image-profile.jpg";

const MAX_CACHE = 50;
const imageCache = new Map(); // userId -> { url, ts }

function touchCache(userId, url) {
  imageCache.set(userId, { url, ts: Date.now() });
  if (imageCache.size > MAX_CACHE) {
    // Evict least-recently used
    let oldestKey = null;
    let oldestTs = Infinity;
    for (const [k, v] of imageCache.entries()) {
      if (v.ts < oldestTs) {
        oldestTs = v.ts;
        oldestKey = k;
      }
    }
    const evicted = imageCache.get(oldestKey);
    if (evicted?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(evicted.url);
    }
    imageCache.delete(oldestKey);
  }
}

export default function useProfileImage(userId) {
  const [url, setUrl] = useState(defaultImage);

  useEffect(() => {
    if (!userId) {
      setUrl(defaultImage);
      return;
    }

    // Si está en caché, usarlo al instante
    const cached = imageCache.get(userId);
    if (cached?.url) {
      touchCache(userId, cached.url);
      setUrl(cached.url);
      return;
    }

    let cancel = false;

    (async () => {
      try {
        const resp = await axios.get(
          `https://devocionales-app-backend.onrender.com/imagen/perfil/${userId}`,
          { responseType: "arraybuffer" }
        );
        if (cancel) return;
        const blob = new Blob([resp.data], { type: "image/jpeg" });
        const objectUrl = URL.createObjectURL(blob);
        touchCache(userId, objectUrl);
        setUrl(objectUrl);
      } catch (e) {
        if (!cancel) setUrl(defaultImage);
      }
    })();

    return () => {
      cancel = true;
      // No revocamos aquí porque la URL la reutiliza el cache (LRU se encarga)
    };
  }, [userId]);

  return url || defaultImage;
}
