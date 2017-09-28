
function multiple_choice_wrapper(el, mode, width, height) {
	this.el = el;
	this.mode = mode || "editor";
	this._width = width || 800;
	this._height = height || 600;

	if (this.mode == "editor") {
		this.text_area = build("textarea", "multiple_choice_wrapper", this.el);
		this.editor = CKEDITOR.replace(this.text_area);
	} else {
		this.container = build("div", "multiple_choice_wrapper", this.el);
	}


	Object.defineProperty(this, "data", {
		'get' : function() {
			if (this.mode == "editor") {
				return this.editor.getData();
			} else {
				return this.container.innerHTML();
			}
		},
		'set' : function(v) {
			if (this.mode == "editor") {
				this.editor.setData(v);
			} else {
				this.blanker_form = new blanker_form(v);
				this.container.innerHTML = this.blanker_form.html;
			}
		}
	});

	this._sync_size = function(w, h) {
		this.el.style.with = this._width + "px";
		this.el.style.height = this._height + "px";
	};

	Object.defineProperty(this, "width", {
		'get' : function() {
			return this._width;
		},
		'set' : function(v) {
			this._width = v;
			this._sync_size();
		}
	}); 

	Object.defineProperty(this, "height", {
		'get' : function() {
			return this._height;
		},
		'set' : function(v) {
			this._height = v;
			this._sync_size();
		}
	});

	this.width = this.width;
}


