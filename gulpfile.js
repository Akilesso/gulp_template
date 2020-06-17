const {src, dest, parallel, series, watch} = require('gulp');
const babel = require("gulp-babel");
const browserSync = require('browser-sync');
const gulpIf = require('gulp-if');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const gcmq = require('gulp-group-css-media-queries');
const newer = require('gulp-newer');
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');

let isDev = process.argv.includes('--dev');
let isProd = !isDev;
let isSync = process.argv.includes('--sync');

let config = {
    src: './src/',
    build: './build',
    html: {
        src: '**/*.html',
        dest: '/'
    },
    img: {
        src: 'images/**/*',
        dest: '/images'
    },
    css: {
        src: 'css/imports.scss',
        watch: 'css/**/*.scss',
        dest: '/css'
    },
    js: {
        src: 'js/main.js',
        watch: 'js/**/*.js',
        dest: '/js'
    }
};
const cssLibs = [
    'node_modules/normalize.css/normalize.css',
    'src/css/libs.scss'
];
const jsLibs = [
    'node_modules/jquery/dist/jquery.min.js'
];

function html() {
    return src(config.src + config.html.src)
        .pipe(dest(config.build + config.html.dest))
        .pipe(gulpIf(isSync, browserSync.stream()));
}

function images() {
    return src(config.src + config.img.src)
        .pipe(gulpIf(isProd, imagemin()))
        .pipe(dest(config.build + config.img.dest))
        .pipe(browserSync.stream())
}

function styles() {
    return src(config.src + config.css.src)
        .pipe(gulpIf(isDev, sourcemaps.init()))
        .pipe(sass())
        .pipe(gcmq())
        .pipe(concat('main.min.css'))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true
        }))
        .pipe(gulpIf(isProd, cleancss({
            level: 2
        })))
        .pipe(gulpIf(isDev, sourcemaps.write()))
        .pipe(dest(config.build + config.css.dest))
        .pipe(browserSync.stream())
}

function stylesLibs() {
    return src(cssLibs)
        .pipe(sass())
        .pipe(concat('libs.min.css'))
        .pipe(gulpIf(isProd, cleancss({
            level: 2
        })))
        .pipe(dest(config.build + config.css.dest))
}

function scripts() {
    return src(config.src + config.js.src)
        .pipe(gulpIf(isDev, sourcemaps.init()))
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(uglify({
            toplevel: true
        }))
        .pipe(gulpIf(isDev, sourcemaps.write()))
        .pipe(dest(config.build + config.js.dest))
        .pipe(browserSync.stream())
}

function scriptsLibs() {
    return src(jsLibs)
        .pipe(concat('libs.min.js'))
        .pipe(uglify({
            toplevel: true
        }))
        .pipe(dest(config.build + config.js.dest))
}

function clear() {
    return del(config.build + '/*');
}

function startWatch() {
    if (isSync) {
        browserSync.init({
            server: {
                baseDir: config.build
            },
            // tunnel: true
        });
    }

    watch(config.src + config.html.src, html);
    watch(config.src + config.css.watch, styles);
    watch(config.src + config.js.src, scripts);
    watch(config.src + config.img.src, images);
}

exports.scriptsLibs = scriptsLibs;
exports.stylesLibs = stylesLibs;

exports.build = series(clear, html, styles, scripts, images, scriptsLibs, stylesLibs);
exports.watch = parallel(html, styles, scripts, images, scriptsLibs, stylesLibs, startWatch);
exports.libs = parallel(stylesLibs, scriptsLibs);