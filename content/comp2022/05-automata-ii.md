# Automata

**COMP2022 Week 5｜Conversions**

到 Week 5，我们终于把前几周学的东西串起来了。

前面我们分别学了：

```text
Week 2
Regular Expression
↓
用一个 expression 描述一整个 language

Week 3
DFA
↓
用一个 deterministic machine 读取 string

Week 4
NFA
↓
允许一个 state 有多个选择
甚至允许 ε-transition
```

一开始它们看起来像三套完全不同的东西。

但 Week 5 最重要的结论其实是：

> **Regular Expression、NFA、DFA 的表达能力完全一样。**

它们只是：

> **同一个 regular language 的不同表达方式。**

---

## 1. Week 5 到底在解决什么问题？

前面我们已经走过了这条路线：

```text
Regular Expression
       ↓
      NFA
       ↓
remove ε-transitions
       ↓
NFA without ε
```

先别急着觉得这是在“把同一个东西重复转换很多次”。每一步其实都是为了解决不同的问题。

Regular Expression 最适合人来写，因为它可以很简洁地表达 pattern。例如：

```text
a*b
```

一眼就能看出它表示：

```text
零个或多个 a，最后接一个 b
```

但是 Regex 本身不太适合我们一步一步执行。于是我们把它转换成 NFA，让它变成一张 machine 的图。

NFA 的好处是容易构造。遇到：

```text
a|b
```

我们可以让机器分成两条路：

```text
走 a
或者
走 b
```

但是 NFA 也有一个问题：

> 它可能同时有很多条路可以走。

这对表达 pattern 很方便，但对实际执行来说比较麻烦。因为读入一个 character 后，机器可能不确定自己到底在哪个 state。

所以我们继续把它转换成 DFA：

```text
NFA without ε
       ↓
      DFA
```

DFA 的特点是：

> 每读入一个 character，下一步只能去一个确定的 state。

这样就更适合真正执行和检查 string。机器不需要同时尝试很多条路，只要按照当前 state 和输入 character 查表走一步就可以。

但是，为什么最后还要：

```text
DFA
 ↓
Regular Expression
```

难道已经有 DFA 了，还要把它转回 Regex 吗？

这里的重点不是说我们每次使用时都必须绕一圈，而是要证明：

> Regex 和 DFA 的能力完全一样。

如果我们只证明：

```text
Regex → DFA
```

那只能说明：

> 每一个 Regex 都可以转换成 DFA。

但我们还不知道：

> 每一个 DFA 能不能也用 Regex 表示。

所以还需要证明反方向：

```text
DFA → Regular Expression
```

这一步解决的是“表达能力是否相同”的问题。

如果 DFA 也能转换回 Regex，就说明：

```text
Regex 能做到的，DFA 能做到
DFA 能做到的，Regex 也能做到
```

因此，Regex、NFA 和 DFA 并不是谁更强、谁更弱，而是：

```text
Regular Expression
        ↓
       NFA
        ↓
NFA without ε
        ↓
       DFA
        ↓
Regular Expression
```

它们可以互相转换。

虽然它们长得完全不同：

```text
Regex：
a*b

NFA：
很多可能的路线

DFA：
每一步都确定的状态转换
```

但它们描述的是同一个 language。

可以把它们想成同一句话的三种写法：

```text
Regex：
用 pattern 写出来

NFA：
用很多可能的路线画出来

DFA：
把所有可能性整理成一个确定的机器
```

所以 Week 5 的核心不是“又学了一个新机器”，而是证明了：

> **Regular Expression、NFA 和 DFA 只是描述同一个 Regular Language 的不同工具。**

转换的目的也不一样：

```text
Regex → NFA
为了方便构造 machine

NFA → DFA
为了让执行过程变得确定

DFA → Regex
为了证明 DFA 也能被 Regex 表达
```

最后得到的结论就是：

```text
Regex
NFA
DFA
```

虽然形式不同，

但是它们能够描述的 language 完全一样。

---

## Part 1：NFA → DFA 如何使用DFA来代替NFA

## 2. 最大的问题：NFA 会分叉，DFA 不会

先回忆一下。

DFA 的规则是：

> 当前 state + 当前 character
> 必须唯一决定下一个 state。

例如：

```text
q0 --a--> q1
```

