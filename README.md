# 背景
项目中，经常有持久化（存储）数据的需要，在前端中，常用的方案就是 Storage（如：localStorage、sessionStorage） 和 cookie；然后它们各有优缺点，如：

**Storage**（相对 cookie 而言）  
**优点：**  
- 易保存 和 获取；
- 存储容量大；

**缺点：**  
- 不支持设置有效期

**cookie**（相对 Storage 而言）  
**缺点：**  
- 保存 和 获取的操作太麻烦；
- 存储容量小；

**优点：** 
- 支持设置有效期；

为了前端世界不再那么令人纠结，于是 **StorageData** 诞生了！！！


# 简介
StorageData 是一个用于自动存储数据，并且可以指定数据有效期的工具；它更像是 cookie 和 Storage（如：localStorage、sessionStorage）的结合；

**具有以下特性：**  
- 在程序中以普通对像的方式操作数据；_（易操作）_
- 数据被修改后，会自动存储到指定的 Storage（如：localStorage、sessionStorage）中；_（存储容量大）_
- 可以给数据指定有效期，如：指定多长时间后失效 或 指定到某一具体日期后失效；_（支持有效期）_
- 可对保存做节流设置；
- 可以监听数据更改；
- 可以拦截数据变更；
- 可以监听存储操作；
- 可以拦截存储操作；
- 兼容 浏览器 与 node；



# 教程

## 基本使用（自动保存）
1. 创建 StorageData 对象
   ```
   const sd = createStorageData("logInfo",localStorage);
   ```
2. 往 StorageData 对象上添加或设置属性；你只管设置属性即可，它会自动将数据 保存到你指定的 storage（本例指定的是 localStorage） 中；
   ```
   sd.name = "郭斌勇";
   sd.email = "guobinyong@qq.com";
   ```

StorageData 对象会在它的直接属性变动后自动保存到指定的 Storage（如：localStorage、sessionStorage 或者自定义的实现了 DataStorage 接口的 Storage）中，_注意：它只会监测 StorageData 对象 的直接属性的变更，不会监测 StorageData 对象 的属性的属性的变更；_

### 类型约束
`createStorageData()` 是个泛型函数，如果你在 TypeScript 中使用，你也可以给它传递一个泛型参数 `createStorageData<D>()`，用于描述 StorageData 对象的格式；
比如：
```
const sd = createStorageData<{name:string,email:string}>("logInfo",localStorage,{noExpires:true});
```
当你给 `sd` 设置不符合类型描述的值时，语法提示就会报错，如：
```
sd.name = 34;  // 不能将类型“34”分配给类型“StorageDataItem<string>”。ts(2322)

sd.email = {
    maxAge:1000,
    value:true   //不能将类型“boolean”分配给类型“string”。ts(2322)
};
```

### 语法
```
function createStorageData<D = any>(dataKey: string, storage: DataStorage , options?:StorageDataOptions<D>|null,withSave?:boolean): StorageData<D>|StorageDataObject<StorageData<D>>
```
- @param dataKey : string  指定保存在 Storage 中的 key
- @param storage : DataStorage  指定要保存到哪个 Storage 对象中
- @param options : StorageDataOptions 配置选项
- @param withSave : boolean   是否返回带有 save 方法的 StorageDataObject 类型的对象，StorageDataObject 对象的 save 方法可用于手动触发保存操作；
- @returns 返回的一个会自动保存自己的数据对象
   + 如果指定 noExpires 为 true ：返回 D 类型的数据对象，该对象不具备有效期功能；
   + 如果指定 noExpires 为 false ：返回 StorageData<D> 类型的数据对象，该对象具备有效期功能；
   + 如果指定 withSave 为 true ：会返回 StorageDataObject 类型的对象，该对象的 data 属性是 StorageData<D> 或 D 类型的值，当更改该值的属性时，它会自动保存自己；该对象的 save 方法用于立即保存该对象的 data


StorageDataOptions 类型定义如下
```
export interface StorageDataOptions<D> {
  noExpires?:boolean;    //可选；默认值：false； 是否禁用有效期功能
  delay?:Millisecond|null;    //可选；默认值：null； 延时保存的毫秒数；用于对保存进行节流的时间； null | undefined | 小于0的值：无效；0：异步立即保存； 大于0的值：延迟保存
  changeNum?:number|null;   //可选； 默认值：1； 表示累计变化多少次时才执行保存； null | undefined | 小于1的值：都作为 1 来对待；
  willChange?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>any; //在Item变更前触发；返回真值，表示停止变更，会取消本次更改，返回假值，表示继续变更；
  changed?:<Key extends keyof D>(key:Key,newValue:D[Key],oldValue:D[Key],data:D)=>void;   //在Item变更后触发；
  willSave?:(data:D,manual:boolean)=>any;   //在将数据保存到DataStorage前时触发；manual 表示本次保存操作是否是手动触发的，即：不是自动触发的；返回真值，表示停止保存，会取消本次保存操作，返回假值，表示继续保存；
  saved?:(data:D)=>void;   //在将数据保存到DataStorage后触发
}
```


