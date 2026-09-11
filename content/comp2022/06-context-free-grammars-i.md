# Non-Regular Languages & Context-Free Grammars

前面 Week 2–5，我们一直在研究同一个层级：

Regular Expressions
↓
NFA
↓
DFA

虽然它们长得完全不一样，但它们能描述的语言范围其实是一样的：

**Regular Languages。**

Week 6 开始，我们第一次碰到一个非常重要的问题：

「是不是所有语言都可以用 DFA / NFA / Regex 表达？」

答案是：

**不可以。**

**为什么？**

因为regular expressions只能表达表达有限的

**DFA 用 state 记录“当前重要情况”；如果需要记录的情况有无限多种，就需要无限多个 state，但 DFA 只能有有限个 state，所以 Regular 做不了**

这也是 Week 6 真正的转折点。

我们先学习怎么证明一个语言超出了 Regular Language 的能力，然后引入一个更强的模型：

Context-Free Grammar，简称 CFG。

---

## 1. Week 6 到底在干嘛？

先从宏观上看。

前几周我们一直在做：

字符串
→ Regex
→ DFA / NFA
→ Accept / Reject

比如：

「字符串是否以 a 结尾」

「字符串里面是否出现 bbc」

「字符串中 a 的数量是否为奇数」

这些问题，DFA 都可以解决。

因为 DFA 只需要记住有限的信息。

例如判断：

「是否出现过 bbc」

其实只需要记：

我现在匹配到哪一步了？

没看到 b
看到 b
看到 bb
已经看到 bbc

所以几个 state 就够了。

但是现在考虑一个新的语言：

L = { aⁿbⁿ : n ≥ 0 }

它包含：

ε

ab

aabb

aaabbb

aaaabbbb

……

要求非常简单：

前面有几个 a，后面就必须有几个 b。

问题来了：

n 没有上限。

可能是：

10 个 a + 10 个 b

也可能：

100000 个 a + 100000 个 b

所以机器必须「记住前面到底出现过多少个 a」。

这就是 DFA 开始出问题的地方。

---

## 2. 什么叫 Non-Regular Language？

Regular Language 可以简单理解成：

能够被 DFA 描述的语言。

也等价于：

能够被 NFA 描述。

也等价于：

能够被 Regular Expression 描述。

所以：

Regular Language
= DFA 能处理
= NFA 能处理
= Regex 能描述

那么：

Non-Regular Language

就是：

没有任何 DFA 可以识别它。

也就是说：

无论你设计多少个 state，只要 state 数量是有限的，都做不到。

---

## 3. 第一个必须记住的 Non-Regular Language

Week 6 直接给了我们一个 Fact：

{ aⁿbⁿ : n ≥ 0 }

不是 Regular Language。

这个结论在 Week 6 里面相当于一个「已知武器」。

你暂时不需要在 COMP2022 这里重新证明它。

你需要做的是：

利用它证明其他语言也不是 Regular。

可以把：

{aⁿbⁿ}

理解成 Week 6 的一个「种子 Non-Regular Language」。

以后看到其他复杂语言，我们想办法把它变成这个已知的 non-regular language。

---

## 4. 为什么 aⁿbⁿ 直觉上不是 Regular？

虽然 lecture 这里把它作为已知事实，但理解直觉非常重要。

假设语言：

{aⁿbⁿ}

输入：

aaaaabbbbb

机器必须知道：

前面一共有 5 个 a。

然后看到 b 的时候，再确认：

后面是不是正好 5 个 b。

如果：

aaaaabbbb

只有 4 个 b，就要 Reject。

如果：

aaaaabbbbbb

有 6 个 b，也要 Reject。

所以问题实际上是：

「记住一个没有上限的数字 n。」

但是 DFA 只有有限个 states。

比如你设计：

q0 = 看过 0 个 a

q1 = 看过 1 个 a

q2 = 看过 2 个 a

……

那 n 可以无限大。

你永远不可能提前准备无限多个 state。

所以 DFA 的有限记忆不够。

大白话：

DFA 很擅长记「状态」。

但不擅长记「一个无限增长的计数」。

---

## 5. Week 6 第一部分真正要学的是 Closure

这一部分最重要的不是让你直接证明 aⁿbⁿ。

而是学习：

Closure Technique。

之前我们已经知道 Regular Languages 对下面这些操作是 closed 的：

Union

Intersection

Complement

什么意思？

例如：

L1 是 Regular

L2 也是 Regular

那么：

