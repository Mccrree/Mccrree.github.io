# Deep Neural Networks

## Chapter 4：深度神经网络 Deep Neural Networks

第三章我们已经知道：

> **Neural Network 本质是在学习一个从 input 到 output 的复杂函数。**

对于使用 ReLU 的 Shallow Neural Network：

```text
Input
  ↓
Linear
  ↓
ReLU
  ↓
Linear Combination
  ↓
Output
```

最终得到的是一个：

> **Piecewise Linear Function（分段线性函数）**

大白话来说：

> 用很多小线段 / 小平面拼出一个复杂函数。

而一个 hidden unit 可以帮助制造新的 **joint（拐点）**。

所以第三章的思路大概是：

```text
更多 hidden units
        ↓
更多 joints
        ↓
更多 linear regions
        ↓
可以逼近更复杂的函数
```

甚至 Universal Approximation Theorem 告诉我们：

> **只有一个 hidden layer，只要 hidden units 足够多，也能逼近任意连续函数。**

于是问题来了：

## 既然 Shallow 已经什么都能拟合，为什么还需要 Deep？

这就是 Chapter 4 的核心。

---

## 1. “能做到”和“高效做到”不是一回事

Shallow Network 的问题不是：

```text
做不到复杂函数
```

而是：

```text
想拟合非常复杂的函数
        ↓
可能需要巨量 hidden units
        ↓
需要巨量 parameters
```

Deep Network 提供了另一种思路：

```text
简单函数
↓
简单函数
↓
简单函数
↓
...
↓
复杂函数
```

也就是：

> **Function Composition（函数组合）**

所以这一章真正比较的是：

```text
Shallow vs Deep

不是：
谁能做到？

而是：
谁能更高效地做到？
```

---

## 2. Composing Neural Networks

假设有两个 Shallow Networks。

第一个：

```text
x
↓
Network 1
↓
y
```

即：

```text
y = f(x)
```

第二个：

```text
y
↓
Network 2
↓
y'
```

即：

```text
y' = g(y)
```

把它们连起来：

```text
x
↓
f
↓
y
↓
g
↓
y'
```

最终：

```text
y' = g(f(x))
```

这就是：

> **Function Composition**

Deep Neural Network 最核心的思想之一，就是：

> 把很多相对简单的 transformation 一层层组合起来。

---

## 3. 为什么 Composition 会突然变强？

这是这一章最关键的地方。

假设 Network 1 把 x 变成 y。

它形成几个来回变化的 linear regions：

```text
      /\
     /  \
____/    \____
```

于是可能出现：

```text
x1 ─┐
x2 ─┼──→ 同一个 y
x3 ─┘
```

也就是说：

> **不同的原始 input，被 Network 1 映射到了同一个 intermediate representation。**

然后 Network 2 接收到的只有：

```text
y
```

它已经不知道这个 y 原来来自 x1、x2 还是 x3。

所以 Network 2 对 y 学到的一个结构，会同时作用在这些不同的 x 区域上。

例如：

```text
Network 1：3 个区域

Network 2：3 个区域
```

组合以后可以得到：

```text
3 × 3 = 9 个区域
```

真正重要的不是 `3 × 3 = 9` 这个数字。

而是：

> **后面一层学到的结构，可以被前一层制造出的多个区域重复利用。**

所以 Shallow 更像：

```text
增加 neuron
↓
一点点增加结构
```

而 Deep 可以出现类似：

```text
结构
↓
复用
↓
再复用
↓
复杂度快速增长
```

---

## 4. Folding：最重要的几何直觉

教材把上面的现象称为：

> **Folding the Input Space**

也就是“折叠输入空间”。

假设原始 input 是：

```text
x1   x2   x3   x4   x5
```

经过第一层以后：

```text
x1 ─────┐
x3 ─────┼──→ 同一个 representation
x5 ─────┘
```

数学上类似：

```text
f(x1) = f(x3) = f(x5)
```

可以想象成：

> 把一张长纸折起来，让原本相隔很远的位置叠在一起。

---

### 折纸 + 盖章

这是最好理解的比喻。

先把纸折三折：

```text
────────────────────
        ↓ Fold
```

然后在折好的纸上盖一个：

```text
★
```

展开：

```text
★        ★        ★
```

明明只盖了一次，

最后却在三个地方出现。

Deep Network 也是类似：

