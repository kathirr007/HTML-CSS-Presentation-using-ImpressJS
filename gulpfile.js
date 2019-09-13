// Include gulp and plugins
const gulp = require('gulp');

const del = require('del');

// pkg = require('./package.json'),

const $ = require('gulp-load-plugins')({
    lazy: true
});

const browserSync = require('browser-sync').create();

const reload = browserSync.reload;

// file locations
let devBuild =
    (process.env.NODE_ENV || 'development').trim().toLowerCase() !==
    'production';

let source = './';

let dest = devBuild ? 'builds/development/' : 'builds/production/';

let html = {
    partials: [source + '_partials/**/*'],
    in: [source + '*.html'],
    watch: ['*.html', '_partials/**/*'],
    out: dest,
    context: {
        devBuild: devBuild
    }
};


let images = {
    in: [source + 'assets/images/**/*'],
    out: dest + 'images/'
};

let css = {
    in: [source + 'assets/sass/style.scss'],
    watch: ['assets/sass/**/*.scss'],
    out: dest + 'css/',
    pluginCSS: {
        in: [
            source + 'node_modules/bootstrap/scss/bootstrap.scss',
            source + 'node_modules/slick-carousel/slick/slick.css',
            source + 'node_modules/slick-carousel/slick/slick-theme.css',
            source + 'node_modules/simplebar/dist/simplebar.min.css',
        ],
        watch: ['css/**/*.css'],
        out: dest + 'css/'
    },
    sassOpts: {
        outputStyle: devBuild ? 'compressed' : 'compressed',
        imagePath: '../images',
        precision: 3,
        errLogToConsole: true
    }
};

let fonts = {
    in: source + 'fonts/**/*',
    out: dest + 'fonts/'
};

let js = {
    in: [
        // source + 'js/jquery-3.1.1.min.js',
        source + 'node_modules/jquery/dist/jquery.min.js',
        // source + 'js/bootstrap-history-tabs.js',
        // source + 'js/bootstrap-tabs-history.js',
        // source + 'js/jquery.stickytabs.js',
        source + 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
        source + 'node_modules/slick-carousel/slick/slick.min.js',
        source + 'node_modules/simplebar/dist/simplebar.min.js',
        source + 'assets/js/impress.js',
        source + 'assets/js/custom.js'
    ],
    out: dest + 'js/'
};

let jsLibs = {
    in: source + 'assets/jslib/**/*',
    watch: 'assets/jslib/**/*',
    out: dest + 'jslib/'
};

let syncOpts = {
    server: {
        baseDir: dest,
        index: 'index.html'
    },
    open: false,
    injectChanges: true,
    reloadDelay: 0,
    notify: true
};


// Clean tasks
gulp.task('clean', cb => {
    del([dest + '**/*'], cb());
});

gulp.task('clean-images', cb => {
    del([dest + 'images/**/*'], cb());
});

gulp.task('clean-html', () => {
    return del([dest + '**/*.html']);
});

gulp.task('clean-css', cb => {
    del([dest + 'css/**/*'], cb());
});

gulp.task('clean-js', cb => {
    del([dest + 'js/**/*'], cb());
});

gulp.task('clean-jslib', cb => {
    del([dest + 'jslib/**/*'], cb());
});

// reload task
gulp.task('reload', done => {
    browserSync.reload();
    done();
});

// build HTML files
gulp.task('html', () => {
    var page = gulp
        .src(html.in)
        .pipe($.newer(html.out))
        .pipe($.preprocess({
            context: html.context
        }));
    /*.pipe($.replace(/.\jpg|\.png|\.tiff/g, '.webp'))*/
    if (!devBuild) {
        page = page
            .pipe($.size({
                title: 'HTML in'
            }))
            .pipe($.htmlclean())
            .pipe($.size({
                title: 'HTML out'
            }));
    }
    return (
        page.pipe(gulp.dest(html.out))
    );
});