L1 ∪ L2

一定还是 Regular。

类似地：

L1 ∩ L2

也一定是 Regular。

Complement 以后也一样是 Regular。

---

## 6. 什么叫 Closed？

这个词其实很简单。

比如：

Regular Languages 在 intersection 下 closed。

意思就是：

Regular + Regular
经过 intersection
结果还是 Regular。

**如果 L 是 Regular，R 也是 Regular，那么它们做 intersection / union / complement 后一定还是 Regular。**

所以反过来：

> **如果 R 已知是 Regular，但运算结果居然是 Non-Regular，那么 L 一定不是 Regular。**

可以想象有一个「Regular Language 俱乐部」。

只要两个成员都属于这个俱乐部：

L1 = Regular

L2 = Regular

那么：

L1 ∩ L2

不会突然跑出俱乐部。

---

## 7. 那怎么用 Closure 证明 Non-Regular？

这就是 Week 6 最关键的证明套路。

假设我们想证明：

L 不是 Regular。

但是我们不知道怎么直接证明。

我们可以：

① 假设 L 是 Regular

② 找一个我们已经知道是 Regular 的语言 R

③ 对它们进行 intersection / union / complement

④ 最后得到一个我们已经知道是 Non-Regular 的语言 M

这时候就出现矛盾。

因为：

如果 L 是 Regular

R 也是 Regular

而 Regular Language 对这些操作 closed

那么结果 M 也应该是 Regular。

但是：

M 明明已经知道不是 Regular。

矛盾。

因此：

最开始「L 是 Regular」这个假设是错的。

所以：

L 是 Non-Regular。

---

## 8. 一个非常重要的证明例子：Lequal

现在定义：

Lequal

表示：

所有 a 和 b 数量相同的字符串。

注意这里不是：

aⁿbⁿ。

因为 Lequal 不要求 a 全在前面、b 全在后面。

例如：

abab

abba

baab

aabb

这些都可能属于 Lequal。

因为它只要求：

#a = #b

现在我们想证明：

Lequal 不是 Regular。

---

## 9. 这里为什么不能直接说它很复杂？

因为「看起来很复杂」不是证明。

所以我们使用刚刚的 Closure Technique。

考虑另一个语言：

L(a*b*)

它代表：

所有 a 必须出现在 b 前面的字符串。

例如：

ε

a

aa

b

bbb

ab

aabb

aaabbbb

都符合。

但是：

aba

bab

不符合。

而：

a*b*

是一个 Regular Expression。

所以：

L(a*b*)

一定是 Regular Language。

---

## 10. Intersection 之后发生了什么？

现在做：

Lequal ∩ L(a*b*)

第一边要求：

a 和 b 数量一样。

第二边要求：

所有 a 在前，所有 b 在后。

两个条件同时满足以后，只可能得到：

ε

ab

aabb

aaabbb

aaaabbbb

……

也就是：

{aⁿbⁿ : n ≥ 0}

所以：

## Lequal ∩ L(a*b*)

{aⁿbⁿ : n ≥ 0}

而右边我们已经知道：

Non-Regular。

现在假设：

Lequal 是 Regular。

那么：

Lequal = Regular

a*b* = Regular

Regular ∩ Regular
应该还是 Regular。

可是结果：

{aⁿbⁿ}

不是 Regular。

矛盾。

因此：

Lequal 不是 Regular。

---

## 11. 这道题真正的思维是什么？

这里说实话很像**reduce归约** **COMP3027**将一个复杂的问题归约到另一个问题 如果那个问题能解决 那么这个问题也能解决

**COMP2022 这里**：我不会直接证明语言 L 是 Non-Regular，就把 L 通过 `∩ / ∪ / complement` 变成一个**已知 Non-Regular 的语言 M**。

所以核心套路完全一样：

> **“这个东西我不好直接证明 → 把它变成一个我已经知道结论的东西 → 利用矛盾倒推出原来的性质。”**

**将未知的语言里 把它变成我一个知道结论的东西 如何通过矛盾来推出原来的性质**

「我要想办法从这个未知语言里面，把一个已知的 Non-Regular Language 筛出来。」

a*b* 在这里就像一个筛子。

Lequal 本来非常大：

abab

abba

aabb

baab

……

我们用：

a*b*

把乱序的全部过滤掉。

最后只留下：

aabb

aaabbb

……

于是成功暴露出了：

aⁿbⁿ。

所以可以这样记：

Closure proof 很像「套筛子」。

