/**
 * Утилита логирования
 * В production все log-вызовы отключены, warn/error остаются
 */

export const isDev = import.meta.env.DEV

export const log = isDev ? (...args) => console.log(...args) : () => {}
export const warn = (...args) => console.warn(...args)
export const error = (...args) => console.error(...args)
