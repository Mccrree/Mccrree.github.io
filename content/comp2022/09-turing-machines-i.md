# Turing Machines

图灵机

理解 Tape、Head、State 的作用

能读取 Morphett 五字段转移规则

理解 \_ 和 \* 在不同位置的含义

能跟踪 TM 每一步修改后的纸带

区分 Recogniser、Decider、无限循环

能用标记法设计简单 ™

理解 ww 与 Multi-track 的设计思路

会读 Configuration

## 1 什么是图灵机：

图灵机有三个核心部分：

- Tape（纸带）： 很长的格子，每个格子存一个符号，未使用的格子是 \_。

- Head（读写头）： 指向一个格子，每一步可以读取、写入、向左或向右移动。

read() Return the character (in the cell) under the pointer.

write(c) Write character c (in the cell) under the pointer.

move(d) Move one cell left, or right, or stay

- State（状态）： 记录机器现在正在做什么，决定下一步的操作。

1.1 为什么图灵机被设计出来：

如果你是图灵 你如何去创造一个能自己按照规则做事的机器？

人类做计算时，是不是可以把整个过程拆成一条条非常简单的规则，让机器机械地执行？

1得让机器在哪做吧？ tape

2 得让机器能修改吧 pointer

3状态：用来记住目前做到哪一步。state

4规则：告诉机器下一步怎么办。

### Q**我现在想问你一个关键问题 为什么state重要？**

假设图灵机的任务是：

输入：000

目标：100

也就是只修改第一个 0。

机器修改完第一个 0 之后，为什么需要切换 State，而不是继续留在原来的 State？

你试着用自己的话回答，不需要专业术语。

A：这里只想修改第一个字符 如果没有state转变话 那么会默认把第二个也转化为1的

这里的state转变相当于把0转变到1变成 0不转变为1

### 1.2 Morphett Notation莫菲特记谱法

A Turing Machine can be specified by a list of transition rules

TM的核心语法

![图灵机笔记配图 1](image5.png)

![图灵机笔记配图 2](image7.png)

#### 1.2.1 test:

题目： q 1 0 L p 代表什么？

读到 1，写入 0，向左移动，进入 p

读到 0，写入 1，向右移动，进入 p

读到 1，保持不变，向左移动，进入 q

A:正确。顺序是：当前状态、读取、写入、移动、新状态。

#### 1.2.2 test2

把二进制字符串中的 0 全部变成 1，把 1 全部变成 0。

![图灵机笔记配图 3](image3.png)

### 1.3 Morphett 图灵机模拟器里，\*（星号 ）是什么意思？

- \_ **= 纸带上的一个空白格（Blank）**，它是一个真正可以读取或写入的符号。

- \* **= 一个特殊指令**，具体什么意思，要看它出现在规则的哪个位置。

\_ **= 纸带上的一个空白格（Blank）例如q \_ 1 R q → 遇到空格，写入 1，右移，继续运行**

``` text
q 1 _ R q
```

``` text
q 1 _ R q
```

**这里是 读取 1 写入_空白 所以1变成0**

注意！！！关键是：\* 出现在不同位置，意思完全不同。

Morphett 的每条规则有 5 个部分：

``` text
q0 0 1 r q1
```

| **位置** | **意思**             |
|----------|----------------------|
| q0       | 当前 State           |
| 0        | 当前 Head 看到的字符 |
| 1        | 把当前字符改成什么   |
| r        | Head 向右移动        |
| q1       | 下一步进入哪个 State |

大白话：

> 我现在处于 q0，看到 0，就把它改成 1，往右走一步，然后进入 q1。

#### 1.3.1第一种：\* 出现在 Current Cell else!!!

``` text
q0 * 1 r q0
```

这里的 \* 意思是：

如果当前字符没有其他专门的规则，就执行这一条。

你可以理解为else:

我们假设一个TM设定为

``` text
q 0 0 R q ← 第一条
```

``` text
q * 1 R p ← 第二条
```

可以这样用python表达：

``` python
if char == "0":
    print("第一条")
else:
    print("第二条")
```

相当于是除了0的情况以为 其他情况都这么(q \* 1 R p )处理

#### 1.3.2 第二种：\* 出现在 New Cell 

例如： q0 0 \* r q1 这里的意思是 **不要修改当前字符**。

