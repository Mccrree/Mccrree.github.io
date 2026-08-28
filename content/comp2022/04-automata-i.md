# Automata

**COMP2022 Week 4：NFA —— 当自动机可以同时尝试多条路**

Week 3 我们学习了 **DFA（Deterministic Finite Automaton）**。

DFA 的核心规则是：

> 当前 state + 当前 input character，会唯一决定下一个 state。

例如：

```text
q1 --a--> q2
```

如果现在在 `q1`，读到 `a`，那么下一步一定是 `q2`。

这也是为什么它叫 **Deterministic**：

> 每一步都已经确定好了，没有选择。

Week 4 在 DFA 的基础上放宽了这个限制，引出了新的模型：

## NFA

NFA 全称：

**Nondeterministic Finite Automaton**

中文一般叫：

**非确定有限自动机**。

这周最核心的一句话是：

> DFA 每一步只能走一条路，而 NFA 每一步可以有很多条路；只要其中至少一条路最后成功，整个字符串就被接受。

---

## 1. 为什么要从 DFA 引出 NFA？

先回忆 DFA，DFA是只能有next state 换句话说：

**DFA 像固定导航。**\
你现在在路口，看到“红灯”就一定停，看到“绿灯”就一定走。也就是：

`当前情况 + 当前输入 → 唯一下一步`

**NFA 像同时考虑多条路线。**\
你到了一个路口，可以：

`走左边 OR 走右边 OR 坐公交`

只要其中**有一条路线最后能到学校**，就算成功。

**DFA = 每一步只有一个确定选择。**\
**NFA = 每一步可以保留多个选择，最后只要有一条路成功就行。**

假设：

```text
current state = q1
input = a
```

那么 DFA 要求：

```text
q1 --a--> q2   
```

只能有一个结果。

不能同时出现：

```text
        --> q2
       /
q1 --a
       \
        --> q3
```

因为这样就不知道：

```text
q1 + a
```

之后到底应该去 `q2` 还是 `q3`。

但 NFA 允许这种情况存在。

也就是说，在 NFA 中：

```text
current state + current input
```

不一定只对应一个 next state。

它可以对应：

```text
0 个 next state

1 个 next state

多个 next states
```

这就是 **nondeterminism**。

---

## 2. Nondeterministic 到底是什么意思？

这里的核心区别可以这样理解。

DFA：

```text
q1 --a--> q2
```

读到 `a` 后：

```text
只能去 q2
```

NFA：

```text
        --> q2
       /
q1 --a
       \
        --> q3
```

读到 `a` 后：

```text
可能去 q2
也可能去 q3
a：是上学时间
q2可能是bus
q3可能是train 
都有可能       每一步可以保留多个选择，最后只要有一条路成功就行
```

甚至可以没有对应的路：

```text
q1 + a
→ 没有 transition
```

所以 NFA 最大的改**变就**是：

> 一个 state 读到同一个 character，可以有多个选择。

---

## 3. 那到底应该选哪一条路？

这是 NFA 最容易让人困惑的地方。

假设：

```text
        a
     --> q2 → Reject
    /
q1
    \
     --> q3 → Accept
        a
```

输入：

```text
a
```

这里有两种可能的走法。

第一条：

```text
q1 --a--> q2
```

最后 Reject。

第二条：

```text
q1 --a--> q3
```

最后 Accept。

那么这个字符串到底是 Accept 还是 Reject？

答案是：

### Accept

因为 NFA 的规则不是：

> 所有路线都必须成功。

而是：

> 只要存在至少一条 accepting path，就 Accept。

也就是说：

```text
Reject
OR
Accept
```

最终结果是：

```text
Accept
```

---

## 4.如何理解NFA?

### Backtracking

你只有一个存档：

```
```

```
存档
↓
A路线
↓
到城堡
↓
读档
↓
B路线
↓
又到同一个城堡
```

你把“到城堡”这件事重复玩了两遍。

### NFA

你直接记录：

```
```

```
现在有两种可能：

{走过A路线, 走过B路线}
```

如果两条路线现在都到了同一个城堡：

```
```

```
{城堡, 城堡}
```

直接合并成：

```
```

```
{城堡}
```

然后从城堡继续一次就行。

所以可以把 NFA 记成：

> **不是现在立刻决定哪条路是对的，而是把可能的路都保留下来。**

