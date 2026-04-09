---
title: "Andrej Karpathy's Math Proves Agent Skills Will Fail. Here's What to Build Instead."
channel: The AI Automators
url: "https://www.youtube.com/watch?v=I2K81s0OQto"
cover: imgs/cover.jpg
description: "👉 Get ALL of our systems & join hundreds of serious AI builders in our community  🔗 PRDs: GitHub Repo: https://github.com/theaiautomators/claude-code-agentic-rag-series/tree/main/ep6-agent-harness"
language: en
---

# Andrej Karpathy's Math Proves Agent Skills Will Fail. Here's What to Build Instead.

👉 Get ALL of our systems & join hundreds of serious AI builders in our community  🔗 PRDs: GitHub Repo: https://github.com/theaiautomators/claude-code-agentic-rag-series/tree/main/ep6-agent-harness

# Description

👉 Get ALL of our systems & join hundreds of serious AI builders in our community 
https://www.theaiautomators.com/?utm_source=youtube&utm_medium=video&utm_campaign=tutorial&utm_content=cc-harness
🔗 PRDs: GitHub Repo: https://github.com/theaiautomators/claude-code-agentic-rag-series/tree/main/ep6-agent-harness

A lot of people are banking on 2026 as the year AI delivers real business value, not blog posts and social media drafts, but complex multi-stage workflows like compliance audits, contract reviews, and risk analysis. 

The biggest challenge? Reliability. 

As Andrej Karpathy describes with the March of Nines, a 10-step agentic workflow at 90% per step will fail over 6 times a day. Agent skills help, but prompting alone won't get you to production-grade reliability.

The solution is harness engineering: putting AI systems on deterministic rails with validation, state management, and programmatic control. 

In this video, we build a specialized contract review harness into our Python and React app, inspired by Anthropic's legal plugin. 

It runs an 8-phase process with sub-agents, parallel processing, file system management, and template-based output, all orchestrated in code rather than left to the LLM to figure out.

🔗 Links:
GitHub Repo (PRDs): https://github.com/theaiautomators/claude-code-agentic-rag-series
Skills Bench Evaluation: https://www.skillsbench.ai/
Stripe Minions Post: https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2
Episode 5 (Tool Calling & Sandboxes): https://www.youtube.com/watch?v=R7OCrqyGMeY
Episode 4 (Agent Skills): https://www.youtube.com/watch?v=4Tp6nPZa5is

Full codebase available to AI Automators community members

📌 What's covered:

- The reliability problem: why agentic workflows compound failure and what the March of Nines means in practice
- Agent skills: what they are, why they help, and where they fall short (Skills Bench evaluation results)
- Harness engineering: putting AI on deterministic rails instead of hoping it follows instructions
- Stripe's minions: how they scaffold Claude Code with 3M tests to merge 1,300 PRs per week
- Live demo: 8-phase contract review harness with clause extraction, risk analysis, and red-line generation
- Sub-agents with isolated context windows running cheaper models (Gemini 2.5 Flash) at scale
- 12 key harness design principles: architecture, planning, file systems, delegation, tool calling, memory, state machines, code execution, context management, human-in-the-loop, validation loops, and skills

🔍 Tech stack:

- Python backend / React frontend
- Supabase (state management and harness runs table)
- LLM Sandbox (Docker-based code execution)
- Langfuse (observability and token tracking)
- Virtual file system with workspace-scoped scratch pads
- Template-based Word document generation for reliable output

Key takeaway: For complex, multi-stage workflows that need to run at scale, agent skills alone aren't enough. 

Specialized harnesses let you codify your process into deterministic phases with validation, sub-agent delegation, and programmatic output, turning unreliable AI demos into production systems.

📌 This is Episode 6 of our AI Builder series where we're building a full AI agent web app from scratch using Claude Code.

⏱️ Timestamps:
00:00 Skills vs Harnesses
04:45 Specialized Harness Demo
11:50 12 Things You Need to Know

#AI #HarnessEngineering #AIAgents #AgentSkills #ContractReview #ClaudeCode #AgenticRAG #LLM #Supabase #Gemini #Anthropic #AIBuilder

# Chapters

* [00:00:00] Skills vs Harnesses
* [00:04:45] Specialized Harness Demo
* [00:11:50] 12 Things You Need to Know

# Transcript

1
00:00:00,080 --> 00:00:05,120
A lot of people are banking on 2026 to

2
00:00:02,560 --> 00:00:07,359
be the year where AI gets real work done

3
00:00:05,120 --> 00:00:08,800
and delivers real business value. And

4
00:00:07,359 --> 00:00:11,039
I'm not talking about small stuff like

5
00:00:08,800 --> 00:00:13,040
writing blog posts or drafting social

6
00:00:11,039 --> 00:00:15,359
media content. I'm talking about an AI

7
00:00:13,039 --> 00:00:17,839
system that can successfully execute

8
00:00:15,359 --> 00:00:19,600
complex workflows that really impact the

9
00:00:17,839 --> 00:00:22,240
bottom line. Things like compliance

10
00:00:19,600 --> 00:00:24,800
audits, risk analysis, financial

11
00:00:22,239 --> 00:00:27,839
reports, impact assessments. These are

12
00:00:24,800 --> 00:00:29,920
complex multi-stage human processes that

13
00:00:27,839 --> 00:00:32,719
involve large amounts of data that are

14
00:00:29,920 --> 00:00:34,399
in theory primed for AI. And the biggest

15
00:00:32,719 --> 00:00:37,120
challenge with these types of workflows

16
00:00:34,399 --> 00:00:39,679
is reliability. Andre Carpathy describes

17
00:00:37,119 --> 00:00:42,558
this as the march of nines where you can

18
00:00:39,679 --> 00:00:45,119
reach the first 90% of reliability with

19
00:00:42,558 --> 00:00:47,439
a strong build and a good demo. But each

20
00:00:45,119 --> 00:00:49,759
additional nine requires comparable

21
00:00:47,439 --> 00:00:52,079
engineering effort to achieve. And the

22
00:00:49,759 --> 00:00:55,198
thing is agentic workflows compound

23
00:00:52,079 --> 00:00:57,120
failure. for a 10step agentic workflow

