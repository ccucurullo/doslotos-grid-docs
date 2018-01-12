// ##################################################################
// SETUP
// ##################################################################

// Config
var config = require('./config.json');
var assets = require('./assets.json');

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
	browserSync = require('browser-sync').create();

// CacheBuster
var cachebust = new CacheBuster();

// ##################################################################
// COMMON TASKS
// ##################################################################

// Browser sync server for live reload
gulp.task('browserSync', function () {
	browserSync.init({server: 'dist', host: config.host, reloadDelay: 250});
});

// Clean dist folder
gulp.task('clean', function () {
	return clean(['dist/**/*']);
});

// copy manifest
gulp.task('copy:manifest', function() {
		return gulp
			.src('src/manifest.json')
			.pipe(gulp.dest('dist'));
});

// ##################################################################
// DEVELOPMENT TASKS
// ##################################################################

// Styles:Dev
gulp.task('styles:dev', function () {
	return gulp
		.src('src/styles/style.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(plumber())
		.pipe(autoprefixer({browsers: ['last 2 version']}))
		.pipe(pixrem())
		.pipe(concat('style.css'))
		.pipe(gulp.dest('dist/styles'))
		.pipe(browserSync.stream());
});

// Fonts:Dev
gulp.task('fonts:dev', function () {
	return gulp
		.src(assets.fonts)
		.pipe(flatten())
		.pipe(gulp.dest('dist/assets/fonts'))
		.pipe(browserSync.stream());
});

// Images:Dev
gulp.task('images:dev', function () {
	return gulp
		.src('src/assets/images/**/*')
		.pipe(gulp.dest('dist/assets/images'))
		.pipe(browserSync.stream());
});

// Html:Dev
gulp.task('html:dev', function () {
	return gulp
		.src(['src/**/*.html', '!src/includes/**/*.*',])
		.pipe(fileinclude({prefix: '@@', basepath: '@file',}))
		.pipe(usemin({outputRelativePath: './', path: 'src', css: ['concat'], js: ['concat']}))
		.pipe(gulp.dest('dist'))
		.pipe(browserSync.stream({once: true}));
});

// Default task
gulp.task('default', function () {
	runSequence('clean', [
		'fonts:dev', 'images:dev', 'html:dev', 'styles:dev', 'copy:manifest'
	], 'browserSync');
});

// Watch
gulp.task('watch', ['default'], function () {
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
gulp.task('styles:build', function () {
	return gulp
		.src('src/styles/style.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(plumber())
		.pipe(autoprefixer({browsers: ['last 2 version']}))
		.pipe(pixrem())
		.pipe(concat('style.css'))
		.pipe(cssnano())
		.pipe(cachebust.resources())
		.pipe(gulp.dest('dist/styles'));
});

// Fonts:Build
gulp.task('fonts:build', function () {
	return gulp
		.src(assets.fonts)
		.pipe(flatten())
		.pipe(gulp.dest('dist/assets/fonts'));
});

// Images:Build
gulp.task('images:build', function () {
	return gulp
		.src('src/assets/images/**/*')
		.pipe(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 5}),
			imagemin.svgo({
				plugins: [
					{
						removeViewBox: true
					}
				]
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

// Html:Build
gulp.task('html:build', [
	'styles:build', 'images:build', 'fonts:build', 'copy:htaccess', 'copy:manifest'
], function () {
	var filterJs = filter('**/*.js', {restore: true});
	var filterCss = filter('**/*.css', {restore: true});
	var filterHtml = filter('**/*.html', {restore: true});

	return gulp
		.src(['src/**/*.html', '!src/includes/**/*.*',])
		.pipe(fileinclude({prefix: '@@', basepath: '@file',}))
		.pipe(usemin({
			outputRelativePath: './',
			path: 'src',
			css: [
				'concat', cssnano,
			],
			js: ['concat', uglify,]
		}))
		.pipe(filterJs)
		.pipe(cachebust.resources())
		.pipe(filterJs.restore)
		.pipe(filterCss)
		.pipe(cachebust.resources())
		.pipe(filterCss.restore)
		.pipe(cachebust.references())
		.pipe(filterHtml)
		.pipe(htmlmin({removeComments: true, collapseWhitespace: true,}))
		.pipe(filterHtml.restore)
		.pipe(gulp.dest('dist'));
});

// Build
gulp.task('build', function () {
	runSequence('clean', ['html:build',]);
});
