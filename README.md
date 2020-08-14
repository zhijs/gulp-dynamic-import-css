### Installation
Install package with NPM and add it to your development dependencies:
```bash
npm install --save-dev gulp-dynamic-import-css
```

### Information
<table>
<tr>
<td>Package</td><td>gulp-dynamic-import-css</td>
</tr>
<tr>
<td>Description</td>
<td>help you auto import css extra components css when you import component</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.11.13</td>
</tr>
</table>

### Usage
```javascript
// src/page1.js
import dialog from 'ui-components/dialog' // just import js module

// src/page2.js
import button from './myComponents/button'


// gulpfile.js
const importCssPlugin = require('gulp-dynamic-import-css')
var concat = require('gulp-concat')
gulp.task('import-css', function() {
  return gulp.src('./src/*.js')
    .pipe(importCssPlugin({
      /**
       * 
       * @description getComponent CSS path, plugin will traverse src javascript file and  imported file in Javascript, and call this function
       * @param { String} relativePath  modulle relative path
       * @return {boolean | String } false - plugin will not try fetch CSS
       *         String - eg: '/node_modules/componentA/index.css' plugin will read local css file
                 String - eg: http://example/componentA/index.css plugin will try to fetch remote CSS
       * */ 
      generatorCssPath: (relativePath) => {
        if (/ui-components/.test(relativePath) || /myComponents/.test(relativePath)) {
          return `${relativePath}/index.css` // node_module/ui-components/dialog/index.css、 src/myComponents/button/index.css should be exit 
        }
      },
      /**
       * include(RegExp) - if set this property, css file relativePath should be match this RegExp
      */
      // include: /node_modules/
    }))
    .pip(concat('vendor.css')) // vendor.css will contain node_modules/dialog/index.css、src/myComponents/button/css
    .pipe(gulp.dest('./dist/')); // now you can push css to cdn or inline you html template

});
```
