import { useState, useEffect, useCallback } from 'react'

const maskApiKey = key => {
  if (!key) return ''
  if (key.length <= 4) {
    return '*'.repeat(key.length)
  }

  const visibleSuffix = key.slice(-4)
  const maskedLength = Math.max(key.length - 4, 0)
  return `${'*'.repeat(maskedLength)}${visibleSuffix}`
}

export function useApiKey() {
  const [apiKey, setApiKey] = useState('')
  const [originalApiKey, setOriginalApiKey] = useState(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [status, setStatus] = useState({ state: 'idle' })

  const loadApiKey = useCallback(async () => {
    try {
      const key = await window.electronAPI.getApiKey()
      setOriginalApiKey(key)
      setApiKey(key ? maskApiKey(key) : '')
      setShowApiKey(false)
      setStatus({ state: 'idle' })
      return key
    } catch (err) {
      console.error('Error loading API key:', err)
      setApiKey('')
      setOriginalApiKey(null)
      setShowApiKey(false)
      setStatus({ state: 'idle' })
      return null
    }
  }, [])

  const saveApiKey = useCallback(async () => {
    const trimmedInput = apiKey.trim()
    if (!trimmedInput) {
      setStatus({ state: 'error', message: 'API key cannot be empty' })
      return
    }

    // If input matches masked version of original, user didn't change it - use original
    const keyToSave = originalApiKey && trimmedInput === maskApiKey(originalApiKey) ? originalApiKey : trimmedInput

    setStatus({ state: 'loading' })

    try {
      const result = await window.electronAPI.saveApiKey(keyToSave)
      if (result.success) {
        setStatus({ state: 'success' })
        await loadApiKey()
      } else {
        const errorMsg = result.error || 'Failed to save API key'
        setStatus({ state: 'error', message: errorMsg })
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred'
      setStatus({ state: 'error', message: errorMsg })
    }
  }, [apiKey, originalApiKey, loadApiKey])

  const toggleVisibility = useCallback(() => {
    if (!originalApiKey) {
      setShowApiKey(!showApiKey)
      return
    }

    const maskedOriginal = maskApiKey(originalApiKey)
    if (apiKey === maskedOriginal) {
      setApiKey(originalApiKey)
      setShowApiKey(true)
    } else {
      setApiKey(maskedOriginal)
      setShowApiKey(false)
    }
  }, [apiKey, originalApiKey, showApiKey])

  const reset = useCallback(() => {
    setApiKey('')
    setOriginalApiKey(null)
    setShowApiKey(false)
    setStatus({ state: 'idle' })
  }, [])

  useEffect(() => {
    loadApiKey()
  }, [loadApiKey])

  return {
    apiKey,
    setApiKey,
    originalApiKey,
    showApiKey,
    status,
    loadApiKey,
    saveApiKey,
    toggleVisibility,
    reset,
    maskApiKey
  }
}