目标：

说白了就是如何将一个未知的把它筛选成已知的non-regular lannguage

---

## 12. 第二个例子：Ldiff

定义：

Ldiff 是所有 a 和 b 数量不一样的字符串。

也就是：

#a ≠ #b

例如：

a、b、aab、abbb

都属于 Ldiff。

但：

ab、aabb、abab

不属于，因为它们里面 a 和 b 的数量相同。

Ldiff 和 Lequal 正好是互补的：

* Lequal：a 和 b 数量相同
* Ldiff：a 和 b 数量不同

所以，所有字符串去掉 Ldiff，剩下的就是 Lequal。

---

## 13. 为什么 Ldiff 也是 Non-Regular？

我们已经证明：

Lequal 是 Non-Regular。

现在假设：

Ldiff 是 Regular。

Regular Language 对 complement closed。

那么：

{a,b}* \ Ldiff

也应该 Regular。

但是：

## {a,b}* \ Ldiff

Lequal

而 Lequal 已经知道 Non-Regular。

矛盾。

所以：

Ldiff 也不是 Regular。

---

## 14. Non-Regularity 的考试套路

以后看到：

Show that L is not regular.

先不要一上来画 DFA。

因为题目可能就是在告诉你：

根本不存在 DFA。

优先想：

「我能不能利用已知 Non-Regular Language？」

目前最重要的已知语言：

{aⁿbⁿ : n ≥ 0}

然后尝试：

Intersection

Complement

Union

把题目的 L 变成它。

可以记成：

假设 L Regular
↓
利用 closure operation
↓
构造出已知 Non-Regular Language
↓
产生矛盾
↓
所以 L Non-Regular

这就是 Week 6A 的核心。

---

## 15. 为什么接下来突然开始学 CFG？

因为我们刚刚发现：

**这里Regular Languages 是有能力上限的**

DFA 只有有限记忆。

Regex / NFA / DFA 都属于同一个 Regular Level。

所以有些语言，例如：

aⁿbⁿ

Balanced Parentheses 括号匹配

无法被它们描述。

**所以：我们需要更强的模型**

**Context-Free Languages。**

对应模型就是：

**Context-Free Grammars，CFG**。

课程整体结构现在就很清晰了：

Week 2–5：

Regular Expressions / Automata

↓

Week 6–8：

Context-Free Grammars

↓

Week 9–12：

Turing Machines

也就是说：

我们正在往「更强的计算模型」升级。

---

## 16. 为什么编程语言需要 CFG？

Lecture 给了一个很实际的问题：

编译器怎么知道你的代码有 Syntax Error？

例如：

if x > 10
x = 1

一个 programming language 必须有一些规则告诉编译器：

什么样的字符串算合法程序？

比如：

if 后面应该有什么？

expression 怎么构成？

括号什么时候闭合？

statement 怎么嵌套？

这些东西最麻烦的一点就是：

它们经常有 Nested Structure。

也就是：

嵌套结构。

---

## 17. Regex 最大的问题之一：任意深度嵌套

例如括号：

()

(())

((()))

((((()))))

深度可以无限增加。

如果只是：

()

DFA 当然能处理。

如果最多允许两层：

(())

也可以硬做。

但是问题是：

括号深度没有上限。

可能：

100 层

1000 层

100000 层

你需要记住：

「现在到底还有多少个左括号没有关闭？」

又出现了一个没有上限的计数问题。

这就是为什么：

Balanced Parentheses

不是 Regular Language。

而 CFG 天生非常适合描述这种 recursive / nested structure。

---

## 18. CFG 是什么？

Context-Free Grammar 可以先完全不管正式定义。

大白话：

CFG 就是一套「字符串生成规则」。

Regex 的思路更像：

「告诉我一个字符串应该长什么样。」

DFA 的思路是：

「给我字符串，我从左到右读，然后判断 Accept / Reject。」

CFG 的思路则完全不同：

「我从一个起点开始，按照规则不断展开，看看能生成什么字符串。」

所以：

CFG 是一个 Generative Model。

它不是读字符串。

它是生成字符串。

---

## 19. Grammar 最核心的概念：Rewrite

Lecture 里的第一个 CFG：

S → aSb

S → T

T → c

箭头：

→

可以读成：

produces

或者：

rewrites to

也就是：

「可以替换成」。

比如：

S → aSb

表示：

看到 S，可以把它替换成：

aSb

---

## 20. CFG 的四个组成部分