```text
第一层 Fold
↓
把多个 input regions 放到一起
↓
第二层学习一个 transformation
↓
这个 transformation 被多个原始区域共享
```

所以：

> **Folding 本质是一种结构复用。**

---

## 5. 从两个 Shallow Networks 到 Deep Network

前面看起来是：

```text
Shallow Network 1
↓
Shallow Network 2
```

为什么最后可以写成：

```text
Input
↓
Hidden Layer 1
↓
Hidden Layer 2
↓
Output
```

关键在于：

> **Linear function 套 Linear function，最后仍然是 Linear function。**

例如：

```text
y = ax + b
z = cy + d
```

代进去：

```text
z = c(ax+b)+d
```

整理：

```text
z = ca·x + cb+d
```

仍然只是一个 linear / affine transformation。

所以两个网络之间连续的 linear operations 可以合并。

---

## 6. 为什么一定需要 ReLU？

这也解释了一个非常重要的问题。

如果你的网络是：

```text
Linear
↓
Linear
↓
Linear
↓
Linear
```

那么无论叠多少层：

```text
Linear(Linear(Linear(x)))
```

最后仍然只是：

```text
Linear(x)
```

200 层最后还是一条直线。

真正让 Deep Network 越叠越复杂的是：

> **Non-linear Activation，例如 ReLU。**

所以 Deep Network 的基本结构是：

```text
Linear
↓
ReLU
↓
Linear
↓
ReLU
↓
Linear
↓
...
```

---

## 7. 每一层到底在干什么？

第一层：

```text
h1 = ReLU(...)
h2 = ReLU(...)
h3 = ReLU(...)
```

得到：

```text
[h1, h2, h3]
```

这就是第一层产生的：

> **Representation**

第二层不再直接处理原始 x。

它处理：

```text
h1
h2
h3
```

例如：

```text
h'1 =
ReLU(
ψ10 + ψ11h1 + ψ12h2 + ψ13h3
)
```

所以 Deep Network 可以理解成：

```text
Raw Input
↓
Representation 1
↓
Representation 2
↓
Representation 3
↓
...
↓
Output
```

每一层都在：

> **重新组织上一层已经提取出来的信息。**

---

## 8. ReLU 为什么可以继续制造新的 Joints？

第二层在进入 ReLU 前，会先把上一层的 functions 重新组合：

```text
z =
ψ0 + ψ1h1 + ψ2h2 + ψ3h3
```

因为 h1、h2、h3 都是 piecewise linear，

所以 z 仍然是：

> **Piecewise Linear Function**

然后经过：

```text
ReLU(z)
```

ReLU 做：

```text
z < 0 → 变成 0
z > 0 → 保留
```

相当于：

> 把函数低于 0 的部分“咔嚓”剪掉。

这个过程叫：

> **Clipping**

如果原来的函数穿过 `0`，

剪完以后就可能产生新的拐点。

于是：

```text
上一层制造 joints
↓
重新组合
↓
ReLU clipping
↓
产生新的 joints
↓
继续组合
```

所以 Deep Network 的另一个核心理解是：

```text
Create
↓
Combine
↓
Clip
↓
Create More
↓
Combine
↓
Clip
```

---

## 9. Folding 和 Clipping 是两种看法

### 几何视角

```text
Fold
↓
Fold
↓
Fold
```

强调：

> 后面的结构被重复利用。

### 函数视角

```text
Combine
↓
ReLU Clip
↓
New Joints
```

强调：

> 每一层不断制造新的 piecewise linear structure。

两个说法其实是在描述同一个 Deep Network。

---

## 10. Depth、Width、Parameters、Hyperparameters

现在可以整理几个重要术语。

假设：

```text
Input
↓
100 units
↓
200 units
↓
50 units
↓
Output
```

### Depth

hidden layers 的数量：

```text
Depth = 3
```

### Width

每个 hidden layer 有多少 units：

```text
100
200
50
```

### Parameters

训练过程中学习：

```text
Weights
Biases
```

### Hyperparameters

训练前决定：

```text
有多少层？
每层多宽？
```

所以可以记成：

```text
Hyperparameters
↓
决定网络“长什么样”

Parameters
↓
决定这个网络最后学到哪个具体函数
```

---

## 11. Matrix Notation

一个 neuron 一个 neuron 写：

