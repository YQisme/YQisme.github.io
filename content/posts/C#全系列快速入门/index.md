---
title: "C#全系列快速入门"
date: 2026-08-25
lastmod: 2026-08-25
draft: false
tags: ["C#", ".NET", "ASP.NET Core", "Visual Studio", "教程"]
categories: ["技术", "教程"]
---

# C#、.NET 、 ASP.NET Core、Visual Studio全系列快速入门

## 基本概念

```
C#
 ↓
编程语⾔

.NET
 ↓
C#程序运⾏所依赖的平台/框架

ASP.NET Core
 ↓
使⽤.NET 开发Web/API 后端的框架

Visual Studio
 ↓
开发、编译、调试C#/.NET 项⽬的IDE
```

⽐如⼀个项⽬：

```
MyProject
│
├── MyProject.sln
│
├── MyProject.Api
│   ├── Controllers
│   ├── Services
│   ├── Models
│   ├── Program.cs
│   └── appsettings.json
│
├── MyProject.Core
│
├── MyProject.
│
└── MyProject.Tests
```

通常： 

+ .sln ：整个解决⽅案 
+ .csproj ：⼀个具体项⽬ 
+ .cs ： C# 代码 
+ Controller ：接收 HTTP  请求 
+ Service ：业务逻辑 
+ Repository ：数据库操作 
+ Model/DTO ：数据对象 
+ Program.cs ：程序启动和服务配置 
+ appsettings.json ：配置⽂件

### 设计模式

典型的三层架构（或更多层架构）的设计模式，通常用于构建复杂的应用程序。每一层都有其特定的职责，下面是对每一层的详细解释：

#### 前端

前端是用户与应用程序交互的部分。它包括客户端代码，如HTML、CSS和JavaScript。前端主要负责展示给用户的内容和收集用户的输入。

#### HTTP 请求

HTTP 请求是前端与后端之间通信的基础。前端通过发送HTTP请求（如GET、POST、PUT、DELETE等）与后端进行交互，获取或发送数据。

#### Controller

Controller（控制器）是中间层，主要负责处理前端的HTTP请求，并调用相应的Service进行业务逻辑处理。Controller接收前端发送的数据，处理业务逻辑后，再将结果返回给前端。

#### Service

Service（服务）层包含业务逻辑。它负责处理业务规则和复杂操作，不直接与前端交互，而是通过Controller与前端交互。Service通常处理数据验证、业务规则执行、数据转换等工作。

#### Repository

Repository（仓库）层负责与数据持久层进行交互。它提供了对数据库操作的抽象，如CRUD（创建、读取、更新、删除）操作。Repository通常封装了与数据库的具体交互细节，使得Service可以专注于业务逻辑。

#### 数据库

数据库是数据的持久存储层。它存储应用需要处理的数据，并通过Repository层与应用交互。常见的数据库类型包括关系型数据库（如MySQL、PostgreSQL、SQL Server）和非关系型数据库（如MongoDB、Cassandra）。

#### 示例流程

假设你有一个简单的在线购物系统，用户在前端进行操作，数据通过HTTP请求发送到后端。以下是具体的流程：

1. 前端：
   - 用户在前端界面输入商品信息，提交表单。
   - 前端发送HTTP POST请求到后端。
2. HTTP 请求：
   - 前端发送的数据通过HTTP POST请求发送到后端。
3. Controller：
   - Controller接收HTTP请求。
   - Controller调用相应的Service进行业务逻辑处理，如验证输入、查询商品库存等。
4. Service：
   - Service处理业务逻辑，如检查库存是否充足、计算总价等。
   - Service调用Repository执行数据库操作。
5. Repository：
   - Repository与数据库交互，执行CRUD操作，如查询库存、更新库存等。
6. 数据库：
   - 数据库根据Repository的请求进行相应的数据操作，如读取库存信息、更新库存等。

#### 总结

通过这种分层架构，可以更好地分离关注点，使得代码更加模块化、易于测试和维护。每一层都有明确的职责，使得整个系统的结构更加清晰和高效。

## Visual Studio

### 使用 Visual Studio 看项目

 最应该优先掌握的东⻄。 

打开： `xxx.sln`后，Visual Studio  左边⼀般会看到：

```
解决⽅案│
├── 项⽬A
│   ├── Dependencies
│   ├── Controllers
│   ├── Services
│   ├── Models
│   ├── Properties
│   ├── Program.cs
│   └── appsettings.json
│
├── 项⽬B
│
└── 项⽬C
```

  先不要急着看代码，第⼀件事情： 找到启动项⽬。 

通常项⽬名称类似： 

```
xxx.Api
xxx.Web
xxx.Server
xxx.Host
```

右键： `设为启动项⽬` 然后按： `F5`或者： `Ctrl + F5` 运⾏。

### Visual Studio  最重要的⼏个按钮 

调试代码，最常⽤的其实就这些：

### 调试

#### 追踪函数

⽐如：

```c#
public IActionResult GetDevice(int id)
{
    var device = deviceService.GetDevice(id);
    return Ok(device);
}
```

其中deviceService.GetDevice(id)  到底去了哪⾥？ 

⿏标放在： GetDevice 上⾯。 然后： F12 就可以进⼊：

```c#
public Device GetDevice(int id)
{
    ...
}
```

然后继续往⾥⾯追。

---

如果在这⼀⾏：

```c#
var device = deviceService.GetDevice(id);
```

