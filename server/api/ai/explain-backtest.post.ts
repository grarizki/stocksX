import Anthropic from "@anthropic-ai/sdk";

interface Trade {
	entryPrice: number;
	exitPrice: number;
	pnlPct: number;
}

interface BacktestPayload {
	ticker: string;
	strategy: string;
	params: Record<string, number>;
	range: string;
	result: {
		totalReturn: number;
		winRate: number;
		maxDrawdown: number;
		totalTrades: number;
		avgPnl: number;
		sharpe: number;
		trades: Trade[];
	};
}

export default defineEventHandler(async (event) => {
	const body = await readBody<BacktestPayload>(event);

	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw createError({
			statusCode: 500,
			message: "ANTHROPIC_API_KEY not configured",
		});
	}

	const client = new Anthropic({ apiKey });

	const { ticker, strategy, params, range, result } = body;

	const paramsStr = Object.entries(params)
		.map(([k, v]) => `${k}=${v}`)
		.join(", ");

	const worstTrades = [...result.trades]
		.sort((a, b) => a.pnlPct - b.pnlPct)
		.slice(0, 3)
		.map((t) => `${t.pnlPct.toFixed(2)}%`)
		.join(", ");

	const bestTrades = [...result.trades]
		.sort((a, b) => b.pnlPct - a.pnlPct)
		.slice(0, 3)
		.map((t) => `+${t.pnlPct.toFixed(2)}%`)
		.join(", ");

	const prompt = `You are a stock market analyst. Explain the following backtest results in plain, conversational language (2–4 short paragraphs). Be specific about the numbers. Use Indonesian if the ticker ends with .JK, otherwise English.

Stock: ${ticker}
Strategy: ${strategy} (${paramsStr})
Period: ${result.trades.length > 0 ? range : "N/A"}
Total Trades: ${result.totalTrades}
Total Return: ${result.totalReturn.toFixed(2)}%
Win Rate: ${result.winRate.toFixed(1)}%
Max Drawdown: ${result.maxDrawdown.toFixed(2)}%
Avg P&L per trade: ${result.avgPnl.toFixed(2)}%
Sharpe Ratio: ${result.sharpe.toFixed(2)}
Best trades: ${bestTrades || "N/A"}
Worst trades: ${worstTrades || "N/A"}

Explain: what the numbers mean in simple terms, whether this strategy worked well or not, what the main risk was, and one practical takeaway. Keep it concise.`;

	const message = await client.messages.create({
		model: "claude-sonnet-4-5",
		max_tokens: 512,
		messages: [{ role: "user", content: prompt }],
	});

	const text =
		message.content[0].type === "text" ? message.content[0].text : "";
	return { explanation: text };
});
