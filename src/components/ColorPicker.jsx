import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  rgbIntToHex,
  hexToRgbInt,
  rgbIntToRgb,
  rgbToRgbInt,
  rgbToHsv,
  hsvToRgb,
  kelvinToRgb
} from '../utils/colorUtils'

const COLOR_PRESETS = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Orange', hex: '#FF8000' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Lime', hex: '#80FF00' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Cyan', hex: '#00FFFF' },
  { name: 'Light Blue', hex: '#0080FF' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Purple', hex: '#8000FF' },
  { name: 'Magenta', hex: '#FF00FF' },
  { name: 'Hot Pink', hex: '#FF0080' },
  { name: 'Pink', hex: '#FF80FF' }
]

const PRESETS_STORAGE_KEY = 'govee-color-presets'

// Load presets from localStorage or use defaults
function loadPresets() {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Failed to load presets from localStorage:', e)
  }
  return COLOR_PRESETS
}

// Save presets to localStorage
function savePresets(presets) {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch (e) {
    console.error('Failed to save presets to localStorage:', e)
  }
}

// Wheel Constants
const HUE_SEGMENTS = 24
const RINGS = 7
const WHEEL_SIZE = 360
const CENTER_X = WHEEL_SIZE / 2
const CENTER_Y = WHEEL_SIZE / 2

const TEMP_RING_OUTER_RADIUS = 180
const TEMP_RING_INNER_RADIUS = 160
const PRESETS_RING_OUTER_RADIUS = 155
const PRESETS_RING_INNER_RADIUS = 135
const COLOR_WHEEL_OUTER_RADIUS = 130
const INNER_RADIUS = 30

const TEMP_MIN = 2000
const TEMP_MAX = 9000
const TEMP_SEGMENTS = 120 // Number of segments for smooth gradient

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  }
}

function describeArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
  // Handle full circle case
  if (endAngle - startAngle >= 360) {
    endAngle = startAngle + 359.999
  }

  var start = polarToCartesian(x, y, outerRadius, endAngle)
  var end = polarToCartesian(x, y, outerRadius, startAngle)
  var start2 = polarToCartesian(x, y, innerRadius, endAngle)
  var end2 = polarToCartesian(x, y, innerRadius, startAngle)

  var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  var d = [
    'M',
    start.x,
    start.y,
    'A',
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'L',
    end2.x,
    end2.y,
    'A',
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    1,
    start2.x,
    start2.y,
    'Z'
  ].join(' ')

  return d
}

