var build = function(tag_name, class_name, parent, inner_html) {
	var el = document.createElement(tag_name);
	if (class_name !== undefined) el.className = class_name;
	if (parent !== undefined) parent.appendChild(el);
	if (inner_html !== undefined) el.innerHTML = inner_html;
	return el;
};

var random_string = function(n) {
	n = n || 10;
	var palette = "abcdefghijklmnopqrstuvwxyzABCDEFGhIJKLMNOPQRSTuVWXYZ0123456789";
	var s = "";
	for (var i = 0; i < n; i++) {
		var sel = Math.floor(Math.random() * palette.length);
		s += palette[sel];
	}
	return s;
};

var h5p_get_data_obj = function(s) {
	if (s === undefined) return undefined;
	s = s.replace(new RegExp(/&quot;/, 'g'), "\"");
	s = s.replace(new RegExp(/&lt;/, 'g'), "<");
	s = s.replace(new RegExp(/&gt;/, 'g'), ">");
	return JSON.parse(s);
};

var h5p_get_data_str = function(o) {
	if (o === undefined) return undefined;
	return JSON.stringify(o);
};