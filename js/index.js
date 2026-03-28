document.querySelectorAll(".accordion").forEach((acc) => {
	acc.addEventListener("click", function () {
		this.classList.toggle("active");
		let panel = this.nextElementSibling;
		if (panel.style.maxHeight) {
			panel.style.maxHeight = null;
			panel.style.marginTop = null;
		} else {
			panel.style.maxHeight = panel.scrollHeight + "px";
			panel.style.marginTop = ".6rem";
		}
	});
});