24
00:00:55,198 --> 00:01:00,000
like let's say a compliance audit. If

25
00:00:57,119 --> 00:01:02,000
you have a 90% success rate per step,

26
00:01:00,000 --> 00:01:04,558
then running that workflow 10 times a

27
00:01:02,000 --> 00:01:06,719
day will result in over six failures

28
00:01:04,558 --> 00:01:09,679
every day. If you can boost your success

29
00:01:06,719 --> 00:01:12,959
rate to 99% per step, then you're down

30
00:01:09,680 --> 00:01:14,640
to one failure every day. Achieve 99.9%

31
00:01:12,959 --> 00:01:16,879
every step and you're down to one

32
00:01:14,640 --> 00:01:18,960
failure every 10 days and so on. And

33
00:01:16,879 --> 00:01:20,399
while this example may be a bit extreme

34
00:01:18,959 --> 00:01:23,039
because you might have human in the

35
00:01:20,400 --> 00:01:25,520
loop, you might have non-agentic steps

36
00:01:23,040 --> 00:01:27,920
in a flow, the key thing here is for

37
00:01:25,519 --> 00:01:29,759
businesses to fully adopt these AI

38
00:01:27,920 --> 00:01:32,240
systems, they need to be highly

39
00:01:29,759 --> 00:01:34,239
dependable and reliable like traditional

40
00:01:32,239 --> 00:01:36,399
software. One possible solution to this

41
00:01:34,239 --> 00:01:38,719
is the concept of agent skills. These

42
00:01:36,400 --> 00:01:41,200
are portable self-contained units of

43
00:01:38,719 --> 00:01:43,438
domain knowledge and procedural logic

44
00:01:41,200 --> 00:01:45,520
along with optional supporting files

45
00:01:43,438 --> 00:01:47,279
that can help in achieving the task.

46
00:01:45,519 --> 00:01:48,719
I've done a full deep dive into skills

47
00:01:47,280 --> 00:01:50,719
on this channel which I'll leave a link

48
00:01:48,719 --> 00:01:52,879
for above. But essentially for a complex

49
00:01:50,719 --> 00:01:54,560
workflow like customer on boarding, you

50
00:01:52,879 --> 00:01:56,719
can document the specific operating

51
00:01:54,560 --> 00:01:59,439
procedure in the skill markdown file.

52
00:01:56,719 --> 00:02:01,519
Step 1 2 3 and four as you can see here.

53
00:01:59,438 --> 00:02:03,118
And the AI's task is to follow the steps

54
00:02:01,519 --> 00:02:04,879
to achieve the outcome. And that's

55
00:02:03,118 --> 00:02:06,399
exactly what Anthropic did last month

56
00:02:04,879 --> 00:02:08,799
when they released their concept of

57
00:02:06,399 --> 00:02:10,800
plugins which are essentially bundles of

58
00:02:08,800 --> 00:02:13,439
skills that are domain specific. You

59
00:02:10,800 --> 00:02:14,560
know, legal, finance, HR. And even

60
00:02:13,439 --> 00:02:16,719
though these are essentially just

61
00:02:14,560 --> 00:02:18,318
markdown files, this sent a shock wave

62
00:02:16,719 --> 00:02:20,080
through the stock market, triggering a

63
00:02:18,318 --> 00:02:21,759
mass selloff in the stocks of SAS

64
00:02:20,080 --> 00:02:23,680
companies. And while this concept of

65
00:02:21,759 --> 00:02:26,000
plugins and skills is a very powerful

66
00:02:23,680 --> 00:02:27,680
idea, they are by no means perfect.

67
00:02:26,000 --> 00:02:29,759
Agent skills are essentially just

68
00:02:27,680 --> 00:02:31,520
prompts. You're baking your process into

69
00:02:29,759 --> 00:02:33,359
a message to the AI and you're hoping

70
00:02:31,520 --> 00:02:35,120
that it adheres to the instructions,

71
00:02:33,360 --> 00:02:38,080
hoping it doesn't hallucinate, quit

72
00:02:35,120 --> 00:02:40,879
early, skip steps, etc. Skillsbench

73
00:02:38,080 --> 00:02:43,280
carried out an evaluation of 84 popular

74
00:02:40,878 --> 00:02:45,439
skills in the market across all models.

75
00:02:43,280 --> 00:02:47,439
And while the addition of skills did

76
00:02:45,439 --> 00:02:50,000
definitely improve the pass rates of

77
00:02:47,439 --> 00:02:51,598
these tests, the overall success rates

78
00:02:50,000 --> 00:02:53,840
are well shy of what a business would

79
00:02:51,598 --> 00:02:55,679
need to reliably use that at scale

80
00:02:53,840 --> 00:02:56,959
without human intervention. There are

81
00:02:55,680 --> 00:02:59,680
ways that you can improve the

82
00:02:56,959 --> 00:03:01,360
performance of skills through evalment,

83
00:02:59,680 --> 00:03:03,360
but you will never reach incredibly high

84
00:03:01,360 --> 00:03:05,519
levels of reliability through prompting

85
00:03:03,360 --> 00:03:07,599
alone. The solution is to harness the

86
00:03:05,519 --> 00:03:10,239
power of these AI systems by putting

87
00:03:07,598 --> 00:03:11,919
them on deterministic rails. And this is

88
00:03:10,239 --> 00:03:14,080
exactly what Stripe did with their

89
00:03:11,919 --> 00:03:16,559
concept of minions where they built a

90
00:03:14,080 --> 00:03:18,640
scaffold around clawed code to ensure

91
00:03:16,560 --> 00:03:21,120
all generated code changes like bug

92
00:03:18,639 --> 00:03:23,439
fixes or new features were automatically

93
00:03:21,120 --> 00:03:25,519
validated against a subset of their 3

94
00:03:23,439 --> 00:03:27,280
million tests in their test suite. They

95
00:03:25,519 --> 00:03:29,680
didn't just prompt the AI to carry out

96
00:03:27,280 --> 00:03:31,680
tests. They guaranteed it by baking it

97
00:03:29,680 --> 00:03:34,159
into the process. And with this harness

