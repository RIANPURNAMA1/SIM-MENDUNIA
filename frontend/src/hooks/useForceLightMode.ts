import { useEffect } from "react";

export function useForceLightMode() {
  useEffect(() => {
    const root = document.documentElement

    const apply = () => {
      root.classList.add("theme-light-lock")
      root.classList.remove("dark")
    }

    apply()

    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) apply()
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })

    return () => {
      observer.disconnect()
      root.classList.remove("theme-light-lock")
      let restoreDark = false
      try {
        restoreDark = localStorage.getItem("theme") === "dark"
      } catch {
        /* ignore */
      }
      root.classList.toggle("dark", restoreDark)
    }
  }, [])
}