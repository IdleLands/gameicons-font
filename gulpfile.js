
const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');

const gulp = require('gulp');
const unzip = require('gulp-unzip');
const filter = require('gulp-filter');
const rename = require('gulp-rename');
const download = require('gulp-download');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');

const ghPages = require('gulp-gh-pages');

const BASE_URL = 'http://game-icons.net/archives/svg/zip/000000/transparent/game-icons.net.svg.zip';
const FONT_NAME = 'game-icons';

const ONLY_ICONS = require('./.icon-map');

gulp.task('build:font', () => {
    const fileCounts = {};
    const includePaths = {};

    return download(BASE_URL)
        .pipe(unzip({
          filter: (entry) => minimatch(entry.path, '**/*.svg')
        }))
        .pipe(rename(filePath => {
          if(fileCounts[filePath.basename]) {
            fileCounts[filePath.basename] += 1;
            filePath.basename = `${filePath.basename}-${fileCounts[filePath.basename]}`;
          } else {
            fileCounts[filePath.basename] = 1;
          }

          if(ONLY_ICONS[filePath.basename]) {
            filePath.basename = ONLY_ICONS[filePath.basename];
            includePaths[`${filePath.dirname}/${filePath.basename}${filePath.extname}`] = true;
          }

          return filePath;
        }))
        .pipe(filter(filePath => {
          const pathData = path.parse(filePath.path);
          return includePaths[`${pathData.dir}/${pathData.base}`];
        }))
        .pipe(iconfontCss({
            fontName: FONT_NAME,
            formats: ['ttf', 'eot', 'woff'],
            targetPath: 'game-icons.css',
            cssClass: 'game-icon'
        }))
        .pipe(iconfont({
            fontName: FONT_NAME,
            normalize: true
        }))
        .on('glyphs', (glyphs) => {
            fs.writeFile('./test/data/glyphs.json', JSON.stringify(glyphs));
        })
        .pipe(gulp.dest('dist/'))
        .pipe(gulp.dest('test/css/'));
});

gulp.task('deploy', () => {
    return gulp.src('./test/**/*')
        .pipe(ghPages());
});
