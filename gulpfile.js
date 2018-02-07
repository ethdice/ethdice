var gulp = require("gulp"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    minifycss = require("gulp-minify-css"),
    rename = require("gulp-rename"),
    clean = require("gulp-clean");

var deployPath_dev = "";
var deployPath = deployPath_dev;




// 处理公共库
// ------------------------------------------------------------
gulp.task("minify-js-index", function() {
    return gulp.src([
            "js/jquery.min.js",
            "js/web3.min.js",
            "js/truffle-contract.js",
            "js/app.js",
            "js/script.js"
        ])
        .pipe(concat("script.js"))
        .pipe(uglify())
        .pipe(rename("script.min.js"))
        .pipe(gulp.dest(deployPath+'js'));
});
gulp.task("minify-css-index", function() {
    return gulp.src([
            "css/style.css"
        ])
        .pipe(concat("style.min.css"))
        .pipe(minifycss())
        .pipe(gulp.dest(deployPath+'css'));
});


gulp.task("minify-index", ["minify-js-index", "minify-css-index"]);

// 注册任务
gulp.task("default", ["minify-index", "watch"]);



// 监视文件的变化
// ------------------------------------------------------------
gulp.task("watch", function() {
    gulp.watch([
        "js/zepto.min.js",
        "js/script.js",
        "css/style.css"
    ], ["minify-index"]);
});