读到 `a`：

```text
只能去 q1
```

---

但是 NFA 可以：

```text
       → q1
q0 --a
       → q2
```

读一个 `a` 后：

```text
可能在 q1
也可能在 q2
```

所以问题来了：

> 一个只能待在一个 state 的 DFA，
> 怎么模拟一个可能同时处于很多 state 的 NFA？

这就是 Week 5 第一个核心思想。

---

## 3. Subset Construction

* Subset construction allows a DFA to represent multiple NFA states as a single state.
* 一句话理解subset constrcution就是解决dfa无法表示多个状态的问题

答案其实非常聪明：

> **不要让 DFA 的一个 state 只对应 NFA 的一个 state。**

因为 NFA 读完一段 input 后，可能有很多条路径仍然可以继续，所以它可能处在多个 state 中。

DFA 没有这种“分叉”能力。DFA 每读一个 character，只能确定地处在一个 state。

那怎么办呢？

我们让 DFA 的一个 state 代表：

> **NFA 当前所有可能所在的 states。**

例如，假设 NFA 读完某段 input 后，可能在：

```text
q0
q1
q3
```

那么 DFA 就把这三个 states 打包成一个新的 state：

```text
{q0, q1, q3}
```

这个 DFA state 的意思不是：

> DFA 真的同时运行在三个地方。

而是：

> **如果我们让 NFA 读取同样的 input，那么它所有可能的位置就是 q0、q1 和 q3。**

所以 DFA 用一个集合，记录 NFA 的所有可能性：

```text
NFA 的可能位置：

q0
q1
q3

↓

DFA 的一个 state：

{q0, q1, q3}
```

这里的 `{q0, q1, q3}` 是 NFA states 的一个 subset，也就是子集。

因此，这种把：

```text
一组 NFA states
```

转换成：

```text
一个 DFA state
```

的方法，就叫：

## Subset Construction

可以把它理解成：

> **NFA 负责产生很多可能路线，DFA 把这些可能路线的当前位置打包成一个集合。**

例如：

```text
NFA：
读完 input 后可能在 q0、q1、q3

DFA：
读完同样的 input 后处在 {q0,q1,q3}
```

这样，DFA 虽然每次只能处在一个 state，但这个 state 里面保存了 NFA 的所有可能位置。

---

## 4. 为什么叫 Subset？

假设 NFA 有三个 states：

```text
Q = {q0, q1, q2}
```

那么 DFA 的 state 可能是：

```text
∅

{q0}
{q1}
{q2}

{q0,q1}
{q0,q2}
{q1,q2}

{q0,q1,q2}
```

这些全部都是：

```text
Q 的 subsets
```

所以叫：

```text
subset construction
```

---

## 5. 一个非常简单的例子

Slides 里的 NFA 可以用文字描述成：

这个 NFA 有两个 states：`q0` 和 `q1`。

`q0` 是 start state，`q1` 是 accepting state。

当机器位于 `q0` 时：

* 如果读取 `a`，只能继续留在 `q0`。
* 如果读取 `b`，有两种可能：

  * 留在 `q0`
  * 移动到 `q1`

因此，当 NFA 处于 `q0` 并读取一个 `b` 时，它可能同时保留两条计算路径：

```text
第一条路径：q0 → q0
第二条路径：q0 → q1
```

所以，转换成 DFA 时，DFA 需要用一个 state 来记录 NFA 的所有可能位置。这个 DFA state 就是：

```text
{q0,q1}
```

---

## 6. DFA 是怎么模拟 NFA 的？

假设输入：

```text
abba
```

刚开始：

```text
{q0}
```

读：

```text
a
```

NFA 从 q0 只能到 q0：

```text
{q0}
```

再读：

```text
b
```

NFA 可以：

```text
q0 → q0
q0 → q1
```

所以：

```text
{q0,q1}
```

再读：

```text
b
```

从 q0：

```text
可以到 q0 和 q1
```

从 q1：

```text
没有地方可以走
```

所以还是：

```text
{q0,q1}
```

最后读：

```text
a
```

只有 q0 能继续：

```text
{q0}
```

完整过程：

```text
abba

{q0}
  ↓ a
{q0}
  ↓ b
{q0,q1}
  ↓ b
{q0,q1}
  ↓ a
{q0}
```