export function ColorPicker({
  opened,
  device,
  currentColorRgb,
  currentColorTemperatureK,
  onColorChange,
  onTemperatureChange,
  onClose,
  loading
}) {
  const [selectedRgbInt, setSelectedRgbInt] = useState(currentColorRgb || 16777215) // Default to white
  const [hsv, setHsv] = useState({ h: 0, s: 0, v: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [presets, setPresets] = useState(() => loadPresets())
  const [localTemperatureK, setLocalTemperatureK] = useState(currentColorTemperatureK || 4000)
  const [changingTemperature, setChangingTemperature] = useState(false)
  const colorChangeTimeoutRef = useRef(null)
  const temperatureChangeTimeoutRef = useRef(null)
  const previousPresetsRef = useRef([])
  const animationProgressRef = useRef(1)
  const animationSnapshotRef = useRef(null)
  const hasInitializedPresetsRef = useRef(false)
  const animationFrameRef = useRef(null)
  const [animationProgress, setAnimationProgress] = useState(1)

  // Check if device has colorTemperatureK capability
  const hasTemperatureCapability = device?.capabilities?.some(
    cap => cap.type === 'devices.capabilities.color_setting' && cap.instance === 'colorTemperatureK'
  )

  // Initialize color from currentColorRgb prop
  useEffect(() => {
    if (currentColorRgb !== null && currentColorRgb !== undefined) {
      setSelectedRgbInt(currentColorRgb)
      const rgb = rgbIntToRgb(currentColorRgb)
      const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
      setHsv(newHsv)
    }
  }, [currentColorRgb])

  // Initialize temperature from currentColorTemperatureK prop
  useEffect(() => {
    if (currentColorTemperatureK !== null && currentColorTemperatureK !== undefined) {
      setLocalTemperatureK(currentColorTemperatureK)
    }
  }, [currentColorTemperatureK])

  const updateHsvFromRgbInt = useCallback(rgbInt => {
    const rgb = rgbIntToRgb(rgbInt)
    const newHsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    setHsv(newHsv)
  }, [])

  const handleColorSelect = useCallback(
    (rgbInt, isImmediate = false) => {
      setSelectedRgbInt(rgbInt)
      updateHsvFromRgbInt(rgbInt)

      // Debounce handling
      if (colorChangeTimeoutRef.current) {
        clearTimeout(colorChangeTimeoutRef.current)
      }

      if (isImmediate) {
        if (onColorChange && device) {
          onColorChange(device, rgbInt)
        }
      } else {
        colorChangeTimeoutRef.current = setTimeout(() => {
          if (onColorChange && device) {
            onColorChange(device, rgbInt)
          }
        }, 100)
      }
    },
    [updateHsvFromRgbInt, onColorChange, device]
  )

  // Generate wheel segments
  const segments = useMemo(() => {
    const segs = []
    const ringWidth = (COLOR_WHEEL_OUTER_RADIUS - INNER_RADIUS) / RINGS

    for (let r = 0; r < RINGS; r++) {
      const innerR = INNER_RADIUS + r * ringWidth
      const outerR = INNER_RADIUS + (r + 1) * ringWidth
      // Saturation: Outer ring is 100%, inner ring is less saturated (closer to white center)
      // Map r=0 to S=20, r=RINGS-1 to S=100
      const saturation = 20 + r * (80 / (RINGS - 1))

      for (let h = 0; h < HUE_SEGMENTS; h++) {
        const startAngle = h * (360 / HUE_SEGMENTS)
        const endAngle = (h + 1) * (360 / HUE_SEGMENTS)

        // HSV Color for this segment
        // Hue needs to match standard color wheel where 0 is Red
        const hue = startAngle
        const rgb = hsvToRgb(hue, saturation, 100)
        const rgbInt = rgbToRgbInt(rgb.r, rgb.g, rgb.b)
        const hex = rgbIntToHex(rgbInt)

        segs.push({
          id: `r${r}-h${h}`,
          d: describeArc(CENTER_X, CENTER_Y, innerR, outerR, startAngle, endAngle),
          fill: hex,
          rgbInt,
          hue,
          saturation
        })
      }
    }
    return segs
  }, [])

  const tempSegments = useMemo(() => {
    const segments = []
    const GAP = 1.5 // Gap at end (degrees)
    const totalAngle = 360 - GAP
    const anglePerSegment = totalAngle / TEMP_SEGMENTS

    for (let i = 0; i < TEMP_SEGMENTS; i++) {
      const startAngle = i * anglePerSegment
      const endAngle = (i + 1) * anglePerSegment

      // Map angle (0-360) to temperature (TEMP_MIN to TEMP_MAX)
      // Start from top (0 degrees) and go clockwise
      // We want warm colors at top, cool at bottom
      const normalizedAngle = (startAngle + anglePerSegment / 2) / 360
      const temp = TEMP_MIN + normalizedAngle * (TEMP_MAX - TEMP_MIN)

      const rgb = kelvinToRgb(temp)
      const rgbInt = rgbToRgbInt(rgb.r, rgb.g, rgb.b)
      const hex = rgbIntToHex(rgbInt)

      segments.push({
        id: `temp-${i}`,
        d: describeArc(CENTER_X, CENTER_Y, TEMP_RING_INNER_RADIUS, TEMP_RING_OUTER_RADIUS, startAngle, endAngle),
        fill: hex,
        temp: Math.round(temp)
      })
    }

    return segments
  }, [])

  // Calculate animated preset segments
  const presetSegments = useMemo(() => {
    // Filter out any drafts (shouldn't be any, but just in case)
    const validPresets = presets.filter(p => !p.isDraft)
    const totalPresets = validPresets.length
    const progress = animationProgressRef.current
    const snapshot = animationSnapshotRef.current
    const isAnimating = Boolean(snapshot) && progress < 1

    if (totalPresets === 0 && !isAnimating) return []
    if (isAnimating && snapshot?.type === 'delete' && snapshot.previousTotal === 0) return [] // Should not happen if deleting

    // Determine which list to map over
    // If deleting, we animate based on the PREVIOUS list (shrinking the deleted item)
    // If adding, we animate based on the NEW list (growing the new item)
    let sourceList = validPresets
    if (isAnimating && snapshot?.type === 'delete') {
      sourceList = snapshot.previousPresets || []
    }

    return sourceList
      .map((preset, i) => {
        let startAngle, endAngle

        // Calculate angles
        if (isAnimating) {
          if (snapshot.type === 'add') {
            // Animation: ADD
            const previousTotal = snapshot.previousTotal
            const currentTotal = totalPresets // sourceList is validPresets

            // New positions
            const newAnglePerSegment = 360 / currentTotal
            const newStartAngle = i * newAnglePerSegment
            const newEndAngle = (i + 1) * newAnglePerSegment

            let oldStartAngle, oldEndAngle
            if (i < previousTotal) {
              // Existing item
              const oldAnglePerSegment = 360 / previousTotal
              oldStartAngle = i * oldAnglePerSegment
              oldEndAngle = (i + 1) * oldAnglePerSegment
            } else {
              // New item - slide from 360
              oldStartAngle = 360
              oldEndAngle = 360
            }

            startAngle = oldStartAngle + (newStartAngle - oldStartAngle) * progress
            endAngle = oldEndAngle + (newEndAngle - oldEndAngle) * progress
          } else if (snapshot.type === 'delete') {
            // Animation: DELETE
            const previousTotal = snapshot.previousTotal
            const currentTotal = totalPresets // validPresets length

            // Old positions (from sourceList which is previousPresets)
            const oldAnglePerSegment = 360 / previousTotal
            const oldStartAngle = i * oldAnglePerSegment
            const oldEndAngle = (i + 1) * oldAnglePerSegment

            let targetStartAngle, targetEndAngle

            if (preset.hex === snapshot.deletedHex) {
              // This is the deleted item - shrink to gap position
              // Gap position is determined by its index i
              // If currentTotal is 0, shrink to 0 (or keeping center)
              if (currentTotal === 0) {
                targetStartAngle = 0
                targetEndAngle = 0
              } else {
                // The item at index i is gone. The gap is at i * (360/currentTotal)
                // Wait, if i was 2. items 0,1 stay. item 2 gone. item 3 becomes 2.
                // so gap is at 2 * unit.
                const targetPos = Math.min(i, currentTotal) * (360 / currentTotal)
                targetStartAngle = targetPos
                targetEndAngle = targetPos
              }
            } else {
              // Surviving item - find new position
              // We need to find its index in the NEW list
              const newIndex = validPresets.findIndex(p => p.hex === preset.hex)

              if (newIndex !== -1 && currentTotal > 0) {
                const newAnglePerSegment = 360 / currentTotal
                targetStartAngle = newIndex * newAnglePerSegment
                targetEndAngle = (newIndex + 1) * newAnglePerSegment
              } else {
                // Should not happen for surviving item unless duplicate hex issues
                targetStartAngle = oldStartAngle
                targetEndAngle = oldEndAngle
              }
            }

            startAngle = oldStartAngle + (targetStartAngle - oldStartAngle) * progress
            endAngle = oldEndAngle + (targetEndAngle - oldEndAngle) * progress
          } else {
            // Fallback
            const anglePerSegment = 360 / totalPresets
            startAngle = i * anglePerSegment
            endAngle = (i + 1) * anglePerSegment
          }
        } else {
          // No animation
          if (totalPresets === 0) return null // filtered later

          const anglePerSegment = 360 / totalPresets
          startAngle = i * anglePerSegment
          endAngle = (i + 1) * anglePerSegment
        }

        // Apply visual gap between segments
        const GAP = 1.5
        const visualEndAngle = Math.abs(endAngle - startAngle) >= 359.9 ? endAngle : endAngle - GAP

        // Calculate delete segment (20 degrees at the end of the segment)
        const deleteSegmentWidth = 20
        // Ensure we don't go beyond startAngle (if segment is smaller than 20 degrees)
        const deleteStartAngle = Math.max(startAngle, visualEndAngle - deleteSegmentWidth)
        const deleteD = describeArc(
          CENTER_X,
          CENTER_Y,
          PRESETS_RING_INNER_RADIUS,
          PRESETS_RING_OUTER_RADIUS,
          deleteStartAngle,
          visualEndAngle
        )

        // Calculate icon position (centered in the delete segment)
        const deleteMidAngle = (deleteStartAngle + visualEndAngle) / 2
        const midRadius = (PRESETS_RING_INNER_RADIUS + PRESETS_RING_OUTER_RADIUS) / 2
        const deleteButtonPos = polarToCartesian(CENTER_X, CENTER_Y, midRadius, deleteMidAngle)

        // Calculate text path
        const textPathId = `delete-text-path-${i}-${preset.hex}`
        const isBottomHalf = deleteMidAngle > 90 && deleteMidAngle < 270

        // Top half: Clockwise (Start -> End)
        // Bottom half: Counter-Clockwise (End -> Start) to flip text
        const textPathStartAngle = isBottomHalf ? visualEndAngle : deleteStartAngle
        const textPathEndAngle = isBottomHalf ? deleteStartAngle : visualEndAngle

        const p1 = polarToCartesian(CENTER_X, CENTER_Y, midRadius, textPathStartAngle)
        const p2 = polarToCartesian(CENTER_X, CENTER_Y, midRadius, textPathEndAngle)

        const largeArc = Math.abs(textPathEndAngle - textPathStartAngle) <= 180 ? '0' : '1'
        // Sweep: 1 for Clockwise, 0 for Counter-Clockwise
        const sweepFlag = isBottomHalf ? '0' : '1'

        const textPathD = ['M', p1.x, p1.y, 'A', midRadius, midRadius, 0, largeArc, sweepFlag, p2.x, p2.y].join(' ')

        return {
          ...preset,
          startAngle,
          endAngle,
          deleteButtonPos,
          deleteMidAngle,
          deleteD,
          textPathId,
          textPathD,
          isBottomHalf,
          d: describeArc(
            CENTER_X,
            CENTER_Y,
            PRESETS_RING_INNER_RADIUS,
            PRESETS_RING_OUTER_RADIUS,
            startAngle,
            visualEndAngle
          )
        }
      })
      .filter(Boolean) // Filter nulls
  }, [presets, animationProgress])

  const tempLabelTextPathD = useMemo(() => {
    const radius = (TEMP_RING_INNER_RADIUS + TEMP_RING_OUTER_RADIUS) / 2
    const p1 = polarToCartesian(CENTER_X, CENTER_Y, radius, 276)
    const p2 = polarToCartesian(CENTER_X, CENTER_Y, radius, 396)
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}`
  }, [])

  const presetLabelTextPathD = useMemo(() => {
    const radius = (PRESETS_RING_INNER_RADIUS + PRESETS_RING_OUTER_RADIUS) / 2
    // Center 40 (Top-Right). Range -20 to 100.
    const p1 = polarToCartesian(CENTER_X, CENTER_Y, radius, -40)
    const p2 = polarToCartesian(CENTER_X, CENTER_Y, radius, 80)
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 0 1 ${p2.x} ${p2.y}`
  }, [])
  const handleTemperatureChangeDebounced = useCallback(
    async value => {
      if (changingTemperature) return

      setChangingTemperature(true)
      try {
        if (onTemperatureChange && device) {
          await onTemperatureChange(device, value)
        }
      } catch (error) {
        console.error('Temperature change failed:', error)
        // Revert to previous temperature on error
        if (currentColorTemperatureK !== null && currentColorTemperatureK !== undefined) {
          setLocalTemperatureK(currentColorTemperatureK)
        }
      } finally {
        setChangingTemperature(false)
      }
    },
    [onTemperatureChange, device, changingTemperature, currentColorTemperatureK]
  )

  const handleTemperatureChangeEnd = useCallback(
    async value => {
      // Clear any pending debounce timer
      if (temperatureChangeTimeoutRef.current) {
        clearTimeout(temperatureChangeTimeoutRef.current)
        temperatureChangeTimeoutRef.current = null
      }

      // Immediately call the debounced handler
      await handleTemperatureChangeDebounced(value)
    },
    [handleTemperatureChangeDebounced]
  )

  const handleTemperatureChange = useCallback(
    value => {
      // Update local state immediately for responsive UI
      setLocalTemperatureK(value)

      // Clear any existing debounce timer
      if (temperatureChangeTimeoutRef.current) {
        clearTimeout(temperatureChangeTimeoutRef.current)
      }

      // Set a new debounce timer
      temperatureChangeTimeoutRef.current = setTimeout(() => {
        handleTemperatureChangeDebounced(value)
      }, 300) // 300ms debounce delay
    },
    [handleTemperatureChangeDebounced]
  )

  const handleTempSegmentClick = useCallback(
    temp => {
      setLocalTemperatureK(temp)

      // Update color preview
      const rgb = kelvinToRgb(temp)
      const rgbInt = rgbToRgbInt(rgb.r, rgb.g, rgb.b)
      setSelectedRgbInt(rgbInt)
      updateHsvFromRgbInt(rgbInt)

      handleTemperatureChangeEnd(temp)
    },
    [handleTemperatureChangeEnd, updateHsvFromRgbInt]
  )

  const handleSegmentMouseDown = useCallback(
    rgbInt => {
      setIsDragging(true)
      handleColorSelect(rgbInt, true)
    },
    [handleColorSelect]
  )

  const handleSegmentMouseEnter = useCallback(
    rgbInt => {
      if (isDragging) {
        handleColorSelect(rgbInt, false)
      }
    },
    [isDragging, handleColorSelect]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseUp])

  const handlePresetClick = useCallback(
    (preset, event) => {
      const rgbInt = hexToRgbInt(preset.hex)
      setSelectedRgbInt(rgbInt)
      updateHsvFromRgbInt(rgbInt)

      // Always apply color to device when clicking a preset
      if (onColorChange && device) {
        onColorChange(device, rgbInt)
      }

      // Reset transform for the clicked button
      if (event && event.currentTarget) {
        event.currentTarget.style.transform = 'scale(1)'
      }
    },
    [updateHsvFromRgbInt, onColorChange, device]
  )

  // Animation effect for preset changes
  useEffect(() => {
    const validPresets = presets.filter(p => !p.isDraft)
    const previousValidPresets = previousPresetsRef.current.filter(p => !p.isDraft)

    // Skip animation on initial load
    const isInitialLoad = !hasInitializedPresetsRef.current

    // Check if a preset was changed and animation was requested (snapshot set)
    // or if we need to start animation for a change
    const hasChange = validPresets.length !== previousValidPresets.length

    if (!isInitialLoad && hasChange && animationSnapshotRef.current) {
      // Start animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      const startTime = performance.now()
      const duration = 400 // 400ms animation

      const animate = currentTime => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smooth animation
        const easedProgress = 1 - Math.pow(1 - progress, 3) // ease-out cubic

        animationProgressRef.current = easedProgress
        setAnimationProgress(easedProgress)

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          animationProgressRef.current = 1
          setAnimationProgress(1)
          animationSnapshotRef.current = null
          animationFrameRef.current = null
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    } else if (!isInitialLoad && !hasChange) {
      // No change, do nothing
    } else {
      // Initial load or reset
      animationProgressRef.current = 1
      setAnimationProgress(1)
      animationSnapshotRef.current = null
    }

    // Update previous presets ref and mark initialized
    previousPresetsRef.current = [...presets]
    hasInitializedPresetsRef.current = true

    // Cleanup animation on unmount
    return () => {
      if (animationFrameRef.current && hasChange) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      // Don't clear snapshot here, see logic in effect
    }
  }, [presets])

  const handleAddPresetClick = useCallback(() => {
    const currentHex = rgbIntToHex(selectedRgbInt).toUpperCase()

    // Check if preset already exists
    const exists = presets.some(p => p.hex.toUpperCase() === currentHex)
    if (exists) {
      // Preset already exists, don't add duplicate
      return
    }

    // Setup animation snapshot BEFORE state update
    const validPresets = presets.filter(p => !p.isDraft)
    animationSnapshotRef.current = {
      previousPresets: validPresets,
      previousTotal: validPresets.length,
      type: 'add'
    }
    animationProgressRef.current = 0
    setAnimationProgress(0)

    // Add the preset immediately
    const newPreset = { name: currentHex, hex: currentHex }
    const updatedPresets = [...presets, newPreset]
    setPresets(updatedPresets)
    savePresets(updatedPresets)
  }, [selectedRgbInt, presets])

  const handleDeletePreset = useCallback(
    (presetToDelete, e) => {
      e.stopPropagation()

      // Setup animation snapshot for deletion
      const validPresets = presets.filter(p => !p.isDraft)
      animationSnapshotRef.current = {
        previousPresets: validPresets,
        previousTotal: validPresets.length,
        type: 'delete',
        deletedHex: presetToDelete.hex
      }
      animationProgressRef.current = 0
      setAnimationProgress(0)

      const updatedPresets = presets.filter(p => p.hex !== presetToDelete.hex)
      setPresets(updatedPresets)
      savePresets(updatedPresets)
    },
    [presets]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (colorChangeTimeoutRef.current) {
        clearTimeout(colorChangeTimeoutRef.current)
      }
      if (temperatureChangeTimeoutRef.current) {
        clearTimeout(temperatureChangeTimeoutRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const currentHex = rgbIntToHex(selectedRgbInt).toUpperCase()

  // Check if current color is already in presets
  const isColorInPresets = useMemo(() => {
    return presets.some(p => p.hex.toUpperCase() === currentHex)
  }, [presets, currentHex])

  if (!opened) return null

  return (
    <div className="color-picker-inline">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingTop: '12px',
          marginTop: '12px'
        }}
      >
        {/* Color Wheel - Always shown now, with presets ring */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '360px',
            margin: '0 auto',
            aspectRatio: '1'
          }}
        >
          <svg
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}
          >
            {/* Segments */}
            {segments.map(seg => (
              <path
                key={seg.id}
                d={seg.d}
                fill={seg.fill}
                stroke={seg.fill}
                strokeWidth={0.5}
                style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                onMouseDown={e => {
                  e.preventDefault() // Prevent text selection/drag
                  handleSegmentMouseDown(seg.rgbInt)
                }}
                onMouseEnter={() => handleSegmentMouseEnter(seg.rgbInt)}
              />
            ))}

            {/* Center Circle - Always shows selected color */}
            <g>
              {/* Background circle with selected color */}
              <circle
                cx={CENTER_X}
                cy={CENTER_Y}
                r={INNER_RADIUS - 4}
                fill={currentHex}
                style={{ cursor: 'pointer' }}
                onMouseDown={e => {
                  e.preventDefault()
                  if (isColorInPresets || selectedRgbInt === 16777215) {
                    // Do nothing if color is already in presets or white (since white is center)
                    // handleSegmentMouseDown(16777215) // White
                  } else {
                    e.stopPropagation()
                    handleAddPresetClick()
                  }
                }}
                onMouseEnter={() => {
                  // if (isColorInPresets || selectedRgbInt === 16777215) {
                  //   handleSegmentMouseEnter(16777215)
                  // }
                }}
              />
              {/* Plus button overlay when color is not in presets */}
              {!isColorInPresets && selectedRgbInt !== 16777215 && (
                <>
                  <circle
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={INNER_RADIUS - 2}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    style={{ cursor: 'pointer', pointerEvents: 'none' }}
                  />
                  <foreignObject
                    x={CENTER_X - INNER_RADIUS + 2}
                    y={CENTER_Y - INNER_RADIUS + 2}
                    width={(INNER_RADIUS - 2) * 2}
                    height={(INNER_RADIUS - 2) * 2}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '28px', fontWeight: 'bold' }}>
                        add
                      </span>
                    </div>
                  </foreignObject>
                </>
              )}
            </g>

            {/* Outer Temperature Ring */}
            {tempSegments.map(seg => (
              <path
                key={seg.id}
                d={seg.d}
                fill={seg.fill}
                stroke={seg.fill}
                strokeWidth={0.5}
                style={{ cursor: 'pointer', transition: 'opacity 0.1s' }}
                onMouseDown={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleTempSegmentClick(seg.temp)
                }}
              >
                <title>{seg.temp}K</title>
              </path>
            ))}

            {/* Temperature Label Overlay */}
            <defs>
              <path id="temp-label-path" d={tempLabelTextPathD} />
            </defs>
            <text
              fill="#666"
              fontSize="14"
              fontWeight="bold"
              dy="5"
              style={{ pointerEvents: 'none', fontFamily: 'SF Compact, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              <textPath href="#temp-label-path" startOffset="50%" textAnchor="middle">
                TEMPERATURE
              </textPath>
            </text>

            {/* Presets Background Ring */}
            <path
              d={describeArc(CENTER_X, CENTER_Y, PRESETS_RING_INNER_RADIUS, PRESETS_RING_OUTER_RADIUS, 0, 359.999)}
              fill="rgba(0, 0, 0, 0.5)"
              stroke="none"
              style={{ pointerEvents: 'none' }}
            />

            {/* Presets Ring */}
            {presetSegments.map((preset, i) => (
              <g
                key={preset.hex + i}
                className="preset-segment-group"
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => {
                  const group = e.currentTarget
                  const deleteButtons = group.querySelectorAll('.preset-delete-button')
                  deleteButtons.forEach(btn => {
                    btn.style.opacity = '1'
                  })
                }}
                onMouseLeave={e => {
                  const group = e.currentTarget
                  const deleteButtons = group.querySelectorAll('.preset-delete-button')
                  deleteButtons.forEach(btn => {
                    btn.style.opacity = '0'
                  })
                }}
              >
                <path
                  d={preset.d}
                  fill={preset.hex}
                  stroke={preset.hex}
                  strokeWidth={0.5}
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handlePresetClick(preset, e)
                  }}
                >
                  <title>{preset.name}</title>
                </path>
                {/* Delete button segment */}
                <path
                  className="preset-delete-button"
                  d={preset.deleteD}
                  fill="rgba(0, 0, 0, 0.8)"
                  stroke="none"
                  style={{
                    opacity: 0,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease, fill 0.2s ease',
                    pointerEvents: 'auto'
                  }}
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeletePreset(preset, e)
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.fill = '#333'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.fill = 'rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <title>Delete preset</title>
                </path>
                {/* Hidden path for text */}
                <defs>
                  <path id={preset.textPathId} d={preset.textPathD} />
                </defs>

                {/* DELETE text in delete button */}
                <text
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  className="preset-delete-button"
                  dy="3"
                  style={{
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s ease',
                    fontFamily: 'SF Compact, -apple-system, BlinkMacSystemFont, sans-serif'
                  }}
                >
                  <textPath href={`#${preset.textPathId}`} startOffset="50%" textAnchor="middle">
                    DELETE
                  </textPath>
                </text>
              </g>
            ))}

            {/* Presets Label Overlay */}
            <defs>
              <path id="preset-label-path" d={presetLabelTextPathD} />
            </defs>
            <text
              fill="#666"
              fontSize="14"
              fontWeight="bold"
              dy="5"
              style={{ pointerEvents: 'none', fontFamily: 'SF Compact, -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              <textPath href="#preset-label-path" startOffset="50%" textAnchor="middle">
                PRESETS
              </textPath>
            </text>
          </svg>
        </div>
        {/* </> */}
        {/* )} */}
      </div>
    </div>
  )
}