A context-free grammar is made of: CFG由以下组成

**– Variables变量 S, T   **

你把它理解成：

> **“还没做完的占位符”**

只要字符串里还有 `S` 或 `T`，说明还要继续展开。

**– 最终字符Terminals a, b, c (like “input characters”)**

这里是：a, b, c

这些就是最后真正留在字符串里的东西。

所以：aSb

里面：

```
a   terminal
S   variable
b   terminal
```

**–替换规则 Rules (three in this case)**

比如：

```
S → aSb
```

超级大白话：

> **看到 S，可以把它换成 aSb。**

`→` 就读成：

> “可以变成 / 可以替换成”。

**– 起点Start variable S**

这里是：

```
S
```

意思是：

> **每次造字符串，都必须从 S 开始。**

---

## 21. Variable 和 Terminal 怎么理解？

这是刚学 CFG 时最容易混的地方。

可以这样理解：

Variable 就像“还没完成的占位符”，之后还可以继续替换。

Terminal 就像“已经完成的字符”，不能再替换，最后会出现在生成的字符串里。

例如：

S ⇒ aSb

这里的 a 和 b 已经确定了，但 S 还可以继续展开。

只有当字符串里不再有 Variable，只剩下 Terminals 时，才算生成了最终字符串。

---

## 22. 这个 Grammar 到底生成什么？

还是：

S → aSb

S → T

T → c

先从最简单开始。

S

使用：

S → T

得到：

T

然后：

T → c

得到：

c

所以：

c

是这个 Grammar 可以生成的字符串。

---

## 23. 再生成一次

从：

S

使用：

S → aSb

得到：

aSb

现在中间还有 S。

把 S 换成 T：

aTb

再：

T → c

得到：

acb

所以：

acb

也属于这个 grammar 的语言。

---

## 24. 再多套一层

S

⇒ aSb

然后里面的 S 再使用一次：

S → aSb

于是：

aSb

⇒ aaSbb

然后：

S → T

得到：

aaTbb

最后：

T → c

得到：

aacbb

所以：

aacbb

也能生成。

---

## 25. 再观察规律

我们得到：

c

acb

aacbb

aaacbbb

aaaacbbbb

……

每次使用：

S → aSb

都会：

左边增加一个 a

右边增加一个 b

最后使用：

S → T

T → c

把中间结束成 c。

所以最终语言：

L(G) = {aⁿcbⁿ : n ≥ 0}

注意这里非常重要：

a 和 b 的数量永远相同。

---

## 26. 这就是 CFG 比 DFA 强的关键

DFA 想处理：

aⁿcbⁿ

非常困难。

因为它必须：

读 a

记住一共有多少个 a

然后读完 c 后

确认后面有完全相同数量的 b。

n 可以无限大。

但是 CFG 做这件事非常自然：

S → aSb

因为每增加一个 a：

自动同时增加一个 b。

所以根本不需要「数」。

规则本身保证：

a 和 b 成对出现。

这就是 CFG 的一个非常重要的思想：

用递归结构表达无限关系。

---

## 27. CFG 的生成步骤

Lecture 给出了正式的过程。

我们可以翻译成人话：

第一步：

写下 Start Variable。

例如：

S

第二步：

只要字符串里面还有 Variable：

挑一个 Variable。

例如：

S

再挑一个可以用于它的 rule。

比如：

S → aSb

然后把这个 Variable 替换掉。

继续重复。

第三步：

直到：

所有 Variable 都消失。

只剩 Terminals。

这时得到的字符串就是 grammar 生成的字符串。

---

## 28. Derivation 是什么？

这个生成过程叫：

Derivation。

例如：

S ⇒ aSb ⇒ aaSbb ⇒ aaaSbbb ⇒ aaaTbbb ⇒ aaacbbb

这里的：

⇒

读：

derives

或者：

yields

意思是：

「经过一次 rule replacement 得到」。

注意：

→

和：

⇒

虽然长得像，但是用途不同。

→ 用在 Rule：

S → aSb

表示：

S 可以 rewrite 成 aSb。

⇒ 用在 Derivation：

S ⇒ aSb

表示：

在实际生成过程中，这一步从 S 得到了 aSb。

---

## 29. L(G) 是什么？

这和之前：

Lang(D)

Lang(R)

其实是同一个思想。

之前：

Lang(R)

表示：

Regex R 能匹配的所有 strings。

Lang(D)

表示：

DFA D 能接受的所有 strings。

现在：

L(G)

或者：