最后：

```text
{q0}
```

里面没有 accepting state `q1`。

所以：

```text
Reject
```

---

## 7. 那什么时候 Accept？

规则非常简单：

> **只要 DFA 当前保存的 set 里面，有至少一个 NFA accepting state，就 Accept。**

例如：

```text
{q0,q1}
```

如果：

```text
q1 是 accepting
```

那么：

```text
{q0,q1}
```

就是 DFA 的 accepting state。

为什么？

因为 NFA 的定义本来就是：

> 只要存在一条 computation path 最后到 accepting state，
> NFA 就接受。

所以只需要：

```text
至少一个可能位置接受
```

就够了。

---

## 8. Subset Construction 的完整套路

考试看到：

> Convert this NFA into an equivalent DFA.

基本就是下面四步。

### Step 1：DFA state = NFA state 的集合

例如：

```text
{q0}
{q0,q1}
{q1}
∅
```

---

### Step 2：Start state

如果 NFA start state 是：

```text
q0
```

那么 DFA start state：

```text
{q0}
```

注意这里 Week 5A 已经假设：

```text
没有 ε-transition
```

所以不用再算 epsilon closure。

---

### Step 3：算 transitions

假设当前 DFA state：

```text
{q0,q1}
```

现在读：

```text
a
```

你就分别问：

```text
q0 读 a 能去哪？

q1 读 a 能去哪？
```

最后把结果：

```text
全部 union 在一起
```

得到新的 DFA state。

---

### Step 4：决定 final states

如果一个 set 里面包含任意 NFA final state：

```text
这个 set 就是 DFA final state
```

例如：

```text
NFA final = q2
```

那么：

```text
{q2}            accepting
{q0,q2}         accepting
{q1,q2}         accepting
{q0,q1,q2}      accepting
```

---

## 9. ∅ state 是什么？

Subset Construction 里面经常会出现：

```text
∅
```

例如：

```text
{q1}
```

读 `a` 后，

如果 q1 没有任何 `a` transition：

```text
{q1} --a--> ∅
```

这里：

```text
∅
```

意思是：

> NFA 已经没有任何可能继续运行的 state 了。

对于 DFA 来说，它通常就是一个：

```text
dead state
```

进入以后通常：

```text
a → ∅
b → ∅
```

永远出不来了。

注意：

```text
∅ ≠ ε
```

这里的：

```text
∅
```

是：

```text
没有任何 possible state
```

而不是：

```text
empty string
```

---

## 10. 做题时最好先画 Transition Table

不要一上来直接画图。

例如：

| DFA State | Input a | Input b |
| --------- | ------- | ------- |
| {q0}      | {q0}    | {q0,q1} |
| {q1}      | ∅       | ∅       |
| {q0,q1}   | {q0}    | {q0,q1} |
| ∅         | ∅       | ∅       |

然后再把 table 画成 DFA。

这样非常不容易漏 transition。

---

## 11. Subset Construction 的本质

最值得记住的一句话：

> **NFA 用 branching 表示“不确定有哪些可能”；DFA 用一个 set 把所有可能性一次记下来。**

也就是：

```text
NFA：

      → q1
q0 →
      → q2


DFA：

q0 → {q1,q2}
```

所以：

> NFA 的“多条路”，被压缩进了 DFA 的“一个集合 state”。

---

## 12. 为什么它一定正确？

Slides 后面的 correctness proof 其实想证明：

> DFA 记录的 set，永远刚好等于 NFA 当前所有可能到达的 states。

例如读完：

```text
abb
```

如果 NFA 所有可能位置：

```text
{q0,q2,q3}
```

那么转换后的 DFA 此时一定就在：

```text
{q0,q2,q3}
```

所以两边掌握的信息完全一样。

最终：

```text
NFA 有某条 path 到 final
```

等价于：

```text
DFA 的 set 里面包含 final state
```

因此它们接受的 strings 完全一样。

---

## Part 2：DFA → Regular Expression

## 13. 接下来反过来

现在我们已经知道：

```text
Regex → NFA → DFA
```

但如果要证明：

```text
Regex 和 DFA 表达能力真的完全一样
```

还差一个方向：

```text
DFA → Regex
```

这就是 Week 5B。

---