#### 1.3.3如果是 同时出现呢？q0 \* \* r q0

``` text
q0 * * r q0
```

怎么理解呢？

第一个 \*：

> 看到任何没有专门规则处理的字符。

第二个 \*：

> **保留原来的字符，不修改。**

所以整条规则就是：

在 q0，遇到没有专门规则的字符，就不修改它，向右移动，继续留在 q0。

相当于是遇到了else其他情况的字符后 读写part不用进行修改

### 1.4什么是Recogniser 和 Decider 

有没有哪个输入会让图图永远不下班？有，它就只是 recogniser；一个都没有，它就是 decider

你去面试，公司心里有一份「该录取的人的名单」，这就是 L。

🏢 A 公司（Recogniser，识别者）

名单上的人：一定给你发 offer ✅

名单外的人：有时发拒信 ❌，有时永远不回（已读不回）⏳

🏢 B 公司（Decider，判定者）

名单上的人：一定发 offer ✅

名单外的人：一定发拒信 ❌

每个人都会收到回复，不会让你干等

两个关键词：

「M recognises L」 = 收到 offer 的人，正好就是名单上的那些人。 A 公司和 B 公司都做到了这一点。

「M decides L」 = 做到上面那一点，而且对每个人都会回复。只有 B 公司做到了。

所以「decidable 一定是 recognisable 吗？」是的，因为 B 公司也满足「offer 正好发给名单上的人」，它只是比 A 公司更靠谱一点。

为什么这两个被设计出来：为了区分哪些问题只能保证找到 YES 答案（Recogniser），哪些问题能保证在有限时间内判断 YES 或 NO（Decider），从而研究计算机的能力极限

一个程序有三种可能性：

![图灵机笔记配图 4](image1.png)

#### **1. Recogniser（识别器）**

你可以理解为：

我只保证识别出属于这个语言的字符串。

- w ∈ L → 一定 Accept。

- w ∉ L → 可以 Reject，也可以一直 Loop（永远不停止）。

也就是说，Recogniser 不保证对所有输入都给出答案。

#### **2. Decider（判定器）**

你可以理解为：

我不仅要识别，还必须判断每个输入到底属不属于这个语言。

- w ∈ L → 一定 Accept。

- w ∉ L → 一定 Reject。

Decider 不允许无限 Loop，因为它必须对每个输入给出明确答案。

Recogniser： 遇到 YES 一定会停并接受，遇到 NO 可能无限循环；

Decider： 无论 YES 还是 NO，都保证在有限时间内停止并给出正确答案。

Decider 本身也是一种 Recogniser，只是要求更严格。

![图灵机笔记配图 5](image2.png)

#### **1. Recogniser（识别器）**

机器从左到右找 1。

输入：0010

↓

找到 1 → Accept ✅

但是如果输入：

输入：0000

↓

找不到 1

↓

可能永远循环 ♾️

Recogniser 的保证是：如果答案是 YES，它一定会最终 Accept；如果答案是 NO，它可以 Reject，也可以永远循环。

#### **2. Decider（判定机）**

还是同一个任务，但机器的规则变了。

输入：0010

↓

找到 1 → Accept ✅

输入：0000

↓

检查完所有字符

↓

没有 1 → Reject ❌

Decider 的保证是：无论 YES 还是 NO，都必须正确回答，而且一定停止。

### 1.5同一台图灵机（Turing Machine），三种不同详细程度来描述

#### **① High-level Description 只说明算法要做什么（What）**

写算法总体步骤，不涉及 Tape / Head

like COMP2123

#### **② Implementation Description**

实现描述：说明机器具体怎么做（How）解释如何移动 Head、标记 Tape，以及如何记录信息

#### **③ Formal Description**

形式化描述：把每一步具体写出来

写 State、Transition，或画状态图

![图灵机笔记配图 6](image4.png)

High-level = What to do（做什么）

Implementation = How to do it（具体怎么操作纸带和读写头）

Formal = Exact rules（逐条写出状态转换）

### 1.6具体的example

![图灵机笔记配图 7](image6.png)

1\. High-level description: check no 0 is after a 1, and check the

number of 1’s is equal to the number of 0’s, and that this

number is at least one.

2\. Implementation-level description:

