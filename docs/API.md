# createStorageData()
`createStorageData()` 函数用来创建 会自动将自己保存到  storage （如：`localStorage`、`sessionStorage`，或自定的 `DataStorage` 类型的对象）的数据对象，并且可以给数据对象的属性值设置有效期，如果过了有效期，则该属性会返回 `undefined`，并且会自动删除该属性；

```
function createStorageData<D = any>(storage: DataStorage, dataKey: string, options?: StorageDataOptions<D> | null, withSave?: boolean): StorageData<D> | StorageDataObject<StorageData<D>>
```

**参数：**  
1. storage : DataStorage  指定要保存到哪个 storage 对象中
2. dataKey : string  指定保存在 storage 中的 key
3. options : StorageDataOptions 配置选项
4. withSave : boolean   是否返回带有 save 方法的 StorageDataObject 类型的对象，StorageDataObject 对象的 save 方法可用于手动触发保存操作；

**返回：**  
返回的一个会自动保存自己的数据对象
- 如果指定 `noExpires` 为 `true` ：返回 `D` 类型的数据对象，该对象不具备有效期功能；
- 如果指定 `noExpires` 为 `false` ：返回 `StorageData<D>` 类型的数据对象，该对象具备有效期功能；
- 如果指定 `withSave` 为 `true` ：会返回 `StorageDataObject` 类型的对象，该对象的 `data` 属性是 `StorageData<D>` 或 `D` 类型的值，当更改该值的属性时，它会自动保存自己；该对象的 `save` 方法用于立即保存该对象的 `data`；

当你更新 `StorageData<D>` 或 `D` 类型的对象的属性时，它会自动将该对象保存到 指定的 `storage` 中；如果没有将 `noExpires` 设置为 `true`，则也可以给该对象的属性设置有效期，如果过了有效期，则该属性会返回 `undefined`，并且会自动删除该属性；





# DataStorage
`DataStorage` 负责将最终序列化后的字符串持久化；
它是一个接口，描述了持久实例应该具备的API，如下：

```
interface DataStorage {
    // 获取 与指定 key 相关联的值；
    getItem(key: string): string | null;
    
    // 设置 指定 key 与 指定的 value 相关
    setItem(key: string, value: string): void;
}
```

浏览器中提供的 Storage 类型的对象（如：`localStorage`、`sessionStorage`）均符合 `DataStorage` 接口的定义；




# StorageDataOptions
`StorageDataOptions` 是传 `createStorageData()` 函数的选项对象的类型；
```
interface StorageDataOptions<D> {
  noExpires?:boolean;    //可选；默认值：false； 是否禁用有效期功能
  delay?:Millisecond|null;    //可选；默认值：null； 延时保存的毫秒数；用于对保存进行节流的时间； null | undefined | 小于0的值：无效；0：异步立即保存； 大于0的值：延迟保存
  changeNum?:number|null;   //可选； 默认值：1； 表示累计变化多少次时才执行保存； null | undefined | 小于1的值：都作为 1 来对待；
  willChange?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>any; //在Item变更前触发；返回真值，表示停止变更，会取消本次更改，返回假值，表示继续变更；
  changed?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>void;   //在Item变更后触发；
  willSave?:(data:D,manual:boolean)=>any;   //在将数据保存到DataStorage前时触发；manual 表示本次保存操作是否是手动触发的，即：不是自动触发的；返回真值，表示停止保存，会取消本次保存操作，返回假值，表示继续保存；
  saved?:(data:D)=>void;   //在将数据保存到DataStorage后触发
}
```
- `noExpires?:boolean`：可选；默认值：`false`； 是否禁用有效期功能
- `delay?:Millisecond|null`：可选；默认值：`null`； 延时保存的毫秒数；用于对保存进行节流的时间； `null | undefined | 小于0的值`：无效； `0`：异步立即保存； `大于0的值`：延迟保存
- `changeNum?:number|null`：可选； 默认值：`1`； 表示累计变化多少次时才执行保存； `null | undefined | 小于1的值`：都作为 `1` 来对待；
- `willChange?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>any`： 在Item变更前触发；返回真值，表示停止变更，会取消本次更改，返回假值，表示继续变更；
- `changed?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>void`：在Item变更后触发；
- `willSave?:(data:D,manual:boolean)=>any`：在将数据保存到 `DataStorage` 前时触发；`manual` 表示本次保存操作是否是手动触发的，即：不是自动触发的；返回真值，表示停止保存，会取消本次保存操作，返回假值，表示继续保存；
- `saved?:(data:D)=>void`：在将数据保存到`DataStorage`后触发


