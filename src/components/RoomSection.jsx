import { useState, useRef, useEffect } from 'react'
import { Group, Text } from '@mantine/core'
import { DeviceItem } from './DeviceItem'

export function RoomSection({ roomName, roomIcon, devices, getDevicePowerState, getDeviceBrightness, getDeviceColorRgb, getDeviceColorTemperatureK, toggleDevicePower, setDeviceBrightness, setDeviceColorRgb, setDeviceColorTemperatureK, loading, onMoveDevice, onDeleteRoom, canDelete, isNewlyCreated, editMode }) {
  const [expanded, setExpanded] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)
  const [justDropped, setJustDropped] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isTogglingAll, setIsTogglingAll] = useState(false)
  const devicesRef = useRef(null)
  const [maxHeight, setMaxHeight] = useState('auto')
  
  const onlineCount = devices.filter(d => getDevicePowerState(d) === true).length
  const totalCount = devices.length

  // Calculate and update max height whenever devices change or component updates
  useEffect(() => {
    if (!devicesRef.current || !expanded) return

    const updateHeight = () => {
      if (devicesRef.current) {
        const height = devicesRef.current.scrollHeight
        setMaxHeight(`${height}px`)
      }
    }

    // Initial update
    requestAnimationFrame(updateHeight)

    // Create ResizeObserver to watch for size changes (like color picker expanding)
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateHeight)
    })

    resizeObserver.observe(devicesRef.current)

    // Also observe all children (device items) to catch their size changes
    Array.from(devicesRef.current.children).forEach(child => {
      resizeObserver.observe(child)
    })

    return () => {
      resizeObserver.disconnect()
    }
  }, [devices, expanded])

  const handleToggleAll = async (e) => {
    e.stopPropagation()
    if (isTogglingAll || devices.length === 0) return
    
    setIsTogglingAll(true)
    // Toggle to opposite of majority state
    const shouldTurnOn = onlineCount < totalCount / 2
    
    try {
      await Promise.all(
        devices.map(device => toggleDevicePower(device, shouldTurnOn))
      )
    } catch (error) {
      console.error('Failed to toggle all devices:', error)
    } finally {
      setIsTogglingAll(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const deviceId = e.dataTransfer.getData('deviceId')
    const sourceRoom = e.dataTransfer.getData('sourceRoom')
    
    if (deviceId && sourceRoom !== roomName) {
      onMoveDevice(deviceId, roomName)
      
      // Show success animation
      setJustDropped(true)
      setTimeout(() => setJustDropped(false), 600)
      
      // Auto-expand room if it was collapsed
      if (!expanded) {
        setExpanded(true)
      }
    }
  }

  return (
    <div 
      className={`room-section ${isDragOver ? 'drag-over' : ''} ${justDropped ? 'just-dropped' : ''} ${isNewlyCreated ? 'newly-created' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="room-header">
        <div className="room-header-content">
          <Group gap={12} style={{ flex: 1 }} onClick={() => setExpanded(!expanded)}>
            <button 
              className={`room-icon-button ${isTogglingAll ? 'toggling' : ''} ${onlineCount === 0 ? 'all-off' : onlineCount === totalCount ? 'all-on' : 'partial-on'}`}
              onClick={handleToggleAll}
              disabled={isTogglingAll || devices.length === 0}
              title={devices.length === 0 ? 'No devices' : onlineCount > 0 ? 'Turn off all devices' : 'Turn on all devices'}
            >
              <div className="room-icon">
                <span className="material-symbols-outlined room-icon-symbol">
                  {roomIcon || 'home'}
                </span>
              </div>
            </button>
            <div>
              <Text size="sm" fw={600} c="white">
                {roomName}
              </Text>
              <Text size="xs" c={onlineCount > 0 ? 'blue' : 'dimmed'}>
                {onlineCount} of {totalCount} devices on
              </Text>
            </div>
          </Group>
          <button className="expand-button" onClick={() => setExpanded(!expanded)}>
            <span className="material-symbols-outlined">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
        {canDelete && editMode && (
          <div className="room-actions">
            {showDeleteConfirm ? (
              <div className="delete-confirm">
                <Text size="xs" c="red" style={{ marginRight: '8px' }}>
                  Delete?
                </Text>
                <button
                  className="confirm-delete-button"
                  onClick={() => {
                    onDeleteRoom(roomName)
                    setShowDeleteConfirm(false)
                  }}
                  title="Confirm delete"
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
                <button
                  className="cancel-delete-button"
                  onClick={() => setShowDeleteConfirm(false)}
                  title="Cancel"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ) : (
              <button
                className="delete-room-button edit-mode-visible"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete room"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
          </div>
        )}
      </div>
      <div 
        ref={devicesRef}
        className={`room-devices ${expanded ? 'expanded' : 'collapsed'}`}
        style={{ '--max-height': maxHeight }}
      >
        {devices.length === 0 ? (
          <div className="empty-room-message">
            <Text size="xs" c="dimmed">Drag devices here</Text>
          </div>
        ) : (
          devices.map((device) => {
            const isOn = getDevicePowerState(device)
            const brightness = getDeviceBrightness(device)
            return (
              <DeviceItem
                key={device.device}
                device={device}
                isOn={isOn}
                brightness={brightness}
                onToggle={toggleDevicePower}
                onBrightnessChange={setDeviceBrightness}
                getDeviceColorRgb={getDeviceColorRgb}
                setDeviceColorRgb={setDeviceColorRgb}
                getDeviceColorTemperatureK={getDeviceColorTemperatureK}
                setDeviceColorTemperatureK={setDeviceColorTemperatureK}
                loading={loading}
                roomName={roomName}
                disableDrag={editMode}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

