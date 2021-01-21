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
- 可以拉载数据变更；
- 可以监听存储操作；
- 可以拉载存储操作；
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
## 有效期
你可以给 StorageData 对象 的属性直设置值，这时该值具有无限长的有效期，即永远不会失效，如：
```
sd.name = "郭斌勇";
```

也可以给属性值指定有效期，如：
```
sd.name = {
    maxAge:1000,  //1000毫秒后失效
    value:"郭斌勇"
};
```


## 调整保存频率
## 监听变化和保存
## 拦截变化和保存
## 自定义Storage