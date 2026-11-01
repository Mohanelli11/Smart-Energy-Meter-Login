import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPinIcon,
  GlobeIcon,
  ZapIcon,
  CpuIcon,
  RefreshCwIcon,
  CheckCircle2Icon } from
'lucide-react';
import { Meter } from '../utils/meterStorage';
import { resolveCoordinatesSync } from '../utils/geocoding';
import { DeviceLocationMap, MappedDevice } from './DeviceLocationMap';

interface DeviceLocationsProps {
  prepaidMeters: Meter[];
  postpaidMeters: Meter[];
}

interface StoredLogger {
  id: string;
  name: string;
  serialNumber: string;
  location: string;
  gsmNumber: string;
  online: boolean;
  lastSync: string;
  latitude?: number;
  longitude?: number;
}

export function DeviceLocations({
  prepaidMeters,
  postpaidMeters
}: DeviceLocationsProps) {
  const [loggers, setLoggers] = useState<StoredLogger[]>([]);
  const [refreshedAt, setRefreshedAt] = useState(new Date());

  // Load registered data loggers (added via the Data Logger section)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('motech_data_loggers');
      setLoggers(raw ? JSON.parse(raw) : []);
    } catch {
      setLoggers([]);
    }
  }, [refreshedAt]);

  const devices = useMemo<MappedDevice[]>(() => {
    const mapMeter = (
    meter: Meter,
    kind: 'prepaid' | 'postpaid')
    : MappedDevice => {
      // Use stored coordinates when present, otherwise resolve on the fly
      const coords =
      typeof meter.latitude === 'number' &&
      typeof meter.longitude === 'number' ?
      { latitude: meter.latitude, longitude: meter.longitude } :
      resolveCoordinatesSync(
        meter.location,
        meter.meterNo || meter.accountNo
      );
      return {
        id: `${kind}-${meter.accountNo}`,
        name: meter.customerName,
        label: `${meter.accountNo} · ${meter.meterNo}`,
        location: meter.location,
        latitude: coords.latitude,
        longitude: coords.longitude,
        status: meter.status,
        kind,
        consumption: meter.consumption,
        balance: meter.balance,
        online: meter.lastReport ?
        meter.lastReport.status === 'online' :
        undefined
      };
    };

    const meterDevices = [
    ...prepaidMeters.map((m) => mapMeter(m, 'prepaid')),
    ...postpaidMeters.map((m) => mapMeter(m, 'postpaid'))];


    const loggerDevices: MappedDevice[] = loggers.map((l) => {
      const coords =
      typeof l.latitude === 'number' && typeof l.longitude === 'number' ?
      { latitude: l.latitude, longitude: l.longitude } :
      resolveCoordinatesSync(l.location, l.serialNumber || l.id);
      return {
        id: `logger-${l.id}`,
        name: l.name,
        label: l.serialNumber,
        location: l.location,
        latitude: coords.latitude,
        longitude: coords.longitude,
        status: l.online ? 'Online' : 'Offline',
        kind: 'logger',
        online: l.online
      };
    });

    return [...meterDevices, ...loggerDevices];
  }, [prepaidMeters, postpaidMeters, loggers]);

  const stats = useMemo(() => {
    const uniqueLocations = new Set(devices.map((d) => d.location));
    const geocoded = devices.filter(
      (d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude)
    ).length;
    return {
      total: devices.length,
      geocoded,
      coverage:
      devices.length > 0 ?
      Math.round(geocoded / devices.length * 100) :
      0,
      areas: uniqueLocations.size,
      loggers: loggers.length
    };
  }, [devices, loggers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <GlobeIcon className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Device Locations
              </h2>
              <p className="text-gray-500 mt-1 max-w-2xl">
                Every meter and data logger on the network, geolocated on a
                world map. Coordinates are resolved automatically from each
                device's service area when it is added to the system.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRefreshedAt(new Date())}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            title="Refresh device locations">
            
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Coverage stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatTile
            icon={<MapPinIcon className="h-5 w-5 text-blue-600" />}
            label="Mapped Devices"
            value={stats.total.toLocaleString()} />
          
          <StatTile
            icon={<CheckCircle2Icon className="h-5 w-5 text-green-600" />}
            label="Geocode Coverage"
            value={`${stats.coverage}%`} />
          
          <StatTile
            icon={<ZapIcon className="h-5 w-5 text-yellow-600" />}
            label="Service Areas"
            value={stats.areas.toLocaleString()} />
          
          <StatTile
            icon={<CpuIcon className="h-5 w-5 text-purple-600" />}
            label="Data Loggers"
            value={stats.loggers.toLocaleString()} />
          
        </div>
      </section>

      {/* Map */}
      <DeviceLocationMap devices={devices} height={560} />
    </div>);

}

function StatTile({
  icon,
  label,
  value




}: {icon: React.ReactNode;label: string;value: string;}) {
  return (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div className="p-2 bg-white rounded-lg shadow-sm mr-3">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-bold text-gray-900 text-lg">{value}</p>
      </div>
    </div>);

}