// manage images
gulp.task('images', () => {
    var imageFilter2 = $.filter(['**/*.+(jpg|png|tiff|webp)'], {
        restore: true
    });
    return (
        gulp
        .src(images.in)
        .pipe($.size({
            title: 'images in '
        }))
        .pipe($.newer(images.out))
        .pipe($.plumber())
        .pipe($.image({
            jpegRecompress: ['--strip', '--quality', 'medium', '--loops', 10, '--min', 40, '--max', 80],
            mozjpeg: ['-quality', 50, '-optimize', '-progressive'],
            // guetzli: ['--quality', 84],
            quiet: true
        }))
        // .pipe($.image({
        //     jpegRecompress: ['--strip', '--quality', 'medium', '--loops', 10, '--min', 40, '--max', 80],
        //     mozjpeg: ['-quality', 50, '-optimize', '-progressive'],
        //     // guetzli: ['--quality', 84],
        //     quiet: true
        // }))
        // .pipe($.imagemin())
        .pipe($.size({
            title: 'images out '
        }))
        .pipe(gulp.dest(images.out))
    );
});

// copy fonts
gulp.task('fonts', () => {
    return gulp
        .src(fonts.in)
        .pipe($.newer(dest + 'fonts/'))
        .pipe(gulp.dest(dest + 'fonts/'));
});

// plugin css compilation
gulp.task(
    'css',
    gulp.series('fonts', () => {
        var cssFilter = $.filter(['**/*.css'], {
                restore: true
            }),
            imageFilter = $.filter(['**/*.+(jpg|png|gif|svg)'], {
                restore: true
            }),
            imageFilter2 = $.filter(['**/*.+(jpg|png|tiff|webp)'], {
                restore: true
            });
        return (
            gulp
            .src(css.pluginCSS.in, {allowEmpty: true})
            .pipe($.size({
                title: 'CSS in '
            }))
            .pipe($.newer(dest + 'css/'))
            // .pipe(cssFilter)
            .pipe(
                $.rename(function (path) {
                    path.extname = '.scss';
                })
            )
            .pipe($.sourcemaps.init())
            .pipe($.plumber())
            .pipe($.sass(css.sassOpts))
            .pipe($.cssnano({zindex: false}))
            .pipe($.csso())
            .pipe($.cleanCss({level: {2: {all: true}}}))
            .pipe(
                $.order([
                    'bootstrap.css',
                    'bootstrap-select.min.css',
                    'slick.css',
                    'slick-theme.css',
                    'simplebar.min.css'
                ])
            )
            /* .pipe($.concatCss('lbd-bundle.css', {
                rebaseUrls: false
            })) */
            .pipe($.groupConcat({
                'plugins-bundle.css': '**/*.css'
            }))
            .pipe($.sourcemaps.write('./maps'))
            // .pipe(cssFilter.restore)
            .pipe($.size({
                title: 'CSS out '
            }))
            .pipe(gulp.dest(dest + 'css/'))
            .pipe(browserSync.stream({
                match: '**/*.css'
            }))
        );
    })
);

