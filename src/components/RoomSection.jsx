import { useState } from 'react'
import { Group, Text } from '@mantine/core'
import { DeviceItem } from './DeviceItem'

export function RoomSection({ roomName, devices, getDevicePowerState, getDeviceBrightness, toggleDevicePower, setDeviceBrightness, loading }) {
  const [expanded, setExpanded] = useState(roomName === 'Living Room')
  
  const onlineCount = devices.filter(d => getDevicePowerState(d) === true).length
  const totalCount = devices.length

  return (
    <div className="room-section">
      <div className="room-header" onClick={() => setExpanded(!expanded)}>
        <Group gap={12}>
          <div className="room-icon">
            <span className="material-symbols-outlined room-icon-symbol">
              {roomName === 'Living Room' ? 'living' : 'bed'}
            </span>
          </div>
          <div>
            <Text size="sm" fw={600} c="white">
              {roomName}
            </Text>
            <Text size="xs" c={onlineCount > 0 ? 'blue' : 'dimmed'}>
              {onlineCount} of {totalCount} devices on
            </Text>
          </div>
        </Group>
        <button className="expand-button">
          <span className="material-symbols-outlined">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
      {expanded && (
        <div className="room-devices">
          {devices.map((device) => {
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
                loading={loading}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

