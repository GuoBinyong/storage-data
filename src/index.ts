export interface DataStorage {
  /**
   * 获取 与指定 key 相关联的值；
   */
  getItem(key: string): string | null
  /**
   * 设置 指定 key 与 指定的 value 相关
   */
  setItem(key: string, value: string): void
}





/**
 * 将数据保存到指定的 storage 中的指定 key 下
 * @param data
 * @param key
 * @param storage
 */
function saveDataToStorage(data: any, key: string, storage: DataStorage,savedCB?:(data:any)=>void): void {
  storage.setItem(key, JSON.stringify(data));
  savedCB?.(data);
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
  maxAge?: ExpiresDate|null
  startTime?: ExpiresDate|null
  expires?: ExpiresDate|null
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
 * 之所以要包含 undefined 是因为当获取 item 的值时，如果值过期了，则会返回 undefined
 */
export type StorageDataItem<V> = V | StorageDataExpiresItem<V> | undefined



export type StorageData<D> = {
  [P in keyof D]: StorageDataItem<D[P]>
}

/**
 * 带有 StorageData 相关成员的 对象
 */
export interface StorageDataObject<SD> {
  data:SD
  save():void;
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

  if ((maxAge && startTime) != undefined) {
    const maxAgeDate = parseExpiresDate(maxAge as ExpiresDate)
    const startTimeDate = parseExpiresDate(startTime as ExpiresDate)

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
 * 
 */
export interface StorageDataOptions<D> {
  noExpires?:boolean;    //可选；默认值：false； 是否禁用有效期功能
  delay?:Millisecond|null;    //可选；默认值：null； 延时保存的毫秒数；用于对保存进行节流的时间； null | undefined | 小于0的值：无效；0：异步立即保存； 大于0的值：延迟保存
  changeNum?:number|null;   //可选； 默认值：1； 表示累计变化多少次时才执行保存； null | undefined | 小于1的值：都作为 1 来对待；
  changed?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key])=>void;   //当Item变更时会触发；
  saved?:(data:D)=>void;   //当要将数据保存到DataStorage中时触发
}

/**
 * 禁用有效期的 StorageDataOptions
 * noExpires为 true 的 StorageDataOptions
 */
type StorageDataOptionsOfNoExpires<D> = Omit<StorageDataOptions<D>,"noExpires"> & {noExpires:true}


/**
 * 使用有效期的 StorageDataOptions
 * noExpires为 false 或 没设置 的 StorageDataOptions
 */
// type StorageDataOptionsOfHaveExpires<D> = Omit<StorageDataOptions<D>,"noExpires"> & {noExpires?:false}


/**
 * 创建 会自动将自己保存到  Storage （如：localStorage、sessionStorage，或自定的 Storage）的数据对象，并且可以给数据对象的属性值设置有效期，如果过了有效期，则该属性会返回 undefined，并且会自动删除该属性
 * @param dataKey : string  指定保存在 Storage 中的 key
 * @param storage : DataStorage  指定要保存到哪个 Storage 对象中
 * @param options : StorageDataOptions 配置选项
 * @param withSave : boolean   是否返回带有 save 方法的 StorageDataObject 类型的对象，StorageDataObject 对象的 save 方法可用于手动触发保存操作；
 * @returns 返回的一个会自动保存自己的数据对象
 *    - 如果指定 noExpires 为 true ：返回 D 类型的数据对象，该对象不具备有效期功能；
 *    - 如果指定 noExpires 为 false ：返回 StorageData<D> 类型的数据对象，该对象具备有效期功能；
 *    - 如果指定 withSave 为 true ：会返回 StorageDataObject 类型的对象，该对象的 data 属性是 StorageData<D> 或 D 类型的值，当更改该值的属性时，它会自动保存自己；该对象的 save 方法用于立即保存该对象的 data
 * 当你更新 StorageData<D> 或 D 类型的对象的属性时，它会自动将该对象保存到 指定的 storage 中；如果没有将 noExpires 设置为 true，则也可以给该对象的属性设置有效期，如果过了有效期，则该属性会返回 undefined，并且会自动删除该属性
 */
export function createStorageData<D extends object>(dataKey: string, storage: DataStorage , options:StorageDataOptionsOfNoExpires<D>): D
export function createStorageData<D extends object>(dataKey: string, storage: DataStorage , options?:StorageDataOptions<D>): StorageData<D>
export function createStorageData<D extends object>(dataKey: string, storage: DataStorage , options:StorageDataOptionsOfNoExpires<D>, withSave:true): StorageDataObject<D>
export function createStorageData<D extends object>(dataKey: string, storage: DataStorage , options:StorageDataOptionsOfNoExpires<D>, withSave?:false): D
export function createStorageData<D extends object>(dataKey: string, storage: DataStorage , options:StorageDataOptions<D>|undefined|null, withSave:true): StorageDataObject<StorageData<D>>
export function createStorageData<D extends object>(dataKey: string, storage: DataStorage , options:StorageDataOptions<D>|undefined|null, withSave?:false): StorageData<D>
export function createStorageData<D extends object>(dataKey: string, storage: DataStorage , options?:StorageDataOptions<D>|null,withSave?:boolean): StorageData<D>|StorageDataObject<StorageData<D>>
export function createStorageData<D extends object,Opt extends StorageDataOptions<D> >(dataKey: string, storage: DataStorage ,  options?:Opt|null,withSave?:boolean) {
  // 变化计数
  let changeCount = 0;
  let timeoutID: NodeJS.Timeout | null = null;
  const {noExpires,delay,changeNum,changed,saved } = options || {};

  // 变更数目保存
  // changeNum as number > 1  是取巧的设计，不需要检验 changeNum 为 null 或 undefined
  const changeNumSaveData = changeNum as number > 1 ? function(data: any){
    // changeNum as number > changeCount  是取巧的设计，不需要检验 changeNum 为 null 或 undefined
    if (changeNum as number > changeCount){
      return false
    }
    saveDataToStorage(data,dataKey,storage,saved);
    return true
  } : function(data: any){
    saveDataToStorage(data,dataKey,storage,saved);
    return true
  };



  /**
   * 保存 data 到 storage
   */
  let saveData = changeNumSaveData as (data: any)=>void;

  // delay as number >= 0  是取巧的设计，不需要检验 delay 为 null 或 undefined
  if (delay as number >= 0){
    // 延时保存； 返回值表示是符合执行条件
    const delaySaveData = function(data: any){
      if (timeoutID){
        clearTimeout(timeoutID);
      }
      timeoutID = setTimeout(function(){
        saveDataToStorage(data,dataKey,storage,saved);
      },delay as number);
    };

    saveData = function(data: any){
      if(changeNumSaveData(data)){
        if (timeoutID){
          clearTimeout(timeoutID);
        }
        return
      }
      delaySaveData(data);
    }
  }



  // 负责数据改变后的保存 和 回调逻辑
  const dataChange = function(data:any,key:any,newValue:any,oldValue:any){
    changeCount++;
    changed?.(key as keyof D,newValue,oldValue);
    saveData(data);
  }

  type SD = StorageData<D>


  const dataJSON = storage.getItem(dataKey)

  let data!: SD;
  if (dataJSON) {
    try {
      data = JSON.parse(dataJSON)
    } catch (e) {
      data = {} as SD
    }
  }

  let storageData!:SD;
  if (noExpires) {
    type SD = D
    storageData = new Proxy(data as SD, {
      set: function(target: SD, p: keyof SD, value: SD[keyof SD]) {
        const oldValue = target[p];
        target[p] = value
        dataChange(target,p,value,oldValue);
        return true
      },
      deleteProperty: function(target: SD, p: keyof SD) {
        const oldValue = target[p];
        const result = delete target[p]
        dataChange(target,p,undefined,oldValue);
        return result
      }
    });
  }else {
    storageData = new Proxy(data, {
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
        const oldValue = target[p];
        target[p] = initStorageDataItem(value)
        dataChange(target,p,value,oldValue);
        return true
      },
      deleteProperty: function(target: SD, p: keyof SD) {
        const oldValue = target[p];
        const result = delete target[p]
        dataChange(target,p,undefined,oldValue);
        return result
      }
    });
  }

  return withSave ? {data:storageData,save:function(){
    saveDataToStorage(data,dataKey,storage,saved);
  }} : storageData;
}

export default createStorageData