按：`F9` 出现红点。 然后`F5`，运⾏程序。 当程序执⾏到这⾥，这时候你可以看到： id = 1001 以及： deviceService ⾥⾯到底是什么。 然后按： `F11`进⼊： GetDevice() ,于是就开始真正 “ 跟踪程序 ” 。

#### 调用堆栈

当断点停住以后，找到：

```
调⽤堆栈
Call Stack
```

可能看到：

```
DeviceController.Get()
DeviceService.GetDevice()
DeviceRepository.Get()
DbContext...
```

这实际上就是： 谁调⽤了谁 

例如：

```
Controller
   ↓
Service
   ↓
Repository
   ↓
EF Core
   ↓
Database
```

#### 监视变量

断点停住以后，可以看：

`局部变量Locals`或者`监视Watch` 

例如：  var device = GetDevice(id); 你可以把： device 添加到 Watch 。 

然后观察： 

```
device.Id
device.Name
device.Status
```

甚⾄可以直接输⼊： device.Name 查看结果。

#### 追踪异常

⽐如程序报： NullReferenceException 不要直接去猜。 看：

```
异常位置 
↓
哪⼀⾏ 
↓
Call Stack
 ↓
是谁调⽤过来的
```

例如：

```
NullReferenceException
    DeviceService.cs: 第125⾏
```

双击：

DeviceService.cs:125直接跳到：device.Name。然后检查： device == null ? 这就是最基本的调试流程。

##  ASP.NET Core

### 依赖注入（ Dependency Injection ， DI ）

通常还会在： `Program.cs` 看到：

```c#
builder.Services.AddScoped<IDeviceService, DeviceService>();
```

它实际上是在告诉 ASP.NET Core ：

```
需要IDeviceService
        ↓
给你DeviceService
```

所以

```c#
DeviceController
       ↓
需要 IDeviceService
       ↓
ASP.NET Core⾃动提供       
       ↓
DeviceService
```

通过 `AddScoped` 方法，`DeviceService` 被注册为 `IDeviceService` 接口的实现

### Program.cs 

打开： `Program.cs` 

可能看到：

```c#
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddScoped<IDeviceService, DeviceService>();
builder.Services.AddDbContext<AppDbContext>();
var app = builder.Build();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

这是

```
Program.cs
    ↓
程序启动    
   ↓
注册各种服务    
   ↓
配置数据库    
   ↓
配置中间件    
   ↓
注册Controller
    ↓
启动Web服务器
```

### 特定的服务或功能的抽象接口

在 ASP.NET Core 中，`I` 开头的接口表示特定的服务或功能的抽象接口。这些接口通常用于依赖注入，使得代码更加模块化和易于测试。

```
IDeviceService.cs
       ↓
DeviceService.cs
```

例如：

```c#
public interface IDeviceService
{
    Device GetDevice(int id);
}
```

实际实现：

```c#
public class DeviceService : IDeviceService
{
    public Device GetDevice(int id)
    {
        ...
    }
}
```

可以把： `Ixxx` 简单理解成： “ 规定这个类应该有哪些功能。 ” ⽽： `xxxService`是： “ 真正实现这些功能。 ” 所以以后看到`IDeviceService`按： `F12` 或者： `Shift + F12` 去找它的实现和引⽤。

## C#

现在先搞懂这些：

①类

类是面向对象编程中的基本概念之一，它是一种自定义的数据类型，用于封装数据和操作这些数据的方法。类可以包含属性、方法、构造函数、事件等成员。

```c#
public class Device
{
public int Id { get; set; }
public string Name { get; set; }
}
```

②⽅法

方法是实现类功能的函数。它定义了类的行为，可以接受参数，返回值，或者执行某些特定的操作。

```
public Device GetDevice(int id)
{
return ...
}
```

③属性

属性是类中用于访问字段的一种方式。它提供了对字段的封装，可以设置和获取字段的值，并且可以进行复杂的逻辑检查和处理。

```c#
public string Name { get; set; }
```

④接口

接口是一种定义类必须实现的方法和属性的蓝图。接口中定义的方法和属性没有具体实现，只有具体的类或结构体才能实现这些方法和属性。

```c#
public interface IDeviceService
{
Device GetDevice(int id);
}
```

⑤ async / await

`async` 和 `await` 是用于异步编程的关键字，主要用于处理长时间运行的操作，避免阻塞主线程。`async` 用于方法声明，表示该方法是异步的；`await` 用于调用异步方法，等待其完成。

```c#
public async Task<Device> GetDeviceAsync(int id)
{
var device = await repository.GetAsync(id);
return device;
}
```

先简单理解：

```
async
↓
这个⽅法涉及异步操作
await
↓
等待异步操作完成
```

⑥ LINQ

LINQ（Language Integrated Query）是 Microsoft .NET 框架中提供的一种强大的查询功能，它允许开发者使用类似 SQL 的语法在 .NET 对象上进行查询。LINQ 可以用于集合、数据库、XML、LINQ to SQL 等多种数据源，提供了一种统一的查询语言。

**LINQ 的主要功能**

1. 查询集合：可以在数组、列表、字典等集合上执行查询。
2. 查询数据库：可以查询 SQL 数据库，如 SQL Server、SQLite 等。
3. 查询 XML：可以查询和操作 XML 文档。
4. 统一的查询语法：提供了一种统一的查询语法，使得不同数据源的查询可以使用相同的语法和方法。

例如：

```c#
var result = devices
     .Where(x => x.IsActive)
     .OrderBy(x => x.Name)
      .ToList();
```

先掌握：

```c#
here
Select
OrderBy
FirstOrDefault
Any
Count
ToList
```