// sass compilation
gulp.task('sass', function(){
    return gulp.src(css.in, {allowEmpty : true})
    .pipe($.size({
        title: 'SCSS in '
    }))
    .pipe($.sourcemaps.init())
    .pipe($.plumber())
    .pipe($.sass(css.sassOpts))
    .pipe($.autoprefixer({
        // browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe($.cssnano({zindex: false}))
    .pipe($.csso())
    .pipe($.cleanCss({level: {2: {all: true}}}))
    .pipe($.size({
        title: 'SCSS out '
    }))
    .pipe($.sourcemaps.write('./maps'))
	.pipe(gulp.dest(css.out))
    .pipe(browserSync.stream({
        match: '**/*.css'
    }));
});

// js tasks
gulp.task('js', () => {
    var jsFilter = $.filter(['**/*.js', '!**/*custom.js'], {
        restore: true
    });
    if (devBuild) {
        return (
            gulp
            .src(js.in)
            .pipe($.size({
                title: 'JS in '
            }))
            .pipe($.newer(dest + 'js/'))
            .pipe(jsFilter)
            .pipe($.babel({
                presets: [
                  ['@babel/env', {
                    modules: false
                  }]
                ]
              }))
            .pipe($.sourcemaps.init())
            .pipe($.uglify())
            .pipe(
                $.order([
                    'jquery.min.js',
                    'bootstrap.bundle.min.js',
                    'slick.min.js',
                    'simplebar.min.js',
                    'jquery.bootstrap.wizard.js',
                    // 'bootstrap-history-tabs.js',
                    // 'bootstrap-tabs-history.js',
                    // 'jquery.stickytabs.js',
                    // "assets/js/custom.js"
                ])
            )
            .pipe($.groupConcat({
                'js-bundle.js': '**/*.js'
            }))
            .pipe($.sourcemaps.write('./maps'))
            .pipe(jsFilter.restore)
            .pipe($.size({
                title: 'JS out '
            }))
            .pipe(gulp.dest(dest + 'js/'))
        );
    }
});

gulp.task('jslib', function () {
    var toExclude = ['assets/lib-live/tinymce_4.2.5/**/*'],
        htmlFilter = $.filter(['**/*.html', '**/*.md'], {
            restore: true
        }),
        includeIgnoredJs = $.filter(toExclude[0] + '.js', {
            restore: true
        }),
        includeIgnoredCss = $.filter(toExclude[0] + '.css', {
            restore: true
        }),
        cssFilter = $.filter(['**/*.css'], {
            restore: true
        }),
        imageFilter = $.filter(['**/*.+(jpg|png|gif|svg)'], {
            restore: true
        }),
        imageFilter2 = $.filter(['**/*.+(jpg|png|tiff|webp)'], {
            restore: true
        }),
        jsonFilter = $.filter(['**/*.json'], {
            restore: true
        }),
        jsFilter = $.filter(['**/*.js'], {
            restore: true
        });

    if (devBuild) {
        return (
            gulp
            .src(jsLibs.in)
            .pipe($.size({
                title: 'jsLibs in '
            }))
            .pipe($.newer(jsLibs.out))
            .pipe(jsFilter)
            .pipe($.uglify())
            .on('error', function (err) {
                $.util.log($.util.colors.red('[Error]'), err.toString());
            })
            .pipe(jsFilter.restore)
            .pipe(cssFilter)
            .pipe(
                $.rename(function (path) {
                    path.extname = '.scss';
                })
            )
            .pipe($.plumber())
            .pipe($.sass(css.sassOpts))
            .pipe($.cssnano({zindex: false}))
            .pipe($.csso())
            .pipe($.cleanCss({level: {2: {all: true}}}))
            .pipe(cssFilter.restore)
            .pipe(htmlFilter)
            .pipe($.htmlclean())
            .pipe(htmlFilter.restore)
            .pipe(imageFilter)
            .pipe($.image({
                jpegRecompress: ['--strip', '--quality', 'medium', '--min', 40, '--max', 80],
                gifsicle: ['--optimize'],
                quiet: true
            }))
            .pipe(imageFilter.restore)
            .pipe($.size({
                title: 'jsLibs out '
            }))
            .pipe(gulp.dest(jsLibs.out))
        );
    }
});

// browser sync
gulp.task('serve', () => {

    browserSync.init({
        server: {
            baseDir: dest,
            index: 'index.html'
        },
        // files: [dest + 'assets/css/light-bootstrap-dashboard.css', dest + 'assets/js/custom.js'],
        open: false,
        // port: 3000,
        injectChanges: true,
        notify: true
    });

});

gulp.task(
    'watch',
    gulp.parallel('serve', () => {
        // html changes
        gulp.watch(html.watch, gulp.series('html', 'reload'));
        // image changes
        gulp.watch(images.in, gulp.series('images'));

        // font changes
        gulp.watch(fonts.in, gulp.series('fonts'));

        // sass changes
        gulp.watch(css.watch, gulp.series('sass'));

        // pluginCSS changes
        gulp.watch([...css.pluginCSS.in, source + 'node_modules/bootstrap/scss/**/*.scss'], gulp.series('css'));

        // javascript changes
        gulp.watch(js.in, gulp.series('js', 'reload'));

        // javascript libraries changes
        gulp.watch(jsLibs.in, gulp.series('jslib', 'reload'));
        // gulp.watch(jsLibs.in, [ reload]);

    })
);

// default task
gulp.task(
    'default',
    gulp.parallel(
        'html', 'css', 'sass', 'images', 'js', 'jslib',
        gulp.series('watch')
    )
);
