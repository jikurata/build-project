# build-project v0.0.7
Search source paths for files and build them
---
## Install
---
```
npm install @jikurata/build-project
```
## Usage
---
Add build handlers to process each file in the queue
```
const ProjectBuilder = require('@jikurata/build-project');
const fs = require('fs');

const builder = new ProjectBuilder();

builder.use((file, next) => {
    // Only process html files
    if ( file.ext !== '.html' && file.ext !== '.htm' ) {
        return next();
    }
    fs.copyFileSync(file.path, `/build/to/some/location/${file.name}${file.ext}`);
    next();
});
```
Asynchronous building is supported as well:
```
const browserify = require('browserify');

builder.use((file, next) => {
    // Only process js files
    if ( file.ext !== '.js' ) {
        return next();
    }
    return new Promise((resolve, reject) => {
        let b = browserify(curr.path);
        b.bundle((err, buffer) => {
            if ( err ) {
                return reject(err);
            }
            fs.writeFile(buffer, `/build/to/some/location/${file.name}${file.ext}`, () => {
                resolve();
            });
        });
    });
});
```
## Documentation
---
### **class** ProjectBuilder ###
#### Events ####
- build-start: Emitted when an instance's "build()" method is called. Signals the start of the build process for the provided source paths.
- build-complete: Emitted when the "build()" method's promise is resolved. Signals that the build process for the provided source paths is done.
- search-start: Emitted when an instance begins a deep search through the provided source paths.
- search-complete: Emitted when the deep search is complete. Passes an array containing all discovered filepaths.
    - *queue* {Array:String} An array of filepath strings
- file-start: Emitted when processing of an individual file begins. Passes a *FileInfo* object.
    - *file* {FileInfo}
- file-complete: Emitted when all relevant build handlers have processed the filepath. Passes a *FileInfo* object.
    - *file* {FileInfo}
#### Methods ####
##### ProjectBuilder.build(sources) ######
###### Arguments ######
- sources {String|Array:String}: filepath sources for ProjectBuilder to search through.
###### Returns ######
- Returns a Promise that resolves with a Build object, or rejects with an Error.
###### Description ######
- ProjectBuilder will attempt to process every single discovered file in sources using its build handlers. When it starts, it emits a '*build-start*' event and when it resolves, it emits a '*build-complete*' event.
##### ProjectBuilder.use(handler) ######
###### Arguments ######
- handler {Function}: A function that takes two arguments
    - *file*: {FileInfo}
    - *next*: {Callback} Instructs the build process to proceed to the next handler operation for the current file. **If next() is not explicitly called in the handler function, ProjectBuilder will not pass FileInfo to the subsequent handlers.**

### **Object** FileInfo ###
#### Properties ####
- base {String} Filename with extension
- dir {String} directory containing the file
- ext {String} extension, includes "."
- name {String} Filename without extension
- path {String} Full filepath of the file
- root {String} Root path of the file

## Version Log
---
**v0.0.7**
- Overhauled entire project
- ProjectBuilder.build() no longer resolves prematurely
- Refactored the FileInfo object passed to each handler
- The build process will now only proceed to the next handler if the previous handler calls "next()"
- Removed all print calls. Any information that was printed before is now passed to its respective event instead
- Removed build root and src paths as argument dependencies for creating new ProjectBuilder instances
- Sources for a build are passed as an argument in the ProjectBuilder.build() method now
- Removed build root and relevant functionality revolving around build root to increase flexibility
    - Handlers themselves should explicitly name the build location when building a file
- TODO: Expand on the current implementation of the Build object to contain more useful information about the build results.

**v0.0.6**
- filepaths are resolved at the validation phase

**v0.0.5**
- Refactor console logging to only print results instead of individual files

**v0.0.4**
- Builder now resolves \ to / when constructing build paths
- Refactor Jest tests to Taste tests

**v0.0.3**
- Fixed readme typos

**v0.0.2**
- Add fs-extra as a dependency

**v0.0.1**
- Fixed a bug that prevented ProjectBuilder from removing subdirectories.
- Passing a falsy value to the middleware next() callback will terminate the middleware execution chain for the current path object.
