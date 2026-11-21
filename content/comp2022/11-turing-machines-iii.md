# Turing Machines

**WEEK11**

这周的主题是 **计算复杂度（Computational Complexity）和非确定性图灵机（Nondeterministic Turing Machines）**

**一句话概括：Week 9–10 研究计算机能不能解决问题，Week 11 开始研究解决问题需要多少时间，以及为什么有些问题很难高效解决**

**Time Complexity**

**P**

**DTM vs NTM**

**Computation Tree \+ BFS**

**NP \+ CLIQUE \+ SUBSET-SUM**

**P vs NP vs EXP**

## 1. Time Complexity — 时间复杂度

### 1.1 什么算一个计算步骤（Step）？

**Step 就是机器执行的一次基本操作。**

但不同计算模型对 Step 的规定不一样。

**Python / Pseudocode**

在课程使用的伪代码分析约定下：

```
x = 5          # 赋值
x = x + 1      # 数学运算与赋值
if x > 3:      # 比较
    x = 10

```

这些都涉及可以计数的基本操作。Lecture 还列出了布尔运算。

注意：这是算法分析中的简化模型，不意味着实际 CPU 每条代码都只执行一条机器指令。

**Turing Machine**

对于 TM，规则更简单：

**每执行一次 Transition（状态转换）就算 1 Step。**

例如：

```
q0  0  X  R  q1
```

表示：

1. 当前 State 是 q0，读到 0。
2. 将 0 改写为 X。
3. 读写头向右移动。
4. 状态更新为 q1。

虽然看起来完成了几个动作，但是整个 Transition 只算 **1 Step**。

### 1.2 什么是输入长度 n？

一句话：**n 表示输入字符串的长度，不是字符串的具体内容**

例如：

| 输入字符串 | n |
| ----- | ----- |
| `0` | 1 |
| `01` | 2 |
| `0011` | 4 |
| `000111` | 6 |
| `00001111` | 8 |

如果给 TM 输入：

```
0011
```

那么 n \= 4。

### 1.3 为什么需要 n？

因为我们想知道输入从 10 个字符变成 1000 个字符时，算法需要执行多少步。

例如，一个算法读取字符串中的每个字符一次：

* 输入 10 个字符，大约需要 10 次操作。
* 输入 100 个字符，大约需要 100 次操作。
* 输入 1000 个字符，大约需要 1000 次操作。

我们就说它的时间复杂度是 Θ(n)。

这里先记住：**n 增大，算法工作量如何增长，才是复杂度真正研究的内容**

### 1.4 什么是 Worst-case Time Complexity？

**在所有长度相同的输入中，找出让机器执行步骤最多的情况。**

### 1.5 Polynomial Time（多项式时间）

这一节最重要的是分清楚：**Polynomial 和 Exponential。**
![Week 11 配图 1](image1.png)
**只要能用某个固定次数的 n 的幂作为时间上界，就属于 Polynomial Time；**
例如

O(1) → Polynomial Time ✅ 这里是常数时间，可看作 n⁰

O(n²) → Polynomial Time ✅ 指数是固定常数 2

O(n¹⁰⁰) → Polynomial Time ✅ 指数是固定常数 100

Θ(2ⁿ) → 不属于 Polynomial Time ❌ 这里的 n 出现在指数位置，增长快于任何固定次数的多项式

**如果确定性 TM 能用这样的时间解决一个问题，这个问题就属于 P**

补充理解：仅知道运行时间是 O(2ⁿ)，不能排除它也有多项式上界；这里的非多项式例子指 Θ(2ⁿ) 的增长。指数时间还包括其他形式，并不只指 2ⁿ。

### 1.6 例子：为什么逐轮配对的单带 TM 需要 Θ(n²) 时间？

待补：原稿尚未展开本节。这里讨论的是具体的逐轮配对算法，n 表示整个输入的长度。

## 2. Class P — P 类问题

Slides 9–10

### 2.1 P 的正式定义

**Class P 本质上就是一个「问题的集合」**

Define P to be the collection of languages L that are **d**ecidable in polynomial time on deterministic TMs.
**所有能被确定性图灵机（DTM）在多项式时间内判定的语言**

### 2.2 哪些问题属于 P？

![Week 11 配图 2](image2.png)