## 14. 问题在哪里？

DFA transition 平时长这样：

```text
q0 --a--> q1
```

一条 transition：

```text
只读一个 character
```

但是如果我们希望不断删除 states，

那么一条 transition 可能需要表示：

```text
很多种 string
```

例如：

```text
a
ab
abb
abbb
...
```

一个普通 character label 已经不够用了。

所以我们引入一个新东西：

## GNFA

Generalised Nondeterministic Finite Automaton

---

## 15. GNFA 是什么？

GNFA 可以理解成：

> **说白了就是 transition 上不再只能写一个 character，而是可以直接写 Regular Expression。**

* 想办法把中间 state 消掉，把“经过这个 state 的所有走法”压缩成一个 Regular Expression，写到 transition 上。

普通 NFA：

```text
q0 --a--> q1
```

GNFA：

```text
q0 --a*b--> q1
```

意味着：

> 从 q0 到 q1 可以读取任何 match `a*b` 的 string。

例如：

```text
b
ab
aab
aaab
```

都可以一次经过这条 transition。

---

## 16. 为什么需要 GNFA？

我们的目标是：

```text
DFA
↓
不断删除 states
↓
只剩两个 states
↓
start --------> final
        Regex
```

最后：

```text
start → final
```

上面那条 transition 的 Regex，

就是整个 automaton 的 language。

---

## 17. DFA → GNFA：先 Normalise

正式删除 states 之前，要先把 DFA 改造成一个标准 GNFA。

Slides 给了四个步骤。

---

### Step 1：原来的 start / final 变成普通 state

也就是先把它们的特殊身份拿掉。

---

### Step 2：创建新的 start state

例如：

```text
new_start --ε--> old_start
```

为什么？

因为 GNFA 要保证：

> start state 没有 incoming transition。

---

### Step 3：创建新的 final state

每一个旧 final state：

```text
old_final --ε--> new_final
```

这样保证：

> 整个 GNFA 只有一个 final state。

并且：

```text
final 没有 outgoing transition
```

---

### Step 4：没有 transition 的地方补 ∅

例如本来：

```text
q1
```

没有 transition 去：

```text
q3
```

我们实际上可以看成：

```text
q1 --∅--> q3
```

因为：

```text
Lang(∅) = {}
```

也就是说：

> 没有任何 string 可以通过这条边。

一般画图的时候不会画出来，

因为太乱。

---

## 18. GNFA 标准结构

转换完以后希望：

```text
new start
↓
old states
↓
new final
```

同时满足：

```text
start：
没有 incoming edges

final：
没有 outgoing edges

只有一个 final state
```

之后就可以开始删除 state。

---

## 19. Week 5 最重要公式：State Elimination

假设现在想删除：

```text
q
```

并且：

```text
s → q → t
```

那么删除 q 以后，

我们不能把原来经过 q 的路径一起删掉。

所以必须把：

```text
经过 q 的所有可能 string
```

直接塞到：

```text
s → t
```

这条 transition 里。

公式：

```text
new(s → t)

=

old(s → t)

|

(s → q)(q → q)*(q → t)
```

Slides 写成：

```text
Rs,t | (Rs,q Rq,q* Rq,t)
```

这是这部分最需要会读的东西。

---

## 20. 不要死背公式，直接读路径

这条：

```text
(s → q)(q → q)*(q → t)
```

其实就是：

```text
先从 s 进入 q
↓
在 q 原地循环 0 次或很多次
↓
最后从 q 离开到 t
```

所以：

```text
Rs,q
Rq,q*
Rq,t
```

分别就是：

```text
进 q
在 q 转圈
出 q
```

然后为什么前面还有：

```text
Rs,t |
```

因为原本可能已经有：

```text
s → t
```

我们不能把它删掉。

所以最终是：

```text
原来的路线
OR
经过 q 的新路线
```

这就是公式真正的意思。

---

## 21. 一个极简例子

假设：

```text
s --a--> q
q --b--> q
q --c--> t
```

删除：

```text
q
```

那么：

```text
进入 q：a

在 q 循环：b*

离开 q：c
```

因此：

```text
s --ab*c--> t
```

这就是 state elimination。

---

## 22. 如果本来 s → t 已经有一条边呢？

假设原本：

```text
s --d--> t
```