如果 同时指定了 changeNum 和 delay ，则只要这两个条件任意之一满足，就会执行保存操作；


# StorageData
`StorageData` 描述的是一种当属性值变更时会自动存储数据到 storage 中、并且可以指定属性值有效期的对象的类型；
```
type StorageData<D> = {
    [P in keyof D]: StorageDataItem<D[P]>;
};
```


# StorageDataItem
`StorageDataItem` 描述的是存储在 `StorageData` 中的 数据项目；
```
type StorageDataItem<V> = V | StorageDataExpiresItem<V> | undefined;
```
之所以要包含 `undefined` 是因为当获取 数据项目 的值时，如果值过期了，则会返回 `undefined`；




# StorageDataExpiresItem
`StorageDataExpiresItem` 描述的是 `StorageData` 中 带有有效期的数据项目；
```
interface StorageDataExpiresItem<V> {
  maxAge?: ExpiresDate|null;   //可选；默认无限长；有效时长，即多长时间后失效；
  startTime?: ExpiresDate|null;  //可选；默认值：当前时间； 表示开始计时的时间；这个一般不需要指定；
  expires?: ExpiresDate|null;  // 可靠；默认：无限远； 表示失效日期，即到什么时间点后失效；
  value: V;  //必选；要保存的值；
}
```
如果数据项目中 即指定了 `maxAge`，又指定了 `expires`，则只要 `maxAge` 和 `expires` 中有一个过期（失效），就算失效；


StorageDataExpiresItem 的类型守卫是：
```
function isStorageDataExpiresItem(target: any): target is StorageDataExpiresItem<any>
```


# ExpiresDate有效期
```
type ExpiresDate = Millisecond | Date | DateDescription | string
```

**注意：**如果 `ExpiresDate` 是 `string` 类型的值，则必须是能被 `Date()` 所识别的时间字符串格式；



# Millisecond毫秒
`Millisecond` 是表示毫秒的类型，实际是一个 `number` 类型
```
type Millisecond = number;
```

# DateDescription日期描述
`DateDescription` 是用来 描述时间的；
```
interface DateDescription {
  year?: number;  //年
  month?: number;  //月；**注意：从1开始，并不是从0开始** 
  day?: number;  //日；
  hour?: number;  //时
  minute?: number; //分
  second?: number;  //秒
  millisecond?: number;  //毫秒
}
```

注意：月分 `month` 是从 1开始的；即 1表示 1月，2表示 2月，这与 `Date` 类型的 月分不一样；


# StorageDataObject
`StorageDataObject` 描述的是一个API集合，包含带有 `StorageData` 成员 及其 相关操作的API;
```
interface StorageDataObject<SD> {
  data:SD;  // StorageData 类型的对象，更改它的直接属性会自动保存；
  save():boolean;  //手动触发 data（StorageData对象）保存的方法
}
```




# parseStorageDataItem()
解析 `StorageDataItem` 类型的值的有效性
```
function parseStorageDataItem<V extends StorageDataItem<any>>(item: V): ValidityDescription<GetValueFromStorageDataItem<V>>
```



# ValidityDescription有效性描述
`ValidityDescription` 是用来描述值的有效性类型
```
type ValidityDescription<V> = {
    isValid: boolean;
    value: V;
}
```



# GetValueFromStorageDataItem
将 StorageDataItem 类型 转为其值类型
```
type GetValueFromStorageDataItem<SDItem> = SDItem extends StorageDataExpiresItem<any> ? SDItem['value'] : SDItem
```

# parseExpiresDate()
将 ExpiresDate 类型的值解析 为 Date 类型的值
```
function parseExpiresDate(expiresDate: ExpiresDate): Date
```