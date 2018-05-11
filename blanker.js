//	A puny attempt at hiding answer confirmation from the student
var confirm_token = {
	"tokens" : [],
	"generate" : function() {
		var token = "" + Math.floor(Math.random() * 1000000);
		while (confirm_token.tokens.indexOf(token) != -1) {
			token = "" + Math.floor(Math.random() * 1000000);
		}
		confirm_token.tokens.push(token);
		return token;
	},
	"destroy" : function(token) {
		var idx = confirm_token.tokens.indexOf(token);
		if (idx == -1) return;
		confirm_token.tokens.splice(idx, 1);
	},
	"check_session" : function() {
		this.tokens = confirm_token.tokens.slice();
		this.check = function(token) {
			var idx = this.tokens.indexOf(token);
			if (idx != -1) {
				this.tokens.splice(idx, 1);
				return true;
			}
			return false;
		}.bind(this);
	}
}

//	sub and superscript support

function to_unicode_superscript(s) {
	var palette = { "0" : "⁰", "1":"¹", "2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
	var constr = "";
	for (var i = 0; i < s.length; i++) {
		if (s[i] in palette) constr += palette[s[i]];
		else constr += s[i];
	}
	return constr;
}

function to_unicode_subscript(s) {
	var palette = { "0" : "₀", "1":"₁", "2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉" };
	var constr = "";
	for (var i = 0; i < s.length; i++) {
		if (s[i] in palette) constr += palette[s[i]];
		else constr += s[i];
	}
	return constr;
}

//	String section object for replacing blanker syntax with blanker objects
class section {
	constructor(idx_begin, idx_end, raw) {
		this.idx_begin = idx_begin;
		this.idx_end = idx_end;
		this.raw = raw;
		this.blanker = new blanker(this.raw);
	}
	
	replace_into_string(s) {
		return s.substring(0, this.idx_begin) + this.blanker.build() + s.substring(this.idx_end + 1);
	}
}

section.get_sections_from_string = function(marker, s) {
	var sections = [];
	var idx_at = 0;

	while (true) {
		var idx_begin = s.indexOf(marker, idx_at);
		if (idx_begin === -1) break;
		var idx_end = s.indexOf(marker, idx_begin + marker.length);
		if (idx_end === -1) break;
		idx_at = idx_end + marker.length;
		
		sections.push(new section(idx_begin, idx_end, s.substring(idx_begin + 1, idx_end)));
	}
	
	return sections;	
}


//	Blanker objects create self contained input fields that signal correctness via confirm tokens
class blanker {
	//	syntax example:
	//	<option>/<option>/<option>~:<hint>
	//	correct/correct again/false~:hint
	//	raw value may but doesn't have to include enclosing markers *
	//	all options must be separated by /
	//	all incorrect answers must end with ~
	//	everything after : is considered to be a part of the hint
	
	constructor(raw) {
		//	support for el constructor
		if (typeof raw === "object") {
			raw = atob(raw.getAttribute("data-blanker64"))
		}
		
		//	basics
		this.raw = raw;
		this.ignore_whitespace = true;	// add syntax option later
		this.ignore_case = true;		// add syntax option later
		
		//	filter subscript tag
		while (true) {
			var idx_begin = raw.indexOf("<sub>");
			if (idx_begin == -1) break;
			var idx_end = raw.indexOf("</sub>", idx_begin);
			if (idx_end == -1) break;
			if (idx_end - idx_begin < 5) break;

			var inside = raw.substring(idx_begin + 5, idx_end);
			inside = to_unicode_subscript(inside);

			raw = raw.substring(0, idx_begin) + inside + raw.substring(idx_end + 6);
		}

		//	filter superscript tag
		while (true) {
			var idx_begin = raw.indexOf("<sup>");
			if (idx_begin == -1) break;
			var idx_end = raw.indexOf("</sup>", idx_begin);
			if (idx_end == -1) break;
			if (idx_end - idx_begin < 5) break;

			var inside = raw.substring(idx_begin + 5, idx_end);
			inside = to_unicode_superscript(inside);

			raw = raw.substring(0, idx_begin) + inside + raw.substring(idx_end + 6);
		}

		//	get rid of encoding
		var encode_remover = build("div", undefined, undefined, raw);
		raw = encode_remover.innerText;

		//	remove tags (for simpler life with editors)
		while (true) {
			var idx_begin = raw.indexOf("<");
			if (idx_begin == -1) break;
			var idx_end = raw.indexOf(">", idx_begin);
			if (idx_end == -1) break;
			raw = raw.substring(0, idx_begin) + raw.substring(idx_end + 1);
		}
		
		//	deal with enclosing
		if (raw.substring(0, 1) === "*") raw = raw.substring(1);
		if (raw.substring(raw.length - 1, raw.length) === "*") raw = raw.substring(0, raw.length - 1);
		
		//	separate hint
		this.hint = undefined;
		var hint_idx = raw.indexOf(":");
		if (hint_idx != -1) {
			this.hint = raw.substring(hint_idx + 1);
			raw = raw.substring(0, hint_idx);
		}
		
		//	separate options and determine type
		this.options = [];
		this.type = "fill_blank";
		var pieces = raw.split("/");
		for (var i = 0; i < pieces.length; i++) {
			if (pieces[i].indexOf("~") === pieces[i].length - 1) {
				this.options.push({
					"text" : pieces[i].substring(0, pieces[i].length - 1),
					"correct" : false
				});
				this.type = "multiple_choice";
			} else {
				this.options.push({
					"text" : pieces[i],
					"correct" : true
				});
			}
		}
	}
	
	check_answer(answer) {
		if (this.ignore_whitespace) answer = answer.replace(/\s/g,'').replace(/&nbsp;/g, '');
		if (this.ignore_case) answer = answer.toLowerCase();
		for (var i = 0; i < this.options.length; i++) {
			if (this.options[i].correct != true) continue;
			
			var option = this.options[i].text;
			if (this.ignore_whitespace) option = option.replace(/\s/g,'');
			if (this.ignore_case) option = option.toLowerCase();
			
			if (option == answer) return true;
		}
		return false;
	}
	
	build_hint() {
		if (this.hint == undefined) return "";
		return '<span class="blanker_hint" onClick="if(this.getAttribute(' + "'data-active'" + ') === null) this.setAttribute(' + "'data-active',''" + '); else this.removeAttribute(' + "'data-active'" + ');"><span>' + this.hint + '</span></span>'
	}
	
	build_wrap_blank(inner) {
		var ret = '<span ';
		ret += 'class="blank" ';
		ret += 'data-empty '
		ret += 'data-blanker64="' + btoa(this.raw) + '" ';
		ret += 'onKeyUp="blanker.check_el(this)" ';
		ret += 'onMouseUp="blanker.check_el(this)" ';
		ret += '>'
		ret += inner;
		ret += '</span>';
		return ret;
	}

	build_as_fill_blank() {
		var inner = '<span contenteditable="true" class="fill_blank" ></span>';
		return this.build_wrap_blank(inner);
	}
	
	build_as_multiple_choice() {
		var inner = '<select class="multiple_choice" onChange="blanker.check_el(this.parentElement)">';
		inner += '<option value=""></option>';
		this.options.sort(function() {return Math.random() - 0.5;});
		for (var i = 0; i < this.options.length; i++) {
			inner += '<option value="' + this.options[i].text +'">' + this.options[i].text + '</option>';
		}
		inner += '</select>';
		return this.build_wrap_blank(inner);
	}
	
	build() {
		if (this.type == "fill_blank") {
			return this.build_as_fill_blank() + this.build_hint();
		}
		if (this.type == "multiple_choice") {
			return this.build_as_multiple_choice() + this.build_hint();
		}
		return "*undefined blanker*";
	}
}


blanker.check_el = function(el) {
	var blank = new blanker(el);
	var answer = "";

	switch(blank.type) {
		case "fill_blank":
			answer = el.querySelector(".fill_blank").innerHTML;
			break;
		case "multiple_choice":
			answer = el.querySelector(".multiple_choice").value;
			break;
		default:
			return false;
	}

	if (answer.length == 0) {
		el.setAttribute("data-empty", "");
	} else {
		el.removeAttribute("data-empty");
	}

	if (blank.check_answer(answer)) {
		el.setAttribute("data-confirm_token", confirm_token.generate());
		blanker_form.seek_update(el);
		return true;
	} else if (el.hasAttribute("data-confirm_token")) {
		var token = el.getAttribute("data-confirm_token");
		el.removeAttribute("data-confirm_token");
		confirm_token.destroy(token);
	}
	
	blanker_form.seek_update(el);
	return false;
}


//	A kind of manager object for a section of the document containing blanker objects
class blanker_form {
	constructor(raw) {
		this.raw = raw;
		
		//	create inner html
		var inner_html = '<div class="inner">' + raw + '</div>';
		var sections = section.get_sections_from_string("*", inner_html);
		for (var i = sections.length - 1; i >= 0; i--) {
			inner_html = sections[i].replace_into_string(inner_html);
		}	
		
		//	create header
		var header = '<div class="blanker" data-blanker_field_count="' + sections.length + '" ';
		header += ">";

		//	create toolbar
		var toolbar = 	'<div class="blanker_toolbar" ';
		toolbar +=			'onMouseOver="this.parentElement.setAttribute(' + "'data-toolbar_hover', ''" + ')" ';
		toolbar +=			'onMouseOut="this.parentElement.removeAttribute(' + "'data-toolbar_hover'" + ')"';
		toolbar +=		'>';
		toolbar +=			'<div class="filled_view">';
		toolbar +=				'<div class="filled_count">0</div> / ';
		toolbar += 				'<div class="filled_total">' + sections.length + '</div>';
		toolbar +=				'<div class="blanker_button button_ok" onMouseUp="blanker_form.check(this.parentElement.parentElement.parentElement)">Check!</div>';
		toolbar +=			'</div>';
		toolbar +=			'<div class="score_view">';
		toolbar +=				'<div class="score_count">0</div> / ';
		toolbar += 				'<div class="score_total">' + sections.length + '</div>';
		toolbar +=				'<div class="blanker_button button_retry" onMouseUp="blanker_form.reset(this.parentElement.parentElement.parentElement)">Retry?</div>';
		toolbar +=			'</div>';
		toolbar +=		'</div>';
		
		
		//	create html
		this.html = header + inner_html + toolbar + '</div>';
	}
}

blanker_form.reset = function(form_el) {
	form_el.querySelector("[data-score_mode]").removeAttribute("data-score_mode");
	form_el.querySelector("[data-blanker_count_complete]").removeAttribute("data-blanker_count_complete");
	
	var fill_blanks = form_el.querySelectorAll(".fill_blank");
	for (var i = 0; i < fill_blanks.length; i++) {
		fill_blanks[i].innerHTML = "";
		fill_blanks[i].parentElement.setAttribute("data-empty", "");
	}
	
	var multiple_choices = form_el.querySelectorAll(".multiple_choice");
	for (var i = 0; i < multiple_choices.length; i++) {
		multiple_choices[i].selectedIndex = 0;
		multiple_choices[i].parentElement.setAttribute("data-empty", "");
	}
	
	var blanks = form_el.querySelectorAll(".blank");
	for (var i = 0; i < blanks.length; i++) {
		blanks[i].removeAttribute("data-correct");
		blanks[i].removeAttribute("data-incorrect");
	}
}

blanker_form.seek_update = function(el) {
	var form_el;
	while ((form_el = el.querySelector(".blanker")) == null) {
		el = el.parentElement;
	}
	blanker_form.update_count(form_el);
}

blanker_form.check = function(form_el) {
	if (form_el.querySelector("[data-blanker_count_complete]") == null) return;
	form_el.querySelector(".blanker_toolbar").setAttribute("data-score_mode", "");
	
	var blanks = form_el.querySelectorAll(".blank");
	var score = 0;
	for (var i = 0; i < blanks.length; i++) {
		if (blanker.check_el(blanks[i])) {
			score++;
			blanks[i].setAttribute("data-correct", "");
		} else {
			blanks[i].setAttribute("data-incorrect", "");
		}
	}
	
	var score_el = form_el.querySelector(".score_count");
	score_el.innerHTML = score;
	
	var score_fraction = score / blanks.length;
	var color = "rgb(" + Math.floor(Math.sqrt((1 - score_fraction) * 65025 * 0.5)) + "," + Math.floor(Math.sqrt(score_fraction * 65025 * 0.5)) + "," + Math.floor(0) + ")";
	score_el.style.color = color;
}

blanker_form.update_count = function(form_el) {
	var blanks = form_el.querySelectorAll(".blank");
	var count = 0;
	for (var i = 0; i < blanks.length; i++) {
		if (!blanks[i].hasAttribute("data-empty")) count++;
	}
	var count_el = form_el.querySelector(".filled_count");
	count_el.innerHTML = count;
	var total_el = form_el.querySelector(".filled_total");
	if (count_el.innerHTML == total_el.innerHTML) {
		count_el.parentElement.setAttribute("data-blanker_count_complete", "");
	}
}


