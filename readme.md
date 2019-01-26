# build-project v0.0.0
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

// Adds browserify as middleware
builder.use((curr, next) => {
    if ( curr.filetype !== 'js' ) return next();
    let b = browserify(curr.path);
    b.bundle((err, buffer) => {
        if ( err ) return console.error(err);
        fs.writeFileSync(buffer, curr.dest);
    });
});

// Executes the build process, returns a Promise
builder.build();
```
Deconstructing a middleware operation
```
const middleware = (curr, next) => {
    // Do things
};
```
- **curr**: is an object containing basic information about the current file being processed.
    - Properties:
        - *path*: Contains the full root-relative path of the current file
        - *name*: Contains the file's base name
        - *type*: Contains the file's extension
        - *isFile*: *Boolean*, if the path property resolves to a file
- **next**: is a callback function to command the executor to proceed to the next middleware operation in the chain. By default, if an operator reaches the end of its code block, it will proceed to the next operation.

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
