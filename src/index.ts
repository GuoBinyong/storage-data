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

/**
 * 毫秒
 */
export type Millisecond = number;

/**
 * 时间描述
 */
export interface DateDescription {
  year?: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}

/**
 * 有效期
 */
export type ExpiresDate = Millisecond | Date | DateDescription | string

/**
 * StorageData 中 带有有效期的 Item
 */
export interface StorageDataExpiresItem<V> {
  maxAge: ExpiresDate
  startTime: ExpiresDate
  expires: ExpiresDate
  value: V
}

/**
 * StorageDataExpiresItem 的类型守卫
 */
export function isStorageDataExpiresItem(target: any): target is StorageDataExpiresItem<any> {
  return (
    target &&
    Object.prototype.hasOwnProperty.call(target, 'value') &&
    (Object.prototype.hasOwnProperty.call(target, 'maxAge') || Object.prototype.hasOwnProperty.call(target, 'expires'))
  )
}

/**
 * 存储在StorageData 中的 Item
 */
export type StorageDataItem<V> = V | StorageDataExpiresItem<V>



export type StorageData<D> = {
  [P in keyof D]: StorageDataItem<D[P]>
}


/**
 * 将 StorageDataItem 类型 转为其值类型
 */
export type GetValueFromStorageDataItem<SDItem> = SDItem extends StorageDataExpiresItem<any> ? SDItem['value'] : SDItem

/**
 * 对 StorageDataExpiresItem 类型的值 进行初始化，对于其它类型的值不做任何操作
 * @param value 
 */
function initStorageDataItem<V>(value: V): V {
  if (isStorageDataExpiresItem(value)) {
    if (value.maxAge != null && value.startTime == undefined) {
      value.startTime = Date.now()
    }
  }

  return value
}

/**
 * 将 ExpiresDate 类型的值解析 为 Date 类型的值
 * @param expiresDate 
 */
export function parseExpiresDate(expiresDate: ExpiresDate) {
  const typeStr = typeof expiresDate

  if (typeStr === 'number' || typeStr === 'string') {
    return new Date(expiresDate as number)
  }

  if (expiresDate instanceof Date) {
    return expiresDate
  }

  const { year = 0, month = 1, day, hour, minute, second, millisecond } = expiresDate as DateDescription
  return new Date(year, month - 1, day, hour, minute, second, millisecond)
}


/**
 * 有效性描述
 */
export type ValidityDescription<V> = {
  isValid: boolean
  value: V
}

/**
 * 解析 StorageDataItem 类型的值的有效性
 * @param item 
 */
export function parseStorageDataItem<V extends StorageDataItem<any>>(item: V): ValidityDescription<GetValueFromStorageDataItem<V>> {
  if (!isStorageDataExpiresItem(item)) {
    return {
      isValid: true,
      value: item as GetValueFromStorageDataItem<V>
    }
  }

  const { expires, maxAge, startTime, value } = item

  const currTime = Date.now()

  if (expires != undefined) {
    const expiresDate = parseExpiresDate(expires)
    if (expiresDate.getTime() < currTime) {
      return {
        isValid: false,
        value: value
      }
    }
  }

  if ((maxAge && startTime) !== undefined) {
    const maxAgeDate = parseExpiresDate(maxAge)
    const startTimeDate = parseExpiresDate(startTime)

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
export function createStorageData<D extends object>(dataKey: string, storage: Storage, noExpires: false | undefined | null): StorageData<D>
export function createStorageData<D extends object>(dataKey: string, storage: Storage, noExpires: true): D
export function createStorageData<D extends object, NoExpires>(dataKey: string, storage: Storage = localStorage, noExpires?: NoExpires): NoExpires extends true ? D : StorageData<D> {
  type SD = NoExpires extends true ? D : StorageData<D>

  const dataJSON = storage.getItem(dataKey)

  let data!: SD;
  if (dataJSON) {
    try {
      data = JSON.parse(dataJSON)
    } catch (e) {
      data = {} as SD
    }
  }

  if (noExpires) {
    return new Proxy(data, {
      set: function(target: SD, p: keyof SD, value: SD[keyof SD]) {
        target[p] = value
        saveDataToStorage(target, dataKey, storage)
        return true
      },
      deleteProperty: function(target: SD, p: keyof SD) {
        const result = delete target[p]
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
    set: function(target: SD, p: keyof SD, value: SD[keyof SD]) {
      target[p] = initStorageDataItem(value)
      saveDataToStorage(target, dataKey, storage)
      return true
    },
    deleteProperty: function(target: SD, p: keyof SD) {
      const result = delete target[p]
      saveDataToStorage(target, dataKey, storage)
      return result
    }
  })
}

export default createStorageData
