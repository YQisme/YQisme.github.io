---
title: "MySQL 时序数据优化"
date: 2026-08-06
lastmod: 2026-08-06
draft: false
tags: ["MySQL", "数据库优化", "时序数据", "索引", "分区", "性能优化", "物联网"]
categories: ["技术", "教程"]
---

# 背景

项目刚开始数据库选型错了，采用了MySQL来保存时序数据，在不改动前后端源码的情况下，尽量采用“插件”的方式优化。

---

假设传感器表：

```
CREATE TABLE sensor_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id INT,
    channel INT,
    value DOUBLE,
    peak DOUBLE,
    create_time DATETIME(3)
);
```

数据：

```
设备1
每秒采集一次
每天约86400条
一年约3153万条
```

------

# 一、增加索引（优先级最高）

## 1.1 判断当前索引

先看：

```
SHOW INDEX FROM sensor_data;
```

例如：

```
Key_name        Column_name
PRIMARY         id
```

只有主键，没有时间和设备索引。

------

## 1.2 增加组合索引

你的查询一般类似：

```
SELECT *
FROM sensor_data
WHERE device_id=100
AND create_time 
BETWEEN '2026-08-01'
AND '2026-08-02';
```

增加：

```
ALTER TABLE sensor_data
ADD INDEX idx_device_time
(
 device_id,
 create_time
);
```

------

## 1.3 为什么顺序是 device,time？

错误：

```
(create_time,device_id)
```

因为：

查询：

```
某设备最近一天
```

实际上：

先定位设备：

```
device_id=100
```

再时间范围：

```
create_time
```

所以：

```
设备 → 时间
```

------

## 1.4 检查是否生效

优化前：

```
EXPLAIN
SELECT *
FROM sensor_data
WHERE device_id=100
AND create_time>'2026-08-01';
```

看：

```
type
```

优化前：

```
ALL
```

表示：

全表扫描。

优化后：

```
type: range
key: idx_device_time
```

说明走索引。

# 二、分区（大数据量优化）

>执行：
>
>```sql
>SHOW CREATE TABLE sensor_data;
>```
>
>如果有分区，会看到类似：
>
>```
>PARTITION BY RANGE (TO_DAYS(`CollectTime`))
>(
>PARTITION p202608 VALUES LESS THAN (...),
>PARTITION p202609 VALUES LESS THAN (...)
>)
>```

## 2.1 查看数据量

分区适合：5000万条以上

```
SELECT COUNT(*)
FROM sensor_data;
```

例如：

```
120000000
```

12亿。

------

## 2.2 按月份分区

新表：

```
CREATE TABLE sensor_data_new
(
id BIGINT,
device_id INT,
channel INT,
value DOUBLE,
peak DOUBLE,
create_time DATETIME(3),

PRIMARY KEY(id,create_time),
INDEX idx_device_time(device_id,create_time)

)

PARTITION BY RANGE
(
TO_DAYS(create_time)
)
(
PARTITION p202608 VALUES LESS THAN
(TO_DAYS('2026-09-01')),

PARTITION p202609 VALUES LESS THAN
(TO_DAYS('2026-10-01'))
);
```

效果：

以前：

查询8月份：

```
扫描12亿
```

之后：

```
只扫描8月分区
```

------

## 2.3 查看分区效果

```
EXPLAIN
SELECT *
FROM sensor_data
WHERE create_time
BETWEEN 
'2026-08-01'
AND
'2026-08-31';
```

看：

```
partitions
```

优化后：

```
p202608
```

而不是：

```
p202601,p202602...
```

# 三、压缩 / 归档

传感器数据特点：

```
实时数据：
经常查

一年以前：
很少查
```

------

## 3.1 创建历史表

```
CREATE TABLE sensor_history LIKE sensor_data;
```

------

## 3.2 定期搬迁

例如保存180天：

```
INSERT INTO sensor_history
SELECT *
FROM sensor_data
WHERE create_time <
DATE_SUB(NOW(),INTERVAL 180 DAY);
```

删除：

```
DELETE FROM sensor_data
WHERE create_time <
DATE_SUB(NOW(),INTERVAL 180 DAY);
```

------

**生产环境一般都是自动执行**。通常不需要人工每天操作，可以用以下几种方式：

### 方案1：MySQL Event（数据库内部自动执行）✅

MySQL 自带定时任务，类似 Linux 的 cron。

例如：

目标：

> 保留最近180天数据，超过180天自动搬到历史表。

------

#### 1）开启事件调度器

查看：

```
SHOW VARIABLES LIKE 'event_scheduler';
```

如果：

```
OFF
```

开启：

```
SET GLOBAL event_scheduler = ON;
```

如果想永久开启：

修改 `my.cnf`：

```
[mysqld]
event_scheduler=ON
```

重启 MySQL。

------

#### 2）创建历史表

例如：

```
CREATE TABLE EquipmentData_history LIKE EquipmentData;
```

得到：

```
EquipmentData
        |
        |  最近180天
        |
        ↓
EquipmentData_history
        |
        |  老数据
```

------

#### 3）创建自动搬迁任务

例如每天凌晨2点执行：