同时：

```text
s --a--> q
q --b--> q
q --c--> t
```

删除 q 后：

```text
s --(d | ab*c)--> t
```

为什么？

因为现在有两种可能：

```text
直接走：
d

或者经过 q：
ab*c
```

所以用：

```text
|
```

连接。

---

## 23. Slides 里的完整例子

原来的 DFA 大致表达：

```text
q1：
a-loop

q1 --b--> q2

q2：
a,b-loop
```

转成 GNFA：

```text
q0 --ε--> q1

q1 --a--> q1

q1 --b--> q2

q2 --(a|b)--> q2

q2 --ε--> q3
```

其中：

```text
q0 = new start
q3 = new final
```

---

首先删除：

```text
q2
```

从：

```text
q1 → q2 → q3
```

得到：

```text
q1 --b(a|b)*--> q3
```

为什么？

```text
进入 q2：b

q2 自己循环：(a|b)*

离开 q2：ε
```

所以：

```text
b(a|b)*ε
```

也就是：

```text
b(a|b)*
```

---

然后删除：

```text
q1
```

现在：

```text
q0 --ε--> q1

q1 --a--> q1

q1 --b(a|b)*--> q3
```

所以：

```text
进入 q1：ε

循环：a*

离开：b(a|b)*
```

得到：

```text
εa*b(a|b)*
```

而：

```text
εR = R
```

所以最终 Regex：

```text
a*b(a|b)*
```

---

## 24. 这个 Regex 描述什么？

```text
a*b(a|b)*
```

拆开：

```text
a*
```

开头可以有任意多个 `a`

然后：

```text
b
```

必须出现一个 `b`

最后：

```text
(a|b)*
```

后面随便是什么。

所以整个 language 就是：

> **所有至少包含一个 b 的 strings。**

这和原来的 DFA 接受的 language 一样。

---

## 25. State Elimination 的做题套路

以后考试看到：

> Convert DFA to Regular Expression.

可以固定：

```text
① DFA → GNFA

② new start
   --ε-->
   old start

③ old finals
   --ε-->
   new final

④ missing transitions = ∅

⑤ 选一个中间 state q

⑥ 更新所有可能经过 q 的 transitions

⑦ 删除 q

⑧ 重复

⑨ 最后只剩：
start → final

⑩ 返回 transition 上的 Regex
```

---

## 26. 删除 state 时最容易错在哪里？

最大的错误就是：

> 直接把 state 和 edges 擦掉。

这是不行的。

因为例如：

```text
s → q → t
```

虽然 q 被删除，

但是：

```text
原来所有经过 q 的 strings
```

必须继续被接受。

所以我们的目标其实不是：

```text
删除路径
```

而是：

> **把经过 q 的路径压缩成一个 Regex transition。**

可以理解成：

```text
很多小路
↓
压缩
↓
一条 Regex 高速公路
```

---

## 27. 为什么 State Elimination 一定正确？

核心思想其实也很简单。

删除 q 之前，

从 s 到 t 的路径只有两大类：

```text
情况 1：
完全不经过 q

情况 2：
经过 q
```

情况 1：

```text
Rs,t
```

情况 2：

```text
先进入 q
↓
可能在 q 循环很多次
↓
再离开 q
```

也就是：

```text
Rs,q Rq,q* Rq,t
```

所以把两种情况 OR：

```text
Rs,t | Rs,q Rq,q* Rq,t
```

就覆盖了：

```text
所有可能路径
```

没有多，也没有少。

---

## 28. Week 5 真正的大结论

现在我们已经完成：

```text
Regular Expression
        ↓
       NFA
        ↓
NFA without ε
        ↓
       DFA
        ↓
Regular Expression
```

所以：

```text
Regular Expression
NFA
NFA without ε
DFA
```

虽然表示方式不同，

但：

> **它们描述的 language class 完全相同。**

这个 language class 就叫：

## Regular Languages

---

## 29. 什么叫 Regular Language？

Slides 给出的定义是：

> 如果一个 language 能被某个 DFA recognise，
> 那么它就是 regular language。

现在因为我们证明了这些模型等价，

所以其实也可以理解成：

```text
能被 DFA 描述
=
能被 NFA 描述
=
能被 ε-NFA 描述
=
能被 Regular Expression 描述
```

