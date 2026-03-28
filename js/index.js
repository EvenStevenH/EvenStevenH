document.querySelectorAll(".accordion").forEach((acc) => {
	acc.addEventListener("click", function () {
		this.classList.toggle("active");
		let panel = this.nextElementSibling;
		if (panel.style.maxHeight) {
			panel.style.maxHeight = null;
			panel.style.marginTop = null;
			panel.style.marginBottom = null;
		} else {
			panel.style.maxHeight = panel.scrollHeight + "px";
			panel.style.marginTop = "1rem";
			panel.style.marginBottom = "1rem";
		}
	});
});
