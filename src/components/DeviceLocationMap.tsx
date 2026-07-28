import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap } from
'react-leaflet';
import {
  MapPinIcon,
  SearchIcon,
  LayersIcon,
  CrosshairIcon,
  WifiIcon,
  WifiOffIcon } from
'lucide-react';

export interface MappedDevice {
  id: string;
  name: string;
  label: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  kind: 'prepaid' | 'postpaid' | 'logger';
  consumption?: string;
  balance?: string;
  online?: boolean;
}

interface DeviceLocationMapProps {
  devices: MappedDevice[];
  height?: number;
}

type BaseLayer = 'street' | 'satellite';

const KIND_COLORS: Record<MappedDevice['kind'], string> = {
  prepaid: '#16a34a',
  postpaid: '#2563eb',
  logger: '#9333ea'
};

const STATUS_RING: Record<string, string> = {
  Active: '#16a34a',
  'Low Balance': '#f59e0b',
  Disconnected: '#dc2626',
  'Pending Bill': '#f59e0b',
  Overdue: '#dc2626'
};

/** Imperatively flies the map to a target when it changes */
function FlyTo({ target }: {target: [number, number] | null;}) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 14, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

/** Fits the map to all device bounds on first load */
function FitBounds({ devices }: {devices: MappedDevice[];}) {
  const map = useMap();
  const hasFitted = useRef(false);
  useEffect(() => {
    if (hasFitted.current || devices.length === 0) return;
    const lats = devices.map((d) => d.latitude);
    const lngs = devices.map((d) => d.longitude);
    map.fitBounds(
      [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]],

      { padding: [40, 40] }
    );
    hasFitted.current = true;
  }, [devices, map]);
  return null;
}

