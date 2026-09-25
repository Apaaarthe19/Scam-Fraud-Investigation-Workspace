import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const defaultCenter = [20.5937, 78.9629];

const MapClickHandler = ({ onPick }) => {
  useMapEvents({ click: ({ latlng }) => onPick({ lat: latlng.lat, lng: latlng.lng }) });
  return null;
};

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 10));
  }, [map, position]);
  return null;
};

const LocationPicker = ({ location, onChange }) => {
  const position = Number.isFinite(location.lat) && Number.isFinite(location.lng)
    ? { lat: location.lat, lng: location.lng }
    : null;

  return (
    <div className="space-y-2">
      <input placeholder="Location name (city/state)"
        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2"
        value={location.text} onChange={(event) => onChange({ ...location, text: event.target.value })} />
      <div className="h-56 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <MapContainer center={position ? [position.lat, position.lng] : defaultCenter} zoom={position ? 10 : 5} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onPick={(picked) => onChange({ ...location, ...picked })} />
          {position && <><Marker position={[position.lat, position.lng]} /><RecenterMap position={position} /></>}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">Click the map to place the incident pin. Coordinates: {position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : "not set"}</p>
    </div>
  );
};

export default LocationPicker;