这样的 language：

```text
就是 Regular Language
```

---

## 30. 为什么前几周一直在学不同模型？

现在就能看出来了。

我们不是一直在学“新的 language”。

而是在学：

> **同一个 Regular Level 的不同表达工具。**

例如：

```text
Regex
```

适合：

```text
描述 pattern
```

---

```text
NFA
```

适合：

```text
构建 automaton
处理 OR / branching
```

---

```text
DFA
```

适合：

```text
真正执行
因为每一步只有一个 next state
```

---

所以可以粗略理解成：

```text
Regex：
我想匹配什么？

NFA：
把这个 pattern 拆成很多可能路线。

DFA：
把所有可能路线整理成一个确定的机器。
```

---

## 31. 这也解释了 Week 3 Cloudflare 的故事

Week 2 我们学到：

```text
Regex matching
```

如果直接使用：

```text
backtracking
```

可能出现大量重复搜索。

而 automata 的路线是：

```text
Regular Expression
↓
NFA
↓
DFA
↓
character by character processing
```

也就是把：

```text
运行时疯狂猜路
```

变成：

```text
提前把可能性整理成 states
```

这也是 automata 为什么能解决 regex matching 中的一些效率问题。

---

## 32. Regular Languages 的 Closure

Week 5 最后的总结还告诉我们：

Regular languages 对很多 operation 都是 closed 的。

包括：

```text
Union

Intersection

Complement

Concatenation

Kleene Star
```

Closed 的意思就是：

> 两个 regular languages 做完这个 operation，
> 得到的结果仍然是 regular language。

例如：

```text
L1 regular
L2 regular
```

那么：

```text
L1 ∪ L2
```

仍然 regular。

---

## 33. 整个 Week 2–5 的知识链

现在终于可以把 Automata 这一大章串起来：

```text
Language
│
│ 想描述 string pattern
↓
Regular Expression
│
│ Thompson Construction
↓
ε-NFA
│
│ remove ε-transitions
↓
NFA
│
│ Subset Construction
↓
DFA
│
│ GNFA + State Elimination
↓
Regular Expression
```

最终得到：

```text
Regex
↕
NFA
↕
DFA
```

它们不是三种不同等级的能力。

而是：

> **Regular Level 里的三种不同表示方式。**

---

## 34. 两个 Conversion 最核心的直觉

### NFA → DFA

一句话：

> **把 NFA 所有可能的位置装进一个 set。**

```text
NFA branching

q1
q2
q3

↓

DFA state

{q1,q2,q3}
```

关键词：

```text
Subset Construction
```

---

### DFA → Regex

一句话：

> **不断删 state，把经过这个 state 的所有路径压缩成 Regex。**

```text
s → q → t

↓

s ─────────→ t
   Regex
```

关键词：

```text
GNFA
State Elimination
```

---

## 35. 考试看到题目时怎么判断？

看到：

```text
NFA → DFA
```

脑子马上跳：

```text
Subset Construction
```

然后：

```text
state = set of NFA states
```

---

看到：

```text
DFA → Regular Expression
```

脑子马上跳：

```text
GNFA
+
State Elimination
```

然后：

```text
old direct route
OR
enter q + loop q* + leave q
```

---

## 36. 最终速记版

```text
Week 5：Conversions
```

### NFA → DFA

```text
方法：
Subset Construction

DFA state
=
set of possible NFA states

start：
{NFA start}

transition：
把所有 next states union

accept：
set 中至少有一个 NFA final state
```

---

### DFA → Regex

```text
方法：
GNFA + State Elimination

先：
加 new start
ε → old start

再：
old finals
ε → new final

然后不断删 state q
```

更新 transition：

```text
old direct route

OR

enter q
+
loop q*
+
leave q
```

也就是：

```text
Rs,t | Rs,q Rq,q* Rq,t
```

最后：

```text
只剩 start → final

edge 上的 Regex
=
整个 language 的 Regex
```

---

## 37. Week 5 一句话总结

> **Week 5 不是在教一种新的机器，而是在证明 Regex、NFA、DFA 其实只是同一个 Regular Language 的不同写法。**

如果再压缩成一句做题口诀：

> **NFA → DFA：把分叉装进 set；DFA → Regex：把路径压进 expression。**
