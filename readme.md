# build-project v0.0.3
Use your preferred build tools to build your project
---
## Install
```
npm install @jikurata/build-project
```
## Usage
Add your build tools as middleware
```
const ProjectBuilder = require('@jikurata/build-project');
const fs = require('fs');
const browserify = require('browserify');

const builder = new ProjectBuilder('dist', 'src');

builder.use((curr, next) => {
    if ( curr.type !== 'html' ) return next();
    // Ensure build path exists
    const dir = curr.dest.replace(`${curr.name}.${curr.type}`, '');
    if ( !ProjectBuilder.pathExists(dir) ) fs.mkdirSync(dir);
    fs.copyFileSync(curr.path, curr.dest);
});

// Adds browserify as middleware
builder.use((curr, next) => {
    if ( curr.type !== 'js' ) return next();
    return new Promise((resolve, reject) => {
        let b = browserify(curr.path);
        b.bundle((err, buffer) => {
            if ( err ) return console.error(err);
            fs.writeFileSync(buffer, curr.dest);
            resolve();
        });
    });
});

// Executes the build process, returns a Promise
builder.build();
```
**Constructor**
```
    /**
      * dest - The root directory for the build
      * src - A single path, or an array of paths for ProjectBuilder to search before building
      * @param {String} dest
      * @param {String|String[]} src
    new ProjectBuilder(dest, src);
```
**Deconstructing a middleware operation**
```
const middleware = (curr, next) => {
    // Do things
};
```
- **curr**: is an object containing basic information about the current file being processed.
    - Properties:
        - *path*: Contains the full root-relative path of the current file
        - *dest*: Contains the build path
        - *name*: Contains the file's base name
        - *type*: Contains the file's extension
        - *isFile*: *Boolean*, if the path property resolves to a file
- **next**: is a callback function to command the executor to proceed to the next middleware operation in the chain. By default, if an operator reaches the end of its code block, it will proceed to the next operation. Furthermore, passing a falsy value as an argument to next() will terminate middleware execution for the current path object.

**Dealing with asynchronous middleware**
It is recommended to return a Promise from your middleware to keep ProjectBuilder's execution synchronous, not doing so will disrupt the flow of console logging, not much else.

## Example
Project structure:
- src/index.html
- src/asset/scss/style.scss
- src/asset/script/main.js
```
const ProjectBuilder = require('@jikurata/build-project');
const fs = require('fs');

// Build tools
const browserify = require('browserify');
const sass = require('node-sass');

const builder = new ProjectBuilder('dist', 'src');

// Define middleware operation for html files
builder.use((curr, next) => {
    if ( curr.type !== 'html' ) return next();

    fs.copyFileSync(curr.path, curr.dest);
});

// Define middleware operation for js files
builder.use((curr, next) => {
    if ( curr.type !== 'js' ) return next();

    // Correct build path destination
    curr.dest.replace(curr.name, `${curr.name}.bundle`);

    let b = browserify(curr.path);
    b.bundle((err, buffer) => {
        if ( err ) return console.error(err);
        fs.writeFileSync(buffer, curr.dest);
    });
})

// Define middleware operation for scss files
builder.use((curr, next) => {
    if ( curr.type !== 'scss' ) return next();
    
    // Correct the build path destination
    curr.dest.replace('scss', 'css');

    const content = sass.renderSync({
        file: curr.path,
        sourceMap: false,
        outputStyle: 'compressed'
    });
    fs.writeFileSync(content.css, curr.dest);
});

builder.build();

// Resulting build:
- dist/index.html
- dist/asset/css/style.css
- dist/asset/script/main.bundle.js
```
## Version Log
---
**v0.0.3**
- Fixed readme typos<br>
**v0.0.2**
- Add fs-extra as a dependencyl<br>
**v0.0.1**
- Fixed a bug that prevented ProjectBuilder from removing subdirectories.
- Passing a falsy value to the middleware next() callback will terminate the middleware execution chain for the current path object.