Lang(G)

表示：

Grammar G 能生成的所有 terminal strings。

所以整个 COMP2022 一直在问：

「这个模型描述的 language 到底是什么？」

只是模型不断变化。

Regex：

Lang(R)

DFA：

Lang(D)

CFG：

L(G)

---

## 30. CFG 的 shorthand：|

例如：

S → aSb

S → T

可以写成：

S → aSb | T

这里：

|

仍然可以理解成：

or。

也就是说：

S 有两个选择：

要么：

aSb

要么：

T

所以：

S → aSb | T

只是两条 rule 的简写。

---

## 31. 一个新的例子

Grammar：

S → S - S

S → x

S → y

S → z

可以简写成：

S → S - S | x | y | z

它可以生成：

z

因为：

S ⇒ z

也可以生成：

x - x

因为：

S

⇒ S - S

⇒ x - S

⇒ x - x

---

## 32. x - y - z 怎么生成？

从：

S

开始。

先：

S ⇒ S - S

然后我们可以把左边的 S 再展开：

S - S

⇒ S - S - S

然后：

⇒ x - S - S

⇒ x - y - S

⇒ x - y - z

所以这个 Grammar 描述的是：

由 x、y、z 以及减号组成的表达式。

---

## 33. E → E + E | 0 | 1 是什么意思？

这是 lecture 的选择题。

Grammar：

E → E + E | 0 | 1

这里 E 可以：

变成两个 expression 相加

或者直接结束成 0

或者直接结束成 1

例如：

E ⇒ 0

E ⇒ 1

E ⇒ E + E ⇒ 0 + 1

还可以：

E
⇒ E + E
⇒ E + E + E
⇒ 1 + 0 + 1

所以它描述的是：

由 0、1 和 + 构成的 arithmetic expressions。

而不是：

所有非负整数。

也不是：

所有 binary strings。

---

## 34. 一个非常重要的 Grammar

S → AB

A → aA | ε

B → bB | ε

我们一步一步看。

先看 A：

A → aA | ε

A 可以不断：

aA

a a A

a a a A

……

最后：

A → ε

于是得到：

ε

a

aa

aaa

aaaa

……

所以：

A 生成：

a*

也就是：

aⁿ，n ≥ 0。

---

## 35. B 同理

B → bB | ε

可以生成：

ε

b

bb

bbb

bbbb

……

所以：

B 生成：

b*

。

而：

S → AB

意味着：

前面放一个 A 生成的东西

后面放一个 B 生成的东西。

因此：

L(G) = {aⁿbᵐ : n,m ≥ 0}

也就是：

a*b*

。

---

## 36. 这里 ε 又出现了

这里一定要和前面 Regex / NFA 的 ε 联系起来。

ε 永远表示：

empty string。

长度为 0 的字符串。

所以：

A → ε

意思不是：

「A 什么都不能生成」。

而是：

「A 可以在这里结束，并留下空字符串」。

例如：

A → aA → aaA → ε

最后实际上：

aaε

就是：

aa。

所以 ε 在 CFG 里经常作为：

递归的停止条件。

也就是：

Base Case。

---

## 37. 设计 CFG 的第一个技巧：给 Variable 一个“意义”

Lecture 给出的第一个 Tip：

Variables generate substrings with similar properties.

简单说：

不要随便取 S、A、B。

你应该在脑子里知道：

每个 Variable 负责生成什么。

例如刚才：

A = 负责生成任意数量的 a

B = 负责生成任意数量的 b

那么：

S → AB

就非常自然。

所以设计 CFG 时，可以问：

「这个 Variable 的工作是什么？」

---

## 38. 第二个技巧：Think Recursively

这是 CFG 最重要的思维。

不要试图：

一次把整个无限 Language 写出来。

而是问：

「一个更大的合法 string，能不能由一个更小的合法 string 构造出来？」

这其实和 Recursive Function 完全一样：

Base Case

*

Recursive Case

---

## 39. 设计 0ⁿ1ᵐ0ⁿ

Lecture 给出的目标：

{0ⁿ1ᵐ0ⁿ : n,m ≥ 0}

例如：

ε

1

111

00

010

01110

00100

0011100

都可能符合。

要求：

左右两边 0 数量相同。

中间任意数量的 1。

---

## 40. 先处理最难的关系

最难的显然是：

左右 0 数量必须相同。

那就使用：

S → 0S0

每用一次：

左边加一个 0

右边也加一个 0。

所以天然保证：

