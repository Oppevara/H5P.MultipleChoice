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
	if (s.length > 0 && (s[0] == "[" || s[0] == "{")) {
		return h5p_get_data_obj_v0(s);
	}

	if (s.length >= 3 && s.substring(0, 3) == "v1_") {
		return h5p_get_data_obj_v1(s);
	}

	console.log("Corrputed or unknown data format");
	return undefined;
};


var h5p_get_data_str = function(o) {
	return h5p_get_data_str_v1(o);
}

var h5p_get_data_obj_v1 = function(s) {
	return JSON.parse(atob(s.substring(3)));
}

var h5p_get_data_str_v1 = function(o) {
	if (o === undefined) return undefined;
	return "v1_" + btoa(JSON.stringify(o));
};


//	for historic reference
var h5p_get_data_obj_v0 = function(s) {
	s = s.replace(new RegExp(/&quot;/, 'g'), "\"");
	s = s.replace(new RegExp(/&lt;/, 'g'), "<");
	s = s.replace(new RegExp(/&gt;/, 'g'), ">");
	console.log(s);
	return JSON.parse(s);
}

var h5p_get_data_str_v0 = function(o) {
	if (o === undefined) return undefined;
	return JSON.stringify(o);
}