98
00:03:31,680 --> 00:03:37,040
in place, they're able to merge 1,300

99
00:03:34,158 --> 00:03:39,439
pull requests every week. So for complex

100
00:03:37,039 --> 00:03:41,359
multi-stage longunning workflows, the

101
00:03:39,439 --> 00:03:43,759
best approach is to create a specialized

102
00:03:41,360 --> 00:03:45,840
harness where you can gate and validate

103
00:03:43,759 --> 00:03:47,840
the output of each stage to ensure it

104
00:03:45,840 --> 00:03:49,759
stays on track. And this is just one

105
00:03:47,840 --> 00:03:51,439
aspect of harness engineering which is

106
00:03:49,759 --> 00:03:53,039
an evolving discipline. Because

107
00:03:51,439 --> 00:03:55,199
harnesses are essentially just the

108
00:03:53,039 --> 00:03:56,639
software layer that wraps around an AI

109
00:03:55,199 --> 00:03:58,639
model, there are lots of different

110
00:03:56,639 --> 00:04:00,399
harness designs and architectures that

111
00:03:58,639 --> 00:04:02,798
you can create. General purpose

112
00:04:00,400 --> 00:04:05,200
harnesses like clawed code and manis are

113
00:04:02,799 --> 00:04:07,200
incredibly powerful. Whereas for these

114
00:04:05,199 --> 00:04:09,280
multi-stage complex workflows,

115
00:04:07,199 --> 00:04:11,119
specialized harnesses are the way to go.

116
00:04:09,280 --> 00:04:13,519
But there's lots of others. Autonomous

117
00:04:11,120 --> 00:04:15,438
harnesses like openclaw, hierarchical

118
00:04:13,519 --> 00:04:17,759
and multi-agent harnesses where you have

119
00:04:15,438 --> 00:04:19,439
swarms of agents that are coordinated or

120
00:04:17,759 --> 00:04:21,359
DAG harnesses where your workflow is

121
00:04:19,439 --> 00:04:22,959
plotted on a graph and you can have the

122
00:04:21,358 --> 00:04:25,279
likes of branching, conditional

123
00:04:22,959 --> 00:04:26,879
splitting, parallel execution. To

124
00:04:25,279 --> 00:04:29,039
demonstrate the concepts of harness

125
00:04:26,879 --> 00:04:31,279
engineering, I built a specialized

126
00:04:29,040 --> 00:04:33,199
harness into our Python and React app

127
00:04:31,279 --> 00:04:35,279
that I'm building out on this channel as

128
00:04:33,199 --> 00:04:37,040
part of our AI builder series. I took

129
00:04:35,279 --> 00:04:39,039
inspiration from Anthropic's legal

130
00:04:37,040 --> 00:04:41,040
plug-in and their contract review skill.

131
00:04:39,040 --> 00:04:43,280
I took the steps in their skills file

132
00:04:41,040 --> 00:04:45,439
and codified the process into a more

133
00:04:43,279 --> 00:04:47,279
comprehensive and reliable system. And

134
00:04:45,439 --> 00:04:49,360
this is it in action. I've dropped in

135
00:04:47,279 --> 00:04:51,758
the logo of a law firm here because this

136
00:04:49,360 --> 00:04:54,000
type of complex workflow, a contract

137
00:04:51,759 --> 00:04:55,840
review workflow, is only worth building

138
00:04:54,000 --> 00:04:58,079
into a specialized harness if you need

139
00:04:55,839 --> 00:04:59,439
to operate it at scale. So depending on

140
00:04:58,079 --> 00:05:01,279
the size of the law firm, they may have

141
00:04:59,439 --> 00:05:03,839
a few of these every week. So firstly,

142
00:05:01,279 --> 00:05:06,239
we want to specifically select contract

143
00:05:03,839 --> 00:05:08,159
review as a mode, which is different to

144
00:05:06,240 --> 00:05:10,160
skills where it's up to the AI to decide

145
00:05:08,160 --> 00:05:12,000
to pull it in or not. So we definitely

146
00:05:10,160 --> 00:05:14,080
want to trigger the harness here. So

147
00:05:12,000 --> 00:05:16,319
contract review, we then upload our

148
00:05:14,079 --> 00:05:18,000
file. Let's go with our sample SAS

149
00:05:16,319 --> 00:05:20,159
agreement and we'll just say please

150
00:05:18,000 --> 00:05:22,319
review and you can see our file has been

151
00:05:20,160 --> 00:05:24,160
uploaded to the workspace. We click go

152
00:05:22,319 --> 00:05:25,519
and there's lots of concepts now of

153
00:05:24,160 --> 00:05:28,160
harness engineering that you're going to

154
00:05:25,519 --> 00:05:30,560
see in action. So the idea of a virtual

155
00:05:28,160 --> 00:05:33,039
file system is the first thing and now

156
00:05:30,560 --> 00:05:34,879
you can see a plan that's appeared and

157
00:05:33,038 --> 00:05:37,439
these are to-dos that are being checked

158
00:05:34,879 --> 00:05:39,918
off and this is the harness in action.

159
00:05:37,439 --> 00:05:42,399
So this is all codified in Python

160
00:05:39,918 --> 00:05:44,399
created by clawed code. This process

161
00:05:42,399 --> 00:05:46,399
that has now been executed is

162
00:05:44,399 --> 00:05:48,638
essentially the standard operating

163
00:05:46,399 --> 00:05:50,319
procedure let's say of the law firm.

164
00:05:48,639 --> 00:05:52,240
It's extracted the text from the

165
00:05:50,319 --> 00:05:54,079
document as part of phase one. There's

166
00:05:52,240 --> 00:05:56,000
verification that it has got what it

167
00:05:54,079 --> 00:05:58,240
needs and then it moves to phase two

168
00:05:56,000 --> 00:06:00,879
which classifies the contract. This is

169
00:05:58,240 --> 00:06:02,560
an LLM call again with a structured

170
00:06:00,879 --> 00:06:04,478
validated schema that needs to be

171
00:06:02,560 --> 00:06:06,160
populated. And then we're into phase

172
00:06:04,478 --> 00:06:08,000
three which is asking the user

173
00:06:06,160 --> 00:06:10,160
clarifying questions before it carries