### 2.3 Regular Language、Context-Free Language（CFL）和 P 的关系

**Regular Language 和 Context-Free Language 都属于 P，但 P 不只有这两种语言。**

还是上面的图 所有的RL和 CFL都属于class p

### 2.4 为什么 P 通常被认为是能高效求解的一类问题？

**P 被认为高效，是因为它能在多项式时间内解决问题，随着输入增长，通常比指数时间更容易控制计算成本**

P is considered efficiently solvable because its problems can be decided in polynomial time, which generally scales better than exponential time

## 3. Nondeterministic TM — 非确定性图灵机

Slides 11–17

### 3.1 DTM 与 NTM 的区别

这一节可以直接联系之前学过的 **DFA 和 NFA**。

**一句话核心：DTM 每一步只有一种确定的操作，NTM 每一步可以有多种合法选择，形成不同的计算分支。**

**先回忆 TM 的一次 Transition：**

```
q0 a b R q1
```

**而DTM deterministic确定的(adj(后面接名词))  意思是下一步是确定的 只能有一种确认操作**

**而NTM nondeterministic 不确定的 意思是下一步是非确定的 有很多种操作**

在相同 State 和读取字符下，可以有多个 Transition。

例如 Lecture 给出的：

```
q a b R s
q a a L t
```

### 3.2 为什么 NTM 可以同时存在多种下一步选择？

这里设计很像tree graph branch node

**NTM 特别适合描述「可能的答案有很多种，但只要猜中一个，就能很快验证是否正确」的问题**

### 3.3 Computation Tree（计算树）

一句话：**Computation Tree 就是把同一个输入可能产生的所有计算路径，画成树状结构**
![Week 11 配图 3](image3.png)

### 3.4 NTM 的 Accept / Reject 条件

A NTM N accepts input w if some branch of the computation tree of w has an accepting configuration.

**一句话：NTM 只需要一条分支 Accept，就能接受整个输入；但要让所有分支都正常 Reject，则每条分支都必须停机并拒绝。**

![Week 11 配图 4](image4.png)

![Week 11 配图 5](image5.png)

### 3.5 如果某条分支无限循环，会怎么样？

check branch we only need one branch to accept
哪怕有loop但是有一个接受就accept

| 分支情况 | 整体结果 | 原因 |
| ----- | ----- | ----- |
| Accept \+ Reject \+ Reject | Accept | 至少一条成功 |
| Accept \+ Reject \+ Loop | Accept | Loop 不影响已有的 Accept |
| Reject \+ Reject \+ Reject | Reject | 所有分支停机拒绝 |
| Reject \+ Reject \+ Loop | 不接受，但未全部停机 | 没有 Accept，且存在无限循环 |

## 4. NTM → DTM — 模拟与等价性

Slides 18–25

### 4.1 为什么任何 NTM 都有等价的 DTM？

**Q既然 NTM 可以产生无数条计算分支，而 DTM 每次只能走一条路径，那 DTM 怎么可能模拟 NTM？**

A: DTM 用BFS**一条一条地模拟，并使用 BFS 保证不会遗漏能够 Accept 的分支**

**Q为什么使用BFS而不是DFS?**

A bfs是一层一层读取computation tree 的 如果使用dfs，dfs会优先先一个深处读取 万一这个深处是loop 那么这里可能无法抵达原本的accept的分支

BFS explores the computation tree level by level. DFS may get stuck in an infinite branch and never reach an accepting branch.

这也是 Lecture Self-test 的正确选项：

**Option 4: No, D might not reach an accepting configuration even if N can**

### 4.2 如何使用 3 tapes 模拟 NTM？ DTM到底是如何做到模拟NTM的

待补：原稿记录“没懂明天再看吧”，本节的三纸带模拟过程尚未展开。

### 4.3 Computation Tree Address（分支地址）

![Week 11 配图 6](image6.png)

**Question: What is the address of the right child of node 1?**

A 注意这里的英文 right child od node 1 这里的意思是node1 的右边子node地址是什么
所以答案是12

**Q:Suppose the computation tree of a NTM N on w has one branch**

that halt-rejects, one branch that diverges (i.e., doesn’t halt), and
all the rest halt-accept.
Does N accept w?
halt-accept: 停止并接受
halt-reject:停止并拒绝

A：yess NTM will be accepted if at least one branch is accepts