```text
h1 = ...
h2 = ...
h3 = ...
```

太麻烦。

一整个 layer 可以直接写成：

```text
h = ReLU(β + Ωx)
```

其中：

```text
x = 上一层的 representation

Ω = Weight Matrix

β = Bias Vector

h = 下一层的 representation
```

过程就是：

```text
x
↓
Ωx + β
↓
ReLU
↓
h
```

---

### Weight Matrix 尺寸怎么判断？

假设：

```text
上一层：4 units
下一层：2 units
```

也就是：

```text
4 个数字
↓
变成
2 个数字
```

那么：

```text
Weight Matrix = 2 × 4
```

一句话记：

> **下一层大小 × 上一层大小**

---

## 12. Deep Network 的通用形式

有 K 个 hidden layers：

```text
h1 = ReLU(β0 + Ω0x)

h2 = ReLU(β1 + Ω1h1)

...

hK = ReLU(βK-1 + ΩK-1hK-1)

y = βK + ΩKhK
```

虽然看起来复杂，

本质仍然只有：

```text
上一层
↓
Linear Transformation
↓
ReLU
↓
下一层
```

不断重复。

所以：

> **Deep Neural Network 最终仍然只是一个巨大的 function composition。**

---

## 13. Shallow vs Deep

这里最容易记错。

错误理解：

```text
Shallow：
不能拟合复杂函数

Deep：
可以
```

❌

正确：

```text
Shallow：
理论上也能拟合复杂函数

Deep：
对于某些函数可以更加高效
```

**Shallow NN 和 Deep NN 的目标都是去近似一个复杂函数。Shallow NN 主要通过不断增加 hidden units，一个个制造新的拐点，把函数切成很多小线段来逼近目标；而 Deep NN 则通过多个 hidden layers 层层组合，利用前一层已经产生的结构继续重新组合并经过 ReLU 产生新的拐点，因此可以更高效地制造大量 linear regions，用更少的参数表达某些复杂函数。**

如果你想要更大白话一点，可以记成：

> **Shallow NN：靠加人，一个个造拐点。Deep NN：靠分层加工，上一层先造出结构，下一层继续利用这些结构再造更多拐点，所以复杂度可以一层层放大。**

---

## 14. Deep 为什么参数效率更高？

对于：

```text
1 input
1 output
1 hidden layer
D hidden units
```

Shallow ReLU Network 最多大约有：

```text
D + 1
```

个 linear regions。

但如果是：

```text
K hidden layers
每层 D hidden units
```

某些构造下 linear regions 可以按类似：

```text
(D + 1)^K
```

的速度增长。

例如教材给出的例子：

```text
5 hidden layers
10 units / layer
```

只有：

```text
471 parameters
```

却可以产生多达：

```text
161,051 linear regions
```

这就是 Depth 的核心优势之一：

> **Parameters 没有爆炸，但函数复杂度可以增长得非常快。**

原因正是之前讲的：

```text
Composition
+
Folding
+
Structure Reuse
```

---

## 15. 但 Linear Regions 越多 ≠ 模型一定越好

这里必须注意。

Deep Network 的大量 regions：

> 并不是完全互相独立的。

它们来自同一套 parameters 的 repeated folding，

因此存在：

```text
dependencies
symmetries
```

就像折纸以后盖一个：

```text
★
```

展开得到很多：

```text
★ ★ ★ ★
```

但它们并不是四个完全独立设计的图案。

所以：

> **更多 linear regions 代表更大的潜在表达能力，但不保证实际任务一定更好。**

---

## 16. Depth Efficiency

这带来一个正式概念：

> **Depth Efficiency**

意思是：

某些函数使用 Deep Network：

```text
少量 layers
+
少量 hidden units
```

就可以表示得很好。

但如果强行用 Shallow Network：

```text
可能需要 exponentially more hidden units
```

也就是指数级更多。

所以：

> **不是 Shallow 做不到，而是可能需要付出非常夸张的代价。**

不过教材也提醒：

> 这种理论优势确实存在，但不能因此直接证明现实世界所有任务都是 Deep 永远更好。

---

## 17. 为什么 Deep 特别适合图片这类 Structured Input？

之前我们一直讨论简单的：

```text
x → y
```

现实中的 image 可能有几百万 pixel。

而且这些 pixel 不是互相独立的。

图片有：

