# Tutorial 06 — Non-Regular Languages & Context-Free Grammars

Q1

![题目截图 1][image1]

先展开题目

n \= 0 → ε

n \= 1 → ab

n \= 2 → aabb

n \= 3 → aaabbb

…

所以 L \= {ε, ab, aabb, aaabbb, ...}&nbsp;

N大于等于1 说明没有ε

&nbsp;

so我们可以写成

L \= L₁ ∪ {ε}&nbsp;

&nbsp;

最开始我们假设L1是regular

而{ϵ} is regular.

L1​∪{ϵ} is regular.&nbsp;

但是But L1∪{ϵ}= L, and L is known to be non-regular.&nbsp;

所以这里对于L1是regular的假设是错的

矛盾Contradiction. Therefore L1L\_1 is not regular.&nbsp;

&nbsp;

Q1.2

![题目截图 2][image2]

引入a\*b\*的概念

**`a*b*`：a 有几个、b 有几个，各管各的。**

**`aⁿbⁿ`：a 和 b 必须一样多**&nbsp;

**`a*b*`**\= L+L2 （因为这里L无法表达出abb,aab这种概念）

所以 L=**`a*b* -`** L2&nbsp;

\= L(a\*b\*) ∩ complement(L₂) 可以翻译为 `complement(B)` 可以理解成“所有不在 B 里的东西”。

于是：(x in A) and not (x in B)&nbsp;

假设 `L₂` 是 Regular。

那么 `complement(L₂)` 也是 Regular。

`L(a*b*)` 也是 Regular。

Regular 对 intersection closed，所以

`L(a*b*) ∩ complement(L₂)` 应该也是 Regular。

但这个结果就是已知 Non-Regular 的 `L`。

矛盾。

所以 `L₂` 是 Non-Regular&nbsp;

Q1.3

![题目截图 3][image3]

目标还是将未知的转化为已知的

假设 `L₃` 是 Regular。

`{b}` 是 Regular，所以 `L₃{b}` 也是 Regular（regular 对 concatenation closed） 这里是L3b 意思是L3生成完后再添加一个b

`{ε}` 也是 Regular，所以 `L₃{b} ∪ {ε}` 也是 Regular（对 union closed）。

但 `L₃{b} ∪ {ε} = L = {aⁿbⁿ : n ≥ 0}`，而 `L` 已知是 Non-Regular。&nbsp;

&nbsp;

Q2

![题目截图 4][image4]

i \= j \+ k

↓ 用 a\*b\* 把 c 删掉

k \= 0

↓

i \= j

↓

得到 a^n b^n

↓

已知 Non-Regular

↓

所以原来的 L₁ 也 Non-Regular

![题目截图 5][image5]

Q3

![题目截图 6][image6]

> Use this to show that the set of well-balanced parentheses is not regular.

意思是：

> **利用刚才这个已知的 Non-Regular language，去证明“合法括号语言”也是 Non-Regular。**

例如：

ε        ✅

()       ✅

(())     ✅

()()     ✅

(()())   ✅

((()))   ✅

这些都合法。

但：

(        ❌

)        ❌

(()      ❌

())      ❌

)(       ❌

这些不合法。

&nbsp;

假设 B 是 Regular

&nbsp;

R 是 Regular

&nbsp;

Regular ∩ Regular

应该还是 Regular

&nbsp;

所以 B ∩ R 应该 Regular

&nbsp;

但 B ∩ R \= { (^n )^n : n ≥ 0 }

&nbsp;

它和 {a^n b^n} 是同一种结构

而 {a^n b^n} 已知 Non-Regular

矛盾

&nbsp;

Q4 CFG

![题目截图 7][image7]

按照这套 CFG 规则，怎么一步一步把起点 `E` 变成字符串 `a + b × c`？&nbsp;

E \= expression，整个表达式

T \= term，一项

F \= factor，一个更小的单位

V \= variable，变量 a/b/c

C \= constant，常数 1/2/3

![题目截图 8][image8]

现在才进入 **leftmost / rightmost**。&nbsp;

## **Leftmost 的做法**

规则选择还是刚才那些，只不过规定：

> **每一步，有多个大写字母时，只能先展开最左边那个。**

**Rightmost 就反过来  从右到左**

**Q5**

**![题目截图 9][image9]**

**看到一个 language 的格式，自己写 CFG 规则把它“造出来”**&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

**Q6**

**![题目截图 10][image10]**

## 套路总结

**判断 Regular / Non-Regular 的直觉套路**<br>
 DFA 的一个 state 可以理解成“记住一种情况”。如果只需要记有限种情况，比如“最后是不是 a”“奇偶数”“有没有见过 bbc”，就是 Regular；如果必须记一个可能无限增长的信息，比如 `aⁿbⁿ` 要记前面到底有多少个 a，或者括号要记还有多少层没关，就很可能不是 Regular。关键不是“字符串无限长”，而是“需要记住的情况是不是无限多种”。

**Closure 证明 Non-Regular 的套路**<br>
 核心不是直接证明未知语言 `Lx`，而是：<br>
 `未知 Lx → 找一个 Regular 的筛子 R → 做 ∩ / ∪ / complement / concatenation → 变成已知 Non-Regular 的 L → 矛盾`。<br>
 你今天做过的几个典型：<br>
 `L1 = {aⁿbⁿ:n≥1}`：补回 `ε`，得到已知的 `{aⁿbⁿ:n≥0}`；<br>
 `L2 = {aⁿbᵐ:m≠n}`：用 `not L2 AND a*b*`，得到数量相等的 `aⁿbⁿ`；<br>
 `L3 = {aⁿbⁿ⁻¹}`：每个字符串后面补一个 `b`，再补 `ε`，得到 `aⁿbⁿ`；<br>
 `i=j+k` 那题：用 `a*b*` 把 `c` 全筛掉，相当于令 `k=0`，于是 `i=j`，得到 `aⁿbⁿ`；<br>
 balanced parentheses：用“所有 `(` 在前、`)` 在后”的 Regular language 去筛，最后只剩 `((...))`，结构等同于 `aⁿbⁿ`。

**CFG 的大白话套路**<br>
 CFG \= “合法字符串的制作说明书”。<br>
 `Variable` \= 还没做完的占位符，比如 `S,T`；<br>
 `Terminal` \= 最后真正留下的字符，比如 `a,b,c`；<br>
 `Rule` \= 替换说明，比如 `S → aSb`；<br>
 `Start variable` \= 从哪里开始，通常是 `S`。<br>
 做 derivation 就是：`从 S 开始 → 不断替换 Variable → 最后只剩 Terminal`。<br>
 Leftmost derivation \= 每次展开最左边的 non-terminal；Rightmost \= 每次展开最右边的 non-terminal。

**自己设计 CFG 的套路**<br>
 先看 language 的指数关系。<br>
 **同一个指数 → 要绑在一起生成 → 用 recursion。**<br>
 比如 `aⁿ...cⁿ`，想到 `A → aAc`。<br>
 **不同指数 → 各生成各的。**<br>
 比如 `aⁿbᵐ`，想到 `A → aA | ε` 和 `B → bB | ε`。<br>
 **固定字符 → 直接写死。**<br>
 比如 `{aⁿbcⁿb}`，可以用 `S → Ab`，`A → aAc | b`。

&nbsp;

&nbsp;

[image1]: question-01.png

[image2]: question-02.png

[image3]: question-03.png

[image4]: question-04.png

[image5]: question-05.png

[image6]: question-06.png

[image7]: question-07.png

[image8]: question-08.png

[image9]: question-09.png

[image10]: question-10.png