174
00:06:08,000 --> 00:06:12,319
out the analysis. So this is an example

175
00:06:10,160 --> 00:06:14,240
of human in the loop. So which side are

176
00:06:12,319 --> 00:06:17,360
we on? Let's say we're representing the

177
00:06:14,240 --> 00:06:19,519
customer. Deadline is tomorrow and let's

178
00:06:17,360 --> 00:06:21,919
leave it at that. So then phase four, it

179
00:06:19,519 --> 00:06:24,240
loads up the playbook. So we have our

180
00:06:21,918 --> 00:06:26,719
playbook within our doc section here. So

181
00:06:24,240 --> 00:06:28,879
this is essentially rag. You have your

182
00:06:26,720 --> 00:06:31,520
standard operating procedures, your

183
00:06:28,879 --> 00:06:33,439
precedents, your policies, etc. So it

184
00:06:31,519 --> 00:06:35,680
has completed that research and then it

185
00:06:33,439 --> 00:06:37,600
moves on to clause extraction. And for

186
00:06:35,680 --> 00:06:39,439
very large contracts, you can use

187
00:06:37,600 --> 00:06:41,280
chunking here. So it's not a single

188
00:06:39,439 --> 00:06:43,038
shot. And this is the beauty of

189
00:06:41,279 --> 00:06:45,519
specialized harnesses because it's

190
00:06:43,038 --> 00:06:47,519
Python, you have total flexibility on

191
00:06:45,519 --> 00:06:50,560
how you want to actually do this. So

192
00:06:47,519 --> 00:06:52,318
it's successfully extracted 34 clauses.

193
00:06:50,560 --> 00:06:55,120
And then the really interesting part

194
00:06:52,319 --> 00:06:58,000
kicks off, which is the risk analysis.

195
00:06:55,120 --> 00:07:00,000
So as part of our process, for every

196
00:06:58,000 --> 00:07:03,120
single clause, we want to spin up a

197
00:07:00,000 --> 00:07:05,038
dedicated LLM to carry out research and

198
00:07:03,120 --> 00:07:07,360
risk analysis. So you can see different

199
00:07:05,038 --> 00:07:09,759
tool calls for every single clause. It's

200
00:07:07,360 --> 00:07:11,360
loading up both the playbook as well as

201
00:07:09,759 --> 00:07:13,199
any other research that might be

202
00:07:11,360 --> 00:07:16,240
available, let's say, within the

203
00:07:13,199 --> 00:07:18,240
knowledge base for this law firm. And

204
00:07:16,240 --> 00:07:21,038
this is the concept of sub aents within

205
00:07:18,240 --> 00:07:23,120
a harness. So all of these sub aents

206
00:07:21,038 --> 00:07:25,598
have isolated context. So it's not

207
00:07:23,120 --> 00:07:27,598
polluting the context of the main agent.

208
00:07:25,598 --> 00:07:29,439
This is acting as the orchestrator. So

209
00:07:27,598 --> 00:07:32,079
then we're into phase seven, red line

210
00:07:29,439 --> 00:07:34,478
generation. And again, sub agents

211
00:07:32,079 --> 00:07:37,038
kicking off to actually carry out the

212
00:07:34,478 --> 00:07:39,279
tasks. And this gives the scale that's

213
00:07:37,038 --> 00:07:41,759
needed for very large contracts and

214
00:07:39,279 --> 00:07:44,478
longunning tasks. So we have generated

215
00:07:41,759 --> 00:07:46,720
our 22 red lines and now it's creating

216
00:07:44,478 --> 00:07:49,038
an executive summary. So you can see the

217
00:07:46,720 --> 00:07:51,199
plan is constantly being updated. And

218
00:07:49,038 --> 00:07:54,079
then you can also see the files. This is

219
00:07:51,199 --> 00:07:57,038
the scratch pad of this agent within

220
00:07:54,079 --> 00:07:59,359
this workspace. Every phase generates a

221
00:07:57,038 --> 00:08:01,519
file. So that way you have resilience.

222
00:07:59,360 --> 00:08:03,680
So if there is an issue at any point,

223
00:08:01,519 --> 00:08:05,758
you can restart the process halfway

224
00:08:03,680 --> 00:08:07,360
through and load up the progress from a

225
00:08:05,759 --> 00:08:09,360
previous phase. And there's our

226
00:08:07,360 --> 00:08:11,520
executive summary at which point the

227
00:08:09,360 --> 00:08:13,520
harness is now complete. And this is the

228
00:08:11,519 --> 00:08:14,878
word document that it generated. So we

229
00:08:13,519 --> 00:08:16,959
can download it. And in terms of

230
00:08:14,879 --> 00:08:19,360
reliability, this document is a

231
00:08:16,959 --> 00:08:21,359
template. This is fully programmatically

232
00:08:19,360 --> 00:08:23,360
generated in the harness. If you were

233
00:08:21,360 --> 00:08:25,199
leaving this up to the LLM to generate a

234
00:08:23,360 --> 00:08:27,120
word document every time, you would get

235
00:08:25,199 --> 00:08:29,360
different formats. Sometimes it might

236
00:08:27,120 --> 00:08:31,038
fail completely. Whereas having it fully

237
00:08:29,360 --> 00:08:32,719
scripted in the harness means it will

238
00:08:31,038 --> 00:08:35,199
execute against your template every

239
00:08:32,719 --> 00:08:37,278
time. It contains the executive summary,

240
00:08:35,200 --> 00:08:39,278
the various yellow lines and red lines

241
00:08:37,278 --> 00:08:41,918
with original text and proposed text

242
00:08:39,278 --> 00:08:44,240
along with rationale. Again, all baked

243
00:08:41,918 --> 00:08:45,679
into the logic of the harness. And if we

244
00:08:44,240 --> 00:08:47,839
look at the bottom here, you can see

245
00:08:45,679 --> 00:08:49,919
that there's only 7,000 tokens used of

246
00:08:47,839 --> 00:08:52,000
this main agent. Whereas if we go into

247
00:08:49,919 --> 00:08:54,479
Langfuse and jump into that specific

248
00:08:52,000 --> 00:08:57,120
thread, you can see that overall this

