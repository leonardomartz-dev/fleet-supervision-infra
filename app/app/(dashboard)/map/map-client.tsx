"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { MapProperty, MapVehicle } from "@/lib/dashboard";
import { formatDateTime } from "@/app/components";

function markerColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("online")) return "#42d392";
  if (normalized.includes("offline") || normalized.includes("missing")) return "#ff6b6b";
  return "#8996a3";
}

function vehicleIcon(status: string) {
  return L.divIcon({
    className: "",
    html: `<div class="vehicle-marker" style="--marker-color: ${markerColor(status)}"></div>`,
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

export default function FleetMap({
  vehicles,
  properties,
}: {
  vehicles: MapVehicle[];
  properties: MapProperty[];
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const center: [number, number] =
      vehicles[0]?.latitude && vehicles[0]?.longitude
        ? [vehicles[0].latitude, vehicles[0].longitude]
        : [46.23, -119.12];

    const map = L.map(mapRef.current, {
      center,
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    for (const property of properties) {
      L.circle([property.lat, property.lon], {
        radius: property.radius,
        color: "#53b1ff",
        dashArray: "6 7",
        fill: false,
        opacity: 0.85,
        weight: 2,
      })
        .bindPopup(`<strong>${property.name}</strong><br />${property.address}`)
        .addTo(map);
    }

    for (const vehicle of vehicles) {
      L.marker([vehicle.latitude, vehicle.longitude], { icon: vehicleIcon(vehicle.status) })
        .bindPopup(
          `<strong>${vehicle.name}</strong><br />Status: ${vehicle.status}<br />Last update: ${formatDateTime(
            vehicle.lastUpdate
          )}`
        )
        .addTo(map);
    }

    return () => {
      map.remove();
    };
  }, [properties, vehicles]);

  return <div className="min-h-[560px] overflow-hidden rounded-md border border-[var(--border)] shadow-[var(--shadow-soft)]" ref={mapRef} />;
}