左右数量相等。

---

## 41. 中间的 1 怎么办？

创建另一个 Variable：

X

让它负责：

任意多个 1。

所以：

X → 1X | ε

于是 X 可以生成：

ε

1

11

111

……

最后：

S → 0S0 | X

意思就是：

S 可以继续在左右包 0。

什么时候不想包了：

就变成 X。

X 再负责生成中间的 1。

所以：

S → 0S0 | X

X → 1X | ε

恰好生成：

0ⁿ1ᵐ0ⁿ。

---

## 42. 这里真正的套路是什么？

看到：

左右数量相等

例如：

aⁿbⁿ

0ⁿ1ᵐ0ⁿ

palindrome

你都应该想到一种结构：

同时生成左右。

例如：

S → aSb

或者：

S → 0S0

这比：

「我要怎么数 n？」

重要得多。

CFG 的强项不是数。

而是：

用 recursive wrapping 保证结构。

---

## 43. Palindrome 是最经典的 CFG 题

Palindrome：

正着读和反着读一样。

例如：

ε

0

1

00

11

010

101

0110

1001

都是 palindrome。

怎么设计？

Lecture 先让你想：

Base Case 是什么？

---

## 44. Palindrome 的 Base Case

最短的 palindrome：

ε

0

1

所以：

S → ε | 0 | 1

这些负责停止递归。

---

## 45. Palindrome 的 Recursive Case

假设：

u

已经是 palindrome。

那么：

0u0

一定还是 palindrome。

因为左右同时增加 0。

同理：

1u1

也一定是 palindrome。

于是：

S → 0S0 | 1S1

加上 Base Cases：

S → 0 | 1 | ε | 0S0 | 1S1

就完成了。

---

## 46. 为什么它能生成 0110？

从：

S

开始：

S ⇒ 0S0

中间 S：

⇒ 1S1

所以：

0S0

⇒ 01S10

现在让：

S → ε

得到：

01ε10

也就是：

0110。

---

## 47. 为什么不会生成 0111？

因为 grammar 每次递归：

要么同时在左右放：

0 ... 0

要么：

1 ... 1

所以左右永远匹配。

因此：

0111

这种首尾不同的字符串根本不可能被生成。

这就是一个好的 CFG：

Rule 自己保证了 Language 的性质。

---

## 48. Balanced Parentheses

这是 Week 6 最重要的一个实际例子：

S → ε | (S)S

它生成：

Balanced Parentheses。

例如：

ε

()

(())

()()

(())()

(()())

但是不会生成：

)

