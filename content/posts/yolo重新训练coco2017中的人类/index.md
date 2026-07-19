# yolo单独训练coco数据集中的人类

## 数据集下载

### 1.COCO 2017 图片

**训练集（118,287 张）**

[COCO 2017 Train Images](https://images.cocodataset.org/zips/train2017.zip)

大小约：**18GB**

------

**验证集（5,000 张）**

[COCO 2017 Val Images](https://images.cocodataset.org/zips/val2017.zip)

大小约：**1GB**

------

### 2. COCO 2017 标注文件

包含：

- `instances_train2017.json`
- `instances_val2017.json`
- captions
- keypoints 等

[COCO 2017 Annotations](https://images.cocodataset.org/annotations/annotations_trainval2017.zip)

大小约：**241MB**

`train2017.zip`、`val2017.zip`、`annotations_trainval2017.zip`，以及预训练权重 `yolo11n.pt`。要训「只检人」的 YOLO，可以按下面整理。

## 推荐最终目录

```text
/home/user/yzkj/coco/
├── images/
│   ├── train2017/          # 解压后的训练图（可整集保留）
│   └── val2017/
├── labels/
│   ├── train2017/          # 只含 person 的 YOLO txt
│   └── val2017/
├── annotations/            # COCO 原始 json（可选保留）
├── coco_person.yaml        # 数据集配置
└── yolo11n.pt
```

YOLO 约定：每张图对应同名 `.txt`，例如 `000000000139.jpg` → `000000000139.txt`；无目标则无标签文件（或空文件）。

## 数量怎么处理（核心）

| 集合  | COCO2017 大约规模 | 「只做人」时建议                                             |
| ----- | ----------------- | ------------------------------------------------------------ |
| train | ~118k 图          | **不必删无图的人像**；无 person 的图可当负样本留下，或删掉省空间 |
| val   | ~5k 图            | 同上，做验证                                                 |
| 类别  | COCO 80 类        | **只保留 `person`（category_id = 1）**，输出 `class_id = 0`  |

经验建议：

- **全量 train + val（过滤标签即可）**：效果最好，约 6 万+ 张含人图。
- **只要子集**：随机抽 1万–3万 张「含 person」的图，也能训通 `yolo11n`。
- **负样本**：可保留部分无人图（约 10%–20%），减少误检；也可全丢掉，只留含人图。

## 操作步骤

**1. 解压**

```bash
cd /home/user/yzkj/coco
unzip -q annotations_trainval2017.zip
mkdir -p images
unzip -q train2017.zip -d images
unzip -q val2017.zip -d images
```

解压后应大致是：

- `images/train2017/*.jpg`
- `images/val2017/*.jpg`
- `annotations/instances_train2017.json`
- `annotations/instances_val2017.json`

**2. COCO → 只做人的 YOLO 标签**

对 `instances_*.json`：只保留 `category_id == 1`（person），框写成 YOLO 格式：

```text
0 x_center y_center width height
```

坐标都相对图像宽高归一化到 `[0,1]`。一张图多个多人就写多行。

可用 ultralytics 自带转换，或写个小脚本过滤。要点：**不要把 80 类都转成 YOLO，只要 person → id `0`**。

**3. 写 `coco_person.yaml`**

```yaml
path: /home/user/yzkj/coco
train: images/train2017
val: images/val2017

names:
  0: person

nc: 1
```

**4. 开始训练（有标签后）**

```bash
yolo detect train data=coco_person.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=16
```

## 整理数量的两种常见策略

**策略 A（推荐）：标签过滤，图不动**

- 保留全部图片
- `labels/` 里只写 person 框
- 无人图没有对应 txt → 自动当负样本

**策略 B：只要含人图**

- 从 json 筛出有 person 的 `image_id`
- 只复制这些图到 `images/train2017`、`images/val2017`
- 再生成对应 labels
- **省磁盘、训练更快**，略少负样本

---

如果你愿意，我可以直接在这个目录里帮你：解压 → 过滤 person → 生成 YOLO 标签 → 写出 `coco_person.yaml`。说一下用 **策略 A 还是 B**，以及是用 **ultralytics** 还是自己的训练脚本即可。

---

**User**

用 策略 A ，用 ultralytics 即可

---

**Cursor**

按策略 A 来：解压后保留全部图片，只把 person 转成 YOLO 标签，并配好 ultralytics 的 `coco_person.yaml`。

解压已完成。pip 网络有问题，我用本地脚本做 person→YOLO 转换，并再试镜像安装 ultralytics。

发现 conda 环境 `yolo` 已装 ultralytics，正在用它做数据集校验。

数据集已按策略 A 整理好，并用 ultralytics 校验通过。

## 结果

| 集合      | 图片   | 含人（有标签） | 无人（负样本） | person 框数 |
| --------- | ------ | -------------- | -------------- | ----------- |
| train2017 | 118287 | 64115          | 54172          | 257252      |
| val2017   | 5000   | 2693           | 2307           | 10777       |

目录结构：

```text
/home/user/yzkj/coco/
├── images/train2017/   # 全部训练图
├── images/val2017/
├── labels/train2017/   # 仅 person，class_id=0
├── labels/val2017/
├── coco_person.yaml
├── convert_coco_person.py
└── yolo11n.pt
```

## 开始训练

你机器上已有 conda 环境 `yolo`（ultralytics 8.4.75）：

```bash
conda activate yolo
cd /home/user/yzkj/coco
yolo detect train data=coco_person.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=16
```

按显存调整 `batch`；需要更快可先加 `epochs=50` 或用更小子集试跑。

原始 zip 若磁盘紧张，确认无误后可删掉三个 `.zip`（约 20GB）。需要的话我可以帮你起一次试训。

---

**User**

训练集和验证集的数量合适吗

---

**Cursor**

合适，而且属于 COCO person 检测里很标准的体量。

| 集合  | 图片   | 含人  | 框数    | 含人占比 |
| ----- | ------ | ----- | ------- | -------- |
| train | 118287 | 64115 | ~25.7万 | ~54%     |
| val   | 5000   | 2693  | ~1.1万  | ~54%     |

简要结论：

- **训练集**：6 万+ 含人图、25 万+ 框，训 `yolo11n/s` 完全够用；再加大模型（m/l）也基本够。
- **验证集**：约 2700 张含人图，做 mAP、选模型足够稳定。
- **比例**：train:val ≈ 24:1，和 COCO 官方划分一致，不用再调。
- **负样本**（策略 A 保留的无人图）：约占一半，有利于少误检，一般不用删。

只有在显存/时间紧时，才考虑从 train 里随机抽 1万–3万 张含人图做快速试验；正式训练建议继续用当前全量。

---

**User**

batchsize只影响显存吗。会影响内存吗

---

**Cursor**

不只影响显存，**也会占内存（CPU RAM）**，但主压力通常在显存。

**显存（GPU）**  

- 一批图像、中间特征、梯度都在 GPU 上 → **batch 越大，显存几乎线性涨**。  
- 训 YOLO 时，OOM 多半是显存不够。

**内存（系统 RAM）**  

- DataLoader 会在 CPU 侧做解码、resize、增强，再拷到 GPU。  
- `batch` 大 → 同时常驻的样本更多 → **内存也会跟着涨**。  
- 若 `workers`（如 ultralytics 默认 8）偏高，每个 worker 还有自己的缓冲，内存占用更明显。  
- 一般机器 32GB+ 训 COCO + 中等 batch 通常够；**16GB 内存 + 大 batch + 高 workers** 时才容易吃紧甚至被系统杀进程。

| 资源 | batch 影响   | 典型表现                |
| ---- | ------------ | ----------------------- |
| 显存 | 强、主要瓶颈 | CUDA OOM                |
| 内存 | 有，通常次要 | 变慢、swap、进程被 kill |

调参时可记：降 `batch` 优先省显存；内存紧时再降 `workers`（如 `workers=2` 或 `4`），有时比瞎降 batch 更划算。

---

**User**

yolo训练默认worker是多少

---

**Cursor**

查一下你本机 ultralytics 里训练的默认 `workers`。

你这边 ultralytics **默认 `workers=8`**（每个进程的 DataLoader 工作进程数；多卡 DDP 时是每个 rank 各自 8）。

也可显式改，例如：

```bash
yolo detect train data=coco_person.yaml model=yolo11n.pt workers=4
```

---

**User**

我的batchsize是16，8g显存只占用3.1g，可以设为32吗，但是我的内存8g占了7g

---

**Cursor**

显存有余量，**内存已经顶满了**，不建议直接上到 32。

- **8G 显存只用 3.1G**：从 GPU 看，32 大概率吃得下（大致可估还会涨一截，但仍多半不到 8G）。
- **8G 内存已占约 7G**：再加大 `batch`，DataLoader 一次驻留的样本会更多，很容易挤进 swap，甚至被系统杀掉，训练反而更慢或不稳。

更稳妥的做法：

1. **先降 workers，再试 batch**  

   ```bash
   yolo detect train ... batch=16 workers=2
   ```

   内存下来后，再试：  

   ```bash
   yolo detect train ... batch=32 workers=2
   ```

2. **若内存仍紧**：保持 `batch=16`，用梯度累积模拟大 batch：  

   ```bash
   yolo detect train ... batch=16 nbs=64
   ```

   （`nbs` 是名义 batch；ultralytics 会按 `nbs/batch` 做累积，效果接近更大 batch，显存/内存负担几乎不变。）

3. **关闭别的占内存程序**；训练时尽量不要浏览器开太多标签。

结论：**别只因显存空闲就开 32**；先把 `workers` 降到 2（甚至 0），内存留出 1～2G 余量后再试 32。你这台机子更可能适合 **`batch=16 + workers=2`**，或 **`batch=16 + nbs` 累积**。

---

**User**

yolo detect train data=coco_person.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=32运行后直接杀死，但是后台还有pt_data_worker,有16个

---

**Cursor**

进程被系统因内存不足杀掉后，DataLoader 子进程常会残留。先帮你清理这些 `pt_data_worker`，再给一套适合 8G 内存的训练参数。

确认为 16 个孤儿 dataloader 进程（默认 `workers=8`，train+val 各一组），正在占内存。正在帮你清理。

残留进程已清掉，内存从约 **6.6G 降到 1.8G**。

## 原因

主进程被 OOM killer 杀掉后，默认 `workers=8` 的 DataLoader 子进程常变成孤儿。你看到的 **16 个** = 训练 8 + 验证 8。`batch=32` 在 **8G 内存**上更容易触发杀进程。

以后可手动清：

```bash
pkill -f 'yolo detect train'
```

## 建议再开训的命令（8G 内存）

不要用 `batch=32` + 默认 `workers=8`，改用：

```bash
cd /home/user/yzkj/coco
conda activate yolo
yolo detect train data=coco_person.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=16 workers=2 cache=False
```

若仍偏紧：

```bash
yolo detect train data=coco_person.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=8 workers=2 cache=False
```

要点：`workers=2`（或 `0`）比盲目加大 `batch` 更重要；开训前先 `free -h`，确认 available 至少有 2～3G。

---

**User**

yolo detect train data=coco_person.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=32  workers=4运行成功了

---

**Cursor**

很好，说明瓶颈在 **DataLoader 内存**，把 `workers` 从 8 降到 4 后，`batch=32` 就能稳住。

训的时候留意：

- 内存别再顶满（`available` 最好留 1G+）
- 显存仍有余量就不用再加 `workers`
- 若中途又被杀，优先再降 `workers=2`，而不是先降 `batch`

等跑完看 `results.png` / 验证 mAP 即可。

---

**User**

yolo detect train data=coco_person.yaml model=yolo11n.pt epochs=100 imgsz=640 batch=32 workers=4训练到15轮时不小心中断了，怎么接着训练

---

**Cursor**

先找到你上次的 `last.pt` 检查点，再给你准确的续训命令。

检查点在 `train-2`，已训到第 **15** 轮。用 `resume=True` 从 `last.pt` 接着训：

```bash
cd /home/user/yzkj/coco
conda activate yolo
yolo detect train resume=True model=runs/detect/train-2/weights/last.pt
```

续训会沿用原来的 `epochs=100`、`batch=32`、`workers=4` 等参数，从第 16 轮继续跑到 100。

注意：

- `model=` 必须指向 **`last.pt`**，不要用 `yolo11n.pt` 或 `best.pt`
- 不要再手写一遍 `data=` / `epochs=` 覆盖配置（除非你确实想改）
- 若想改 batch/workers，应新开一次训练，而不是 resume

---

**User**

怎么知道原来的 epochs=100、batch=32、workers=4 等参数。last.pt里面有吗

---

**Cursor**

不完全在你自己“记着”，主要在两个地方可以查。

有，**`last.pt` 里存了**，另外运行目录里还有一份更方便看的纯文本。

## 1. 最方便：`args.yaml`（推荐先看这个）

路径：

```text
/home/user/yzkj/coco/runs/detect/train-2/args.yaml
```

里面直接有 `epochs: 100`、`batch: 32`、`workers: 4`、`imgsz: 640` 等。`resume=True` 时 ultralytics 会读这份配置（以及 `last.pt` 里的状态）。

## 2. `last.pt` 里也有

权重文件是个字典，关键字段包括：

| 字段                          | 含义                                                     |
| ----------------------------- | -------------------------------------------------------- |
| `train_args`                  | 完整训练参数（epochs/batch/workers/data…）               |
| `epoch`                       | 当前进度（你这边是 `14`，表示已完成第 15 轮，从 0 起算） |
| `model` / `optimizer` / `ema` | 模型与优化器状态，用于接着训                             |

可这样查看：

```bash
conda activate yolo
python - <<'PY'
import torch
d = torch.load('runs/detect/train-2/weights/last.pt', map_location='cpu', weights_only=False)
a = d['train_args']
print('epoch(已完成轮数索引):', d['epoch'], '→ 下一轮从', d['epoch']+2, '开始' if False else d['epoch']+1)
print('epochs:', a['epochs'], 'batch:', a['batch'], 'workers:', a['workers'], 'imgsz:', a['imgsz'])
print('data:', a['data'])
PY
```

（`epoch=14` 表示刚写完第 15 个 epoch 的检查点，续训会从第 16 轮继续。）

## 小结

- **参数从哪来**：`last.pt` 的 `train_args` + 同目录 `args.yaml`
- **为什么续训不用再写**：`resume=True` 会从这些地方恢复
- **日常查参数**：直接打开 `args.yaml` 最清晰

---

**User**

所以即使最后一轮是最好的模型，last.pt和best.pt还是有区别的吗

---

**Cursor**

可以对照你这次 `train-2` 里的两个文件，说清楚异同。

**概念上始终有区别**；**碰巧最后一轮也是当前最优时，两个文件内容可以完全一样**。

你这次 `train-2` 里就是这样：`last.pt` 和 `best.pt` **MD5 相同、字节级一致**（都停在第 15 轮，且当时也是 best）。

|                      | `last.pt`                     | `best.pt`                   |
| -------------------- | ----------------------------- | --------------------------- |
| 存什么               | **每一轮结束**都覆盖保存      | **验证指标创新高**时才更新  |
| 用途                 | **断点续训**（`resume=True`） | **推理/部署**（一般取这个） |
| 和“最后一轮是否最好” | 永远是最新一轮                | 永远是历史最优一轮          |

所以：

- 最后一轮刚好最好 → 两文件可以暂时相同（你现在的情况）
- 后面某轮指标变差 → `last` 继续往前走，`best` 仍停在最优那轮 → **就会不一样**

续训请用 `last.pt`；最终用模型请用 `best.pt`（即使此刻两者一样，习惯上也分开用）。

---

**User**

results.csv中各参数是什么意思epoch	time	train/box_loss	train/cls_loss	train/dfl_loss	metrics/precision(B)	metrics/recall(B)	metrics/mAP50(B)	metrics/mAP50-95(B)	val/box_loss	val/cls_loss	val/dfl_loss	lr/pg0	lr/pg1	lr/pg2	lr/pg3	lr/pg4	lr/pg5	lr/pg6	lr/pg7


---

**Cursor**

这些是 ultralytics 每轮验证后写入 `results.csv` 的指标，含义如下：

## 进度与时间

| 列      | 含义                             |
| ------- | -------------------------------- |
| `epoch` | 当前轮次（从 1 开始）            |
| `time`  | 从开训到该轮结束的累计时间（秒） |

## 训练损失（训练集上）

| 列               | 含义                                                   |
| ---------------- | ------------------------------------------------------ |
| `train/box_loss` | 边框回归损失（框位置/大小准不准）                      |
| `train/cls_loss` | 分类损失（类别对不对，你这里是 person）                |
| `train/dfl_loss` | Distribution Focal Loss，细化边框边界（YOLO 系列常用） |

三者一般会随训练下降；偶有波动正常。

## 验证指标（验证集上，带 `(B)` = Box 检测）

| 列                     | 含义                                                         |
| ---------------------- | ------------------------------------------------------------ |
| `metrics/precision(B)` | 精确率：预测为人的框里，真正是人的比例（越高误检越少）       |
| `metrics/recall(B)`    | 召回率：真实人里被检出的比例（越高漏检越少）                 |
| `metrics/mAP50(B)`     | IoU≥0.5 时的平均精度，常用“好不好用”的粗指标                 |
| `metrics/mAP50-95(B)`  | IoU 从 0.5 到 0.95 的平均 mAP，更严格，ultralytics 选 `best.pt` 主要看它（fitness） |

## 验证损失（验证集上）

| 列             | 含义            |
| -------------- | --------------- |
| `val/box_loss` | 验证集边框损失  |
| `val/cls_loss` | 验证集分类损失  |
| `val/dfl_loss` | 验证集 DFL 损失 |

和 train 损失对照：train 降、val 升 → 可能过拟合。

## 学习率

| 列                  | 含义                                      |
| ------------------- | ----------------------------------------- |
| `lr/pg0` … `lr/pg7` | 不同参数组（parameter group）的当前学习率 |

YOLO 常把 backbone / neck / head、bias 等分成多组，所以会有多个 `lr/pg*`。数值随 warmup、余弦/线性衰减等调度变化；一般前几轮较小（warmup），再按策略变化。

---

**怎么看训练好不好（简记）**  

- 优先看：`metrics/mAP50-95(B)`、`metrics/mAP50(B)`  
- 辅助看：precision / recall 是否平衡  
- 损失：train/val 的 box、cls、dfl 是否整体下降  
- `best.pt`：通常对应 `mAP50-95`（fitness）最高的那一轮

---

**User**

训完了100轮，best.pt就是last.pt，是不是训练轮次不够，怎么办

---

**Cursor**

先看你 `results.csv` 末尾的 mAP 走势，再判断是不是轮次不够。

**不完全是“轮次不够”**——更准确说：第 100 轮刚好是验证集上 `mAP50-95` 最高的一轮，所以 `best.pt` 和 `last.pt` 相同。

看你末尾走势：

| 轮次 | mAP50-95  | mAP50     |
| ---- | --------- | --------- |
| 90   | 0.540     | 0.776     |
| 95   | 0.543     | 0.777     |
| 98   | 0.543     | 0.779     |
| 100  | **0.543** | **0.779** |

最后十几轮几乎贴着涨（90→100 只多约 **0.003**），已经接近平台期，不是还在猛涨。

## 怎么理解

- `best == last`：只说明「结束时仍是当前最优」，**不等于必须再加很多轮**。
- 你这边：模型大体收敛；再多训几十轮，最多再抠一点点，性价比不高。
- 第 91 轮起 train loss 掉得更明显，多半是默认 **`close_mosaic=10`**（最后 10 轮关掉 mosaic），属正常现象。

最终大约：**mAP50 ≈ 0.779，mAP50-95 ≈ 0.543**，对人检测的 `yolo11n` + COCO person 来说是合理水平。

## 怎么办（按目标选）

**1. 觉得已经够用**  
直接用 `best.pt`（也就是现在的 `last.pt`）部署即可，不必硬加轮次。

**2. 还想再挤一点精度（可选）**  
可从 `last.pt` 再续训，例如总轮次改到 150/200，但预期提升很小。续训时要把 `epochs` 设成**大于 100** 的新目标（例如 `epochs=150`），并 `resume=True`。

**3. 想明显提升（更有效）**  
优先换更大模型，而不是死磕 `n` 的轮数，例如：

```bash
yolo detect train data=coco_person.yaml model=yolo11s.pt epochs=100 imgsz=640 batch=... workers=...
```

`s/m` 通常比把 `n` 从 100 拉到 200 更有用。

**结论**：`best=last` 在你这次更像「训到了截止轮且仍略优」，不是明显欠训；曲线已平台，**加轮次收益有限**；要更好效果，优先 **更大模型 / 调参**，而不是盲目加 epochs。

---

**User**

如果要接着训，命令是怎么样的

---

**Cursor**

要从已训完的 100 轮接着加轮次，用 `resume=True`，并把 `epochs` 设成**新的总轮数**（不是“再训多少轮”）。

例如再训到总共 **150** 轮（相当于再跑 50 轮）：

```bash
cd /home/user/yzkj/coco
conda activate yolo
yolo detect train resume=True model=runs/detect/train-2/weights/last.pt epochs=150
```

再训到 **200** 轮同理，把 `epochs=200`。

说明：

- `model=` 必须是 **`last.pt`**
- `epochs` = 最终目标总轮次（必须 **> 100**）
- `batch`、`workers`、`data` 等一般会从检查点/`args.yaml` 恢复；你之前用的是 `batch=32 workers=4`，通常不用再写
- 若显式写了更小的 `epochs`（比如还写 `epochs=100`），可能无法继续往前训

开训后看日志里是否从 **epoch 101** 开始即可。

---

**User**

yolo11n.pt怎么测试在coco中人类的指标

---

**Cursor**

预训练的 `yolo11n.pt` 是 COCO 80 类，其中 **person 的类别 id 就是 0**，和你 `coco_person.yaml` 里的标签一致，可以直接在验证集上测。

## 测预训练 yolo11n 的「人」指标

```bash
cd /home/user/yzkj/coco
conda activate yolo
yolo detect val model=yolo11n.pt data=coco_person.yaml imgsz=640 batch=32 workers=4
```

看输出里的：

- `metrics/precision(B)`
- `metrics/recall(B)`
- `metrics/mAP50(B)`
- `metrics/mAP50-95(B)`

这就是它在你整理的 COCO person 验证集上的成绩。

## 和你自己训的模型对比

```bash
# 预训练
yolo detect val model=yolo11n.pt data=coco_person.yaml imgsz=640

# 你训完的
yolo detect val model=runs/detect/train-2/weights/best.pt data=coco_person.yaml imgsz=640
```

两边用同一套 `data`、`imgsz`，数字才有可比性。

## 注意

- 预训练权重是 **80 类头**，只在你这份「只有人」的标签上算指标时，主要看 **class 0（person）** 相关结果；和你训的 **单类 best.pt** 对比是合理的。
- 若报类别数不一致之类问题，可显式只评第 0 类：

```bash
yolo detect val model=yolo11n.pt data=coco_person.yaml classes=0 imgsz=640
```

- `batch` / `workers` 按你机器内存改；验证比训练省显存，一般比训练 batch 更大一点也行。

---

**User**

$ yolo detect train resume=True model=runs/detect/train-2/weights/last.pt epochs=150
WARNING ⚠️ model 'runs/detect/train-2/weights/last.pt' is not a resumable training checkpoint (missing epoch/optimizer state). Use 'resume' only to continue incomplete training. Starting new training instead.
Ultralytics 8.4.75 🚀 Python-3.10.20 torch-2.5.1+cu121 CUDA:0 (NVIDIA GeForce RTX 4060, 7807MiB)
engine/trainer: agnostic_nms=False, amp=True, angle=1.0, augment=False, auto_augment=randaugment, batch=16, bgr=0.0, box=7.5, cache=False, cfg=None, classes=None, close_mosaic=10, cls=0.5, cls_pw=0.0, compile=False, conf=None, copy_paste=0.0, copy_paste_mode=flip, cos_lr=False, cutmix=0.0, data=coco8.yaml, degrees=0.0, deterministic=True, device=None, dfl=1.5, dnn=False, dropout=0.0, dynamic=False, embed=None, end2end=None, epochs=150, erasing=0.4, exist_ok=False, fliplr=0.5, flipud=0.0, format=torchscript, fraction=1.0, freeze=None, half=False, hsv_h=0.015, hsv_s=0.7, hsv_v=0.4, imgsz=640, int8=False, iou=0.7, keras=False, kobj=1.0, line_width=None, lr0=0.01, lrf=0.01, mask_ratio=4, max_det=300, mixup=0.0, mode=train, model=runs/detect/train-2/weights/last.pt, momentum=0.937, mosaic=1.0, multi_scale=0.0, name=train-12, nbs=64, nms=False, opset=None, optimize=False, optimizer=auto, overlap_mask=True, patience=100, perspective=0.0, plots=True, pose=12.0, pretrained=True, profile=False, project=None, rect=False, resume=False, retina_masks=False, rle=1.0, save=True, save_conf=False, save_crop=False, save_dir=/home/user/yzkj/coco/runs/detect/train-12, save_frames=False, save_json=False, save_period=-1, save_txt=False, scale=0.5, seed=0, shear=0.0, show=False, show_boxes=True, show_conf=True, show_labels=True, simplify=True, single_cls=False, source=None, split=val, stream_buffer=False, task=detect, time=None, tracker=botsort.yaml, translate=0.1, val=True, verbose=True, vid_stride=1, visualize=False, warmup_bias_lr=0.1, warmup_epochs=3.0, warmup_momentum=0.8, weight_decay=0.0005, workers=8, workspace=None

WARNING ⚠️ Dataset 'coco8.yaml' images not found, missing path '/home/user/datasets/coco8/images/val'
Traceback (most recent call last):
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/urllib/request.py", line 1348, in do_open
    h.request(req.get_method(), req.selector, req.data, headers,
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/http/client.py", line 1303, in request
    self._send_request(method, url, body, headers, encode_chunked)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/http/client.py", line 1349, in _send_request
    self.endheaders(body, encode_chunked=encode_chunked)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/http/client.py", line 1298, in endheaders
    self._send_output(message_body, encode_chunked=encode_chunked)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/http/client.py", line 1058, in _send_output
    self.send(msg)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/http/client.py", line 996, in send
    self.connect()
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/http/client.py", line 1468, in connect
    super().connect()
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/http/client.py", line 962, in connect
    self.sock = self._create_connection(
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/socket.py", line 836, in create_connection
    for res in getaddrinfo(host, port, 0, SOCK_STREAM):
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/socket.py", line 967, in getaddrinfo
    for res in _socket.getaddrinfo(host, port, family, type, proto, flags):
socket.gaierror: [Errno -3] Temporary failure in name resolution

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/utils/downloads.py", line 347, in safe_download
    with request.urlopen(url) as response:
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/urllib/request.py", line 216, in urlopen
    return opener.open(url, data, timeout)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/urllib/request.py", line 519, in open
    response = self._open(req, data)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/urllib/request.py", line 536, in _open
    result = self._call_chain(self.handle_open, protocol, protocol +
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/urllib/request.py", line 496, in _call_chain
    result = func(*args)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/urllib/request.py", line 1391, in https_open
    return self.do_open(http.client.HTTPSConnection, req,
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/urllib/request.py", line 1351, in do_open
    raise URLError(err)
urllib.error.URLError: <urlopen error [Errno -3] Temporary failure in name resolution>

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/engine/trainer.py", line 722, in get_dataset
    data = check_det_dataset(self.args.data)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/data/utils.py", line 535, in check_det_dataset
    safe_download(url=s, dir=DATASETS_DIR, delete=True)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/utils/downloads.py", line 383, in safe_download
    raise ConnectionError(
ConnectionError: ❌  Download failure for https://ultralytics.com/assets/coco8.zip. Environment may be offline.

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "/home/user/miniconda3/envs/yolo/bin/yolo", line 6, in <module>
    sys.exit(entrypoint())
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/cfg/__init__.py", line 1037, in entrypoint
    getattr(model, mode)(**overrides)  # default args from model
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/engine/model.py", line 783, in train
    self.trainer = (trainer or self._smart_load("trainer"))(overrides=args, _callbacks=self.callbacks)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/models/yolo/detect/train.py", line 63, in __init__
    super().__init__(cfg, overrides, _callbacks)
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/engine/trainer.py", line 186, in __init__
    self.data = self.get_dataset()
  File "/home/user/miniconda3/envs/yolo/lib/python3.10/site-packages/ultralytics/engine/trainer.py", line 726, in get_dataset
    raise RuntimeError(emojis(f"Dataset '{clean_url(self.args.data)}' error ❌ {e}")) from e
RuntimeError: Dataset 'coco8.yaml' error ❌ ❌  Download failure for https://ultralytics.com/assets/coco8.zip. Environment may be offline.
怎么回事

---

**Cursor**

正在对照你本地的 `last.pt` 和 ultralytics 的续训逻辑，解释这条警告和 `coco8.yaml` 从哪来的。


这是**两件事叠在一起**导致的，不是 `coco_person` 数据集坏了。

## 发生了什么（按顺序）

### 1. 续训没真正生效

你用了：

```bash
resume=True model=runs/detect/train-2/weights/last.pt
```

Ultralytics 会先检查：当前加载的 `last.pt` 里有没有 **`epoch` + `optimizer`** 等完整训练状态。

检查**没通过**，于是打出：

> not a resumable training checkpoint … **Starting new training instead**

也就是说：**没有从第 101 轮接着训**，而是当成「用这份权重**重新开一次训练**」。

常见原因包括：

- `last.pt` 被覆盖成只有权重的文件（例如只导出了 model）
- 开了 `ULTRALYTICS_SAFE_LOAD` 等，加载时没把 optimizer 读进内存
- 文件路径不对，指到的不是当初训完的那份 `last.pt`

### 2. 新训练没指定 data → 默认 coco8

续训失败后 `resume=False`，你又**没写 `data=coco_person.yaml`**。  
检测任务默认会用 **`coco8.yaml`**（演示小数据集），所以日志里是 `data=coco8.yaml`、`batch=16`、`workers=8`，还新建了 **`train-12`**。

本机没有 coco8，又去网上下 zip → 你这边 DNS/离线 → 报错。

---

## 正确续训写法（推荐）

在 **`/home/user/yzkj/coco`** 下，用 **路径形式的 resume**，不要只用 `resume=True`：

```bash
cd /home/user/yzkj/coco
conda activate yolo
yolo detect train resume=runs/detect/train-2/weights/last.pt epochs=150 batch=32 workers=4
```

说明：

- `epochs=150` 表示**总共**训到 150 轮（从约 101 轮继续）
- `resume=.../last.pt` 会从检查点恢复 `data`、优化器等；一般不必再写 `data=`
- 想保险可显式加上：`data=coco_person.yaml`

成功时日志里应有类似：**Resuming training … from epoch 101 to 150**。

---

## 先确认 last.pt 是否还能续训

```bash
conda activate yolo
python - <<'PY'
import torch
d = torch.load("runs/detect/train-2/weights/last.pt", map_location="cpu", weights_only=False)
print("epoch:", d.get("epoch"))
print("has optimizer:", d.get("optimizer") is not None)
print("data:", d.get("train_args", {}).get("data"))
PY
```

- `epoch` 应为 **99**（表示已完成 100 轮）
- `has optimizer` 应为 **True**

若 `optimizer` 是 **False**，就不能用 resume，只能**微调**：

```bash
yolo detect train model=runs/detect/train-2/weights/best.pt data=coco_person.yaml \
  epochs=50 imgsz=640 batch=32 workers=4
```

这是从权重接着学，**不会**恢复优化器/轮次计数，但多训 50 轮往往够用。

---

## 关于误开的 train-12

那次失败跑可以忽略；若目录是空的或只有半截配置，删掉 `runs/detect/train-12` 即可，不影响 `train-2` 里的 `best.pt` / `last.pt`。

---

**一句话**：警告 = 续训失败 → 当成新训练 → 默认 coco8 → 下载失败。改用 **`resume=runs/detect/train-2/weights/last.pt epochs=150`**，并确认 `last.pt` 里仍有 optimizer。



---

训练时生成的labels.jpg，里面有instances，width和height，这些是什么意思，看不懂

`labels.jpg` 是 Ultralytics YOLO 在训练开始前自动生成的一张**数据集统计图**，用于帮助检查数据集是否正常。很多人第一次看到都会觉得看不懂。

一般长这样（YOLO11 和 YOLOv8 基本一样）：

它通常包含 4～5 个子图，其中你提到的 **Instances、Width、Height** 都是**统计信息**，不是训练结果。

------

# 1. Instances（实例数）

这是最好理解的。

例如：

```
person
██████████████████ 260000
```

表示：

> **整个训练集中，一共有多少个 person 标注框（Bounding Box）。**

注意：

这里统计的是：

> **目标数量（bbox 数）**

不是图片数量。

例如：

```
图片1
person
person
person
```

这一张图：

```
Instances = 3
```

再例如：

```
图片2
person
```

这一张：

```
Instances = 1
```

整个数据集：

```
图片数：100张

person总数：580个
```

那么：

```
Instances = 580
```

------

# 2. Width

这个不是图片宽度。

而是：

> **所有标注框宽度的分布。**

YOLO 会把 bbox 转成：

```
width / image_width
```

因此：

范围都是：

```
0~1
```

例如：

图片：

```
1920×1080
```

有个人：

```
bbox宽：

96像素
```

那么：

```
width

96 / 1920

=0.05
```

所以 Width 图就是：

整个数据集中：

```
bbox宽度

都是多少
```

例如：

```
大量集中在

0.02~0.08
```

说明：

你的目标：

都是比较小的人。

------

# 3. Height

同理。

不是图片高度。

而是：

```
bbox高度

/

图片高度
```

例如：

图片：

```
1920×1080
```

人体：

```
高

540像素
```

那么：

```
height

540/1080

=0.5
```

如果：

Height 图：

大多数：

```
0.4~0.8
```

说明：

人比较近。

如果：

```
0.01~0.05
```

说明：

都是远距离的人。

------

# 4. Center X

表示：

所有 bbox 中心：

```
x_center
```

分布。

例如：

```
0
```

表示：

最左边。

```
0.5
```

表示：

画面中央。

```
1
```

表示：

最右边。

如果：

大量集中：

```
0.5
```

说明：

你拍照喜欢把人放中间。

如果：

均匀：

说明：

数据集不错。

------

# 5. Center Y

一样。

```
0
```

顶部。

```
1
```

底部。

例如：

监控摄像头：

很多人：

集中：

```
0.7
```

说明：

人主要在画面下方。

------

# 举个例子

例如：

你的 labels.jpg：

```
Instances

person

260000
```

表示：

COCO：

大约：

```
26万个人
```

------

Width：

```
集中

0.03
```

说明：

人：

平均占：

```
图片宽度

3%
```

属于：

小目标。

------

Height：

```
集中

0.12
```

说明：

平均：

人体高度：

占图片：

12%。

------

# 为什么要看这些？

这是为了检查数据集有没有问题。

例如：

## 正常

Width：

```
0.02~0.6
```

说明：

近景远景都有。

------

## 异常1

全部：

```
0.001
```

说明：

标注可能错了。

------

## 异常2

全部：

```
0.98
```

说明：

bbox几乎覆盖整张图。

可能：

标注错误。

------

## 异常3

Center X：

全部：

```
0.5
```

说明：

所有目标都在中间。

泛化能力差。

------

# 对于你的 Person 数据集

如果你训练的是 **COCO Person 单类别**，正常情况下应该看到：

- **Instances**：约 **26 万**（COCO 中 `person` 的实例总数）
- **Width**：大多数集中在 **0.02～0.10**（远距离人体较多）
- **Height**：大多数集中在 **0.05～0.30**
- **Center X / Center Y**：分布较均匀，不会全部集中在某一个位置。

------

**如果你愿意，可以把训练生成的 `labels.jpg` 发给我，我可以逐个图告诉你它代表什么，以及是否存在数据集问题。**这比只看文字解释更直观，也能判断你的数据是否适合训练。

还有一个图上有很多框

你说的“**还有一个图上有很多框**”，这个通常是 Ultralytics YOLO 训练时生成的 **`train_batch\*.jpg`**（例如 `train_batch0.jpg`、`train_batch1.jpg`、`train_batch2.jpg`），不是 `labels.jpg`。

它的作用是：

> **把训练时实际输入模型的图片，画上标注框，让你检查数据增强和标签是否正确。**

例如：

```
runs/detect/train/
├── labels.jpg
├── train_batch0.jpg
├── train_batch1.jpg
├── train_batch2.jpg
└── val_batch0_labels.jpg
```

------

## train_batch0.jpg 里面的框是什么意思？

每一个框代表一个目标标注。

例如你的 person-only 数据：

图片：

```
街道.jpg
```

里面：

```
人1
人2
人3
```

那么生成：

```
┌───────────────┐
│               │
│   ┌───┐       │
│   │人 │       │
│   └───┘       │
│        ┌───┐  │
│        │人 │  │
│        └───┘  │
│               │
└───────────────┘
```

这些框就是 YOLO 的训练标签。

------

## 为什么框有时很多？

COCO2017 很多人群图片：

例如：

- 体育场
- 街道
- 游行
- 地铁

一张图片可能：

```
20个人
```

所以：

```
一张图 = 20个框
```

这是正常的。

COCO person：

平均每张有人图片：

大约：

```
4个人左右
```

但极端图片可能几十、上百个人。

------

## 你重点看几个地方

### 1. 框有没有套在人身上

正常：

```
      ┌────────┐
      │  人    │
      │        │
      └────────┘
```

异常：

```
┌──────────────┐
│              │
│    人        │
└──────────────┘
```

如果框把大量背景包含进去：

说明标签转换错误。

------

### 2. 框有没有偏移

例如：

人：

```
   O
  /|\
  / \
```

框：

```
┌────────┐
│        │
│        │
└────────┘
```

正常。

错误：

```
┌────────┐
│        │
└────────┘

      人
```

说明 COCO → YOLO 转换有问题。

------

### 3. 类别颜色

如果你的数据只有 person：

所有框应该显示：

```
person
```

或者：

```
0 person
```

不会出现：

```
car
dog
chair
```

如果还有其它类别：

说明转换没有清理干净。

------

## 还有一个容易混淆的图：`val_batch0_labels.jpg`

这个是验证集标签：

```
val_batch0_labels.jpg
```

显示：

- 原始验证图片
- 真实标注框

而：

```
val_batch0_pred.jpg
```

显示：

- 模型预测框

两者区别：

| 图片                  | 含义              |
| --------------------- | ----------------- |
| train_batch0.jpg      | 训练输入+真实标签 |
| val_batch0_labels.jpg | 验证集真实标签    |
| val_batch0_pred.jpg   | 模型预测结果      |

------

## 对你的 COCO Person 数据集

你应该看到：

✅ 框全部是人体
 ✅ 类别只有 person
 ✅ 框基本包住人体
 ✅ 大小有大有小（远近都有）

如果出现：

❌ 大量框在空白区域
 ❌ 框偏移
 ❌ 框特别细长
 ❌ 框覆盖整张图

通常是 **COCO 标注转换成 YOLO 格式时 bbox 计算错误**。

你可以直接上传这个“很多框的图”（train_batch0.jpg），我可以帮你判断你的 COCO→YOLO 转换是否正确。

---

## 方案三：推荐方案（最适合你的情况）⭐⭐⭐⭐⭐

**第一步：利用 COCO 预训练权重。**

直接使用官方：

```
yolo11n.pt
```

它已经学会了：

- 人体结构
- 姿态变化
- 遮挡
- 尺度变化

这些能力对俯视检测仍然有帮助。

**第二步：用你的俯视数据进行微调。**

例如：

```
yolo detect train \
    model=yolo11n.pt \
    data=topview.yaml \
    epochs=50-100 \
    lr0=0.001
```

学习率比默认值小一些，让模型保留已有能力，同时适应俯视视角。

------

## 如果你的俯视数据越来越多

经验上可以参考：

| 俯视数据量     | 建议                                           |
| -------------- | ---------------------------------------------- |
| <500 张        | 直接微调，增强数据增强                         |
| 500～3000 张   | 微调（最佳）                                   |
| 3000～10000 张 | 可以只用俯视数据训练（仍建议从预训练权重开始） |
| >10000 张      | 可以考虑完全以俯视数据为主                     |

