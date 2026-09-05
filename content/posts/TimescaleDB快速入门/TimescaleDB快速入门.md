---
draft: true
---
# 五、安装TimescaleDB

创建目录：

```
mkdir -p ~/timescale/data
```

启动：

```
docker run -d \
--name timescaledb \
--restart always \
-p 5432:5432 \
-e POSTGRES_PASSWORD=123456 \
-e POSTGRES_DB=sensor \
-v ~/timescale/data:/var/lib/postgresql/data \
timescale/timescaledb:latest-pg17
```

查看：

```
docker ps
```

------

进入数据库：

```
docker exec -it timescaledb psql -U postgres -d sensor
```

开启：

```
CREATE EXTENSION timescaledb;
```

------

# 六、安装Grafana

```
docker run -d \
--name grafana \
--restart always \
-p 3000:3000 \
grafana/grafana
```

访问：

```
http://192.168.0.20:3000
```

默认：

```
用户：admin
密码：admin
```

------

# 七、Windows Server开机自动运行

因为：

Hyper-V：

```
自动启动
```

Docker：

```
--restart always
```

所以：

服务器重启：

```
Windows启动
 ↓
Ubuntu VM自动启动
 ↓
Docker启动
 ↓
TimescaleDB/Grafana启动
```

无需人工操作。