import { useState, useEffect, useRef } from 'react'
import { Text, Loader, Center, TextInput } from '@mantine/core'
import { RoomSection } from './RoomSection'

const DEFAULT_ROOMS = [
  { name: 'Living Room', icon: 'living' },
  { name: 'Bedroom', icon: 'bed' }
]

const ROOM_ICONS = [
  'living',
  'bed',
  'kitchen',
  'bathroom',
  'desk',
  'garage',
  'yard',
  'balcony',
  'dining',
  'stairs',
  'door_open',
  'home'
]

export function Rooms({
  devices,
  getDevicePowerState,
  getDeviceBrightness,
  getDeviceColorRgb,
  getDeviceColorTemperatureK,
  toggleDevicePower,
  setDeviceBrightness,
  setDeviceColorRgb,
  setDeviceColorTemperatureK,
  loading,
  error
}) {
  // Initialize rooms list from localStorage or default
  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('govee-rooms')
    if (saved) {
      return JSON.parse(saved)
    }
    return DEFAULT_ROOMS
  })

  // Initialize room assignments from localStorage or default
  const [roomAssignments, setRoomAssignments] = useState(() => {
    const saved = localStorage.getItem('govee-room-assignments')
    if (saved) {
      return JSON.parse(saved)
    }
    // Default: split devices between rooms
    const assignments = {}
    const midpoint = Math.ceil(devices.length / 2)
    devices.forEach((device, index) => {
      assignments[device.device] = index < midpoint ? 'Living Room' : 'Bedroom'
    })
    return assignments
  })

  const [isAddingRoom, setIsAddingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('home')
  const [editMode, setEditMode] = useState(false)
  const inputRef = useRef(null)

  // Save rooms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('govee-rooms', JSON.stringify(rooms))
  }, [rooms])

  // Save room assignments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('govee-room-assignments', JSON.stringify(roomAssignments))
  }, [roomAssignments])

  // Focus input when adding room
  useEffect(() => {
    if (isAddingRoom && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAddingRoom])

  // Add new devices to a default room
  useEffect(() => {
    let changed = false
    const newAssignments = { ...roomAssignments }
    devices.forEach(device => {
      if (!newAssignments[device.device]) {
        newAssignments[device.device] = 'Living Room'
        changed = true
      }
    })
    if (changed) {
      setRoomAssignments(newAssignments)
    }
  }, [devices, roomAssignments])

  const moveDeviceToRoom = (deviceId, targetRoom) => {
    setRoomAssignments(prev => ({
      ...prev,
      [deviceId]: targetRoom
    }))
  }

  const [newlyCreatedRoom, setNewlyCreatedRoom] = useState(null)

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      const trimmedName = newRoomName.trim()

      // Check if room already exists
      if (rooms.some(room => room.name.toLowerCase() === trimmedName.toLowerCase())) {
        return // Could show an error here
      }

      setRooms(prev => [...prev, { name: trimmedName, icon: selectedIcon }])
      setNewRoomName('')
      setIsAddingRoom(false)
      setSelectedIcon('home')

      // Mark as newly created for animation
      setNewlyCreatedRoom(trimmedName)
      setTimeout(() => setNewlyCreatedRoom(null), 800)
    }
  }

  const handleDeleteRoom = roomName => {
    // Don't allow deleting if it's the last room
    if (rooms.length <= 1) return

    // Move all devices from deleted room to first remaining room
    const remainingRooms = rooms.filter(r => r.name !== roomName)
    const targetRoom = remainingRooms[0].name

    const updatedAssignments = { ...roomAssignments }
    Object.keys(updatedAssignments).forEach(deviceId => {
      if (updatedAssignments[deviceId] === roomName) {
        updatedAssignments[deviceId] = targetRoom
      }
    })

    setRoomAssignments(updatedAssignments)
    setRooms(remainingRooms)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      handleAddRoom()
    } else if (e.key === 'Escape') {
      setIsAddingRoom(false)
      setNewRoomName('')
      setSelectedIcon('home')
    }
  }

  if (loading && devices.length === 0) {
    return (
      <Center style={{ padding: '40px' }}>
        <Loader size="md" color="blue" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center style={{ padding: '40px' }}>
        <Text size="sm" c="red">
          {error}
        </Text>
      </Center>
    )
  }

  if (devices.length === 0) {
    return (
      <Center style={{ padding: '40px' }}>
        <Text size="sm" c="dimmed">
          No devices found
        </Text>
      </Center>
    )
  }

  // Group devices by room based on assignments
  const roomsWithDevices = rooms.map(room => ({
    ...room,
    devices: devices.filter(d => roomAssignments[d.device] === room.name)
  }))

  return (
    <div className="rooms-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            Rooms
          </h3>
          {!isAddingRoom && (
            <button className="add-room-button" onClick={() => setIsAddingRoom(true)} title="Add new room">
              <span className="material-symbols-outlined">add</span>
            </button>
          )}
        </div>
        <button
          className={`edit-mode-button ${editMode ? 'active' : ''}`}
          onClick={() => {
            setEditMode(!editMode)
            if (!editMode && isAddingRoom) {
              setIsAddingRoom(false)
              setNewRoomName('')
              setSelectedIcon('home')
            }
          }}
          title={editMode ? 'Done editing' : 'Edit rooms'}
        >
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {isAddingRoom && (
        <div className="add-room-form">
          <div className="icon-selector">
            {ROOM_ICONS.map(icon => (
              <button
                key={icon}
                className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                onClick={() => setSelectedIcon(icon)}
                title={icon}
              >
                <span className="material-symbols-outlined">{icon}</span>
              </button>
            ))}
          </div>
          <div className="room-input-row">
            <TextInput
              ref={inputRef}
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Room name..."
              styles={{
                input: {
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-color)',
                  borderRadius: '6px',
                  '&:focus': {
                    borderColor: 'var(--primary-color)'
                  }
                }
              }}
            />
            <button
              className="confirm-room-button"
              onClick={handleAddRoom}
              disabled={!newRoomName.trim()}
              title="Add room"
            >
              <span className="material-symbols-outlined">check</span>
            </button>
            <button
              className="cancel-room-button"
              onClick={() => {
                setIsAddingRoom(false)
                setNewRoomName('')
                setSelectedIcon('home')
              }}
              title="Cancel"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="rooms-list">
        {roomsWithDevices.map(room => (
          <RoomSection
            key={room.name}
            roomName={room.name}
            roomIcon={room.icon}
            devices={room.devices}
            getDevicePowerState={getDevicePowerState}
            getDeviceBrightness={getDeviceBrightness}
            getDeviceColorRgb={getDeviceColorRgb}
            getDeviceColorTemperatureK={getDeviceColorTemperatureK}
            toggleDevicePower={toggleDevicePower}
            setDeviceBrightness={setDeviceBrightness}
            setDeviceColorRgb={setDeviceColorRgb}
            setDeviceColorTemperatureK={setDeviceColorTemperatureK}
            loading={loading}
            onMoveDevice={moveDeviceToRoom}
            onDeleteRoom={handleDeleteRoom}
            canDelete={rooms.length > 1}
            isNewlyCreated={newlyCreatedRoom === room.name}
            editMode={editMode}
          />
        ))}
      </div>
    </div>
  )
}