()(

(()

---

## 49. S → (S)S 到底怎么看？

第一次看这个 rule 非常容易懵。

拆成两部分：

(S)

*

S

第一个：

(S)

表示：

生成一对匹配的括号。

里面的 S 可以继续生成一个 balanced structure。

例如：

S ⇒ ε

那么：

(S)

变成：

()

如果里面：

S ⇒ ()

那么：

(S)

就变成：

(())

所以第一个 S 负责：

Nested Structure。

---

## 50. 那最后那个 S 干嘛？

Rule：

S → (S)S

最后还有一个 S。

它允许：

后面继续接另一段 Balanced Parentheses。

例如想生成：

()()

第一次：

S ⇒ (S)S

让括号里面：

S ⇒ ε

得到：

()S

然后后面的 S：

⇒ (S)S

再把里面和最后都变成 ε：

()()

所以：

第一个 S：

负责括号里面的 nesting。

最后一个 S：

负责后面继续 concatenation。

---

## 51. 如果没有最后那个 S 会怎样？

假设写：

S → ε | (S)

那么可以生成：

()

(())

((()))

但是：

()()

生成不了。

因为你只能一直往里面套。

不能在后面再接一组新的 balanced parentheses。

所以：

S → ε | (S)S

中的最后一个 S 非常重要。

一句大白话：

里面那个 S 负责「嵌套」。

后面那个 S 负责「接下一组」。

---

## 52. CFG 为什么特别适合 Programming Languages？

现在回到 lecture 一开始的问题：

Compiler 怎么检查 Syntax？

Programming language 里到处都是：

expression 套 expression

statement 套 statement

block 套 block

parentheses 套 parentheses

例如：

((1 + 2) * (3 + 4))

或者：

if ...
while ...
if ...

这些结构的深度没有固定上限。

而 CFG 有：

Recursive Rules。

所以天然适合描述这种结构。

这也是为什么：

CFG 是 programming language syntax 的基础模型之一。

---

## 53. Derivation Notation

Lecture 最后给了一组符号。

首先：

⇒

表示：

derives in 1 step。

例如：

S ⇒ aSb

只使用了一次 rule。

---

## 54. ⇒ⁿ

表示：

derives in n steps。

也就是：

正好经过 n 次 rewrite。

例如：

如果：

S ⇒ A ⇒ a

那么可以说：

S

经过 2 steps

得到：

a。

---

## 55. ⇒*

星号的意义和你之前见过的一样：

zero or more。

所以：

⇒*

表示：

经过 0 次或更多次 derivation。

注意：

0 次也允许。

所以：

S ⇒* S

也是成立的。

因为我什么都不做。

---

## 56. ⇒+

Plus 表示：

one or more。

也就是说：

至少需要一次 derivation。

这和之前 Regex 里面：

*

和：

*

的直觉是一样的：

* = zero or more

- = one or more

---

## 57. Context-Free Language 的正式意思

如果一个 Language：

可以由某个 Context-Free Grammar 生成。

那么这个 Language 就叫：

Context-Free Language。

也就是说：

CFG 是模型。

Context-Free Language 是这个模型能描述出来的语言。

关系类似：

DFA
→ Regular Language

CFG
→ Context-Free Language

---

## 58. Regular 和 Context-Free 的关系

这一周最重要的宏观结构就是：

Regular Language

只是整个 Language 世界的一部分。

Context-Free Language 能描述更多东西。

例如：

aⁿbⁿ

Balanced Parentheses

这些 Regular Level 做不到。

但 CFG 可以。

所以可以把能力理解成：

Regular
⊂
Context-Free

也就是：

CFG 比 DFA / Regex 更有表达能力。

但注意：

这不代表 CFG 能解决所有问题。

Week 9 以后还会继续出现更强的：

Turing Machines。

---

## 59. 怎么证明自己设计的 CFG 是正确的？

Lecture 最后特别补充了这个问题。

假设题目要求你设计一个 CFG。

你写出一些 rules 后，不能只说：

「看起来应该可以。」

真正完整的 justification 要检查两个方向：

Soundness

和：

Completeness。

---

## 60. Soundness 是什么？

Soundness：

Every string generated by the grammar belongs to the target language.

大白话：

「我的 grammar 有没有生成不该生成的东西？」

也就是：

不要生成太多。

例如目标：

Palindrome。

你设计的 grammar 如果能生成：

0111

那就有问题。

因为：

0111

不是 palindrome。

所以 Soundness 防止：

Grammar 太宽。

---

## 61. Completeness 是什么？

Completeness：

Every string in the target language can be generated by the grammar.

大白话：

「所有应该生成的字符串，我是不是都能生成？」

也就是：

不要漏掉。

例如目标包含：

()()

但是你的 grammar：

S → ε | (S)

生成不了：

()()

那就不 Complete。

所以 Completeness 防止：

Grammar 太窄。

---

## 62. Palindrome Grammar 怎么证明 Soundness？

Grammar：

S → 0 | 1 | ε | 0S0 | 1S1

Base Cases：

ε

0

1

全部都是 palindrome。

Recursive Cases：

如果 S 生成的是 palindrome u：

0u0

仍然 palindrome。

1u1

仍然 palindrome。

所以无论怎么生成：

最终结果一定是 palindrome。

这就是 Soundness。

---

## 63. Palindrome Grammar 怎么证明 Completeness？

反过来考虑任意一个 binary palindrome。

它只有三种可能。

第一种：

长度 0。

就是：

ε。

第二种：

长度 1。

就是：

0 或 1。

第三种：

长度 ≥ 2。

既然它是 palindrome：

第一个字符和最后一个字符一定一样。

所以要么：

0 ... 0

要么：

1 ... 1

而中间部分：

本身也是一个更短的 palindrome。

所以可以递归使用：

S → 0S0

或者：

S → 1S1。

因此：

所有 binary palindrome 都能够被 grammar 生成。

这就是 Completeness。

---

## 64. Soundness + Completeness 一句话记忆

你可以直接记：

Soundness：

不能多生成。

Completeness：

不能少生成。

或者更直观：

Soundness：

Grammar → Language

我生成出来的必须合法。

Completeness：

Language → Grammar

所有合法的我都能生成。

两边都成立：

Grammar 才真正等于目标 Language。

---

## 65. Week 6 和前面知识真正的联系

现在把 Week 2–6 整条线串起来。

Week 2：

Regular Expression

我们学习：

「怎么描述字符串 Pattern。」

↓

Week 3：

DFA

我们学习：

「怎么用有限 state 读取字符串并判断 Accept / Reject。」

↓

Week 4：

NFA

加入：

nondeterminism

ε-transition

↓

Week 5：

Regex / NFA / DFA 互相转换

最后发现：

这些模型虽然形式不同，但是表达能力一样。

↓

Week 6A：

第一次问：

「这个 Regular Level 到底有没有极限？」

答案：

有。

例如：

aⁿbⁿ

不是 Regular。

↓

Week 6B：

既然 Regular Level 不够：

引入一个更强的模型：

Context-Free Grammar。

它用：

Recursive Rewrite Rules

来表达更复杂的结构。

---

## 66. Week 6 最核心的思想

如果这一周你最后只记住一个东西，我建议记这个：

前几周的 DFA 像一个「有限记忆的字符串扫描器」。

Week 6 的 CFG 则像一个「递归的字符串生成器」。

DFA：

输入字符串
↓
一个字符一个字符读
↓
更新有限 state
↓
Accept / Reject

CFG：

Start Variable
↓
不断使用 Rules
↓
递归展开
↓
生成字符串

两者思考方式完全不同。

---

## 67. 做题时怎么判断应该想到什么？

如果题目问：

Is this language regular?

或者：

Show L is not regular.

优先想：

Closure Technique

以及：

能不能构造出 aⁿbⁿ。

---

如果题目给：

S → ...

然后问：

What is the language of this grammar?

思路：

不要只看 rule。

自己先生成：

最短字符串

下一层

再下一层

观察规律。

---

如果题目问：

Design a CFG for ...

思路：

① 找 Base Case

② 找 Recursive Structure

③ 给不同 Variable 分工

④ 检查有没有多生成

⑤ 检查有没有漏生成

---

## 68. Week 6 Tutorial 实际会考什么？

根据 lecture，Tutorial 主要分两部分。

第一部分：

Showing languages are not regular。

也就是：

给你一个语言。

让你利用：

已知 Non-Regular Language

*

Closure Properties

证明它不是 Regular。

核心套路：

Assume Regular
→ closure
→ 得到 known Non-Regular
→ contradiction。

---

第二部分：

Context-Free Grammars。

主要两种题：

给你 CFG：

让你用 English 描述：

它到底生成什么 Language。

以及：

给你一个 English 描述的 Language：

让你反过来设计 CFG。

---

## 69. 我目前最应该真正学会的几个能力

学完 Week 6，我应该能够做到：

看到：

{aⁿbⁿ}

知道它是经典 Non-Regular Language。

看到一个语言：

会考虑能不能用 intersection / complement 把它变成 aⁿbⁿ。

看到：

S → aSb | ε

能通过实际 derivation 推出它生成什么。

知道：

Variable

Terminal

Rule

Start Variable

分别是什么意思。

能自己设计简单 CFG。

特别是看到：

左右需要匹配

或者：

nested structure

时，会想到 recursive wrapping。

例如：

S → 0S0

S → 1S1

S → (S)S。

最后：

能够用：

Soundness

Completeness

检查自己的 CFG 是否真的正确。

---

## 70. 最后一张知识地图

整个 Week 6 可以压成：

Regular Level
│
├─ Regex
├─ DFA
└─ NFA
│
│ 有能力上限
↓
Non-Regular Languages
│
├─ 经典例子：aⁿbⁿ
│
└─ Closure Technique
├─ Union
├─ Intersection
└─ Complement
│
↓
需要更强模型
│
↓
Context-Free Grammar
│
├─ Variables
├─ Terminals
├─ Rules
└─ Start Variable
│
↓
Derivation / Rewrite
│
↓
Recursive Structure
│
├─ aⁿcbⁿ
├─ 0ⁿ1ᵐ0ⁿ
├─ Palindrome
└─ Balanced Parentheses
│
↓
检查 Grammar
│
├─ Soundness：不能多生成
└─ Completeness：不能少生成

---

## 71. 一句话总结 Week 6

Week 6 真正想告诉我的其实是：

「DFA / Regex 的有限记忆有极限，所以有些需要无限计数或递归嵌套的语言不是 Regular；为了描述这些更复杂的结构，我们开始使用能够递归生成字符串的 Context-Free Grammar。」

如果再压缩：

Regular 不够用了。

所以：

开始学 CFG。
