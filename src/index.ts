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
 * @param manual 是否是手动触发
 * @param willSaveCB
 * @param savedCB
 * @returns 返回值表示是否保存成功
 */
function saveDataToStorage(data: any, key: string, storage: DataStorage,manual:boolean,willSaveCB:(data:any,manual:boolean)=>any,savedCB?:(data:any)=>void): boolean {
  if(willSaveCB(data,manual)){
    return false;
  }
  storage.setItem(key, JSON.stringify(data));
  savedCB?.(data);
  return true;
}




/**
 * 毫秒
 */
export type Millisecond = number;

/**
 * 时间描述
 * 注意：月分 month 是从 1开始的；即 1表示 1月，2表示 2月，这与 Date 类型的 月分不一样；
 */
export interface DateDescription {
  year?: number;  //年
  month?: number;  //月；**注意：从1开始，并不是从0开始** 
  day?: number;  //日；
  hour?: number;  //时
  minute?: number; //分
  second?: number;  //秒
  millisecond?: number;  //毫秒
}

/**
 * 有效期
 * 如果是 string 类型的值，则必须是能被 Date 所识别的时间字符串格式
 */
export type ExpiresDate = Millisecond | Date | DateDescription | string

/**
 * StorageData 中 带有有效期的 Item
 * 如果 即指定了 maxAge，又指定了 expires，则只要 maxAge 和 expires 中有一个过期（失效），就算失效；
 */
