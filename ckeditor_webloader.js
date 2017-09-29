(function(){
	if (window.GGB_LOADED === true) return;
	window.GGB_LOADED = true;
	var script = document.createElement("script");
	script.src = "https://cdn.ckeditor.com/4.7.3/standard/ckeditor.js";
	document.head.appendChild(script);
})();