249
00:08:54,480 --> 00:09:00,000
thread took 323,000

250
00:08:57,120 --> 00:09:02,240
tokens. So that is just a huge amount of

251
00:09:00,000 --> 00:09:05,039
sub agents that have been triggered to

252
00:09:02,240 --> 00:09:07,039
carry out a really detailed analysis of

253
00:09:05,039 --> 00:09:09,120
this contract. And another interesting

254
00:09:07,039 --> 00:09:11,278
aspect of a harness is that you can use

255
00:09:09,120 --> 00:09:13,200
different models for different tasks. So

256
00:09:11,278 --> 00:09:16,639
our main agent that we're conversing

257
00:09:13,200 --> 00:09:18,879
with in this thread is Gemini 2.5 Pro.

258
00:09:16,639 --> 00:09:20,879
I'm using open router here. Whereas if

259
00:09:18,879 --> 00:09:23,120
you jump into any of the sub agents,

260
00:09:20,879 --> 00:09:26,000
these deep agent tasks, you can see

261
00:09:23,120 --> 00:09:27,839
we're using Gemini 2.5 flash. So it's

262
00:09:26,000 --> 00:09:29,200
obviously a lot cheaper because these

263
00:09:27,839 --> 00:09:30,800
are obviously much more specialized

264
00:09:29,200 --> 00:09:32,959
tasks that they're carrying out at

265
00:09:30,799 --> 00:09:35,039
scale. So we need to keep the costs

266
00:09:32,958 --> 00:09:36,639
under control, but we're still getting

267
00:09:35,039 --> 00:09:38,799
the accuracy that we need from the

268
00:09:36,639 --> 00:09:40,480
smaller model because it's a very narrow

269
00:09:38,799 --> 00:09:41,838
task that we're asking them to complete.

270
00:09:40,480 --> 00:09:43,759
And from there, you can then converse

271
00:09:41,839 --> 00:09:45,680
with the agent about the actual report.

272
00:09:43,759 --> 00:09:47,838
It has full access to the file system.

273
00:09:45,679 --> 00:09:49,199
So it can make changes to files, carry

274
00:09:47,839 --> 00:09:50,959
out more research against the knowledge

275
00:09:49,200 --> 00:09:52,160
base, whatever you want to do. So

276
00:09:50,958 --> 00:09:54,239
everything you just saw there, the

277
00:09:52,159 --> 00:09:56,559
harness, the sub agents, skills,

278
00:09:54,240 --> 00:09:58,399
documents, this is all built out in our

279
00:09:56,559 --> 00:10:00,559
AI builder series on our YouTube

280
00:09:58,399 --> 00:10:02,399
channel. This is the sixth episode in

281
00:10:00,559 --> 00:10:04,879
the series. And if you'd like to build

282
00:10:02,399 --> 00:10:07,120
along, the PRDs for this module are

283
00:10:04,879 --> 00:10:08,799
available in our public GitHub repo.

284
00:10:07,120 --> 00:10:10,639
While our full AI builder course and

285
00:10:08,799 --> 00:10:13,039
codebase are available in our community,

286
00:10:10,639 --> 00:10:14,720
the AI automators. This is a private

287
00:10:13,039 --> 00:10:16,719
community of hundreds of serious

288
00:10:14,720 --> 00:10:19,278
builders, all creating specialized

289
00:10:16,720 --> 00:10:20,560
harnesses and advanced rag systems. We'd

290
00:10:19,278 --> 00:10:22,000
love to see you in here. So, if you'd

291
00:10:20,559 --> 00:10:23,599
like to join, check out the link in the

292
00:10:22,000 --> 00:10:25,360
description below. So, as you can see,

293
00:10:23,600 --> 00:10:27,519
there are lots of benefits to building

294
00:10:25,360 --> 00:10:29,839
agent harnesses to solve real world

295
00:10:27,519 --> 00:10:32,399
problems. It helps you keep longunning

296
00:10:29,839 --> 00:10:34,800
tasks on track. It handles tasks that

297
00:10:32,399 --> 00:10:36,879
are just too complicated for an agent to

298
00:10:34,799 --> 00:10:38,799
complete within a single context window.

299
00:10:36,879 --> 00:10:40,000
It solves the problem of context rot

300
00:10:38,799 --> 00:10:41,838
because you're able to protect the

301
00:10:40,000 --> 00:10:43,519
context window of the main agent that

302
00:10:41,839 --> 00:10:45,200
you're conversing with. So you're not

303
00:10:43,519 --> 00:10:47,600
maxing it out and getting garbled

304
00:10:45,200 --> 00:10:49,600
incoherent answers. With the harness,

305
00:10:47,600 --> 00:10:51,600
you can build in observability and

306
00:10:49,600 --> 00:10:52,959
transparency. And similar to what you

307
00:10:51,600 --> 00:10:54,800
saw with the generation of the word

308
00:10:52,958 --> 00:10:56,559
document earlier, because you can

309
00:10:54,799 --> 00:10:58,319
actually programmatically do a lot of

310
00:10:56,559 --> 00:11:00,159
things within a harness, you can improve

311
00:10:58,320 --> 00:11:02,000
its reliability. And through using

312
00:11:00,159 --> 00:11:04,319
cheaper models within sub agents, you

313
00:11:02,000 --> 00:11:06,480
can keep costs under control while still

314
00:11:04,320 --> 00:11:08,320
burning lots of tokens. If you are

315
00:11:06,480 --> 00:11:10,639
looking to build an agent harness for

316
00:11:08,320 --> 00:11:12,480
your AI system, here are 12 things you

317
00:11:10,639 --> 00:11:14,480
absolutely need to know when it comes to

318
00:11:12,480 --> 00:11:16,000
designing it. The first is harness

319
00:11:14,480 --> 00:11:17,278
architecture. I showed this slide

320
00:11:16,000 --> 00:11:19,440
earlier about the different design

321
00:11:17,278 --> 00:11:21,600
patterns that you can use. And from a

322
00:11:19,440 --> 00:11:23,680
helicopter view, it is worth researching

323
00:11:21,600 --> 00:11:25,839
and investigating these types of design

