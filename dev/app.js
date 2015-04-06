document.querySelector('#mobile-nav').addEventListener('click', function(){
    var regex = /(^|\s)+open(\s|$)+/;

    this.className = (regex.test(this.className)) ? this.className.replace(regex, '') : this.className + ' open';
});