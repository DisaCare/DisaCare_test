'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths in webpack/Next.js
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PlaceCoord {
  id: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  score: number;
  severity: 'good' | 'medium' | 'bad';
}

interface MiniMapProps {
  places?: PlaceCoord[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (id: string) => void;
  // Fallbacks for single place detail page
  singleLatitude?: number;
  singleLongitude?: number;
  singlePlaceName?: string;
  zoom?: number;
}

// Component to dynamically pan/zoom map when selection changes
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export default function MiniMap({
  places = [],
  selectedPlaceId,
  onSelectPlace,
  singleLatitude,
  singleLongitude,
  singlePlaceName,
  zoom = 14,
}: MiniMapProps) {
  
  // Determine center point
  let center: [number, number] = [-6.9147, 107.6098]; // default Bandung Balai Kota
  
  if (singleLatitude !== undefined && singleLongitude !== undefined) {
    center = [singleLatitude, singleLongitude];
  } else if (selectedPlaceId && places.length > 0) {
    const selected = places.find(p => p.id === selectedPlaceId);
    if (selected) {
      center = [selected.latitude, selected.longitude];
    }
  }

  // Create custom marker color icons using SVG
  const getMarkerIcon = (severity: 'good' | 'medium' | 'bad', isSelected: boolean) => {
    const color = severity === 'good' ? '#16A34A' : severity === 'medium' ? '#CA8A04' : '#DC2626';
    const size = isSelected ? 38 : 30;
    
    const svgHtml = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
              fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>
      </svg>
    `;
    
    return L.divIcon({
      html: svgHtml,
      className: 'custom-leaflet-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
    });
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} zoom={zoom} />

        {/* If single place details map */}
        {singleLatitude !== undefined && singleLongitude !== undefined ? (
          <Marker position={[singleLatitude, singleLongitude]} icon={getMarkerIcon('good', true)}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-xs">{singlePlaceName || 'Lokasi'}</p>
                <p className="text-[10px] text-slate-500">{singleLatitude}, {singleLongitude}</p>
              </div>
            </Popup>
          </Marker>
        ) : (
          // Render multiple places
          places.map((place) => {
            const isSelected = selectedPlaceId === place.id;
            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={getMarkerIcon(place.severity, isSelected)}
                eventHandlers={{
                  click: () => {
                    if (onSelectPlace) onSelectPlace(place.id);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 text-slate-800">
                    <p className="font-bold text-xs">{place.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{place.address}</p>
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100">
                      <span className="text-[9px] uppercase font-black tracking-wide text-primary">
                        {place.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-black text-slate-900">
                        {place.score}% Akses
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>
    </div>
  );
}
