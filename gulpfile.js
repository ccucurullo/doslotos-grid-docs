// ##################################################################
// SETUP
// ##################################################################

// Config
var config = require('./config.json');
var assets = require('./assets.json');
var packageJson = require('./package.json');

// Plugins
var gulp = require('gulp'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  pixrem = require('gulp-pixrem'),
  cssnano = require('gulp-cssnano'),
  uglify = require('gulp-uglify'),
  htmlmin = require('gulp-htmlmin'),
  concat = require('gulp-concat'),
  fileinclude = require('gulp-file-include'),
  usemin = require('gulp-usemin'),
  filter = require('gulp-filter'),
  imagemin = require('gulp-imagemin'),
  plumber = require('gulp-plumber'),
  runSequence = require('run-sequence'),
  clean = require('del'),
  flatten = require('gulp-flatten'),
  CacheBuster = require('gulp-cachebust'),
  cdnify = require('gulp-cdnify'),
  browserSync = require('browser-sync').create();

// CacheBuster
var cachebust = new CacheBuster();

// ##################################################################
// COMMON TASKS
// ##################################################################

// Browser sync server for live reload
gulp.task('browserSync', function() {
  browserSync.init({
    server: 'dist',
    host: config.host,
    reloadDelay: 250
  });
});

// Clean dist folder
gulp.task('clean', function() {
  return clean(['dist/**/*']);
});

// ##################################################################
// DEVELOPMENT TASKS
// ##################################################################

// Styles:Dev
gulp.task('styles:dev', function() {
  return gulp
    .src('src/styles/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(plumber())
    .pipe(autoprefixer({
      browsers: ['last 2 version']
    }))
    .pipe(pixrem())
    .pipe(concat('style.css'))
    .pipe(gulp.dest('dist/styles'))
    .pipe(browserSync.stream());
});

// Fonts:Dev
gulp.task('fonts:dev', function() {
  return gulp
    .src(assets.fonts)
    .pipe(flatten())
    .pipe(gulp.dest('dist/assets/fonts'))
    .pipe(browserSync.stream());
});

// Images:Dev
gulp.task('images:dev', function() {
  return gulp
    .src('src/assets/images/**/*')
    .pipe(gulp.dest('dist/assets/images'))
    .pipe(browserSync.stream());
});

// Html:Dev
gulp.task('html:dev', function() {
  return gulp
    .src(['src/**/*.html', '!src/includes/**/*.*', ])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
      context: {
        item: '',
        version: [packageJson.version]
      }
    }))
    .pipe(usemin({
      outputRelativePath: './',
      path: 'src',
      css: ['concat'],
      js: ['concat']
    }))
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream({
      once: true
    }));
});

// copy manifest
gulp.task('copy:manifest:dev', function() {
		return gulp
			.src('src/manifest.json')
			.pipe(gulp.dest('dist'));
});

// Default task
gulp.task('default', function() {
  runSequence('clean', [
    'fonts:dev', 'images:dev', 'html:dev', 'styles:dev', 'copy:manifest:dev'
  ], 'browserSync');
});

// Watch
gulp.task('watch', ['default'], function() {
  gulp.watch('src/styles/**/*.scss', ['styles:dev']);
  gulp.watch('src/assets/images/**/*', ['images:dev']);
  gulp.watch('src/assets/fonts/**/*', ['fonts:dev']);
  gulp.watch([
    'src/**/*.html', 'src/assets/js/**/*.js',
  ], ['html:dev']);
});

// ##################################################################
// BUILD TASKS
// ##################################################################

// Styles:Build
gulp.task('styles:build', function() {
  return gulp
    .src('src/styles/style.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(plumber())
    .pipe(autoprefixer({
      browsers: ['last 2 version']
    }))
    .pipe(pixrem())
    .pipe(concat('style.css'))
    .pipe(cssnano())
    .pipe(cachebust.resources())
    .pipe(cachebust.references())
    .pipe(gulp.dest('dist/styles'));
});

// Fonts:Build
gulp.task('fonts:build', function() {
  return gulp
    .src(assets.fonts)
    .pipe(flatten())
    .pipe(gulp.dest('dist/assets/fonts'));
});

// Images:Build
gulp.task('images:build', function() {
  return gulp
    .src('src/assets/images/**/*')
    .pipe(imagemin([
      imagemin.gifsicle({
        interlaced: true
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.optipng({
        optimizationLevel: 5
      }),
      imagemin.svgo({
        plugins: [{
          removeViewBox: true
        }]
      }),
    ]))
    .pipe(cachebust.resources())
    .pipe(gulp.dest('dist/assets/images'));
});

// copy htaccess
gulp.task('copy:htaccess', function() {
  return gulp
    .src('src/.htaccess')
    .pipe(gulp.dest('dist'));
});

// copy manifest
gulp.task('copy:manifest:build', function() {
		return gulp
			.src('src/manifest.json')
      .pipe(cachebust.references())
			.pipe(gulp.dest('dist'));
});

// Html:Build
gulp.task('html:build', function() {
  var filterJs = filter('**/*.js', {
    restore: true
  });
  var filterCss = filter('**/*.css', {
    restore: true
  });
  var filterHtml = filter('**/*.html', {
    restore: true
  });

  return gulp
    .src(['src/**/*.html', '!src/includes/**/*.*', ])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file',
      context: {
        item: '',
        version: [packageJson.version]
      }
    }))
    .pipe(usemin({
      outputRelativePath: './',
      path: 'src',
      css: [
        'concat', cssnano,
      ],
      js: ['concat', uglify, ]
    }))
    .pipe(filterJs)
    .pipe(cachebust.resources())
    .pipe(filterJs.restore)
    .pipe(filterCss)
    .pipe(cachebust.resources())
    .pipe(filterCss.restore)
    .pipe(cachebust.references())
    .pipe(filterHtml)
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
    }))
    .pipe(filterHtml.restore)
    .pipe(gulp.dest('dist'));
});

// cdnify
gulp.task('cdnify:build', function() {
		return gulp
			.src(['dist/**/*.{css,html}'])
      .pipe(cdnify({
        rewriter: function(url, process) {
          if (url.indexOf('data:') === 0 || url.indexOf('//') != -1 || url.indexOf('mailto') != -1 || url.indexOf('tel:') != -1 || url == '#') {
            return url;
          } else {
            if (url.charAt(0) === '/') {
              url = url.substr(1);
            }
            return '/doslotos-grid/' + url;
          }
        },
        html: {
          'a[href]': 'href',
          'link[rel=manifest]': 'href',
          'link[rel=icon]': 'href',
          'link[rel=apple-touch-icon]': 'href'
        }
      }))
			.pipe(gulp.dest('dist'));
});

// Build
gulp.task('build', function () {
	runSequence('clean', 'images:build', 'styles:build', ['fonts:build', 'copy:htaccess', 'copy:manifest:build', 'html:build',], 'cdnify:build');
});
