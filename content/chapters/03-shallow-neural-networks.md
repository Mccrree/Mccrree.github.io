# Shallow Neural Networks

## 从一条直线，到能够逼近复杂函数的神经网络

在 Chapter 2，我们已经建立了 supervised learning 最基本的框架：

$$
x \rightarrow f(x;\phi) \rightarrow \hat y
$$

模型根据 input $x$ 得到 prediction $\hat y$，再通过 Loss 判断预测得有多差，最后通过 Training 调整 parameters。

但 Chapter 2 使用的是最简单的 Linear Regression：

$$
y = wx+b
$$

问题也非常明显：

> **一条直线只能描述非常简单的 input → output relationship。**

如果真实关系是一条复杂的曲线，无论怎么调整 $w$ 和 $b$，一条直线都不可能很好地描述它。

所以 Chapter 3 开始解决一个新的问题：

> **怎样让模型从只能画“一条直线”，升级成能够表示复杂函数？**

这就是 **Shallow Neural Network（浅层神经网络）**。

---

## 1. 从 Linear Regression 到 Neural Network

Chapter 3 一开始给出的神经网络可以理解成：

$$
x
\rightarrow
\begin{cases}
h_1 \\
h_2 \\
h_3
\end{cases}
\rightarrow y
$$

每个 hidden unit 都进行类似的计算：

$$
h_d=\operatorname{ReLU}(w_dx+b_d)
$$

所以一个 hidden unit 的完整过程其实非常简单：

$$
\boxed{x\rightarrow wx+b\rightarrow ReLU\rightarrow h}
$$

其中：

- $w$：weight
- $b$：bias
- $h$：hidden unit 的 activation

例如：

$$
h_1=\operatorname{ReLU}(w_1x+b_1)
$$

$$
h_2=\operatorname{ReLU}(w_2x+b_2)
$$

$$
h_3=\operatorname{ReLU}(w_3x+b_3)
$$

然后 output layer 再把这些 hidden units 加权组合：

$$
y=b_{out}
+w_1^{out}h_1
+w_2^{out}h_2
+w_3^{out}h_3
$$

也就是说：

> **Hidden layer 先制造很多不同的小函数，Output layer 再把这些结果组合成最终的 mapping。**

---

## 2. ReLU 为什么这么重要？

ReLU 的定义非常简单：

$$
\operatorname{ReLU}(z)=\max(0,z)
$$

也就是：

$$
z<0\Rightarrow0
$$

$$
z\geq0\Rightarrow z
$$

假设：

$$
h=\operatorname{ReLU}(wx+b)
$$

原本：

$$
wx+b
$$

只是一条普通直线。

经过 ReLU 后，负数部分会直接变成 0。

于是一个很关键的东西出现了：

> **kink / joint（拐点）**

也就是说，一个 hidden unit 不只是提供一条普通直线，它可以在某个位置让最终函数的 slope 发生改变。

---

## 3. Hidden Unit 并不等于“最终的一段线”

这里很容易产生一个误解：

$$
w_1^{out}h_1
$$

并不是说：

> “$h_1$ 就负责最终曲线中的第一段线。”

更准确的理解是：

> **每个 hidden unit 更像一个可以在某个位置产生“拐弯效果”的组件。**

例如：

$$
h_1
$$

可能从 $x=0.3$ 开始 active；

$$
h_2
$$

可能从 $x=0.8$ 开始 active；

$$
h_3
$$

可能从 $x=1.4$ 开始 active。

最后：

$$
y=b_{out}
+w_1^{out}h_1
+w_2^{out}h_2
+w_3^{out}h_3
$$

把它们全部叠加。

所以最终某一个 linear region，可能同时受到：

$$
h_1+h_2
$$

甚至：

$$
h_1+h_2+h_3
$$

共同影响。

因此更好的理解是：

> **Hidden units 提供“折线积木”，Output layer 把这些积木加权组合，最终形成整个 piecewise linear function。**

---

## 4. 不同的 $x$，为什么会进入不同的 Linear Region？

当真正使用模型进行 inference 时，我们只输入：

$$
x
$$

模型内部会依次计算：

$$
w_dx+b_d
$$

然后经过：

$$
ReLU
$$

某些 hidden units 可能：

$$
h_d=0
$$

也就是 **inactive**。

另一些可能：

$$
h_d>0
$$

也就是 **active**。

例如某个输入 $x$ 可能产生：

$$
h_1>0,\qquad h_2=0,\qquad h_3>0
$$

换一个 $x$，可能变成：

$$
h_1>0,\qquad h_2>0,\qquad h_3=0
$$

所以：

$$
\boxed{
不同的x
\rightarrow
不同的ReLU\ activation\ pattern
\rightarrow
不同的linear\ region
}
$$

程序实际上并不会真的执行：

> “我要找一下这个 $x$ 属于第几条线段。”

它只是正常计算 ReLU。

**哪些 hidden units 被打开、哪些被关闭，自然就决定了当前处于哪个区域。**

---

## 5. Hidden Units 越多会发生什么？

假设只有三个 hidden units：

$$
h_1,h_2,h_3
$$

最终只能制造有限数量的 kink。

但如果变成：

$$
h_1,h_2,\dots,h_D
$$

我们就可以制造更多 kink。

所以原来的：

$$
y=
b+
w_1h_1+w_2h_2+w_3h_3
$$

可以写成更加通用的形式：

$$
\boxed{
y=b+\sum_{d=1}^{D}w_dh_d
}
$$

这里的求和符号 $\sum$ 没有什么新的神秘知识。

它只是：

$$
w_1h_1+w_2h_2+\cdots+w_Dh_D
$$

的简写。

