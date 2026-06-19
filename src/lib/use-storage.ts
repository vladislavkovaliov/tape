import { useState, useEffect, useCallback } from "react"

export function useStorage<T>(
  key: string,
  defaultValue: T,
): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    chrome.storage.local.get(key, (result) => {
      if (result[key] !== undefined) {
        setValue(result[key] as T)
      }
    })

    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      if (key in changes) {
        setValue(changes[key].newValue as T)
      }
    }

    chrome.storage.onChanged.addListener(onChange)
    return () => chrome.storage.onChanged.removeListener(onChange)
  }, [key])

  const set = useCallback(
    (val: T) => {
      chrome.storage.local.set({ [key]: val })
      setValue(val)
    },
    [key],
  )

  return [value, set]
}
