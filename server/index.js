const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5000;

const cors = require("cors");
app.use(cors({ origin: "http://localhost:3000" }));

app.use(express.json());

// Path to fake "database"
const tradesPath = path.join(__dirname, "data", "trades.json");

// 📥 Add new trade
app.post("/api/trades", (req, res) => {
	const { asset, type, amount, price, date, fee } = req.body;

	// 🔒 Basic validation
	if (
		typeof asset !== "string" ||
		!["buy", "sell"].includes(type) ||
		typeof amount !== "number" ||
		typeof price !== "number" ||
		typeof fee !== "number" ||
		!date
	) {
		return res.status(400).json({ error: "Invalid trade data" });
	}

	const newTrade = {
		id: Date.now().toString(), // unique id based on timestamp
		asset,
		type,
		amount,
		price,
		fee,
		date,
	};

	// Read existing trades
	let trades = [];
	try {
		const file = fs.readFileSync(tradesPath, "utf-8");
		trades = JSON.parse(file);
	} catch (e) {
		console.error("Error reading trades:", e);
	}

	trades.push(newTrade);

	// Save back to file
	try {
		fs.writeFileSync(tradesPath, JSON.stringify(trades, null, 2));
		res.status(201).json({ message: "Trade saved" });
	} catch (e) {
		console.error("Error writing trades:", e);
		res.status(500).json({ error: "Could not save trade" });
	}
});

// 📤 Get all trades
app.get("/api/trades", (req, res) => {
	try {
		const file = fs.readFileSync(tradesPath, "utf-8");
		const trades = JSON.parse(file);
		res.json(trades);
	} catch (e) {
		console.error("Error reading trades:", e);
		res.status(500).json({ error: "Could not load trades" });
	}
});

// 🗑 Delete a trade by ID
app.delete("/api/trades/:id", (req, res) => {
	const tradeId = req.params.id;

	try {
		const file = fs.readFileSync(tradesPath, "utf-8");
		let trades = JSON.parse(file);

		const filtered = trades.filter((t) => t.id !== tradeId);

		if (filtered.length === trades.length) {
			return res.status(404).json({ error: "Trade not found" });
		}

		fs.writeFileSync(tradesPath, JSON.stringify(filtered, null, 2));
		res.json({ message: "Trade deleted" });
	} catch (e) {
		console.error("Error deleting trade:", e);
		res.status(500).json({ error: "Could not delete trade" });
	}
});

app.put("/api/trades/:id", (req, res) => {
	const tradeId = req.params.id;
	const updatedTrade = req.body;

	try {
		const file = fs.readFileSync(tradesPath, "utf-8");
		let trades = JSON.parse(file);

		const index = trades.findIndex((t) => t.id === tradeId);
		if (index === -1) {
			return res.status(404).json({ error: "Trade not found" });
		}

		// Keep the same ID
		trades[index] = { ...updatedTrade, id: tradeId };

		fs.writeFileSync(tradesPath, JSON.stringify(trades, null, 2));
		res.json({ message: "Trade updated" });
	} catch (e) {
		console.error("Error updating trade:", e);
		res.status(500).json({ error: "Could not update trade" });
	}
});

// 🟢 Start server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