324
00:11:23,679 --> 00:11:28,000
patterns so you can get your project off

325
00:11:25,839 --> 00:11:29,760
to the right start. Within my project

326
00:11:28,000 --> 00:11:31,919
here, I have a single threaded

327
00:11:29,759 --> 00:11:34,078
supervisor essentially as part of a

328
00:11:31,919 --> 00:11:37,120
specialized harness. A key aspect of

329
00:11:34,078 --> 00:11:38,719
harnesses is the idea of planning. And

330
00:11:37,120 --> 00:11:41,519
all of the popular harnesses like

331
00:11:38,720 --> 00:11:43,920
Clawude Code, like Manis have a version

332
00:11:41,519 --> 00:11:46,480
of planning to be able to keep their

333
00:11:43,919 --> 00:11:48,799
long running agents on track. And the

334
00:11:46,480 --> 00:11:51,600
research shows this that the longer an

335
00:11:48,799 --> 00:11:53,679
AI runs, the more tool calls it uses, if

336
00:11:51,600 --> 00:11:55,680
it's not able to ground itself on the

337
00:11:53,679 --> 00:11:57,519
general outline of a plan, in a lot of

338
00:11:55,679 --> 00:11:59,519
cases, it can end up totally off track

339
00:11:57,519 --> 00:12:01,278
from the original request. And it is

340
00:11:59,519 --> 00:12:03,440
useful to think of these plans as either

341
00:12:01,278 --> 00:12:05,360
fixed or dynamic. So within this

342
00:12:03,440 --> 00:12:07,839
contract review system, we have eight

343
00:12:05,360 --> 00:12:10,399
phases and it's the exact same steps

344
00:12:07,839 --> 00:12:12,800
each time. Whereas you can also have a

345
00:12:10,399 --> 00:12:14,639
dynamic plan. So here I'm just going to

346
00:12:12,799 --> 00:12:16,559
use deep mode which is a system we've

347
00:12:14,639 --> 00:12:18,959
created. And I'm going to ask it to plan

348
00:12:16,559 --> 00:12:21,359
my birthday party. And the LLM is going

349
00:12:18,958 --> 00:12:23,278
to generate its own plan depending on

350
00:12:21,360 --> 00:12:25,680
the request. So, you can see it's

351
00:12:23,278 --> 00:12:27,679
written its own to-dos. Propose a theme,

352
00:12:25,679 --> 00:12:30,159
find a venue, plan activities, suggest

353
00:12:27,679 --> 00:12:32,799
food. And what's interesting about this

354
00:12:30,159 --> 00:12:35,759
type of dynamic plan is that as it works

355
00:12:32,799 --> 00:12:38,240
through step by step, it has the ability

356
00:12:35,759 --> 00:12:40,000
to change the ordering of the items. It

357
00:12:38,240 --> 00:12:42,560
can tick things off. It can remove

358
00:12:40,000 --> 00:12:45,120
items, add new items in. So, it is

359
00:12:42,559 --> 00:12:47,439
totally dynamic. And that's why this

360
00:12:45,120 --> 00:12:49,278
type of dynamic plan is not suitable for

361
00:12:47,440 --> 00:12:51,200
my contract review harness because I

362
00:12:49,278 --> 00:12:53,919
don't want the LLM making it up as it

363
00:12:51,200 --> 00:12:56,879
goes along. I want to actually rein it

364
00:12:53,919 --> 00:12:59,199
in. I want it on deterministic rails.

365
00:12:56,879 --> 00:13:01,600
All harnesses make use of a file system

366
00:12:59,200 --> 00:13:04,399
in one shape or another. In cloud code,

367
00:13:01,600 --> 00:13:07,040
for example, it's a CLI application that

368
00:13:04,399 --> 00:13:09,360
has full access to the directory of your

369
00:13:07,039 --> 00:13:11,919
codebase. Whereas for the likes of Manis

370
00:13:09,360 --> 00:13:13,839
or my own system here, I have built a

371
00:13:11,919 --> 00:13:15,759
virtual file system. As you can see on

372
00:13:13,839 --> 00:13:17,920
the bottom right, this is essentially a

373
00:13:15,759 --> 00:13:20,559
scratch pad that the agent is able to

374
00:13:17,919 --> 00:13:23,360
write files to, read files from, make

375
00:13:20,559 --> 00:13:25,359
updates, etc. And then the scope of this

376
00:13:23,360 --> 00:13:28,240
file system, this is essentially a

377
00:13:25,360 --> 00:13:30,800
workspace that's tied to this chat

378
00:13:28,240 --> 00:13:33,278
thread. As you saw in our demo, the idea

379
00:13:30,799 --> 00:13:34,559
of delegating tasks is a key part of a

380
00:13:33,278 --> 00:13:36,320
harness. Because if you're not

381
00:13:34,559 --> 00:13:38,958
delegating tasks, it's essentially just

382
00:13:36,320 --> 00:13:41,278
a single LLM call that has tool calling

383
00:13:38,958 --> 00:13:42,879
capabilities. By delegating tasks,

384
00:13:41,278 --> 00:13:45,200
you're able to achieve context

385
00:13:42,879 --> 00:13:47,039
isolation. So each of those sub aents

386
00:13:45,200 --> 00:13:48,879
has a completely fresh context window

387
00:13:47,039 --> 00:13:51,039
and you have total control over what you

388
00:13:48,879 --> 00:13:52,958
inject into it. And as you saw earlier,

389
00:13:51,039 --> 00:13:55,039
I was able to use cheaper, faster models

390
00:13:52,958 --> 00:13:57,278
for the sub aents while keeping the more

391
00:13:55,039 --> 00:13:59,198
sophisticated, more expensive agent for

392
00:13:57,278 --> 00:14:00,958
the orchestrator or the supervisor that

393
00:13:59,198 --> 00:14:02,719
I was conversing with. And the beauty of

394
00:14:00,958 --> 00:14:05,278
delegating the sub agents is you can

395
00:14:02,720 --> 00:14:08,079
have parallel processing. So this just

396
00:14:05,278 --> 00:14:10,000
triggered five sub agents and it's just

397
00:14:08,078 --> 00:14:13,120
triggered another five sub aents in

