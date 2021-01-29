[教程]: ./doc/教程.md
[API接口文档]: ./doc/API.md

[GitHub仓库]: https://github.com/GuoBinyong/storage-data
[发行地址]: https://github.com/GuoBinyong/storage-data/releases
[issues]: https://github.com/GuoBinyong/storage-data/issues

[码云仓库]: https://gitee.com/guobinyong/storage-data



目录
=========

<!-- TOC -->

- [1. 背景](#1-背景)
- [2. 简介](#2-简介)
- [3. 安装方式](#3-安装方式)
    - [3.1. 方式1：通过 npm 安装](#31-方式1通过-npm-安装)
    - [3.2. 方式2：直接下载原代码](#32-方式2直接下载原代码)
    - [3.3. 方式3：通过`<script>`标签引入](#33-方式3通过script标签引入)
- [4. 教程](#4-教程)
- [5. API接口文档](#5-api接口文档)

<!-- /TOC -->


内容
=====



# 1. 背景
项目中，经常有持久化（存储）数据的需要，在前端中，常用的方案就是 Storage（如：localStorage、sessionStorage） 和 cookie；然后它们各有优缺点，如：

**Storage**（相对 cookie 而言）  
+ 优点： 
   - 易保存 和 获取；
   - 存储容量大；

+ 缺点：
   - 不支持设置有效期

**cookie**（相对 Storage 而言）  
+ 缺点：
   - 保存 和 获取的操作太麻烦；
   - 存储容量小；

+ 优点：
   - 支持设置有效期；

为了前端世界不再那么令人纠结，于是 **StorageData** 诞生了！！！




# 2. 简介
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

**详情请看：**  
- 主页：<https://github.com/GuoBinyong/storage-data>
- [GitHub仓库][]
- [码云仓库][]
- [教程][]
- [API接口文档][]


**如果您在使用的过程中遇到了问题，或者有好的建议和想法，您都可以通过以下方式联系我，期待与您的交流：**
- 给该仓库提交 [issues][]
- 给我 Pull requests
- 邮箱：<guobinyong@qq.com>
- QQ：guobinyong@qq.com
- 微信：keyanzhe





# 3. 安装方式
目前，安装方式有以下几种：


## 3.1. 方式1：通过 npm 安装
```
npm install --save-prod storage-data
```

## 3.2. 方式2：直接下载原代码
您可直接从项目的 [发行地址][] 下载 源码 或 构建后包文件；

您可以直接把 源码 或 构建后 的包拷贝到您的项目中去；然后使用如下代码在您的项目中引入 `StorageData`：
```
import { createStorageData } from "path/to/package/storage-data";
```
或者
```
import createStorageData from "path/to/package/storage-data";
```



## 3.3. 方式3：通过`<script>`标签引入
您可直接从项目的 [发行地址][] 中下载以 `.iife.js` 作为缀的文件，然后使用如下代码引用 和 使用 storage-data：


1. 引用 storage-data
   ```
   <script src="path/to/package/storage-data.iife.js"></script>
   ```
   
2. 使用全局的 `createStorageData()`
   ```
   <script>
   // 使用全局的 StorageData
       const sd = StorageData.createStorageData(localStorage,"logInfo");
   </script>
   ```

# 4. 教程
详情跳转至[教程][]

# 5. API接口文档
详情跳转至[API接口文档][]



--------------------

> 有您的支持，我会在开源的道路上，越走越远

![赞赏码](https://i.loli.net/2020/04/08/PGsAEqdJCin1oQL.jpg)