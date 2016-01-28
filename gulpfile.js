var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var eventStream = require('event-stream');
var glob = require('glob');

gulp.task('js', function(done) {
  glob('**.bundle.js', function(err, files) {
    if (err) {
      done(err);
    };
    var tasks = files.map(function(entry) {
      return browserify({
        entries: [entry],
        paths: []
      })
      .bundle()
      .pipe(source(entry.replace('js/', '').replace('.bundle', '')))
      .pipe(gulp.dest('asset'));
    });

    // create a merged stream
    eventStream.merge(tasks).on('end', done);
  });
});
