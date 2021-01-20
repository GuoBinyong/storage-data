export interface DataStorage {
  /**
   * Returns the current value associated with the given key, or null if the given key does not exist in the list associated with the object.
   */
  getItem(key: string): string | null
  /**
   * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
   *
   * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
   */
  setItem(key: string, value: string): void
}





/**
 * 将数据保存到指定的 storage 中的指定 key 下
 * @param data
 * @param key
 * @param storage
 */
function saveDataToStorage(data: any, key: string, storage: Storage): void {
  storage.setItem(key, JSON.stringify(data))
}

export type Millisecond = number

export interface DateDescription {
  year?: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}

export type ExpiresDate = Millisecond | Date | DateDescription | string

export interface StorageDataExpiresItem<V> {
  maxAge: ExpiresDate
  startTime: ExpiresDate
  expires: ExpiresDate
  value: V
}

export function isStorageDataExpiresItem(target: any): target is StorageDataExpiresItem<any> {
  return (
    target &&
    Object.prototype.hasOwnProperty.call(target, 'value') &&
    (Object.prototype.hasOwnProperty.call(target, 'maxAge') || Object.prototype.hasOwnProperty.call(target, 'expires'))
  )
}

export type StorageDataItem<V> = V | StorageDataExpiresItem<V>

export type StorageData<D> = {
  [P in keyof D]: StorageDataItem<D[P]>
}

/**
 * 将 StorageDataItem
 */
export type GetValueFromStorageDataItem<SDItem> = SDItem extends StorageDataExpiresItem<any> ? SDItem['value'] : SDItem

function initStorageDataItem<V>(value: V): V {
  if (isStorageDataExpiresItem(value)) {
    if (value.maxAge != null && value.startTime == undefined) {
      value.startTime = Date.now()
    }
  }

  return value
}

function parseExpiresDate(expiresDate: ExpiresDate) {
  const typeStr = typeof expiresDate

  if (typeStr === 'number' || typeStr === 'string') {
    return new Date(expiresDate as number)
  }

  if (expiresDate instanceof Date) {
    return expiresDate
  }

  let { year = 0, month = 1, day, hour, minute, second, millisecond } = expiresDate as DateDescription
  month = month - 1
  return new Date(year, month, day, hour, minute, second, millisecond)
}

export type ParseStorageDataItemResult<V> = {
  isValid: boolean
  value: V
}

export function parseStorageDataItem<V extends StorageDataItem<any>>(
  item: V
): ParseStorageDataItemResult<GetValueFromStorageDataItem<V>> {
  if (!isStorageDataExpiresItem(item)) {
    return {
      isValid: true,
      value: item as GetValueFromStorageDataItem<V>
    }
  }

  let { expires, maxAge, startTime, value } = item

  const currTime = Date.now()

  if (expires != undefined) {
    let expiresDate = parseExpiresDate(expires)
    if (expiresDate.getTime() < currTime) {
      return {
        isValid: false,
        value: value
      }
    }
  }

  if ((maxAge && startTime) !== undefined) {
    let maxAgeDate = parseExpiresDate(maxAge)
    let startTimeDate = parseExpiresDate(startTime)

    if (startTimeDate.getTime() + maxAgeDate.getTime() < currTime) {
      return {
        isValid: false,
        value: value
      }
    }
  }

  return {
    isValid: true,
    value: value
  }
}

/**
 * 创建 会自动将自己保存到  Storage （如：localStorage、sessionStorage）的数据对象，并且可以给数据对象的属性值设置有效期，如果过了有效期，则该属性会返回 undefined，并且会自动删除该属性
 * @param dataKey : string  指定保存在 Storage 中的 key
 * @param storage ?: Storage 指定要保存到哪个 Storage 对象中，默认是 localStorage
 * @param noExpires ?: boolean 是否禁用有效期功能
 * @returns 返回一个 D 类型的数据对象，当你更新该对象的属性时，它会自动将该对象保存到 指定的 storage 中；如果没有将 noExpires 设置为 true，则也可以给该对象的属性设置有效期，如果过了有效期，则该属性会返回 undefined，并且会自动删除该属性
 */
export function createStorageData<D extends object>(dataKey: string, storage?: Storage): StorageData<D>
export function createStorageData<D extends object>(
  dataKey: string,
  storage: Storage,
  noExpires: false | undefined | null
): StorageData<D>
export function createStorageData<D extends object>(dataKey: string, storage: Storage, noExpires: true): D
export function createStorageData<D extends object, NoExpires>(
  dataKey: string,
  storage: Storage = localStorage,
  noExpires?: NoExpires
): NoExpires extends true ? D : StorageData<D> {
  type SD = NoExpires extends true ? D : StorageData<D>

  let dataJSON = storage.getItem(dataKey)

  let data: SD = {} as SD
  if (dataJSON) {
    try {
      data = JSON.parse(dataJSON)
    } catch (e) {
      data = {} as SD
    }
  }

  if (noExpires) {
    return new Proxy(data, {
      set: function(target: SD, p: keyof SD, value: SD[keyof SD], receiver: any) {
        target[p] = value
        saveDataToStorage(target, dataKey, storage)
        return true
      },
      deleteProperty: function(target: SD, p: keyof SD) {
        let result = delete target[p]
        saveDataToStorage(target, dataKey, storage)
        return result
      }
    })
  }

  return new Proxy(data, {
    get: function(target: SD, property: keyof SD) {
      const value = target[property]
      const result = parseStorageDataItem(value)
      if (!result.isValid) {
        delete target[property]
        return undefined
      }
      return result.value
    },
    set: function(target: SD, p: keyof SD, value: SD[keyof SD], receiver: any) {
      target[p] = initStorageDataItem(value)
      saveDataToStorage(target, dataKey, storage)
      return true
    },
    deleteProperty: function(target: SD, p: keyof SD) {
      let result = delete target[p]
      saveDataToStorage(target, dataKey, storage)
      return result
    }
  })
}

export default createStorageData
