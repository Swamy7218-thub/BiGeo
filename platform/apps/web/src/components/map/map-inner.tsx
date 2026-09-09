"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Sample hub data for Telangana
const HUBS = [
  { id: "HUB01", name: "Hyderabad Hub",   lat: 17.3850, lng: 78.4867, size: "major",  deliveries: 423 },
  { id: "HUB02", name: "Siddipet Hub",    lat: 18.1018, lng: 78.8520, size: "mid",    deliveries: 267 },
  { id: "HUB03", name: "Nizamabad Hub",   lat: 18.6725, lng: 78.0941, size: "mid",    deliveries: 312 },
  { id: "HUB04", name: "Warangal Hub",    lat: 17.9784, lng: 79.5941, size: "mid",    deliveries: 254 },
  { id: "HUB05", name: "Karimnagar Hub",  lat: 18.4386, lng: 79.1288, size: "small",  deliveries: 189 },
];

const ROUTES = [
  [HUBS[0], HUBS[1]], [HUBS[0], HUBS[2]], [HUBS[0], HUBS[3]], [HUBS[0], HUBS[4]],
];

export default function MapInner() {
  return (
    <MapContainer
      center={[17.8, 79.0]}
      zoom={7}
      style={{ height: "100%", width: "100%", background: "#1a3322" }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org">OSM</a>'
      />
      {ROUTES.map(([a, b], i) => (
        <Polyline
          key={i}
          positions={[[a.lat, a.lng], [b.lat, b.lng]]}
          pathOptions={{ color: "#22c55e", weight: 2, opacity: 0.6, dashArray: "6 4" }}
        />
      ))}
      {HUBS.map((hub) => (
        <CircleMarker
          key={hub.id}
          center={[hub.lat, hub.lng]}
          radius={hub.size === "major" ? 14 : hub.size === "mid" ? 10 : 7}
          pathOptions={{ color: "#22c55e", fillColor: hub.size === "major" ? "#22c55e" : "#166534", fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <div style={{ fontFamily: "sans-serif", fontSize: 13, color: "#111" }}>
              <strong>{hub.name}</strong><br />
              {hub.deliveries} deliveries/week
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