export interface StorageDataExpiresItem<V> {
  maxAge?: ExpiresDate|null;   //可选；默认无限长；有效时长，即多长时间后失效；
  startTime?: ExpiresDate|null;  //可选；默认值：当前时间； 表示开始计时的时间；这个一般不需要指定；
  expires?: ExpiresDate|null;  // 可靠；默认：无限远； 表示失效日期，即到什么时间点后失效；
  value: V;  //必选；要保存的值；
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
  data:SD;  // StorageData 类型的对象，更改它的直接属性会自动保存；
  save():boolean;  //手动触发 data（StorageData对象）保存的方法
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
 * StorageDataOptions
 * - 如果 同时指定了 changeNum 和 delay ，则只要这两个条件任意之一满足，就会执行保存操作
 */
export interface StorageDataOptions<D> {
  noExpires?:boolean;    //可选；默认值：false； 是否禁用有效期功能
  delay?:Millisecond|null;    //可选；默认值：null； 延时保存的毫秒数；用于对保存进行节流的时间； null | undefined | 小于0的值：无效；0：异步立即保存； 大于0的值：延迟保存
  changeNum?:number|null;   //可选； 默认值：1； 表示累计变化多少次时才执行保存； null | undefined | 小于1的值：都作为 1 来对待；
  willChange?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>any; //在Item变更前触发；返回真值，表示停止变更，会取消本次更改，返回假值，表示继续变更；
  changed?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>void;   //在Item变更后触发；
  willSave?:(data:D,manual:boolean)=>any;   //在将数据保存到DataStorage前时触发；manual 表示本次保存操作是否是手动触发的，即：不是自动触发的；返回真值，表示停止保存，会取消本次保存操作，返回假值，表示继续保存；
  saved?:(data:D)=>void;   //在将数据保存到DataStorage后触发
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
 * 创建 会自动将自己保存到  storage （如：localStorage、sessionStorage，或自定的 storage）的数据对象，并且可以给数据对象的属性值设置有效期，如果过了有效期，则该属性会返回 undefined，并且会自动删除该属性
 * @param storage : DataStorage  指定要保存到哪个 storage 对象中
 * @param dataKey : string  指定保存在 storage 中的 key
 * @param options : StorageDataOptions 配置选项
 * @param withSave : boolean   是否返回带有 save 方法的 StorageDataObject 类型的对象，StorageDataObject 对象的 save 方法可用于手动触发保存操作；
 * @returns 返回的一个会自动保存自己的数据对象
 *    - 如果指定 noExpires 为 true ：返回 D 类型的数据对象，该对象不具备有效期功能；
 *    - 如果指定 noExpires 为 false ：返回 StorageData<D> 类型的数据对象，该对象具备有效期功能；
 *    - 如果指定 withSave 为 true ：会返回 StorageDataObject 类型的对象，该对象的 data 属性是 StorageData<D> 或 D 类型的值，当更改该值的属性时，它会自动保存自己；该对象的 save 方法用于立即保存该对象的 data
 * 当你更新 StorageData<D> 或 D 类型的对象的属性时，它会自动将该对象保存到 指定的 storage 中；如果没有将 noExpires 设置为 true，则也可以给该对象的属性设置有效期，如果过了有效期，则该属性会返回 undefined，并且会自动删除该属性
 */
export function createStorageData<D = any>(storage: DataStorage , dataKey: string, options:StorageDataOptionsOfNoExpires<D>): D
export function createStorageData<D = any>(storage: DataStorage , dataKey: string, options?:StorageDataOptions<D>): StorageData<D>
export function createStorageData<D = any>(storage: DataStorage , dataKey: string, options:StorageDataOptionsOfNoExpires<D>, withSave:true): StorageDataObject<D>
export function createStorageData<D = any>(storage: DataStorage , dataKey: string, options:StorageDataOptionsOfNoExpires<D>, withSave?:false): D
export function createStorageData<D = any>(storage: DataStorage , dataKey: string, options:StorageDataOptions<D>|undefined|null, withSave:true): StorageDataObject<StorageData<D>>
export function createStorageData<D = any>(storage: DataStorage , dataKey: string, options:StorageDataOptions<D>|undefined|null, withSave?:false): StorageData<D>
export function createStorageData<D = any>(storage: DataStorage , dataKey: string, options?:StorageDataOptions<D>|null,withSave?:boolean): StorageData<D>|StorageDataObject<StorageData<D>>
export function createStorageData<Opt extends StorageDataOptions<D> ,D = any>(storage: DataStorage, dataKey: string, options?:Opt|null,withSave?:boolean) {
  // 变化计数
  let changeCount = 0;
  let timeoutID: NodeJS.Timeout | null = null;
  const {noExpires,delay,changeNum,willChange,changed,willSave,saved } = options || {};
  const willChangeCB = willChange as (key:any,newValue:any,oldValue:any,data:any)=>any || function(){};
  const willSaveCB = willSave as (data:any,manual:boolean)=>any || function(){};
  // 变更数目保存，返回值表示保存条件是否成立
  // changeNum as number > 1  是取巧的设计，不需要检验 changeNum 为 null 或 undefined
  const changeNumSaveData = changeNum as number > 1 ? function(data: any){
    // changeNum as number > changeCount  是取巧的设计，不需要检验 changeNum 为 null 或 undefined
    if (changeNum as number > changeCount){
      return false
    }
    saveDataToStorage(data,dataKey,storage,false,willSaveCB,saved);
    return true
  } : function(data: any){
    saveDataToStorage(data,dataKey,storage,false,willSaveCB,saved);
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
        saveDataToStorage(data,dataKey,storage,false,willSaveCB,saved);
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
  const dataChange = function(key:any,newValue:any,oldValue:any,data:any){
    changeCount++;
    changed?.(key as keyof D,newValue,oldValue,data);
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

  if(!(data && typeof data === "object")){
    data = {} as SD
  }

  let storageData!:SD;
  if (noExpires) {
    storageData = new Proxy(data as SD, {
      set: function(target: SD, p: keyof SD, value: SD[keyof SD]) {
        const oldValue = target[p];
        if (willChangeCB(p,value,oldValue,target)){
          return false;
        }
        target[p] = value
        dataChange(p,value,oldValue,target);
        return true
      },
      deleteProperty: function(target: SD, p: keyof SD) {
        const oldValue = target[p];
        if (willChangeCB(p,undefined,oldValue,target)){
          return false;
        }
        const result = delete target[p]
        dataChange(p,undefined,oldValue,target);
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
        if (willChangeCB(p,value,oldValue,target)){
          return false;
        }
        target[p] = initStorageDataItem(value)
        dataChange(p,value,oldValue,target);
        return true
      },
      deleteProperty: function(target: SD, p: keyof SD) {
        const oldValue = target[p];
        if (willChangeCB(p,undefined,oldValue,target)){
          return false;
        }
        const result = delete target[p]
        dataChange(p,undefined,oldValue,target);
        return result
      }
    });
  }

  return withSave ? {data:storageData,save:function(){
    return saveDataToStorage(data,dataKey,storage,true,willSaveCB,saved);
  }} : storageData;
}

export default createStorageData
