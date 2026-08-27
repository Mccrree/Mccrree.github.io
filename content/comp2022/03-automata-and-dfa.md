# Automata & Deterministic Finite Automata

**从 Regex 到 DFA：为什么一条正则表达式真的可以把服务器干趴下？**

在 Week 2，我们刚刚学完 Regular Expression（正则表达式）。

当时我对 Regex 的理解很简单：

> Regex 就是用来描述一类字符串长什么样。

比如：

```text
(a|b)*
```

表示由任意数量的 `a` 和 `b` 组成的字符串。

但到了 Week 3，一个更加实际的问题出现了：

> 我们知道一个 Regex 描述什么之后，电脑到底应该怎么判断一个字符串是否符合它？

这个问题看起来只是“实现一下 Regex”，但实际上，一种不好的实现方式甚至真的能够让大型互联网公司的服务器宕机。

这就是 2019 年 Cloudflare 事故和这一周 DFA 内容之间的联系。

整条逻辑链其实是：

```text
Regular Expression
        ↓
描述字符串 Pattern
        ↓
如何真正执行 Matching？
        ↓
Backtracking
        ↓
可能出现性能爆炸
        ↓
Finite Automata
        ↓
DFA
```

所以 Week 3 并不是突然冒出来一个新的数学模型。

DFA 实际上是在回答 Week 2 留下的问题：

> **我们能不能用一种更加系统、高效的方法处理字符串 Pattern？**

---

## 1. Cloudflare 为什么会用到 Regular Expression？

Cloudflare 的一个重要功能叫做：

**WAF（Web Application Firewall）**

也就是 Web Application Firewall，网页应用防火墙。

可以简单把 Cloudflare 想象成网站门口的保安：

```text
用户发出 HTTP Request
        ↓
    Cloudflare
        ↓
这个请求看起来安全吗？
        ↓
 Accept / Reject
```

很多网络攻击并不是完全随机的。

攻击者往往会寻找一些已知漏洞，所以恶意 URL、文件名或者请求内容中可能存在某些固定 Pattern。

例如攻击者可能尝试寻找：

```text
database.env.default
config.env
secret.env.backup
```

我们当然不可能一个一个把所有可能出现的文件名写出来：

```python
if filename == "database.env.default":
    ...

if filename == "config.env":
    ...

if filename == "secret.env.backup":
    ...
```

更加自然的方法是：

> 描述“危险文件名长什么样”。

这就是 Regular Expression 的作用。

例如可以写出类似：

```regex
.*\.env(\..*)?
```

先不用在意所有符号。

大概可以理解成：

```text
前面随便是什么
+
出现 .env
+
后面可能还有其他内容
```

于是：

```text
database.env
config.env.backup
abc.env.default
```

都可能被这个 Pattern 找出来。

这其实就是 Regex 在现实系统中的一个非常典型的用途。

---

## 2. Regex 只是描述规则，还需要有人执行规则

现在假设我们已经有一个 Regular Expression：

```regex
.*.*=.*
```

以及一个字符串：

```text
x=xxx
```

我们的问题变成：

> `x=xxx` 到底 Match 不 Match 这个 Regex？

这里非常重要的一点是：

```text
Regex 描述什么
```

和：

```text
如何判断字符串是否符合 Regex
```

其实是两个不同的问题。

前者是 **Specification**。

后者是 **Algorithm**。

也就是说：

```text
Regular Expression
      ↓
描述 Pattern

Matching Algorithm
      ↓
真正检查字符串
```

而不同的 Matching Algorithm，性能可能完全不同。

---

## 3. 最直觉的方法：Backtracking

一种非常常见的 Regex Matching 方法叫：

**Backtracking（回溯）**

大白话理解就是：

> 先试一条路，如果发现走不通，就退回上一次做选择的位置，然后换一条路继续试。

有点像树状图的感觉：DFS？**由 regex 选择过程形成的隐式搜索树”** 上跑

注：（但是这里\*\*Backtracking（回溯）\*\*只是一种方法 不一定是最优解也不止这一种方法）

例如 Regular Expression：

```text
(a(a|d)) | (aa(c|d))
```

现在检查：

```text
aad
```

电脑可能先尝试左边：

```text
a(a|d)
```

第一个 `a`：

```text
aad
↑
```

成功。

然后 `(a|d)` 尝试匹配第二个：

```text
aad
 ↑
```

也成功。

但是现在 Regex 已经结束，而字符串还有：