换句话说

- NFA就是同时保留这些分支可能性 然后并行运算 如果他们有相同的结果就合并他们   
- NFA = 同时保留所有可能的 state，然后每读一个字符，让这些可能性一起向前更新；如果不同分支到达同一个 state，就合并成一个

这样想对于backtracking 避免了很多重复计算&#x20;

---

## 5. 一个经典例子：识别“以 a 结尾”的字符串

假设 alphabet：



```text
Σ = {a, b}
```

有一个 NFA：

```text
q1 --a,b--> q1

q1 --a--> q2(final)
```

注意：

在 `q1` 读到 `a` 时，可以：

```text
继续留在 q1
```

也可以：

```text
进入 q2
```

为什么这样设计？

因为机器不知道：

> 现在读到的这个 `a` 是不是字符串最后一个字符。

所以它可以同时保留两个可能性：

```text
可能这不是最后一个 a
→ 留在 q1

可能这就是最后一个 a
→ 去 q2
```

例如输入：

```text
aba
```

可以走：

```text
q1
 |
 a
 ↓
q1
 |
 b
 ↓
q1
 |
 a
 ↓
q2(final)
```

因此：

```text
aba
```

被接受。

这个 NFA 接受的就是：

> 所有以 `a` 结尾的字符串。

---

## 6. NFA 的“猜”不是真的魔法

有时候会说：

> NFA 可以“猜”哪条路是正确的。

但这里不要真的理解成：

```text
机器提前知道答案。
```

NFA 是一个数学模型。

更准确地说：

> 我们考虑所有合法的 computation paths。

例如：

```text
input = aba
```

某一步可能分叉：

```text
             q1
             |
             a
        ┌────┴────┐
        q1        q2
```

不同分支继续各走各的。

最后只要：

```text
有一条完整路径
```

到达：

```text
final state
```

输入就被接受。

所以更准确的大白话是：

> **NFA 不是赌一条路，而是把所有可能的路都考虑进去。**

---

## 7. 什么是 Run？

之前 DFA 里已经出现过这个词：

**run**

可以把它理解成：

> automaton 处理一个 input 时走过的一条完整路线。

例如：

```text
q1 --a--> q1 --b--> q2
```

这就是一个 run。

---

### DFA 的 run

对于 DFA：

```text
一个 input
↓
基本只有一条 run
```

因为每一步都只有唯一选择。

所以：

```text
这条 run 最后到 final
→ Accept

否则
→ Reject
```

---

### NFA 的 run

对于 NFA：

```text
一个 input
↓
可能有 0 条、1 条或很多条 runs
```

接受条件是：

```text
至少有一条 run 最后到 final state
→ Accept
```

所以最值得记的一句就是：

> **DFA 看唯一的那条 run；NFA 看有没有至少一条成功的 run。**

---

## 8. 可以把 NFA 的 Accept 理解成 OR

这是一个很好记的方法。

假设一个 input 有三条 run：

```text
Run 1 → Reject
Run 2 → Reject
Run 3 → Accept
```

那么：

```text
Reject OR Reject OR Accept
```

结果：

```text
Accept
```

所以 NFA 实际上是在问：

> 有没有至少一种走法可以成功？

只要答案是：

```text
Yes
```

就 Accept。

---

## 9. 为什么 NFA 不能直接交换 final state 做 Complement？

Q: Can we complement the language of NFAs by swapping final and

non-final states like we did for DFAs?

我们能否像对 DFA 那样，通过交换最终状态和非最终状态来完善 NFA 的语言？

之前 DFA 学过一个很方便的操作：

如果想得到 DFA language 的 complement：

> 把 final state 和 non-final state 交换。

例如原本：

```text
Accept
```

交换以后：

```text
Reject
```

为什么 DFA 可以？

因为一个 input 只有一条 run。

---

但 NFA 不一样。

假设某个 input 有：

```text
Run 1 → Accept
Run 2 → Reject
```

原来的 NFA：

```text
Accept
```

因为至少有一条成功。

如果现在把 final / non-final 交换：

```text
Run 1 → Reject
Run 2 → Accept
```

结果：

```text
还是 Accept
```

所以并没有得到 complement。

根本原因是：

```text
NFA Accept
=
存在至少一条成功路线
```

