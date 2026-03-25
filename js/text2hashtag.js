const editModeBtn = document.getElementById("editModeBtn");
const deleteModeBtn = document.getElementById("deleteModeBtn");
const groupsContainer = document.getElementById("groups");
const searchInput = document.getElementById("searchInput");
const inputText = document.getElementById("inputText");
const searchClearBtn = document.getElementById("clearSearch");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const outputContainer = document.getElementById("output");

let mode = null; // "edit" | "delete" | null
let selectedSubgroup = null;
let activeEditInput = null;

let results = [];
let uniqueWordsList = [];
let duplicatesList = [];
let termsData = {
	subject: [],
	category: [],
};

// localStorage
function saveTerms() {
	localStorage.setItem("terms", JSON.stringify(termsData));
}

function loadTerms() {
	const storedTerms = localStorage.getItem("terms");
	if (storedTerms) {
		termsData = JSON.parse(storedTerms);
		searchInput.value = "";
		inputText.value = "";
	}
}

// subgroup functions
function toggleMode(newMode) {
	mode = mode === newMode ? null : newMode;
	exitInlineEdit();
	clearSelection();
	updateModeUI();
}
editModeBtn.onclick = () => toggleMode("edit");
deleteModeBtn.onclick = () => toggleMode("delete");

function updateModeUI() {
	editModeBtn.classList.toggle("active", mode === "edit");
	deleteModeBtn.classList.toggle("active", mode === "delete");
	document.body.classList.toggle("edit-mode", mode === "edit");
	document.body.classList.toggle("delete-mode", mode === "delete");
}

function clearSelection() {
	if (selectedSubgroup) {
		selectedSubgroup.classList.remove("selected");
		selectedSubgroup = null;
	}
}

document.addEventListener("click", (e) => {
	if (!e.target.closest("#sidebar")) {
		mode = null;
		exitInlineEdit();
		clearSelection();
		updateModeUI();
	}
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		mode = null;
		exitInlineEdit();
		clearSelection();
		updateModeUI();
	}
});

// helpers
function getWords(text) {
	const trimmed = text.trim();
	return text.trim() ? trimmed.split(/\s+/) : [];
}

function updateRunButton() {
	const wordCount = getWords(inputText.value).length;
	runBtn.textContent = `Process ${wordCount} words`;
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

// sidebar
function renderSidebar() {
	groupsContainer.innerHTML = "";

	Object.entries(termsData).forEach(([groupName, subgroups]) => {
		const groupDiv = document.createElement("div");
		groupDiv.className = "group";

		const groupHeader = document.createElement("div");
		groupHeader.className = "groupHeader";

		const title = document.createElement("h3");
		title.textContent = groupName.toUpperCase();

		const list = document.createElement("div");

		subgroups.forEach((text, index) => {
			const item = document.createElement("div");
			item.className = "subgroup";

			const label = document.createElement("span");
			label.textContent = text;

			item.dataset.group = groupName;
			item.dataset.index = index;
			item.onclick = (e) => {
				e.stopPropagation();

				if (!mode) {
					addToInput(text);
					return;
				}

				clearSelection();
				selectedSubgroup = item;
				item.classList.add("selected");

				if (mode === "delete") {
					const confirmDelete = confirm(`Delete "${text}"?`);
					if (confirmDelete) {
						termsData[groupName].splice(index, 1);
						saveTerms();
						renderSidebar();
					}
					return;
				}

				if (mode === "edit") {
					enableInlineEdit(item, groupName, index, text);
				}
			};

			item.append(label);
			list.appendChild(item);
		});

		// add controls
		const addBtn = document.createElement("button");
		addBtn.textContent = "+";
		addBtn.onclick = () => {
			const val = prompt("New subgroup:");
			if (val) {
				termsData[groupName].push(val.trim());
				saveTerms();
				renderSidebar();
			}
		};

		// const sortBtn = document.createElement("button");
		// sortBtn.textContent = "Sort";
		// sortBtn.onclick = () => {
		// 	termsData[groupName].sort((a, b) => a.localeCompare(b));
		// 	saveTerms();
		// 	renderSidebar();
		// };

		groupHeader.appendChild(title);
		groupHeader.appendChild(addBtn);
		// groupHeader.appendChild(sortBtn);

		groupDiv.appendChild(groupHeader);
		groupDiv.appendChild(list);

		groupsContainer.appendChild(groupDiv);
	});
}

function enableInlineEdit(item, groupName, index, oldText) {
	if (activeEditInput) return; // prevent multiple edits

	const label = item.querySelector("span");
	label.style.display = "none";

	const input = document.createElement("input");
	input.value = oldText;
	input.className = "edit-input";

	item.appendChild(input);
	input.focus();

	activeEditInput = input;

	function cleanup() {
		activeEditInput = null;
	}

	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			const val = input.value.trim();
			if (val) {
				termsData[groupName][index] = val;
				saveTerms();
				renderSidebar();
			}
			cleanup();
			renderSidebar();
		}

		if (e.key === "Escape") {
			cleanup();
			renderSidebar();
		}
	});
}