### 4.4 BFS 与 DFS 为什么不能随便替换？

DFS may stuck in an infinite branch and never reach an accepting branch

## 5. NTM Time Complexity & Class NP

这一节其实是把你之前学的两件事结合起来：

* **Time Complexity：** 一个计算过程需要执行多少步？
* **NTM：** 一台机器可以产生多个不同的计算分支。

现在教授提出一个新问题：

**如果 NTM 有很多条分支，我们到底应该怎么算NTM的时间复杂度？**

Slides 26–28

### 5.1 NTM 的时间复杂度怎么算？

**对于所有长度为 n 的输入和它们产生的所有计算分支，取最长的那一条所执行的步数。**

**举个例子**

假设 NTM 读取输入 `0011`，产生了三条分支：

![Week 11 配图 7](image7.png)

问：这次计算的时间是多少？

不是：

$3+5+2=10$

而是：

![Week 11 配图 8](image8.png)

**因为 NTM 的时间复杂度看最长分支，不是把所有分支的步骤加起来。**

### 5.2 NTM Decider 的条件

decider还是必须所有回复 accept和reject 不允许出现divergence
**NTM Decider 的核心条件：不允许任何 Branch 出现 Divergence（无限循环）**

> An NTM is a decider if on every input, every branch of its computation tree halts.

大白话：**无论输入什么，所有分支最终都必须停机（Halt-Accept 或 Halt-Reject）**

### 5.3 NP 的正式定义

！！！大师我悟了 NP 是 Nondeterministic Polynomial Time 不是 not polynomial

相当于我们已经**证明了 dtm和ntm他们解决问题能力是等价的** 但是我们还没能证明 **NTM 能在多项式时间内解决的问题，DTM 是否也能在多项式时间内解决？** 他们解决问题的时间是否是等价的

**NP 是所有能够被 NTM（非确定性图灵机）在 Polynomial Time（多项式时间）内判定的语言集合。**

Define NP to be the collection of languages L that are decidable in polynomial time on nondeterministic Turing machines.

我们把它拆开：

| 关键词 | 大白话解释 |
| ----- | ----- |
| **Collection of languages** | 一组语言，也就是一组判定问题 |
| **Nondeterministic TM** | 允许多个计算分支的图灵机 |
| **Decidable** | 每个输入的所有分支都必须停机 |
| **Polynomial Time** | 每条分支的执行步数都有多项式上界 |

因此，证明一个语言属于 NP，需要找到一台 NTM，使它满足：

1. decidable： 没有divergence
2. polynomial：在多项式时间完成
3. on nondeterministic Turing machines.  在这NTM上完成


### 5.4 为什么 P ⊆ NP？

**Question: Why is P ⊆ NP?**

> Every DTM is a special case of an NTM. Therefore, every language decidable by a DTM in polynomial time is also decidable by an NTM in polynomial time.

中文：每台 DTM 都可以视为 NTM 的特殊情况，所以所有属于 P 的语言也都属于 NP

### 5.5 NP 为什么不是 Not Polynomial？

因为 **NP 的全称是 Nondeterministic Polynomial Time（非确定性多项式时间）**。

## 6. Examples of NP — NP 问题实例

这一章教授想告诉你：**我们已经知道 NP 的定义，那么实际遇到一个问题时，如何证明它属于 NP？**

**首先记住：DTM 和 NTM 是两种计算模型，不是两种具体算法。**

* **DTM：当前 State 和读取符号确定后，下一步操作最多只有一种。**
* **NTM：同样的当前条件，可以有多个合法 Transition，产生不同的计算分支。**

讲义使用两个例子：

* **CLIQUE：** 从一张 Graph 中找到符合条件的节点组合。
* **SUBSET-SUM：** 从一组数字中找到符合目标的数字组合

Slides 29–31

### 6.1 Graph 与 Clique 的定义

Clique（团）的定义是：

> A non-empty graph is a clique if every pair of different nodes is connected by an edge.

大白话：

**Clique 就是一组节点，其中任意两个不同节点都必须直接相连。**

例如：

```
       A
      / \
     B---C
```

这是一个 Clique，因为：

```
A — B ✓
A — C ✓
B — C ✓
```

### 6.2 CLIQUE 问题

**Input：** 一个 Graph `(V,E)` 和整数 `K ≥ 1`。

