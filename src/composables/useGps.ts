import { ref, computed, onUnmounted } from "vue";

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export type GpsStatus = "idle" | "acquiring" | "locked" | "error";

/**
 * Calculates the geodetic distance between two coordinates in meters using the Haversine formula.
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const TO_RAD = Math.PI / 180;
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * TO_RAD;
  const dLon = (lon2 - lon1) * TO_RAD;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * TO_RAD) *
      Math.cos(lat2 * TO_RAD) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates the initial bearing (azimuth) from coordinate 1 to coordinate 2 in degrees (0-360).
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const TO_RAD = Math.PI / 180;
  const φ1 = lat1 * TO_RAD;
  const φ2 = lat2 * TO_RAD;
  const Δλ = (lon2 - lon1) * TO_RAD;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return Math.round(bearing);
};

/**
 * Returns human-readable cardinal direction (N, NE, E, SE, S, SW, W, NW) for a given bearing angle.
 */
export const getCardinalDirection = (bearing: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index] || "N";
};

/**
 * Formats standard Geolocation error messages into clear Portuguese text.
 */
export const getGpsErrorMessage = (error: GeolocationPositionError | Error | string): string => {
  if (typeof error === "string") return error;
  if ("code" in error) {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return "Sem permissão de acesso ao GPS";
      case 2: // POSITION_UNAVAILABLE
        return "Sinal GPS indisponível / Sem sintonia com satélites";
      case 3: // TIMEOUT
        return "Tempo limite esgotado ao buscar sinal GPS";
      default:
        return error.message || "Erro desconhecido no sistema GPS";
    }
  }
  return error.message || "Erro de geolocalização";
};

/**
 * Single fetch for the user's current GPS position with offline/online resilient fallback.
 */
export const getCurrentUserLocation = (
  options?: PositionOptions,
): Promise<GPSPosition> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolocalização não suportada neste dispositivo/navegador."));
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        // Offline Fallback: If high accuracy fails or times out (common offline), retry with low accuracy / cached position
        if (defaultOptions.enableHighAccuracy) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              resolve({
                lat: fallbackPos.coords.latitude,
                lng: fallbackPos.coords.longitude,
                accuracy: fallbackPos.coords.accuracy,
                timestamp: fallbackPos.timestamp,
              });
            },
            (fallbackErr) => {
              reject(new Error(getGpsErrorMessage(fallbackErr)));
            },
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000,
            },
          );
        } else {
          reject(new Error(getGpsErrorMessage(error)));
        }
      },
      defaultOptions,
    );
  });
};

/**
 * Monitors the device's geolocation in real-time.
 */
export const watchUserLocation = (
  onSuccess: (pos: GPSPosition) => void,
  onError: (err: GeolocationPositionError) => void,
  options?: PositionOptions,
): number | null => {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null;
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    onError,
    defaultOptions,
  );
};

/**
 * Stops monitoring the device's geolocation.
 */
export const stopWatchingLocation = (watchId: number | null): void => {
  if (
    watchId !== null &&
    typeof window !== "undefined" &&
    navigator.geolocation
  ) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Vue 3 Composable centralizing all GPS operations, reactive state, and online/offline status.
 */
export function useGps() {
  const position = ref<GPSPosition | null>(null);
  const error = ref<string | null>(null);
  const isLoading = ref<boolean>(false);
  const status = ref<GpsStatus>("idle");
  const watchId = ref<number | null>(null);

  // Connectivity status monitoring
  const isOnline = ref<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine;
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  }

  const isSupported = computed(() => {
    return typeof window !== "undefined" && "geolocation" in navigator;
  });

  const latitude = computed(() => position.value?.lat ?? null);
  const longitude = computed(() => position.value?.lng ?? null);

  /**
   * Fetches current location once.
   */
  const getCurrentLocation = async (options?: PositionOptions): Promise<GPSPosition> => {
    isLoading.value = true;
    error.value = null;
    status.value = "acquiring";

    try {
      const pos = await getCurrentUserLocation(options);
      position.value = pos;
      status.value = "locked";
      return pos;
    } catch (err) {
      const errorObj = err as GeolocationPositionError | Error;
      const msg = getGpsErrorMessage(errorObj);
      error.value = msg;
      status.value = "error";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Starts monitoring user position continuously.
   */
  const startWatching = (
    options?: PositionOptions,
    onUpdate?: (pos: GPSPosition) => void,
  ): number | null => {
    stopWatching();

    status.value = "acquiring";
    isLoading.value = true;
    error.value = null;

    const id = watchUserLocation(
      (pos: GPSPosition) => {
        position.value = pos;
        status.value = "locked";
        isLoading.value = false;
        error.value = null;
        if (onUpdate) onUpdate(pos);
      },
      (err: GeolocationPositionError) => {
        const msg = getGpsErrorMessage(err);
        error.value = msg;
        status.value = "error";
        isLoading.value = false;
      },
      options,
    );

    watchId.value = id;
    if (id === null) {
      status.value = "error";
      error.value = "Geolocalização não suportada ou indisponível.";
      isLoading.value = false;
    }

    return id;
  };

  /**
   * Stops real-time position monitoring.
   */
  const stopWatching = () => {
    if (watchId.value !== null) {
      stopWatchingLocation(watchId.value);
      watchId.value = null;
      if (status.value === "acquiring" || status.value === "locked") {
        status.value = "idle";
      }
    }
  };

  /**
   * Helper to check if current or specified coordinates are within a target radius (in meters).
   */
  const checkProximity = (
    targetLat: number,
    targetLng: number,
    radiusMeters: number,
    fromLat?: number,
    fromLng?: number,
  ): { isWithin: boolean; distance: number } => {
    const currentLat = fromLat ?? latitude.value;
    const currentLng = fromLng ?? longitude.value;

    if (currentLat === null || currentLng === null) {
      return { isWithin: false, distance: Infinity };
    }

    const dist = calculateDistance(currentLat, currentLng, targetLat, targetLng);
    return {
      isWithin: dist <= radiusMeters,
      distance: dist,
    };
  };

  onUnmounted(() => {
    stopWatching();
    if (typeof window !== "undefined") {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    }
  });

  return {
    position,
    latitude,
    longitude,
    error,
    isLoading,
    isSupported,
    isOnline,
    status,
    watchId,
    getCurrentLocation,
    startWatching,
    stopWatching,
    calculateDistance,
    checkProximity,
  };
}
