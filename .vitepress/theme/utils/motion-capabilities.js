export function getMotionCapabilities() {
  if (typeof window === 'undefined') {
    return {
      reduced: true,
      mobile: true,
      lowPower: true,
      advanced: false,
      transition: false,
    }
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile =
    window.matchMedia('(max-width: 48rem)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  const connection = navigator.connection
  const lowPower = Boolean(connection?.saveData) ||
    Number(navigator.hardwareConcurrency ?? 8) <= 2 ||
    Number(navigator.deviceMemory ?? 8) <= 2

  return {
    reduced,
    mobile,
    lowPower,
    advanced: !reduced && !mobile && !lowPower,
    transition: !reduced && !mobile,
  }
}