export function DeviceLocationMap({
  devices,
  height = 560
}: DeviceLocationMapProps) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | MappedDevice['kind']>(
    'all'
  );
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('street');
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return devices.filter((d) => {
      const matchesKind = kindFilter === 'all' || d.kind === kindFilter;
      if (!matchesKind) return false;
      if (!term) return true;
      return (
        d.name.toLowerCase().includes(term) ||
        d.label.toLowerCase().includes(term) ||
        d.location.toLowerCase().includes(term));

    });
  }, [devices, search, kindFilter]);

  // Cap rendered markers for performance on very large fleets
  const MARKER_LIMIT = 400;
  const rendered = filtered.slice(0, MARKER_LIMIT);

  const counts = useMemo(
    () => ({
      prepaid: devices.filter((d) => d.kind === 'prepaid').length,
      postpaid: devices.filter((d) => d.kind === 'postpaid').length,
      logger: devices.filter((d) => d.kind === 'logger').length
    }),
    [devices]
  );

  const tileUrl =
  baseLayer === 'satellite' ?
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' :
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution =
  baseLayer === 'satellite' ?
  '&copy; Esri, Maxar, Earthstar Geographics' :
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, meter number, or location…"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search devices on the map" />
            
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(
            [
            { key: 'all', label: 'All' },
            { key: 'prepaid', label: `Prepaid (${counts.prepaid})` },
            { key: 'postpaid', label: `Postpaid (${counts.postpaid})` },
            { key: 'logger', label: `Loggers (${counts.logger})` }] as
            const).
            map((opt) =>
            <button
              key={opt.key}
              onClick={() => setKindFilter(opt.key as any)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              kindFilter === opt.key ?
              'bg-blue-600 text-white border-blue-600' :
              'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`
              }>
              
                {opt.label}
              </button>
            )}

            <button
              onClick={() =>
              setBaseLayer(baseLayer === 'street' ? 'satellite' : 'street')
              }
              className="flex items-center px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              title="Toggle base map">
              
              <LayersIcon className="h-4 w-4 mr-1.5" />
              {baseLayer === 'street' ? 'Satellite' : 'Street'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <span className="font-medium text-gray-500">Legend:</span>
          <span className="flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-1.5"
              style={{ backgroundColor: KIND_COLORS.prepaid }} />
            
            Prepaid meter
          </span>
          <span className="flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-1.5"
              style={{ backgroundColor: KIND_COLORS.postpaid }} />
            
            Postpaid meter
          </span>
          <span className="flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-1.5"
              style={{ backgroundColor: KIND_COLORS.logger }} />
            
            3-Phase data logger
          </span>
          <span className="ml-auto text-gray-400">
            Showing {rendered.length.toLocaleString()} of{' '}
            {filtered.length.toLocaleString()} matching devices
            {filtered.length > MARKER_LIMIT && ' (zoom/filter to refine)'}
          </span>
        </div>
      </div>

      {/* Map */}
      <div
        className="rounded-lg overflow-hidden border border-gray-200 shadow-sm relative"
        style={{ height }}>
        
        {devices.length === 0 ?
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-center p-6">
            <MapPinIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">
              No device locations available
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Add a meter or data logger and its coordinates will appear here
              automatically.
            </p>
          </div> :

        <MapContainer
          center={[-1.2864, 36.8172]}
          zoom={11}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
          worldCopyJump>
          
            <TileLayer url={tileUrl} attribution={attribution} />
            <FitBounds devices={devices} />
            <FlyTo target={flyTarget} />

            {rendered.map((device) =>
          <CircleMarker
            key={device.id}
            center={[device.latitude, device.longitude]}
            radius={device.kind === 'logger' ? 9 : 7}
            pathOptions={{
              color:
              STATUS_RING[device.status] || KIND_COLORS[device.kind],
              fillColor: KIND_COLORS[device.kind],
              fillOpacity: 0.85,
              weight: 2
            }}>
            
                <Popup>
                  <div className="min-w-[220px]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-tight">
                          {device.name}
                        </p>
                        <p className="text-xs text-gray-500">{device.label}</p>
                      </div>
                      <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white shrink-0"
                    style={{
                      backgroundColor: KIND_COLORS[device.kind]
                    }}>
                    
                        {device.kind === 'logger' ?
                    'LOGGER' :
                    device.kind.toUpperCase()}
                      </span>
                    </div>

                    <dl className="space-y-1 text-xs">
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Location</dt>
                        <dd className="text-gray-900 text-right">
                          {device.location}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Status</dt>
                        <dd className="text-gray-900 text-right">
                          {device.status}
                        </dd>
                      </div>
                      {device.consumption !== undefined &&
                  <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Consumption</dt>
                          <dd className="text-gray-900 text-right">
                            {device.consumption} kWh
                          </dd>
                        </div>
                  }
                      {device.balance !== undefined &&
                  <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">
                            {device.kind === 'postpaid' ? 'Bill' : 'Balance'}
                          </dt>
                          <dd className="text-gray-900 text-right">
                            Ksh {device.balance}
                          </dd>
                        </div>
                  }
                      {device.online !== undefined &&
                  <div className="flex justify-between gap-3">
                          <dt className="text-gray-500">Link</dt>
                          <dd className="text-gray-900 text-right flex items-center justify-end">
                            {device.online ?
                      <>
                                <WifiIcon className="h-3 w-3 mr-1 text-green-600" />
                                Online
                              </> :

                      <>
                                <WifiOffIcon className="h-3 w-3 mr-1 text-gray-400" />
                                Offline
                              </>
                      }
                          </dd>
                        </div>
                  }
                      <div className="flex justify-between gap-3 pt-1 border-t border-gray-100">
                        <dt className="text-gray-500">Coordinates</dt>
                        <dd className="text-gray-900 text-right font-mono text-[11px]">
                          {device.latitude.toFixed(5)},{' '}
                          {device.longitude.toFixed(5)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </Popup>
              </CircleMarker>
          )}
          </MapContainer>
        }
      </div>

      {/* Quick-jump list */}
      {filtered.length > 0 &&
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Device Coordinates
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {['Device', 'Location', 'Latitude', 'Longitude', ''].map(
                  (h, i) =>
                  <th
                    key={i}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    
                        {h}
                      </th>

                )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filtered.slice(0, 100).map((d) =>
              <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                      className="inline-block w-2 h-2 rounded-full mr-2 shrink-0"
                      style={{
                        backgroundColor: KIND_COLORS[d.kind]
                      }} />
                    
                        <div>
                          <div className="text-sm text-gray-900">{d.name}</div>
                          <div className="text-xs text-gray-400">
                            {d.label}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                      {d.location}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-mono text-gray-600">
                      {d.latitude.toFixed(5)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-mono text-gray-600">
                      {d.longitude.toFixed(5)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <button
                    onClick={() =>
                    setFlyTarget([d.latitude, d.longitude])
                    }
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                    title="Locate on map">
                    
                        <CrosshairIcon className="h-3.5 w-3.5 mr-1" />
                        Locate
                      </button>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

}