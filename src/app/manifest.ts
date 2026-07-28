import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orgullo Embajador",
    short_name: "Orgullo Embajador",
    description:
      "Compra tus boletas para los partidos de Millonarios FC de forma rápida, segura y garantizada.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070f",
    theme_color: "#0a2f8c",
    icons: [
      {
        src: "/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
