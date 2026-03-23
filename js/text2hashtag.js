// setup
let results = [];
let duplicatesList = [];
const inputText = document.getElementById("inputText");
const runBtn = document.getElementById("runBtn");
const copyBtn = document.getElementById("copyBtn");
const outputContainer = document.getElementById("output");

// helpers
function getWords(text) {
	if (!text.trim()) return [];
	return text.trim().split(/\s+/);
}

function updateRunButton() {
	const count = getWords(inputText.value).length;
	runBtn.textContent = `Process ${count} words`;
}

function createContainer(title, text) {
	const div = document.createElement("div");
	div.className = "container";

	const h2 = document.createElement("h2");
	const wordCount = getWords(text).length;
	h2.innerHTML = `${title} <span class="count">(${wordCount})</span>`;

	const p = document.createElement("p");
	p.textContent = text;

	div.appendChild(h2);
	div.appendChild(p);

	return div;
}

// core logic
const prependString = (input, prefix = "#") => {
	const cleanedStr = String(input)
		.replace(/[\r\n]+/g, " ")
		.trim()
		.replace(/\s+/g, " ");

	const words = getWords(cleanedStr);

	const seen = new Set();
	const duplicates = new Set();
	const uniqueWords = [];

	for (const word of words) {
		const lower = word.toLowerCase();
		if (seen.has(lower)) {
			duplicates.add(word);
		} else {
			seen.add(lower);
			uniqueWords.push(word);
		}
	}

	duplicatesList = [...duplicates];

	const toHash = (arr) => arr.map((w) => `${prefix}${w}`).join(" ");

	const english = uniqueWords.filter((w) => /^[\x00-\x7F]+$/.test(w));
	const nonEnglish = uniqueWords.filter((w) => /[^\x00-\x7F]/.test(w));

	return [toHash(uniqueWords), toHash(english), toHash(nonEnglish)];
};

// UI actions
function processString() {
	results = prependString(inputText.value);
	outputContainer.innerHTML = "";

	const sections = [
		{ title: "Hashtags:", value: results[0] },
		{ title: "Hashtags (English):", value: results[1] },
		{ title: "Hashtags (Non-English):", value: results[2] },
	];

	// main hashtag containers
	sections.forEach((section) => {
		if (!section.value) return;
		outputContainer.appendChild(createContainer(section.title, section.value));
	});

	// duplicates container (always last)
	if (duplicatesList.length > 0) {
		outputContainer.appendChild(createContainer("Duplicates Removed:", duplicatesList.join(" ")));
	}
}

function copyText() {
	const filtered = results.filter(Boolean);

	if (filtered.length === 0) {
		copyBtn.textContent = "Nothing to copy!";
		setTimeout(() => (copyBtn.textContent = "Copy All"), 2000);
		return;
	}

	navigator.clipboard.writeText(filtered.join("\n\n"));

	copyBtn.textContent = "Copied!";
	setTimeout(() => (copyBtn.textContent = "Copy All"), 2000);
}

// events
runBtn.addEventListener("click", processString);
copyBtn.addEventListener("click", copyText);
inputText.addEventListener("input", updateRunButton);
inputText.addEventListener("keydown", function (event) {
    // allow Shift+Enter for new lines
    if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		processString();
	}
});

// init
updateRunButton();
