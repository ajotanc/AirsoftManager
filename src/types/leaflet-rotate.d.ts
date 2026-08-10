// src/types/leaflet-rotate.d.ts
import 'leaflet';

declare module 'leaflet' {
  interface MapOptions {
    rotate?: boolean;
    rotateControl?: boolean | object;
    bearing?: number;
  }

  interface Map {
    setBearing(bearing: number): this;
    getBearing(): number;
  }
}