2.1 Match leftmost 0 with leftmost 1, replace 0 by X and 1 by Y

(so the TM doesn’t lose its place), and repeat.

2.2 If a 1 cannot be found in this way, reject (more 0s than 1s)

2.3 If a 0 cannot be found in this way, go to the end and check

there are no more characters

3\. Formal description:

``` text
; This example program checks if the input is of the form 0^n1^n for n >= 1
; replace 0 by X and look for matching 1 
; but if Y is seen, go for endgame
q0 0 X R q1
q0 Y Y R q3
; skip over 0's and Y's until 1 is found 
; replace it by Y and start heading back to left
q1 0 0 R q1
q1 Y Y R q1
q1 1 Y L q2
; move left skipping 0's and Y's until the first X is found
; move right to look for leftmost 0
q2 Y Y L q2
q2 0 0 L q2
q2 X X R q0
; endgame
; make sure there are no extra 1's or 0's
q3 Y Y R q3
q3 _ _ * halt-accept
q3 0 0 * halt-reject 
q3 1 1 * halt-reject
```

### 1.7 符号：数学符号翻译表

🔧 补课 1：数学符号翻译表

考试题全是这种写法，先把它们翻成大白话：

| 符号 | 大白话 | 图图世界 |
| --- | --- | --- |
| M | 某一台图灵机 | 某一个图图（加上它的说明书） |
| w | 一个输入字符串，比如 0110 | 递给图图的一道题 |
| L | 一个语言，也就是一堆字符串组成的集合 | 一份「正确答案名单」 |
| w ∈ L | w 在这个集合里 | 这道题在名单上 |
| w ∉ L | w 不在这个集合里 | 这道题不在名单上 |

1.8

**Q4（拍下一张快照）**

当前格局是 01q10，规则是 q 1 0 l p。写出下一个格局。

相当原本是 0110，q 就插在两个 1 之间」

``` text
照片：      0   1   q   1   0
                    🚩
真实纸带：   0   1   1   0       ← 只有 4 格，q 不占格子
                   ↑
                  图图站在这里
q 1 0 l p
```

第 5 栏换成 p，意思就是：**从下一步开始，图图要去查第 1 栏是 p 的那些规则。**

下个规则开头是p的得是

### Q5 还有个问题如果是无限输入呢 那岂不是一直停不下来了》这也是decider吗 还是说只有理论上有尽头 然后每个尽头都有停止规则就行了？

**答案：不存在「无限长的输入」**

在图灵机的世界里，**输入字符串永远是有限长的**，这是定义规定的。

**纸带是无限的，但题目不是。**

``` text
... _ _ _ [0 1 0 0] _ _ _ _ _ _ ...
          └ 输入 ┘  └ 后面全是空白，无限延伸 ┘
```

- 格子路（tape）两头无限长 ✔

- 但出题人只在其中**一小段**上写了题目（输入），其他格子全是 \_

- 所以图图往右走，**一定**会在某个时候踩到空白

Week 9 tutorial 的官方答案里也是这么说的：*「Every input is finite, so A eventually reaches the first blank」*。

#### **⚠️ 别混淆：「无限多个输入」 vs 「无限长的输入」**

|                      | **存在吗？** | **例子**                          |
|----------------------|--------------|-----------------------------------|
| **无限多个**输入     | ✅ 存在      | 0、00、000、0000……要多长有多长    |
| **无限长的**一个输入 | ❌ 不存在    | 000000…（没有尽头），这不算字符串 |

用面试来比喻：

- 来应聘的人有**无穷多个**

- 但**每个人的简历都是有限页**，再厚也有最后一页

- B 公司（decider）要做到的是：**对每一个人，都在有限的时间里回复**。简历越厚可以看得越久，但总会看完，总会回复

### 1.8 一些专有名词

1

its computation is rejecting, i.e., ends in a rejecting state.

rejecting：拒绝

its computation is diverging, i.e., never reaches a rejecting or accepting state (and so is infinite).

diverging：发散 / 不停机 是一种情况不是状态

> 请你将这里和前面的题总结为测试卡牌呢放到 这里[<u>https://mccrree.github.io/comp2022/</u>](https://mccrree.github.io/comp2022/) q4.2 这里写答案地方 还得提一句a^+ 和a^\*的区别我怕到时我又忘了
