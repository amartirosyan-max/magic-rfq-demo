/**
 * Single source of truth for chassis image URLs used by Rack.tsx and
 * ScreenC.tsx.
 *
 * Each chassis spec in a project's data file (`Chassis.image`) names a
 * filename only (e.g. `"PowerEdge-XE9680.png"`); the renderer looks
 * that filename up in `CHASSIS_IMAGE_URLS` to get the bundled,
 * content-hashed URL that Vite emits.
 *
 * Adding a new chassis = drop the PNG in `app/assets/hardware/products/`,
 * add a static import here, and reference the same filename from the
 * project's data file. No other code change required.
 */

/* Avaya project */
import productR660 from "~/assets/hardware/products/Dell-PowerEdge-R660.png";
import productR760 from "~/assets/hardware/products/Dell-PowerEdge-R760.png";
import productUnity380F from "~/assets/hardware/products/DELL-UNITY-XT-380F.png";
import productDS6610B from "~/assets/hardware/products/Dell-Connectrix-DS-6610B.png";
import productS5224F from "~/assets/hardware/products/Dell-EMC-S5224F-ON.png";
import productN3248 from "~/assets/hardware/products/Dell-EMC-N3248TE-ON.png";

/* ADGSA-AI project */
import productXE9680 from "~/assets/hardware/products/PowerEdge-XE9680.png";
import productF710 from "~/assets/hardware/products/PowerScale-F710.png";
import productS5232 from "~/assets/hardware/products/PowerSwitch-S5232.png";
import productSN2201 from "~/assets/hardware/products/Nvidia-SN2201.png";
import productSN5600 from "~/assets/hardware/products/NVIDIA Spectrum-4 SN5600.png";

export const CHASSIS_IMAGE_URLS: Record<string, string> = {
  /* Avaya */
  "Dell-PowerEdge-R660.png": productR660,
  "Dell-PowerEdge-R760.png": productR760,
  "DELL-UNITY-XT-380F.png": productUnity380F,
  "Dell-Connectrix-DS-6610B.png": productDS6610B,
  "Dell-EMC-S5224F-ON.png": productS5224F,
  "Dell-EMC-N3248TE-ON.png": productN3248,
  /* ADGSA-AI */
  "PowerEdge-XE9680.png": productXE9680,
  "PowerScale-F710.png": productF710,
  "PowerSwitch-S5232.png": productS5232,
  "Nvidia-SN2201.png": productSN2201,
  "NVIDIA Spectrum-4 SN5600.png": productSN5600,
};