补充理解：选择的 K 个顶点必须互不相同；若 K 大于 |V|，直接拒绝。

**Output：** 如果图中存在 K 个节点能组成 Clique，则回答 Yes，否则回答 No。

例如刚才的 Graph：

```
V = {A, B, C, D}
E = {AB, AC, BC, AD}

K = 3
```

题目相当于：

**能不能从四个节点里面，找到三个两两直接相连的节点？**

答案是 Yes，因为 `{A,B,C}` 满足要求。

### 6.3 Show that CLIQUE is in NP.

6.3.1如何证明

1. correctness：证明NTM设计是对的
2. decider：证明这个是decidable的也就是each branch must be accept or reject
3. **Polynomial Time（多项式时间）在这个时间里面**

A:An NTM nondeterministically selects K vertices and checks whether every pair is connected by an edge. It accepts if they form a clique; otherwise, it rejects. Every branch halts in polynomial time. Therefore, CLIQUE is in NP.

**1. What is the CLIQUE problem?**

> CLIQUE asks whether a graph contains K vertices such that every pair of different vertices is connected by an edge.

**中文：** 判断一张 Graph 中是否存在 K 个节点，使它们两两直接相连。

**2. How does an NTM solve CLIQUE?**

> An NTM nondeterministically selects K vertices and checks whether every pair is connected by an edge. If yes, it accepts; otherwise, it rejects.

**中文：** NTM 非确定性地选择 K 个节点，并检查它们是否两两相连。全部相连则接受，否则该分支拒绝。

**3. Why is CLIQUE in NP?**

> An NTM can guess K vertices and check all pairs in polynomial time. Every branch halts, and the NTM accepts if and only if a K-clique exists. Therefore, CLIQUE is in NP.

**中文：** NTM 可以在多项式时间内猜测 K 个节点并检查所有节点对。每条分支都会停机，而且只有存在 K-Clique 时，整个 NTM 才接受。因此 CLIQUE 属于 NP。

**4. What happens if one branch accepts?**

> If at least one branch accepts, the entire NTM accepts the input, even if other branches reject.

**中文：** 只要至少一条 Branch 接受，整个 NTM 就接受输入，即使其他分支拒绝。

### 6.4 SUBSET-SUM 问题

| 可能的问题 | 回答重点 |
| ----- | ----- |
| What is SUBSET-SUM? | 找到一个子集，其总和等于 Target |
| How does an NTM solve SUBSET-SUM? | 非确定性选择子集，再验证总和 |
| Why is SUBSET-SUM in NP? | 正确性、所有分支停机、多项式时间 |
| What happens if one branch accepts? | 整个 NTM Accept |

**1. What is SUBSET-SUM?**

> SUBSET-SUM asks whether there is a subset of the given numbers whose sum equals the target.

**中文：** 判断是否存在一个数字子集，使其总和等于目标值。

**2. How does an NTM solve SUBSET-SUM?**

> An NTM nondeterministically selects a subset of the numbers and checks whether their sum equals the target. If yes, it accepts; otherwise, it rejects.

**中文：** NTM 非确定性地选择一个数字子集，检查总和是否等于目标值。相等则接受，否则该分支拒绝。

**3. Why is SUBSET-SUM in NP?**

> An NTM can guess a subset and verify its sum in polynomial time. Every branch halts, and the NTM accepts if and only if a valid subset exists. Therefore, SUBSET-SUM is in NP.

**中文：** NTM 可以在多项式时间内猜测并验证子集。所有分支都会停机，而且只有存在合法子集时，整个 NTM 才接受。因此 SUBSET-SUM 属于 NP。

补充理解：这里的时间要按整个输入的编码长度计算。数字用二进制表示时，加法也需要计算位操作；验证子集总和仍可在输入位数的多项式时间内完成。

**4. What happens if one branch accepts?**

> If at least one branch accepts, the entire NTM accepts the input, even if other branches reject.

### 6.5 如何用 NTM 证明这些问题属于 NP？

待补：原稿尚未填写本节。

核对参考（补充说明）：[MIT 18.404J 第 12 讲 Time Complexity](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/resources/lecture-12-time-complexity/)；[第 14 讲 P and NP](https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/resources/lecture-14-p-and-np-sat-poly-time-reducibility/)。