作者之所以在这里把 3 个 hidden units 推广成 $D$ 个，是为了问接下来的一个重要问题：

> **如果 hidden units 足够多，这个网络到底能有多强？**

---

## 6. Universal Approximation Theorem

这就引出了 Chapter 3 最重要的理论之一：

### Universal Approximation Theorem（通用逼近定理）

它的核心意思可以先理解成：

> **只要 hidden units 足够多，一个只有一个 hidden layer 的网络，也能够把连续函数逼近到任意精度。**

---

### 6.1 为什么 Hidden Units 足够多就能逼近复杂函数？

这里的直觉和微积分特别像。

假设真实函数是一条光滑曲线。

我们可以先用几段直线进行粗略 approximation。

如果不够准确，就继续把曲线切得更细。

于是：

$$
\text{更多 hidden units}
$$

↓

$$
\text{更多 kinks}
$$

↓

$$
\text{更多 linear regions}
$$

↓

$$
\text{piecewise linear function 更加细致}
$$

↓

$$
\text{更接近目标 continuous function}
$$

所以 Universal Approximation 的核心直觉可以压缩成：

$$
\boxed{
\text{把复杂曲线切得足够细}
\Rightarrow
\text{很多简单小线段也能逼近它}
}
$$

而 ReLU hidden units 正好提供了制造这些“小线段”的能力。

---

### 6.2 这和微积分有什么关系？

它不是在做积分，但使用了非常类似的思想：

> **把复杂问题切成很多非常小、非常简单的局部。**

例如积分：

$$
\text{复杂曲线下面积}
\rightarrow
\text{切成很多小块}
\rightarrow
\text{越来越准确}
$$

这里：

$$
\text{复杂连续函数}
\rightarrow
\text{切成很多小区间}
\rightarrow
\text{每一段用直线近似}
\rightarrow
\text{越来越准确}
$$

所以它的核心直觉就是：

$$
\boxed{
\text{切得越细}
\Rightarrow
\text{逼近越准确}
}
$$

---

### 6.3 Universal Approximation 不代表“训练一定成功”

这个区别非常重要。

这个定理说的是：

> **存在一组 weights 和 biases，可以做到。**

它并没有保证：

- Gradient Descent 一定找得到它
- 数据一定足够
- 模型一定不会 overfit
- Test data 上一定表现好

因此：

$$
\boxed{
\text{Representational Ability}
\neq
\text{Training Success}
}
$$

Universal Approximation Theorem 证明的是：

> **网络“有能力”表示复杂函数。**

至于能不能真的训练出来，是后面章节要解决的问题。

---

## 7. 一个 Hidden Layer 已经够了，为什么还需要 Deep Network？

Universal Approximation Theorem 很容易造成一个误解：

> 既然一个 hidden layer 已经可以逼近任何连续函数，那为什么还需要很多层？

因为：

$$
\boxed{
\text{一层够用}
\neq
\text{一层最好}
}
$$

“一层足够”只是回答：

> **理论上能不能做到？**

答案是：

> 可以。

但它没有回答：

> **需要多少 hidden units 才能做到？**

某些复杂函数如果只使用一个 hidden layer，可能需要非常大量的 hidden units。

Deep Network 的思想则是：

> **前一层先构建简单 feature，后一层再组合这些 feature，逐层形成复杂 representation。**

这正好为 Chapter 4 的 **Deep Neural Networks** 埋下伏笔。

---

## 8. 从一个 Input 扩展到多个 Inputs

前面的例子只有：

$$
x\rightarrow y
$$

但现实世界中通常会有很多 input features。

例如房价模型：

$$
x=
[
\text{面积},
\text{房龄},
\text{卧室数量},
\dots
]
$$

所以现在输入变成：

$$
\mathbf{x}=
[x_1,x_2,\dots,x_{D_i}]
$$

一个 hidden unit 原本是：

$$
h=\operatorname{ReLU}(wx+b)
$$

现在只是升级成：

$$
h=
\operatorname{ReLU}
(
w_1x_1+w_2x_2+\cdots+w_{D_i}x_{D_i}+b
)
$$

核心机制完全没变：

> **每个 input 乘自己的 weight → 全部加起来 → 加 bias → ReLU。**

---

## 9. 从 Kink 到 Hyperplane

有多个 input 后，之前的“拐点”也会升级。

假设一个 hidden unit 在 ReLU 之前计算：

$$
z=w^Tx+b
$$

ReLU 的状态切换发生在：

$$
\boxed{
w^Tx+b=0
}
$$

这里就是 active / inactive 的边界。

---

### 9.1 1D Input

如果只有一个 input：

$$
x_1
$$

边界是一个：

**point**

---

### 9.2 2D Input

如果 input 是：

$$
(x_1,x_2)
$$

边界是一条：

**line**

---

### 9.3 3D Input

如果 input 是：

$$
(x_1,x_2,x_3)
$$

边界是一个：

**plane**

---

### 9.4 更高维 Input

更高维统一称为：

**hyperplane**

所以可以记成：

$$
\boxed{
point
\rightarrow
line
\rightarrow
plane
\rightarrow
hyperplane
}
$$

Hyperplane 并不是什么“允许输出的范围”。

它只是：

> **一个 ReLU hidden unit 在高维 input space 里面切出来的分界面。**

一侧：

$$
w^Tx+b>0
$$

ReLU：

**active**

另一侧：

$$
w^Tx+b<0
$$

ReLU：

**inactive**

---

## 10. 多个 Hidden Units = 不断切割 Input Space

有一个 hidden unit：

> 在 input space 中切一刀。

有很多 hidden units：

> 切很多刀。

例如二维 input space：

```text
          x₂
          ↑
      A   |   B
----------+----------→ x₁
      C   |   D
```
