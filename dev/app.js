(function(){
    (function(){
        var path = window.location.pathname,
            activeLinks = null;


        if(path === '/') {
            activeLinks = document.querySelectorAll('.nav-about');
        }
        else if(path !== '/where-am-i'){
            activeLinks = document.querySelectorAll('.nav-blog');
        }

        for(var i = 0, len = activeLinks.length; i < len; i++) {
            activeLinks[i].classList.toggle('active');
        }
    })();

    (function attachNavClick(){
        document.querySelector('#mobile-nav .navicon').addEventListener('click', function(){

            this.parentNode.classList.toggle('open');
        });
    })();

    jQuery(document).ready(function(){
        jQuery('.toggle').on('click', 'a', function(e){
            jQuery(e.target).parent().toggleClass('open closed');

            e.preventDefault();
        });

        jQuery('.tree-container').on('click', 'a', function(e){
            var target = jQuery(e.target || e.srcElement),
                categoryChildren = target.parent().next();

            if(categoryChildren.children().length > 0){
                categoryChildren.toggleClass("hide");
            }

            e.preventDefault();
        });
    });
})();
