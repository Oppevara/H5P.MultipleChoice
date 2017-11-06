var H5P = H5P || {};

H5P.MultipleChoiceDropDown = (function ($) {
  function C(options, id) {
    this.$ = $(this);
    this.options = $.extend(true, {}, {}, options);
    this.id = id;
    this.multiple_choice = undefined;
    this.data = h5p_get_data_obj(this.options.data);
  };
 
  C.prototype.attach = function ($container) {
    var el = build("div", "multiple_choice_wrapper");
    $container.append(el);
    var el_applet_container = build("div", undefined, el);
    el_applet_container.id = random_string();


    this.multiple_choice = new multiple_choice_wrapper(el_applet_container, "viewer");
    try {
      this.multiple_choice.data = this.data.data;
    } catch(ex) {}
    
  };
 
  return C;
})(H5P.jQuery);