398
00:14:10,000 --> 00:14:15,360
parallel in batches in fact. So Manis

399
00:14:13,120 --> 00:14:17,839
does this very well with their wide

400
00:14:15,360 --> 00:14:20,320
research functionality where it could

401
00:14:17,839 --> 00:14:23,600
research 500 different products for

402
00:14:20,320 --> 00:14:25,440
example or web pages in parallel and in

403
00:14:23,600 --> 00:14:27,920
the space of a few minutes generate a

404
00:14:25,440 --> 00:14:29,839
really comprehensive report. So parallel

405
00:14:27,919 --> 00:14:31,519
processing of sub aents where there

406
00:14:29,839 --> 00:14:34,399
isn't actually dependencies in between

407
00:14:31,519 --> 00:14:36,320
them is very effective. tool calling and

408
00:14:34,399 --> 00:14:38,559
then guard rails around what tools that

409
00:14:36,320 --> 00:14:40,480
can be called is a key part of a harness

410
00:14:38,559 --> 00:14:42,559
as well. You saw here with our load

411
00:14:40,480 --> 00:14:44,800
playbook we carried out a number of

412
00:14:42,559 --> 00:14:47,838
different tool calls to traverse the

413
00:14:44,799 --> 00:14:49,919
knowledge base list GP glob and read but

414
00:14:47,839 --> 00:14:51,760
you could also have human in the loop

415
00:14:49,919 --> 00:14:53,919
style approval whereby if you were

416
00:14:51,759 --> 00:14:56,159
pushing let's say this contract review

417
00:14:53,919 --> 00:14:58,240
to a legal software system you could

418
00:14:56,159 --> 00:15:00,799
have it so that it requires a manual

419
00:14:58,240 --> 00:15:03,120
approval in this interface. So those

420
00:15:00,799 --> 00:15:05,120
types of access controls and guardrails

421
00:15:03,120 --> 00:15:08,000
you can build into your custom harness.

422
00:15:05,120 --> 00:15:09,600
Memory is a key aspect of harnesses,

423
00:15:08,000 --> 00:15:12,159
particularly the likes of automated

424
00:15:09,600 --> 00:15:14,320
harnesses like openclaw. And there are

425
00:15:12,159 --> 00:15:16,480
two key aspects to memory, short-term

426
00:15:14,320 --> 00:15:19,360
and long-term. Short-term memory is

427
00:15:16,480 --> 00:15:21,519
generally saved as markdown files and

428
00:15:19,360 --> 00:15:23,440
then programmatically read into system

429
00:15:21,519 --> 00:15:25,120
prompts to continue on the process.

430
00:15:23,440 --> 00:15:26,959
Long-term memory can also be saved to

431
00:15:25,120 --> 00:15:28,720
markdown files, but obviously you need

432
00:15:26,958 --> 00:15:30,638
it to persist outside of a single

433
00:15:28,720 --> 00:15:32,399
workspace. But it doesn't need to be a

434
00:15:30,639 --> 00:15:34,240
markdown file either. You could use a

435
00:15:32,399 --> 00:15:36,480
knowledge graph for example, the likes

436
00:15:34,240 --> 00:15:38,560
of a temporal graph like graffiti. And

437
00:15:36,480 --> 00:15:40,959
if you look at openclaw, for example,

438
00:15:38,559 --> 00:15:42,719
every time it's event triggered, it's

439
00:15:40,958 --> 00:15:44,559
able to read from its memory to figure

440
00:15:42,720 --> 00:15:46,399
out what to do next. Specialized

441
00:15:44,559 --> 00:15:48,719
harnesses are essentially state

442
00:15:46,399 --> 00:15:50,958
machines. Here we have a sequential

443
00:15:48,720 --> 00:15:53,120
eightphase process. And as you can see

444
00:15:50,958 --> 00:15:54,719
with the plan on the top right, it is

445
00:15:53,120 --> 00:15:56,399
keeping track of its state as it

446
00:15:54,720 --> 00:15:58,720
progresses through. You can obviously

447
00:15:56,399 --> 00:16:01,039
get a lot more sophisticated with this

448
00:15:58,720 --> 00:16:02,800
type of statebased workflow. And the key

449
00:16:01,039 --> 00:16:04,958
aspect then becomes how do you actually

450
00:16:02,799 --> 00:16:07,039
track state within our system here which

451
00:16:04,958 --> 00:16:09,518
is built on superbase. We have a harness

452
00:16:07,039 --> 00:16:12,000
runs table which keeps track of the

453
00:16:09,519 --> 00:16:14,078
status of each harness run the current

454
00:16:12,000 --> 00:16:16,078
phase that it is in. So this is

455
00:16:14,078 --> 00:16:18,319
essentially state management where the

456
00:16:16,078 --> 00:16:20,719
actual state machine is codified in the

457
00:16:18,320 --> 00:16:22,639
contract review Python file within the

458
00:16:20,720 --> 00:16:24,480
harness engine itself. So even if you're

459
00:16:22,639 --> 00:16:26,240
not a developer, cloud code will be able

460
00:16:24,480 --> 00:16:28,320
to build out quite sophisticated

461
00:16:26,240 --> 00:16:30,000
harnesses like this. You'll find code

462
00:16:28,320 --> 00:16:32,320
execution is pretty central to most

463
00:16:30,000 --> 00:16:34,240
harnesses as well. Modernday agents

464
00:16:32,320 --> 00:16:36,800
typically interact with file systems via

465
00:16:34,240 --> 00:16:38,320
CLI using sandboxes. And this is

466
00:16:36,799 --> 00:16:40,958
something I went into in a lot of detail

467
00:16:38,320 --> 00:16:43,920
in our last video around programmatic

468
00:16:40,958 --> 00:16:46,319
tool calling within a sandbox. LMS are

469
00:16:43,919 --> 00:16:48,319
brilliant at generating code. So by

470
00:16:46,320 --> 00:16:50,480
passing it to a secure sandbox like

471
00:16:48,320 --> 00:16:52,480
this, it's able to read and write files

472
00:16:50,480 --> 00:16:54,320
into the workspace and then you can