```text
d
```

剩下。

所以：

```text
失败 ❌
```

怎么办？

回到之前的选择点。

然后尝试另外一条：

```text
aa(c|d)
```

前两个：

```text
aa
```

匹配成功。

最后：

```text
(c|d)
```

选择：

```text
d
```

于是：

```text
aad
```

成功匹配。

✅

这就是 Backtracking。

可以把它想象成走迷宫：

```text
选择路线 A
     ↓
发现死路
     ↓
退回来
     ↓
选择路线 B
     ↓
继续走
```

这种方法非常直觉。

问题是——

**如果岔路特别多呢？**

---

## 4. Backtracking 真正的问题：选择可能太多

重新看：

```regex
.*.*=.*
```

其中：

```regex
.*
```

大概可以理解成：

> 任意字符出现任意多次。

现在字符串：

```text
x=xxx
```

第一个 `.*` 到底应该吃掉多少字符？

它可以吃：

```text
x=xxx
```

也可以只吃：

```text
x=xx
```

然后把最后一个 `x` 留给后面。

也可以：

```text
x=x
```

还可以：

```text
x=
```

还可以：

```text
x
```

甚至：

```text
ε
```

也就是什么都不吃。

于是一个 `.*` 已经有很多选择。

但现在表达式里还有第二个：

```regex
.*
```

它又有很多种选择。

于是整个 Matching 过程可能变成：

```text
尝试一种拆法
↓
失败
↓
退回

尝试另一种拆法
↓
失败
↓
再退回

尝试下一种拆法
↓
...
```

这时候问题就出现了。

---

## 5. Catastrophic Backtracking灾难性的倒退

有一些 Regex 会产生大量重复的 Backtracking。

这种情况通常被称为：

**Catastrophic Backtracking**

也可以简单理解成：

> Regex 引擎为了判断一个字符串到底 Match 不 Match，疯狂尝试大量不同组合。

最危险的一点是：

字符串可能只增长了一点点：

```text
aaaaaaaaaaaaaaaa...
```

但是需要尝试的可能性却增长得非常快。

于是运行时间可能变成：

```text
长度 22 → 很快
长度 23 → 很快
长度 24 → 稍微慢一点
长度 25 → 更慢
...
长度 30 → 非常慢
长度 31 → 爆炸
```

Week 2 中出现的：

```text
(a+)+
```

就是这种所谓的：

**evil regex**

它可能导致非常严重的 Backtracking。

---

## 6. 然后 Cloudflare 真的出事了

2019 年 7 月 2 日，Cloudflare 的 WAF 发布了一条新的 Regex 规则。

这条规则里存在一个会产生严重 Backtracking 的 Pattern。

结果就是：

```text
新的 WAF Regex
      ↓
大量 HTTP Request 需要检查
      ↓
Regex Engine 大量 Backtracking
      ↓
CPU 使用率迅速升高
      ↓
大量服务器 CPU 接近 100%
      ↓
Cloudflare 服务受到严重影响
```

这里最值得注意的其实不是：

> “某个工程师写错了一条 Regex。”

真正重要的是：

> **一个看起来很小的字符串 Pattern，在非常大的系统规模下，可以变成严重的算法性能问题。**

这就是理论计算机科学真正开始和现实工程接上的地方。

---

## 7. 有没有办法不要一直“猜”？

这就进入了 Week 3B。

我们希望找到一种方法：

```text
不要：
试试看
↓
失败
↓
退回来
↓
再试
```

而是：

```text
读一个字符
↓
知道下一步去哪

再读一个字符
↓
知道下一步去哪

再读一个字符
↓
知道下一步去哪
```

这就是：

### Finite Automata

更具体来说，这一周学习的是：

### DFA — Deterministic Finite Automaton

### 总结：为什么选择DFA而放弃backtracking？

