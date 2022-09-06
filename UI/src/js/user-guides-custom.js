jQuery(function ($) {
  'use strict';
  /*---LEFT BAR ACCORDION----*/
  $(function () {
    //   $('#nav-accordion').dcAccordion({
    //       eventType: 'click',
    //       autoClose: true,
    //       saveState: true,
    //       disableLink: true,
    //       speed: 'slow',
    //       showCount: false,
    //       autoExpand: true,
    // //        cookie: 'dcjq-accordion-1',
    //       // classExpand: 'dcjq-current-parent'
    //   });
  });

  var Script = function () {
    //    sidebar dropdown menu auto scrolling
    // jQuery('#sidebar .sub-menu > a').on('click', function () {
    //   var o = ($(this).offset());
    //   let diff = 250 - o.top;
    //   if (diff > 0)
    //     $("#sidebar").scrollTo("-=" + Math.abs(diff), 500);
    //   else
    //     $("#sidebar").scrollTo("+=" + Math.abs(diff), 500);
    // });
    // custom scrollbar
    // $("#sidebar").niceScroll({ styler: "fb", cursorcolor: "#e8403f", cursorwidth: '3', cursorborderradius: '10px', background: '#404040', spacebarenabled: false, cursorborder: '', scrollspeed: 60 });
  }();

  $(document).on("click", "#back-to-top", function (e) {
    $("html, body").animate({
      scrollTop: 0
    }, 'slow');
    return false;
  });
});