473
00:16:52,480 --> 00:16:56,159
actually action things. For this we're

474
00:16:54,320 --> 00:16:58,560
using LLM sandbox which is a great

475
00:16:56,159 --> 00:17:01,120
GitHub repo and it spins up these

476
00:16:58,559 --> 00:17:03,278
isolated sandboxes as and when they're

477
00:17:01,120 --> 00:17:05,679
needed. Context management is obviously

478
00:17:03,278 --> 00:17:07,919
central to harness engineering from lots

479
00:17:05,679 --> 00:17:10,319
of different perspectives. Number one,

480
00:17:07,919 --> 00:17:12,079
you obviously want to avoid context rot.

481
00:17:10,318 --> 00:17:13,918
So, you want to keep your main

482
00:17:12,078 --> 00:17:15,759
supervisor agent or the agent you're

483
00:17:13,919 --> 00:17:18,160
conversing with, you want to keep their

484
00:17:15,759 --> 00:17:19,919
context as lean as possible. That being

485
00:17:18,160 --> 00:17:21,600
said, though, that will eventually max

486
00:17:19,919 --> 00:17:23,839
out if you keep conversing with that

487
00:17:21,599 --> 00:17:26,000
agent. So, you need a mechanism for

488
00:17:23,838 --> 00:17:28,159
compacting context and summarizing

489
00:17:26,000 --> 00:17:30,240
context, very similar to what you see in

490
00:17:28,160 --> 00:17:32,080
Claude and Claude code. And it's not

491
00:17:30,240 --> 00:17:33,919
just context management, you need old

492
00:17:32,079 --> 00:17:36,399
school prompt engineering as well,

493
00:17:33,919 --> 00:17:38,160
particularly if you have dedicated sub

494
00:17:36,400 --> 00:17:39,519
agents that you are delegating to.

495
00:17:38,160 --> 00:17:41,600
There's a lot of good tricks that you

496
00:17:39,519 --> 00:17:43,599
can use with context management. If you

497
00:17:41,599 --> 00:17:45,918
have tool calls that output thousands of

498
00:17:43,599 --> 00:17:48,079
tokens, for example, instead of reading

499
00:17:45,919 --> 00:17:50,320
it directly into the context, you can

500
00:17:48,079 --> 00:17:52,558
save it to a file and then only provide

501
00:17:50,319 --> 00:17:54,798
a summary of that file to the agent and

502
00:17:52,558 --> 00:17:58,079
then the agent has file navigation tools

503
00:17:54,798 --> 00:17:59,519
to list GP glob and read that file. So

504
00:17:58,079 --> 00:18:01,199
this is very useful particularly for the

505
00:17:59,519 --> 00:18:02,960
likes of a web search tool. You saw

506
00:18:01,200 --> 00:18:04,960
human in the loop in action earlier

507
00:18:02,960 --> 00:18:07,120
where even in a sequential eight-phase

508
00:18:04,960 --> 00:18:08,798
flow like I have here, there can be

509
00:18:07,119 --> 00:18:10,479
touch points with the user to guide it

510
00:18:08,798 --> 00:18:12,319
in a certain direction. And as I

511
00:18:10,480 --> 00:18:14,240
mentioned, for the likes of tool calls,

512
00:18:12,319 --> 00:18:16,480
you can require human approval if

513
00:18:14,240 --> 00:18:18,240
needed. Validation loops are a critical

514
00:18:16,480 --> 00:18:20,798
part of a harness and it's one area

515
00:18:18,240 --> 00:18:22,798
that's lacking in my system. Clawed code

516
00:18:20,798 --> 00:18:24,720
does this brilliantly because it can

517
00:18:22,798 --> 00:18:26,639
generate a piece of code, it can then

518
00:18:24,720 --> 00:18:28,640
test it programmatically itself, and if

519
00:18:26,640 --> 00:18:30,880
it fails, it can go back and iterate on

520
00:18:28,640 --> 00:18:33,038
the code. So if it loops through that a

521
00:18:30,880 --> 00:18:34,880
few times, you will end up with code

522
00:18:33,038 --> 00:18:36,558
that actually works. Now while that

523
00:18:34,880 --> 00:18:38,880
works very well for codebased

524
00:18:36,558 --> 00:18:40,879
applications, it's a bit different for a

525
00:18:38,880 --> 00:18:43,120
contract review, but it is still

526
00:18:40,880 --> 00:18:45,120
possible. You could run validation loops

527
00:18:43,119 --> 00:18:46,719
on the likes of factchecking or have a

528
00:18:45,119 --> 00:18:48,879
loop that runs through every clause and

529
00:18:46,720 --> 00:18:51,038
compares it against the playbook. So if

530
00:18:48,880 --> 00:18:53,200
the proposed changes don't line up, you

531
00:18:51,038 --> 00:18:54,960
actually get it to modify itself. So

532
00:18:53,200 --> 00:18:57,120
this is really where you can improve the

533
00:18:54,960 --> 00:18:59,200
quality of the output of the harness.

534
00:18:57,119 --> 00:19:01,439
And finally, agent skills are still

535
00:18:59,200 --> 00:19:03,679
incredibly useful even within the likes

536
00:19:01,440 --> 00:19:05,519
of a harness. So essentially, if you

537
00:19:03,679 --> 00:19:07,600
need something to happen every single

538
00:19:05,519 --> 00:19:08,879
time, you should codify it. Whereas, if

539
00:19:07,599 --> 00:19:10,879
you're looking to expand out the

540
00:19:08,880 --> 00:19:13,760
capabilities and then you're going to

541
00:19:10,880 --> 00:19:16,320
guide it as a co-pilot, it's well worth

542
00:19:13,759 --> 00:19:17,839
using agent skills. And on that topic,

543
00:19:16,319 --> 00:19:19,678
if you would like to learn more about

544
00:19:17,839 --> 00:19:22,399
agent skills and how you can build them

545
00:19:19,679 --> 00:19:24,559
into your own custom AI system, then

546
00:19:22,400 --> 00:19:25,759
check out this video here. Thanks so

547
00:19:24,558 --> 00:19:28,000
much for watching and I'll see you in

548
00:19:25,759 --> 00:19:28,000
the next