这里backtracking方法虽然解决问题了 但是一遇到稍微长一点的字符串检测加上当 Regex 中存在大量“重叠/模糊的选择 那么将效率无比的底下(想象一下DFS 只有其中一个支点是答案 而这里却需要遍历这个答案前的所有支点......性能直接爆炸



---

## 8. Automaton 到底是什么？

课件给出的 Automaton 可以理解成一个非常简单的字符串处理程序。

它：

1. 输入一个字符串；
2. 一个字符一个字符读取；
3. 只能保存有限的信息；
4. 每读一个字符，可以更新自己的状态；
5. 最后必须回答：

```text
Accept
```

或者：

```text
Reject
```

大白话来说：

> **Automaton 就是一个只有有限记忆的字符串检查机器。**
>
> Current State + Input/Event → Next State
>
> 如同NPC：闲置---警觉---和玩家战斗---玩家逃跑---闲置
>
> 闲置+看到玩家→警觉
>
> 警觉+玩家靠近→和玩家战斗

例子 3：判断字符串最后是不是 `a`

现在我们想解决一个问题：

> 输入一个只包含 `a,b` 的字符串，判断它最后是不是 `a`。

比如：

```
aba
```

应该：

```
Accept ✅
```

因为最后是 `a`。

而：

```
abb
```

应该：

```
Reject ❌
```

---

我们设计一个很笨的小机器人。

它只有两个脑内状态：

```
q0 = 我目前最后看到的不是 a
q1 = 我目前最后看到的是 a
```

开始：

```
q0
```

---

输入：

```
abba
```

一个一个喂给它。

### 第一个字符 `a`

```
```

```
现在 q0
看到 a
↓
去 q1
```

因为：

> “目前最后一个字符是 a。”

---

### 第二个字符 `b`

```
```

```
现在 q1
看到 b
↓
去 q0
```

因为：

> “现在最后一个变成 b 了。”

---

### 第三个字符 `b`

```
```

```
q0
看到 b
↓
还是 q0
```

---

### 第四个字符 `a`

```
q0
看到 a
↓
q1
```

最后：

```
q1
```

如果我们规定：

```
q1 = Accept state
```

所以：

abba → Accept ✅

整个过程：

```
输入：    a    b    b    a
         ↓    ↓    ↓    ↓
状态：q0 → q1 → q0 → q0 → q1
                            ↑
                          Accept
```

这就是 DFA。

不过！！ 欸聪明的你发现了 似乎.....这个例子中current state没有用到？ 因为这里判断是不是a只用看input/event就能得到output了？ 那我们能说current state不重要吗?    思考一下 看下面的例子4

---

## 9. State 到底是什么？

这是理解 DFA 最重要的一句话：

> **State = 为了最后做判断，我目前必须记住的信息。**

举一个非常简单的例子4 判断 `a` 的数量是奇数还是偶数。

假设我要判断：

> 一个由 `a`、`b` 组成的字符串里面，`a` 的数量是不是偶数。

例如：

```text
abbaa
```

如果使用普通 Python，我们当然可以写：

```python
count_a = 0
```

然后不断计数。

但是其实没有必要知道：

```text
a 一共出现了 100 次
```

还是：

```text
a 一共出现了 102 次
```

因为我们只关心：

```text
奇数
```

还是：

```text
偶数
```

所以我们只需要两个状态：

```text
Even
Odd
```

开始的时候一个 `a` 都还没有：

```text
0 个 a
```

所以：

```text
Even
```

然后输入：

```text
abbaa
```

一步一步来看。

开始：

```text
Even
```

读到第一个：

```text
a
```

现在有 1 个 `a`：

```text
Odd
```

读：

```text
b
```

`b` 不影响 `a` 的数量：

```text
Odd
```

再读：

```text
b
```

还是：

```text
Odd
```

再读：

```text
a
```

现在有 2 个：

```text
Even
```

最后又读：

```text
a
```

3 个：

```text
Odd
```

所以整个过程：

```text
Even --a--> Odd
Odd  --b--> Odd
Odd  --b--> Odd
Odd  --a--> Even
Even --a--> Odd
```

最终停在：

```text
Odd
```

于是 Reject。

这就是 DFA 的思维方式。

是的 current state在一些上面还是很重要！！！不能忽视

---

## 10. 所以 State 其实就是“压缩过的记忆”

这是我觉得理解 Automata 最重要的地方。

假设目前已经读取：

```text
abbaababbaabba...
```

DFA 不会保存整个字符串。

它只会问：

> 对我最终做决定来说，过去有哪些信息是重要的？

例如刚才的问题只关心：

```text
a 数量是奇数
```

还是：

```text
a 数量是偶数
```

那么无论前面字符串有多长，我们只需要保存：

```text
Even / Odd
```

两个状态。

所以：

```text
过去完整的信息
        ↓
只保留有用的信息
        ↓
      State
```

这其实是一种非常漂亮的“信息压缩”。

---

## 11. 有些情况为什么会有多个 State？

先把 **State** 理解成：

> **State = 当前的“存档”，保存了之后继续判断所需要的过去信息。**

一个系统通常不只有一个可能的 State。

例如，我们想让一个机器同时记住：

```text
a 出现次数是奇数还是偶数
b 出现次数是奇数还是偶数

```

那么每一项都有两种可能：

```text
a：奇数 / 偶数
b：奇数 / 偶数

```

组合起来就会出现四种“存档”：

```text
(a偶, b偶)
(a奇, b偶)
(a偶, b奇)
(a奇, b奇)

```

因此这个机器一共有：

```text
2 × 2 = 4

```

个可能的 State。

可以简单把它们命名成：

```text
q0 = (a偶, b偶)
q1 = (a奇, b偶)
q2 = (a偶, b奇)
q3 = (a奇, b奇)

```

这里要特别注意：

> **机器可以拥有很多个可能的 State，但某一个时刻只会处于其中一个 Current State。**

---

### State 就像游戏存档

假设现在的 Current State 是：

```text
(a奇, b偶)

```

它表示机器到目前为止记得：

```text
a 出现了奇数次
b 出现了偶数次

```

现在又读到一个新的：

```text
b

```

因为 `b` 又增加了一次：

```text
偶数 → 奇数

```

所以：

```text
(a奇, b偶) + b
        ↓
(a奇, b奇)

```

新的结果 `(a奇, b奇)` 就成为新的 Current State。

因此 DFA 的状态变化可以理解成：

```text
Current State + Input → Next State

```

或者更直观地理解成：

```text
旧存档 + 新事件 → 新存档

```

然后新的存档会继续参与下一次计算：

```text
State₀ + Input₁ → State₁

State₁ + Input₂ → State₂

State₂ + Input₃ → State₃

...

```

例如输入：

```text
ab

```

机器的“存档”变化可能是：

```text
开始
(a偶, b偶)

读到 a
↓
(a奇, b偶)

读到 b
↓
(a奇, b奇)

```

所以多个 State 并不是什么神秘的数学概念。

它们只是：

> **机器可能拥有的不同“存档情况”。**

而真正运行的时候，机器会随着新的 Input 不断在这些 State 之间切换。

一句话记忆：

> **State = 过去重要信息的存档；Input = 新发生的事情；Next State = 更新后的新存档。**
>
> State = 过去必要信息的存档；DFA 就是用“旧存档 + 新输入 → 新存档”的方式不断更新状态，最后再决定 Accept 或 Reject

---

## 12. DFA 的图到底怎么看？

DFA 图里面主要只有四个东西。

---

### 12.1 圆圈：State

例如：

```text
q0
q1
q2
```

每个圆圈代表一个状态。

也就是：

> 当前机器记住的信息。

---

### 12.2 从外面指进来的箭头：Start State

例如：

```text
→ q0
```

表示：

> 输入字符串一个字符都还没读的时候，从 `q0` 开始。

---

### 12.3 双圆圈：Final State

双圆圈代表：

**Final State / Accepting State**

意思是：

> 如果整个字符串读取完成以后停在这个 State，就 Accept。

这里有一个很容易误解的地方：

**进入 Final State 并不代表程序立即结束。**

例如：

```text
q0 → q1(final) → q2 → q1(final)
```

如果字符串还没有读完：

```text
继续走。
```

只有：

> **整个 String 都读完以后所在的 State**

才决定最终：

```text
Accept / Reject
```

---

## 13. Transition 是什么？

可以先把 **State 和 Transition 分开理解**：

> **State = 你现在在哪 / 当前的存档是什么**\
> **Transition = 发生新的 Input / Event 后，你从当前 State 跳到哪个新的 State**

最简单的理解方式就是把 DFA 想成一张游戏地图。

例如：

```text
q1 = 客厅
q2 = 厨房

```

你现在在：

```text
q1

```

然后发生一个事件：

```text
打开厨房门

```

于是：

```text
q1 --打开厨房门--> q2

```

这里：

```text
q1 = Current State
打开厨房门 = Input / Event
q2 = Next State

```

而这一整条：

```text
q1 --打开厨房门--> q2

```

就是一个 **Transition**。

也就是说：

> **Transition 不是 q2，也不是某个字符 a，而是“当前 State 遇到某个 Input 后，应该跳到哪个 Next State”的变化规则。**
>
> **state**是存档 而**Transition** 是“旧存档 + 新事件 → 新存档”的状态更新过程

在 DFA 里经常会看到：

```text
q1 --a--> q2

```

意思就是：

> 当前在 `q1`，现在读到字符 `a`，所以进入 `q2`。

因此可以把它理解成：

```text
Current State + Input
        ↓
    Next State

```

或者用之前的“游戏存档”理解：

```text
旧存档 + 新事件
      ↓
    新存档

```

### 一句话总结

> **State 是当前存档，Transition 是根据新 Input 把旧存档更新成新存档的规则。**

---

## 14. 为什么叫 Deterministic？

DFA：

```text
Deterministic
Finite
Automaton
```

其中最重要的就是：

**Deterministic**

也就是：

> 确定性的。

意思是：

> 给定 Current State 和当前 Character，下一步一定只有一个答案。

例如 Alphabet 是：

```text
Σ = {a, b}
```

当前状态：

```text
q1
```

那么必须明确：

```text
q1 读到 a → 去哪里？
q1 读到 b → 去哪里？
```

而且每一个都只能有一个答案。

不能出现：

```text
q1 --a--> q2

同时

q1 --a--> q3
```

因为这样电脑就会问：

```text
那我到底走 q2 还是 q3？
```

这就不是 Deterministic 了。

所以 DFA 中：

```text
Current State + Input
```

必须唯一决定：

```text
Next State
```

例如：

```text
q1 + a → q2
```

只能够有一个确定结果。

后面学习 NFA 的时候，我们就会专门放宽这个限制。

---

## 15. Run 是什么？

假设一个 DFA 有这些 Transition：

```text
q1 --a--> q1
q1 --b--> q2
q2 --b--> q2
```

输入字符串：

```text
abb
```

机器从 Start State `q1` 开始。

第一个字符是：

```text
a
```

所以：

```text
q1 --a--> q1
```

第二个字符是：

```text
b
```

所以：

```text
q1 --b--> q2
```

第三个字符还是：

```text
b
```

所以：

```text
q2 --b--> q2
```

整个过程就是：

```text
q1 --a--> q1 --b--> q2 --b--> q2
```

这整条实际走过的路径就叫：

**Run**

所以：

> **Run = 某一个输入字符串让 DFA 实际走过的完整路线。**

字符串读完以后，如果最后所在的 State 是 Final State：

```text
Accept
```

否则：

```text
Reject
```

例如这里最终停在：

```text
q2
```

如果 `q2` 是 Final State：

```text
abb → Accept ✅
```

如果 `q2` 不是 Final State：

```text
abb → Reject ❌
```

---

## 16. Language 又出现了

Week 2 学 Regex 的时候，我们已经见过：

```text
Lang(R)
```

意思是：

> Regular Expression `R` 所能够 Match 的所有字符串组成的集合。

例如：

```text
R = a*
```

那么：

```text
Lang(R) = {ε, a, aa, aaa, ...}
相当于是a*全家都在这了 这就相当于是一种语言了
```

也就是说：

```text
a*
```

可以 Match：

```text
ε
a
aa
aaa
aaaa
...
```

这些所有字符串合在一起，就是 `Lang(R)`。

---

现在 DFA 也有完全类似的概念。

对于一个 DFA：

```text
D
```

我们写：

```text
Lang(D)
```

意思是：

> **被 DFA ****`D`**** Accept 的所有字符串组成的集合。**

例如某个 DFA 会 Accept：

```text
a
ba
aba
bba
abba
...
```

那么这些字符串全部放在一起：

```text
Lang(D) = {a, ba, aba, bba, abba, ...}
```

这就是这个 DFA 的 Language。

所以现在出现了一个非常重要的联系：

```text
Regular Expression
       ↓
    Language
       ↑
      DFA
```

也就是说：

Regex 和 DFA 看起来完全不一样。

一个长得像：

```text
(a|b)*abb
```

另外一个长得像：

```text
圆圈 + 箭头
```

但它们其实都在做同一件事情：

> **描述一组字符串。**

区别只是描述方法不同。

---

## 17. Regular Language 是什么？

课件给了这一类 Language 一个名字：

> DFA 所描述的 Language 叫做 **Regular Language**。

也就是说，如果存在某一个 DFA：

```text
D
```

而这个 DFA 接受的所有字符串刚好就是 Language `L`：

```text
Lang(D) = L
```

那么我们就说：

```text
L 是一个 Regular Language
```

之后我们会逐渐发现一个非常重要的关系：

```text
Regular Expression
        ↕
       NFA
        ↕
       DFA
```

它们的外表看起来非常不同：

```text
Regex：字符 + | + *

NFA：State + Transition

DFA：State + 唯一 Transition
```

但是它们实际上可以描述同一类 Language：

```text
Regular Languages
```

这也是 COMP2022 非常重要的主题：

### Equivalence

也就是：

> **两个计算模型虽然长得完全不同，但它们能描述 / 解决的东西可能完全一样。**

---

## 18. DFA 的正式定义

数学上，一个 DFA 通常用五个东西描述：

```text
D = (Q, Σ, δ, q0, F)
```

这里虽然看起来像一堆数学符号，但其实每一个东西都非常简单。

可以把它理解成一张 DFA 的完整“说明书”。

---

### Q：有哪些 States？

`Q` 表示：

> 这台 DFA 一共有哪几个 State。

例如：

```text
Q = {Even, Odd}
```

意思就是：

```text
这台机器只有两个可能的 State：

Even
Odd
```

---

### Σ：Alphabet

`Σ` 表示输入允许出现哪些字符。

例如：

```text
Σ = {a, b}
```

意思就是：

> 输入字符串里面只会出现 `a` 和 `b`。

---

### δ：Transition Function

`δ` 表示 Transition Function。

也就是：

```text
现在在哪个 State
+
读到什么字符
=
下一步去哪
```

例如：

```text
Even + a → Odd
Odd  + a → Even

Even + b → Even
Odd  + b → Odd
```

这些规则合在一起，就是 Transition Function。

---

### q0：Start State

`q0` 表示：

> 字符串还没有开始读取的时候，机器从哪个 State 开始。

例如：

```text
q0 = Even
```

为什么？

因为字符串还没有开始读的时候：

```text
a 出现了 0 次
```

而：

```text
0 是偶数
```

所以一开始机器的“存档”就是：

```text
Even
```

---

### F：Final States

`F` 表示：

> 哪些 State 属于 Final State / Accepting State。

例如我们的目标是：

> 接受所有 `a` 出现偶数次的字符串。

那么：

```text
F = {Even}
```

意思就是：

```text
字符串读完以后：

停在 Even → Accept
停在 Odd  → Reject
```

---

所以：

```text
D = (Q, Σ, δ, q0, F)
```

其实只是在正式描述五件事情：

```text
Q   = 有哪些房间？

Σ   = 可能输入什么字符？

δ   = 每个字符来了以后要去哪个房间？

q0  = 一开始在哪个房间？

F   = 哪些房间算通关？
```

一句话理解：

> **DFA 的五个部分就是：State、Input、Transition、Start、Accept。**

---

## 19. 真正困难的不是“读 DFA”，而是“设计 DFA”

看到一张 DFA 图以后判断：

```text
abb
```

最终是 Accept 还是 Reject，通常并不难。

真正比较难的是：

> 给你一个 Language，你怎么自己设计出 DFA？

课件给出了一个非常重要的设计原则：

> **想象自己就是 Automaton。读到目前为止，为了最后判断 Accept / Reject，我需要记住什么信息？**

然后：

> **每一种需要记住的情况，就是一个 State。**

所以不要一看到题目就想：

```text
我要画几个圆圈？
```

而应该先想：

```text
我到底需要几个不同的“存档情况”？
```

---

## 20. 例子：设计一个包含 `aab` 的 DFA

目标：

> 接受所有包含 substring `aab` 的字符串。

Alphabet：

```text
Σ = {a, b}
```

首先不要急着画圆圈。

先问：

> 我读字符串的时候需要记住什么？

---

### State 0：什么有用的信息都没有

```text
q0：
目前还没有匹配上 aab 的开头
```

---

### State 1：刚刚看到了 `a`

```text
q1：
我已经匹配了 a
```

也就是说目前的进度是：

```text
a__
```

现在最希望下一个字符还是：

```text
a
```

---

### State 2：刚刚看到了 `aa`

```text
q2：
我已经匹配了 aa
```

现在距离：

```text
aab
```

只差最后一个：

```text
b
```

---

### State 3：已经找到 `aab`

```text
q3：
aab 已经出现过
```

这时候事情已经完成了。

因为题目只要求：

> 字符串里面是否曾经出现过 `aab`。

一旦已经出现过：

```text
aab
```

那么后面无论再输入什么，都无法改变：

```text
“这个字符串曾经出现过 aab”
```

这个事实。

所以：

```text
q3 --a--> q3
q3 --b--> q3
```

也就是以后永远留在 `q3`。

---

最主要的匹配进度可以看成：

```text
q0 --a--> q1
q1 --a--> q2
q2 --b--> q3
```

大白话就是：

```text
什么都没有
   ↓ 读到 a

看到 a
   ↓ 再读到 a

看到 aa
   ↓ 再读到 b

找到 aab
```

这就是 State 的本质：

> **记录目前为了判断最终答案，已经走到了什么进度。**

---

## 21. 设计 DFA 时我现在会问自己的问题

以后设计 DFA，我觉得最有用的不是直接画图，而是按照下面的顺序。

### 第一步：我要最终判断什么？

例如：

```text
是否包含 aab？
```

或者：

```text
a 的数量是不是偶数？
```

或者：

```text
字符串是不是以 abb 结尾？
```

---

### 第二步：过去哪些信息真的需要记住？

问自己：

> 如果我只能保留一点点过去的信息，哪些东西是之后判断答案必须知道的？

这些信息就是 State 的来源。

---

### 第三步：把每种“存档情况”变成 State

例如：

```text
什么都没匹配到 → q0

看到 a → q1

看到 aa → q2

已经看到 aab → q3
```

---

### 第四步：检查每一个 State 遇到每一种 Input 会去哪

例如 Alphabet 是：

```text
Σ = {a, b}
```

那么对于每个 State 都要问：

```text
读到 a → 去哪里？

读到 b → 去哪里？
```

不能漏。

因为 DFA 必须知道每一种情况下的 Next State。

---

### 第五步：确定哪些 State 是 Final State

最后问：

> 哪些“存档情况”意味着题目的条件已经满足？

然后把这些 State 设成 Final State。

所以设计 DFA 的核心不是：

```text
画圆圈
```

而是：

```text
找出需要保存的信息
↓
把不同信息变成 State
↓
设计 State 如何更新
```

---

## 22. Complement：DFA 一个非常漂亮的性质

假设已经有一个 DFA：

```text
D
```

它接受：

> 所有包含 `aab` 的字符串。

现在我想要另外一个 Language：

> 所有不包含 `aab` 的字符串。

对于 DFA，有一个非常简单的办法：

### 把 Final State 和 Non-final State 对调。

原来：

```text
Final State     → Accept
Non-final State → Reject
```

交换以后：

```text
原来的 Final State     → Reject
原来的 Non-final State → Accept
```

为什么这样就可以？

因为一个 DFA 读完整个字符串以后，一定会停在某一个 State。

原来如果：

```text
停在 Final State
```

就：

```text
Accept
```

现在把 Final / Non-final 完全反过来，相当于：

```text
原来 Accept 的 → 全部 Reject

原来 Reject 的 → 全部 Accept
```

于是新的 DFA 接受的就是：

> 原来 Language 之外的所有字符串。

如果原来的 Language 叫：

```text
L
```

那么新的 Language 可以普通地写成：

```text
Σ* 中所有不属于 L 的字符串
```

也就是：

> **L 的 Complement（补集）。**

---

## 23. DFA 的程序实现简单得离谱

一个 DFA 真正运行起来，其实基本就是：

```python
state = start_state

for char in input_string:
    state = transition[state, char]

return state in final_states
```

就这么多。

翻译成人话：

```text
从 Start State 开始
        ↓
读取一个 Character
        ↓
根据 Current State + Character 查 Transition
        ↓
进入 Next State
        ↓
读取下一个 Character
        ↓
继续
        ↓
字符串全部读取完成
        ↓
现在是不是 Final State？
```

如果输入字符串长度是：

```text
n
```

那么 DFA 基本就是：

```text
一个字符
↓
走一步

一个字符
↓
走一步

一个字符
↓
走一步
```

所以长度为 `n` 的字符串，大约就是：

```text
n 个字符 → n 次 State 更新
```

这和 Backtracking 那种：

```text
试
↓
失败
↓
退回去
↓
再试
↓
再失败
↓
再退回去
```

形成了非常明显的区别。

DFA 不需要不断回头尝试不同路线。

它只需要：

```text
Current State + 当前字符
            ↓
唯一 Next State
```

然后一直往前读。

---

## 24. 所以 Cloudflare 和 DFA 到底有什么关系？

现在终于可以把整个故事串起来。

```text
现实世界：
Cloudflare 需要检查危险 HTTP Request
            ↓
使用 Regex 描述危险 Pattern
            ↓
但是 Regex 只是 Specification
            ↓
还需要 Matching Algorithm
            ↓
一种办法：Backtracking
            ↓
某些 Regex 出现大量可能路径
            ↓
Catastrophic Backtracking
            ↓
CPU 使用量爆炸
            ↓
大型服务事故
```

然后理论计算机科学提供了另外一个重要思路：

```text
Regular Expression
        ↓
转换 / 编译成 Automata
        ↓
一个字符一个字符处理
        ↓
Current State + Input
        ↓
Next State
        ↓
最终 Accept / Reject
```

所以 Week 3A 的 Cloudflare 并不是一个和课程无关的“业界故事”。

它真正想说明的是：

> **我们为什么要关心 Regular Expression 背后的计算模型和 Matching Algorithm。**

理论不是为了把简单事情写成复杂符号。

很多时候反而是在做相反的事情：

> **把一个复杂的现实问题抽象成一个简单模型，让我们能够真正分析它为什么快、为什么慢、能做什么、不能做什么。**

---

## 25. Regex 和 DFA：两种完全不同的视角

现在再看：

```regex
(a|b)*abb
```

我觉得应该同时建立两个视角。

---

### Regex 视角

Regex 回答：

> **我要什么样的字符串？**

例如：

```text
(a|b)*abb
```

大白话：

```text
前面可以有任意数量的 a / b
+
最后以 abb 结尾
```

所以 Regex 更像：

### Pattern Description

也就是：

> 描述目标字符串长什么样。

---

### DFA 视角

DFA 回答：

> **当我一个字符一个字符读取的时候，需要记住什么？**

例如为了检查：

```text
是否以 abb 结尾
```

机器可能需要保存类似这些信息：

```text
q0：目前没有匹配到有用的后缀

q1：目前最后看到的是 a

q2：目前最后看到的是 ab

q3：目前最后看到的是 abb
```

然后随着新的 Character 不断进入：

```text
Current State
+
Character
↓
Next State
```

所以 DFA 更像：

### Pattern Execution

也就是：

> 真正一步一步地处理输入字符串。

因此可以这样记：

```text
Regex
=
描述我要什么

DFA
=
记录我现在知道什么
+
根据新字符不断更新
```

---

## 26. 我对 Week 3 的最终理解

如果让我现在用一句话总结 Week 3：

> **Regex 告诉电脑“我要找什么样的字符串”，而 DFA 告诉电脑“我应该怎样只保存有限的信息，一步一步检查这个字符串”。**

再展开一点：

```text
Regex
=
描述 Pattern


DFA
=
使用 State 保存必要的过去信息
+
一个字符一个字符读取
+
根据 Current State + Input 更新 Next State
+
字符串结束以后判断 Accept / Reject
```

而 DFA 最重要的设计思想是：

> **State 不是随便画出来的圆圈。**

State 真正代表：

> **为了最后做决定，我现在必须记住的过去信息。**

所以：

```text
过去完整的信息
        ↓
只保留未来判断需要的信息
        ↓
      State
```

然后：

```text
旧 State
+
新的 Input
↓
新的 State
```

不断重复。

一旦理解这一点，DFA 就不再是一堆：

```text
q0
q1
q2
箭头
双圆圈
```

而会变成一个非常自然的程序模型。

---

## 27. 最后的知识地图

目前 COMP2022 已经可以串成：

```text
Week 1
Computational Problem
Specification
Algorithm
Models of Computation
        ↓

Week 2
Regular Expression
        ↓
描述 String Pattern
        ↓

Week 3A
怎么执行 Regex？
        ↓
Matching Algorithm
        ↓
Backtracking
        ↓
某些情况下可能非常慢
        ↓
Cloudflare Incident
        ↓

Week 3B
Finite Automata
        ↓
DFA
        ↓
State
Transition
Start State
Final State
Run
Language
        ↓

核心运行逻辑：

Current State + Input
        ↓
Next State
        ↓
不断更新
        ↓
字符串结束
        ↓
Accept / Reject

接下来：
NFA
        ↓
Regex ↔ Automata
        ↓
Regular Languages
```

所以目前我们并不是在学习几个互相独立的知识点。

实际上课程一直在围绕同一个问题：

> **我们究竟可以用什么样的模型描述“计算”，这些模型能解决什么问题，以及怎样用最简单的结构理解它们？**

