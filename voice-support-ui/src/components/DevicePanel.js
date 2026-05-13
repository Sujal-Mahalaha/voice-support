import React, { useState } from 'react';
import { Plus, Search, Trash2, Monitor } from 'lucide-react';
import './DevicePanel.css';

const INITIAL_DEVICES = [
  { id: '1', name: 'John Smith',    phone: '+61 412 345 678', device: 'Samsung Galaxy S24 Ultra', priority: 'critical' },
  { id: '2', name: 'Sarah Johnson', phone: '+61 423 456 789', device: 'Samsung Galaxy Z Fold5',  priority: 'high'     },
  { id: '3', name: 'Michael Chen',  phone: '+61 434 567 890', device: 'Samsung Galaxy A54',      priority: 'medium'   },
];

const PRIORITY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium' };

export default function DevicePanel({ selected, onSelect }) {
  const [devices, setDevices]   = useState(INITIAL_DEVICES);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [newName, setNewName]   = useState('');
  const [newPhone, setNewPhone] = useState('');

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  function addDevice() {
    if (!newName.trim()) return;
    setDevices(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      phone: newPhone.trim() || 'N/A',
      device: 'Unknown Device',
      priority: 'medium',
    }]);
    setNewName('');
    setNewPhone('');
    setShowAdd(false);
  }

  function removeDevice(e, id) {
    e.stopPropagation();
    setDevices(prev => prev.filter(d => d.id !== id));
    if (selected?.id === id) onSelect(null);
  }

  return (
    <aside className="device-panel">
      <div className="dp-header">
        <div className="dp-title">
          <Monitor size={16} />
          <span>Devices</span>
        </div>
        <button className="dp-add-btn" onClick={() => setShowAdd(v => !v)}>
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>

      <div className="dp-search-wrap">
        <Search size={14} className="dp-search-icon" />
        <input
          className="dp-search"
          placeholder="Search devices..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showAdd && (
        <div className="dp-add-form">
          <input
            className="dp-input"
            placeholder="Full name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            className="dp-input"
            placeholder="Phone number"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
          />
          <div className="dp-add-actions">
            <button className="dp-btn-cancel" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="dp-btn-save"   onClick={addDevice}>Add Device</button>
          </div>
        </div>
      )}

      <div className="dp-list">
        {filtered.length === 0 && (
          <div className="dp-empty">No devices found</div>
        )}
        {filtered.map(device => (
          <div
            key={device.id}
            className={`dp-item ${selected?.id === device.id ? 'dp-item--active' : ''}`}
            onClick={() => onSelect(device)}
          >
            <div className="dp-item-info">
              <div className="dp-item-top">
                <span className="dp-item-name">{device.name}</span>
                <span className={`dp-badge dp-badge--${device.priority}`}>
                  {PRIORITY_LABEL[device.priority]}
                </span>
              </div>
              <div className="dp-item-phone">{device.phone}</div>
              <div className="dp-item-device">{device.device}</div>
            </div>
            <button className="dp-item-delete" onClick={e => removeDevice(e, device.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