## 有效期
你可以给 StorageData 对象 的属性直接设置值，这时该值具有无限长的有效期，即永远不会失效，如：
```
sd.name = "郭斌勇";
```

也可以给属性值指定有效期，如：
```
sd.name = {
    maxAge:1000,  //1000毫秒后失效
    value:"郭斌勇"
};

sd.email = {
    expires:{
        year:2021, //年
        month:1,  //月
        day:20, //日
        hour:13, //时
        minute:58, //分
        second:20, //稍
        millisecond:555  //毫秒
    },  //指定 到 2021年1月20日，13时，58分，20秒，555毫秒 时失效
    value:"guobinyong@qq.com"
};
```

你可以直接获取数据，如：
```
console.log(sd.email) 
```
- 如果没有过期，则会输出 `"guobinyong@qq.com"`；
- 如果已过期，则会输出 `undefined`

### 描述时间的方式

在 StorageData 中，可以给 `maxAge`、`expires`、`startTime` 这几个参数指定以下几种类型之一：
- number：会作为时间戳 或 毫秒数来对待
- Date：Date 日期对象
- DateDescription：日期描述对象，如下：
   ```
   {
     year?: number;  //年
     month?: number;  //月；**注意：从1开始，并不是从0开始** 
     day?: number;  //日；
     hour?: number;  //时
     minute?: number; //分
     second?: number;  //秒
     millisecond?: number;  //毫秒
   }
   ```
- string：必须是能被 Date 所识别的时间字符串格式

### 时间点与时长
这些类型所描述的时间 可能是表示 时间点，也可能表示时长，具体如下：
- 当将这些类型的值指定给 `maxAge` 字段时，这些值所表示的时间会被作为时长来对待，如：`{year:2021,month:1,day:20}` 表示 `2021个年+1个月+20天`这么长时间后失效；
- 当将这些类型的值指定给 `expires` （或 `startTime`） 字段时，这些值所表示的时间会被作为时间点来对待，如：`{year:2021,month:1,day:20}` 表示将在 `2021年1月20日`后失效；


### 禁用有效期
如果你不需要用 StorageData 的有效期功能，或者想类似下面的值作普通值来对待：
```
sd.name = {
    maxAge:1000,
    value:"郭斌勇"
};
```
你可以在创建 StorageData 对象时给 `createStorageData` 传一个带有 `noExpires`属性且值为 `true` 的对象，如下：
```
const sd = createStorageData("logInfo",localStorage,{noExpires:true});
```
这样创建出来的 `sd` 对象就不带有效期的功能，对于下面的代码：
```
sd.name = {
    maxAge:1000,
    value:"郭斌勇"
};
console.log(sd.name)
```
就会输出：
```
{
   maxAge:1000,
   value:"郭斌勇"
}
```

## 调整保存频率
默认情况下，StorageData 对象会在每次改变其直接属性后立即触发保存操作，将数据保存到指定的 Storage 中，如果你经常需要频繁地操作数据，你可以通过给 `createStorageData`方法传递 `delay` 或 `changeNum` 选项 来实现对保存操作做节流，如
：`createStorageData("logInfo",localStorage,{delay:1000,changeNum:5})`；
- `delay?:Millisecond|null`  可选；默认值：`null`； 延时保存的毫秒数；用于对保存进行节流的时间； `null | undefined | 小于0的值`：无效； `0`：异步立即保存； `大于0的值`：延迟保存
- `changeNum?:number|null`   可选； 默认值：`1`； 表示累计变化多少次时才执行保存； `null | undefined | 小于1的值`：都作为 1 来对待；

如果 同时指定了 changeNum 和 delay ，则只要这两个条件任意之一满足，就会执行保存操作；


### 手动保存
当你对保存做了节流之后，你可能需要在适当的时机（比如：你页面被销毁时）手动保存，用以确保最近的更改的数据被保存下来；想要使用手动保存，你需要给 `createStorageData` 方法传递 `withSave` 参数（第4个参数）并且设置为 `true`，如下：
```
const sd = createStorageData("logInfo",localStorage,{delay:1000,changeNum:5},true);
sd.data.name = "郭斌勇";  //更改属性值
sd.save(); //手动保存
```
当你将 `createStorageData` 方法的 `withSave` 参数（第4个参数）设置为 `true` 时，`createStorageData` 就会返回一个 `StorageDataObject` 类型的对象，该类型的定义如下：
```
interface StorageDataObject<SD> {
  data:SD;  // StorageData 类型的对象，更改它的直接属性会自动保存；
  save():boolean;  //手动触发 data（StorageData对象）保存的方法
}
```



## 监听变化和保存
## 拦截变化和保存
## 自定义Storage