```
CREATE EVENT ev_archive_equipment_data
ON SCHEDULE EVERY 1 DAY
STARTS '2026-08-07 02:00:00'
DO

BEGIN

INSERT INTO EquipmentData_history
SELECT *
FROM EquipmentData
WHERE CollectTime < DATE_SUB(NOW(),INTERVAL 180 DAY);


DELETE FROM EquipmentData
WHERE CollectTime < DATE_SUB(NOW(),INTERVAL 180 DAY);

END;
```

以后：

每天自动：

```
02:00

EquipmentData
       |
       ↓
超过180天的数据

       |
       ↓

EquipmentData_history
```

------

### 方案2：Python脚本 + Windows任务计划（更推荐工业项目）

如果环境是 Windows Server，这个方式更灵活。

结构：

```
Windows任务计划程序

每天2:00
    |
    ↓
archive.py
    |
    ↓
MySQL
    |
    ├── INSERT历史表
    |
    └── DELETE旧数据
```

------

例如：

```
archive.py
import pymysql


conn=pymysql.connect(
    host="localhost",
    user="root",
    password="123456",
    database="iot"
)

cursor=conn.cursor()


# 搬迁
cursor.execute("""
INSERT INTO EquipmentData_history
SELECT *
FROM EquipmentData
WHERE CollectTime < DATE_SUB(NOW(),INTERVAL 180 DAY)
LIMIT 10000
""")


# 删除
cursor.execute("""
DELETE FROM EquipmentData
WHERE CollectTime < DATE_SUB(NOW(),INTERVAL 180 DAY)
LIMIT 10000
""")


conn.commit()

conn.close()
```

然后：

Windows：

```
任务计划程序
    ↓
创建基本任务
    ↓
每天
    ↓
运行 python archive.py
```

------

### 方案3：如果用了分区，甚至不用搬迁

这是传感器系统更推荐的方式。

例如：

按月份分区：

```
EquipmentData

p202601
p202602
p202603
p202604
...
```

半年后删除：

```
ALTER TABLE EquipmentData
DROP PARTITION p202601;
```

瞬间完成。

因为：

删除分区 ≈ 删除文件。

而：

```
DELETE
```

是：

逐行删除。

------

### 三种方式对比

| 方式        | 自动 | 速度 | 适合          |
| ----------- | ---- | ---- | ------------- |
| MySQL Event | ✅    | 中   | 简单归档      |
| Python脚本  | ✅    | 高   | 工业项目推荐  |
| 分区删除    | ✅    | 最高 | 千万/亿级数据 |



## 3.3 压缩历史表

如果 InnoDB：

```
ALTER TABLE sensor_history
ROW_FORMAT=COMPRESSED;
```

查看：

```
SHOW TABLE STATUS
LIKE 'sensor_history';
```

看：

```
Data_length
```

# 四、清理历史数据

不要：

```
DELETE FROM sensor_data;
```

大删除会锁表。

------

## 推荐批量删除

例如：

每次删除1万：

```
DELETE FROM sensor_data
WHERE create_time<'2026-01-01'
LIMIT 10000;
```

循环执行。

Python：

```
while True:

    delete 10000

    if rowcount==0:
        break
```

------

## 删除后优化空间

```
OPTIMIZE TABLE sensor_data;
```

作用：

整理碎片。

------

# 五、MySQL参数优化

先查看：

```
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
```

假设：

服务器：

128GB RAM

推荐：

```
80GB
```

配置：

my.cnf:

```
[mysqld]

innodb_buffer_pool_size=80G

innodb_buffer_pool_instances=16

innodb_log_file_size=2G

innodb_flush_log_at_trx_commit=2
```

------

## 参数作用

### buffer_pool

最重要：

缓存数据页。

小：

```
频繁磁盘读取
```

大：

```
内存直接读取
```

------

### innodb_flush_log_at_trx_commit

默认：

```
1
```

每次写磁盘。

改：

```
2
```

性能提升：

写入可能提升数倍。

风险：

服务器突然断电可能丢1秒数据。

传感器通常可以接受。

# 六、数据库性能排查方法

## 1. 看慢查询

开启：

```
SET GLOBAL slow_query_log=ON;
```

设置：

```
SET GLOBAL long_query_time=1;
```

超过1秒记录。

查看：

```
SHOW VARIABLES LIKE '%slow%';
```

------

## 2. 查看正在执行的SQL

```
SHOW PROCESSLIST;
```

看到：

```
Sending data
```

很久：

通常是查询慢。

------

## 3. 使用EXPLAIN

重点看：

| 字段  | 正常        |
| ----- | ----------- |
| type  | range/ref   |
| key   | 有索引      |
| rows  | 越小越好    |
| Extra | Using index |

危险：

```
type=ALL
```

代表全表扫描。

------

## 4. 查看表大小

```
SELECT

table_name,

table_rows,

data_length/1024/1024 MB

FROM information_schema.tables

WHERE table_schema='你的库';
```

例如：

```
sensor_data
120000000
85000 MB
```

说明：

85GB。

------

## 5. 压测方法

优化前：

记录：

```
SELECT *
FROM sensor_data
WHERE device_id=1
ORDER BY create_time DESC
LIMIT 100;
```

执行：

```
SHOW PROFILES;
```

或者：

```
SET profiling=1;
```

优化后重复。

比较：

| 指标     | 优化前   | 优化后 |
| -------- | -------- | ------ |
| 执行时间 | 5s       | 50ms   |
| 扫描行数 | 10000000 | 100    |
| 磁盘读取 | 高       | 低     |