function exitInlineEdit() {
	if (activeEditInput) {
		renderSidebar(); // reset UI
		activeEditInput = null;
	}
}

function addToInput(text) {
	const current = inputText.value.trim();
	inputText.value = current ? `${current} ${text}` : text;

	// check for matches and highlight subgroups if they appear in the input text
	document.querySelectorAll(".subgroup").forEach((el) => {
		const subgroupText = el.textContent.toLowerCase();
		const wordsInInput = getWords(inputText.value).map((word) => word.toLowerCase());

		let partialMatch = false;
		let fullMatch = true;

		for (const word of subgroupText.split(/\s+/)) {
			if (wordsInInput.includes(word)) {
				partialMatch = true;
			} else {
				fullMatch = false;
			}
		}

		el.classList.toggle("partial-highlight", partialMatch && !fullMatch);
		el.classList.toggle("full-highlight", fullMatch);
	});

	formatInput();
	updateRunButton();
}

// search
searchInput.addEventListener("input", () => {
	const term = searchInput.value.toLowerCase();

	document.querySelectorAll(".subgroup").forEach((el) => {
		const match = el.textContent.toLowerCase().includes(term);
		// el.style.display = match || !term ? "flex" : "none"; // only show matches
		el.style.opacity = match || !term ? "1" : "0.3"; // show all, dim non-matches
	});
});

searchClearBtn.addEventListener("click", () => {
	searchInput.value = "";
	searchInput.dispatchEvent(new Event("input"));
});

// import/export
document.getElementById("exportBtn").onclick = () => {
	const blob = new Blob(
		[JSON.stringify(termsData, null, 2)], // no transformation > number of spaces for indentation
		{ type: "application/json" },
	);
	const link = document.createElement("a");

	link.href = URL.createObjectURL(blob);
	link.download = `terms-${Date.now().toString()}.json`;
	link.click();

	exportBtn.textContent = "Exported!";
	setTimeout(() => (exportBtn.textContent = "Export Terms"), 2000);
	return;
};

document.getElementById("importBtn").onclick = () => {
	document.getElementById("importFile").click();
};

document.getElementById("importFile").addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = () => {
		try {
			termsData = JSON.parse(reader.result);
			saveTerms();
			renderSidebar();

			importBtn.textContent = "Imported!";
			setTimeout(() => (importBtn.textContent = "Import Terms"), 2000);
			return;
		} catch {
			console.log("Invalid file!");
		}
	};
	reader.readAsText(file);
});

// core logic for input
function formatInput() {
	let val = inputText.value;

	val = val.replace(/\s+/g, " "); // collapse spaces
	val = val.replace(/^\s+/g, ""); // trim leading spaces

	inputText.value = val;
}

inputText.addEventListener("input", () => {
	formatInput();
	updateRunButton();
});
inputText.addEventListener("input", updateRunButton);

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

	uniqueWordsList = [...uniqueWords];
	duplicatesList = Array.from(duplicates);
	const toHash = (arr) => arr.map((w) => `${prefix}${w}`).join(" ");
	const english = uniqueWords.filter((w) => /^[\x00-\x7F]+$/.test(w));
	const nonEnglish = uniqueWords.filter((w) => /[^\x00-\x7F]/.test(w));

	return [toHash(uniqueWords), toHash(english), toHash(nonEnglish)];
};

function processString() {
	outputContainer.innerHTML = "";
	results.length = 0;
	duplicatesList.length = 0;

	const [all, english, nonEnglish] = prependString(inputText.value);
	const sections = [
		{ title: "Hashtags:", value: all },
		{ title: "Hashtags (English):", value: english },
		{ title: "Hashtags (Non-English):", value: nonEnglish },
	];

	sections.forEach((section) => {
		if (!section.value) return;
		results.push(section.value);
		outputContainer.appendChild(createContainer(section.title, section.value));
	});

	// duplicates container (always last)
	if (duplicatesList.length > 0) {
		const dupes = duplicatesList.join(" ");
		results.push(dupes);
		outputContainer.appendChild(createContainer("Duplicates Removed:", duplicatesList.join(" ")));
	}
}

// main buttons
runBtn.addEventListener("click", processString);

copyBtn.addEventListener("click", () => {
	if (results.length === 0) {
		copyBtn.textContent = "Nothing to copy!";
		setTimeout(() => (copyBtn.textContent = "Copy All"), 2000);
		return;
	}

	const uniqueInput = uniqueWordsList.join(" ");
	const finalText = [uniqueInput ? uniqueInput : "", ...results].filter(Boolean).join("\n\n");
	navigator.clipboard.writeText(finalText);

	copyBtn.textContent = "Copied!";
	setTimeout(() => (copyBtn.textContent = "Copy All"), 2000);
});

clearBtn.addEventListener("click", () => {
	inputText.value = "";
	outputContainer.innerHTML = "";

	document.querySelectorAll(".subgroup").forEach((el) => {
		el.classList.remove("partial-highlight", "full-highlight"); // clear highlights
	});

	updateRunButton();
});

// init
updateRunButton();
loadTerms();
renderSidebar();