```text
局部结构
空间关系
重复 pattern
```

比如“猫耳朵”出现在左边和右边，

没必要分别从头学一次。

更合理的是：

```text
先处理局部信息
↓
组合成更大的区域
↓
继续组合
↓
得到 global information
```

也就是：

```text
Local
↓
Larger Region
↓
Global
```

这种：

> **Multi-stage Processing**

天然适合 Deep Network。

这也会自然引向后面的：

> **CNN**

---

## 18. Deep 并不是越深越好

Depth 增加可以带来更强的表达能力，

但也会让 training 变困难。

所以：

```text
更深
≠
无脑更好
```

这也是为什么后面会出现：

```text
Residual Networks
```

等 architecture 来帮助训练非常深的 networks。

Deep Networks 在新数据上还能经常获得不错的：

> **Generalization**

但为什么参数巨多的 Deep Networks 还能 generalize 得这么好，并没有被完全解释。

教材会在后面的章节重新讨论。

---

## 19. Chapter 3 → Chapter 4

现在可以把两章真正串起来。

### Chapter 3

问题：

> Neural Network 怎么制造复杂函数？

答案：

```text
增加 Hidden Units
↓
增加 Joints
↓
增加 Linear Regions
```

主要依靠：

> **Width**

---

### Chapter 4

问题：

> 为什么要增加 Depth？

答案：

```text
Function Composition
↓
改变 Representation
↓
Folding / Structure Reuse
↓
ReLU Clipping
↓
快速增加 Function Complexity
```

所以最简单地说：

> **Shallow 主要靠横向堆零件，Deep 则让这些零件进入流水线，一层建立在上一层的结果之上。**

---

## 20. Chapter 4 的知识地图

```text
Chapter 3：Shallow Network
│
├── ReLU
├── Piecewise Linear Function
├── Joints
└── Universal Approximation
        ↓
        ↓ 为什么还需要 Deep？
        ↓
Chapter 4：Deep Network
│
├── Function Composition
│      └── g(f(x))
│
├── 每层改变 Representation
│
├── 两个核心直觉
│      ├── Folding
│      └── ReLU Clipping
│
├── Structure
│      ├── Depth
│      └── Width
│
├── Parameters
│      ├── Weights
│      └── Biases
│
├── Matrix Form
│      └── h = ReLU(β + Ωx)
│
└── Why Deep?
       ├── More Linear Regions
       ├── Depth Efficiency
       └── Structured Inputs
```

---

## 21. Chapter 4 最终总结

这一章真正需要带走的是：

> **1. Shallow 和 Deep 理论上都能逼近复杂连续函数，Deep 的优势主要是效率。**

> **2. Deep Network 本质是多个简单函数的 Composition。**

```text
x
↓
f1
↓
f2
↓
f3
↓
y
```

> **3. 每一层都在把上一层的 representation 转换成新的 representation。**

```text
Linear
↓
ReLU
↓
Linear
↓
ReLU
```

> **4. Folding 让后面的结构能够在多个原始 input regions 中重复使用。**

> **5. ReLU Clipping 会继续制造新的 joints 和 linear regions。**

> **6. 因此 Depth 可以用相对有限的 parameters 制造非常复杂的 piecewise linear functions。**

> **7. 某些函数用 Deep Network 表达比 Shallow Network 高效得多，这叫 Depth Efficiency。**

> **8. Deep Architecture 也非常适合图片等需要 Local → Global 多阶段 processing 的 structured data。**

---

## 22. 一句话记住 Chapter 4

> **Shallow Network 主要靠增加 hidden units 去“拼”复杂函数；Deep Network 则让这些简单函数一层层组合、折叠和复用，因此能更高效地制造复杂函数。**

再压缩：

```text
Chapter 3：
靠 Width 增加复杂度

Chapter 4：
靠 Depth + Composition 高效增加复杂度
```

而我们现在还有一个最大的问题没有解决：

```text
这些 weights 和 biases
到底怎么学出来？
```

接下来就是：

```text
Chapter 5：Loss Function
↓
衡量模型到底错了多少

Chapter 6：Optimization
↓
怎么修改 Parameters

Chapter 7：Backpropagation
↓
怎么高效计算所有 Gradients
```

于是 Deep Learning 的主线开始完整：

```text
Model
↓
Loss
↓
Optimization
↓
Training
```
