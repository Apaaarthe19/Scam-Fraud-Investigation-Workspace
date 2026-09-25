import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import api from "../api/axios.js";

const getCoordinates = (location) => {
  if (!location || typeof location === "string") return null;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

const MapView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports", { params: { limit: 100 } })
      .then(({ data }) => setReports(data.reports || []))
      .finally(() => setLoading(false));
  }, []);

  const mappedReports = reports.map((report) => ({ report, coordinates: getCoordinates(report.location) })).filter((item) => item.coordinates);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">Geographic intelligence</p>
        <h2 className="text-2xl font-bold mt-1">Scam hotspot map</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reports with verified map coordinates appear here. Older text-only locations are kept in the report list.</p>
      </div>
      <div className="h-[62vh] min-h-[420px] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100">
        <MapContainer center={[20.5937, 78.9629]} zoom={4} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {mappedReports.map(({ report, coordinates }) => (
            <CircleMarker key={report._id} center={coordinates} radius={9} pathOptions={{ color: "#26399e", fillColor: "#3b5bdb", fillOpacity: 0.75 }}>
              <Popup>
                <div className="min-w-[180px]">
                  <p className="font-semibold">{report.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{report.category}</p>
                  <Link to={`/reports/${report._id}`} className="text-xs text-brand-700 hover:underline inline-block mt-2">View report</Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{loading ? "Loading reports..." : `${mappedReports.length} mapped report(s) shown`}</p>
    </div>
  );
};

export default MapView;