var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var server = require('gulp-express');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(['./server/app.js', './server/routes/**/*.js'], ['run-server']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('run-server', function () {
    // Start the server at the beginning of the task 
    server.run({
        file: './server/app.js'
    });
    
    // Restart the server when file changes 
    //gulp.watch(['app/**/*.html'], server.notify);
    //gulp.watch(['app/styles/**/*.scss'], ['styles:scss']);
    //gulp.watch(['{.tmp,app}/styles/**/*.css'], ['styles:css', server.notify]); 
    //Event object won't pass down to gulp.watch's callback if there's more than one of them. 
    //So the correct way to use server.notify is as following: 
    //gulp.watch(['{.tmp,app}/styles/**/*.css'], function(event){
    //    gulp.run('styles:css');
    //    server.notify(event);
        //pipe support is added for server.notify since v0.1.5,  
        //see https://github.com/gimm/gulp-express#servernotifyevent 
    //});
    
    //gulp.watch(['app/scripts/**/*.js'], ['jshint']);
    //gulp.watch(['app/images/**/*'], server.notify);
});