而 complement 应该表示：

```text
不存在任何成功路线
```

这两个逻辑不是简单交换 final state 就能完成的。

---

## 10. Epsilon Transition：不用读字符也能移动

aka:1.如何表达 or? 2.Concatenation(字符串前半部分由 N1 处理，后半部分由 N2 处理），3.如何表达重复

接下来 NFA 又多了一个非常重要的东西：

### epsilon transition

写作：

```text
ε
```

例如：

```text
q1 --ε--> q2
```

它的意思是：

> 不读取任何 input character，也可以从 q1 移动到 q2。
>
> ε-transition 就是 NFA 里的“免费换路”：不消耗 input，就可以跳到另一个 state。

普通 NFA 分支： 读到某个字符以后 → 同时保留多个可能 state&#x20;

ε-transition： 甚至不用读字符 → 就可以先增加多个可能 state

---

## 11. 什么是 consume？

**Consume = 读掉当前一个输入字符。**

例如输入：

```
abb
```

走：

```
q1 --a--> q2
```

会读掉 `a`，剩下：

```
bb
```

而走：

```
q2 --ε--> q3
```

**不会读取任何字符**，所以输入仍然是：

```
bb
```

因此：

> **普通 transition = 读一个字符再走。**\
> &#x20;**ε-transition = 不读字符直接换 state。**

---

但是如果走：

```text
q2 --ε--> q3
```

那么：

```text
bb
```

还是：

```text
bb
```

没有消耗任何字符。

所以可以把 epsilon transition 记成：

> **免费移动。**

或者：

> **不读字符就换 state。**

---

## 12. 为什么 Epsilon Transition 很有用？

因为它让我们可以非常方便地把不同的 automata 拼起来。

回忆 Week 2 Regular Expression 有三个最重要的操作：

```text
R1 | R2
```

Union / Or

```text
R1R2
```

Concatenation

```text
R*
```

Star

NFA 加入 epsilon transition 后，这三个操作都变得非常容易实现。

---

## 13. Union：把两个 NFA 做成 OR

假设：

```text
N1
```

识别 Language 1。

```text
N2
```

识别 Language 2。

现在想得到：

```text
Language 1 ∪ Language 2
```

也就是：

```text
N1 OR N2
```

做法非常简单。

创建一个新的 start state：

```text
new start
```

然后：

```text
             ε → N1 start
           /
new start
           \
             ε → N2 start
```

也就是说：

> 一开始不用读取任何字符，就可以选择进入 N1 或 N2。

如果：

```text
N1 可以 Accept
```

或者：

```text
N2 可以 Accept
```

整个 NFA 就 Accept。

这正好就是：

```text
Union
```

---

## 14. Concatenation：先跑 N1，再跑 N2

现在假设我们想表示：

```text
N1N2
```

也就是：

> 字符串前半部分由 N1 处理，后半部分由 N2 处理。

做法：

```text
N1 final --ε--> N2 start
```

也就是：

```text
先在 N1 中运行
```

如果 N1 成功走到 final state：

```text
↓
通过 ε 免费进入 N2
↓
继续处理剩下的 input
```

同时：

```text
N1 原来的 final state
```

不能再作为整个机器的 final。

因为整个字符串还必须通过：

```text
N2
```

才算完成。

所以可以记成：

> **Concatenation = N1 跑完以后，用 ε 接到 N2。**

---

## 15. Star：如何实现重复 0 次、1 次、2 次……

回忆：

```text
A*
```

表示：

```text
A 重复 0 次
A 重复 1 次
A 重复 2 次
A 重复 3 次
...
```

所以设计 NFA 时要解决两个问题。

---

### 问题一：如何重复？

从原本的 final state：

```text
final --ε--> start
```

这样跑完一次以后：

```text
回到开头
```

就可以再跑一次。

所以：

```text
一次
↓
回去
↓
第二次
↓
回去
↓
第三次
...
```

---

### 问题二：0 次怎么办？

因为：

```text
A*
```

一定包含：

```text
ε
```

也就是：

> 什么字符都没有的空字符串。

所以创建一个新的 start state，并且让它自己就是 final：

```text
new start(final)
```

这样什么都不读：

```text
直接 Accept
```

就代表：

```text
重复 0 次
```

然后再加：

```text
new start --ε--> old start
```

如果想重复 1 次以上，就进入原来的 automaton。

因此 Star 可以记成：

> **final 用 ε 回到 start，负责重复；新的 final start 负责 0 次。**

---

## 16. Regular Expression 和 NFA 开始连接起来了

现在回头看 Week 2。

Regular Expression 的核心积木：

```text
Union
Concatenation
Star
```

而 Week 4 发现：

```text
NFA
```

也可以非常自然地实现：

```text
Union
Concatenation
Star
```

这就意味着：

> 我们可以按照 Regular Expression 的结构，一块一块把它变成 NFA。

Week 2 学的是“怎么描述一种字符串规则”；Week 3、4 学的是“怎么让一台机器去识别这种规则”。

---

## 17. 例子：(ab | a)\*

课件使用：

```text
(ab | a)*
```

演示如何一步一步构建 NFA。

不要死背最后那张复杂的图。

真正应该记的是：

> 构建顺序。

---

### Step 1：先做最小单位 a 和 b

对于：

```text
a
```

可以做：

```text
start --a--> final
```

对于：

```text
b
```

可以做：

```text
start --b--> final
```

---

### Step 2：构建 ab

因为：

```text
ab
```

是 Concatenation。

所以：

```text
a automaton
    |
    ε
    ↓
b automaton
```

得到：

```text
ab
```

---

### Step 3：构建 ab | a

这是 Union。

创建一个新的 start：

```text
              ε → ab
            /
new start
            \
              ε → a
```

得到：

```text
ab | a
```

---

### Step 4：构建 (ab | a)\*

最后应用 Star construction：

```text
新的 final start
```

允许：

```text
0 次
```

同时让原本的 final states：

```text
通过 ε 回到旧 start
```

从而允许：

```text
重复多次
```

所以整个构建过程就是：

```text
a
b
↓
ab
↓
ab | a
↓
(ab | a)*
```

这比直接面对最后那张复杂 NFA 图要容易理解很多。

---

## 18. NFA 比 DFA 更强吗？

目前我们至少知道：

> NFA 不会比 DFA 弱。

为什么？

因为 DFA 本身就可以看成一种特殊的 NFA。

只是这个 NFA：

```text
每个 state + character
```

恰好只有：

```text
一个 next state
```

所以：

```text
DFA
⊆
NFA
```

从表达能力角度看：

> 所有 DFA 能描述的 language，NFA 也都能描述。

后面的课程还会继续证明：

> NFA 并没有比 DFA 多出新的 language。

也就是说最后会得到：

```text
DFA 和 NFA
expressively equivalent
```

它们只是：

```text
写法和构造方便程度不同
```

---

## 19. Week 4B：为什么又要删除 Epsilon Transition？

epsilon transition 是为了方便“造 NFA”；remove epsilon 是为了证明它其实只是语法糖。

前面刚说：

```text
ε-transition
```

非常方便。

尤其适合：

```text
Union
Concatenation
Star
```

但是接下来，我们最终希望继续把：

```text
NFA
```

转成：

```text
DFA
```

所以课程先研究：

> 怎样把 epsilon transition 删除掉，同时保持 language 不变？

这里就引出了一个新概念：

### Epsilon Closure

---

## 20. 什么是 Epsilon Closure？

写作：

```text
EC(q)
```

意思是：

> 从 state q 开始，只走 0 个或多个 ε-transition，可以到达的所有 states。

例如：

```text
q1 --ε--> q2 --ε--> q3
```

那么：

```text
EC(q1) = {q1, q2, q3}
```

为什么 `q1` 自己也在里面？

因为定义允许：

```text
0 次 ε-transition
```

也就是说：

```text
q1
```

什么都不做，就可以到达：

```text
q1
```

所以永远有：

```text
q ∈ EC(q)
```

---

## 21. 大白话理解 EC(q)

可以直接记成：

> **EC(q) = 我站在 q，不花任何 input character，可以白嫖到的所有位置。**

例如：

```text
q1 --ε--> q2 --ε--> q3
```

站在 `q1` 时，虽然表面上 state 是：

```text
q1
```

但因为：

```text
q1 → q2
```

不要字符，

```text
q2 → q3
```

也不要字符，

所以实际上可以立刻到：

```text
q1
q2
q3
```

因此：

```text
EC(q1) = {q1, q2, q3}
```

---

## 22. 如何计算 EC(q)？

假设：

```text
q1 --ε--> q2
q2 --ε--> q3
q3 --ε--> q4
```

一开始：

```text
EC(q1) = {q1}
```

发现：

```text
q1 --ε--> q2
```

加入：

```text
EC(q1) = {q1, q2}
```

然后因为 `q2` 已经在 EC(q1) 中，而且：

```text
q2 --ε--> q3
```

继续加入：

```text
EC(q1) = {q1, q2, q3}
```

接着：

```text
q3 --ε--> q4
```

得到：

```text
EC(q1) = {q1, q2, q3, q4}
```

一直重复：

> 如果当前 EC(q) 里的某个 state 还能通过 ε 到新的 state，就把新的 state 加进去。

直到：

```text
没有新的 state 可以加入
```

算法结束。

---

## 23. 有了 EC(q)，怎么删除 ε-transition？

假设原来的 NFA 中有：

```text
q1 --ε--> q2 --a--> q3
```

从 `q1` 出发，其实可以：

```text
q1
↓ ε
q2
↓ a
q3
```

也就是说：

> 从 q1 的角度看，读取 a 实际上可以到 q3。

所以删除 ε 后，直接补：

```text
q1 --a--> q3
```

就可以保持原来的能力。

---

## 24. 删除 ε 的第一个规则：补 Transition

假设：

```text
r ∈ EC(q)
```

也就是说：

```text
q
↓ ε*
r
```

然后：

```text
r --a--> s
```

那么新 NFA 中加入：

```text
q --a--> s
```

大白话就是：

> **如果 q 可以免费走到 r，而 r 读 a 可以走到 s，那就让 q 直接读 a 去 s。**

这样就不再需要中间的 epsilon transition。

---

## 25. 删除 ε 的第二个规则：补 Final State

假设：

```text
q1 --ε--> q2(final)
```

原来的机器中：

```text
q1
```

虽然不是 final，

但是不读任何字符就可以：

```text
q1 --ε--> q2(final)
```

所以空字符串从 `q1` 出发是可以被接受的。

如果我们直接删除 ε：

```text
q1      q2(final)
```

那么这个能力就消失了。

因此规则是：

> 如果 EC(q) 中包含原来的 final state，那么新的机器中 q 也必须变成 final state。

例如：

```text
EC(q1) = {q1, q2}
```

而：

```text
q2 = final
```

那么：

```text
q1
```

也要设为 final。

---

## 26. 删除 ε-transition 的完整流程

所以整个过程其实只需要记两个核心规则。

### Rule 1：补普通 Transition

如果：

```text
q
↓ ε*
r
↓ a
s
```

那么加入：

```text
q --a--> s
```

---

### Rule 2：补 Final State

如果：

```text
EC(q)
```

里面存在 final state：

```text
q 也变成 final
```

最后：

```text
删除所有 ε-transition
```

就得到了一个：

```text
没有 ε-transition 的 NFA
```

并且它识别的 language 和原来一样。

---

## 27. 为什么还要证明 Epsilon Closure Algorithm 是正确的？

这里开始出现 COMP2022 很重要的一种思维：

不能只说：

> “这个算法感觉应该没问题。”

我们需要问三个问题。

---

### 1. 它会不会停？

会。

因为：

```text
NFA 的 state 数量是有限的
```

而算法每次只会：

```text
加入新的 state
```

state 总共就那么多个。

全部加完以后自然就不会再变化。

所以算法一定停止。

---

### 2. 会不会漏掉某些真正能到达的 state？

假设：

```text
q --ε--> p1 --ε--> p2 --ε--> r
```

一开始：

```text
q ∈ EC(q)
```

然后算法发现：

```text
q --ε--> p1
```

加入 `p1`。

接下来发现：

```text
p1 --ε--> p2
```

加入 `p2`。

再发现：

```text
p2 --ε--> r
```

加入 `r`。

所以只要确实可以通过 epsilon path 到达：

```text
最终就一定会被加入 EC(q)
```

---

### 3. 会不会把错误的 state 加进去？

也不会。

算法只有在：

```text
s ∈ EC(q)
```

而且：

```text
s --ε--> r
```

时，才把 `r` 加进去。

既然：

```text
q --ε*--> s
```

而且：

```text
s --ε--> r
```

那么自然：

```text
q --ε*--> r
```

所以加入 `r` 是合法的。

---

## 28. Week 4 最重要的路线图

现在整个课程的路线开始变得非常清楚：

```text
Regular Expression
        ↓
NFA with ε-transitions
        ↓
NFA without ε-transitions
        ↓
DFA
```

后面还会继续完成另一边：

```text
DFA
↓
Regular Expression
```

最终证明：

```text
Regular Expression
NFA
DFA
```

虽然形式完全不同，

但它们可以描述：

> **完全相同的一类 languages。**

---

## 29. 这就是 COMP2022 一直强调的 Equivalence

这门课从 Week 1 开始就在不断出现一个概念：

### Expressive Equivalence

意思是：

> 两个看起来完全不同的模型，最终可能拥有相同的表达能力。

现在已经开始看到非常具体的例子。

---

### Regular Expression

长得像：

```text
(ab | a)*
```

它像是在：

> 描述字符串 pattern。

---

### NFA

长得像：

```text
很多 state
很多 transition
甚至可以分叉
```

它像一个：

> 可以同时尝试很多路线的小机器。

---

### DFA

每一步：

```text
只有一个确定的 next state
```

它像一个：

> 沿唯一道路工作的 character-processing machine。

---

它们长得完全不一样。

但课程最终要证明：

```text
Lang(RE)
=
Lang(NFA)
=
Lang(DFA)
```

也就是说：

> 它们描述的是同一类 Regular Languages。

---

## 30. Week 3 → Week 4 的完整逻辑链

如果把目前学过的内容全部连接起来：

```text
Regular Expression
        ↓
用来描述 String Pattern
        ↓
Naive / Backtracking Matching
可能非常慢
        ↓
Automata to the rescue
        ↓
DFA
一个字符一个字符读取
state 保存必要的历史信息
        ↓
但 DFA 每一步必须唯一
复杂 Pattern 有时不好构造
        ↓
NFA
允许一个 character
对应多个 next states
        ↓
只要至少一条 accepting run
就 Accept
        ↓
加入 ε-transition
不用读取字符也能移动
        ↓
Union / Concatenation / Star
变得非常容易构造
        ↓
Regular Expression
可以按照结构一步步变成 NFA
        ↓
Epsilon Closure
        ↓
删除 ε-transition
        ↓
后面继续把 NFA 转成 DFA
```

---

## 31. DFA vs NFA

| 对比                   | DFA            | NFA                    |
| -------------------- | -------------- | ---------------------- |
| 一个 state + character | 一个 next state  | 0 / 1 / 多个 next states |
| 一个 input             | 基本只有一条 run     | 可能有很多条 runs            |
| Accept 条件            | 唯一 run 到 final | 至少一条 run 到 final       |
| ε-transition         | 不允许            | 允许                     |
| 构造复杂 pattern         | 有时比较麻烦         | 通常更方便                  |
| Expressive Power     | Regular        | 后面会证明同样是 Regular       |

---

## 32. Week 4 最应该记住的 8 句话

考试前如果只复习最核心内容，可以记：

```text
1. DFA 每一步只有一个选择。

2. NFA 每一步可以有 0、1 或多个选择。

3. NFA 只要至少一条 run 到达 final state，就 Accept。

4. ε-transition 不消耗任何 input character。

5. ε-transition 让 Union、Concatenation、Star 很容易构造。

6. EC(q) = 从 q 只走 0 个或多个 ε 可以到达的所有 states。

7. 删除 ε 时，要补 transition，也要检查是否需要补 final state。

8. Regular Expression、NFA、DFA 最终会被证明具有相同的 expressive power。
```

---

## 33. 最后一条大白话总结

> **Week 3 的 DFA 是“每一步只能沿唯一道路读字符串”，Week 4 的 NFA 则允许同时保留很多种可能路线；只要其中一条最后成功就 Accept，而 ε-transition 又让这些 automata 可以像乐高一样非常方便地拼起来。**

再往后最重要的一步就是：

```text
NFA
↓
DFA
```

真正理解这个转换之后，你就会看到：

> NFA 看起来好像比 DFA 更自由，但实际上这种“同时走很多条路”的效果，DFA 也可以用“一个 state 代表一组 NFA states”的方式模拟出来。

