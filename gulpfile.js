var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpConcat = require('gulp-concat');
var tap = require('gulp-tap');
var runSequence = require('run-sequence');
var jscs = require('gulp-jscs');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');
var postcssImport = require('postcss-import');
var postcssCsscomb = require('postcss-csscomb');
var postcssCombOptions = require('./.csscomb.json');
var postcssColorFunction = require('postcss-color-function');
var postcssHexrgba = require('postcss-hexrgba');
var postcssConditionals = require('postcss-conditionals');
var postcssCustomProperties = require('postcss-custom-properties');
var browserify = require('browserify');
var stringify = require('stringify');
var buffer = require('gulp-buffer');

var postcssProcesses = [
  postcssImport,
  postcssCustomProperties(),
  postcssConditionals,
  postcssHexrgba(),
  postcssColorFunction(),
  autoprefixer({browsers: ['last 1 version']})
];
var assetDest = 'asset/';
var jsSitemaps = true;

gulp.task('default', buildProduction);
gulp.task('watch', watch);
gulp.task('min', min);
gulp.task('css', css);
gulp.task('cssMin', cssMin);
gulp.task('cssTidy', cssTidy);
gulp.task('js', js);
gulp.task('jsLib', jsLib);
gulp.task('jsMin', jsMin);
gulp.task('jsTidy', jsTidy);
gulp.task('mediaTidy', mediaTidy);
gulp.task('copy', copy);

function buildProduction() {
  jsSitemaps = false;
  runSequence(
    'mediaTidy',
    'copy',
    'cssTidy',
    'css',
    'cssMin',
    'jsTidy',
    'js',
    'jsMin'
  );
}

function min() {
  runSequence(
    'cssMin',
    'jsMin'
  );
}

function watch() {
  gulp.watch('css/**/*.css', ['css']);
  gulp.watch('js/**/*.js', ['js']);
}

function js() {
  return gulp.src('js/' + '**/*.bundle.js', {read: false})
    .pipe(tap(function(file) {
      file.contents = browserify(file.path, {debug: jsSitemaps})
        .transform(stringify, {
          global: true,
          appliesTo: {includeExtensions: ['.mst', '.mustache']},
          minify: true
        })
        .bundle();
      gutil.log('build ' + file.path);
    }))
    .pipe(buffer())
    .pipe(gulp.dest(assetDest));
};

function css() {
  return gulp.src('css/' + '**/*.bundle.css')
    .pipe(postcss(postcssProcesses))
    .pipe(tap(function(file) {
      gutil.log('build ' + file.path);
    }))
    .pipe(gulp.dest(assetDest));
};

function cssMin() {
  return gulp.src(assetDest + '**/*.css')
    .pipe(cssmin())
    .pipe(tap(function(file) {
      gutil.log('minify ' + file.path);
    }))
    .pipe(gulp.dest(assetDest));
}

function cssTidy() {
  return gulp.src('css/' + '**/*.css')
    .pipe(postcss([postcssCsscomb(postcssCombOptions)]))
    .pipe(tap(function(file) {
      gutil.log('tidy ' + file.path);
    }))
    .pipe(gulp.dest('css'));
}

function jsLib() {
  gulp.src([
      'node_modules/mustache/mustache.js'
    ])
    .pipe(tap(function(file) {
      gutil.log('concat ' + file.path);
    }))
    .pipe(gulpConcat('lib.js'))
    .pipe(gulp.dest(assetDest));
}

function jsMin() {
  return gulp.src(assetDest + '**.js')
    .pipe(uglify())
    .pipe(tap(function(file) {
      gutil.log('minify ' + file.path);
    }))
    .pipe(gulp.dest(assetDest));
}

function jsTidy() {
  return gulp.src(['js/' + '**/*.js'])
    .pipe(jscs({
      configPath: '.jsTidyGoogle.json',
      fix: true
    }))
    .pipe(gulp.dest('js'));
}

function mediaTidy() {
  return gulp.src('media/' + '**')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(assetDest));
}

function copy() {
  gulp.src('media/' + '**').pipe(gulp.dest(assetDest));
}
